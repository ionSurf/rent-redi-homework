import React, { useMemo } from 'react';
import { useUsers } from '../hooks/useUsers';
import './Dashboard.css';

function Dashboard() {
  const { users, loading } = useUsers();

  const stats = useMemo(() => {
    if (!users.length) {
      return {
        totalUsers: 0,
        uniqueZipCodes: 0,
        uniqueTimezones: 0,
        recentUsers: []
      };
    }

    const zipCodes = new Set(users.map(u => u.zip));
    const timezones = new Set(users.map(u => u.timezone).filter(Boolean));
    const sortedUsers = [...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return {
      totalUsers: users.length,
      uniqueZipCodes: zipCodes.size,
      uniqueTimezones: timezones.size,
      recentUsers: sortedUsers.slice(0, 5)
    };
  }, [users]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Landlord Dashboard</h1>
        <p>Overview of your tenant management system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f093fb' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.uniqueZipCodes}</h3>
            <p>Unique ZIP Codes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#4facfe' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{stats.uniqueTimezones}</h3>
            <p>Time Zones</p>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Users</h2>
        {stats.recentUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users yet. Add your first user to get started!</p>
          </div>
        ) : (
          <div className="user-list">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p>
                    ZIP: {user.zip} | {user.timezone || 'N/A'}
                  </p>
                  {user.latitude && user.longitude && (
                    <p className="user-coords">
                      Coordinates: {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
