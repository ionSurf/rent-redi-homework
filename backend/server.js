/*
Task name: User endpoints

Requirements
  1.  We need to create CRUD endpoints
  2.  The entries (users) can just be saved in a noSQL database (Bonus for using Firebase Realtime Database)
  3.  Each user should have the following data entries: 
        id, name, zip code, latitude, longitude, timezone
  4.  When creating a user, allow input for name and zip code.  
      (Fetch the latitude, longitude, and timezone - Documentation: https://openweathermap.org/current) 
  5.  When updating a user, Re-fetch the latitude, longitude, and timezone (if zip code changes)
  6.  Connect to a ReactJS front-end
  * feel free to add add something creative you'd like

  API Key: 7afa46f2e91768e7eeeb9001ce40de19
*/

const express = require("express");
const cors = require("cors");
const { z } = require("zod");
const weatherBreaker = require("./services/weatherCircuitBreaker");
const { db } = require("./firebaseConfig");
const { telemetryMiddleware, getMetrics } = require("./middleware/telemetry.middleware");
const { UserSchema, createUpdateObject } = require("./models/user.model");
const userRepository = require("./repositories/user.repository");
const app = express();

app.use(cors());
app.use(express.json());

// SRE: Apply telemetry middleware to all routes
app.use(telemetryMiddleware);

app.get("/", (req, res) => {
  console.log('triggering  "/" endpoint...');

  // define company name
  let companyName = "RentRedi";
  console.log("companyName = ", companyName);

  // send response
  res.send(`Welcome to the ${companyName} interview!`);
});

// SRE: Health check endpoint (for synthetic probes and load balancers)
app.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      backend: true,
      database: false,
      weatherAPI: false
    }
  };

  try {
    // Check Firebase connection
    const dbRef = db.ref(".info/connected");
    const snapshot = await dbRef.once("value");
    health.checks.database = snapshot.val() === true;

    // Check Circuit Breaker status (if open, weather API is down)
    health.checks.weatherAPI = !weatherBreaker.opened;

    // Overall health is healthy only if all checks pass
    if (!health.checks.database || !health.checks.weatherAPI) {
      health.status = "degraded";
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = "unhealthy";
    health.error = error.message;
    res.status(503).json(health);
  }
});

// SRE: Metrics endpoint (Prometheus-style exposition)
app.get("/metrics", getMetrics);

// Get all
app.get("/users", async (_, res) => {
  console.log("Get all users");
  const users = await userRepository.findAll();
  res.json(users);
});

// Get by user_id
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Get user with id=${id}`);
  const user = await userRepository.findById(id);
  res.json(user);
});

// Create
app.post("/users", async (req, res) => {
  try {
    // Validate the request body against the schema
    const validatedData = UserSchema.parse(req.body);

    const { name, zip } = validatedData;
    const geoData = await weatherBreaker.fire(zip);

    const userData = {
      name,
      zip,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      locationName: geoData.locationName
    };

    const createdUser = await userRepository.create(userData);
    res.status(201).json(createdUser);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Return a clean 400 error with Zod's specific issues
      return res.status(400).json({ errors: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the request body against the schema
    const validatedData = UserSchema.parse(req.body);
    const { name, zip } = validatedData;

    // Check if user exists
    const userExists = await userRepository.exists(id);
    if (!userExists) return res.status(404).json({ error: "User not found" });

    // Get current user to check if ZIP changed
    const currentUser = await userRepository.findById(id);

    let updates;

    if (zip && zip !== currentUser.zip) {
      const geoData = await weatherBreaker.fire(zip);
      updates = createUpdateObject(name, zip, geoData);
    } else {
      updates = createUpdateObject(name);
    }

    const updatedUser = await userRepository.update(id, updates);
    res.json(updatedUser);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Return a clean 400 error with Zod's specific issues
      return res.status(400).json({ errors: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete
app.delete("/users/:id", async (req, res) => {
  await userRepository.remove(req.params.id);
  res.status(204).send();
});

// Only start server if not being imported (for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const HOST = "0.0.0.0"; // Bind to all interfaces for Cloud Run
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
