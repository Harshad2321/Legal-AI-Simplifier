"""
Document processing service for text extraction, chunking, and analysis
"""
import logging
import io
import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

import PyPDF2
from docx import Document
import magic

from app.config import settings
from app.schemas import DocumentType, RiskLevel


logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Document processing and text extraction service"""
    
    def __init__(self):
        # Risk patterns for legal document analysis
        self.risk_patterns = {
            "high": [
                r"penalty|penalties|fine|fines",
                r"termination.*without.*notice",
                r"liquidated.*damages",
                r"indemnif(y|ication)",
                r"liability.*unlimited",
                r"personal.*guarantee",
                r"automatic.*renewal",
                r"non-compete|non.*compete",
                r"exclusive.*jurisdiction",
                r"waiver.*of.*rights"
            ],
            "medium": [
                r"arbitration.*mandatory",
                r"governing.*law",
                r"force.*majeure",
                r"confidentiality|non.*disclosure",
                r"intellectual.*property",
                r"assignment.*prohibited",
                r"modification.*writing",
                r"entire.*agreement",
                r"severability",
                r"notice.*requirements"
            ],
            "critical": [
                r"unlimited.*liability",
                r"criminal.*liability",
                r"personal.*assets.*at.*risk",
                r"immediate.*termination.*without.*cause",
                r"waive.*all.*rights",
                r"hold.*harmless.*any.*and.*all",
                r"joint.*and.*several.*liability",
                r"successor.*and.*assigns.*bound"
            ]
        }
        
        # Clause categories
        self.clause_categories = {
            "payment": [
                r"payment|pay|fee|cost|price|amount|invoice|billing",
                r"installment|deposit|advance|refund|reimbursement"
            ],
            "termination": [
                r"termination|terminate|end|expire|expiry|dissolution",
                r"breach|default|violation|non-compliance"
            ],
            "liability": [
                r"liability|liable|responsible|damages|loss|harm",
                r"indemnif|hold.*harmless|compensation"
            ],
            "intellectual_property": [
                r"intellectual.*property|copyright|trademark|patent",
                r"proprietary|confidential|trade.*secret"
            ],
            "obligation": [
                r"shall|must|required|obligation|duty|covenant",
                r"undertake|agree.*to|commit.*to"
            ],
            "warranty": [
                r"warrant|guarantee|represent|assure|promise",
                r"condition|quality|fitness.*for.*purpose"
            ]
        }
    
    def detect_document_type(self, file_content: bytes, filename: str) -> DocumentType:
        """Detect document type from content and filename"""
        try:
            # Use python-magic to detect MIME type
            mime_type = magic.from_buffer(file_content, mime=True)
            
            if mime_type == "application/pdf":
                return DocumentType.PDF
            elif mime_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
                return DocumentType.DOCX
            elif filename.lower().endswith('.pdf'):
                return DocumentType.PDF
            elif filename.lower().endswith('.docx'):
                return DocumentType.DOCX
            elif filename.lower().endswith('.txt'):
                return DocumentType.TXT
            else:
                # Default to text for unknown types
                return DocumentType.TXT
                
        except Exception as e:
            logger.warning(f"Could not detect document type: {e}")
            # Fallback to filename extension
            if filename.lower().endswith('.pdf'):
                return DocumentType.PDF
            elif filename.lower().endswith('.docx'):
                return DocumentType.DOCX
            else:
                return DocumentType.TXT
    
    async def extract_text(self, file_content: bytes, document_type: DocumentType) -> Tuple[str, Dict[str, Any]]:
        """Extract text from document and return metadata"""
        try:
            if document_type == DocumentType.PDF:
                return await self._extract_pdf_text(file_content)
            elif document_type == DocumentType.DOCX:
                return await self._extract_docx_text(file_content)
            elif document_type == DocumentType.TXT:
                return await self._extract_txt_text(file_content)
            else:
                raise ValueError(f"Unsupported document type: {document_type}")
                
        except Exception as e:
            logger.error(f"Failed to extract text: {e}")
            raise
    
    async def _extract_pdf_text(self, file_content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from PDF file"""
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        page_texts = []
        
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            page_texts.append(page_text)
            text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
        
        metadata = {
            "total_pages": len(pdf_reader.pages),
            "page_texts": page_texts,
            "extraction_method": "PyPDF2"
        }
        
        return text, metadata
    
    async def _extract_docx_text(self, file_content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from DOCX file"""
        docx_file = io.BytesIO(file_content)
        doc = Document(docx_file)
        
        text = ""
        paragraphs = []
        
        for paragraph in doc.paragraphs:
            para_text = paragraph.text.strip()
            if para_text:
                paragraphs.append(para_text)
                text += para_text + "\n"
        
        metadata = {
            "total_paragraphs": len(paragraphs),
            "paragraphs": paragraphs,
            "extraction_method": "python-docx"
        }
        
        return text, metadata
    
    async def _extract_txt_text(self, file_content: bytes) -> Tuple[str, Dict[str, Any]]:
        """Extract text from TXT file"""
        try:
            text = file_content.decode('utf-8')
        except UnicodeDecodeError:
            # Try with latin-1 encoding
            text = file_content.decode('latin-1')
        
        lines = text.split('\n')
        
        metadata = {
            "total_lines": len(lines),
            "encoding": "utf-8",
            "extraction_method": "direct"
        }
        
        return text, metadata
    
    def chunk_text(self, text: str, chunk_size: int = None, overlap: int = None) -> List[Dict[str, Any]]:
        """Split text into chunks for processing"""
        chunk_size = chunk_size or settings.max_chunk_size
        overlap = overlap or settings.chunk_overlap
        
        # Clean and normalize text
        text = self._clean_text(text)
        
        # Split into sentences for better chunking
        sentences = self._split_into_sentences(text)
        
        chunks = []
        current_chunk = ""
        current_chunk_sentences = []
        chunk_id = 0
        
        for sentence in sentences:
            # Check if adding this sentence would exceed chunk size
            if len(current_chunk + " " + sentence) > chunk_size and current_chunk:
                # Save current chunk
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": current_chunk.strip(),
                    "sentences": current_chunk_sentences.copy(),
                    "start_char": len(text) - len(" ".join(sentences[len(current_chunk_sentences):])),
                    "end_char": len(text) - len(" ".join(sentences[len(current_chunk_sentences):]))
                })
                
                chunk_id += 1
                
                # Start new chunk with overlap
                overlap_sentences = current_chunk_sentences[-overlap//100:] if overlap > 0 else []
                current_chunk = " ".join(overlap_sentences)
                current_chunk_sentences = overlap_sentences.copy()
            
            current_chunk += " " + sentence if current_chunk else sentence
            current_chunk_sentences.append(sentence)
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append({
                "chunk_id": chunk_id,
                "text": current_chunk.strip(),
                "sentences": current_chunk_sentences,
                "start_char": 0,  # Simplified for final chunk
                "end_char": len(current_chunk)
            })
        
        return chunks
    
    def analyze_risk_level(self, text: str) -> RiskLevel:
        """Analyze document risk level based on content"""
        text_lower = text.lower()
        
        critical_score = sum(1 for pattern in self.risk_patterns["critical"] 
                           if re.search(pattern, text_lower, re.IGNORECASE))
        
        high_score = sum(1 for pattern in self.risk_patterns["high"] 
                        if re.search(pattern, text_lower, re.IGNORECASE))
        
        medium_score = sum(1 for pattern in self.risk_patterns["medium"] 
                          if re.search(pattern, text_lower, re.IGNORECASE))
        
        # Determine risk level based on scores
        if critical_score > 0:
            return RiskLevel.CRITICAL
        elif high_score >= 3:
            return RiskLevel.HIGH
        elif high_score >= 1 or medium_score >= 5:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def extract_clauses(self, text: str) -> List[Dict[str, Any]]:
        """Extract and categorize clauses from document"""
        clauses = []
        
        # Split text into potential clauses (by paragraphs/sections)
        sections = self._split_into_sections(text)
        
        for i, section in enumerate(sections):
            if len(section.strip()) < 50:  # Skip very short sections
                continue
            
            clause = {
                "clause_id": f"clause_{i+1}",
                "content": section.strip(),
                "category": self._categorize_clause(section),
                "risk_level": self._analyze_clause_risk(section),
                "position": i
            }
            
            clauses.append(clause)
        
        return clauses
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page headers/footers patterns
        text = re.sub(r'--- Page \d+ ---', '', text)
        
        # Fix common OCR issues
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
        
        return text.strip()
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting (can be improved with NLTK)
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _split_into_sections(self, text: str) -> List[str]:
        """Split text into sections/clauses"""
        # Split by common legal section markers
        sections = re.split(r'\n\s*\n|\d+\.\s+|\([a-z]\)\s+|\([ivx]+\)\s+', text)
        return [s.strip() for s in sections if s.strip()]
    
    def _categorize_clause(self, clause_text: str) -> str:
        """Categorize a clause based on its content"""
        clause_lower = clause_text.lower()
        
        for category, patterns in self.clause_categories.items():
            for pattern in patterns:
                if re.search(pattern, clause_lower, re.IGNORECASE):
                    return category
        
        return "general"
    
    def _analyze_clause_risk(self, clause_text: str) -> RiskLevel:
        """Analyze risk level of a specific clause"""
        clause_lower = clause_text.lower()
        
        for risk_level, patterns in self.risk_patterns.items():
            for pattern in patterns:
                if re.search(pattern, clause_lower, re.IGNORECASE):
                    if risk_level == "critical":
                        return RiskLevel.CRITICAL
                    elif risk_level == "high":
                        return RiskLevel.HIGH
                    elif risk_level == "medium":
                        return RiskLevel.MEDIUM
        
        return RiskLevel.LOW