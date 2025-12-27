# GCP Cloud Run Deployment Guide

This guide covers deploying the RentRedi application to Google Cloud Platform using Cloud Build and Cloud Run.

## Architecture Overview

- **Backend**: Node.js Express API deployed to Cloud Run
- **Frontend**: React SPA (served by nginx) deployed to Cloud Run
- **CI/CD**: Cloud Build for automated builds and deployments
- **Container Registry**: GCR for Docker images
- **Secrets**: Secret Manager for sensitive data

## Prerequisites

1. **GCP Account**: Active Google Cloud Platform account
2. **GCP Project**: Create a new project or use an existing one
3. **Billing**: Enable billing on your GCP project
4. **gcloud CLI**: Install and configure the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
5. **Firebase**: Firebase project with Realtime Database configured

## Initial Setup

### 1. Set Up GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Secrets in Secret Manager

```bash
# Get project number (needed for service accounts)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Create OpenWeather API Key secret
echo -n "your-openweather-api-key" | \
  gcloud secrets create openweather-api-key \
  --data-file=-

# Grant Cloud Run access to the secret (using Compute Engine default service account)
gcloud secrets add-iam-policy-binding openweather-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Configure Firebase Credentials

You have two options:

#### Option A: Using Firebase Service Account (Recommended for Production)

```bash
# Create a secret for Firebase service account
gcloud secrets create firebase-service-account \
  --data-file=backend/serviceAccountKey.json

# Grant Cloud Run access (using Compute Engine default service account)
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Update `cloudbuild.yaml` to include:
```yaml
--set-secrets=FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest
```

#### Option B: Using Public Database Rules (Development/Testing)

The backend will work without service account credentials if your Firebase Realtime Database has appropriate read/write rules set. Just ensure `FIREBASE_DATABASE_URL` is set correctly.

## Deployment

### Method 1: Automated CI/CD with Cloud Build (Recommended)

#### Set Up Cloud Build Trigger

1. **Connect Repository**:
```bash
# Connect your GitHub repository to Cloud Build
# This creates a trigger that runs on every push to main
gcloud builds triggers create github \
  --repo-name=rent-redi-homework \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions="\
_REGION=$REGION,\
_FIREBASE_API_KEY=your-firebase-api-key,\
_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com,\
_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com,\
_FIREBASE_PROJECT_ID=your-project-id,\
_FIREBASE_STORAGE_BUCKET=your-project.appspot.com,\
_FIREBASE_MESSAGING_SENDER_ID=123456789,\
_FIREBASE_APP_ID=1:123456789:web:abc123"
```

2. **Manual Trigger** (for first deployment):
```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="\
_REGION=$REGION,\
_FIREBASE_API_KEY=your-firebase-api-key,\
_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com,\
_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com,\
_FIREBASE_PROJECT_ID=your-project-id,\
_FIREBASE_STORAGE_BUCKET=your-project.appspot.com,\
_FIREBASE_MESSAGING_SENDER_ID=123456789,\
_FIREBASE_APP_ID=1:123456789:web:abc123"
```

### Method 2: Manual Deployment

#### Deploy Backend

```bash
# Build and deploy backend
cd backend

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/rentredi-backend:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/rentredi-backend:latest

# Deploy to Cloud Run
gcloud run deploy rentredi-backend \
  --image=gcr.io/$PROJECT_ID/rentredi-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars=PORT=8080,FIREBASE_DATABASE_URL=https://your-project.firebaseio.com \
  --set-secrets=OPENWEATHER_API_KEY=openweather-api-key:latest \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10

# Get backend URL
export BACKEND_URL=$(gcloud run services describe rentredi-backend \
  --region=$REGION \
  --format='value(status.url)')

echo "Backend deployed at: $BACKEND_URL"
```

#### Deploy Frontend

```bash
# Build and deploy frontend
cd ../frontend

# Build Docker image with backend URL
docker build \
  --build-arg REACT_APP_API_URL=$BACKEND_URL \
  --build-arg REACT_APP_FIREBASE_API_KEY=your-firebase-api-key \
  --build-arg REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com \
  --build-arg REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com \
  --build-arg REACT_APP_FIREBASE_PROJECT_ID=your-project-id \
  --build-arg REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com \
  --build-arg REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789 \
  --build-arg REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123 \
  -t gcr.io/$PROJECT_ID/rentredi-frontend:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/rentredi-frontend:latest

# Deploy to Cloud Run
gcloud run deploy rentredi-frontend \
  --image=gcr.io/$PROJECT_ID/rentredi-frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5

# Get frontend URL
export FRONTEND_URL=$(gcloud run services describe rentredi-frontend \
  --region=$REGION \
  --format='value(status.url)')

echo "Frontend deployed at: $FRONTEND_URL"
```

## Verify Deployment

### Check Service Health

```bash
# Check backend health
curl $BACKEND_URL/health

# Check frontend health
curl $FRONTEND_URL/health

# View backend metrics
curl $BACKEND_URL/metrics
```

### View Deployment Info

```bash
# Backend service details
gcloud run services describe rentredi-backend --region=$REGION

# Frontend service details
gcloud run services describe rentredi-frontend --region=$REGION

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend" --limit 50
```

## Managing the Deployment

### Update Environment Variables

```bash
# Update backend environment variables
gcloud run services update rentredi-backend \
  --region=$REGION \
  --update-env-vars=NEW_VAR=value

# Update secrets
gcloud run services update rentredi-backend \
  --region=$REGION \
  --update-secrets=OPENWEATHER_API_KEY=openweather-api-key:latest
```

### Scale Services

```bash
# Update backend scaling
gcloud run services update rentredi-backend \
  --region=$REGION \
  --min-instances=1 \
  --max-instances=20 \
  --cpu=2 \
  --memory=1Gi
```

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service=rentredi-backend --region=$REGION

# Rollback to previous revision
gcloud run services update-traffic rentredi-backend \
  --region=$REGION \
  --to-revisions=REVISION_NAME=100
```

### Delete Services

```bash
# Delete backend
gcloud run services delete rentredi-backend --region=$REGION

# Delete frontend
gcloud run services delete rentredi-frontend --region=$REGION

# Delete container images
gcloud container images delete gcr.io/$PROJECT_ID/rentredi-backend:latest
gcloud container images delete gcr.io/$PROJECT_ID/rentredi-frontend:latest
```

## Cost Optimization

Cloud Run pricing is based on:
- CPU and memory allocated
- Number of requests
- Time the container is running

### Tips to Minimize Costs:

1. **Use min-instances=0**: Services scale to zero when idle
2. **Optimize memory**: Use smallest memory that works (256Mi-512Mi)
3. **Set CPU limits**: Use 1 CPU unless you need more
4. **Enable CDN**: For frontend static assets
5. **Set request timeouts**: Avoid long-running requests

Estimated costs (with moderate usage):
- Backend: $5-15/month
- Frontend: $2-5/month

## Monitoring & Logging

### View Logs

```bash
# Stream backend logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend"

# Stream frontend logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-frontend"
```

### Set Up Monitoring

The app includes built-in SRE metrics at `/health` and `/metrics` endpoints. You can:

1. Access the Admin Dashboard at: `$FRONTEND_URL/admin`
2. Set up Cloud Monitoring alerts
3. Use the synthetic probe: `npm run probe` (configure with `BACKEND_URL`)

## Custom Domain (Optional)

### Map Custom Domain to Cloud Run

```bash
# Map domain to frontend
gcloud run domain-mappings create \
  --service=rentredi-frontend \
  --domain=your-domain.com \
  --region=$REGION

# Map subdomain to backend
gcloud run domain-mappings create \
  --service=rentredi-backend \
  --domain=api.your-domain.com \
  --region=$REGION
```

Follow the instructions to add DNS records to your domain provider.

## Troubleshooting

### Build Fails

```bash
# Check Cloud Build logs
gcloud builds list
gcloud builds log BUILD_ID

# Test Docker build locally
docker build -t test ./backend
docker build -t test ./frontend
```

### Service Not Starting

```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Check service configuration
gcloud run services describe rentredi-backend --region=$REGION
```

### Frontend Can't Connect to Backend

1. Verify backend URL is correct in frontend build
2. Check CORS settings in `backend/server.js`
3. Ensure `--allow-unauthenticated` is set on backend

### High Costs

```bash
# Check request metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'

# Reduce min-instances to 0
gcloud run services update rentredi-backend \
  --region=$REGION \
  --min-instances=0
```

## Security Best Practices

1. **Use Secret Manager**: Never commit secrets to Git
2. **Enable Cloud Armor**: For DDoS protection (optional)
3. **Set Up IAM**: Restrict who can deploy services
4. **Enable VPC**: For private communication between services (optional)
5. **Use HTTPS**: Cloud Run provides HTTPS by default
6. **Implement Authentication**: Add authentication for admin endpoints

## CI/CD Workflow

The Cloud Build pipeline automatically:

1. ✅ Runs backend tests
2. 🔨 Builds backend Docker image
3. 📦 Pushes to Container Registry
4. 🚀 Deploys backend to Cloud Run
5. 🔍 Gets backend URL
6. 🔨 Builds frontend with backend URL
7. 📦 Pushes frontend to Container Registry
8. 🚀 Deploys frontend to Cloud Run
9. 📊 Displays deployment URLs

## Next Steps

After deployment:

1. **Set Up Monitoring**: Configure Prometheus + Grafana (see future guide)
2. **Enable Alerts**: Set up Cloud Monitoring alerts
3. **Configure Backups**: Set up Firebase backups
4. **Add Authentication**: Implement user authentication
5. **Custom Domain**: Map your domain to the services
6. **Load Testing**: Test performance with your expected load

## Support

For issues:
- Check Cloud Run logs: `gcloud logging read`
- Review Cloud Build history: `gcloud builds list`
- Monitor costs: [GCP Console](https://console.cloud.google.com/billing)
- Test health: `curl $BACKEND_URL/health`

---

**Deployment Status**: 🚀 Ready to deploy to production!
