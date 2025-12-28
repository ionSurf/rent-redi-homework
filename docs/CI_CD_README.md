# CI/CD Setup with GitHub Actions

This document provides a quick start guide for setting up CI/CD with GitHub Actions and Google Cloud Platform.

## Architecture Overview

```
┌─────────────┐
│   GitHub    │
│  (Git Push) │
└──────┬──────┘
       │
┌──────▼────────────┐
│ GitHub Actions    │
│ • Run Tests       │
│ • Build Images    │
└──────┬────────────┘
       │
┌──────▼────────────┐
│   Docker Hub      │
│  (Store Images)   │
└──────┬────────────┘
       │
┌──────▼────────────┐
│  Cloud Run        │
│ • Backend API     │
│ • Frontend SPA    │
└──────┬────────────┘
       │
┌──────▼────────────┐
│  Public HTTPS     │
│      URLs         │
└───────────────────┘
```

## Why GitHub Actions?

✅ **Free for public repos** (2000 minutes/month for private)
✅ **No GCP build costs** (Cloud Build charges per build minute)
✅ **Integrated with GitHub** (PR checks, status badges, etc.)
✅ **Fast builds** with caching
✅ **Easy to configure** with YAML workflows

## Quick Start

### Prerequisites

1. **GitHub Repository**: This repository
2. **GCP Account**: [Create free account](https://cloud.google.com/free)
3. **Firebase Project**: With Realtime Database configured

### One-Time Setup (5 minutes)

```bash
# 1. Run the setup script
./scripts/setup-github-actions.sh

# 2. Follow the prompts to:
#    - Enter your GCP Project ID
#    - Enter your preferred region
#    - Create service account
#    - Generate credentials

# 3. Add secrets to GitHub:
#    - Go to: Settings → Secrets and variables → Actions
#    - Add secrets from github-secrets.txt file
```

### Deploy

Simply push to main:

```bash
git push origin main
```

That's it! GitHub Actions will automatically:
1. ✅ Run backend tests
2. 🔨 Build Docker images
3. 📦 Push to Google Container Registry
4. 🚀 Deploy to Cloud Run
5. 🌐 Make it publicly accessible

## What Gets Deployed

### Backend Service
- **Name**: `rentredi-backend`
- **Platform**: Cloud Run (serverless)
- **Port**: 8080
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /metrics` - Application metrics
  - `POST /users` - Create user
  - `PUT /users/:id` - Update user
  - `DELETE /users/:id` - Delete user

### Frontend Service
- **Name**: `rentredi-frontend`
- **Platform**: Cloud Run (nginx)
- **Port**: 8080
- **Routes**:
  - `/` - Home page
  - `/users` - User management
  - `/admin` - SRE monitoring dashboard

## GitHub Workflow

### Trigger Events

The workflow runs on:

1. **Push to main** → Full deployment
2. **Pull requests** → Tests and builds only (no deployment)
3. **Manual trigger** → From Actions tab

### Workflow Jobs

#### Backend Job
```yaml
checkout → setup Node.js → install deps → run tests →
authenticate GCP → build Docker → push to GCR → deploy to Cloud Run
```

#### Frontend Job
```yaml
checkout → authenticate GCP → build Docker (with backend URL) →
push to GCR → deploy to Cloud Run
```

Jobs run in parallel where possible for faster builds.

## Required GitHub Secrets

Add these in: **Settings → Secrets and variables → Actions**

### Docker Hub Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | [Docker Hub Account](https://hub.docker.com) |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Settings → Security → New Access Token |

**Create Docker Hub account (free):**
1. Go to [hub.docker.com](https://hub.docker.com)
2. Sign up for free account
3. Go to Account Settings → Security → New Access Token
4. Create token with Read & Write permissions
5. Copy token to GitHub secrets

### GCP Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `my-project-123` |
| `GCP_REGION` | Deployment region | `us-central1` |
| `GCP_SA_KEY` | Service account key (JSON) | `{"type":"service_account"...}` |

### Firebase Secrets

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Auth domain |
| `FIREBASE_DATABASE_URL` | Database URL |
| `FIREBASE_PROJECT_ID` | Project ID |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `FIREBASE_APP_ID` | App ID |

**Get Firebase credentials:**
1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General
3. Your apps → Web app → Config

## Monitoring Deployments

### GitHub Actions Tab

View real-time build progress:
1. Go to repository → **Actions** tab
2. See running/completed workflows
3. Click workflow for detailed logs
4. View deployment URLs in summary

### Get Deployment URLs

After deployment, find URLs in:
- GitHub Actions → Workflow run → "Display deployment summary"

Or via command line:
```bash
# Backend
gcloud run services describe rentredi-backend \
  --region=us-central1 \
  --format='value(status.url)'

# Frontend
gcloud run services describe rentredi-frontend \
  --region=us-central1 \
  --format='value(status.url)'
```

### View Application Logs

```bash
# Backend logs
gcloud logging tail "resource.type=cloud_run_revision AND \
  resource.labels.service_name=rentredi-backend"

# Frontend logs
gcloud logging tail "resource.type=cloud_run_revision AND \
  resource.labels.service_name=rentredi-frontend"
```

## Development Workflow

### Working on a Feature

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Commit and push
git commit -am "Add new feature"
git push origin feature/my-feature
```

**What happens:**
- GitHub Actions runs tests
- Builds Docker images
- ❌ Does NOT deploy (only main branch deploys)
- PR shows build status ✅ or ❌

### Deploying to Production

```bash
# Create pull request on GitHub
# Review and merge PR

# Or merge locally:
git checkout main
git merge feature/my-feature
git push origin main
```

**What happens:**
- Tests run
- Images build and push to GCR
- Services deploy to Cloud Run
- New version is live! 🚀

## Cost Breakdown

### GitHub Actions
- **Public repos**: ✅ Free unlimited
- **Private repos**: 2,000 minutes/month free
- **This app usage**: ~5-10 minutes per deployment
- **Monthly cost**: $0 (within free tier)

### Docker Hub
- **Free tier**: Unlimited public repositories
- **Image pulls**: Unlimited for public images
- **Storage**: Included
- **Monthly cost**: $0

### Google Cloud Run
- **Free tier**:
  - 2M requests/month
  - 360,000 GB-seconds/month
  - 180,000 vCPU-seconds/month
- **Backend**: ~$5-10/month (moderate usage)
- **Frontend**: ~$2-5/month
- **Monthly cost**: ~$7-15 (often within free tier)

**Total**: ~$0-15/month (often free!)

### Cost Savings vs GCR

| Service | GCR Approach | Docker Hub Approach |
|---------|--------------|---------------------|
| Container Registry | $1-2/month | **$0** (free) |
| Everything else | Same | Same |
| **Total Savings** | - | **$1-2/month** |

## Scaling Configuration

Current settings optimize for cost (scale to zero):

### Backend
```yaml
--min-instances=0      # Scale to zero when idle
--max-instances=10     # Handle up to 10 concurrent instances
--memory=512Mi         # 512MB RAM per instance
--cpu=1                # 1 vCPU per instance
```

### Frontend
```yaml
--min-instances=0      # Scale to zero when idle
--max-instances=5      # Handle up to 5 concurrent instances
--memory=256Mi         # 256MB RAM per instance
--cpu=1                # 1 vCPU per instance
```

### Modify Scaling

Edit `.github/workflows/deploy.yml`:

```yaml
# Keep 1 instance always warm (faster response, higher cost)
--min-instances=1 \

# Allow more concurrent instances
--max-instances=20 \

# Increase resources
--memory=1Gi \
--cpu=2 \
```

## Rollback Strategies

### Option 1: Re-run Previous Workflow

1. Go to Actions tab
2. Find successful previous deployment
3. Click "Re-run all jobs"

### Option 2: Revert Git Commit

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force  # ⚠️ Use with caution
```

### Option 3: Cloud Run Traffic Splitting

```bash
# List revisions
gcloud run revisions list --service=rentredi-backend --region=us-central1

# Route 100% traffic to previous revision
gcloud run services update-traffic rentredi-backend \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

## Troubleshooting

### Build Fails in GitHub Actions

**Check the logs:**
1. Actions tab → Failed workflow → Failed job
2. Expand failed step to see error

**Common issues:**

| Error | Solution |
|-------|----------|
| `Authentication failed` | Check `GCP_SA_KEY` secret is valid JSON |
| `Tests failed` | Fix failing tests, push again |
| `Permission denied` | Verify service account has required roles |
| `Image push failed` | Check GCR is enabled, SA has storage.admin |

### Deployment Succeeds But Service Doesn't Start

```bash
# Check Cloud Run logs
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50

# Common issues:
# - Missing environment variables
# - Secrets not accessible
# - Port not set to 8080
```

### Frontend Can't Connect to Backend

1. Check backend deployed successfully
2. Verify CORS is enabled in backend
3. Check `REACT_APP_API_URL` was set correctly during frontend build
4. Test backend health: `curl $BACKEND_URL/health`

### High Costs

```bash
# Check request metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'

# Reduce min-instances to 0
gcloud run services update rentredi-backend \
  --region=us-central1 \
  --min-instances=0
```

## Security Best Practices

### Secrets Management

✅ **Do:**
- Store all secrets in GitHub Secrets (encrypted)
- Use GCP Secret Manager for runtime secrets
- Rotate service account keys every 90 days
- Use least-privilege IAM roles

❌ **Don't:**
- Commit secrets to repository
- Share service account keys
- Log sensitive information
- Use overly permissive roles

### Service Account Permissions

The GitHub Actions service account needs:
- `roles/run.admin` - Deploy Cloud Run services
- `roles/storage.admin` - Push to Container Registry
- `roles/iam.serviceAccountUser` - Use service accounts

Verify with:
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"
```

## Advanced Features

### Branch-Based Deployments

Deploy different branches to different environments:

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches:
      - main        # Production
      - staging     # Staging environment
      - develop     # Development environment
```

Use different service names per environment:
```yaml
BACKEND_SERVICE: rentredi-backend-${{ github.ref_name }}
```

### Build Caching

Already enabled for faster builds:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches node_modules
```

### Deployment Status Badge

Add to README.md:

```markdown
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)
```

## Next Steps

After successful deployment:

1. ✅ **Monitor**: Set up Cloud Monitoring alerts
2. ✅ **Custom Domain**: Map your domain to Cloud Run
3. ✅ **CDN**: Enable Cloud CDN for static assets
4. ✅ **Prometheus + Grafana**: Advanced monitoring (next guide)
5. ✅ **Authentication**: Add user auth to admin endpoints
6. ✅ **Staging**: Set up staging environment

## Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Full Setup Guide](./GITHUB_ACTIONS_SETUP.md)
- [GCP Deployment Guide](./GCP_DEPLOYMENT.md)

## Support

**GitHub Actions:**
- Check Actions tab for detailed logs
- Review [workflow syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)

**GCP Issues:**
- View logs: `gcloud logging read`
- Test health: `curl $BACKEND_URL/health`
- Check IAM: `gcloud projects get-iam-policy`

---

**Status**: 🚀 Automated CI/CD ready!
