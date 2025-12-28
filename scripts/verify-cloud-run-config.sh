#!/bin/bash

# Script to verify Cloud Run service configuration
# Checks environment variables, secrets, and service settings

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVICE_NAME="rentredi-backend"
REGION="${1:-us-central1}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Cloud Run Configuration Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Service: $SERVICE_NAME"
echo "Region:  $REGION"
echo ""

# Check if service exists
echo -e "${YELLOW}Step 1: Checking if service exists...${NC}"
if gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
  echo -e "${GREEN}✓ Service exists${NC}"
else
  echo -e "${RED}✗ Service does not exist${NC}"
  echo ""
  echo "Deploy the service first using GitHub Actions or:"
  echo "  gcloud run deploy $SERVICE_NAME ..."
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Checking environment variables...${NC}"
ENV_VARS=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.containers[0].env)')

if [ -z "$ENV_VARS" ]; then
  echo -e "${RED}✗ No environment variables set${NC}"
else
  echo "Environment variables:"
  echo "$ENV_VARS" | while IFS= read -r line; do
    if [[ $line == *"name"* ]]; then
      VAR_NAME=$(echo "$line" | sed 's/.*name=//' | sed 's/;.*//')
      echo -e "  ${GREEN}✓${NC} $VAR_NAME"
    fi
  done
fi

# Check specifically for FIREBASE_DATABASE_URL
echo ""
if echo "$ENV_VARS" | grep -q "FIREBASE_DATABASE_URL"; then
  FIREBASE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(spec.template.spec.containers[0].env[name=FIREBASE_DATABASE_URL].value)')
  echo -e "${GREEN}✓ FIREBASE_DATABASE_URL is set${NC}"
  echo "  Value: $FIREBASE_URL"
else
  echo -e "${RED}✗ FIREBASE_DATABASE_URL is NOT set${NC}"
  echo ""
  echo "Fix by adding it to deployment:"
  echo "  --set-env-vars=\"FIREBASE_DATABASE_URL=https://your-project.firebaseio.com\""
fi

echo ""
echo -e "${YELLOW}Step 3: Checking secrets...${NC}"
SECRETS=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.containers[0].env)')

if echo "$SECRETS" | grep -q "valueFrom"; then
  echo "Secrets mounted:"
  echo "$SECRETS" | grep "valueFrom" -B1 | grep "name=" | while IFS= read -r line; do
    SECRET_NAME=$(echo "$line" | sed 's/.*name=//' | sed 's/;.*//')
    echo -e "  ${GREEN}✓${NC} $SECRET_NAME"
  done
else
  echo -e "${YELLOW}⚠${NC}  No secrets mounted"
fi

# Check specifically for OPENWEATHER_API_KEY
echo ""
if echo "$SECRETS" | grep -q "OPENWEATHER_API_KEY"; then
  echo -e "${GREEN}✓ OPENWEATHER_API_KEY secret is mounted${NC}"

  # Get the secret reference
  SECRET_REF=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(spec.template.spec.containers[0].env[name=OPENWEATHER_API_KEY].valueFrom.secretKeyRef)')
  echo "  Reference: $SECRET_REF"
else
  echo -e "${RED}✗ OPENWEATHER_API_KEY secret is NOT mounted${NC}"
  echo ""
  echo "Fix by adding it to deployment:"
  echo "  --set-secrets=\"OPENWEATHER_API_KEY=openweather-api-key:latest\""
fi

echo ""
echo -e "${YELLOW}Step 4: Checking port configuration...${NC}"
PORT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.containers[0].ports[0].containerPort)')

if [ "$PORT" = "8080" ]; then
  echo -e "${GREEN}✓ Container port is set to 8080${NC}"
else
  echo -e "${YELLOW}⚠${NC}  Container port is: $PORT (expected 8080)"
fi

echo ""
echo -e "${YELLOW}Step 5: Checking service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

if [ -n "$SERVICE_URL" ]; then
  echo -e "${GREEN}✓ Service URL: $SERVICE_URL${NC}"
else
  echo -e "${RED}✗ Service URL not available${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Checking latest revision status...${NC}"
LATEST_REVISION=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.latestCreatedRevisionName)')

echo "Latest revision: $LATEST_REVISION"

REVISION_STATUS=$(gcloud run revisions describe $LATEST_REVISION \
  --region=$REGION \
  --format='value(status.conditions[0].status)')

if [ "$REVISION_STATUS" = "True" ]; then
  echo -e "${GREEN}✓ Revision is ready${NC}"
else
  echo -e "${RED}✗ Revision is NOT ready${NC}"

  # Get the reason
  REASON=$(gcloud run revisions describe $LATEST_REVISION \
    --region=$REGION \
    --format='value(status.conditions[0].message)')

  echo -e "${RED}  Reason: $REASON${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Checking resource limits...${NC}"
MEMORY=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.containers[0].resources.limits.memory)')

CPU=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.containers[0].resources.limits.cpu)')

TIMEOUT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(spec.template.spec.timeoutSeconds)')

echo "  Memory:  $MEMORY"
echo "  CPU:     $CPU"
echo "  Timeout: ${TIMEOUT}s"

echo ""
echo -e "${YELLOW}Step 8: Testing service endpoints (if available)...${NC}"
if [ -n "$SERVICE_URL" ] && [ "$REVISION_STATUS" = "True" ]; then
  echo "Testing health endpoint..."
  if curl -f -s "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health endpoint is responding${NC}"
    curl -s "${SERVICE_URL}/health" | head -5
  else
    echo -e "${RED}✗ Health endpoint is NOT responding${NC}"
  fi

  echo ""
  echo "Testing root endpoint..."
  if curl -f -s "${SERVICE_URL}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Root endpoint is responding${NC}"
    curl -s "${SERVICE_URL}/" | head -5
  else
    echo -e "${RED}✗ Root endpoint is NOT responding${NC}"
  fi
else
  echo -e "${YELLOW}⚠${NC}  Service not ready, skipping endpoint tests"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Create summary
ISSUES=0

if ! echo "$ENV_VARS" | grep -q "FIREBASE_DATABASE_URL"; then
  echo -e "${RED}✗ FIREBASE_DATABASE_URL not set${NC}"
  ((ISSUES++))
fi

if ! echo "$SECRETS" | grep -q "OPENWEATHER_API_KEY"; then
  echo -e "${RED}✗ OPENWEATHER_API_KEY secret not mounted${NC}"
  ((ISSUES++))
fi

if [ "$REVISION_STATUS" != "True" ]; then
  echo -e "${RED}✗ Latest revision is not ready${NC}"
  ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
else
  echo -e "${RED}Found $ISSUES issue(s)${NC}"
  echo ""
  echo "To view full service configuration:"
  echo "  gcloud run services describe $SERVICE_NAME --region=$REGION"
  echo ""
  echo "To view logs:"
  echo "  gcloud logging tail \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\""
fi

echo ""
