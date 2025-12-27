# CI/CD Setup Guide

This document provides a quick start guide for setting up CI/CD with Google Cloud Platform.

## Quick Start

### Prerequisites

1. **GCP Account**: [Create a free account](https://cloud.google.com/free)
2. **gcloud CLI**: [Install gcloud](https://cloud.google.com/sdk/docs/install)
3. **Docker** (optional, for local testing): [Install Docker](https://docs.docker.com/get-docker/)

### One-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/rent-redi-homework.git
cd rent-redi-homework

# 2. Run the setup script
./scripts/setup-gcp.sh

# 3. Edit the environment file with your Firebase credentials
nano .env.gcp

# 4. Source the environment file
source .env.gcp
```

### Deploy to GCP

```bash
# Deploy the application
./scripts/deploy-gcp.sh
```

That's it! Your application will be deployed and publicly accessible.

## What Gets Deployed

### Backend (Cloud Run)
- **Service**: `rentredi-backend`
- **Port**: 8080
- **Endpoints**:
  - `/health` - Health check
  - `/metrics` - Application metrics
  - `/users` - User CRUD operations

### Frontend (Cloud Run)
- **Service**: `rentredi-frontend`
- **Port**: 8080 (nginx)
- **Routes**:
  - `/` - Home page
  - `/users` - User management
  - `/admin` - SRE monitoring dashboard

## Architecture

```
┌─────────────────┐
│   Cloud Build   │ ← GitHub Push
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Build   │
    │  & Test  │
    └────┬─────┘
         │
    ┌────▼──────────┐
    │   Container   │
    │   Registry    │
    │   (GCR)       │
    └────┬──────────┘
         │
    ┌────▼───────────┐
    │   Cloud Run    │
    │  ┌──────────┐  │
    │  │ Backend  │  │
    │  └──────────┘  │
    │  ┌──────────┐  │
    │  │ Frontend │  │
    │  └──────────┘  │
    └────────────────┘
         │
    ┌────▼────────┐
    │   Public    │
    │   Internet  │
    └─────────────┘
```

## CI/CD Pipeline

The `cloudbuild.yaml` file defines the complete CI/CD pipeline:

1. **Test Backend** - Runs Jest tests
2. **Build Backend** - Creates Docker image
3. **Push Backend** - Uploads to Container Registry
4. **Deploy Backend** - Deploys to Cloud Run
5. **Get Backend URL** - Retrieves the deployed URL
6. **Build Frontend** - Creates Docker image with backend URL
7. **Push Frontend** - Uploads to Container Registry
8. **Deploy Frontend** - Deploys to Cloud Run
9. **Display URLs** - Shows deployment information

## Local Testing

### Test Docker Builds Locally

```bash
# Build backend
cd backend
docker build -t rentredi-backend:local .
docker run -p 8080:8080 -e PORT=8080 rentredi-backend:local

# Build frontend (in another terminal)
cd frontend
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:8080 \
  --build-arg REACT_APP_FIREBASE_API_KEY=your-key \
  -t rentredi-frontend:local .
docker run -p 3000:8080 rentredi-frontend:local
```

### Test with Cloud Build Locally

```bash
# Install cloud-build-local
gcloud components install cloud-build-local

# Run build locally
cloud-build-local --config=cloudbuild.yaml \
  --dryrun=false \
  --substitutions=_REGION=us-central1 .
```

## Automated Deployments

### Set Up GitHub Trigger

After running `./scripts/setup-gcp.sh`, you can set up automatic deployments:

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Connect Repository"
3. Select GitHub and authorize
4. Choose your repository
5. Create trigger with:
   - **Event**: Push to a branch
   - **Branch**: `^main$`
   - **Configuration**: `cloudbuild.yaml`
   - **Substitutions**: Add your Firebase config

Now every push to `main` automatically deploys!

## Environment Variables

### Backend Environment Variables

Set in Cloud Run deployment:

| Variable | Source | Description |
|----------|--------|-------------|
| `PORT` | Auto-set | Cloud Run port (8080) |
| `FIREBASE_DATABASE_URL` | Substitution | Firebase Realtime Database URL |
| `OPENWEATHER_API_KEY` | Secret Manager | Weather API key |

### Frontend Build Arguments

Set during Docker build:

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API URL |
| `REACT_APP_FIREBASE_*` | Yes | Firebase configuration |

## Monitoring Deployments

### View Build History

```bash
# List recent builds
gcloud builds list --limit=10

# View specific build
gcloud builds log BUILD_ID
```

### View Deployment Status

```bash
# List services
gcloud run services list --region=us-central1

# View service details
gcloud run services describe rentredi-backend --region=us-central1
```

### View Live Logs

```bash
# Stream backend logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend"

# Stream frontend logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-frontend"
```

## Cost Estimates

Based on moderate usage (1000 requests/day):

- **Cloud Run**: $5-10/month
- **Container Registry**: $1-2/month
- **Cloud Build**: Free tier (120 build-minutes/day)
- **Secret Manager**: Free tier

**Total**: ~$6-12/month

### Free Tier Limits

Cloud Run free tier includes:
- 2 million requests/month
- 360,000 GB-seconds/month
- 180,000 vCPU-seconds/month

## Scaling Configuration

### Current Settings

**Backend:**
- Min instances: 0 (scales to zero)
- Max instances: 10
- Memory: 512Mi
- CPU: 1

**Frontend:**
- Min instances: 0 (scales to zero)
- Max instances: 5
- Memory: 256Mi
- CPU: 1

### Modify Scaling

Edit `cloudbuild.yaml` to change scaling parameters:

```yaml
--min-instances=1       # Keep 1 instance warm
--max-instances=20      # Allow up to 20 instances
--memory=1Gi            # Increase memory
--cpu=2                 # Use 2 CPUs
```

## Rollback Strategy

### Automatic Rollback

Cloud Run keeps previous revisions. To rollback:

```bash
# List revisions
gcloud run revisions list \
  --service=rentredi-backend \
  --region=us-central1

# Route traffic to specific revision
gcloud run services update-traffic rentredi-backend \
  --region=us-central1 \
  --to-revisions=rentredi-backend-00001-abc=100
```

### Blue-Green Deployment

Split traffic between versions:

```bash
# Route 90% to new, 10% to old
gcloud run services update-traffic rentredi-backend \
  --region=us-central1 \
  --to-revisions=NEW_REVISION=90,OLD_REVISION=10
```

## Security

### Secrets Management

All secrets are stored in Secret Manager:

```bash
# List secrets
gcloud secrets list

# View secret metadata
gcloud secrets describe openweather-api-key

# Update secret
echo -n "new-secret-value" | \
  gcloud secrets versions add openweather-api-key --data-file=-
```

### IAM Permissions

Required roles for deployment:

- `roles/run.admin` - Deploy Cloud Run services
- `roles/iam.serviceAccountUser` - Use service accounts
- `roles/cloudbuild.builds.editor` - Manage builds
- `roles/storage.admin` - Manage container images

## Troubleshooting

### Common Issues

**Build Fails with "permission denied"**
```bash
# Check IAM permissions
gcloud projects get-iam-policy $PROJECT_ID

# Grant Cloud Build service account permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"
```

**Frontend can't connect to backend**
- Verify `REACT_APP_API_URL` is set correctly in frontend build
- Check backend CORS settings
- Ensure backend has `--allow-unauthenticated` flag

**High costs**
- Check min-instances is set to 0
- Review request patterns
- Consider implementing caching
- Use Cloud Monitoring to identify expensive operations

### Debug Deployment

```bash
# Check service logs
gcloud run services describe rentredi-backend --region=us-central1

# View recent errors
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50

# Test health endpoint
curl https://your-backend-url/health
```

## Next Steps

1. ✅ Deploy to GCP (you are here)
2. ⏭️ Set up Prometheus + Grafana monitoring
3. ⏭️ Configure custom domain
4. ⏭️ Implement authentication
5. ⏭️ Set up Cloud Armor for DDoS protection

---

For detailed information, see [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md)
