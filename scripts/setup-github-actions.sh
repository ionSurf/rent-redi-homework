#!/bin/bash

# GitHub Actions Setup Script for GCP Deployment
# This script sets up the GCP environment for GitHub Actions CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "============================================"
echo "  GitHub Actions GCP Setup"
echo "============================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
if [ -z "$PROJECT_ID" ]; then
    print_step "Please enter your GCP Project ID:"
    read PROJECT_ID
    export PROJECT_ID
fi

# Get region
if [ -z "$REGION" ]; then
    print_step "Please enter your preferred region (default: us-central1):"
    read REGION
    REGION="${REGION:-us-central1}"
    export REGION
fi

print_info "Project ID: $PROJECT_ID"
print_info "Region: $REGION"
echo ""

# Login and set project
print_step "Configuring gcloud..."
gcloud config set project $PROJECT_ID

# Get project number (needed for service accounts)
print_info "Getting project number..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
print_info "Project Number: $PROJECT_NUMBER"

# Enable required APIs (no need for Container Registry since using Docker Hub)
print_step "Enabling required GCP APIs..."
print_info "This may take a few minutes..."
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com

print_info "APIs enabled successfully"
echo ""

# Create service account for GitHub Actions
print_step "Creating service account for GitHub Actions..."

SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create $SA_NAME \
  --description="Service account for GitHub Actions CI/CD" \
  --display-name="GitHub Actions" 2>/dev/null || \
  print_warning "Service account already exists"

# Grant necessary roles (only need Cloud Run access, not storage since using Docker Hub)
print_info "Granting IAM roles..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin" \
  --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

print_info "IAM roles granted successfully"
echo ""

# Create service account key
print_step "Creating service account key..."

KEY_FILE="github-actions-key.json"

gcloud iam service-accounts keys create $KEY_FILE \
  --iam-account=$SA_EMAIL

print_info "Service account key created: $KEY_FILE"
echo ""

# Display the key
print_warning "IMPORTANT: Copy the following JSON and add it to GitHub Secrets"
print_warning "Secret name: GCP_SA_KEY"
echo ""
echo "============================================"
cat $KEY_FILE
echo "============================================"
echo ""

# Set up application secrets
print_step "Setting up application secrets in GCP Secret Manager..."
echo ""

# OpenWeather API Key
print_info "Enter your OpenWeather API Key (or press Enter to skip):"
read -s OPENWEATHER_KEY
echo ""
if [ -n "$OPENWEATHER_KEY" ]; then
    echo -n "$OPENWEATHER_KEY" | gcloud secrets create openweather-api-key \
      --data-file=- 2>/dev/null || \
    echo -n "$OPENWEATHER_KEY" | gcloud secrets versions add openweather-api-key \
      --data-file=-

    # Grant Cloud Run access (using Compute Engine default service account)
    gcloud secrets add-iam-policy-binding openweather-api-key \
      --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
      --role="roles/secretmanager.secretAccessor"

    print_info "OpenWeather API Key secret created and permissions granted"
else
    print_warning "Skipping OpenWeather API Key setup"
fi
echo ""

# Create GitHub secrets reference file
print_step "Creating GitHub Secrets reference file..."

cat > github-secrets.txt <<EOF
# GitHub Secrets Configuration
# Add these secrets to your GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret

## Docker Hub Configuration
DOCKERHUB_USERNAME=your-docker-hub-username
DOCKERHUB_TOKEN=your-docker-hub-access-token

# How to get Docker Hub credentials:
# 1. Create account at https://hub.docker.com (free)
# 2. Go to Account Settings → Security → New Access Token
# 3. Create token with Read & Write permissions
# 4. Copy username and token to GitHub secrets

## GCP Configuration
GCP_PROJECT_ID=$PROJECT_ID
GCP_REGION=$REGION
GCP_SA_KEY=<paste the JSON from $KEY_FILE>

## Firebase Configuration (replace with your values)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123

# How to get Firebase credentials:
# 1. Go to https://console.firebase.google.com/
# 2. Select your project
# 3. Go to Project Settings (gear icon) → General
# 4. Scroll to "Your apps" → Web app → Config
# 5. Copy each value to the corresponding GitHub secret
EOF

print_info "Created github-secrets.txt with instructions"
echo ""

# Summary
echo "============================================"
print_info "Setup Complete! 🎉"
echo "============================================"
echo ""
print_info "Next steps:"
echo ""
echo "1. Add secrets to GitHub repository:"
echo "   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo "   - Add each secret from github-secrets.txt"
echo "   - For GCP_SA_KEY, paste the entire JSON from $KEY_FILE"
echo ""
echo "2. Update Firebase secrets in github-secrets.txt with your values"
echo ""
echo "3. Push to main branch to trigger deployment:"
echo "   git push origin main"
echo ""
echo "4. Monitor deployment:"
echo "   - Go to GitHub Actions tab in your repository"
echo "   - Watch the workflow run"
echo ""
print_warning "SECURITY: Delete the service account key file after adding to GitHub:"
echo "   rm $KEY_FILE"
echo ""
print_info "For detailed instructions, see GITHUB_ACTIONS_SETUP.md"
echo ""
