import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const ThreatIssues = () => {
  const [threats, setThreats] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    try {
      const res = await API.get('/api/threats');
      setThreats(res.data || []);
    } catch (err) {
      console.error('Failed to fetch threats:', err);
    }
  };

  const handleStatusToggle = async (id) => {
    const threat = threats.find(t => t.id === id);
    const newStatus = threat.status === 'ACTIVE_THREAT' ? 'NEUTRALIZED' : 'ACTIVE_THREAT';
    try {
      await API.put(`/api/threats/${id}/status`, { status: newStatus });
      fetchThreats();
    } catch (err) {
      console.error('Failed to update threat status:', err);
    }
  };

  const neutralizeThreat = async (id) => {
    if (!window.confirm('Are you sure you want to neutralize this threat?')) return;
    try {
      await API.post(`/api/threats/${id}/neutralize`);
      fetchThreats();
    } catch (err) {
      console.error('Failed to neutralize threat:', err);
    }
  };

  const filteredThreats = threats.filter(threat => {
    if (filter === 'logicbombs') return threat.type?.includes('BOMB') || threat.rule_id?.startsWith('LOGIC_BOMB_');
    if (filter === 'active') return threat.status === 'ACTIVE_THREAT';
    if (filter === 'critical') return threat.severity === 'CRITICAL_BOMB';
    return true;
  });

  return (
    <div className="container-fluid mt-4 px-5" style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#0d6efd' }}>🚨 Active Threat Management</h2>
        <div>
          <select 
            className="form-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ background: '#f8f9fa', color: '#222', border: '1px solid #b0b0b0' }}
          >
            <option value="all">All Threats</option>
            <option value="logicbombs">Logic Bomb Threats</option>
            <option value="active">Active Threats</option>
            <option value="critical">Critical Threats</option>
          </select>
        </div>
      </div>

      {/* Threat Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #dc3545' }}>
            <div className="card-body">
              <h3 style={{ color: '#dc3545' }}>{threats.filter(t => t.severity === 'CRITICAL_BOMB').length}</h3>
              <p style={{ color: '#888' }}>Critical Logic Bombs</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #fd7e14' }}>
            <div className="card-body">
              <h3 style={{ color: '#fd7e14' }}>{threats.filter(t => t.status === 'ACTIVE_THREAT').length}</h3>
              <p style={{ color: '#888' }}>Active Threats</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #198754' }}>
            <div className="card-body">
              <h3 style={{ color: '#198754' }}>{threats.filter(t => t.status === 'NEUTRALIZED').length}</h3>
              <p style={{ color: '#888' }}>Neutralized</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{ background: '#fff', border: '1px solid #0d6efd' }}>
            <div className="card-body">
              <h3 style={{ color: '#0d6efd' }}>{threats.length}</h3>
              <p style={{ color: '#888' }}>Total Threats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
        <div className="table-responsive w-100">
          <table className="table table-bordered table-hover align-middle table-sm" style={{ minWidth: '1200px', background: '#fff' }}>
            <thead className="table-light">
              <tr>
                <th style={{ color: '#0d6efd' }}>#</th>
                <th style={{ color: '#0d6efd' }}>Threat Level</th>
                <th style={{ color: '#0d6efd' }}>Type</th>
                <th style={{ color: '#0d6efd' }}>Rule</th>
                <th style={{ color: '#0d6efd' }}>File</th>
                <th style={{ color: '#0d6efd' }}>Line</th>
                <th style={{ color: '#0d6efd' }}>Trigger Analysis</th>
                <th style={{ color: '#0d6efd' }}>Status</th>
                <th style={{ color: '#0d6efd' }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredThreats.length > 0 ? filteredThreats.map((threat, index) => (
                <tr key={threat.id}>
                  <td style={{ color: '#888' }}>{index + 1}</td>
                  <td>
                    <span className={`badge ${
                      threat.severity === 'CRITICAL_BOMB' ? 'bg-danger' :
                      threat.severity === 'HIGH_RISK' ? 'bg-warning' :
                      threat.severity === 'MEDIUM_RISK' ? 'bg-info' :
                      'bg-secondary'
                    }`}>
                      {threat.severity}
                    </span>
                  </td>
                  <td style={{ color: '#222' }}>{threat.type}</td>
                  <td style={{ color: '#888', fontSize: '0.85rem' }}>{threat.rule_id}</td>
                  <td style={{ wordBreak: 'break-word', maxWidth: '200px', color: '#222' }}>{threat.file_path}</td>
                  <td className="text-center" style={{ color: '#0d6efd' }}>{threat.line_number}</td>
                  <td style={{ whiteSpace: 'pre-wrap', maxWidth: '250px', color: '#fd7e14', fontSize: '0.85rem' }}>
                    {threat.trigger_analysis || 'Analysis pending'}
                  </td>
                  <td>
                    <span className={`badge ${
                      threat.status === 'NEUTRALIZED' ? 'bg-success' :
                      threat.status === 'ACTIVE_THREAT' ? 'bg-danger' :
                      threat.status === 'UNDER_REVIEW' ? 'bg-warning' :
                      'bg-secondary'
                    }`}>
                      {threat.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => neutralizeThreat(threat.id)}
                        disabled={threat.status === 'NEUTRALIZED'}
                      >
                        {threat.status === 'NEUTRALIZED' ? 'Neutralized' : 'Neutralize'}
                      </button>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => handleStatusToggle(threat.id)}
                      >
                        {threat.status === 'ACTIVE_THREAT' ? 'Resolve' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="text-center" style={{ color: '#888' }}>
                    No threats found for current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ThreatIssues;