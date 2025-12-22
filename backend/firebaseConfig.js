/**
 * Firebase Admin SDK Configuration for Backend
 *
 * This uses the Firebase Admin SDK (not the client SDK)
 * Requires a service account key for authentication
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if service account key exists
  const fs = require('fs');
  const serviceAccountPath = './serviceAccountKey.json';

  if (fs.existsSync(serviceAccountPath)) {
    // Load service account key
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com"
    });

    console.log("✅ Firebase initialized with service account");
  } else {
    // Initialize without credentials (works with public database rules)
    console.warn("⚠️  Service account key not found. Using unauthenticated mode.");
    console.warn("   Database operations may be limited by security rules.");
    console.warn("   For full access, add serviceAccountKey.json to backend/");

    admin.initializeApp({
      databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com"
    });

    console.log("✅ Firebase initialized in unauthenticated mode");
  }
}

const db = admin.database();

module.exports = {
  admin,
  db
};
