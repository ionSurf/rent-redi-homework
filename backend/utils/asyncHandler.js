/**
 * Async Handler Utility
 *
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates need for try-catch blocks in every controller
 *
 * Usage:
 *   exports.createUser = asyncHandler(async (req, res) => {
 *     const user = await userService.createUser(req.body);
 *     res.status(201).json(user);
 *   });
 */

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
