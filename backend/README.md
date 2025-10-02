# Legal AI Simplifier - Backend API

## Overview

A powerful FastAPI backend that uses Google Cloud AI to demystify legal documents. Upload any legal document (PDF, DOCX, TXT) and get:

- **Plain English summaries** in multiple languages
- **Risk alerts** for dangerous clauses
- **Clause-by-clause explanations**
- **Interactive Q&A** about your document
- **Smart search** using AI embeddings

## Quick Start

### 1. Prerequisites

```bash
# Install Python 3.11+
python --version

# Install Google Cloud CLI
gcloud --version

# Install Docker (optional)
docker --version
```

### 2. Setup

```bash
# Clone and navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your Google Cloud project details
# GOOGLE_CLOUD_PROJECT_ID=your-project-id
# GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
```

### 3. Google Cloud Setup

```bash
# Authenticate with Google Cloud
gcloud auth application-default login

# Create a service account
gcloud iam service-accounts create legal-ai-service
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:legal-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:legal-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:legal-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Download service account key
gcloud iam service-accounts keys create service-account.json \
    --iam-account=legal-ai-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4. Run Locally

```bash
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Or using Python
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8080/health

# API documentation
open http://localhost:8080/docs
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app and startup
│   ├── config.py              # Configuration management
│   ├── schemas.py             # Pydantic models
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── documents.py       # Document upload/management
│   │   └── analysis.py        # Document analysis endpoints
│   └── services/
│       ├── __init__.py
│       ├── gcp_client.py      # Google Cloud integration
│       ├── document_processor.py  # Text extraction & analysis
│       └── vector_store.py    # FAISS vector operations
├── data/                      # FAISS index storage
├── requirements.txt           # Python dependencies
├── Dockerfile                # Container configuration
├── docker-compose.yml       # Local development
├── cloud-run-service.yaml   # Cloud Run deployment
├── deploy.sh                # Deployment script
└── README.md                # This file
```

## API Endpoints

### Document Management

#### Upload Document
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

# Form data:
file: [PDF/DOCX/TXT file]
```

**Response:**
```json
{
  "document_id": "uuid",
  "filename": "contract.pdf",
  "document_type": "pdf",
  "file_size": 1048576,
  "upload_timestamp": "2025-09-20T10:30:00Z",
  "processing_status": "pending",
  "message": "Document uploaded successfully and processing started"
}
```

#### Get Document Status
```http
GET /api/v1/documents/{document_id}/status
```

#### List Documents
```http
GET /api/v1/documents/list?limit=50&user_id=optional
```

### Document Analysis

#### Summarize Document
```http
POST /api/v1/analysis/{document_id}/summarize
Content-Type: application/json

{
  "document_id": "uuid",
  "language": "en",  // "en", "hi", "es", "fr"
  "max_length": 500
}
```

**Response:**
```json
{
  "document_id": "uuid",
  "summary": "This is a service agreement between...",
  "language": "en",
  "word_count": 247,
  "confidence_score": 0.89,
  "disclaimer": "⚠️Disclaimer: This is AI assistance, not legal advice."
}
```

#### Extract & Explain Clauses
```http
POST /api/v1/analysis/{document_id}/clauses
Content-Type: application/json

{
  "document_id": "uuid",
  "include_explanations": true
}
```

**Response:**
```json
{
  "document_id": "uuid",
  "clauses": [
    {
      "clause_id": "clause_1",
      "title": "Payment Terms",
      "content": "Payment shall be due within 30 days...",
      "category": "payment",
      "risk_level": "medium",
      "explanation": "This clause means you must pay within 30 days...",
      "page_number": 2
    }
  ],
  "total_clauses": 15,
  "disclaimer": "⚠️Disclaimer: This is AI assistance, not legal advice."
}
```

#### Ask Questions
```http
POST /api/v1/analysis/{document_id}/ask
Content-Type: application/json

{
  "document_id": "uuid",
  "question": "What happens if I terminate the contract early?",
  "context_limit": 3
}
```

**Response:**
```json
{
  "document_id": "uuid",
  "question": "What happens if I terminate the contract early?",
  "answer": "According to the contract, early termination results in...",
  "confidence_score": 0.92,
  "relevant_sections": ["Section 5.2 discusses termination...", "..."],
  "disclaimer": "⚠️Disclaimer: This is AI assistance, not legal advice."
}
```

#### Get Risk Alerts
```http
POST /api/v1/analysis/{document_id}/alerts
Content-Type: application/json

{
  "document_id": "uuid",
  "severity_threshold": "medium"  // "low", "medium", "high", "critical"
}
```

**Response:**
```json
{
  "document_id": "uuid",
  "alerts": [
    {
      "alert_id": "alert_1",
      "title": "Unlimited Liability Risk",
      "description": "This clause exposes you to unlimited financial liability...",
      "risk_level": "critical",
      "clause_reference": "clause_7",
      "recommendation": "Negotiate a liability cap to limit your exposure.",
      "page_number": 4
    }
  ],
  "total_alerts": 3,
  "risk_summary": {
    "critical": 1,
    "high": 2,
    "medium": 5,
    "low": 1
  },
  "disclaimer": "⚠️Disclaimer: This is AI assistance, not legal advice."
}
```

## 🛠 Architecture

### Flow Diagram
```
Upload → GCS Storage → Text Extraction → Risk Analysis
                    ↓
Vector Embeddings ← Text Chunking ← Clause Extraction
                    ↓
FAISS Index → Similarity Search → AI Analysis → Response
                    ↓
              Firestore Metadata
```

### Key Components

1. **Document Processor**: Extracts text from PDF/DOCX/TXT
2. **GCP Client**: Manages Google Cloud services
3. **Vector Store**: FAISS-based similarity search
4. **Risk Analyzer**: Pattern-based risk detection
5. **AI Service**: Vertex AI for text generation

### Google Cloud Services Used

- **Cloud Storage**: Document file storage
- **Firestore**: Metadata and user data
- **Vertex AI**: Text generation and embeddings
- **Cloud Translate**: Multi-language support
- **Cloud Run**: Scalable deployment

## Configuration

### Environment Variables

```bash
# Required
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Optional
FRONTEND_URL=http://localhost:3000
DEBUG=True
LOG_LEVEL=INFO
SECRET_KEY=your-secret-key
```

### Risk Detection Patterns

The system uses predefined patterns to detect risky clauses:

- **Critical**: Unlimited liability, criminal liability, personal assets at risk
- **High**: Penalties, termination without notice, liquidated damages
- **Medium**: Mandatory arbitration, governing law, confidentiality
- **Low**: Standard clauses with minimal risk

## Deployment

### Local Development
```bash
# Using Docker Compose
docker-compose up --build

# Direct Python
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### Google Cloud Run
```bash
# One-command deployment
chmod +x deploy.sh
./deploy.sh

# Or manual deployment
gcloud run deploy legal-ai-simplifier \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

### Environment Setup for Production
```bash
# Set production environment variables
gcloud run services update legal-ai-simplifier \
    --set-env-vars "DEBUG=False" \
    --set-env-vars "LOG_LEVEL=WARNING" \
    --region us-central1
```

## 🧪 Testing

### Manual Testing
```bash
# Test file upload
curl -X POST "http://localhost:8080/api/v1/documents/upload" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@sample_contract.pdf"

# Test health endpoint
curl http://localhost:8080/health
```

### Sample Documents
Place test documents in `test_documents/`:
- `sample_contract.pdf`
- `terms_of_service.docx`
- `privacy_policy.txt`

## Performance & Scaling

### Optimization Features
- **Background Processing**: Document analysis runs asynchronously
- **Vector Caching**: FAISS index persisted to disk
- **Chunked Processing**: Large documents split for better performance
- **Rate Limiting**: Built-in request throttling

### Scaling Considerations
- Cloud Run auto-scales 0-10 instances
- FAISS index loads in memory (consider Redis for production)
- Firestore handles concurrent requests
- Consider Cloud SQL for complex queries

## 🔒 Security

### Current Features
- Input validation with Pydantic
- File type verification
- File size limits (10MB)
- CORS protection
- Request ID tracking

### Production Recommendations
- Add authentication (Firebase Auth)
- Implement rate limiting
- Use Cloud Armor for DDoS protection
- Enable audit logging
- Encrypt sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**: Install all dependencies with `pip install -r requirements.txt`
2. **GCP Authentication**: Run `gcloud auth application-default login`
3. **Missing Service Account**: Download service account key from GCP Console
4. **FAISS Index Issues**: Delete `data/` folder to reset vector store
5. **Memory Issues**: Increase Cloud Run memory allocation

### Debug Mode
```bash
# Enable debug logging
export DEBUG=True
export LOG_LEVEL=DEBUG

# Run with verbose output
uvicorn app.main:app --reload --log-level debug
```

### Health Checks
- `/health` - Overall system health
- `/api/v1/documents/list` - Test database connectivity
- Vector store stats available in health endpoint

## 🤝 Frontend Integration

### Sample JavaScript Integration
```javascript
// Upload document
const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/documents/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};

// Get summary
const getSummary = async (documentId, language = 'en') => {
  const response = await fetch(`/api/v1/analysis/${documentId}/summarize`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      document_id: documentId,
      language: language,
      max_length: 500
    }),
  });
  
  return response.json();
};
```

### React Hook Example
```javascript
const useDocumentAnalysis = (documentId) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  const analyze = async () => {
    setLoading(true);
    try {
      const [summaryRes, alertsRes] = await Promise.all([
        getSummary(documentId),
        getAlerts(documentId)
      ]);
      setSummary(summaryRes);
      setAlerts(alertsRes.alerts);
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, summary, alerts, analyze };
};
```

## 🏆 Hackathon Demo Tips

### Demo Flow
1. **Upload**: Show document upload with real-time processing status
2. **Summary**: Generate plain English summary in multiple languages
3. **Risk Alerts**: Highlight dangerous clauses with explanations
4. **Q&A**: Interactive question answering about the document
5. **Clause Analysis**: Detailed breakdown of key terms

### Judge-Friendly Features
- **Real-time processing status**: Show progress to judges
- **Multi-language support**: Demonstrate Hindi/English summaries
- **Risk scoring**: Visual risk level indicators
- **Plain English explanations**: Compare legalese vs. simple language
- **Interactive Q&A**: Let judges ask questions about uploaded documents

### Performance Tips
- Pre-upload sample documents for quick demos
- Use shorter documents for faster processing
- Prepare backup responses for network issues
- Cache common questions and answers

## License

MIT License - Feel free to use this for your hackathon and beyond!

## Support

For hackathon support or questions:
- Check the `/docs` endpoint for interactive API documentation
- Review logs with `docker-compose logs -f`
- Test individual endpoints with the provided curl commands

**Remember**: This is a hackathon project focused on demonstrating AI capabilities for legal document analysis. For production use, implement proper authentication, security, and scaling measures.

---

**Important Disclaimer**: This tool provides AI-powered assistance for understanding legal documents but does not constitute legal advice. Always consult with qualified legal professionals for important legal matters.
