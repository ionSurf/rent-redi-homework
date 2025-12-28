// backend/services/weatherService.js
const axios = require("axios");
const axiosRetry = require("axios-retry").default;

const API_KEY = process.env.OPENWEATHER_API_KEY || "7afa46f2e91768e7eeeb9001ce40de19";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// SRE Principle: Resilience
// Configure automatic retries for network glitches (5xx errors or timeouts)
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // 200ms, 400ms, 800ms...
  onRetry: (retryCount, error) => {
    console.warn(`Retry attempt #${retryCount} due to: ${error.message}`);
  }
});

/**
 * Fetches geolocation and timezone data for a given US ZIP code.
 * @param {string} zipCode
 * @returns {Promise<{lat: number, lon: number, timezone: number}>}
 */
async function getWeatherData(zipCode) {
  // 1. Input Validation (Defense in Depth)
  if (!/^\d{5}$/.test(zipCode)) {
    throw new Error("Invalid ZIP code format. Expected 5 digits.");
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        zip: `${zipCode},us`,
        appid: API_KEY
      },
      timeout: 5000 // SRE: Don't let a hanging dependency block your event loop
    });

    const { coord, timezone, name } = response.data;

    // 2. Structured Logging for Observability
    console.info(`Successfully resolved ZIP [${zipCode}] to City [${name}]`);

    return {
      lat: coord.lat,
      lon: coord.lon,
      timezone, // Offset in seconds from UTC
      locationName: name // Added for extra UI polish
    };
  } catch (error) {
    // 3. Sophisticated Error Handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      if (status === 404) throw new Error(`ZIP code ${zipCode} not found.`);
      if (status === 401) throw new Error("Weather API Key is invalid.");
      if (status === 403)
        throw new Error("Weather API access forbidden. Check API key permissions.");
      if (status === 429) throw new Error("Weather API rate limit exceeded.");
    } else if (error.request) {
      // The request was made but no response was received (Network issue)
      throw new Error("Weather service is currently unreachable. Please try again later.");
    }

    console.error(`Unexpected WeatherService Error: ${error.message}`);
    throw new Error("An internal error occurred while fetching location data.");
  }
}

module.exports = { getWeatherData };
