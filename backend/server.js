/**
 * Server Entry Point
 *
 * Starts the Express server
 */

const createApp = require("./config/app");
const env = require("./config/env");

const app = createApp();

// Only start server if not being imported (for testing)
if (require.main === module) {
  app.listen(env.PORT, env.HOST, () => {
    console.log(`Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

module.exports = app;
