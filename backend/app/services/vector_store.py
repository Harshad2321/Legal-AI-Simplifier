"""
Vector store service using FAISS for document embeddings and similarity search
"""
import logging
import json
import os
import pickle
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

import faiss

from app.config import settings


logger = logging.getLogger(__name__)


class VectorStore:
    """FAISS-based vector store for document embeddings"""
    
    def __init__(self, dimension: int = None):
        self.dimension = dimension or settings.vector_dimension
        self.index: Optional[faiss.Index] = None
        self.document_chunks: Dict[int, Dict[str, Any]] = {}
        self.chunk_id_to_index: Dict[str, int] = {}
        self.index_to_chunk_id: Dict[int, str] = {}
        self.next_index = 0
        self.index_file = "data/vector_index.faiss"
        self.metadata_file = "data/vector_metadata.pkl"
        

        os.makedirs("data", exist_ok=True)
        

        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize FAISS index"""
        try:

            if os.path.exists(self.index_file) and os.path.exists(self.metadata_file):
                self.load_index()
            else:

                self.index = faiss.IndexFlatL2(self.dimension)
                logger.info(f"Created new FAISS index with dimension {self.dimension}")
        except Exception as e:
            logger.error(f"Failed to initialize FAISS index: {e}")
            # Fallback to new index
            self.index = faiss.IndexFlatL2(self.dimension)
    
    def save_index(self):
        """Save FAISS index and metadata to disk"""
        try:
            # Save FAISS index
            faiss.write_index(self.index, self.index_file)
            
            # Save metadata
            metadata = {
                "document_chunks": self.document_chunks,
                "chunk_id_to_index": self.chunk_id_to_index,
                "index_to_chunk_id": self.index_to_chunk_id,
                "next_index": self.next_index
            }
            
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(metadata, f)
            
            logger.info("Vector index saved successfully")
            
        except Exception as e:
            logger.error(f"Failed to save vector index: {e}")
    
    def load_index(self):
        """Load FAISS index and metadata from disk"""
        try:
            # Load FAISS index
            self.index = faiss.read_index(self.index_file)
            
            # Load metadata
            with open(self.metadata_file, 'rb') as f:
                metadata = pickle.load(f)
            
            self.document_chunks = metadata.get("document_chunks", {})
            self.chunk_id_to_index = metadata.get("chunk_id_to_index", {})
            self.index_to_chunk_id = metadata.get("index_to_chunk_id", {})
            self.next_index = metadata.get("next_index", 0)
            
            logger.info(f"Vector index loaded successfully. Contains {self.index.ntotal} vectors")
            
        except Exception as e:
            logger.error(f"Failed to load vector index: {e}")
            # Fallback to new index
            self.index = faiss.IndexFlatL2(self.dimension)
    
    async def add_document_chunks(self, document_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> bool:
        """Add document chunks and their embeddings to the vector store"""
        try:
            if len(chunks) != len(embeddings):
                raise ValueError("Number of chunks must match number of embeddings")
            
            # Convert embeddings to numpy array
            embeddings_array = np.array(embeddings, dtype=np.float32)
            
            # Add embeddings to FAISS index
            start_index = self.next_index
            self.index.add(embeddings_array)
            
            # Store chunk metadata
            for i, chunk in enumerate(chunks):
                index_id = start_index + i
                chunk_id = f"{document_id}_chunk_{chunk['chunk_id']}"
                
                # Store chunk data with additional metadata
                chunk_data = {
                    **chunk,
                    "document_id": document_id,
                    "chunk_id": chunk_id,
                    "vector_index": index_id
                }
                
                self.document_chunks[index_id] = chunk_data
                self.chunk_id_to_index[chunk_id] = index_id
                self.index_to_chunk_id[index_id] = chunk_id
            
            self.next_index += len(chunks)
            
            # Save to disk
            self.save_index()
            
            logger.info(f"Added {len(chunks)} chunks for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add document chunks: {e}")
            return False
    
    async def search_similar_chunks(self, query_embedding: List[float], k: int = 5, 
                                   document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar chunks based on query embedding"""
        try:
            if self.index.ntotal == 0:
                return []
            
            # Convert query embedding to numpy array
            query_vector = np.array([query_embedding], dtype=np.float32)
            
            # Search in FAISS index
            # Use more results initially in case we need to filter by document_id
            search_k = k * 10 if document_id else k
            distances, indices = self.index.search(query_vector, min(search_k, self.index.ntotal))
            
            results = []
            for distance, index in zip(distances[0], indices[0]):
                if index == -1:  # FAISS returns -1 for empty results
                    continue
                
                chunk_data = self.document_chunks.get(index, {})
                if not chunk_data:
                    continue
                
                # Filter by document_id if specified
                if document_id and chunk_data.get("document_id") != document_id:
                    continue
                
                result = {
                    **chunk_data,
                    "similarity_score": float(1 / (1 + distance)),  # Convert distance to similarity
                    "distance": float(distance)
                }
                results.append(result)
                
                if len(results) >= k:
                    break
            
            # Sort by similarity score (descending)
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            
            return results[:k]
            
        except Exception as e:
            logger.error(f"Failed to search similar chunks: {e}")
            return []
    
    async def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a specific document"""
        try:
            chunks = []
            for chunk_data in self.document_chunks.values():
                if chunk_data.get("document_id") == document_id:
                    chunks.append(chunk_data)
            
            # Sort by chunk_id for consistent ordering
            chunks.sort(key=lambda x: x.get("chunk_id", 0))
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to get document chunks: {e}")
            return []
    
    async def delete_document_chunks(self, document_id: str) -> bool:
        """Delete all chunks for a specific document"""
        try:
            indices_to_remove = []
            chunk_ids_to_remove = []
            
            # Find all indices and chunk IDs for this document
            for index_id, chunk_data in list(self.document_chunks.items()):
                if chunk_data.get("document_id") == document_id:
                    indices_to_remove.append(index_id)
                    chunk_ids_to_remove.append(chunk_data.get("chunk_id"))
            
            if not indices_to_remove:
                logger.warning(f"No chunks found for document {document_id}")
                return True
            
            # Remove from metadata
            for index_id in indices_to_remove:
                self.document_chunks.pop(index_id, None)
                chunk_id = self.index_to_chunk_id.pop(index_id, None)
                if chunk_id:
                    self.chunk_id_to_index.pop(chunk_id, None)
            
            # Note: FAISS doesn't support individual vector deletion efficiently
            # For production, consider rebuilding the index periodically
            # or using a more sophisticated approach
            
            logger.info(f"Deleted {len(indices_to_remove)} chunks for document {document_id}")
            
            # Save updated metadata
            self.save_index()
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document chunks: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            # Count documents
            document_ids = set()
            for chunk_data in self.document_chunks.values():
                document_ids.add(chunk_data.get("document_id"))
            
            return {
                "total_vectors": self.index.ntotal if self.index else 0,
                "total_chunks": len(self.document_chunks),
                "total_documents": len(document_ids),
                "dimension": self.dimension,
                "index_type": type(self.index).__name__ if self.index else "None"
            }
            
        except Exception as e:
            logger.error(f"Failed to get vector store stats: {e}")
            return {}
    
    async def rebuild_index(self) -> bool:
        """Rebuild the FAISS index (useful for cleanup after deletions)"""
        try:
            if not self.document_chunks:
                # Empty index
                self.index = faiss.IndexFlatL2(self.dimension)
                self.next_index = 0
                self.save_index()
                return True
            
            # Get all embeddings (this would require re-generating embeddings)
            # For now, this is a placeholder - in production, you'd store embeddings separately
            logger.warning("Index rebuild requires re-generating embeddings")
            return False
            
        except Exception as e:
            logger.error(f"Failed to rebuild index: {e}")
            return False


# Global vector store instance
vector_store = VectorStore()