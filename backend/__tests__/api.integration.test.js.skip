const request = require('supertest');
const app = require('../server');

describe('API Integration Tests', () => {
  let createdUserId;

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
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('timezone');
      expect(response.body).toHaveProperty('locationName');
      expect(response.body).toHaveProperty('createdAt');

      // Save the ID for later tests
      createdUserId = response.body.id;
    }, 15000); // Increased timeout for API call

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
    });

    it('should return 400 for invalid ZIP code format', async () => {
      const userData = {
        name: 'John Doe',
        zip: '123' // Invalid - not 5 digits
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 500 for non-existent ZIP code', async () => {
      const userData = {
        name: 'Jane Doe',
        zip: '00000' // Invalid ZIP
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    }, 15000);
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(typeof response.body).toBe('object');
      // Should have at least the user we created
      if (createdUserId) {
        expect(response.body).toHaveProperty(createdUserId);
      }
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user by ID', async () => {
      // First create a user to ensure we have one
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'Test User', zip: '90210' });

      const userId = createResponse.body.id;

      const response = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('zip', '90210');
    }, 15000);

    it('should return null for non-existent user ID', async () => {
      const response = await request(app)
        .get('/users/nonexistent123')
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user name without changing ZIP', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'Original Name', zip: '10001' });

      const userId = createResponse.body.id;
      const originalZip = createResponse.body.zip;

      // Update only the name
      const response = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Updated Name', zip: originalZip })
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'Updated Name');
    }, 15000);

    it('should update user and re-fetch geolocation when ZIP changes', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'Zip Changer', zip: '10001' });

      const userId = createResponse.body.id;

      // Update with new ZIP
      const response = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Zip Changer', zip: '90210' })
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('zip', '90210');
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('timezone');
    }, 15000);

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/users/nonexistent123')
        .send({ name: 'Test', zip: '10001' })
        .expect(404);

      expect(response.text).toContain('User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user successfully', async () => {
      // First create a user
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
    }, 15000);
  });

  describe('Edge Cases', () => {
    it('should handle missing request body for POST', async () => {
      const response = await request(app)
        .post('/users')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle non-numeric ZIP code', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', zip: 'ABCDE' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should handle ZIP code with special characters', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', zip: '10-01' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});
