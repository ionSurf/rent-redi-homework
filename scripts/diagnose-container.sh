#!/bin/bash

# Quick diagnostic script to test container build and startup

echo "Testing container locally..."
echo ""

# Build
echo "1. Building image..."
cd backend
docker build -t rentredi-test . || exit 1

# Test basic run
echo ""
echo "2. Testing basic container startup..."
docker run --rm -e PORT=8080 -p 8080:8080 rentredi-test &
CONTAINER_PID=$!

# Wait for startup
echo "3. Waiting 5 seconds for startup..."
sleep 5

# Test endpoint
echo ""
echo "4. Testing health endpoint..."
curl -v http://localhost:8080/health || echo "FAILED to reach health endpoint"

echo ""
echo "5. Testing root endpoint..."
curl -v http://localhost:8080/ || echo "FAILED to reach root endpoint"

# Stop
echo ""
echo "6. Stopping container..."
kill $CONTAINER_PID 2>/dev/null

echo ""
echo "Done!"
