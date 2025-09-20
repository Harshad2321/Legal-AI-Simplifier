// Type definitions for the Legal AI Simplifier application

export interface Document {
  document_id: string;
  filename: string;
  document_type: 'pdf' | 'docx' | 'txt';
  file_size: number;
  upload_timestamp: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  risk_level?: RiskLevel;
  total_pages?: number;
  total_clauses?: number;
  error_message?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type Language = 'en' | 'hi' | 'es' | 'fr';

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  document_type: string;
  file_size: number;
  upload_timestamp: string;
  processing_status: string;
  message: string;
}

export interface SummaryRequest {
  document_id: string;
  language: Language;
  max_length?: number;
}

export interface SummaryResponse {
  document_id: string;
  summary: string;
  language: Language;
  word_count: number;
  confidence_score: number;
  disclaimer: string;
}

export interface Clause {
  clause_id: string;
  title: string;
  content: string;
  category: string;
  risk_level: RiskLevel;
  explanation?: string;
  page_number?: number;
}

export interface ClausesRequest {
  document_id: string;
  include_explanations: boolean;
}

export interface ClausesResponse {
  document_id: string;
  clauses: Clause[];
  total_clauses: number;
  disclaimer: string;
}

export interface AskRequest {
  document_id: string;
  question: string;
  context_limit?: number;
}

export interface AskResponse {
  document_id: string;
  question: string;
  answer: string;
  confidence_score: number;
  relevant_sections: string[];
  disclaimer: string;
}

export interface Alert {
  alert_id: string;
  title: string;
  description: string;
  risk_level: RiskLevel;
  clause_reference: string;
  recommendation: string;
  page_number?: number;
}

export interface AlertsRequest {
  document_id: string;
  severity_threshold?: RiskLevel;
}

export interface AlertsResponse {
  document_id: string;
  alerts: Alert[];
  total_alerts: number;
  risk_summary: Record<string, number>;
  disclaimer: string;
}

export interface DocumentStatus {
  document_id: string;
  status: string;
  error_message?: string;
  processed_at?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  request_id?: string;
}

// UI State interfaces
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}

export interface DocumentAnalysis {
  summary?: SummaryResponse;
  clauses?: ClausesResponse;
  alerts?: AlertsResponse;
  isLoading: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  confidence_score?: number;
  relevant_sections?: string[];
}

// Component props interfaces
export interface FileUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
  error?: string;
}

export interface DocumentCardProps {
  document: Document;
  onSelect: (document: Document) => void;
  onDelete: (documentId: string) => void;
}

export interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface LanguageSelectorProps {
  selected: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}