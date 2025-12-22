// backend/middleware/telemetry.js
// SRE Observability: RED Metrics (Rate, Errors, Duration)
// Tracks the "Golden Signals" for monitoring system health

const RED_METRICS = {
  requestCount: 0,
  errorCount: 0,
  durations: [],
  statusCodes: {},
  endpoints: {}
};

/**
 * Telemetry middleware that tracks RED metrics for all requests
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
const telemetryMiddleware = (req, res, next) => {
  const start = Date.now();
  const endpoint = `${req.method} ${req.path}`;

  // Increment request count
  RED_METRICS.requestCount++;

  // Track per-endpoint metrics
  if (!RED_METRICS.endpoints[endpoint]) {
    RED_METRICS.endpoints[endpoint] = {
      count: 0,
      errors: 0,
      durations: []
    };
  }
  RED_METRICS.endpoints[endpoint].count++;

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Track duration
    RED_METRICS.durations.push(duration);
    RED_METRICS.endpoints[endpoint].durations.push(duration);

    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      RED_METRICS.errorCount++;
      RED_METRICS.endpoints[endpoint].errors++;
    }

    // Track status codes
    RED_METRICS.statusCodes[res.statusCode] =
      (RED_METRICS.statusCodes[res.statusCode] || 0) + 1;

    // Log slow requests (SRE best practice)
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${endpoint} took ${duration}ms`);
    }
  });

  next();
};

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Calculate average from array
 */
function calculateAverage(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Get current metrics snapshot
 * Mimics Prometheus exposition format (JSON instead of text)
 */
const getMetrics = (req, res) => {
  const avgDuration = calculateAverage(RED_METRICS.durations);
  const p50Duration = calculatePercentile(RED_METRICS.durations, 50);
  const p95Duration = calculatePercentile(RED_METRICS.durations, 95);
  const p99Duration = calculatePercentile(RED_METRICS.durations, 99);

  // Calculate error rate
  const errorRate = RED_METRICS.requestCount > 0
    ? ((RED_METRICS.errorCount / RED_METRICS.requestCount) * 100).toFixed(2)
    : 0;

  // Per-endpoint breakdown
  const endpointMetrics = {};
  for (const [endpoint, data] of Object.entries(RED_METRICS.endpoints)) {
    endpointMetrics[endpoint] = {
      count: data.count,
      errors: data.errors,
      errorRate: data.count > 0
        ? ((data.errors / data.count) * 100).toFixed(2) + '%'
        : '0%',
      avgDuration: calculateAverage(data.durations).toFixed(2) + 'ms',
      p95Duration: calculatePercentile(data.durations, 95).toFixed(2) + 'ms'
    };
  }

  res.json({
    // RED Metrics (Golden Signals)
    rate: {
      total: RED_METRICS.requestCount,
      ratePerMinute: 'N/A' // Would need time-windowing for accurate rate
    },
    errors: {
      total: RED_METRICS.errorCount,
      errorRate: errorRate + '%'
    },
    duration: {
      avg: avgDuration.toFixed(2) + 'ms',
      p50: p50Duration.toFixed(2) + 'ms',
      p95: p95Duration.toFixed(2) + 'ms',
      p99: p99Duration.toFixed(2) + 'ms'
    },

    // Additional insights
    statusCodes: RED_METRICS.statusCodes,
    endpoints: endpointMetrics,

    // Metadata
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(2) + 's'
  });
};

/**
 * Reset metrics (useful for testing)
 */
const resetMetrics = () => {
  RED_METRICS.requestCount = 0;
  RED_METRICS.errorCount = 0;
  RED_METRICS.durations = [];
  RED_METRICS.statusCodes = {};
  RED_METRICS.endpoints = {};
};

module.exports = {
  telemetryMiddleware,
  getMetrics,
  resetMetrics
};
