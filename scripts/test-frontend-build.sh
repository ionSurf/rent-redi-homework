#!/bin/bash

# Test frontend Docker build locally
# This simulates the GitHub Actions build process

set -e

echo "============================================"
echo "Frontend Docker Build Test"
echo "============================================"
echo ""

# Configuration - use placeholder values for local testing
BACKEND_URL="http://localhost:8080"
FIREBASE_API_KEY="test-api-key"
FIREBASE_AUTH_DOMAIN="test-project.firebaseapp.com"
FIREBASE_DATABASE_URL="https://test-project.firebaseio.com"
FIREBASE_PROJECT_ID="test-project"
FIREBASE_STORAGE_BUCKET="test-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="123456789"
FIREBASE_APP_ID="1:123:web:abc"

echo "Building frontend Docker image..."
echo "Using test Firebase configuration"
echo ""

cd frontend

docker build \
  --build-arg REACT_APP_API_URL=$BACKEND_URL \
  --build-arg REACT_APP_FIREBASE_API_KEY=$FIREBASE_API_KEY \
  --build-arg REACT_APP_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN \
  --build-arg REACT_APP_FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL \
  --build-arg REACT_APP_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  --build-arg REACT_APP_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET \
  --build-arg REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID \
  --build-arg REACT_APP_FIREBASE_APP_ID=$FIREBASE_APP_ID \
  -t rentredi-frontend-test .

echo ""
echo "============================================"
echo "Build Successful!"
echo "============================================"
echo ""
echo "To run the container:"
echo "  docker run -p 8080:8080 rentredi-frontend-test"
echo ""
echo "Then open http://localhost:8080 in your browser"
echo ""
