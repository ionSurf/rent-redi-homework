/**
 * Environment Configuration
 *
 * Centralized environment variable management
 */

require("dotenv").config();

module.exports = {
  // Server
  PORT: process.env.PORT || 8080,
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Firebase
  FIREBASE_DATABASE_URL:
    process.env.FIREBASE_DATABASE_URL ||
    "https://rentredi-short-take-home-default-rtdb.firebaseio.com",
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,

  // External APIs
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "7afa46f2e91768e7eeeb9001ce40de19"
};
