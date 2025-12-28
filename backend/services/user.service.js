/**
 * User Service
 *
 * Business logic for user operations
 * Orchestrates between repository and external services
 */

const userRepository = require("../repositories/user.repository");
const weatherBreaker = require("./weatherCircuitBreaker");

/**
 * Get all users
 *
 * @returns {Promise<Object>} All users
 */
const getAllUsers = async () => {
  return await userRepository.findAll();
};

/**
 * Get user by ID
 *
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
const getUserById = async id => {
  return await userRepository.findById(id);
};

/**
 * Create a new user with geolocation data
 *
 * @param {Object} userData - User data
 * @param {string} userData.name - User's name
 * @param {string} userData.zip - User's ZIP code
 * @returns {Promise<Object>} Created user with geolocation data
 * @throws {Error} If weather API fails or user creation fails
 */
const createUser = async ({ name, zip }) => {
  // Fetch geolocation data from weather API
  const geoData = await weatherBreaker.fire(zip);

  // Prepare user data with geolocation
  const userData = {
    name,
    zip,
    latitude: geoData.lat,
    longitude: geoData.lon,
    timezone: geoData.timezone,
    locationName: geoData.locationName
  };

  // Create user in database
  return await userRepository.create(userData);
};

/**
 * Update an existing user
 * Re-fetches geolocation data if ZIP code changes
 *
 * @param {string} id - User ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.name - User's name
 * @param {string} updateData.zip - User's ZIP code
 * @returns {Promise<Object>} Updated user object
 * @throws {Error} If user not found or update fails
 */
const updateUser = async (id, { name, zip }) => {
  // Check if user exists
  const userExists = await userRepository.exists(id);
  if (!userExists) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Get current user to check if ZIP changed
  const currentUser = await userRepository.findById(id);

  let updates = { name };

  // If ZIP code changed, fetch new geolocation data
  if (zip && zip !== currentUser.zip) {
    const geoData = await weatherBreaker.fire(zip);
    updates = {
      ...updates,
      zip,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      locationName: geoData.locationName
    };
  }

  // Update user in database
  return await userRepository.update(id, updates);
};

/**
 * Delete a user
 *
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async id => {
  await userRepository.remove(id);
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
