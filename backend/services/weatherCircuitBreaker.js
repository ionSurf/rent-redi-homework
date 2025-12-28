// backend/services/weatherCircuitBreaker.js
const CircuitBreaker = require("opossum");
const { getWeatherData } = require("./weatherService");

// Configuration for the "SRE Guardrail"
const options = {
  timeout: 5000, // If the service takes > 5s, count as failure
  errorThresholdPercentage: 50, // If 50% of requests fail, open the circuit
  resetTimeout: 30000 // After 30s, try again (Half-Open state)
};

const breaker = new CircuitBreaker(getWeatherData, options);

// --- SRE Observability: Monitoring the Breaker Status ---
breaker.on("open", () =>
  console.warn("🚨 CIRCUIT BREAKER OPEN: OpenWeather API is failing. Stop calling it.")
);
breaker.on("halfOpen", () =>
  console.info("⚠️ CIRCUIT BREAKER HALF-OPEN: Testing OpenWeather API...")
);
breaker.on("close", () =>
  console.info("✅ CIRCUIT BREAKER CLOSED: OpenWeather API is healthy again.")
);

// Fallback logic: If the circuit is OPEN, provide a "Graceful Degradation"
breaker.fallback(zipCode => {
  console.error(`Fallback triggered for ZIP: ${zipCode}. Service unavailable.`);
  throw new Error(
    "Location services are currently down. We saved your name, but coordinates will be updated later."
  );
});

module.exports = breaker;
