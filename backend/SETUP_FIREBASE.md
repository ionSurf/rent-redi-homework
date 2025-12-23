# Firebase Service Account Setup

This guide will help you download the `serviceAccountKey.json` file needed for the backend to connect to Firebase.

## Quick Setup (5 minutes)

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **rentredi-short-take-home**

### Step 2: Navigate to Service Accounts
1. Click the **⚙️ gear icon** (Settings) in the left sidebar
2. Click **Project settings**
3. Click the **Service accounts** tab at the top

### Step 3: Download the Service Account Key
1. You should see a section titled "Firebase Admin SDK"
2. Make sure **Node.js** is selected
3. Click the **Generate new private key** button
4. A dialog will appear warning you to keep this key secure
5. Click **Generate key** to download the JSON file

### Step 4: Move the File
1. The file will download as something like `rentredi-short-take-home-firebase-adminsdk-xxxxx.json`
2. **Rename** it to `serviceAccountKey.json`
3. **Move** it to the `backend/` directory of this project

```bash
# From your downloads folder
mv ~/Downloads/rentredi-short-take-home-firebase-adminsdk-*.json /home/user/rent-redi-homework/backend/serviceAccountKey.json
```

### Step 5: Verify Setup
Restart your backend server:
```bash
cd backend
npm start
```

You should see:
```
✅ Firebase initialized with service account
```

Instead of:
```
⚠️  Service account key not found. Using unauthenticated mode.
```

## Security Notes

⚠️ **IMPORTANT**:
- The `serviceAccountKey.json` file is already in `.gitignore`
- **NEVER** commit this file to git
- **NEVER** share this file publicly
- Each developer should download their own key
- If compromised, delete the key in Firebase Console and generate a new one

## Troubleshooting

### File permissions error
```bash
chmod 600 backend/serviceAccountKey.json
```

### "Invalid credentials" error
- Make sure you downloaded the key for the correct Firebase project
- Try generating a new key

### Still seeing warnings
- Make sure the file is named exactly `serviceAccountKey.json`
- Make sure it's in the `backend/` directory (not `backend/backend/`)
- Restart your server after adding the file

## Alternative: Environment Variable

You can also use an environment variable instead of a file:

1. Copy the entire contents of `serviceAccountKey.json`
2. Set it as an environment variable:

```bash
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

3. Update `backend/firebaseConfig.js` to read from env var

## What This File Contains

The service account key is a JSON file with:
- `type`: "service_account"
- `project_id`: Your Firebase project ID
- `private_key_id`: Unique key identifier
- `private_key`: RSA private key (keep this SECRET!)
- `client_email`: Service account email
- `client_id`: Service account ID
- `auth_uri`: Google OAuth2 auth endpoint
- `token_uri`: Google OAuth2 token endpoint

## Need Help?

If you don't have access to the Firebase Console:
1. Ask the project owner to add you as a team member
2. Or ask them to generate and securely share a service account key with you
3. The backend will still work in "unauthenticated mode" without the key (with limited functionality)
