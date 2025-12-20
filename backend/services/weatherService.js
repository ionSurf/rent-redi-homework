const axios = require('axios');
const axiosRetry = require('axios-retry').default;

// SRE Principle: Resilience
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const getGeoData = async (zip) => {
  // Logic here...
};