// API configuration and base URL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const API_VERSION = 'v1';

// API endpoints
export const ENDPOINTS = {
  // Document endpoints
  UPLOAD_DOCUMENT: `/api/${API_VERSION}/documents/upload`,
  LIST_DOCUMENTS: `/api/${API_VERSION}/documents/list`,
  GET_DOCUMENT: (id: string) => `/api/${API_VERSION}/documents/${id}`,
  DELETE_DOCUMENT: (id: string) => `/api/${API_VERSION}/documents/${id}`,
  DOCUMENT_STATUS: (id: string) => `/api/${API_VERSION}/documents/${id}/status`,
  
  // Analysis endpoints
  SUMMARIZE: (id: string) => `/api/${API_VERSION}/analysis/${id}/summarize`,
  CLAUSES: (id: string) => `/api/${API_VERSION}/analysis/${id}/clauses`,
  ASK_QUESTION: (id: string) => `/api/${API_VERSION}/analysis/${id}/ask`,
  ALERTS: (id: string) => `/api/${API_VERSION}/analysis/${id}/alerts`,
  
  // Health check
  HEALTH: '/health',
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  ACCEPTED_EXTENSIONS: ['.pdf', '.docx', '.txt'],
};

// Risk level colors and labels
export const RISK_LEVELS = {
  low: {
    color: 'green',
    label: 'Low Risk',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
  medium: {
    color: 'yellow',
    label: 'Medium Risk',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
  },
  high: {
    color: 'red',
    label: 'High Risk',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
  },
  critical: {
    color: 'red',
    label: 'Critical Risk',
    bgColor: 'bg-red-200',
    textColor: 'text-red-900',
    borderColor: 'border-red-300',
  },
};

// Language options for summaries
export const LANGUAGES = {
  en: { label: 'English', flag: '🇺🇸' },
  hi: { label: 'Hindi', flag: '🇮🇳' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  fr: { label: 'French', flag: '🇫🇷' },
};

// Processing status labels
export const PROCESSING_STATUS = {
  pending: { label: 'Pending', color: 'gray' },
  processing: { label: 'Processing', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

// Demo mode configuration
export const DEMO_CONFIG = {
  AUTO_UPLOAD_DELAY: 2000,
  TYPING_SPEED: 50,
  ANIMATION_DURATION: 300,
};