/**
 * Firebase Admin SDK Configuration for Backend
 *
 * This uses the Firebase Admin SDK (not the client SDK)
 * For production, you should use a service account key
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
// For development/demo: Using public database URL (limited permissions)
// For production: Use service account credentials
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
    // For production, add credential:
    // credential: admin.credential.cert(require('./serviceAccountKey.json'))
  });
}

const db = admin.database();

module.exports = {
  admin,
  db
};
