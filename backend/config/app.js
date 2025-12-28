/**
 * Express Application Configuration
 *
 * Configures Express app with middleware and routes
 */

const express = require("express");
const cors = require("cors");
const { telemetryMiddleware } = require("../middleware/telemetry.middleware");
const userRoutes = require("../routes/user.routes");
const healthRoutes = require("../routes/health.routes");

/**
 * Create and configure Express application
 *
 * @returns {Express} Configured Express app
 */
const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // SRE: Apply telemetry middleware to all routes
  app.use(telemetryMiddleware);

  // Welcome endpoint
  app.get("/", (req, res) => {
    console.log('triggering  "/" endpoint...');

    // define company name
    let companyName = "RentRedi";
    console.log("companyName = ", companyName);

    // send response
    res.send(`Welcome to the ${companyName} interview!`);
  });

  // Mount routes
  app.use("/", healthRoutes);
  app.use("/users", userRoutes);

  return app;
};

module.exports = createApp;
