"""
Pydantic models for request/response schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Language(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    SPANISH = "es"
    FRENCH = "fr"


# Request Models
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    document_type: DocumentType
    file_size: int
    upload_timestamp: datetime
    processing_status: str = "processing"
    message: str = "Document uploaded successfully and processing started"


class SummarizeRequest(BaseModel):
    document_id: str
    language: Language = Language.ENGLISH
    max_length: Optional[int] = Field(default=500, ge=100, le=2000)


class SummarizeResponse(BaseModel):
    document_id: str
    summary: str
    language: Language
    word_count: int
    confidence_score: float
    disclaimer: str = "⚠️ Disclaimer: This is AI assistance, not legal advice."


class ClausesRequest(BaseModel):
    document_id: str
    include_explanations: bool = True


class Clause(BaseModel):
    clause_id: str
    title: str
    content: str
    category: str  # "obligation", "risk", "payment", "termination", etc.
    risk_level: RiskLevel
    explanation: Optional[str] = None
    page_number: Optional[int] = None


class ClausesResponse(BaseModel):
    document_id: str
    clauses: List[Clause]
    total_clauses: int
    disclaimer: str = "⚠️ Disclaimer: This is AI assistance, not legal advice."


class AskRequest(BaseModel):
    document_id: str
    question: str = Field(..., min_length=10, max_length=500)
    context_limit: Optional[int] = Field(default=3, ge=1, le=10)


class AskResponse(BaseModel):
    document_id: str
    question: str
    answer: str
    confidence_score: float
    relevant_sections: List[str]
    disclaimer: str = "⚠️ Disclaimer: This is AI assistance, not legal advice."


class AlertsRequest(BaseModel):
    document_id: str
    severity_threshold: Optional[RiskLevel] = RiskLevel.MEDIUM


class Alert(BaseModel):
    alert_id: str
    title: str
    description: str
    risk_level: RiskLevel
    clause_reference: str
    recommendation: str
    page_number: Optional[int] = None


class AlertsResponse(BaseModel):
    document_id: str
    alerts: List[Alert]
    total_alerts: int
    risk_summary: Dict[str, int]  # {"high": 2, "medium": 5, "low": 1}
    disclaimer: str = "⚠️ Disclaimer: This is AI assistance, not legal advice."


# Document Metadata Model
class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    document_type: DocumentType
    file_size: int
    upload_timestamp: datetime
    owner_id: Optional[str] = None
    summary: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    total_pages: Optional[int] = None
    total_clauses: Optional[int] = None
    processing_status: str = "pending"  # pending, processing, completed, failed
    error_message: Optional[str] = None


# Health Check Response
class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: datetime
    version: str = "1.0.0"
    services: Dict[str, str]  # {"firestore": "connected", "gcs": "connected"}


# Error Response
class ErrorResponse(BaseModel):
    error: str
    message: str
    timestamp: datetime
    request_id: Optional[str] = None