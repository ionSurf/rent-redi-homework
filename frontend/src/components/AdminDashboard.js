import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch health status
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      const healthData = await healthRes.json();
      setHealth(healthData);

      // Fetch metrics
      const metricsRes = await fetch(`${API_BASE_URL}/metrics`);
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading system metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-banner">
          ❌ Failed to load metrics: {error}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    if (status === 'healthy') return '✅';
    if (status === 'degraded') return '⚠️';
    return '❌';
  };

  const getCheckIcon = (check) => {
    return check ? '✅' : '❌';
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔧 SRE Monitoring Dashboard</h1>
        <p>Real-time system health and performance metrics</p>
        <button onClick={fetchData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Health Status */}
      <div className="metrics-grid">
        <div className="metric-card health-card">
          <h2>System Health</h2>
          <div className="status-large">
            {getStatusIcon(health?.status)} {health?.status?.toUpperCase()}
          </div>
          <div className="health-checks">
            <div className="check-item">
              <span>{getCheckIcon(health?.checks?.backend)} Backend</span>
            </div>
            <div className="check-item">
              <span>{getCheckIcon(health?.checks?.database)} Firebase Database</span>
            </div>
            <div className="check-item">
              <span>{getCheckIcon(health?.checks?.weatherAPI)} Weather API</span>
            </div>
          </div>
          <div className="uptime">
            Uptime: {health?.uptime?.toFixed(2)}s
          </div>
        </div>

        {/* RED Metrics: Rate */}
        <div className="metric-card">
          <h2>📊 Request Rate</h2>
          <div className="metric-value">{metrics?.rate?.total || 0}</div>
          <div className="metric-label">Total Requests</div>
        </div>

        {/* RED Metrics: Errors */}
        <div className="metric-card">
          <h2>⚠️ Error Rate</h2>
          <div className="metric-value error-value">
            {metrics?.errors?.errorRate || '0%'}
          </div>
          <div className="metric-label">
            {metrics?.errors?.total || 0} errors total
          </div>
        </div>

        {/* RED Metrics: Duration */}
        <div className="metric-card">
          <h2>⏱️ Latency</h2>
          <div className="latency-stats">
            <div className="latency-row">
              <span>Avg:</span>
              <span>{metrics?.duration?.avg || '0ms'}</span>
            </div>
            <div className="latency-row">
              <span>p50:</span>
              <span>{metrics?.duration?.p50 || '0ms'}</span>
            </div>
            <div className="latency-row">
              <span>p95:</span>
              <span className="highlight">{metrics?.duration?.p95 || '0ms'}</span>
            </div>
            <div className="latency-row">
              <span>p99:</span>
              <span className="highlight">{metrics?.duration?.p99 || '0ms'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Codes Breakdown */}
      <div className="status-codes-section">
        <h2>HTTP Status Codes</h2>
        <div className="status-codes">
          {metrics?.statusCodes && Object.entries(metrics.statusCodes).map(([code, count]) => (
            <div key={code} className={`status-badge status-${code[0]}xx`}>
              <span className="code">{code}</span>
              <span className="count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Breakdown */}
      <div className="endpoints-section">
        <h2>Endpoint Performance</h2>
        <div className="endpoints-table">
          <div className="table-header">
            <div>Endpoint</div>
            <div>Requests</div>
            <div>Errors</div>
            <div>Error Rate</div>
            <div>Avg Latency</div>
            <div>p95 Latency</div>
          </div>
          {metrics?.endpoints && Object.entries(metrics.endpoints).map(([endpoint, data]) => (
            <div key={endpoint} className="table-row">
              <div className="endpoint-name">{endpoint}</div>
              <div>{data.count}</div>
              <div className={data.errors > 0 ? 'error-count' : ''}>{data.errors}</div>
              <div className={parseFloat(data.errorRate) > 5 ? 'error-rate-high' : ''}>
                {data.errorRate}
              </div>
              <div>{data.avgDuration}</div>
              <div className={parseFloat(data.p95Duration) > 1000 ? 'latency-high' : ''}>
                {data.p95Duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-info">
        <p>Last updated: {new Date(metrics?.timestamp).toLocaleString()}</p>
        <p>Auto-refreshes every 10 seconds</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
