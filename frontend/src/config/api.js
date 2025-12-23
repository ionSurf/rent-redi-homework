/**
 * API Configuration
 *
 * Determines the backend API URL based on the environment:
 * - CodeSandbox: Uses @codesandbox/utils to get the backend host
 * - Development: Uses localhost:8080
 * - Production: Uses REACT_APP_API_URL environment variable
 */

const getApiBaseUrl = () => {
  // Check for production API URL first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Try to detect CodeSandbox using @codesandbox/utils
  try {
    const { getCodeSandboxHost } = require('@codesandbox/utils');
    const backendPort = 8080;
    const host = getCodeSandboxHost(backendPort);

    if (host) {
      return `https://${host}`;
    }
  } catch (error) {
    // @codesandbox/utils not available or not in CodeSandbox environment
    // Fall through to localhost
  }

  // Default to localhost for local development
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
}
