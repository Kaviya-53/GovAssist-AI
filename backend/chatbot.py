import re
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import models
from eligibility_engine import evaluate_citizen_eligibility, parse_json_list

def generate_chat_response(
    query: str,
    db: Session,
    user: Optional[models.User] = None
) -> Dict[str, Any]:
    """
    Local context-aware intelligent AI chatbot for Government Schemes.
    Answers scheme questions using live DB records & current citizen profile.
    No external paid APIs needed.
    """
    clean_q = query.strip().lower()
    profile = user.profile if user else None
    documents = db.query(models.Document).filter(models.Document.user_id == user.id).all() if user else []
    all_schemes = db.query(models.Scheme).filter(models.Scheme.is_active == True).all()

    # Suggestions list to prompt user for follow-up
    default_suggestions = [
        "Which schemes am I eligible for?",
        "Show schemes for farmers",
        "Show schemes for students",
        "What documents are required for PM-KISAN?",
        "How can I apply for Ayushman Bharat?"
    ]

    # Helper to find if user mentioned a specific scheme
    target_scheme = None
    for s in all_schemes:
        # Check by name words or code
        code_clean = s.code.lower()
        name_clean = s.name.lower()
        if code_clean in clean_q or (len(code_clean) > 3 and code_clean.replace("-", "") in clean_q.replace("-", "")):
            target_scheme = s
            break
        # Common acronyms
        keywords = {
            "kisan": "PM-KISAN",
            "ayushman": "PM-JAY",
            "pmjay": "PM-JAY",
            "awas": "PMAY-G",
            "pmay": "PMAY-G",
            "mudra": "PMMY",
            "sukanya": "SSY",
            "ujjwala": "PMUY",
            "jan dhan": "PMJDY",
            "mgnrega": "MGNREGA",
            "nrega": "MGNREGA",
            "svanidhi": "PM-SVANIDHI",
            "vendor": "PM-SVANIDHI",
            "atal pension": "APY",
            "scholarship": "PMS-SC-ST-OBC"
        }
        for kw, code in keywords.items():
            if kw in clean_q and s.code == code:
                target_scheme = s
                break
        if target_scheme:
            break

    # INTENT 1: Specific Scheme Inquiries (Benefits, Documents, Application Process, or Why Not Eligible)
    if target_scheme:
        # 1a. "Why am I not eligible?"
        if any(w in clean_q for w in ["why", "reason", "not eligible", "disqualified", "reject"]):
            if profile:
                eval_res = evaluate_citizen_eligibility(profile, target_scheme, documents)
                status = eval_res["status"]
                failed = eval_res["failed_criteria"]
                missing = eval_res["missing_info"]
                
                if status == "Eligible":
                    resp = (
                        f"Good news! According to your profile, you are **Eligible** for **{target_scheme.name}** "
                        f"with an eligibility score of **{eval_res['score']}%**.\n\n"
                        f"**Matched Criteria:**\n" + "\n".join([f"- ✅ {m}" for m in eval_res["matched_criteria"]])
                    )
                else:
                    reasons = failed + missing
                    resp = (
                        f"For **{target_scheme.name} ({target_scheme.code})**, your current status is **{status}** "
                        f"(Score: {eval_res['score']}%).\n\n"
                        f"**Key Reasons / Criteria Not Met:**\n" +
                        ("\n".join([f"- ⚠️ {r}" for r in reasons]) if reasons else "- Profile data requires further verification.") +
                        f"\n\n**Recommended Next Steps:**\n"
                        f"Update your profile fields or upload any missing supporting documents to improve eligibility."
                    )
                return {
                    "response": resp,
                    "intent": "scheme_eligibility_explanation",
                    "suggestions": ["How can I apply?", "What documents are required?", "Which schemes am I eligible for?"],
                    "schemes": [{
                        "id": target_scheme.id,
                        "name": target_scheme.name,
                        "code": target_scheme.code,
                        "category": target_scheme.category
                    }]
                }

        # 1b. Required Documents
        if any(w in clean_q for w in ["document", "doc", "paper", "certificate", "id proof", "what is needed"]):
            req_docs = parse_json_list(target_scheme.required_documents)
            docs_text = "\n".join([f"- 📄 {d}" for d in req_docs]) if req_docs else "- Valid Photo ID (Aadhaar/Voter ID)\n- Bank Passbook details"
            resp = (
                f"### Required Documents for **{target_scheme.name}**\n\n"
                f"To submit a verified application for **{target_scheme.code}**, please have the following ready:\n\n"
                f"{docs_text}\n\n"
                f"💡 *Tip: You can upload these in the Document Upload section for instant OCR extraction and automatic verification.*"
            )
            return {
                "response": resp,
                "intent": "scheme_documents",
                "suggestions": [f"How can I apply for {target_scheme.code}?", f"What is the benefit of {target_scheme.code}?", "Which schemes am I eligible for?"],
                "schemes": [{"id": target_scheme.id, "name": target_scheme.name, "code": target_scheme.code}]
            }

        # 1c. How to Apply
        if any(w in clean_q for w in ["how to apply", "how can i apply", "apply", "process", "portal", "link", "register"]):
            resp = (
                f"### Application Process for **{target_scheme.name}**\n\n"
                f"**Step-by-step instructions:**\n{target_scheme.application_process}\n\n"
                f"🌐 **Official Portal / Link:** [{target_scheme.official_url}]({target_scheme.official_url})\n\n"
                f"**Ministry:** {target_scheme.ministry}"
            )
            return {
                "response": resp,
                "intent": "scheme_application",
                "suggestions": [f"What documents are required for {target_scheme.code}?", f"What is the benefit of {target_scheme.code}?", "Show all my schemes"],
                "schemes": [{"id": target_scheme.id, "name": target_scheme.name, "code": target_scheme.code, "official_url": target_scheme.official_url}]
            }

        # 1d. Scheme Overview / Benefits
        resp = (
            f"### **{target_scheme.name} ({target_scheme.code})**\n\n"
            f"🏛️ **Ministry:** {target_scheme.ministry}\n"
            f"🏷️ **Category:** {target_scheme.category}\n\n"
            f"**Description:**\n{target_scheme.description}\n\n"
            f"🎁 **Key Benefits:**\n{target_scheme.benefits}\n\n"
            f"🌐 **Official Portal:** [{target_scheme.official_url}]({target_scheme.official_url})"
        )
        return {
            "response": resp,
            "intent": "scheme_details",
            "suggestions": [f"What documents are required for {target_scheme.code}?", f"How can I apply for {target_scheme.code}?", "Which schemes am I eligible for?"],
            "schemes": [{"id": target_scheme.id, "name": target_scheme.name, "code": target_scheme.code}]
        }

    # INTENT 2: "Which schemes am I eligible for?" / "Check my eligibility"
    if any(w in clean_q for w in ["which scheme", "am i eligible", "my eligibility", "schemes for me", "eligible for", "find scheme"]):
        if not user or not profile:
            return {
                "response": "Please log in and complete your citizen profile (Age, State, Income, Occupation) so our AI engine can calculate your exact eligibility across all Central and State government schemes.",
                "intent": "auth_required",
                "suggestions": ["Show schemes for farmers", "Show schemes for students", "Healthcare schemes"]
            }

        # Run dynamic check
        eligible_list = []
        maybe_list = []
        for s in all_schemes:
            ev = evaluate_citizen_eligibility(profile, s, documents)
            if ev["status"] == "Eligible":
                eligible_list.append((s, ev["score"]))
            elif ev["status"] == "Maybe Eligible":
                maybe_list.append((s, ev["score"]))

        eligible_list.sort(key=lambda x: -x[1])
        maybe_list.sort(key=lambda x: -x[1])

        user_summary = f"Age: {profile.age or 'Not set'} | Income: ₹{profile.annual_income:,.0f} | Category: {profile.category} | State: {profile.state}"
        
        if eligible_list:
            top_schemes_text = "\n".join([
                f"- **{s.name} ({s.code})** — Match Score: **{sc}%**\n  *Benefit:* {s.benefits[:120]}..."
                for s, sc in eligible_list[:4]
            ])
            resp = (
                f"### Personalized Eligibility Results\n\n"
                f"Based on your profile (*{user_summary}*), you are **directly eligible for {len(eligible_list)} government schemes**!\n\n"
                f"**Top Recommended Schemes for You:**\n{top_schemes_text}\n\n"
                f"You also have **{len(maybe_list)} schemes** in *Maybe Eligible* status that you could unlock by uploading documents."
            )
            matched_scheme_dicts = [{"id": s.id, "name": s.name, "code": s.code, "category": s.category} for s, _ in eligible_list[:5]]
        else:
            resp = (
                f"Based on your current profile (*{user_summary}*), we found {len(maybe_list)} potentially matching schemes.\n"
                f"To find more eligible schemes, consider updating your profile (e.g. farmer status, student status, or uploading an income certificate)."
            )
            matched_scheme_dicts = [{"id": s.id, "name": s.name, "code": s.code, "category": s.category} for s, _ in maybe_list[:5]]

        return {
            "response": resp,
            "intent": "eligibility_summary",
            "suggestions": ["What documents are required?", "Show schemes for farmers", "Show schemes for women", "How to apply?"],
            "schemes": matched_scheme_dicts
        }

    # INTENT 3: Schemes by Sector/Category
    category_keywords = {
        "farmer": ("Agriculture", ["kisan", "farmer", "agriculture", "krishi", "crop"]),
        "student": ("Education", ["student", "scholarship", "education", "school", "college", "study"]),
        "women": ("Women Welfare", ["women", "woman", "girl", "female", "mother", "matru", "mahila"]),
        "health": ("Healthcare", ["health", "hospital", "medical", "treatment", "medicine"]),
        "housing": ("Housing", ["house", "housing", "awas", "home", "flat", "shelter"]),
        "employment": ("Employment", ["job", "employment", "business", "mudra", "loan", "vendor", "work", "unemployed"]),
        "social": ("Social Welfare", ["pension", "disability", "disabled", "senior", "elderly", "welfare", "bpl"])
    }

    matched_cat = None
    for cat_name, (cat_label, kws) in category_keywords.items():
        if any(kw in clean_q for kw in kws):
            matched_cat = cat_label
            break

    if matched_cat:
        cat_schemes = [s for s in all_schemes if s.category == matched_cat or (matched_cat == "Employment" and s.category in ["Employment", "Agriculture"])]
        if not cat_schemes:
            cat_schemes = [s for s in all_schemes if matched_cat.lower() in s.category.lower()]

        schemes_text = "\n".join([
            f"- **{s.name} ({s.code})**\n  *Ministry:* {s.ministry}\n  *Benefits:* {s.benefits[:110]}..."
            for s in cat_schemes[:5]
        ])

        resp = (
            f"### Government Schemes for **{matched_cat}**\n\n"
            f"Here are prominent Central & State schemes under **{matched_cat}**:\n\n"
            f"{schemes_text}\n\n"
            f"💬 *Ask me about any specific scheme (e.g. 'What documents for {cat_schemes[0].code if cat_schemes else 'PM-KISAN'}?') for detailed guidance.*"
        )
        return {
            "response": resp,
            "intent": "category_schemes",
            "suggestions": [f"Details on {cat_schemes[0].code}" if cat_schemes else "PM-KISAN", "Am I eligible for these?", "How to apply?"],
            "schemes": [{"id": s.id, "name": s.name, "code": s.code, "category": s.category} for s in cat_schemes[:5]]
        }

    # INTENT 4: Document Intelligence & Upload inquiries
    if any(w in clean_q for w in ["document", "upload", "ocr", "extract", "aadhaar", "pan", "certificate"]):
        user_docs_count = len(documents)
        resp = (
            f"### GovAssist AI Document Intelligence\n\n"
            f"Our system automatically extracts and validates essential fields from your uploaded documents using integrated OCR:\n\n"
            f"- **Aadhaar Card:** Name, Age/DOB, Masked Aadhaar Number, Gender, Address\n"
            f"- **Income Certificate:** Tahsildar verified Annual Family Income, Issue Year\n"
            f"- **Caste Certificate:** Social Category (SC, ST, OBC, EWS), District\n"
            f"- **Residence / Domicile Certificate:** State, District verification\n\n"
            f"You currently have **{user_docs_count} document(s)** uploaded. You can visit the **Document Upload** tab anytime to analyze new certificates."
        )
        return {
            "response": resp,
            "intent": "document_help",
            "suggestions": ["Which schemes am I eligible for?", "Show schemes for farmers", "How does eligibility scoring work?"]
        }

    # GENERAL ASSISTANT / FALLBACK
    resp = (
        f"Namaste! I am **GovAssist AI**, your intelligent Government Scheme & Document Assistant.\n\n"
        f"I can help you with:\n"
        f"1. 🎯 **Personalized Eligibility:** Tell me your profile or ask *'Which schemes am I eligible for?'*\n"
        f"2. 📄 **Document Guidance:** Ask *'What documents are required for PM-KISAN?'*\n"
        f"3. 🌾 **Sector Schemes:** Ask for schemes for *farmers, students, women, healthcare, or housing*.\n"
        f"4. 📝 **Application Assistance:** Ask *'How can I apply for Ayushman Bharat?'*\n"
        f"5. 🔍 **Rejection Diagnosis:** Ask *'Why am I not eligible for PMAY?'*\n\n"
        f"What would you like assistance with today?"
    )
    return {
        "response": resp,
        "intent": "general_greeting",
        "suggestions": default_suggestions,
        "schemes": []
    }
