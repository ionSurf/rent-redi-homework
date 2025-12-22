# Frontend Firebase Authentication Setup Guide

## Step 1: Enable Google Authentication in Firebase Console

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
Click on **"rentredi-short-take-home"**

### 3. Enable Authentication
1. Click **"Authentication"** in the left sidebar
2. Click **"Get Started"** (if this is your first time)
3. Click on the **"Sign-in method"** tab
4. Click on **"Google"** in the providers list
5. Toggle the **"Enable"** switch
6. Enter a project support email (your email address)
7. Click **"Save"**

## Step 2: Get Your Web App Configuration

### 1. Go to Project Settings
1. Click the ⚙️ gear icon → **"Project Settings"**
2. Scroll down to **"Your apps"** section
3. If you don't have a web app, click the **"</>  Web"** icon to add one
4. Give it a nickname (e.g., "Frontend Web App")
5. Check **"Also set up Firebase Hosting"** if you want (optional)
6. Click **"Register app"**

### 2. Copy Your Firebase Config
You'll see a code snippet that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "rentredi-short-take-home.firebaseapp.com",
  databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
  projectId: "rentredi-short-take-home",
  storageBucket: "rentredi-short-take-home.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy these exact values!**

## Step 3: Update Your Frontend Config

### 1. Open `frontend/src/firebaseConfig.js`

### 2. Replace the placeholder values with YOUR actual values

Example:
```javascript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // YOUR API KEY
  authDomain: "rentredi-short-take-home.firebaseapp.com",
  databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
  projectId: "rentredi-short-take-home",
  storageBucket: "rentredi-short-take-home.appspot.com",
  messagingSenderId: "123456789012", // YOUR SENDER ID
  appId: "1:123456789012:web:abcdef1234567890" // YOUR APP ID
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### 3. Save the file

## Step 4: Add Authorized Domains

### 1. In Firebase Console → Authentication
1. Go to the **"Settings"** tab (next to "Sign-in method")
2. Scroll to **"Authorized domains"**
3. Add your localhost domain if not already there:
   - `localhost` (should be there by default)

### 2. For Production
When you deploy, add your production domain here too.

## Step 5: Restart Your Frontend

```bash
cd frontend
npm start
```

## Verification Checklist

✅ Firebase Authentication is enabled
✅ Google Sign-In provider is enabled
✅ Web app is registered in Firebase Console
✅ firebaseConfig.js has real values (not placeholders)
✅ All config values are copied correctly
✅ Frontend server restarted

## Testing

1. Open http://localhost:3000
2. You should see the login page
3. Click "Continue with Google"
4. A Google Sign-In popup should appear
5. Sign in with your Google account
6. You should be redirected to the dashboard

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
**Cause:** Authentication not enabled in Firebase Console
**Solution:** Follow Step 1 above

### Error: "Firebase: Error (auth/unauthorized-domain)"
**Cause:** Your domain isn't authorized
**Solution:** Add your domain in Firebase Console → Authentication → Settings → Authorized domains

### Error: "Firebase: Error (auth/invalid-api-key)"
**Cause:** Wrong API key in firebaseConfig.js
**Solution:** Copy the exact values from Firebase Console

### Google Sign-In popup doesn't appear
**Causes:**
1. Pop-up blocker is enabled
2. Browser privacy settings blocking third-party cookies
**Solutions:**
1. Allow popups for localhost
2. Try in incognito/private mode
3. Check browser console for errors

### Values are correct but still not working
**Solution:**
1. Clear browser cache
2. Restart frontend server
3. Check Firebase Console → Authentication → Users to see if users are being created

## Security Notes

### Is it safe to commit Firebase config to git?

**YES** - The frontend config (API keys) can be public. They are:
- ✅ Meant to be in client-side code
- ✅ Protected by Firebase Security Rules
- ✅ Protected by authorized domains list

**But** - You should:
- ❌ NEVER commit backend `serviceAccountKey.json` (private key)
- ✅ Use Firebase Security Rules to protect your data
- ✅ Only allow authenticated users to read/write

## Next Steps

Once authentication is working:
1. Test creating users through the UI
2. Check Firebase Console → Realtime Database to see data
3. Test all CRUD operations
4. Deploy to production

## Quick Reference

| What | Where to Find It |
|------|-----------------|
| Enable Auth | Firebase Console → Authentication → Sign-in method |
| Get Config | Firebase Console → ⚙️ → Project Settings → Your apps |
| Authorized Domains | Firebase Console → Authentication → Settings |
| View Users | Firebase Console → Authentication → Users |
| Database Rules | Firebase Console → Realtime Database → Rules |
