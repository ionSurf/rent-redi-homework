#!/usr/bin/env node

/**
 * Minimal test to check if server.js can start
 * This helps diagnose initialization issues
 */

console.log("=== Server Startup Test ===\n");

// Set minimal environment
process.env.PORT = process.env.PORT || "8080";
process.env.FIREBASE_DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL || "https://test-project.firebaseio.com";

console.log("Environment:");
console.log("  PORT:", process.env.PORT);
console.log("  FIREBASE_DATABASE_URL:", process.env.FIREBASE_DATABASE_URL);
console.log(
  "  FIREBASE_SERVICE_ACCOUNT:",
  process.env.FIREBASE_SERVICE_ACCOUNT ? "SET" : "NOT SET"
);
console.log("");

try {
  console.log("Loading firebaseConfig.js...");
  const firebaseConfig = require("./firebaseConfig");
  console.log("✓ Firebase config loaded successfully");
  console.log("");

  console.log("Loading server.js...");
  const app = require("./server");
  console.log("✓ Server app loaded successfully");
  console.log("");

  console.log("Starting server...");
  const PORT = process.env.PORT || 8080;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ Server started on http://0.0.0.0:${PORT}`);
    console.log("");
    console.log("Testing endpoints in 2 seconds...");

    setTimeout(async () => {
      const http = require("http");

      // Test root endpoint
      http
        .get(`http://localhost:${PORT}/`, res => {
          console.log(`✓ GET / - Status: ${res.statusCode}`);

          // Test health endpoint
          http
            .get(`http://localhost:${PORT}/health`, res => {
              console.log(`✓ GET /health - Status: ${res.statusCode}`);

              console.log("");
              console.log("=== All tests passed! Server is working. ===");
              console.log("Press Ctrl+C to stop the server");
            })
            .on("error", err => {
              console.error(`✗ GET /health failed:`, err.message);
              process.exit(1);
            });
        })
        .on("error", err => {
          console.error(`✗ GET / failed:`, err.message);
          process.exit(1);
        });
    }, 2000);
  });

  server.on("error", err => {
    console.error("✗ Server error:", err);
    process.exit(1);
  });
} catch (error) {
  console.error("✗ Error during startup:");
  console.error(error);
  process.exit(1);
}
