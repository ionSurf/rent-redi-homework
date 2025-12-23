# CodeSandbox Setup Guide

This guide explains how to run this project in CodeSandbox with automatic API URL detection.

## Automatic Configuration

The frontend automatically detects when running in CodeSandbox and configures the API URL accordingly.

### How It Works

1. **CodeSandbox Detection**: The app checks for `process.env.CODESANDBOX_HOST`
2. **Direct URL Usage**: Uses the provided host as-is (already includes port)
3. **HTTPS URL**: Constructs `https://{CODESANDBOX_HOST}`

Example:
- `CODESANDBOX_HOST=w9pd4h-8080.csb.app` (backend)
- Backend URL becomes: `https://w9pd4h-8080.csb.app`
- Frontend runs on: `https://w9pd4h-3000.csb.app`

## Setup Steps

### 1. Fork or Import Project
1. Open CodeSandbox
2. Import this repository or fork the sandbox
3. CodeSandbox will automatically set `CODESANDBOX_HOST`

### 2. Configure Firebase (Frontend)
1. Create `.env` file in `frontend/` directory:
```bash
cd frontend
cp .env.example .env
```

2. Update with your Firebase credentials:
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
| `CODESANDBOX_HOST` | Auto-set | - | Set automatically by CodeSandbox |
| `REACT_APP_API_URL` | No | Auto-detect | Override API URL if needed |
| `REACT_APP_FIREBASE_*` | Yes | - | Firebase configuration |

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8080 | Backend server port |
| `BACKEND_URL` | No | Auto-detect | For synthetic probe |
| `OPENWEATHER_API_KEY` | No | Included | Weather API key |

## Troubleshooting

### Frontend can't connect to backend

**Check 1: API URL**
- Open browser console
- Look for: `🔗 API Base URL: ...`
- Should show CodeSandbox URL, not localhost

**Check 2: CORS**
- Backend has CORS enabled by default
- If issues persist, check `backend/server.js` CORS config

**Check 3: Ports**
- Backend must be on port 8080
- Frontend must be on port 3000
- CodeSandbox should handle this automatically

### Backend shows Firebase warnings

This is normal if you haven't added `serviceAccountKey.json`. The backend will still work in unauthenticated mode.

To fix:
1. See `backend/SETUP_FIREBASE.md`
2. Download service account key
3. Upload to `backend/serviceAccountKey.json`

### "Mixed Content" errors

If you see mixed content warnings:
- Make sure backend URL uses `https://` in CodeSandbox
- Check `frontend/src/config/api.js`
- Verify `CODESANDBOX_HOST` is set

## Manual Override

If automatic detection doesn't work, manually set the API URL:

### Frontend
Create `frontend/.env`:
```env
REACT_APP_API_URL=https://your-sandbox-8080.csb.app
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
