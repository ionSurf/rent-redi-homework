#!/bin/bash

# Get Cloud Run service URLs
# This script retrieves the URLs of deployed Cloud Run services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}RentRedi Deployment URLs${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get project ID and region from gcloud config
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION=$(gcloud config get-value run/region 2>/dev/null || echo "us-central1")

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "Region:  $REGION"
echo ""

# Get backend URL
echo -e "${GREEN}Backend Service:${NC}"
BACKEND_URL=$(gcloud run services describe rentredi-backend \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "Not deployed")

if [ "$BACKEND_URL" != "Not deployed" ]; then
  echo "  URL:     $BACKEND_URL"
  echo "  Health:  $BACKEND_URL/health"
  echo "  Metrics: $BACKEND_URL/metrics"
else
  echo "  Status: Not deployed"
fi

echo ""

# Get frontend URL
echo -e "${GREEN}Frontend Service:${NC}"
FRONTEND_URL=$(gcloud run services describe rentredi-frontend \
  --region=$REGION \
  --format='value(status.url)' 2>/dev/null || echo "Not deployed")

if [ "$FRONTEND_URL" != "Not deployed" ]; then
  echo "  URL:   $FRONTEND_URL"
  echo "  Admin: $FRONTEND_URL/admin"
else
  echo "  Status: Not deployed"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
