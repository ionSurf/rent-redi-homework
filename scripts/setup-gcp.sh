#!/bin/bash

# RentRedi GCP Setup Script
# This script sets up the initial GCP environment

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
echo "  RentRedi GCP Setup"
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

# Set project
print_step "Setting GCP project..."
gcloud config set project $PROJECT_ID

# Get project number (needed for service accounts)
print_info "Getting project number..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
print_info "Project Number: $PROJECT_NUMBER"

# Enable required APIs
print_step "Enabling required GCP APIs..."
print_info "This may take a few minutes..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com

print_info "APIs enabled successfully"
echo ""

# Set up secrets
print_step "Setting up secrets..."
echo ""

# OpenWeather API Key
print_info "Enter your OpenWeather API Key (or press Enter to skip):"
read -s OPENWEATHER_KEY
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

# Firebase credentials
print_step "Do you want to set up Firebase service account? (y/n)"
read -r SETUP_FIREBASE
if [[ "$SETUP_FIREBASE" =~ ^[Yy]$ ]]; then
    print_info "Please provide the path to your Firebase service account JSON file:"
    read FIREBASE_KEY_PATH

    if [ -f "$FIREBASE_KEY_PATH" ]; then
        gcloud secrets create firebase-service-account \
          --data-file="$FIREBASE_KEY_PATH" 2>/dev/null || \
        gcloud secrets versions add firebase-service-account \
          --data-file="$FIREBASE_KEY_PATH"

        # Grant Cloud Run access (using Compute Engine default service account)
        gcloud secrets add-iam-policy-binding firebase-service-account \
          --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
          --role="roles/secretmanager.secretAccessor"

        print_info "Firebase service account secret created and permissions granted"
    else
        print_error "File not found: $FIREBASE_KEY_PATH"
        print_warning "You can create this secret later with:"
        echo "  gcloud secrets create firebase-service-account --data-file=path/to/serviceAccountKey.json"
    fi
else
    print_warning "Skipping Firebase service account setup"
    print_info "The backend will run in unauthenticated mode"
fi
echo ""

# Create environment file for deployment
print_step "Creating deployment configuration..."
cat > .env.gcp <<EOF
# GCP Deployment Configuration
export PROJECT_ID=$PROJECT_ID
export REGION=$REGION

# Firebase Configuration (replace with your values)
export FIREBASE_API_KEY=your-firebase-api-key
export FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
export FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
export FIREBASE_PROJECT_ID=your-project-id
export FIREBASE_STORAGE_BUCKET=your-project.appspot.com
export FIREBASE_MESSAGING_SENDER_ID=123456789
export FIREBASE_APP_ID=1:123456789:web:abc123
EOF

print_info "Created .env.gcp file with deployment variables"
print_warning "Please edit .env.gcp and update the Firebase configuration values"
echo ""

# Set up Cloud Build trigger (optional)
print_step "Do you want to set up automatic deployment on git push? (y/n)"
read -r SETUP_TRIGGER
if [[ "$SETUP_TRIGGER" =~ ^[Yy]$ ]]; then
    print_info "Please enter your GitHub username:"
    read GITHUB_USER
    print_info "Please enter your repository name (default: rent-redi-homework):"
    read REPO_NAME
    REPO_NAME="${REPO_NAME:-rent-redi-homework}"

    print_info "Connecting to GitHub repository..."
    print_warning "You may need to authorize Cloud Build to access your GitHub account"

    # Note: This requires the GitHub App to be installed
    # User will need to do this manually in the Cloud Console
    print_info "To complete the GitHub setup:"
    echo "  1. Go to: https://console.cloud.google.com/cloud-build/triggers"
    echo "  2. Click 'Connect Repository'"
    echo "  3. Select GitHub and authorize"
    echo "  4. Select repository: $GITHUB_USER/$REPO_NAME"
    echo "  5. Create a trigger with:"
    echo "     - Event: Push to a branch"
    echo "     - Branch: ^main$"
    echo "     - Build configuration: Cloud Build configuration file (cloudbuild.yaml)"
    echo ""
    print_info "Then update the trigger substitutions with your Firebase config"
else
    print_warning "Skipping automatic deployment setup"
    print_info "You can deploy manually with: ./scripts/deploy-gcp.sh"
fi
echo ""

# Summary
echo "============================================"
print_info "Setup Complete! 🎉"
echo "============================================"
echo ""
print_info "Next steps:"
echo ""
echo "1. Edit .env.gcp and update Firebase configuration:"
echo "   nano .env.gcp"
echo ""
echo "2. Source the environment file:"
echo "   source .env.gcp"
echo ""
echo "3. Deploy the application:"
echo "   ./scripts/deploy-gcp.sh"
echo ""
echo "4. (Optional) Set up Cloud Build trigger in the Console"
echo ""
print_info "For more details, see GCP_DEPLOYMENT.md"
echo ""
