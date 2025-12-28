/**
 * Error Handling Middleware
 *
 * Centralized error handling for the application
 */

const { z } = require("zod");

/**
 * Global error handler middleware
 * Catches all errors from async handlers and formats them consistently
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next middleware function (unused but required for Express error handling)
 */
const errorHandler = (err, req, res, _next) => {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      errors: err.errors
    });
  }

  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 * Catches all requests to undefined routes
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFound
};
