#!/bin/bash

# RentRedi GCP Deployment Script
# This script deploys the application to Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$PROJECT_ID" ]; then
    print_error "PROJECT_ID environment variable is not set"
    echo "Usage: export PROJECT_ID=your-gcp-project-id && ./scripts/deploy-gcp.sh"
    exit 1
fi

# Set defaults
REGION="${REGION:-us-central1}"

print_info "Starting deployment to GCP..."
print_info "Project ID: $PROJECT_ID"
print_info "Region: $REGION"

# Set project
print_info "Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_info "Enabling required GCP APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com

# Check if required substitutions are set
if [ -z "$FIREBASE_API_KEY" ]; then
    print_warning "FIREBASE_API_KEY not set. Set it with: export FIREBASE_API_KEY=your-key"
fi

# Build and submit to Cloud Build
print_info "Triggering Cloud Build..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="\
_REGION=$REGION,\
_FIREBASE_API_KEY=${FIREBASE_API_KEY:-},\
_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-},\
_FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL:-},\
_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-},\
_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-},\
_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-},\
_FIREBASE_APP_ID=${FIREBASE_APP_ID:-}"

# Get deployment URLs
print_info "Retrieving deployment URLs..."

BACKEND_URL=$(gcloud run services describe rentredi-backend \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "")

FRONTEND_URL=$(gcloud run services describe rentredi-frontend \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "")

echo ""
echo "============================================"
print_info "Deployment Complete! 🚀"
echo "============================================"
echo ""
if [ -n "$BACKEND_URL" ]; then
    echo "Backend URL:  $BACKEND_URL"
    echo "Health Check: $BACKEND_URL/health"
    echo "Metrics:      $BACKEND_URL/metrics"
else
    print_warning "Backend URL not available yet"
fi
echo ""
if [ -n "$FRONTEND_URL" ]; then
    echo "Frontend URL: $FRONTEND_URL"
    echo "Admin Panel:  $FRONTEND_URL/admin"
else
    print_warning "Frontend URL not available yet"
fi
echo ""
echo "============================================"
echo ""
print_info "View logs:"
echo "  Backend:  gcloud logging tail 'resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend'"
echo "  Frontend: gcloud logging tail 'resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-frontend'"
echo ""
print_info "To update the deployment, run this script again or push to the main branch."
