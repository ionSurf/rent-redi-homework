# How to Get Your Firebase Service Account Key

## Quick Steps (5 minutes)

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
Click on **"rentredi-short-take-home"** (or your project name)

### 3. Open Project Settings
- Click the ⚙️ **gear icon** in the top left
- Click **"Project Settings"**

### 4. Go to Service Accounts Tab
- Click the **"Service Accounts"** tab at the top
- You should see "Firebase Admin SDK" section

### 5. Generate New Private Key
- Click the **"Generate New Private Key"** button
- A dialog will appear warning you to keep it secure
- Click **"Generate Key"**

### 6. Save the File
- Your browser will download a JSON file
- The filename will be something like: `rentredi-short-take-home-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
- **Rename it to:** `serviceAccountKey.json`
- **Move it to:** `backend/` folder (same folder as this file)

### 7. Verify the File Location
Your backend folder should look like this:
```
backend/
├── serviceAccountKey.json  ← Your new file here!
├── server.js
├── firebaseConfig.js
├── package.json
└── ...
```

### 8. Restart Your Server
```bash
cd backend
node server.js
```

You should see:
```
✅ Firebase initialized with service account
Server running on port 8080
```

## Security Warning ⚠️

**NEVER commit `serviceAccountKey.json` to git!**

It's already in `.gitignore`, but double-check:
```bash
git status
# Should NOT show serviceAccountKey.json
```

If you accidentally commit it:
1. Remove it from git: `git rm --cached serviceAccountKey.json`
2. Regenerate a NEW key in Firebase Console
3. Delete the old key in Firebase Console

## Troubleshooting

### "Cannot find module './serviceAccountKey.json'"
**Solution:** The file is not in the `backend/` folder. Move it there.

### "Unexpected token" or JSON parsing error
**Solution:** The file might be corrupted. Download it again from Firebase Console.

### Still seeing warnings
**Solution:**
1. Make sure the file is named exactly `serviceAccountKey.json` (case-sensitive)
2. Make sure it's in the `backend/` folder
3. Restart the server

### File is in the right place but still not working
**Solution:** Check the JSON file structure. It should have these fields:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  ...
}
```

## Alternative: Environment Variables

If you don't want to use a file, you can use environment variables instead.

See `FIREBASE_SETUP.md` for instructions.

## What This File Does

The service account key gives your backend server:
- ✅ Full read/write access to Firebase Realtime Database
- ✅ Ability to bypass security rules
- ✅ No more authentication warnings
- ✅ Required for production deployments

## Next Steps

Once you have the key working:
1. Test your API endpoints
2. Connect your React frontend
3. Deploy to production (use environment variables for the key)
