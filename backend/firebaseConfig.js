/**
 * Firebase Admin SDK Configuration for Backend
 *
 * This uses the Firebase Admin SDK (not the client SDK)
 * Requires a service account key for authentication
 */

const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Validate that FIREBASE_DATABASE_URL is set
  if (!process.env.FIREBASE_DATABASE_URL) {
    console.error("❌ FIREBASE_DATABASE_URL environment variable is required");
    console.error("   Set it to your Firebase Realtime Database URL");
    console.error("   Example: https://your-project.firebaseio.com");
    throw new Error("Missing required environment variable: FIREBASE_DATABASE_URL");
  }

  // Check if service account key exists
  if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== "") {
    // Load service account key
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log("✅ Firebase initialized with service account");
  } else {
    // Initialize without credentials (works with public database rules)
    console.warn("⚠️  Service account key not found. Using unauthenticated mode.");
    console.warn("   Database operations may be limited by security rules.");
    console.warn("   For full access, add serviceAccountKey.json to backend/");

    admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log("✅ Firebase initialized in unauthenticated mode");
  }
}

const db = admin.database();

module.exports = {
  admin,
  db
};
