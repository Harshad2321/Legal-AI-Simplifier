# 🚀 Legal AI Simplifier - Complete Hackathon Project

## 📋 Project Overview

**Legal AI Simplifier** is an intelligent legal document analysis platform that transforms complex legal jargon into plain English. Built for the **Generative AI for Demystifying Legal Documents** hackathon using Google Cloud technologies.

### 🎯 Key Features
- **📄 Document Upload**: PDF, DOCX, TXT support with drag-and-drop
- **🤖 AI-Powered Analysis**: Summary, clause extraction, risk assessment
- **🌐 Multi-language Support**: English, Hindi, Spanish, French summaries
- **💬 Interactive Q&A**: Ask questions about your documents
- **⚠️ Risk Alerts**: Automated detection of risky clauses
- **📊 Visual Dashboard**: Beautiful, intuitive interface

### 🏗️ Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  FastAPI Backend │◄──►│  Google Cloud   │
│   (TypeScript)   │    │   (Python)      │    │    Services     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                         │                         │
   ┌───▼───┐              ┌─────▼─────┐            ┌─────▼─────┐
   │Tailwind│              │   FAISS   │            │ Vertex AI │
   │   CSS  │              │ Vector DB │            │Cloud Store│
   └───────┘              └───────────┘            │ Firestore │
                                                   └───────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **Google Cloud Account** with billing enabled
- **Docker** (optional, for containerized deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/Harshad2321/Legal-AI-Simplifier.git
cd Legal-AI-Simplifier
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your Google Cloud project settings

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Google Cloud Setup
```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable translate.googleapis.com

# Create storage bucket
gsutil mb gs://legal-ai-documents-YOUR_PROJECT_ID
```

## 🛠️ Development

### Backend Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── schemas.py           # Pydantic models
│   ├── routers/
│   │   ├── documents.py     # Document management
│   │   └── analysis.py      # AI analysis endpoints
│   └── services/
│       ├── gcp_client.py    # Google Cloud integration
│       ├── document_processor.py  # Text processing
│       └── vector_store.py  # FAISS vector operations
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
└── deploy.sh               # Cloud Run deployment
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── services/           # API integration
│   ├── types/              # TypeScript type definitions
│   ├── config/             # Configuration constants
│   └── App.tsx             # Main application component
├── package.json            # Node.js dependencies
└── tailwind.config.js      # Tailwind CSS configuration
```

## 📡 API Endpoints

### Document Management
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/list` - List documents
- `GET /api/v1/documents/{id}` - Get document details
- `DELETE /api/v1/documents/{id}` - Delete document
- `GET /api/v1/documents/{id}/status` - Processing status

### AI Analysis
- `POST /api/v1/analysis/{id}/summarize` - Generate summary
- `POST /api/v1/analysis/{id}/clauses` - Extract clauses
- `POST /api/v1/analysis/{id}/ask` - Ask questions
- `POST /api/v1/analysis/{id}/alerts` - Get risk alerts

### Example Usage
```javascript
// Upload document
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/v1/documents/upload', {
  method: 'POST',
  body: formData
});

// Get summary
const summary = await fetch(`/api/v1/analysis/${documentId}/summarize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_id: documentId,
    language: 'hi',  // Hindi summary
    max_length: 500
  })
});
```

## 🎪 Demo Script

### For Hackathon Judges
1. **Upload Demo**: Drag & drop a legal contract (PDF/DOCX)
2. **Real-time Processing**: Show live status updates
3. **Multi-language Summary**: Generate in English and Hindi
4. **Risk Analysis**: Highlight critical clauses with color coding
5. **Interactive Q&A**: Ask "What are my payment obligations?"
6. **Smart Alerts**: Show automated risk warnings

### Sample Questions for Demo
- "What are the termination conditions?"
- "What penalties might I face?"
- "What are my financial obligations?"
- "Are there any unusual clauses I should worry about?"

## 🚢 Production Deployment

### Cloud Run (Recommended)
```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

### Docker Compose (Local)
```bash
# Backend
cd backend
docker-compose up -d

# Frontend
cd frontend
npm run build
# Serve with your preferred static file server
```

### Environment Variables

#### Backend (.env)
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=legal-ai-documents
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
DEBUG=False
LOG_LEVEL=INFO
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=https://your-backend-url.com
REACT_APP_DEMO_MODE=false
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python test_api.py
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Test complete flow
1. Upload document via frontend
2. Wait for processing
3. Test all analysis features
4. Verify API responses
```

## 🎨 Customization

### Adding New Risk Patterns
Edit `backend/app/services/document_processor.py`:
```python
self.risk_patterns = {
    "high": [
        r"penalty|penalties|fine|fines",
        r"your_new_pattern_here",
        # Add more patterns
    ]
}
```

### Adding New Languages
1. Update `LANGUAGES` in `frontend/src/config/constants.ts`
2. Ensure Google Translate supports the language
3. Test with sample documents

### Styling Customization
Edit `frontend/tailwind.config.js` for theme changes:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Your brand colors
        }
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip install -r requirements.txt

# Check Google Cloud authentication
gcloud auth application-default login
```

#### Frontend build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### API connection issues
1. Verify backend is running on port 8080
2. Check CORS settings in `backend/app/main.py`
3. Ensure frontend proxy is configured

#### Google Cloud errors
1. Verify project ID in environment variables
2. Check API enablement: `gcloud services list --enabled`
3. Verify service account permissions

## 📊 Performance Optimization

### Backend
- **Async processing**: Document analysis runs in background
- **Vector caching**: FAISS index persisted to disk
- **Connection pooling**: Reuse GCP client connections
- **Memory management**: Chunked processing for large documents

### Frontend
- **Code splitting**: React.lazy() for route-based splitting
- **Image optimization**: WebP format with fallbacks
- **Caching**: Service worker for offline functionality
- **Bundle analysis**: webpack-bundle-analyzer for optimization

## 🔒 Security

### Backend Security
- **Input validation**: Pydantic schemas for all endpoints
- **File type validation**: MIME type checking
- **Size limits**: 10MB max file size
- **Error handling**: No sensitive information in error messages

### Frontend Security
- **XSS protection**: React's built-in sanitization
- **CSRF protection**: CORS configuration
- **Environment variables**: No secrets in client-side code

## 📈 Monitoring

### Health Checks
- Backend: `GET /health`
- Service status monitoring
- Error rate tracking
- Performance metrics

### Logging
```python
# Backend logs
tail -f logs/app.log

# Frontend console
console.log('User action:', action);
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **Backend**: Black formatting, type hints, docstrings
- **Frontend**: ESLint, Prettier, TypeScript strict mode
- **Tests**: Minimum 80% coverage
- **Documentation**: Update README for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud** for AI and infrastructure services
- **OpenAI** for inspiration and AI capabilities
- **React** and **FastAPI** communities
- **Hackathon organizers** for the opportunity

## 📞 Support

### For Hackathon Support
- **Email**: support@legal-ai-simplifier.com
- **Discord**: #legal-ai-simplifier
- **Documentation**: https://docs.legal-ai-simplifier.com

### Quick Links
- 🌐 **Live Demo**: https://legal-ai-simplifier.vercel.app
- 📚 **API Docs**: https://api.legal-ai-simplifier.com/docs
- 🎥 **Demo Video**: https://youtube.com/watch?v=demo
- 📱 **Mobile App**: Coming soon!

---

**Built with ❤️ for the Google Cloud AI Hackathon**

*⚠️ Disclaimer: This is AI assistance, not legal advice. Always consult with qualified legal professionals for important legal matters.*