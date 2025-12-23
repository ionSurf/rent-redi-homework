/**
 * API Configuration
 *
 * Determines the backend API URL based on environment variables:
 * - REACT_APP_API_URL: Backend API URL (set this in .env file)
 * - Default: http://localhost:8080 (for local development)
 */

const getApiBaseUrl = () => {
  // Use REACT_APP_API_URL from .env file if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Default to localhost for local development
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
}