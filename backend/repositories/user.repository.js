/**
 * User Repository
 *
 * Handles all database operations for users
 * Provides abstraction over Firebase Realtime Database
 */

const { db, admin } = require("../firebaseConfig");

/**
 * Get all users from the database
 *
 * @returns {Promise<Object>} All users as an object with user IDs as keys
 */
const findAll = async () => {
  const snapshot = await db.ref("users").once("value");
  return snapshot.val() || {};
};

/**
 * Find a user by ID
 *
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
const findById = async id => {
  const snapshot = await db.ref("users").child(id).once("value");
  return snapshot.val();
};

/**
 * Check if a user exists
 *
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if user exists, false otherwise
 */
const exists = async id => {
  const snapshot = await db.ref(`users/${id}`).once("value");
  return snapshot.exists();
};

/**
 * Create a new user
 *
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user object with ID
 */
const create = async userData => {
  const newUserRef = db.ref("users").push();
  const userWithId = {
    ...userData,
    id: newUserRef.key,
    createdAt: admin.database.ServerValue.TIMESTAMP
  };

  await newUserRef.set(userWithId);
  return userWithId;
};

/**
 * Update an existing user
 *
 * @param {string} id - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
const update = async (id, updates) => {
  const userRef = db.ref(`users/${id}`);
  await userRef.update(updates);
  return { id, ...updates };
};

/**
 * Delete a user
 *
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
const remove = async id => {
  await db.ref(`users/${id}`).remove();
};

module.exports = {
  findAll,
  findById,
  exists,
  create,
  update,
  remove
};
