/**
 * Validation Middleware
 *
 * Request validation using Zod schemas
 */

/**
 * Validates request body against a Zod schema
 *
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateBody = schema => {
  return (req, res, next) => {
    try {
      // Validate and parse request body
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      // Return validation errors
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors || error.message
      });
    }
  };
};

/**
 * Validates request params against a Zod schema
 *
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateParams = schema => {
  return (req, res, next) => {
    try {
      // Validate and parse request params
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      // Return validation errors
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors || error.message
      });
    }
  };
};

/**
 * Validates request query against a Zod schema
 *
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
const validateQuery = schema => {
  return (req, res, next) => {
    try {
      // Validate and parse request query
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      // Return validation errors
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors || error.message
      });
    }
  };
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery
};
