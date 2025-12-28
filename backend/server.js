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
const { telemetryMiddleware } = require("./middleware/telemetry.middleware");
const userRoutes = require("./routes/user.routes");
const healthRoutes = require("./routes/health.routes");
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

// Mount routes
app.use("/", healthRoutes);
app.use("/users", userRoutes);

// Only start server if not being imported (for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  const HOST = "0.0.0.0"; // Bind to all interfaces for Cloud Run
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
