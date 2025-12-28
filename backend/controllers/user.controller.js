/**
 * User Controller
 *
 * Handles HTTP requests and responses for user operations
 * Validates input and formats output
 */

const { z } = require("zod");
const userService = require("../services/user.service");
const { UserSchema } = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Get all users
 * GET /users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  console.log("Get all users");
  const users = await userService.getAllUsers();
  res.json(users);
});

/**
 * Get user by ID
 * GET /users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`Get user with id=${id}`);
  const user = await userService.getUserById(id);
  res.json(user);
});

/**
 * Create a new user
 * POST /users
 */
const createUser = asyncHandler(async (req, res) => {
  // Validate the request body against the schema
  const validatedData = UserSchema.parse(req.body);

  const createdUser = await userService.createUser(validatedData);
  res.status(201).json(createdUser);
});

/**
 * Update an existing user
 * PUT /users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the request body against the schema
  const validatedData = UserSchema.parse(req.body);

  const updatedUser = await userService.updateUser(id, validatedData);
  res.json(updatedUser);
});

/**
 * Delete a user
 * DELETE /users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});

/**
 * Error handler wrapper for Zod validation errors
 * This middleware wraps controller functions to handle validation errors
 */
const withValidation = controllerFn => {
  return async (req, res, next) => {
    try {
      await controllerFn(req, res, next);
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Return a clean 400 error with Zod's specific issues
        return res.status(400).json({ errors: err.errors });
      }

      // Handle custom error status codes (like 404 from service)
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  };
};

module.exports = {
  getAllUsers: withValidation(getAllUsers),
  getUserById: withValidation(getUserById),
  createUser: withValidation(createUser),
  updateUser: withValidation(updateUser),
  deleteUser: withValidation(deleteUser)
};
