/**
 * User Controller
 *
 * Handles HTTP requests and responses for user operations
 * Validates input and formats output
 */

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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
