# GitHub Actions CI/CD Setup Guide

This guide covers setting up automated CI/CD using GitHub Actions with deployment to Google Cloud Run.

## Overview

**CI/CD Flow:**
```
GitHub Push → GitHub Actions (Test & Build) → Google Container Registry → Cloud Run (Deploy)
```

**Architecture:**
- **CI/CD**: GitHub Actions (free for public repos, 2000 minutes/month for private)
- **Container Registry**: Google Container Registry (GCR)
- **Hosting**: Google Cloud Run (serverless containers)

## Prerequisites

1. **GitHub Repository**: Fork or clone this repository
2. **GCP Account**: [Create free account](https://cloud.google.com/free)
3. **Firebase Project**: With Realtime Database configured
4. **gcloud CLI**: [Install gcloud](https://cloud.google.com/sdk/docs/install) (for initial setup)

## Quick Start

### 1. Set Up GCP Project

```bash
# Set your project ID and region
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Login and set project
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions" \
  --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Display the key (you'll need this for GitHub Secrets)
cat github-actions-key.json
```

⚠️ **Important**: Save this JSON key securely and delete the file after adding to GitHub Secrets.

### 3. Create GCP Secrets (for application)

```bash
# Create OpenWeather API Key secret
echo -n "your-openweather-api-key" | \
  gcloud secrets create openweather-api-key \
  --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding openweather-api-key \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### GCP Configuration
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GCP_PROJECT_ID` | `your-project-id` | Your GCP project ID |
| `GCP_REGION` | `us-central1` | Your preferred GCP region |
| `GCP_SA_KEY` | `{...json content...}` | Service account key JSON (entire content) |

#### Firebase Configuration
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `FIREBASE_API_KEY` | `AIza...` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase auth domain |
| `FIREBASE_DATABASE_URL` | `https://your-project.firebaseio.com` | Firebase database URL |
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | `1:123:web:abc` | Firebase app ID |

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) → General
4. Scroll to "Your apps" → Web app → Config
5. Copy each value to the corresponding GitHub secret

### 5. Enable GitHub Actions

The workflow is already configured in `.github/workflows/deploy.yml`.

**Workflow triggers:**
- ✅ Push to `main` branch → Runs tests, builds, and deploys
- ✅ Pull requests to `main` → Runs tests and builds only
- ✅ Manual trigger → Can be triggered from Actions tab

### 6. Deploy!

Simply push to main:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically:
1. Run backend tests
2. Build backend Docker image
3. Push to Google Container Registry
4. Deploy backend to Cloud Run
5. Build frontend Docker image (with backend URL)
6. Push frontend to GCR
7. Deploy frontend to Cloud Run
8. Display deployment URLs

## Monitoring Deployments

### View GitHub Actions

1. Go to your repository on GitHub
2. Click "Actions" tab
3. See workflow runs and logs

### View Deployment URLs

After successful deployment:
1. Go to Actions tab
2. Click on the latest workflow run
3. Click on "Display deployment summary" step
4. URLs will be displayed there

Or get URLs via gcloud:

```bash
# Backend URL
gcloud run services describe rentredi-backend \
  --region=$REGION \
  --format='value(status.url)'

# Frontend URL
gcloud run services describe rentredi-frontend \
  --region=$REGION \
  --format='value(status.url)'
```

## Workflow Details

### Backend Job

1. **Checkout code**: Gets latest code from repository
2. **Set up Node.js**: Installs Node.js 18
3. **Install dependencies**: Runs `npm ci` in backend
4. **Run tests**: Executes Jest tests
5. **Authenticate to GCP**: Uses service account key
6. **Build Docker image**: Creates backend container
7. **Push to GCR**: Uploads image to Container Registry
8. **Deploy to Cloud Run**: Deploys backend (main branch only)

### Frontend Job

1. **Checkout code**: Gets latest code
2. **Authenticate to GCP**: Uses service account key
3. **Build Docker image**: Creates frontend with backend URL
4. **Push to GCR**: Uploads image
5. **Deploy to Cloud Run**: Deploys frontend (main branch only)

## Cost Breakdown

### GitHub Actions
- **Public repos**: Free unlimited
- **Private repos**: 2,000 minutes/month free
- **Additional**: $0.008/minute

### Google Cloud Run
- **Backend**: ~$5-10/month (moderate usage)
- **Frontend**: ~$2-5/month
- **Free tier**: 2M requests/month

### Google Container Registry
- **Storage**: ~$1-2/month
- **Network**: Minimal for typical usage

**Total Estimated Cost**: $6-15/month (often within free tiers)

## Development Workflow

### Feature Development

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/my-feature
```

**What happens:**
- GitHub Actions runs tests and builds on PR
- No deployment occurs (only on main branch)
- Review build results in PR checks

### Deploying to Production

```bash
# Merge to main
git checkout main
git merge feature/my-feature
git push origin main
```

**What happens:**
- Tests run
- Images build
- Services deploy to Cloud Run
- New version is live!

## Manual Deployment

If you need to deploy manually:

```bash
# Using gcloud builds submit (Cloud Build)
gcloud builds submit --config=cloudbuild.yaml

# Or use the deployment script
source .env.gcp
./scripts/deploy-gcp.sh
```

## Environment-Specific Deployments

### Staging Environment

To add a staging environment:

1. Create staging secrets in GitHub
2. Modify workflow to deploy to staging on specific branch:

```yaml
on:
  push:
    branches:
      - main      # Production
      - staging   # Staging
```

3. Use different service names:
```yaml
BACKEND_SERVICE: rentredi-backend-staging
FRONTEND_SERVICE: rentredi-frontend-staging
```

### Preview Deployments

For PR previews, add to workflow:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

Deploy to temporary Cloud Run services with PR number in name.

## Rollback

### Using GitHub

1. Go to Actions tab
2. Find successful previous deployment
3. Click "Re-run jobs"

### Using gcloud

```bash
# List revisions
gcloud run revisions list \
  --service=rentredi-backend \
  --region=$REGION

# Route traffic to previous revision
gcloud run services update-traffic rentredi-backend \
  --region=$REGION \
  --to-revisions=rentredi-backend-00001-abc=100
```

## Troubleshooting

### Build Fails on GitHub Actions

**Check logs:**
1. Go to Actions tab
2. Click failed workflow
3. Click failed job
4. Expand failing step

**Common issues:**

**Authentication fails:**
- Verify `GCP_SA_KEY` secret is correct JSON
- Ensure service account has required roles

**Tests fail:**
- Check test output in logs
- Tests must pass before deployment

**Docker build fails:**
- Check Dockerfile syntax
- Verify build context includes all files

### Deployment Fails

**Permission errors:**
```bash
# Verify service account roles
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"
```

**Backend URL not available for frontend:**
- Check backend deployment succeeded first
- Frontend depends on backend job output

### Service Not Starting

**View Cloud Run logs:**
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=rentredi-backend" \
  --limit=50
```

**Common issues:**
- Environment variables not set
- Secrets not accessible
- Port configuration incorrect (must be 8080)

## Security Best Practices

### Secrets Management

✅ **Do:**
- Store all credentials in GitHub Secrets
- Use GCP Secret Manager for runtime secrets
- Rotate service account keys regularly
- Use least-privilege IAM roles

❌ **Don't:**
- Commit secrets to repository
- Share service account keys
- Use overly permissive roles
- Log sensitive information

### Service Account Security

```bash
# Audit service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"

# Rotate service account key
gcloud iam service-accounts keys create new-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com
```

## Advanced Configuration

### Caching Dependencies

The workflow already uses Node.js cache:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Parallel Jobs

To speed up builds, jobs run in parallel:
- Backend tests → Backend deploy
- Frontend build waits for backend URL

### Build Artifacts

Store build artifacts for debugging:

```yaml
- uses: actions/upload-artifact@v3
  with:
    name: backend-test-results
    path: backend/coverage
```

## Monitoring & Alerts

### GitHub Actions Notifications

Enable notifications:
1. GitHub Settings → Notifications
2. Enable "Actions" workflow notifications

### Cloud Monitoring

Set up alerts in GCP Console:
1. Go to Monitoring → Alerting
2. Create policy for Cloud Run metrics
3. Set notification channels

### Custom Metrics

The app exposes `/health` and `/metrics` endpoints:

```bash
# Check health
curl https://your-backend-url/health

# View metrics
curl https://your-backend-url/metrics
```

## Next Steps

After successful deployment:

1. ✅ **Monitor**: Check logs and metrics in GCP Console
2. ✅ **Custom Domain**: Map your domain to Cloud Run services
3. ✅ **Monitoring**: Set up Prometheus + Grafana
4. ✅ **CDN**: Enable Cloud CDN for static assets
5. ✅ **Authentication**: Add user authentication
6. ✅ **Staging**: Set up staging environment

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GCR Documentation](https://cloud.google.com/container-registry/docs)
- [Firebase Console](https://console.firebase.google.com/)

## Support

**GitHub Actions issues:**
- Check Actions tab for logs
- Review workflow file syntax
- Verify secrets are set correctly

**GCP issues:**
- Check Cloud Run logs: `gcloud logging read`
- Verify IAM permissions
- Test health endpoint: `curl $BACKEND_URL/health`

---

**Status**: 🚀 Ready for automated deployments!
