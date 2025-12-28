# Container Troubleshooting Guide

This guide helps diagnose why the backend container fails to start in Cloud Run.

## Quick Test (Recommended First)

Run this simple Node.js test to check if the server can start:

```bash
cd backend

# Install dependencies
npm install

# Test server startup
node test-server-local.js
```

This will show you exactly where the initialization fails.

## Docker Container Testing

### Option 1: Quick Diagnostic

```bash
./scripts/diagnose-container.sh
```

### Option 2: Full Test Script

```bash
./scripts/test-container-locally.sh
```

### Option 3: Manual Testing

#### Step 1: Build the Image

```bash
cd backend
docker build -t rentredi-backend-test .
```

#### Step 2: Run the Container (Simulating Cloud Run)

```bash
docker run --rm \
  -e PORT=8080 \
  -e FIREBASE_DATABASE_URL="https://rentredi-short-take-home-default-rtdb.firebaseio.com" \
  -p 8080:8080 \
  --name rentredi-test \
  rentredi-backend-test
```

**Expected output:**
```
⚠️  Service account key not found. Using unauthenticated mode.
   Database operations may be limited by security rules.
   For full access, add serviceAccountKey.json to backend/
✅ Firebase initialized in unauthenticated mode
Server running on http://0.0.0.0:8080
```

#### Step 3: Test Endpoints (In Another Terminal)

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test root endpoint
curl http://localhost:8080/

# Test creating a user (requires OpenWeather API key)
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "zip": "10001"}'
```

#### Step 4: Check Logs

```bash
# View container logs
docker logs rentredi-test

# Follow logs in real-time
docker logs -f rentredi-test
```

#### Step 5: Shell Into Container

```bash
# Get a shell inside the running container
docker exec -it rentredi-test sh

# Inside the container, check:
env | grep PORT
env | grep FIREBASE
ps aux
netstat -tlnp
```

## Common Issues and Fixes

### Issue 1: Container Exits Immediately

**Symptom:** Container stops right after starting

**Diagnosis:**
```bash
docker run --rm rentredi-backend-test
# Check the error message
```

**Possible causes:**
- Missing environment variable (FIREBASE_DATABASE_URL)
- Firebase initialization error
- Syntax error in code
- Missing dependencies

**Fix:** Check the error message in the output

### Issue 2: Container Runs But Doesn't Respond

**Symptom:** Container is running but health checks fail

**Diagnosis:**
```bash
# Check if process is listening on port 8080
docker exec rentredi-test netstat -tlnp | grep 8080

# Check if server process is running
docker exec rentredi-test ps aux | grep node
```

**Possible causes:**
- Server binding to wrong interface (should be 0.0.0.0)
- Server listening on wrong port
- Firewall/network issue

**Fix:** Ensure server.js binds to `0.0.0.0:8080`

### Issue 3: Firebase Connection Issues

**Symptom:** Server starts but crashes when handling requests

**Diagnosis:**
```bash
# Check Firebase initialization
docker logs rentredi-test | grep -i firebase
```

**Possible causes:**
- Invalid FIREBASE_DATABASE_URL
- Missing service account credentials
- Network connectivity issues

**Fix:** Check FIREBASE_DATABASE_URL format and credentials

### Issue 4: Port Binding Issues

**Symptom:** Error: "EADDRINUSE" or "port already in use"

**Diagnosis:**
```bash
# Check if port 8080 is already in use
lsof -i :8080
netstat -tlnp | grep 8080
```

**Fix:** Stop other processes using port 8080

## Checking Cloud Run Logs

If the container works locally but fails in Cloud Run:

1. **View Logs in Console:**
   - Click the Logs URL from the error message
   - Look for startup errors in the first few log entries

2. **View Logs via CLI:**
```bash
# Get recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend" \
  --limit 50 \
  --format json

# Stream logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend"
```

3. **Check for specific errors:**
```bash
# Look for port binding errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend" \
  --limit 50 \
  | grep -i "port\|bind\|listen"

# Look for Firebase errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend" \
  --limit 50 \
  | grep -i "firebase"
```

## Testing Checklist

- [ ] Server starts locally with `node backend/server.js`
- [ ] Test script passes with `node backend/test-server-local.js`
- [ ] Docker image builds successfully
- [ ] Container runs and stays running
- [ ] Health endpoint returns 200 OK
- [ ] Root endpoint returns welcome message
- [ ] Container logs show no errors
- [ ] Server binds to 0.0.0.0:8080
- [ ] PORT environment variable is set

## Expected Behavior

### Successful Startup Logs

```
⚠️  Service account key not found. Using unauthenticated mode.
✅ Firebase initialized in unauthenticated mode
Server running on http://0.0.0.0:8080
```

### Successful Health Check

```bash
$ curl http://localhost:8080/health
{
  "status": "degraded",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 5.123,
  "checks": {
    "backend": true,
    "database": false,
    "weatherAPI": false
  }
}
```

Note: Status will be "degraded" without proper credentials, but this is OK for testing.

## Next Steps

Once the container works locally:

1. Push the working image to Docker Hub
2. Verify the GitHub Actions workflow uses the correct configuration
3. Check that all Cloud Run secrets are properly configured
4. Ensure the service account has proper permissions

## Getting Help

If you're still stuck, provide these details:

1. Output from `node backend/test-server-local.js`
2. Output from `docker logs <container-name>`
3. Cloud Run logs from the error URL
4. Environment variables being set (without sensitive values)
