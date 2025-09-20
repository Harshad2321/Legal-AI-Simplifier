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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('API Response Error:', error);
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      // Server responded with error status
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
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred.');
    }
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  // Document operations
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<DocumentUploadResponse>(
      '/api/v1/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async listDocuments(limit = 50): Promise<{ documents: Document[]; total: number }> {
    const response = await this.client.get<{ documents: Document[]; total: number }>(
      `/api/v1/documents/list?limit=${limit}`
    );
    return response.data;
  }

  async getDocument(documentId: string): Promise<Document> {
    const response = await this.client.get<Document>(`/api/v1/documents/${documentId}`);
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/api/v1/documents/${documentId}`);
    return response.data;
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    const response = await this.client.get<DocumentStatus>(`/api/v1/documents/${documentId}/status`);
    return response.data;
  }

  // Analysis operations
  async summarizeDocument(request: SummaryRequest): Promise<SummaryResponse> {
    const response = await this.client.post<SummaryResponse>(
      `/api/v1/analysis/${request.document_id}/summarize`,
      request
    );
    return response.data;
  }

  async extractClauses(request: ClausesRequest): Promise<ClausesResponse> {
    const response = await this.client.post<ClausesResponse>(
      `/api/v1/analysis/${request.document_id}/clauses`,
      request
    );
    return response.data;
  }

  async askQuestion(request: AskRequest): Promise<AskResponse> {
    const response = await this.client.post<AskResponse>(
      `/api/v1/analysis/${request.document_id}/ask`,
      request
    );
    return response.data;
  }

  async getAlerts(request: AlertsRequest): Promise<AlertsResponse> {
    const response = await this.client.post<AlertsResponse>(
      `/api/v1/analysis/${request.document_id}/alerts`,
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

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;