/**
 * Manual API Testing Script
 *
 * This script provides a simple way to test all API endpoints
 * Run with: node test-api.js
 *
 * Make sure the server is NOT running before executing this script
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;
let createdUserId = null;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    log(`✓ ${name}`, 'green');
    if (details) log(`  ${details}`, 'blue');
    testsPassed++;
  } else {
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'red');
    testsFailed++;
  }
}

async function runTests() {
  log('\n=== Starting API Tests ===\n', 'blue');

  // Start the server programmatically
  const app = require('./server');
  const server = app.listen(8080, () => {
    log('Test server started on port 8080\n', 'yellow');
  });

  try {
    // Test 1: GET /
    log('Test 1: GET /', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/`);
      const passed = response.status === 200 && response.data.includes('RentRedi');
      logTest('Welcome endpoint returns correct message', passed, `Status: ${response.status}`);
    } catch (error) {
      logTest('Welcome endpoint', false, error.message);
    }

    // Test 2: POST /users with valid data
    log('\nTest 2: POST /users (valid data)', 'yellow');
    try {
      const response = await axios.post(`${BASE_URL}/users`, {
        name: 'Test User',
        zip: '10001'
      });
      createdUserId = response.data.id;
      const passed = response.status === 201 &&
                    response.data.name === 'Test User' &&
                    response.data.hasOwnProperty('latitude') &&
                    response.data.hasOwnProperty('longitude');
      logTest('Create user with valid data', passed,
              `Created user ID: ${createdUserId}, Location: ${response.data.locationName || 'N/A'}`);
    } catch (error) {
      logTest('Create user with valid data', false, error.response?.data?.error || error.message);
    }

    // Test 3: POST /users with invalid name
    log('\nTest 3: POST /users (invalid name)', 'yellow');
    try {
      await axios.post(`${BASE_URL}/users`, {
        name: 'X',
        zip: '10001'
      });
      logTest('Validate name field', false, 'Should have rejected short name');
    } catch (error) {
      const passed = error.response?.status === 400;
      logTest('Validate name field', passed, 'Correctly rejected short name');
    }

    // Test 4: POST /users with invalid ZIP
    log('\nTest 4: POST /users (invalid ZIP format)', 'yellow');
    try {
      await axios.post(`${BASE_URL}/users`, {
        name: 'John Doe',
        zip: '123'
      });
      logTest('Validate ZIP field', false, 'Should have rejected invalid ZIP');
    } catch (error) {
      const passed = error.response?.status === 400;
      logTest('Validate ZIP field', passed, 'Correctly rejected invalid ZIP format');
    }

    // Test 5: GET /users
    log('\nTest 5: GET /users', 'yellow');
    try {
      const response = await axios.get(`${BASE_URL}/users`);
      const passed = response.status === 200 && typeof response.data === 'object';
      const userCount = Object.keys(response.data).length;
      logTest('Get all users', passed, `Found ${userCount} user(s)`);
    } catch (error) {
      logTest('Get all users', false, error.message);
    }

    // Test 6: GET /users/:id
    if (createdUserId) {
      log('\nTest 6: GET /users/:id', 'yellow');
      try {
        const response = await axios.get(`${BASE_URL}/users/${createdUserId}`);
        const passed = response.status === 200 && response.data.id === createdUserId;
        logTest('Get user by ID', passed, `Retrieved user: ${response.data.name}`);
      } catch (error) {
        logTest('Get user by ID', false, error.message);
      }
    }

    // Test 7: PUT /users/:id (update name only)
    if (createdUserId) {
      log('\nTest 7: PUT /users/:id (update name)', 'yellow');
      try {
        const response = await axios.put(`${BASE_URL}/users/${createdUserId}`, {
          name: 'Updated Test User',
          zip: '10001'
        });
        const passed = response.status === 200 && response.data.name === 'Updated Test User';
        logTest('Update user name', passed, 'Name updated successfully');
      } catch (error) {
        logTest('Update user name', false, error.response?.data?.error || error.message);
      }
    }

    // Test 8: PUT /users/:id (update ZIP - should re-fetch geolocation)
    if (createdUserId) {
      log('\nTest 8: PUT /users/:id (update ZIP)', 'yellow');
      try {
        const response = await axios.put(`${BASE_URL}/users/${createdUserId}`, {
          name: 'Updated Test User',
          zip: '90210'
        });
        const passed = response.status === 200 &&
                      response.data.zip === '90210' &&
                      response.data.hasOwnProperty('latitude');
        logTest('Update user ZIP and re-fetch location', passed,
                `New location: ${response.data.locationName || 'N/A'}`);
      } catch (error) {
        logTest('Update user ZIP', false, error.response?.data?.error || error.message);
      }
    }

    // Test 9: PUT /users/:id (non-existent user)
    log('\nTest 9: PUT /users/:id (non-existent)', 'yellow');
    try {
      await axios.put(`${BASE_URL}/users/nonexistent123`, {
        name: 'Test',
        zip: '10001'
      });
      logTest('Update non-existent user', false, 'Should have returned 404');
    } catch (error) {
      const passed = error.response?.status === 404;
      logTest('Update non-existent user', passed, 'Correctly returned 404');
    }

    // Test 10: DELETE /users/:id
    if (createdUserId) {
      log('\nTest 10: DELETE /users/:id', 'yellow');
      try {
        const response = await axios.delete(`${BASE_URL}/users/${createdUserId}`);
        const passed = response.status === 204;
        logTest('Delete user', passed, 'User deleted successfully');

        // Verify deletion
        try {
          const getResponse = await axios.get(`${BASE_URL}/users/${createdUserId}`);
          const verified = getResponse.data === null;
          logTest('Verify deletion', verified, 'User no longer exists');
        } catch (error) {
          logTest('Verify deletion', false, error.message);
        }
      } catch (error) {
        logTest('Delete user', false, error.message);
      }
    }

  } catch (error) {
    log(`\nUnexpected error: ${error.message}`, 'red');
  } finally {
    // Close the server
    server.close(() => {
      log('\n=== Test Summary ===', 'blue');
      log(`Tests Passed: ${testsPassed}`, 'green');
      log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
      log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`,
          testsFailed === 0 ? 'green' : 'yellow');

      process.exit(testsFailed > 0 ? 1 : 0);
    });
  }
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
