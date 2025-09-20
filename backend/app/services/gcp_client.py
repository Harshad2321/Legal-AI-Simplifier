"""
Google Cloud Platform services client
Handles integration with GCS, Firestore, and Vertex AI
"""
import logging
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

from google.cloud import storage
from google.cloud import firestore
from google.cloud import aiplatform
from google.cloud import translate_v2 as translate
import vertexai
from vertexai.language_models import TextGenerationModel, TextEmbeddingModel

from app.config import settings


logger = logging.getLogger(__name__)


class GCPClient:
    """Google Cloud Platform services client"""
    
    def __init__(self):
        self.storage_client: Optional[storage.Client] = None
        self.firestore_client: Optional[firestore.AsyncClient] = None
        self.translate_client: Optional[translate.Client] = None
        self.bucket: Optional[storage.Bucket] = None
        self.text_model: Optional[TextGenerationModel] = None
        self.embedding_model: Optional[TextEmbeddingModel] = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize all GCP services"""
        if self._initialized:
            return
        
        try:
            # Initialize Vertex AI
            vertexai.init(project=settings.google_cloud_project_id, location="us-central1")
            
            # Initialize storage client
            self.storage_client = storage.Client(project=settings.google_cloud_project_id)
            self.bucket = self.storage_client.bucket(settings.google_cloud_storage_bucket)
            
            # Initialize Firestore client
            self.firestore_client = firestore.AsyncClient(project=settings.google_cloud_project_id)
            
            # Initialize Translate client
            self.translate_client = translate.Client()
            
            # Initialize AI models
            self.text_model = TextGenerationModel.from_pretrained("text-bison@001")
            self.embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@001")
            
            self._initialized = True
            logger.info("GCP services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize GCP services: {e}")
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.firestore_client:
            self.firestore_client.close()
        self._initialized = False
    
    # Storage Operations
    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> str:
        """Upload file to Google Cloud Storage"""
        try:
            blob_name = f"documents/{datetime.utcnow().strftime('%Y/%m/%d')}/{filename}"
            blob = self.bucket.blob(blob_name)
            
            # Upload file in a thread to avoid blocking
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: blob.upload_from_string(file_content, content_type=content_type)
            )
            
            logger.info(f"File uploaded successfully: {blob_name}")
            return blob_name
            
        except Exception as e:
            logger.error(f"Failed to upload file {filename}: {e}")
            raise
    
    async def download_file(self, blob_name: str) -> bytes:
        """Download file from Google Cloud Storage"""
        try:
            blob = self.bucket.blob(blob_name)
            content = await asyncio.get_event_loop().run_in_executor(
                None,
                blob.download_as_bytes
            )
            return content
            
        except Exception as e:
            logger.error(f"Failed to download file {blob_name}: {e}")
            raise
    
    async def delete_file(self, blob_name: str) -> bool:
        """Delete file from Google Cloud Storage"""
        try:
            blob = self.bucket.blob(blob_name)
            await asyncio.get_event_loop().run_in_executor(None, blob.delete)
            logger.info(f"File deleted successfully: {blob_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file {blob_name}: {e}")
            return False
    
    # Firestore Operations
    async def save_document_metadata(self, document_id: str, metadata: Dict[str, Any]) -> bool:
        """Save document metadata to Firestore"""
        try:
            doc_ref = self.firestore_client.collection(settings.documents_collection).document(document_id)
            await doc_ref.set(metadata)
            logger.info(f"Document metadata saved: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save document metadata {document_id}: {e}")
            return False
    
    async def get_document_metadata(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document metadata from Firestore"""
        try:
            doc_ref = self.firestore_client.collection(settings.documents_collection).document(document_id)
            doc = await doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Failed to get document metadata {document_id}: {e}")
            return None
    
    async def update_document_metadata(self, document_id: str, updates: Dict[str, Any]) -> bool:
        """Update document metadata in Firestore"""
        try:
            doc_ref = self.firestore_client.collection(settings.documents_collection).document(document_id)
            await doc_ref.update(updates)
            logger.info(f"Document metadata updated: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update document metadata {document_id}: {e}")
            return False
    
    async def list_documents(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List documents from Firestore"""
        try:
            query = self.firestore_client.collection(settings.documents_collection)
            
            if user_id:
                query = query.where("owner_id", "==", user_id)
            
            query = query.order_by("upload_timestamp", direction=firestore.Query.DESCENDING).limit(limit)
            
            docs = []
            async for doc in query.stream():
                doc_data = doc.to_dict()
                doc_data["document_id"] = doc.id
                docs.append(doc_data)
            
            return docs
            
        except Exception as e:
            logger.error(f"Failed to list documents: {e}")
            return []
    
    # AI Operations
    async def generate_text(self, prompt: str, max_output_tokens: int = 1024, temperature: float = 0.2) -> str:
        """Generate text using Vertex AI PaLM model"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.text_model.predict(
                    prompt,
                    max_output_tokens=max_output_tokens,
                    temperature=temperature
                )
            )
            return response.text
            
        except Exception as e:
            logger.error(f"Failed to generate text: {e}")
            raise
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Vertex AI"""
        try:
            embeddings = []
            # Process in batches to avoid rate limits
            batch_size = 5
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_embeddings = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.embedding_model.get_embeddings(batch)
                )
                embeddings.extend([emb.values for emb in batch_embeddings])
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    async def translate_text(self, text: str, target_language: str, source_language: str = "en") -> str:
        """Translate text using Google Translate"""
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.translate_client.translate(
                    text,
                    target_language=target_language,
                    source_language=source_language
                )
            )
            return result["translatedText"]
            
        except Exception as e:
            logger.error(f"Failed to translate text: {e}")
            return text  # Return original text if translation fails
    
    # Health Check Methods
    async def test_firestore_connection(self) -> bool:
        """Test Firestore connection"""
        try:
            # Try to read from a test collection
            test_ref = self.firestore_client.collection("health_check").document("test")
            await test_ref.get()
            return True
        except Exception:
            return False
    
    async def test_gcs_connection(self) -> bool:
        """Test Google Cloud Storage connection"""
        try:
            # Try to list objects in bucket (with limit 1)
            blobs = list(self.bucket.list_blobs(max_results=1))
            return True
        except Exception:
            return False
    
    async def test_vertex_ai_connection(self) -> bool:
        """Test Vertex AI connection"""
        try:
            # Try a simple text generation
            await self.generate_text("Hello", max_output_tokens=10)
            return True
        except Exception:
            return False