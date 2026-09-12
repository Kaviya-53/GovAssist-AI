import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen")  # "citizen" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("CitizenProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    eligibility_results = relationship("EligibilityResult", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("ApplicationHistory", back_populates="user", cascade="all, delete-orphan")


class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    age = Column(Integer, nullable=True)
    gender = Column(String(20), default="Male")  # Male, Female, Transgender, Other
    state = Column(String(100), default="National")
    district = Column(String(100), default="")
    occupation = Column(String(100), default="Other")
    annual_income = Column(Float, default=0.0)
    category = Column(String(20), default="GEN")  # GEN, OBC, SC, ST, EWS
    education_level = Column(String(50), default="12th Pass")
    
    is_disabled = Column(Boolean, default=False)
    disability_percentage = Column(Float, default=0.0)
    is_farmer = Column(Boolean, default=False)
    land_holding_hectares = Column(Float, default=0.0)
    is_student = Column(Boolean, default=False)
    is_business_owner = Column(Boolean, default=False)
    marital_status = Column(String(30), default="Single")
    bpl_card_holder = Column(Boolean, default=False)
    phone_number = Column(String(20), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False)
    ministry = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)  # Agriculture, Education, Healthcare, Women Welfare, Employment, Housing, Social Welfare
    description = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    required_documents = Column(Text, default="[]")  # JSON list string
    application_process = Column(Text, nullable=False)
    official_url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    criteria = relationship("SchemeCriteria", back_populates="scheme", uselist=False, cascade="all, delete-orphan")
    eligibility_results = relationship("EligibilityResult", back_populates="scheme", cascade="all, delete-orphan")


class SchemeCriteria(Base):
    __tablename__ = "scheme_criteria"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), unique=True, nullable=False)
    
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    gender = Column(String(20), default="All")  # All, Female, Male
    max_income = Column(Float, nullable=True)
    allowed_categories = Column(Text, default='["All"]')  # JSON list: ["GEN", "OBC", "SC", "ST", "EWS"] or ["All"]
    allowed_states = Column(Text, default='["All"]')       # JSON list: ["All"] or ["Maharashtra", "Bihar", ...]
    allowed_occupations = Column(Text, default='["All"]')  # JSON list
    
    requires_farmer = Column(Boolean, default=False)
    requires_student = Column(Boolean, default=False)
    requires_disabled = Column(Boolean, default=False)
    requires_business = Column(Boolean, default=False)
    requires_bpl = Column(Boolean, default=False)
    min_education = Column(String(50), nullable=True)

    scheme = relationship("Scheme", back_populates="criteria")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)  # Aadhaar, PAN, Income Certificate, Caste Certificate, Residence Certificate, Ration Card, Other
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    ocr_status = Column(String(50), default="pending")  # pending, completed, failed, verified
    raw_text = Column(Text, default="")
    extracted_data = Column(Text, default="{}")  # JSON string
    is_verified = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")


class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=False)
    
    status = Column(String(50), nullable=False)  # "Eligible", "Maybe Eligible", "Not Eligible"
    score = Column(Float, default=0.0)           # 0.0 - 100.0 %
    matched_criteria = Column(Text, default="[]") # JSON list
    failed_criteria = Column(Text, default="[]")  # JSON list
    missing_info = Column(Text, default="[]")     # JSON list
    recommended_docs = Column(Text, default="[]") # JSON list
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="eligibility_results")
    scheme = relationship("Scheme", back_populates="eligibility_results")


class ApplicationHistory(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheme_id = Column(Integer, ForeignKey("schemes.id"), nullable=True)
    
    action_type = Column(String(50), nullable=False)  # "eligibility_check", "applied_external", "document_upload", "profile_update"
    scheme_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="applications")
