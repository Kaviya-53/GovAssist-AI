import json
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
import models

def parse_json_list(value: Any) -> List[str]:
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        data = json.loads(value)
        return data if isinstance(data, list) else [str(data)]
    except Exception:
        return [str(value)]

def evaluate_citizen_eligibility(
    profile: models.CitizenProfile,
    scheme: models.Scheme,
    user_documents: List[models.Document]
) -> Dict[str, Any]:
    """
    Explainable Rule-Based Eligibility Engine.
    Evaluates citizen profile + documents against scheme criteria.
    Returns:
      - status: 'Eligible' | 'Maybe Eligible' | 'Not Eligible'
      - score: percentage 0.0 to 100.0
      - matched_criteria: list of satisfied conditions
      - failed_criteria: list of violated conditions
      - missing_info: missing profile fields or unverified items
      - recommended_docs: missing required documents
    """
    criteria: models.SchemeCriteria = scheme.criteria
    if not criteria:
        # If no strict criteria defined, general scheme
        return {
            "status": "Eligible",
            "score": 95.0,
            "matched_criteria": ["Open to all Indian citizens with general eligibility criteria"],
            "failed_criteria": [],
            "missing_info": [],
            "recommended_docs": parse_json_list(scheme.required_documents)
        }

    matched: List[str] = []
    failed: List[str] = []
    missing: List[str] = []
    
    total_checks = 0
    passed_checks = 0
    is_hard_disqualified = False

    # 1. Age Evaluation
    if criteria.min_age is not None or criteria.max_age is not None:
        total_checks += 1
        min_a = criteria.min_age or 0
        max_a = criteria.max_age or 150
        if profile.age is not None and profile.age > 0:
            if min_a <= profile.age <= max_a:
                matched.append(f"Age {profile.age} is within the required range ({min_a} - {max_a} years)")
                passed_checks += 1
            else:
                failed.append(f"Age {profile.age} is outside the required age window of {min_a} to {max_a} years")
                is_hard_disqualified = True
        else:
            missing.append(f"Age is missing in profile (Scheme requires {min_a}-{max_a} years)")

    # 2. Gender Evaluation
    if criteria.gender and criteria.gender.strip().lower() not in ["all", "any", ""]:
        total_checks += 1
        req_gender = criteria.gender.strip().lower()
        cit_gender = (profile.gender or "").strip().lower()
        if cit_gender == req_gender:
            matched.append(f"Gender requirement met: Scheme is designed for {criteria.gender} applicants")
            passed_checks += 1
        else:
            failed.append(f"Gender mismatch: Scheme is exclusively for {criteria.gender} citizens")
            is_hard_disqualified = True

    # 3. Income Evaluation
    if criteria.max_income is not None and criteria.max_income > 0:
        total_checks += 1
        # Check if user has uploaded verified income document
        effective_income = profile.annual_income or 0.0
        for doc in user_documents:
            if "income" in doc.doc_type.lower() and doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    if data.get("annual_income"):
                        effective_income = float(data["annual_income"])
                except Exception:
                    pass

        if effective_income <= criteria.max_income:
            matched.append(f"Annual income ₹{effective_income:,.0f} is within the ceiling of ₹{criteria.max_income:,.0f}")
            passed_checks += 1
        else:
            failed.append(f"Annual income ₹{effective_income:,.0f} exceeds maximum ceiling of ₹{criteria.max_income:,.0f}")
            is_hard_disqualified = True

    # 4. Social Category Evaluation
    allowed_cats = [c.upper() for c in parse_json_list(criteria.allowed_categories)]
    if allowed_cats and "ALL" not in allowed_cats:
        total_checks += 1
        user_cat = (profile.category or "GEN").upper()
        if user_cat in allowed_cats:
            matched.append(f"Social category {user_cat} matches targeted beneficiaries ({', '.join(allowed_cats)})")
            passed_checks += 1
        else:
            failed.append(f"Category {user_cat} not eligible. Scheme covers: {', '.join(allowed_cats)}")
            is_hard_disqualified = True

    # 5. State / Region Evaluation
    allowed_sts = parse_json_list(criteria.allowed_states)
    if allowed_sts and "All" not in allowed_sts and "National" not in allowed_sts:
        total_checks += 1
        user_state = profile.state or "National"
        if user_state in allowed_sts or "All" in allowed_sts:
            matched.append(f"Domicile state '{user_state}' is eligible for this scheme")
            passed_checks += 1
        else:
            failed.append(f"State restricted: Scheme applies only to {', '.join(allowed_sts)}, current profile is {user_state}")
            is_hard_disqualified = True

    # 6. Occupation Flags & Status checks
    if criteria.requires_farmer:
        total_checks += 1
        if profile.is_farmer:
            matched.append("Farmer / Agricultural landholder status confirmed")
            passed_checks += 1
        else:
            failed.append("Scheme is specifically restricted to practicing farmers or agricultural cultivators")
            is_hard_disqualified = True

    if criteria.requires_student:
        total_checks += 1
        if profile.is_student:
            matched.append("Enrolled student status verified for educational benefits")
            passed_checks += 1
        else:
            failed.append("Scheme requires current enrollment as a student")
            is_hard_disqualified = True

    if criteria.requires_disabled:
        total_checks += 1
        if profile.is_disabled and (profile.disability_percentage or 0) >= 40.0:
            matched.append(f"Benchmark disability ({profile.disability_percentage}%) satisfies min 40% criteria")
            passed_checks += 1
        elif profile.is_disabled:
            failed.append(f"Disability percentage ({profile.disability_percentage}%) below mandatory 40% threshold")
            is_hard_disqualified = True
        else:
            failed.append("Scheme exclusively supports Persons with Disabilities (Divyangjan)")
            is_hard_disqualified = True

    if criteria.requires_business:
        total_checks += 1
        if profile.is_business_owner or (profile.occupation or "").lower() in ["business", "self-employed", "entrepreneur", "vendor"]:
            matched.append("Micro/Small Enterprise or self-employed entrepreneur status verified")
            passed_checks += 1
        else:
            failed.append("Scheme requires micro-business ownership or self-employed entrepreneurial activity")
            is_hard_disqualified = True

    if criteria.requires_bpl:
        total_checks += 1
        if profile.bpl_card_holder or (profile.annual_income or 0) <= 150000:
            matched.append("BPL / Below Poverty Line or low-income threshold satisfied")
            passed_checks += 1
        else:
            failed.append("Requires valid BPL ration card or income under ₹1.5 Lakh")
            is_hard_disqualified = True

    # 7. Document Matching & Recommendations
    req_docs = parse_json_list(scheme.required_documents)
    uploaded_doc_types = [d.doc_type.lower() for d in user_documents]
    
    recommended_docs: List[str] = []
    for doc_name in req_docs:
        found = False
        for u_type in uploaded_doc_types:
            if any(k in doc_name.lower() for k in u_type.split()):
                found = True
                break
        if not found:
            recommended_docs.append(doc_name)

    # 8. Score Calculation & Categorization
    if total_checks == 0:
        base_score = 90.0
    else:
        base_score = (passed_checks / total_checks) * 100.0

    # Boost score slightly if citizen already has uploaded required documents
    doc_bonus = 0.0
    if req_docs:
        docs_held = len(req_docs) - len(recommended_docs)
        doc_bonus = (docs_held / len(req_docs)) * 10.0

    final_score = min(100.0, round(base_score * 0.9 + doc_bonus, 1))

    # Determine final status
    if is_hard_disqualified:
        status = "Not Eligible"
        final_score = min(final_score, 45.0)
    elif missing:
        status = "Maybe Eligible"
        final_score = min(final_score, 75.0)
    elif final_score >= 75.0:
        status = "Eligible"
    elif final_score >= 50.0:
        status = "Maybe Eligible"
    else:
        status = "Not Eligible"

    return {
        "status": status,
        "score": final_score,
        "matched_criteria": matched if matched else ["Basic criteria partially aligned"],
        "failed_criteria": failed,
        "missing_info": missing,
        "recommended_docs": recommended_docs
    }

def evaluate_all_schemes_for_user(
    db: Session,
    user: models.User
) -> List[Dict[str, Any]]:
    """Evaluates user profile against all active schemes in the database, saves results and returns ranked list"""
    profile = user.profile
    if not profile:
        # Create empty profile if not exists
        profile = models.CitizenProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    documents = db.query(models.Document).filter(models.Document.user_id == user.id).all()
    schemes = db.query(models.Scheme).filter(models.Scheme.is_active == True).all()

    results = []
    # Clear previous cached evaluation results for this user
    db.query(models.EligibilityResult).filter(models.EligibilityResult.user_id == user.id).delete()

    for scheme in schemes:
        eval_data = evaluate_citizen_eligibility(profile, scheme, documents)
        
        # Save to DB
        result_record = models.EligibilityResult(
            user_id=user.id,
            scheme_id=scheme.id,
            status=eval_data["status"],
            score=eval_data["score"],
            matched_criteria=json.dumps(eval_data["matched_criteria"]),
            failed_criteria=json.dumps(eval_data["failed_criteria"]),
            missing_info=json.dumps(eval_data["missing_info"]),
            recommended_docs=json.dumps(eval_data["recommended_docs"])
        )
        db.add(result_record)
        
        scheme_dict = {
            "id": scheme.id,
            "name": scheme.name,
            "code": scheme.code,
            "ministry": scheme.ministry,
            "category": scheme.category,
            "description": scheme.description,
            "benefits": scheme.benefits,
            "required_documents": parse_json_list(scheme.required_documents),
            "application_process": scheme.application_process,
            "official_url": scheme.official_url,
            "is_active": scheme.is_active,
            "created_at": scheme.created_at,
            "status": eval_data["status"],
            "score": eval_data["score"],
            "matched_criteria": eval_data["matched_criteria"],
            "failed_criteria": eval_data["failed_criteria"],
            "missing_info": eval_data["missing_info"],
            "recommended_docs": eval_data["recommended_docs"]
        }
        results.append(scheme_dict)

    # Record history
    history_entry = models.ApplicationHistory(
        user_id=user.id,
        action_type="eligibility_check",
        notes=f"Calculated eligibility across {len(schemes)} schemes"
    )
    db.add(history_entry)
    db.commit()

    # Rank schemes: Eligible first, then Maybe Eligible, sorted by score descending
    status_order = {"Eligible": 0, "Maybe Eligible": 1, "Not Eligible": 2}
    results.sort(key=lambda x: (status_order.get(x["status"], 3), -x["score"]))

    return results
