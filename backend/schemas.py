import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "citizen"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Citizen Profile Schemas
class CitizenProfileBase(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = "Male"
    state: Optional[str] = "National"
    district: Optional[str] = ""
    occupation: Optional[str] = "Other"
    annual_income: Optional[float] = 0.0
    category: Optional[str] = "GEN"
    education_level: Optional[str] = "12th Pass"
    is_disabled: Optional[bool] = False
    disability_percentage: Optional[float] = 0.0
    is_farmer: Optional[bool] = False
    land_holding_hectares: Optional[float] = 0.0
    is_student: Optional[bool] = False
    is_business_owner: Optional[bool] = False
    marital_status: Optional[str] = "Single"
    bpl_card_holder: Optional[bool] = False
    phone_number: Optional[str] = None

class CitizenProfileUpdate(CitizenProfileBase):
    pass

class CitizenProfileResponse(CitizenProfileBase):
    id: int
    user_id: int
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Scheme Criteria Schemas
class SchemeCriteriaBase(BaseModel):
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    gender: Optional[str] = "All"
    max_income: Optional[float] = None
    allowed_categories: Optional[List[str]] = ["All"]
    allowed_states: Optional[List[str]] = ["All"]
    allowed_occupations: Optional[List[str]] = ["All"]
    requires_farmer: Optional[bool] = False
    requires_student: Optional[bool] = False
    requires_disabled: Optional[bool] = False
    requires_business: Optional[bool] = False
    requires_bpl: Optional[bool] = False
    min_education: Optional[str] = None

class SchemeCriteriaResponse(SchemeCriteriaBase):
    id: int
    scheme_id: int

    class Config:
        from_attributes = True

# Scheme Schemas
class SchemeBase(BaseModel):
    name: str
    code: str
    ministry: str
    category: str
    description: str
    benefits: str
    required_documents: Optional[List[str]] = []
    application_process: str
    official_url: str
    is_active: Optional[bool] = True

class SchemeCreate(SchemeBase):
    criteria: Optional[SchemeCriteriaBase] = None

class SchemeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    ministry: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    benefits: Optional[str] = None
    required_documents: Optional[List[str]] = None
    application_process: Optional[str] = None
    official_url: Optional[str] = None
    is_active: Optional[bool] = None
    criteria: Optional[SchemeCriteriaBase] = None

class SchemeResponse(SchemeBase):
    id: int
    created_at: datetime.datetime
    criteria: Optional[SchemeCriteriaResponse] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    user_id: int
    doc_type: str
    file_name: str
    file_size: int
    mime_type: str
    ocr_status: str
    is_verified: bool
    uploaded_at: datetime.datetime
    extracted_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class DocumentAnalysisResponse(BaseModel):
    id: int
    doc_type: str
    file_name: str
    ocr_status: str
    raw_text: str
    extracted_fields: Dict[str, Any]
    confidence_score: float
    missing_fields: List[str]
    validation_warnings: List[str]
    is_verified: bool

# Eligibility Schemas
class SchemeWithEligibility(SchemeResponse):
    status: str  # "Eligible", "Maybe Eligible", "Not Eligible"
    score: float
    matched_criteria: List[str]
    failed_criteria: List[str]
    missing_info: List[str]
    recommended_docs: List[str]

class EligibilityResultResponse(BaseModel):
    id: int
    user_id: int
    scheme_id: int
    scheme_name: Optional[str] = None
    scheme_code: Optional[str] = None
    scheme_category: Optional[str] = None
    scheme_benefits: Optional[str] = None
    status: str
    score: float
    matched_criteria: List[str]
    failed_criteria: List[str]
    missing_info: List[str]
    recommended_docs: List[str]
    evaluated_at: datetime.datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: Optional[str] = "general"
    suggestions: Optional[List[str]] = []
    schemes: Optional[List[Dict[str, Any]]] = []

# History Schemas
class ApplicationHistoryResponse(BaseModel):
    id: int
    user_id: int
    scheme_id: Optional[int] = None
    scheme_name: Optional[str] = None
    action_type: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Dashboard & Stats Schemas
class CitizenDashboardStats(BaseModel):
    total_schemes: int
    eligible_schemes_count: int
    maybe_eligible_count: int
    not_eligible_count: int
    documents_count: int
    verified_documents_count: int
    profile_completion_percent: int
    recent_evaluations: List[EligibilityResultResponse]

class AdminStatsResponse(BaseModel):
    total_users: int
    total_citizens: int
    total_schemes: int
    active_schemes: int
    total_documents: int
    total_evaluations: int
    category_distribution: Dict[str, int]
    eligibility_distribution: Dict[str, int]
    recent_users: List[UserResponse]
