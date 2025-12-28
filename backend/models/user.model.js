/**
 * User Model
 *
 * Defines the user data schema and validation rules
 */

const { z } = require("zod");

/**
 * User input validation schema
 * Used for validating user creation and update requests
 */
const UserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  zip: z.string().regex(/^\d{5}$/, "Must be a 5-digit ZIP code")
});

/**
 * Creates a complete user object with all required fields
 *
 * @param {string} id - Unique user identifier
 * @param {string} name - User's name
 * @param {string} zip - User's ZIP code
 * @param {Object} geoData - Geographic data from weather API
 * @param {number} geoData.lat - Latitude
 * @param {number} geoData.lon - Longitude
 * @param {string} geoData.timezone - Timezone
 * @param {string} geoData.locationName - Location name
 * @param {Object} timestamp - Firebase ServerValue.TIMESTAMP
 * @returns {Object} Complete user object
 */
const createUserObject = (id, name, zip, geoData, timestamp) => ({
  id,
  name,
  zip,
  latitude: geoData.lat,
  longitude: geoData.lon,
  timezone: geoData.timezone,
  locationName: geoData.locationName,
  createdAt: timestamp
});

/**
 * Creates an update object for user modifications
 *
 * @param {string} name - User's name
 * @param {string} zip - User's ZIP code (optional)
 * @param {Object} geoData - Geographic data from weather API (optional)
 * @returns {Object} Update object
 */
const createUpdateObject = (name, zip = null, geoData = null) => {
  const updates = { name };

  if (zip && geoData) {
    return {
      ...updates,
      zip,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      locationName: geoData.locationName
    };
  }

  return updates;
};

module.exports = {
  UserSchema,
  createUserObject,
  createUpdateObject
};
