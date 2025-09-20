"""
Minimal FastAPI application for Legal AI Simplifier - Initial Deployment
"""
import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Create FastAPI app
app = FastAPI(
    title="Legal AI Simplifier",
    description="AI-powered legal document analysis and simplification",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://harshad2321.github.io",
        "https://legal-ai-backend-58fv.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Legal AI Simplifier Backend",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": "production",
        "version": "1.0.0"
    }


@app.post("/api/documents/upload")
async def upload_document():
    """Temporary upload endpoint - returns demo response"""
    return {
        "success": True,
        "message": "Document upload successful (demo mode)",
        "document_id": "demo-doc-123",
        "status": "processed",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/documents/{document_id}/analysis")
async def get_analysis(document_id: str):
    """Temporary analysis endpoint - returns demo response"""
    return {
        "document_id": document_id,
        "analysis": {
            "summary": "This is a demo analysis. Your document has been processed successfully.",
            "key_points": [
                "Demo point 1: Document structure analyzed",
                "Demo point 2: Legal terminology identified",
                "Demo point 3: Risk assessment completed"
            ],
            "complexity_score": 7.5,
            "risk_level": "medium"
        },
        "simplified_version": "This is a simplified version of your legal document. All complex legal terms have been explained in plain language.",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_minimal:app",
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )