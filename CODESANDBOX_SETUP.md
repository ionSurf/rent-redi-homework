# CodeSandbox Setup Guide

This guide explains how to run this project in CodeSandbox with automatic API URL detection.

## Configuration

You need to configure the backend URL using environment variables.

### How It Works

The frontend reads the backend URL from the `.env` file:
1. Create `frontend/.env` file
2. Set `REACT_APP_API_URL` to your backend URL
3. Restart the development server

Example `.env` file:
```env
# For CodeSandbox - replace with your actual sandbox ID
REACT_APP_API_URL=https://w9pd4h-8080.csb.app

# For local development (default if not set)
# REACT_APP_API_URL=http://localhost:8080
```

## Setup Steps

### 1. Fork or Import Project
1. Open CodeSandbox
2. Import this repository or fork the sandbox
3. Note your backend URL (e.g., `https://w9pd4h-8080.csb.app`)

### 2. Configure Frontend Environment
1. Create `.env` file in `frontend/` directory:
```bash
cd frontend
cp .env.example .env
```

2. Set your backend URL:
```env
REACT_APP_API_URL=https://your-sandbox-id-8080.csb.app
```

3. Update with your Firebase credentials:
```env
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Configure Firebase (Backend) - Optional
If you want to use Firebase Admin SDK with credentials:

1. Download service account key from Firebase Console
2. Upload to `backend/serviceAccountKey.json`

OR set environment variable:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

The backend will work without credentials (with limited functionality).

### 4. Start the Application

CodeSandbox will automatically run both:
- **Backend**: Port 8080
- **Frontend**: Port 3000

The frontend will automatically detect and connect to the backend.

## Verifying Setup

### Check API URL Detection
Open browser console in the frontend, you should see:
```
🔗 API Base URL: https://rfjmrz-8080.csb.app
```

### Check Backend Connection
1. Navigate to `/admin` in the frontend
2. You should see system health and metrics
3. If connection fails, check CORS settings

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | Recommended | `http://localhost:8080` | Backend API URL |
| `REACT_APP_FIREBASE_*` | Yes | - | Firebase configuration |

**Note**: In CodeSandbox, set `REACT_APP_API_URL` to your backend URL (e.g., `https://your-id-8080.csb.app`).

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8080 | Backend server port |
| `BACKEND_URL` | No | Auto-detect | For synthetic probe |
| `OPENWEATHER_API_KEY` | No | Included | Weather API key |

## Troubleshooting

### Frontend can't connect to backend

**Check 1: API URL in .env**
- Verify `frontend/.env` exists
- Check `REACT_APP_API_URL` is set correctly
- In CodeSandbox: Should be `https://your-id-8080.csb.app`
- In local dev: Should be `http://localhost:8080` (or omit for default)

**Check 2: Console output**
- Open browser console
- Look for: `🔗 API Base URL: ...`
- Should show the correct backend URL

**Check 3: Restart dev server**
- After changing `.env`, you must restart:
  ```bash
  cd frontend
  npm start
  ```

**Check 4: CORS**
- Backend has CORS enabled by default
- If issues persist, check `backend/server.js` CORS config

### Backend shows Firebase warnings

This is normal if you haven't added `serviceAccountKey.json`. The backend will still work in unauthenticated mode.

To fix:
1. See `backend/SETUP_FIREBASE.md`
2. Download service account key
3. Upload to `backend/serviceAccountKey.json`

### "Mixed Content" errors

If you see mixed content warnings:
- In CodeSandbox, make sure `REACT_APP_API_URL` uses `https://` (not `http://`)
- Check `frontend/.env` file
- Correct: `REACT_APP_API_URL=https://your-id-8080.csb.app`
- Wrong: `REACT_APP_API_URL=http://your-id-8080.csb.app`

## Quick Setup Summary

### Frontend
Create `frontend/.env`:
```env
# Set your backend URL
REACT_APP_API_URL=https://your-sandbox-8080.csb.app

# Add Firebase credentials
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# ... (see .env.example for all fields)
```

### Backend (for probe)
Create `backend/.env`:
```env
BACKEND_URL=https://your-sandbox-8080.csb.app
```

## Local Development

The same code works locally without any changes:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

No need to modify `.env` files when switching between local and CodeSandbox.

## Testing the Setup

1. **Create a user**: Navigate to `/users` and add a user
2. **Check monitoring**: Navigate to `/admin` to see health metrics
3. **Run probe**: In CodeSandbox terminal:
   ```bash
   cd backend
   npm run probe
   ```

All should work automatically with CodeSandbox URLs! 🚀
