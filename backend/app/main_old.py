"""
Main FastAPI application for Legal AI Simplifier
"""
import logging
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.schemas import HealthResponse, ErrorResponse
from app.routers import documents, analysis
from app.services.gcp_client import GCPClient


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Global GCP client instance
gcp_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events"""
    global gcp_client
    
    # Startup
    logger.info("Starting Legal AI Simplifier Backend...")
    try:
        gcp_client = GCPClient()
        await gcp_client.initialize()
        logger.info("GCP services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize GCP services: {e}")
        # Don't fail startup - let individual endpoints handle the error
    
    yield
    
    # Shutdown
    logger.info("Shutting down Legal AI Simplifier Backend...")
    if gcp_client:
        await gcp_client.cleanup()


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="Validation Error",
            message=f"Invalid request data: {exc.errors()}",
            timestamp=datetime.utcnow(),
            request_id=str(uuid.uuid4())
        ).dict()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=f"HTTP {exc.status_code}",
            message=exc.detail,
            timestamp=datetime.utcnow(),
            request_id=str(uuid.uuid4())
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred. Please try again later.",
            timestamp=datetime.utcnow(),
            request_id=str(uuid.uuid4())
        ).dict()
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    services_status = {}
    
    # Check GCP services
    if gcp_client:
        try:
            # Test Firestore connection
            await gcp_client.test_firestore_connection()
            services_status["firestore"] = "connected"
        except Exception:
            services_status["firestore"] = "disconnected"
        
        try:
            # Test GCS connection
            await gcp_client.test_gcs_connection()
            services_status["gcs"] = "connected"
        except Exception:
            services_status["gcs"] = "disconnected"
        
        try:
            # Test Vertex AI connection
            await gcp_client.test_vertex_ai_connection()
            services_status["vertex_ai"] = "connected"
        except Exception:
            services_status["vertex_ai"] = "disconnected"
    else:
        services_status = {
            "firestore": "not_initialized",
            "gcs": "not_initialized",
            "vertex_ai": "not_initialized"
        }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        services=services_status
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Legal AI Simplifier API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "running"
    }


# Include routers
app.include_router(
    documents.router,
    prefix=f"/api/{settings.api_version}/documents",
    tags=["documents"]
)

app.include_router(
    analysis.router,
    prefix=f"/api/{settings.api_version}/analysis",
    tags=["analysis"]
)


# Middleware to add request ID
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request"""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


# Make gcp_client available to routers
def get_gcp_client():
    """Dependency to get GCP client instance"""
    if not gcp_client:
        raise HTTPException(
            status_code=503,
            detail="GCP services not available. Please try again later."
        )
    return gcp_client


# Export for use in routers
app.dependency_overrides = {}
app.state.get_gcp_client = get_gcp_client