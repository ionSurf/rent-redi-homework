/**
 * User Routes
 *
 * Defines routes for user CRUD operations
 */

const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

/**
 * @route   GET /users
 * @desc    Get all users
 * @access  Public
 */
router.get("/", userController.getAllUsers);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get("/:id", userController.getUserById);

/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Public
 */
router.post("/", userController.createUser);

/**
 * @route   PUT /users/:id
 * @desc    Update an existing user
 * @access  Public
 */
router.put("/:id", userController.updateUser);

/**
 * @route   DELETE /users/:id
 * @desc    Delete a user
 * @access  Public
 */
router.delete("/:id", userController.deleteUser);

module.exports = router;
