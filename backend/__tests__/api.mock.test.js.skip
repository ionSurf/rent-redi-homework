const request = require('supertest');
const app = require('../server');

// Mock the weatherService to avoid real API calls
jest.mock('../services/weatherService', () => ({
  getWeatherData: jest.fn((zipCode) => {
    const mockData = {
      '10001': { lat: 40.7128, lon: -74.0060, timezone: -18000, locationName: 'New York' },
      '90210': { lat: 34.0522, lon: -118.2437, timezone: -28800, locationName: 'Beverly Hills' },
      '60601': { lat: 41.8781, lon: -87.6298, timezone: -21600, locationName: 'Chicago' },
      '00000': null // Invalid ZIP
    };

    if (mockData[zipCode] === null) {
      return Promise.reject(new Error(`ZIP code ${zipCode} not found.`));
    }

    return Promise.resolve(mockData[zipCode] || {
      lat: 0,
      lon: 0,
      timezone: 0,
      locationName: 'Unknown'
    });
  })
}));

describe('API Integration Tests (Mocked)', () => {
  let testUserId;

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('Welcome to the RentRedi interview!');
    });
  });

  describe('POST /users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        zip: '10001'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'John Doe');
      expect(response.body).toHaveProperty('zip', '10001');
      expect(response.body).toHaveProperty('latitude', 40.7128);
      expect(response.body).toHaveProperty('longitude', -74.0060);
      expect(response.body).toHaveProperty('timezone', -18000);
      expect(response.body).toHaveProperty('locationName', 'New York');
      expect(response.body).toHaveProperty('createdAt');

      testUserId = response.body.id;
    });

    it('should create user with Los Angeles ZIP code', async () => {
      const userData = {
        name: 'Jane Smith',
        zip: '90210'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.latitude).toBe(34.0522);
      expect(response.body.longitude).toBe(-118.2437);
      expect(response.body.locationName).toBe('Beverly Hills');
    });

    it('should return 400 for invalid name (too short)', async () => {
      const userData = {
        name: 'J',
        zip: '10001'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid ZIP code format (too short)', async () => {
      const userData = {
        name: 'John Doe',
        zip: '123'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid ZIP code format (too long)', async () => {
      const userData = {
        name: 'John Doe',
        zip: '123456'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for non-numeric ZIP code', async () => {
      const userData = {
        name: 'John Doe',
        zip: 'ABCDE'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing name', async () => {
      const userData = {
        zip: '10001'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing ZIP code', async () => {
      const userData = {
        name: 'John Doe'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 for non-existent ZIP code', async () => {
      const userData = {
        name: 'Test User',
        zip: '00000'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('ZIP code 00000 not found');
    });
  });

  describe('GET /users', () => {
    it('should return all users as an object', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(typeof response.body).toBe('object');
    });
  });

  describe('GET /users/:id', () => {
    it('should return null for non-existent user ID', async () => {
      const response = await request(app)
        .get('/users/nonexistent-id-12345')
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('PUT /users/:id', () => {
    let updateTestUserId;

    beforeAll(async () => {
      // Create a user for update tests
      const response = await request(app)
        .post('/users')
        .send({ name: 'Update Test User', zip: '10001' });

      updateTestUserId = response.body.id;
    });

    it('should update user name', async () => {
      const response = await request(app)
        .put(`/users/${updateTestUserId}`)
        .send({ name: 'Updated Name', zip: '10001' })
        .expect(200);

      expect(response.body).toHaveProperty('id', updateTestUserId);
      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should update user and re-fetch geolocation when ZIP changes', async () => {
      const response = await request(app)
        .put(`/users/${updateTestUserId}`)
        .send({ name: 'Updated Name', zip: '90210' })
        .expect(200);

      expect(response.body).toHaveProperty('zip', '90210');
      expect(response.body).toHaveProperty('latitude', 34.0522);
      expect(response.body).toHaveProperty('longitude', -118.2437);
      expect(response.body).toHaveProperty('locationName', 'Beverly Hills');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/users/nonexistent-user-12345')
        .send({ name: 'Test', zip: '10001' })
        .expect(404);

      expect(response.text).toContain('User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user successfully', async () => {
      // Create a user to delete
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'To Be Deleted', zip: '10001' });

      const userId = createResponse.body.id;

      // Delete the user
      await request(app)
        .delete(`/users/${userId}`)
        .expect(204);

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(getResponse.body).toBeNull();
    });

    it('should return 204 even for non-existent user (idempotent)', async () => {
      await request(app)
        .delete('/users/nonexistent-user-12345')
        .expect(204);
    });
  });

  describe('CRUD Flow', () => {
    it('should complete full CRUD cycle', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'CRUD Test User', zip: '60601' })
        .expect(201);

      const userId = createResponse.body.id;
      expect(createResponse.body.name).toBe('CRUD Test User');
      expect(createResponse.body.locationName).toBe('Chicago');

      // READ (single)
      const readResponse = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(readResponse.body.name).toBe('CRUD Test User');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Updated CRUD User', zip: '60601' })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated CRUD User');

      // READ ALL
      const allUsersResponse = await request(app)
        .get('/users')
        .expect(200);

      expect(allUsersResponse.body).toHaveProperty(userId);

      // DELETE
      await request(app)
        .delete(`/users/${userId}`)
        .expect(204);

      // VERIFY DELETION
      const deletedResponse = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(deletedResponse.body).toBeNull();
    });
  });
});
