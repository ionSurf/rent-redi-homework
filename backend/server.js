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
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Firebase initialization
admin.initializeApp({
  databaseURL: 'https://rentredi-short-take-home-default-rtdb.firebaseio.com'
})
const db = admin.database();

// Get latitude and longitude from zip code
const API_KEY = '7afa46f2e91768e7eeeb9001ce40de19';
async function getWeatherData(zipCode) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&appid=${API_KEY}`;
    const response = await axios.get(url);
    const { coord, timezone } = response.data;
    return {
      lat: coord.lat,
      lon: coord.lon,
      timezone 
    };
  }
  catch (response) {
    console.error("Weather API Error:", error);
    throw new Error("Could not fetch location data for that ZIP code.");
  }
}

app.get("/", (req, res) => {
  console.log('triggering  "/" endpoint...');

  // define company name
  let companyName = "RentRedi";
  console.log("companyName = ", companyName);

  // send response
  res.send(`Welcome to the ${companyName} interview!`);
});

// Get all
app.get("users/", async (_, res) => {
  console.log('Get all users');
  const snapshot = await db.ref('users')
    .once('value');
  const users = snapshot.val() || {};
  res.json(users);
});

// Get by user_id
app.get("users/:id", async (_, res) => {
  console.log(`Get user with id=$id`);
  const snapshot = await db.ref('users')
    .child(id)
    .once('value');
  const user = snapshot.val();
  res.json(user);
});

// Create
app.post("/users", async (req, res) => {
  try {
    const { name, zip } = req.body;
    if (!name || !zip) return res.status(400).send("Missing name or zip");

    const geoData = await getWeatherData(zip);
    const newUserRef = db.ref("users").push();
    
    const userData = {
      id: newUserRef.key,
      name,
      zip,
      ...geoData,
      createdAt: admin.database.ServerValue.TIMESTAMP
    };

    await newUserRef.set(userData);
    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, zip } = req.body;
    const userRef = db.ref(`users/${id}`);
    const snapshot = await userRef.once("value");

    if (!snapshot.exists()) return res.status(404).send("User not found");

    let updates = { name };
    
    if (zip && zip !== snapshot.val().zip) {
      const geoData = await getWeatherData(zip);
      updates = { ...updates, zip, ...geoData };
    }

    await userRef.update(updates);
    res.json({ id, ...updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
app.delete("/users/:id", async (req, res) => {
  await db.ref(`users/${req.params.id}`).remove();
  res.status(204).send();
});

app.listen(8080);
