"""
Configuration management for Legal AI Simplifier Backend
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Google Cloud Configuration
    google_cloud_project_id: str = "your-project-id"
    google_cloud_storage_bucket: str = "legal-ai-documents"
    google_application_credentials: Optional[str] = None
    
    # Firestore Collections
    documents_collection: str = "documents"
    users_collection: str = "users"
    
    # API Configuration
    api_version: str = "v1"
    api_title: str = "Legal AI Simplifier API"
    api_description: str = "AI-powered legal document analysis and simplification"
    
    # Vector Store Configuration
    vector_dimension: int = 384
    max_chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Development
    debug: bool = True
    log_level: str = "INFO"
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()