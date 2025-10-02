import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { 
  Document, 
  DocumentUploadResponse, 
  SummaryRequest, 
  SummaryResponse,
  ClausesRequest,
  ClausesResponse,
  AskRequest,
  AskResponse,
  AlertsRequest,
  AlertsResponse,
  DocumentStatus,
  HealthResponse
} from '../types';
import { shouldUseDemoMode } from '../config';
import { MockApiService } from './mockApi';

const API_BASE_URL = 'https://legal-ai-backend-58fv.onrender.com';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response) {

      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      switch (status) {
        case 400:
          toast.error(`Bad Request: ${message}`);
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          toast.error(`Validation Error: ${message}`);
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        case 503:
          toast.error('Service unavailable. Please try again later.');
          break;
        default:
          toast.error(`Error: ${message}`);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);


    const response = await this.client.post<any>(
      '/api/documents/upload',
      formData
    );


    const raw = response.data as any;
    const inferType = (): string => {
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) return 'pdf';
      if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
      return 'txt';
    };

    const mapped: DocumentUploadResponse = {
      document_id: raw.document_id ?? raw.id ?? `${Date.now()}`,
      filename: raw.filename ?? file.name,
      document_type: raw.document_type ?? inferType(),
      file_size: raw.file_size ?? raw.size ?? file.size,
      upload_timestamp: raw.upload_timestamp ?? raw.timestamp ?? new Date().toISOString(),
      processing_status: raw.processing_status ?? raw.status ?? 'processed',
      message: raw.message ?? 'Document uploaded successfully',
    };

    return mapped;
  }

  async listDocuments(limit = 50): Promise<{ documents: Document[]; total: number }> {
    const response = await this.client.get<{ documents: Document[]; total: number }>(
      `/api/documents/list?limit=${limit}`
    );
    return response.data;
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await this.client.get<Document>(`/api/documents/${documentId}`);
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/api/documents/${documentId}`);
    return response.data;
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    const response = await this.client.get<DocumentStatus>(`/api/documents/${documentId}/status`);
    return response.data;
  }

  async summarizeDocument(request: SummaryRequest): Promise<SummaryResponse> {
    const response = await this.client.get<any>(
      `/api/documents/${request.document_id}/analysis`
    );

    const raw = response.data as any;
    const summary = raw?.analysis?.summary || raw?.simplified_version || 'Summary not available.';

    const mapped: SummaryResponse = {
      document_id: request.document_id,
      summary,
      language: (request.language || 'en') as any,
      word_count: typeof summary === 'string' ? summary.split(/\s+/).filter(Boolean).length : 0,
      confidence_score: 0.9,
      disclaimer: 'This is an automated summary. Please verify important details.'
    };
    return mapped;
  }

  async extractClauses(request: ClausesRequest): Promise<ClausesResponse> {
    const response = await this.client.post<ClausesResponse>(
      `/api/documents/${request.document_id}/clauses`,
      request
    );
    return response.data;
  }

  async askQuestion(request: AskRequest): Promise<AskResponse> {
    const response = await this.client.post<AskResponse>(
      `/api/documents/${request.document_id}/ask`,
      request
    );
    return response.data;
  }

  async getAlerts(request: AlertsRequest): Promise<AlertsResponse> {
    const response = await this.client.post<AlertsResponse>(
      `/api/documents/${request.document_id}/alerts`,
      request
    );
    return response.data;
  }

  // Polling for document processing status
  async pollDocumentStatus(
    documentId: string,
    onStatusUpdate?: (status: DocumentStatus) => void,
    maxAttempts = 60,
    interval = 2000
  ): Promise<DocumentStatus> {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const poll = async () => {
        try {
          attempts++;
          const status = await this.getDocumentStatus(documentId);
          
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }

          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Document processing failed'));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Timeout waiting for document processing'));
            return;
          }

          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

const createApiService = () => {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const useDemoMode = shouldUseDemoMode();
  

  
  if (useDemoMode) {
    toast.success('Demo Mode: No backend required!', {
      duration: 3000,
      position: 'top-center'
    });
    return new MockApiService();
  } else {

    const apiService = new ApiService();
    

    setTimeout(async () => {
      try {
        await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        toast.success('Connected to backend!', {
          duration: 2000,
          position: 'top-center'
        });
      } catch (error) {
        toast.error('Backend connection issue - some features may not work', {
          duration: 5000,
          position: 'top-center',
        });
      }
    }, 1000);
    
    return apiService;
  }
};

export const apiService = createApiService();
export default apiService;