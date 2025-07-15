import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const ScanHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/scan-history');  // Updated path
      if (Array.isArray(res.data)) {
        setHistory(res.data.reverse());
      }
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
    }
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">Scan History</h2>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Project</th>
              <th>Scan ID</th>
              <th>Timestamp</th>
              <th>Files</th>
              <th>LOC</th>
              <th>Issues</th>
              <th>Security</th>
              <th>Reliability</th>
              <th>Maintainability</th>
              <th>Quality Gate</th>
              <th>Coverage (%)</th>
              <th>Duplication (%)</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? history.map((scan, index) => (
              <tr key={scan.scan_id}>
                <td>{history.length - index}</td>
                <td>{scan.project_id}</td>
                <td style={{ wordBreak: 'break-word' }}>{scan.scan_id}</td>
                <td>{new Date(scan.timestamp).toLocaleString()}</td>
                <td>{scan.files_scanned}</td>
                <td>{scan.lines_of_code.toLocaleString()}</td>
                <td>{scan.issues}</td>
                <td><span className={`rating-${scan.security_rating}`}>{scan.security_rating}</span></td>
                <td><span className={`rating-${scan.reliability_rating}`}>{scan.reliability_rating}</span></td>
                <td><span className={`rating-${scan.maintainability_rating}`}>{scan.maintainability_rating}</span></td>
                <td><span className={`quality-gate-${scan.quality_gate_status}`}>{scan.quality_gate_status}</span></td>
                <td>{scan.coverage}%</td>
                <td>{scan.duplications}%</td>
                <td>{(scan.duration_ms / 1000).toFixed(2)}s</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="14" className="text-center">No scan history available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScanHistory;
