#!/bin/bash

# Script to test the backend container locally and diagnose Cloud Run issues
# This simulates how Cloud Run runs your container

set -e

echo "============================================"
echo "Local Container Testing for Cloud Run"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="rentredi-backend-test"
CONTAINER_NAME="rentredi-backend-test-container"
PORT=8080

echo -e "${YELLOW}Step 1: Building Docker image${NC}"
echo "Building from: $(pwd)/backend"
cd backend
docker build -t $IMAGE_NAME .
cd ..

echo ""
echo -e "${YELLOW}Step 2: Stopping any existing test container${NC}"
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 3: Running container (simulating Cloud Run environment)${NC}"
echo "Port: $PORT"
echo "Environment: PORT=$PORT (Cloud Run sets this automatically)"
echo ""

# Create a .env file for testing (if it doesn't exist)
if [ ! -f backend/.env.test ]; then
  echo "Creating test environment file..."
  cat > backend/.env.test <<EOF
FIREBASE_DATABASE_URL=https://test-project.firebaseio.com
EOF
fi

# Run the container exactly as Cloud Run would
# Cloud Run sets PORT automatically and expects the container to listen on it
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  -e PORT=$PORT \
  -e FIREBASE_DATABASE_URL="https://rentredi-short-take-home-default-rtdb.firebaseio.com" \
  $IMAGE_NAME

echo ""
echo -e "${YELLOW}Step 4: Waiting for container to start (10 seconds)${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 5: Checking container status${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
  echo -e "${GREEN}✓ Container is running!${NC}"
else
  echo -e "${RED}✗ Container is NOT running${NC}"
  echo ""
  echo "Container logs:"
  docker logs $CONTAINER_NAME
  exit 1
fi

echo ""
echo -e "${YELLOW}Step 6: Checking container logs${NC}"
docker logs $CONTAINER_NAME

echo ""
echo -e "${YELLOW}Step 7: Testing health endpoint${NC}"
echo "Attempting to reach http://localhost:$PORT/health"
echo ""

# Wait a bit more and try health check
sleep 5

if curl -f http://localhost:$PORT/health 2>/dev/null; then
  echo ""
  echo -e "${GREEN}✓ Health check PASSED!${NC}"
else
  echo ""
  echo -e "${RED}✗ Health check FAILED${NC}"
  echo ""
  echo "Full container logs:"
  docker logs $CONTAINER_NAME
  echo ""
  echo "Container details:"
  docker inspect $CONTAINER_NAME
fi

echo ""
echo -e "${YELLOW}Step 8: Testing root endpoint${NC}"
curl -v http://localhost:$PORT/ 2>&1 || true

echo ""
echo ""
echo "============================================"
echo "Interactive Testing"
echo "============================================"
echo ""
echo "The container is still running. You can:"
echo ""
echo "  1. View logs:       docker logs -f $CONTAINER_NAME"
echo "  2. Test endpoints:  curl http://localhost:$PORT/health"
echo "  3. Shell into it:   docker exec -it $CONTAINER_NAME sh"
echo "  4. Stop it:         docker stop $CONTAINER_NAME"
echo "  5. Remove it:       docker rm -f $CONTAINER_NAME"
echo ""
echo "Press Ctrl+C to exit (container will keep running)"
echo ""

# Follow logs
docker logs -f $CONTAINER_NAME
