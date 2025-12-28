// backend/scripts/syntheticProbe.js
// SRE: Synthetic Monitoring Probe
// Simulates user behavior to continuously verify system health

const axios = require("axios");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const PROBE_INTERVAL = 30000; // 30 seconds
const TIMEOUT = 5000; // 5 second timeout

let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_ALERT = 3;

/**
 * Probe the /health endpoint
 */
async function probeHealth() {
  const results = {
    timestamp: new Date().toISOString(),
    backend: "❌ DOWN",
    database: "❌ DOWN",
    weatherAPI: "❌ DOWN",
    latency: 0,
    status: "FAIL"
  };

  try {
    const start = Date.now();
    const res = await axios.get(`${BACKEND_URL}/health`, {
      timeout: TIMEOUT
    });
    results.latency = Date.now() - start;

    if (res.status === 200) {
      results.backend = "✅ UP";
      results.database = res.data.checks.database ? "✅ UP" : "⚠️  DEGRADED";
      results.weatherAPI = res.data.checks.weatherAPI ? "✅ UP" : "⚠️  DEGRADED";
      results.status = res.data.status === "healthy" ? "PASS" : "DEGRADED";

      // Reset failure counter on success
      consecutiveFailures = 0;
    }
  } catch (e) {
    consecutiveFailures++;
    results.error = e.message;

    // Alert after consecutive failures
    if (consecutiveFailures >= MAX_FAILURES_BEFORE_ALERT) {
      console.error(`🚨 ALERT: ${consecutiveFailures} consecutive health check failures!`);
    }
  }

  return results;
}

/**
 * Probe the /metrics endpoint to check RED metrics
 */
async function probeMetrics() {
  try {
    const res = await axios.get(`${BACKEND_URL}/metrics`, {
      timeout: TIMEOUT
    });

    if (res.status === 200) {
      const metrics = res.data;

      // Alert on high error rate
      const errorRate = parseFloat(metrics.errors.errorRate);
      if (errorRate > 10) {
        console.warn(`⚠️  HIGH ERROR RATE: ${metrics.errors.errorRate}`);
      }

      // Alert on slow p95 latency
      const p95 = parseFloat(metrics.duration.p95);
      if (p95 > 2000) {
        console.warn(`⚠️  SLOW P95 LATENCY: ${metrics.duration.p95}`);
      }

      return {
        errorRate: metrics.errors.errorRate,
        p95Latency: metrics.duration.p95,
        totalRequests: metrics.rate.total
      };
    }
  } catch (e) {
    console.error("Failed to fetch metrics:", e.message);
    return null;
  }
}

/**
 * Synthetic end-to-end probe: Create and delete a test user
 */
async function probeEndToEnd() {
  const testUser = {
    name: "SRE Probe User",
    zip: "10001"
  };

  try {
    // Test CREATE
    const createStart = Date.now();
    const createRes = await axios.post(`${BACKEND_URL}/users`, testUser, {
      timeout: TIMEOUT
    });
    const createLatency = Date.now() - createStart;

    if (createRes.status !== 201) {
      throw new Error(`Create failed with status ${createRes.status}`);
    }

    const userId = createRes.data.id;

    // Test READ
    const readStart = Date.now();
    const readRes = await axios.get(`${BACKEND_URL}/users/${userId}`, {
      timeout: TIMEOUT
    });
    const readLatency = Date.now() - readStart;

    // Test DELETE (cleanup)
    await axios.delete(`${BACKEND_URL}/users/${userId}`, {
      timeout: TIMEOUT
    });

    return {
      status: "✅ PASS",
      createLatency: `${createLatency}ms`,
      readLatency: `${readLatency}ms`
    };
  } catch (e) {
    return {
      status: "❌ FAIL",
      error: e.message
    };
  }
}

/**
 * Main probe execution loop
 */
async function runProbe() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 Running Synthetic Probe...");
  console.log("=".repeat(60));

  // Health check probe
  const healthResults = await probeHealth();
  console.table(healthResults);

  // Metrics check
  const metricsResults = await probeMetrics();
  if (metricsResults) {
    console.log("\n📊 Current Metrics:");
    console.table(metricsResults);
  }

  // End-to-end functional test (every 2 minutes to avoid spam)
  const now = Date.now();
  if (!runProbe.lastE2E || now - runProbe.lastE2E > 120000) {
    const e2eResults = await probeEndToEnd();
    console.log("\n🔄 End-to-End Test:");
    console.table(e2eResults);
    runProbe.lastE2E = now;
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

// Start the probe
console.log(`🚀 Starting Synthetic Probe (interval: ${PROBE_INTERVAL / 1000}s)`);
console.log(`📍 Monitoring: ${BACKEND_URL}`);

// Run immediately on start
runProbe();

// Then run on interval
setInterval(runProbe, PROBE_INTERVAL);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Stopping Synthetic Probe...");
  process.exit(0);
});
