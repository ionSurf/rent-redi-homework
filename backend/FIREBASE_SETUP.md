# Firebase Backend Configuration Guide

## Understanding Firebase SDKs

There are **TWO different** Firebase SDKs, and you **cannot mix them**:

### 1. Firebase Client SDK (Frontend - Web Browsers)
**Package:** `firebase`
**Used in:** React, Vue, Angular apps

```javascript
// Frontend example
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Reading data
const dataRef = ref(db, 'users');
const snapshot = await get(dataRef);
```

### 2. Firebase Admin SDK (Backend - Node.js Servers)
**Package:** `firebase-admin`
**Used in:** Express, Node.js backend servers

```javascript
// Backend example
const admin = require("firebase-admin");

admin.initializeApp({
  databaseURL: "https://your-project.firebaseio.com"
});

const db = admin.database();

// Reading data
const snapshot = await db.ref('users').once('value');
```

## Current Backend Setup

### File: `backend/firebaseConfig.js`

```javascript
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();

module.exports = { admin, db };
```

### File: `backend/server.js`

```javascript
const { admin, db } = require("./firebaseConfig");

// Now you can use:
db.ref("users").once("value")          // Get all users
db.ref("users").push()                 // Create new user
db.ref(`users/${id}`).update(data)     // Update user
db.ref(`users/${id}`).remove()         // Delete user
```

## Current Status

✅ **Works for Development**
- Public database URL (no authentication required)
- Good for demos and testing
- Limited write permissions

⚠️ **For Production**
You need a service account key for full permissions.

## How to Add Full Firebase Credentials (Production)

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ Settings → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the JSON file as `serviceAccountKey.json`

### Step 2: Add to Backend

**Option A: Using JSON file**

```javascript
// backend/firebaseConfig.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com"
});
```

**Option B: Using Environment Variables (More Secure)**

```javascript
// backend/firebaseConfig.js
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
```

Create `.env` file:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://rentredi-short-take-home-default-rtdb.firebaseio.com
```

Then install and use dotenv:
```bash
npm install dotenv
```

```javascript
// At the top of server.js
require('dotenv').config();
```

### Step 3: Security

**IMPORTANT: Never commit credentials to git!**

Add to `.gitignore`:
```
serviceAccountKey.json
.env
```

## API Differences

| Operation | Admin SDK (Backend) | Client SDK (Frontend) |
|-----------|-------------------|---------------------|
| Initialize | `admin.initializeApp()` | `initializeApp()` |
| Get DB | `admin.database()` | `getDatabase(app)` |
| Reference | `db.ref('path')` | `ref(db, 'path')` |
| Read once | `.once('value')` | `get(ref(...))` |
| Listen | `.on('value', callback)` | `onValue(ref(...), callback)` |
| Write | `.set(data)` | `set(ref(...), data)` |
| Update | `.update(data)` | `update(ref(...), data)` |
| Delete | `.remove()` | `remove(ref(...))` |
| Push | `.push()` | `push(ref(...))` |
| Server timestamp | `admin.database.ServerValue.TIMESTAMP` | `serverTimestamp()` |

## Testing the Backend

### 1. Start the server
```bash
cd backend
node server.js
```

### 2. Test the welcome endpoint
```bash
curl http://localhost:8080/
# Should return: Welcome to the RentRedi interview!
```

### 3. Create a user (requires working OpenWeather API)
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "zip": "10001"}'
```

### 4. Get all users
```bash
curl http://localhost:8080/users
```

## Troubleshooting

### Error: "db.ref is not a function"
**Cause:** You're using Client SDK code in the backend
**Solution:** Use Admin SDK methods (see API table above)

### Error: "Failed to fetch Google OAuth2 access token"
**Cause:** Missing service account credentials
**Solution:** Add service account key (see Step 2 above)

### Error: "Permission denied"
**Cause:** Firebase security rules or missing credentials
**Solution:**
1. Check Firebase Console → Database → Rules
2. Add service account credentials

### Error: "EADDRINUSE: port already in use"
**Cause:** Server already running
**Solution:** `pkill -f "node server.js"` then restart

## Firebase Realtime Database Rules

For development, you can use open rules (⚠️ not for production):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production with authentication:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$userId": {
        ".write": "auth.uid === $userId"
      }
    }
  }
}
```

## Summary

✅ **Current Setup:** Working with public database URL
✅ **What Works:** All CRUD operations (with limited permissions)
⚠️ **What's Needed for Production:** Service account key
✅ **Backend Uses:** Firebase Admin SDK
✅ **Frontend Uses:** Firebase Client SDK (different package!)

**Key Takeaway:** Backend and Frontend use DIFFERENT Firebase SDKs with DIFFERENT APIs. Never copy frontend Firebase config to backend!
