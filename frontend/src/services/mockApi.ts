import { 
  DocumentUploadResponse, 
  SummaryRequest,
  SummaryResponse,
  ClausesRequest,
  ClausesResponse,
  AskRequest,
  AskResponse,
  AlertsRequest,
  AlertsResponse,
  HealthResponse,
  Document,
  DocumentStatus,
  RiskLevel
} from '../types';

const mockDocuments: Document[] = [
  {
    document_id: 'demo-1',
    filename: 'employment-contract.pdf',
    document_type: 'pdf',
    file_size: 156789,
    upload_timestamp: new Date().toISOString(),
    processing_status: 'completed',
    summary: 'Standard employment agreement with competitive salary, benefits, and standard clauses.',
    risk_level: 'medium',
    total_pages: 3,
    total_clauses: 8
  },
  {
    document_id: 'demo-2', 
    filename: 'lease-agreement.pdf',
    document_type: 'pdf',
    file_size: 234567,
    upload_timestamp: new Date().toISOString(),
    processing_status: 'completed',
    summary: 'Residential lease agreement with standard terms and tenant responsibilities.',
    risk_level: 'low',
    total_pages: 4,
    total_clauses: 12
  }
];

export class MockApiService {
  private documents: Document[] = [...mockDocuments];

  async checkHealth(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo',
      services: {
        'demo-mode': 'active',
        'backend': 'mock'
      }
    };
  }

  async uploadDocument(file: File): Promise<DocumentUploadResponse> {

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newDoc: Document = {
      document_id: `demo-${Date.now()}`,
      filename: file.name,
      document_type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'txt',
      file_size: file.size,
      upload_timestamp: new Date().toISOString(),
      processing_status: 'processing',
      summary: '',
      risk_level: 'low'
    };

    this.documents.push(newDoc);


    setTimeout(() => {
      const doc = this.documents.find(d => d.document_id === newDoc.document_id);
      if (doc) {
        doc.processing_status = 'completed';
        doc.summary = this.generateMockSummary(file.name);
        doc.risk_level = this.generateMockRiskLevel(file.name);
      }
    }, 3000);

    return {
      document_id: newDoc.document_id,
      filename: newDoc.filename,
      document_type: newDoc.document_type,
      file_size: newDoc.file_size,
      upload_timestamp: newDoc.upload_timestamp,
      processing_status: newDoc.processing_status,
      message: 'Document uploaded successfully (demo mode)'
    };
  }

  async getDocuments(): Promise<Document[]> {
    return this.documents.filter(doc => doc.processing_status === 'completed');
  }

  async listDocuments(limit = 50): Promise<{ documents: Document[]; total: number }> {
    const documents = this.documents.filter(doc => doc.processing_status === 'completed');
    return {
      documents: documents.slice(0, limit),
      total: documents.length
    };
  }

  async getDocument(documentId: string): Promise<Document> {
    const doc = this.documents.find(d => d.document_id === documentId);
    if (!doc) {
      throw new Error('Document not found');
    }
    return doc;
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const index = this.documents.findIndex(d => d.document_id === documentId);
    if (index === -1) {
      throw new Error('Document not found');
    }
    this.documents.splice(index, 1);
    return { message: 'Document deleted successfully' };
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatus> {
    const doc = this.documents.find(d => d.document_id === documentId);
    if (!doc) {
      throw new Error('Document not found');
    }
    return {
      document_id: documentId,
      status: doc.processing_status,
      processed_at: doc.processing_status === 'completed' ? doc.upload_timestamp : undefined
    };
  }

  async summarizeDocument(request: SummaryRequest): Promise<SummaryResponse> {
    return this.generateSummary(request.document_id);
  }

  async pollDocumentStatus(
    documentId: string,
    maxAttempts = 30,
    interval = 2000
  ): Promise<Document> {

    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.getDocument(documentId);
  }

  async generateSummary(documentId: string): Promise<SummaryResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const doc = this.documents.find(d => d.document_id === documentId);
    
    return {
      document_id: documentId,
      summary: doc?.summary || 'This is a sample legal document summary generated in demo mode.',
      language: 'en',
      word_count: 250,
      confidence_score: 0.85,
      disclaimer: 'This is a demo response generated for testing purposes.'
    };
  }

  async extractClauses(request: ClausesRequest): Promise<ClausesResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      document_id: request.document_id,
      clauses: [
        {
          clause_id: 'clause-1',
          title: 'Termination Clause',
          content: 'Either party may terminate this agreement with 30 days written notice.',
          category: 'termination',
          risk_level: 'medium',
          explanation: 'Standard termination clause allowing either party to end the agreement.',
          page_number: 1
        },
        {
          clause_id: 'clause-2',
          title: 'Confidentiality Agreement',
          content: 'Employee agrees to maintain confidentiality of company information.',
          category: 'confidentiality',
          risk_level: 'low',
          explanation: 'Standard confidentiality clause protecting company information.',
          page_number: 2
        },
        {
          clause_id: 'clause-3',
          title: 'Governing Law',
          content: 'This agreement shall be governed by the laws of [State/Country].',
          category: 'governance',
          risk_level: 'low',
          explanation: 'Specifies which jurisdiction\'s laws apply to this agreement.',
          page_number: 3
        }
      ],
      total_clauses: 3,
      disclaimer: 'This is a demo response generated for testing purposes.'
    };
  }

  async askQuestion(request: AskRequest): Promise<AskResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    

    let answer = 'This is a demo response. ';
    
    if (request.question.toLowerCase().includes('termination')) {
      answer += 'The document allows termination with 30 days notice by either party.';
    } else if (request.question.toLowerCase().includes('salary') || request.question.toLowerCase().includes('pay')) {
      answer += 'The annual salary mentioned is $85,000, paid according to regular payroll practices.';
    } else if (request.question.toLowerCase().includes('rent')) {
      answer += 'The monthly rent is $1,200, due on the first day of each month.';
    } else if (request.question.toLowerCase().includes('security deposit')) {
      answer += 'A security deposit of $1,800 is required prior to occupancy.';
    } else {
      answer += 'I can help explain various terms and clauses in your legal document. Please ask specific questions about clauses, obligations, or terms.';
    }

    return {
      document_id: request.document_id,
      question: request.question,
      answer,
      confidence_score: 0.85,
      relevant_sections: ['clause-1', 'clause-2'],
      disclaimer: 'This is a demo response generated for testing purposes.'
    };
  }

  async getAlerts(request: AlertsRequest): Promise<AlertsResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      document_id: request.document_id,
      alerts: [
        {
          alert_id: 'alert-1',
          title: 'Non-compete Clause',
          description: 'This document contains a 12-month non-compete clause that may limit future employment opportunities.',
          risk_level: 'medium',
          clause_reference: 'clause-noncompete',
          recommendation: 'Consider negotiating the duration and scope of the non-compete clause.',
          page_number: 2
        },
        {
          alert_id: 'alert-2',
          title: 'Review Recommended',
          description: 'Consider having a legal professional review the termination and confidentiality clauses.',
          risk_level: 'low',
          clause_reference: 'clause-termination',
          recommendation: 'Schedule a consultation with a legal advisor.',
          page_number: 1
        }
      ],
      total_alerts: 2,
      risk_summary: {
        'low': 1,
        'medium': 1,
        'high': 0,
        'critical': 0
      },
      disclaimer: 'This is a demo response generated for testing purposes.'
    };
  }

  private generateMockSummary(filename: string): string {
    if (filename.toLowerCase().includes('employment')) {
      return 'Employment agreement outlining job responsibilities, compensation, and company policies.';
    } else if (filename.toLowerCase().includes('lease')) {
      return 'Residential lease agreement detailing rental terms, responsibilities, and conditions.';
    } else if (filename.toLowerCase().includes('license')) {
      return 'Software license agreement defining usage rights, restrictions, and legal obligations.';
    } else {
      return 'Legal document containing various terms, conditions, and contractual obligations.';
    }
  }

  private generateMockRiskLevel(filename: string): RiskLevel {
    if (filename.toLowerCase().includes('employment')) {
      return 'medium';
    } else if (filename.toLowerCase().includes('lease')) {
      return 'low';
    } else if (filename.toLowerCase().includes('license')) {
      return 'high';
    } else {
      return 'low';
    }
  }

  private generateMockKeyPoints(filename: string): string[] {
    if (filename.toLowerCase().includes('employment')) {
      return [
        'Full-time employment position',
        'Competitive salary and benefits',
        'Confidentiality requirements',
        'Standard termination terms'
      ];
    } else if (filename.toLowerCase().includes('lease')) {
      return [
        'Monthly rent payment terms',
        'Security deposit requirements',
        'Utility responsibilities',
        'Lease duration and renewal'
      ];
    } else {
      return [
        'Key terms and conditions',
        'Rights and obligations',
        'Important deadlines',
        'Legal requirements'
      ];
    }
  }
}