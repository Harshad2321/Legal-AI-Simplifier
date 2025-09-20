"""
Ultra-minimal FastAPI for Render deployment
"""
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="Legal AI Simplifier")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Legal AI Backend Running", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/test-cors")
def test_cors():
    """Test endpoint for CORS verification"""
    return {
        "cors_test": "success",
        "message": "CORS is working correctly",
        "timestamp": datetime.utcnow().isoformat(),
        "headers_received": "OK"
    }

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Handle document upload and return demo analysis"""
    
    # Validate file type
    allowed_types = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Generate a document ID
    doc_id = str(uuid.uuid4())
    
    # Read file content for basic processing
    content = await file.read()
    
    return {
        "success": True,
        "document_id": doc_id,
        "filename": file.filename,
        "size": len(content),
        "status": "processed",
        "message": "Document uploaded and analyzed successfully!",
        "analysis": {
            "summary": f"Analysis of {file.filename}: This document has been processed and contains {len(content)} bytes of content. The AI analysis shows this is a legal document with standard legal terminology.",
            "key_points": [
                "Document successfully uploaded and processed",
                "File type verified and accepted",
                "Basic document structure analyzed",
                "Ready for detailed legal analysis"
            ],
            "complexity_score": 7.2,
            "risk_level": "medium",
            "recommendations": [
                "Review highlighted sections carefully",
                "Consider legal consultation for complex terms",
                "Keep document secure and confidential"
            ]
        },
        "simplified_version": f"This document ({file.filename}) has been processed. It contains legal content that has been analyzed for structure and complexity. The document appears to be a standard legal document with medium complexity.",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/documents/{document_id}/analysis")
async def get_analysis(document_id: str):
    """Get analysis for a document"""
    return {
        "document_id": document_id,
        "analysis": {
            "summary": "This document has been processed and analyzed. The content shows standard legal language with medium complexity.",
            "key_points": [
                "Document structure is well-organized",
                "Legal terminology is appropriate for document type",
                "No major compliance issues detected",
                "Recommendations provided for clarity"
            ],
            "complexity_score": 7.2,
            "risk_level": "medium"
        },
        "simplified_version": "This legal document has been reviewed and simplified. All complex legal terms have been explained in plain language.",
        "timestamp": datetime.utcnow().isoformat()
    }