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
const axios = require("axios");
const cors = require("cors");
const { z } = require("zod");
const weatherBreaker = require("./services/weatherCircuitBreaker");
const { admin, db } = require("./firebaseConfig");
const app = express();

app.use(cors());
app.use(express.json());

// User schema validation
const UserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  zip: z.string().regex(/^\d{5}$/, "Must be a 5-digit ZIP code")
});

app.get("/", (req, res) => {
  console.log('triggering  "/" endpoint...');

  // define company name
  let companyName = "RentRedi";
  console.log("companyName = ", companyName);

  // send response
  res.send(`Welcome to the ${companyName} interview!`);
});

// Get all
app.get("/users", async (_, res) => {
  console.log("Get all users");
  const snapshot = await db.ref("users").once("value");
  const users = snapshot.val() || {};
  res.json(users);
});

// Get by user_id
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Get user with id=${id}`);
  const snapshot = await db.ref("users").child(id).once("value");
  const user = snapshot.val();
  res.json(user);
});

// Create
app.post("/users", async (req, res) => {
  try {
    // Validate the request body against the schema
    const validatedData = UserSchema.parse(req.body);

    const { name, zip } = validatedData;
    const geoData = await weatherBreaker.fire(zip);

    const newUserRef = db.ref("users").push();
    const userData = {
      id: newUserRef.key,
      name,
      zip,
      latitude: geoData.lat,
      longitude: geoData.lon,
      timezone: geoData.timezone,
      locationName: geoData.locationName,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    await newUserRef.set(userData);
    res.status(201).json(userData);
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

    const userRef = db.ref(`users/${id}`);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) return res.status(404).json({ error: "User not found" });

    let updates = { name };

    if (zip && zip !== snapshot.val().zip) {
      const geoData = await weatherBreaker.fire(zip);
      updates = {
        ...updates,
        zip,
        latitude: geoData.lat,
        longitude: geoData.lon,
        timezone: geoData.timezone,
        locationName: geoData.locationName
      };
    }

    await userRef.update(updates);
    res.json({ id, ...updates });
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
  await db.ref(`users/${req.params.id}`).remove();
  res.status(204).send();
});

// Only start server if not being imported (for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
