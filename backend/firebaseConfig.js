/**
 * Firebase Admin SDK Configuration for Backend
 *
 * This uses the Firebase Admin SDK (not the client SDK)
 * Requires a service account key for authentication
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account key
    const serviceAccount = require("./serviceAccountKey.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com"
    });

    console.log("✅ Firebase initialized with service account");
  } catch (error) {
    // Fallback: Initialize without credentials (will have limited access)
    console.warn("⚠️  Service account key not found. Using limited access mode.");
    console.warn("   To fix: Download serviceAccountKey.json from Firebase Console");
    console.warn("   See backend/FIREBASE_SETUP.md for instructions");

    admin.initializeApp({
      databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com"
    });
  }
}

const db = admin.database();

module.exports = {
  admin,
  db
};
