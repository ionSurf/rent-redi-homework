/**
 * Health & Monitoring Routes
 *
 * Routes for health checks, metrics, and monitoring
 */

const express = require("express");
const weatherBreaker = require("../services/weatherCircuitBreaker");
const { db } = require("../firebaseConfig");
const { getMetrics } = require("../middleware/telemetry.middleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint for synthetic probes and load balancers
 * @access  Public
 */
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        backend: true,
        database: false,
        weatherAPI: false
      }
    };

    try {
      // Check Firebase connection
      const dbRef = db.ref(".info/connected");
      const snapshot = await dbRef.once("value");
      health.checks.database = snapshot.val() === true;

      // Check Circuit Breaker status (if open, weather API is down)
      health.checks.weatherAPI = !weatherBreaker.opened;

      // Overall health is healthy only if all checks pass
      if (!health.checks.database || !health.checks.weatherAPI) {
        health.status = "degraded";
      }

      res.status(200).json(health);
    } catch (error) {
      health.status = "unhealthy";
      health.error = error.message;
      res.status(503).json(health);
    }
  })
);

/**
 * @route   GET /metrics
 * @desc    Metrics endpoint (Prometheus-style exposition)
 * @access  Public
 */
router.get("/metrics", getMetrics);

module.exports = router;
