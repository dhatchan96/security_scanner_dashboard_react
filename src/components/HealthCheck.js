import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const HealthCheck = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await API.get('/api/health');
      setHealth(res.data);
    } catch (error) {
      console.error('Error fetching health check:', error);
    }
  };

  if (!health) return <p className="text-center mt-5">Checking system health...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">System Health</h2>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className={`metric-value ${health.status === 'healthy' ? 'text-success' : 'text-danger'}`}>
              {health.status.toUpperCase()}
            </div>
            <div className="metric-label">System Status</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className="metric-value">{health.version}</div>
            <div className="metric-label">Version</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className="metric-value">{new Date(health.timestamp).toLocaleString()}</div>
            <div className="metric-label">Timestamp</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-4">
        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className="metric-value text-primary">{health.scanner_status}</div>
            <div className="metric-label">Scanner</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className="metric-value">{health.rules_count}</div>
            <div className="metric-label">Rules Loaded</div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="metric-card text-center">
            <div className="metric-value">{health.quality_gates_count}</div>
            <div className="metric-label">Quality Gates</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-4">
        <div className="col-md-6">
          <div className="metric-card text-center">
            <div className="metric-value">{health.total_issues}</div>
            <div className="metric-label">Total Issues Detected</div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="metric-card text-center">
            <div className="metric-value">{health.scan_history_count}</div>
            <div className="metric-label">Scan History Entries</div>
          </div>
        </div>
      </div>

      <div className="mt-4 section">
        <h5>Data Directory:</h5>
        <p className="text-monospace">{health.data_directory}</p>
      </div>
    </div>
  );
};

export default HealthCheck;
