export const API_BASE_URL = 'https://legal-ai-backend-58fv.onrender.com';
export const API_VERSION = '';

export
const ENDPOINTS = {
  UPLOAD_DOCUMENT: `/api/documents/upload`,
  LIST_DOCUMENTS: `/api/documents/list`,
  GET_DOCUMENT: (id: string) => `/api/documents/${id}`,
  DELETE_DOCUMENT: (id: string) => `/api/documents/${id}`,
  DOCUMENT_STATUS: (id: string) => `/api/documents/${id}/status`,
  SUMMARIZE: (id: string) => `/api/analysis/${id}/summarize`,
  CLAUSES: (id: string) => `/api/analysis/${id}/clauses`,
  SIMPLIFY: (id: string) => `/api/analysis/${id}/simplify`,
  ASK_QUESTION: (id: string) => `/api/analysis/${id}/question`,
  ALERTS: (id: string) => `/api/analysis/${id}/alerts`,
  HEALTH: `/api/health`,
};

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024,
  ACCEPTED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  ACCEPTED_EXTENSIONS: ['.pdf', '.docx', '.txt'],
};

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

export const LANGUAGES = {
  en: { label: 'English', flag: 'US' },
  hi: { label: 'Hindi', flag: 'IN' },
  es: { label: 'Spanish', flag: 'ES' },
  fr: { label: 'French', flag: 'FR' },
};

export const PROCESSING_STATUS = {
  pending: { label: 'Pending', color: 'gray' },
  processing: { label: 'Processing', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
};

export const DEMO_CONFIG = {
  AUTO_UPLOAD_DELAY: 2000,
  TYPING_SPEED: 50,
  ANIMATION_DURATION: 300,
};