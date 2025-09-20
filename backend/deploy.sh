#!/bin/bash

# Cloud Run deployment script for Legal AI Simplifier
set -e

# Configuration
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="legal-ai-simplifier"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Legal AI Simplifier - Cloud Run Deployment${NC}"
echo "=============================================="

# Check if required tools are installed
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}❌ gcloud CLI is required but not installed.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }

# Set project
echo -e "${YELLOW}📋 Setting GCP project to ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable translate.googleapis.com

# Create storage bucket
echo -e "${YELLOW}🪣 Creating storage bucket${NC}"
gsutil mb -p $PROJECT_ID -l $REGION gs://legal-ai-documents-${PROJECT_ID} || echo "Bucket might already exist"

# Build and push Docker image
echo -e "${YELLOW}🐳 Building Docker image${NC}"
docker build -t $IMAGE_NAME .

echo -e "${YELLOW}📤 Pushing image to Container Registry${NC}"
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 10 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars "GOOGLE_CLOUD_STORAGE_BUCKET=legal-ai-documents-${PROJECT_ID}" \
    --set-env-vars "DEBUG=False" \
    --set-env-vars "LOG_LEVEL=INFO"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo -e "${GREEN}📋 API Documentation: ${SERVICE_URL}/docs${NC}"
echo -e "${GREEN}❤️  Health Check: ${SERVICE_URL}/health${NC}"

# Test the deployment
echo -e "${YELLOW}🧪 Testing deployment${NC}"
if curl -f -s "${SERVICE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Your Legal AI Simplifier backend is now live!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your frontend to use the new API URL"
echo "2. Set up monitoring and alerting"
echo "3. Configure custom domain (optional)"
echo "4. Set up CI/CD pipeline for automatic deployments"