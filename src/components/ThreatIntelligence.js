import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const ThreatIntelligence = () => {
  const [intelligence, setIntelligence] = useState(null);

  useEffect(() => {
    fetchThreatIntelligence();
  }, []);

  const fetchThreatIntelligence = async () => {
    try {
      const res = await API.get('/api/threat-intelligence');
      setIntelligence(res.data);
    } catch (error) {
      console.error('Error fetching threat intelligence:', error);
    }
  };

  if (!intelligence) return <p className="text-center mt-5" style={{ color: '#b0b0b0' }}>Loading threat intelligence...</p>;

  return (
    <div className="container-fluid mt-4 px-5" style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
      <h2 className="mb-4" style={{ color: '#0d6efd' }}>🧠 Threat Intelligence Center</h2>
      
      {/* Intelligence Stats */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <div className="card-body">
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0d6efd' }}>{intelligence.total_scans}</div>
              <div style={{ color: '#888' }}>Total Scans</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <div className="card-body">
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#198754' }}>{intelligence.threats_neutralized}</div>
              <div style={{ color: '#888' }}>Threats Neutralized</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <div className="card-body">
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fd7e14' }}>{intelligence.avg_risk_score}</div>
              <div style={{ color: '#888' }}>Avg Risk Score</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <div className="card-body">
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0d6efd' }}>{intelligence.shield_effectiveness}%</div>
              <div style={{ color: '#888' }}>Shield Effectiveness</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
        <h3 style={{ color: '#0d6efd' }} className="mb-3">📊 Threat Intelligence History</h3>
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle" style={{ background: '#fff' }}>
            <thead className="table-light">
              <tr>
                <th style={{ color: '#0d6efd' }}>Scan Date</th>
                <th style={{ color: '#0d6efd' }}>Project</th>
                <th style={{ color: '#0d6efd' }}>Logic Bombs</th>
                <th style={{ color: '#0d6efd' }}>Risk Score</th>
                <th style={{ color: '#0d6efd' }}>Shield Status</th>
                <th style={{ color: '#0d6efd' }}>Threat Level</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.scan_history.map((scan) => {
                const scanDate = new Date(scan.timestamp).toLocaleString();
                return (
                  <tr key={scan.scan_id}>
                    <td style={{ color: '#222' }}>{scanDate}</td>
                    <td style={{ color: '#222' }}>{scan.project_id}</td>
                    <td style={{ color: '#dc3545' }}>{scan.logic_bombs || 0}</td>
                    <td>
                      <span className={`badge ${
                        scan.logic_bomb_risk_score >= 70 ? 'bg-danger' : 
                        scan.logic_bomb_risk_score >= 40 ? 'bg-warning' : 
                        'bg-success'
                      }`}>
                        {scan.logic_bomb_risk_score || 0}/100
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        scan.threat_shield_status === 'PROTECTED' ? 'bg-success' : 
                        scan.threat_shield_status === 'BLOCKED' ? 'bg-danger' : 
                        'bg-warning'
                      }`}>
                        {scan.threat_shield_status}
                      </span>
                    </td>
                    <td style={{ color: scan.threat_level === 'CRITICAL' ? '#dc3545' : scan.threat_level === 'HIGH' ? '#fd7e14' : '#198754' }}>
                      {scan.threat_level || 'UNKNOWN'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ThreatIntelligence;