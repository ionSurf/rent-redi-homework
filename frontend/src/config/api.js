/**
 * API Configuration
 *
 * Determines the backend API URL based on the environment:
 * - CodeSandbox: Uses CODESANDBOX_HOST with port 8080
 * - Development: Uses localhost:8080
 * - Production: Uses REACT_APP_API_URL environment variable
 */

const getApiBaseUrl = () => {
  // Check if running in CodeSandbox
  if (process.env.CODESANDBOX_HOST) {
    // CodeSandbox provides full host with port already (e.g., w9pd4h-8080.csb.app)
    return `https://${process.env.CODESANDBOX_HOST}`;
  }

  // Check for production API URL
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
