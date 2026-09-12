import os
import json
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, get_db, Base
import models
import schemas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin
)
from document_service import (
    save_upload_file,
    process_document,
    UPLOAD_DIR
)
from eligibility_engine import (
    evaluate_citizen_eligibility,
    evaluate_all_schemes_for_user,
    parse_json_list
)
from chatbot import generate_chat_response

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GovAssist AI API",
    description="Intelligent Government Scheme Eligibility & Document Assistant Backend",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file access
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/auth/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    new_user = models.User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "citizen"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create default CitizenProfile
    profile = models.CitizenProfile(user_id=new_user.id)
    db.add(profile)
    
    # Record history
    history = models.ApplicationHistory(
        user_id=new_user.id,
        action_type="profile_update",
        notes="Citizen registered and profile initialized"
    )
    db.add(history)
    db.commit()

    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }


@app.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


# ==========================================
# USER & CITIZEN PROFILE ENDPOINTS
# ==========================================

@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.get("/users/profile", response_model=schemas.CitizenProfileResponse)
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CitizenProfile).filter(models.CitizenProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.CitizenProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@app.put("/users/profile", response_model=schemas.CitizenProfileResponse)
def update_profile(
    profile_in: schemas.CitizenProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CitizenProfile).filter(models.CitizenProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.CitizenProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    profile.updated_at = datetime.datetime.utcnow()
    
    # Record history
    history = models.ApplicationHistory(
        user_id=current_user.id,
        action_type="profile_update",
        notes="Citizen profile details updated"
    )
    db.add(history)
    db.commit()
    db.refresh(profile)

    # Trigger automatic recalculation of scheme eligibility
    try:
        evaluate_all_schemes_for_user(db, current_user)
    except Exception as e:
        print(f"Error recalculating eligibility on profile update: {e}")

    return profile


# ==========================================
# DOCUMENT INTELLIGENCE & OCR ENDPOINTS
# ==========================================

@app.post("/documents/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validation
    allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type ({file.content_type}). Please upload a PDF or image (JPG/PNG)."
        )

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    # Save to disk
    file_path, unique_name, file_size = save_upload_file(file_bytes, file.filename)

    # Process through OCR & Intelligence Pipeline
    analysis = process_document(file_path, doc_type, file.filename)

    # Create document record
    doc = models.Document(
        user_id=current_user.id,
        doc_type=doc_type,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        ocr_status="completed",
        raw_text=analysis["raw_text"],
        extracted_data=json.dumps(analysis["extracted_fields"]),
        is_verified=True if analysis["confidence_score"] >= 0.70 else False
    )
    db.add(doc)

    # Record history
    history = models.ApplicationHistory(
        user_id=current_user.id,
        action_type="document_upload",
        notes=f"Uploaded {doc_type} ({file.filename}) - OCR processed"
    )
    db.add(history)
    db.commit()
    db.refresh(doc)

    # Recalculate eligibility with newly uploaded document
    try:
        evaluate_all_schemes_for_user(db, current_user)
    except Exception as e:
        print(f"Error recalculating eligibility on document upload: {e}")

    extracted_dict = analysis["extracted_fields"]
    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "doc_type": doc.doc_type,
        "file_name": doc.file_name,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "ocr_status": doc.ocr_status,
        "is_verified": doc.is_verified,
        "uploaded_at": doc.uploaded_at,
        "extracted_data": extracted_dict
    }


@app.get("/documents", response_model=List[schemas.DocumentResponse])
def get_user_documents(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).order_by(models.Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        extracted = {}
        if d.extracted_data:
            try:
                extracted = json.loads(d.extracted_data)
            except Exception:
                extracted = {}
        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "doc_type": d.doc_type,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "ocr_status": d.ocr_status,
            "is_verified": d.is_verified,
            "uploaded_at": d.uploaded_at,
            "extracted_data": extracted
        })
    return results


@app.get("/documents/{doc_id}/analysis", response_model=schemas.DocumentAnalysisResponse)
def get_document_analysis(doc_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized access to document")

    # Re-evaluate analysis from saved raw text & fields
    extracted = {}
    if doc.extracted_data:
        try:
            extracted = json.loads(doc.extracted_data)
        except Exception:
            extracted = {}

    missing_fields = []
    warnings = []
    doc_type_l = doc.doc_type.lower()
    
    if "aadhaar" in doc_type_l:
        if not extracted.get("id_number"): missing_fields.append("Aadhaar Number")
        if not extracted.get("name"): missing_fields.append("Citizen Name")
        if not extracted.get("dob") and not extracted.get("age"): missing_fields.append("Date of Birth")
    elif "income" in doc_type_l:
        if extracted.get("annual_income") is None: missing_fields.append("Annual Family Income")
        if not extracted.get("certificate_number"): missing_fields.append("Certificate Registration Number")
    elif "caste" in doc_type_l:
        if not extracted.get("category"): missing_fields.append("Social Category / Caste")

    if missing_fields:
        warnings.append(f"Missing {len(missing_fields)} key fields. Citizen can update manually.")

    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "file_name": doc.file_name,
        "ocr_status": doc.ocr_status,
        "raw_text": doc.raw_text or "No raw text extracted.",
        "extracted_fields": extracted,
        "confidence_score": 0.95 if not missing_fields else 0.70,
        "missing_fields": missing_fields,
        "validation_warnings": warnings,
        "is_verified": doc.is_verified
    }


@app.post("/documents/{doc_id}/sync-to-profile")
def sync_document_to_profile(doc_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Synchronize extracted OCR fields directly to Citizen Profile"""
    doc = db.query(models.Document).filter(models.Document.id == doc_id, models.Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    profile = db.query(models.CitizenProfile).filter(models.CitizenProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.CitizenProfile(user_id=current_user.id)
        db.add(profile)

    extracted = json.loads(doc.extracted_data) if doc.extracted_data else {}
    synced_fields = []

    if extracted.get("age") and (not profile.age or profile.age == 0):
        profile.age = int(extracted["age"])
        synced_fields.append("age")
    if extracted.get("gender") and not profile.gender:
        profile.gender = extracted["gender"]
        synced_fields.append("gender")
    if extracted.get("state") and (not profile.state or profile.state == "National"):
        profile.state = extracted["state"]
        synced_fields.append("state")
    if extracted.get("district") and not profile.district:
        profile.district = extracted["district"]
        synced_fields.append("district")
    if extracted.get("annual_income") is not None and (not profile.annual_income or profile.annual_income == 0):
        profile.annual_income = float(extracted["annual_income"])
        synced_fields.append("annual_income")
    if extracted.get("category") and (not profile.category or profile.category == "GEN"):
        profile.category = extracted["category"]
        synced_fields.append("category")

    profile.updated_at = datetime.datetime.utcnow()
    db.commit()

    # Recalculate schemes
    evaluate_all_schemes_for_user(db, current_user)

    return {
        "message": f"Successfully synchronized {len(synced_fields)} fields from {doc.doc_type} to profile.",
        "synced_fields": synced_fields
    }


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    # Recalculate eligibility
    evaluate_all_schemes_for_user(db, current_user)
    return {"message": "Document removed successfully"}


# ==========================================
# SCHEMES ENDPOINTS (CITIZEN & ADMIN)
# ==========================================

@app.get("/schemes")
def get_schemes(
    category: Optional[str] = None,
    ministry: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Scheme).filter(models.Scheme.is_active == True)
    if category and category != "All":
        query = query.filter(models.Scheme.category == category)
    if ministry and ministry != "All":
        query = query.filter(models.Scheme.ministry.ilike(f"%{ministry}%"))
    if search:
        query = query.filter(
            (models.Scheme.name.ilike(f"%{search}%")) |
            (models.Scheme.code.ilike(f"%{search}%")) |
            (models.Scheme.description.ilike(f"%{search}%"))
        )

    schemes = query.all()
    results = []
    for s in schemes:
        results.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "ministry": s.ministry,
            "category": s.category,
            "description": s.description,
            "benefits": s.benefits,
            "required_documents": parse_json_list(s.required_documents),
            "application_process": s.application_process,
            "official_url": s.official_url,
            "is_active": s.is_active,
            "created_at": s.created_at,
            "criteria": {
                "min_age": s.criteria.min_age if s.criteria else None,
                "max_age": s.criteria.max_age if s.criteria else None,
                "gender": s.criteria.gender if s.criteria else "All",
                "max_income": s.criteria.max_income if s.criteria else None,
                "allowed_categories": parse_json_list(s.criteria.allowed_categories) if s.criteria else ["All"],
                "allowed_states": parse_json_list(s.criteria.allowed_states) if s.criteria else ["All"],
                "allowed_occupations": parse_json_list(s.criteria.allowed_occupations) if s.criteria else ["All"],
                "requires_farmer": s.criteria.requires_farmer if s.criteria else False,
                "requires_student": s.criteria.requires_student if s.criteria else False,
                "requires_disabled": s.criteria.requires_disabled if s.criteria else False,
                "requires_business": s.criteria.requires_business if s.criteria else False,
                "requires_bpl": s.criteria.requires_bpl if s.criteria else False,
                "min_education": s.criteria.min_education if s.criteria else None
            } if s.criteria else None
        })
    return results


@app.get("/schemes/{scheme_id}")
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    return {
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
        "criteria": {
            "min_age": scheme.criteria.min_age if scheme.criteria else None,
            "max_age": scheme.criteria.max_age if scheme.criteria else None,
            "gender": scheme.criteria.gender if scheme.criteria else "All",
            "max_income": scheme.criteria.max_income if scheme.criteria else None,
            "allowed_categories": parse_json_list(scheme.criteria.allowed_categories) if scheme.criteria else ["All"],
            "allowed_states": parse_json_list(scheme.criteria.allowed_states) if scheme.criteria else ["All"],
            "allowed_occupations": parse_json_list(scheme.criteria.allowed_occupations) if scheme.criteria else ["All"],
            "requires_farmer": scheme.criteria.requires_farmer if scheme.criteria else False,
            "requires_student": scheme.criteria.requires_student if scheme.criteria else False,
            "requires_disabled": scheme.criteria.requires_disabled if scheme.criteria else False,
            "requires_business": scheme.criteria.requires_business if scheme.criteria else False,
            "requires_bpl": scheme.criteria.requires_bpl if scheme.criteria else False,
            "min_education": scheme.criteria.min_education if scheme.criteria else None
        } if scheme.criteria else None
    }


# Admin Scheme CRUD
@app.post("/schemes")
def create_scheme(
    scheme_in: schemas.SchemeCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Scheme).filter(models.Scheme.code == scheme_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scheme with this code already exists")

    new_scheme = models.Scheme(
        name=scheme_in.name,
        code=scheme_in.code,
        ministry=scheme_in.ministry,
        category=scheme_in.category,
        description=scheme_in.description,
        benefits=scheme_in.benefits,
        required_documents=json.dumps(scheme_in.required_documents or []),
        application_process=scheme_in.application_process,
        official_url=scheme_in.official_url,
        is_active=scheme_in.is_active
    )
    db.add(new_scheme)
    db.commit()
    db.refresh(new_scheme)

    if scheme_in.criteria:
        c = scheme_in.criteria
        criteria_obj = models.SchemeCriteria(
            scheme_id=new_scheme.id,
            min_age=c.min_age,
            max_age=c.max_age,
            gender=c.gender or "All",
            max_income=c.max_income,
            allowed_categories=json.dumps(c.allowed_categories or ["All"]),
            allowed_states=json.dumps(c.allowed_states or ["All"]),
            allowed_occupations=json.dumps(c.allowed_occupations or ["All"]),
            requires_farmer=c.requires_farmer or False,
            requires_student=c.requires_student or False,
            requires_disabled=c.requires_disabled or False,
            requires_business=c.requires_business or False,
            requires_bpl=c.requires_bpl or False,
            min_education=c.min_education
        )
        db.add(criteria_obj)
        db.commit()

    return {"message": "Scheme created successfully", "scheme_id": new_scheme.id}


@app.put("/schemes/{scheme_id}")
def update_scheme(
    scheme_id: int,
    scheme_in: schemas.SchemeUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    scheme = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    update_dict = scheme_in.model_dump(exclude_unset=True)
    if "criteria" in update_dict:
        c_dict = update_dict.pop("criteria")
        if c_dict and scheme.criteria:
            for k, v in c_dict.items():
                if k in ["allowed_categories", "allowed_states", "allowed_occupations"]:
                    setattr(scheme.criteria, k, json.dumps(v))
                else:
                    setattr(scheme.criteria, k, v)
    
    if "required_documents" in update_dict:
        scheme.required_documents = json.dumps(update_dict.pop("required_documents"))

    for k, v in update_dict.items():
        setattr(scheme, k, v)

    db.commit()
    return {"message": "Scheme updated successfully"}


@app.delete("/schemes/{scheme_id}")
def delete_scheme(
    scheme_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    scheme = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    db.delete(scheme)
    db.commit()
    return {"message": "Scheme deleted successfully"}


# ==========================================
# ELIGIBILITY ENGINE ENDPOINTS
# ==========================================

@app.post("/eligibility/check")
def check_eligibility(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes AI Explainable Eligibility calculation across all schemes for current citizen"""
    results = evaluate_all_schemes_for_user(db, current_user)
    return {
        "message": f"Successfully evaluated {len(results)} schemes",
        "results": results
    }


@app.get("/eligibility/results")
def get_eligibility_results(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches cached eligibility evaluation results from database for citizen"""
    cached = db.query(models.EligibilityResult).filter(models.EligibilityResult.user_id == current_user.id).all()
    
    # If no results cached yet, calculate now
    if not cached:
        return evaluate_all_schemes_for_user(db, current_user)

    results = []
    for r in cached:
        scheme = r.scheme
        if not scheme or not scheme.is_active:
            continue
        results.append({
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
            "status": r.status,
            "score": r.score,
            "matched_criteria": parse_json_list(r.matched_criteria),
            "failed_criteria": parse_json_list(r.failed_criteria),
            "missing_info": parse_json_list(r.missing_info),
            "recommended_docs": parse_json_list(r.recommended_docs),
            "evaluated_at": r.evaluated_at
        })

    status_order = {"Eligible": 0, "Maybe Eligible": 1, "Not Eligible": 2}
    results.sort(key=lambda x: (status_order.get(x["status"], 3), -x["score"]))
    return results


# ==========================================
# LOCAL NLP AI CHATBOT ENDPOINT
# ==========================================

@app.post("/chat", response_model=schemas.ChatResponse)
def chat_with_assistant(
    chat_in: schemas.ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Local context-aware intelligent scheme chatbot"""
    response_data = generate_chat_response(chat_in.message, db, current_user)
    return response_data


# ==========================================
# HISTORY & APPLICATION TRACKING
# ==========================================

@app.get("/history", response_model=List[schemas.ApplicationHistoryResponse])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.ApplicationHistory).filter(
        models.ApplicationHistory.user_id == current_user.id
    ).order_by(models.ApplicationHistory.created_at.desc()).limit(50).all()
    return history


@app.post("/history")
def record_history_action(
    scheme_id: Optional[int] = None,
    scheme_name: Optional[str] = None,
    action_type: str = Query(..., description="e.g. applied_external, scheme_view"),
    notes: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = models.ApplicationHistory(
        user_id=current_user.id,
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        action_type=action_type,
        notes=notes
    )
    db.add(entry)
    db.commit()
    return {"message": "Action recorded"}


# ==========================================
# CITIZEN DASHBOARD STATS
# ==========================================

@app.get("/dashboard/stats")
def get_dashboard_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_schemes = db.query(models.Scheme).filter(models.Scheme.is_active == True).count()
    
    # Get user eligibility results
    results = db.query(models.EligibilityResult).filter(models.EligibilityResult.user_id == current_user.id).all()
    
    # If not yet evaluated, evaluate
    if not results and total_schemes > 0:
        evaluate_all_schemes_for_user(db, current_user)
        results = db.query(models.EligibilityResult).filter(models.EligibilityResult.user_id == current_user.id).all()

    eligible_count = sum(1 for r in results if r.status == "Eligible")
    maybe_count = sum(1 for r in results if r.status == "Maybe Eligible")
    not_eligible_count = sum(1 for r in results if r.status == "Not Eligible")

    docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    docs_count = len(docs)
    verified_docs = sum(1 for d in docs if d.is_verified)

    # Profile completion %
    profile = current_user.profile
    fields_checked = [
        profile.age, profile.gender, profile.state, profile.district,
        profile.occupation, profile.annual_income, profile.category,
        profile.education_level, profile.phone_number
    ] if profile else []
    completed_fields = sum(1 for f in fields_checked if f not in [None, "", 0, 0.0])
    profile_pct = int((completed_fields / max(1, len(fields_checked))) * 100) if fields_checked else 0

    return {
        "total_schemes": total_schemes,
        "eligible_schemes_count": eligible_count,
        "maybe_eligible_count": maybe_count,
        "not_eligible_count": not_eligible_count,
        "documents_count": docs_count,
        "verified_documents_count": verified_docs,
        "profile_completion_percent": profile_pct,
        "user_name": current_user.full_name,
        "user_email": current_user.email
    }


# ==========================================
# ADMIN DASHBOARD & USER MANAGEMENT
# ==========================================

@app.get("/admin/stats")
def get_admin_stats(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    total_citizens = db.query(models.User).filter(models.User.role == "citizen").count()
    total_schemes = db.query(models.Scheme).count()
    active_schemes = db.query(models.Scheme).filter(models.Scheme.is_active == True).count()
    total_docs = db.query(models.Document).count()
    total_evals = db.query(models.EligibilityResult).count()

    # Category distribution
    schemes = db.query(models.Scheme).all()
    cat_dist = {}
    for s in schemes:
        cat_dist[s.category] = cat_dist.get(s.category, 0) + 1

    # Overall eligibility distribution across all users
    evals = db.query(models.EligibilityResult).all()
    elig_dist = {"Eligible": 0, "Maybe Eligible": 0, "Not Eligible": 0}
    for e in evals:
        if e.status in elig_dist:
            elig_dist[e.status] += 1

    return {
        "total_users": total_users,
        "total_citizens": total_citizens,
        "total_schemes": total_schemes,
        "active_schemes": active_schemes,
        "total_documents": total_docs,
        "total_evaluations": total_evals,
        "category_distribution": cat_dist,
        "eligibility_distribution": elig_dist
    }


@app.get("/admin/users")
def get_admin_users(
    search: Optional[str] = None,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if search:
        query = query.filter(
            (models.User.full_name.ilike(f"%{search}%")) |
            (models.User.email.ilike(f"%{search}%"))
        )
    users = query.all()
    results = []
    for u in users:
        p = u.profile
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "profile": {
                "age": p.age if p else None,
                "gender": p.gender if p else None,
                "state": p.state if p else None,
                "occupation": p.occupation if p else None,
                "annual_income": p.annual_income if p else 0,
                "category": p.category if p else "GEN",
                "is_farmer": p.is_farmer if p else False,
                "is_student": p.is_student if p else False
            } if p else None,
            "documents_count": len(u.documents)
        })
    return results
