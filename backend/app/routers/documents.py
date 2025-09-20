"""
Document management router - handles file upload and document operations
"""
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse

from app.schemas import (
    DocumentUploadResponse, DocumentMetadata, DocumentType, RiskLevel
)
from app.services.gcp_client import GCPClient
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import vector_store


logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize document processor
doc_processor = DocumentProcessor()


async def get_gcp_client() -> GCPClient:
    """Dependency to get GCP client"""
    from app.main import get_gcp_client
    return get_gcp_client()


async def process_document_background(
    document_id: str,
    file_content: bytes,
    filename: str,
    document_type: DocumentType,
    gcp_client: GCPClient
):
    """Background task to process uploaded document"""
    try:
        logger.info(f"Starting background processing for document {document_id}")
        
        # Update status to processing
        await gcp_client.update_document_metadata(
            document_id,
            {"processing_status": "processing"}
        )
        
        # Extract text from document
        text, extraction_metadata = await doc_processor.extract_text(file_content, document_type)
        
        # Analyze risk level
        risk_level = doc_processor.analyze_risk_level(text)
        
        # Extract clauses
        clauses = doc_processor.extract_clauses(text)
        
        # Chunk text for embeddings
        chunks = doc_processor.chunk_text(text)
        
        # Generate embeddings for chunks
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = await gcp_client.generate_embeddings(chunk_texts)
        
        # Store chunks and embeddings in vector store
        await vector_store.add_document_chunks(document_id, chunks, embeddings)
        
        # Generate summary
        summary_prompt = f"""
        Please provide a concise summary of this legal document in plain English:
        
        {text[:2000]}...
        
        Focus on:
        - Main purpose of the document
        - Key parties involved
        - Important obligations
        - Notable terms or conditions
        
        Keep the summary under 300 words and use simple language.
        """
        
        summary = await gcp_client.generate_text(summary_prompt, max_output_tokens=500)
        
        # Update document metadata with processing results
        updates = {
            "processing_status": "completed",
            "summary": summary,
            "risk_level": risk_level.value,
            "total_pages": extraction_metadata.get("total_pages", 0),
            "total_clauses": len(clauses),
            "text_content": text,  # Store full text for analysis
            "clauses": clauses,
            "chunks_count": len(chunks),
            "processed_at": datetime.utcnow()
        }
        
        await gcp_client.update_document_metadata(document_id, updates)
        
        logger.info(f"Document {document_id} processed successfully")
        
    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {e}")
        
        # Update status to failed
        await gcp_client.update_document_metadata(
            document_id,
            {
                "processing_status": "failed",
                "error_message": str(e)
            }
        )


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Upload a legal document for processing
    
    Accepts PDF, DOCX, and TXT files up to 10MB
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        # Check file size (10MB limit)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Detect document type
        document_type = doc_processor.detect_document_type(file_content, file.filename)
        
        # Validate document type
        if document_type not in [DocumentType.PDF, DocumentType.DOCX, DocumentType.TXT]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Please upload PDF, DOCX, or TXT files only"
            )
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Upload file to Google Cloud Storage
        blob_name = await gcp_client.upload_file(
            file_content,
            f"{document_id}_{file.filename}",
            file.content_type or "application/octet-stream"
        )
        
        # Create document metadata
        metadata = DocumentMetadata(
            document_id=document_id,
            filename=file.filename,
            document_type=document_type,
            file_size=len(file_content),
            upload_timestamp=datetime.utcnow(),
            processing_status="pending"
        )
        
        # Save metadata to Firestore
        await gcp_client.save_document_metadata(document_id, metadata.dict())
        
        # Start background processing
        background_tasks.add_task(
            process_document_background,
            document_id,
            file_content,
            file.filename,
            document_type,
            gcp_client
        )
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            document_type=document_type,
            file_size=len(file_content),
            upload_timestamp=datetime.utcnow(),
            processing_status="pending",
            message="Document uploaded successfully and processing started"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload document: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload document")


@router.get("/list")
async def list_documents(
    limit: int = 50,
    user_id: Optional[str] = None,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    List uploaded documents
    """
    try:
        documents = await gcp_client.list_documents(user_id=user_id, limit=limit)
        return {
            "documents": documents,
            "total": len(documents)
        }
        
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents")


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Get document metadata and processing status
    """
    try:
        metadata = await gcp_client.get_document_metadata(document_id)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document")


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Delete a document and all associated data
    """
    try:
        # Get document metadata
        metadata = await gcp_client.get_document_metadata(document_id)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from vector store
        await vector_store.delete_document_chunks(document_id)
        
        # Delete file from GCS (if blob_name is stored in metadata)
        # This would require storing the blob_name in metadata during upload
        
        # Delete metadata from Firestore
        doc_ref = gcp_client.firestore_client.collection("documents").document(document_id)
        await doc_ref.delete()
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")


@router.get("/{document_id}/status")
async def get_processing_status(
    document_id: str,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Get document processing status
    """
    try:
        metadata = await gcp_client.get_document_metadata(document_id)
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "document_id": document_id,
            "status": metadata.get("processing_status", "unknown"),
            "error_message": metadata.get("error_message"),
            "processed_at": metadata.get("processed_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get processing status for {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get processing status")