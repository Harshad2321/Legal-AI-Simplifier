"""
Document analysis router - handles document summarization, clause analysis, Q&A, and alerts
"""
import logging
import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends

from app.schemas import (
    SummarizeRequest, SummarizeResponse,
    ClausesRequest, ClausesResponse, Clause,
    AskRequest, AskResponse,
    AlertsRequest, AlertsResponse, Alert,
    Language, RiskLevel
)
from app.services.gcp_client import GCPClient
from app.services.vector_store import vector_store


logger = logging.getLogger(__name__)
router = APIRouter()


async def get_gcp_client() -> GCPClient:
    """Dependency to get GCP client"""
    from app.main import get_gcp_client
    return get_gcp_client()


async def ensure_document_processed(document_id: str, gcp_client: GCPClient):
    """Ensure document is fully processed before analysis"""
    metadata = await gcp_client.get_document_metadata(document_id)
    
    if not metadata:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if metadata.get("processing_status") == "processing":
        raise HTTPException(
            status_code=202,
            detail="Document is still being processed. Please try again in a few moments."
        )
    
    if metadata.get("processing_status") == "failed":
        raise HTTPException(
            status_code=422,
            detail=f"Document processing failed: {metadata.get('error_message', 'Unknown error')}"
        )
    
    if metadata.get("processing_status") != "completed":
        raise HTTPException(
            status_code=422,
            detail="Document has not been processed yet"
        )
    
    return metadata


@router.post("/{document_id}/summarize", response_model=SummarizeResponse)
async def summarize_document(
    document_id: str,
    request: SummarizeRequest,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Generate a summary of the legal document in plain language
    Supports multiple languages including English and Hindi
    """
    try:
        # Ensure document is processed
        metadata = await ensure_document_processed(document_id, gcp_client)
        
        # Get existing summary or generate new one
        existing_summary = metadata.get("summary", "")
        
        if not existing_summary:
            # Generate summary from document text
            text_content = metadata.get("text_content", "")
            if not text_content:
                raise HTTPException(status_code=422, detail="Document text not available")
            
            summary_prompt = f"""
            Please provide a comprehensive yet concise summary of this legal document in plain English:
            
            {text_content[:3000]}...
            
            Guidelines:
            - Explain the main purpose and type of document
            - Identify the key parties involved
            - Highlight important obligations and rights
            - Mention significant terms, conditions, or deadlines
            - Note any unusual or risky clauses
            - Use simple, non-legal language that anyone can understand
            - Keep summary between 200-{request.max_length} words
            
            Summary:
            """
            
            existing_summary = await gcp_client.generate_text(
                summary_prompt,
                max_output_tokens=request.max_length * 2
            )
            
            # Update metadata with generated summary
            await gcp_client.update_document_metadata(
                document_id,
                {"summary": existing_summary}
            )
        
        # Translate if requested language is not English
        if request.language != Language.ENGLISH:
            target_lang = "hi" if request.language == Language.HINDI else request.language.value
            translated_summary = await gcp_client.translate_text(
                existing_summary,
                target_language=target_lang,
                source_language="en"
            )
        else:
            translated_summary = existing_summary
        
        # Calculate confidence score based on text length and completeness
        confidence_score = min(0.95, len(translated_summary.split()) / 100)
        
        return SummarizeResponse(
            document_id=document_id,
            summary=translated_summary,
            language=request.language,
            word_count=len(translated_summary.split()),
            confidence_score=confidence_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to summarize document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")


@router.post("/{document_id}/clauses", response_model=ClausesResponse)
async def extract_clauses(
    document_id: str,
    request: ClausesRequest,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Extract and explain key clauses from the legal document
    """
    try:
        # Ensure document is processed
        metadata = await ensure_document_processed(document_id, gcp_client)
        
        # Get existing clauses or generate them
        existing_clauses = metadata.get("clauses", [])
        
        if not existing_clauses:
            # This should not happen as clauses are generated during processing
            raise HTTPException(status_code=422, detail="Clauses not available for this document")
        
        # Convert to Clause objects and add explanations if requested
        clauses = []
        for i, clause_data in enumerate(existing_clauses):
            explanation = None
            
            if request.include_explanations:
                explanation_prompt = f"""
                Explain this legal clause in simple terms that anyone can understand:
                
                Clause: {clause_data.get('content', '')[:500]}
                
                Please explain:
                - What this clause means in plain English
                - What obligations or rights it creates
                - Any potential risks or benefits
                - How it might affect the parties involved
                
                Keep explanation concise (under 150 words) and avoid legal jargon.
                """
                
                explanation = await gcp_client.generate_text(
                    explanation_prompt,
                    max_output_tokens=200
                )
            
            clause = Clause(
                clause_id=clause_data.get("clause_id", f"clause_{i+1}"),
                title=f"Clause {i+1}: {clause_data.get('category', 'General').title()}",
                content=clause_data.get("content", ""),
                category=clause_data.get("category", "general"),
                risk_level=RiskLevel(clause_data.get("risk_level", "low")),
                explanation=explanation,
                page_number=clause_data.get("page_number")
            )
            clauses.append(clause)
        
        return ClausesResponse(
            document_id=document_id,
            clauses=clauses,
            total_clauses=len(clauses)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to extract clauses from document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract clauses")


@router.post("/{document_id}/ask", response_model=AskResponse)
async def ask_question(
    document_id: str,
    request: AskRequest,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Answer questions about the legal document using AI
    """
    try:
        # Ensure document is processed
        metadata = await ensure_document_processed(document_id, gcp_client)
        
        # Generate embedding for the question
        question_embeddings = await gcp_client.generate_embeddings([request.question])
        
        # Search for relevant chunks
        relevant_chunks = await vector_store.search_similar_chunks(
            question_embeddings[0],
            k=request.context_limit,
            document_id=document_id
        )
        
        if not relevant_chunks:
            raise HTTPException(
                status_code=404,
                detail="No relevant content found to answer your question"
            )
        
        # Prepare context from relevant chunks
        context = "\n\n".join([
            f"Section {i+1}: {chunk['text']}"
            for i, chunk in enumerate(relevant_chunks)
        ])
        
        # Generate answer using context
        answer_prompt = f"""
        Based on the following sections from a legal document, please answer the user's question:
        
        Question: {request.question}
        
        Relevant sections:
        {context}
        
        Instructions:
        - Answer the question directly and clearly
        - Use simple language, avoid legal jargon
        - If the answer isn't clear from the provided sections, say so
        - Provide specific references to relevant clauses when possible
        - If there are any risks or important considerations, mention them
        - Keep the answer concise but comprehensive
        
        Answer:
        """
        
        answer = await gcp_client.generate_text(
            answer_prompt,
            max_output_tokens=500,
            temperature=0.1  # Lower temperature for more factual responses
        )
        
        # Calculate confidence based on similarity scores
        avg_similarity = sum(chunk["similarity_score"] for chunk in relevant_chunks) / len(relevant_chunks)
        confidence_score = min(0.95, avg_similarity)
        
        # Extract relevant sections for reference
        relevant_sections = [
            f"{chunk['text'][:200]}..." if len(chunk['text']) > 200 else chunk['text']
            for chunk in relevant_chunks
        ]
        
        return AskResponse(
            document_id=document_id,
            question=request.question,
            answer=answer,
            confidence_score=confidence_score,
            relevant_sections=relevant_sections
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to answer question for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to answer question")


@router.post("/{document_id}/alerts", response_model=AlertsResponse)
async def get_risk_alerts(
    document_id: str,
    request: AlertsRequest,
    gcp_client: GCPClient = Depends(get_gcp_client)
):
    """
    Generate risk alerts and warnings for the legal document
    """
    try:
        # Ensure document is processed
        metadata = await ensure_document_processed(document_id, gcp_client)
        
        # Get document clauses
        clauses = metadata.get("clauses", [])
        text_content = metadata.get("text_content", "")
        
        if not clauses and not text_content:
            raise HTTPException(status_code=422, detail="Document content not available for analysis")
        
        alerts = []
        risk_summary = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        
        # Analyze each clause for risks
        for i, clause_data in enumerate(clauses):
            clause_risk = clause_data.get("risk_level", "low")
            clause_content = clause_data.get("content", "")
            category = clause_data.get("category", "general")
            
            # Skip if below threshold
            risk_enum = RiskLevel(clause_risk)
            if risk_enum.value < request.severity_threshold.value:
                continue
            
            # Generate specific alert for this clause
            alert_prompt = f"""
            Analyze this legal clause for potential risks and provide a specific alert:
            
            Clause Category: {category}
            Clause Content: {clause_content[:400]}
            
            Provide:
            1. A clear title describing the risk
            2. A detailed explanation of why this clause is risky
            3. Specific recommendations for addressing this risk
            
            Focus on practical implications and actionable advice.
            """
            
            alert_analysis = await gcp_client.generate_text(
                alert_prompt,
                max_output_tokens=300
            )
            
            # Parse the generated analysis (simple parsing)
            lines = alert_analysis.strip().split('\n')
            title = f"Risk in {category.title()} Clause"
            description = alert_analysis
            recommendation = "Please review this clause carefully with legal counsel."
            
            # Try to extract structured information
            for line in lines:
                if line.strip().startswith(('Title:', '1.')):
                    title = line.replace('Title:', '').replace('1.', '').strip()
                elif line.strip().startswith(('Recommendation:', '3.')):
                    recommendation = line.replace('Recommendation:', '').replace('3.', '').strip()
            
            alert = Alert(
                alert_id=f"alert_{i+1}",
                title=title,
                description=description,
                risk_level=risk_enum,
                clause_reference=clause_data.get("clause_id", f"clause_{i+1}"),
                recommendation=recommendation,
                page_number=clause_data.get("page_number")
            )
            
            alerts.append(alert)
            risk_summary[clause_risk] += 1
        
        # Add document-level alerts if high risk
        document_risk = metadata.get("risk_level", "low")
        if document_risk in ["high", "critical"]:
            document_alert = Alert(
                alert_id="document_risk_alert",
                title=f"High Risk Document - {document_risk.title()} Risk Level",
                description=f"This document has been classified as {document_risk} risk based on its content analysis. Multiple concerning clauses have been identified that may pose significant legal or financial risks.",
                risk_level=RiskLevel(document_risk),
                clause_reference="document_overall",
                recommendation="Consider thorough legal review before signing. Pay special attention to liability, termination, and payment clauses."
            )
            alerts.insert(0, document_alert)
        
        return AlertsResponse(
            document_id=document_id,
            alerts=alerts,
            total_alerts=len(alerts),
            risk_summary=risk_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate alerts for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate risk alerts")