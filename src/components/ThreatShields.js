import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const ThreatShields = () => {
  const [shields, setShields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [shieldData, setShieldData] = useState({ 
    id: '', 
    name: '', 
    protection_rules: '', 
    threat_categories: '',
    risk_threshold: 'MEDIUM_RISK'
  });

  useEffect(() => {
    fetchShields();
  }, []);

  const fetchShields = async () => {
    try {
      const res = await API.get('/api/threat-shields');
      setShields(Object.values(res.data || {}));
    } catch (err) {
      console.error('Failed to fetch threat shields:', err);
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setShieldData({ 
      id: '', 
      name: '', 
      protection_rules: '', 
      threat_categories: '',
      risk_threshold: 'MEDIUM_RISK'
    });
    setShowModal(true);
  };

  const openEditModal = (shield) => {
    setFormMode('edit');
    setShieldData({
      id: shield.id,
      name: shield.name,
      protection_rules: JSON.stringify(shield.protection_rules, null, 2),
      threat_categories: shield.threat_categories?.join(', ') || '',
      risk_threshold: shield.risk_threshold || 'MEDIUM_RISK'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let protection_rules = [];
    try {
      if (shieldData.protection_rules) {
        protection_rules = JSON.parse(shieldData.protection_rules);
      }
    } catch (e) {
      alert('Invalid JSON format in protection rules');
      return;
    }

    const payload = {
      name: shieldData.name,
      protection_rules: protection_rules,
      threat_categories: shieldData.threat_categories.split(',').map(cat => cat.trim()).filter(cat => cat),
      risk_threshold: shieldData.risk_threshold
    };

    try {
      if (formMode === 'create') {
        await API.post('/api/threat-shields', payload);
      } else {
        await API.put(`/api/threat-shields/${shieldData.id}`, payload);
      }
      fetchShields();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to submit threat shield:', err);
      alert('Failed to save threat shield');
    }
  };

  const deleteShield = async (id) => {
    if (!window.confirm('Are you sure you want to delete this threat shield?')) return;
    try {
      await API.delete(`/api/threat-shields/${id}`);
      fetchShields();
    } catch (err) {
      console.error('Failed to delete threat shield:', err);
    }
  };

  return (
    <div className="container-fluid mt-4 px-5" style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ color: '#0d6efd' }}>🛡️ Threat Shield Management</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create New Shield
        </button>
      </div>

      <div className="row">
        {shields.map(shield => (
          <div key={shield.id} className="col-md-6 mb-3">
            <div className="card" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#222' }}>
              <div className="card-header" style={{ background: '#e9f3ff', borderBottom: '1px solid #e5e7eb' }}>
                <h5 style={{ color: '#0d6efd' }}>
                  {shield.name} {shield.is_default && <span className="badge bg-secondary">Default</span>}
                </h5>
              </div>
              <div className="card-body">
                <p><strong style={{ color: '#0d6efd' }}>Risk Threshold:</strong> 
                  <span className={`badge ms-2 ${
                    shield.risk_threshold === 'CRITICAL_BOMB' ? 'bg-danger' :
                    shield.risk_threshold === 'HIGH_RISK' ? 'bg-warning' :
                    shield.risk_threshold === 'MEDIUM_RISK' ? 'bg-info' :
                    'bg-secondary'
                  }`}>
                    {shield.risk_threshold}
                  </span>
                </p>
                
                <p><strong style={{ color: '#0d6efd' }}>Threat Categories:</strong></p>
                <div className="mb-2">
                  {shield.threat_categories?.map((category, idx) => (
                    <span key={idx} className="badge bg-light text-dark border border-primary me-1 mb-1">
                      {category}
                    </span>
                  )) || <span style={{ color: '#b0b0b0' }}>No categories specified</span>}
                </div>
                
                <p><strong style={{ color: '#0d6efd' }}>Protection Rules:</strong></p>
                <div style={{ maxHeight: '150px', overflow: 'auto', background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                  {shield.protection_rules?.length > 0 ? (
                    <ul className="mb-0" style={{ color: '#444', fontSize: '0.95rem' }}>
                      {shield.protection_rules.map((rule, idx) => (
                        <li key={idx}>
                          <strong>{rule.threat_type}:</strong> {rule.risk_threshold}
                          {rule.block && <span className="badge bg-danger ms-1">BLOCK</span>}
                          {rule.alert && <span className="badge bg-warning ms-1">ALERT</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#b0b0b0' }}>No protection rules defined</span>
                  )}
                </div>
                
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => openEditModal(shield)}>
                    Edit Shield
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteShield(shield.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {shields.length === 0 && (
          <div className="col-12">
            <div className="text-center" style={{ color: '#888', padding: '2rem' }}>
              <h4>No threat shields configured</h4>
              <p>Create your first threat shield to protect against logic bomb attacks</p>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ background: '#fff', color: '#222', border: '1px solid #e5e7eb' }}>
              <form onSubmit={handleSubmit}>
                <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <h5 className="modal-title" style={{ color: '#0d6efd' }}>
                    {formMode === 'create' ? 'Create Threat Shield' : 'Edit Threat Shield'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label style={{ color: '#0d6efd' }}>Shield Name</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#f8f9fa', color: '#222', border: '1px solid #e5e7eb' }}
                      required
                      value={shieldData.name}
                      onChange={(e) => setShieldData({ ...shieldData, name: e.target.value })}
                      placeholder="e.g., Production Logic Bomb Shield"
                    />
                  </div>
                  
                  <div className="form-group mb-3">
                    <label style={{ color: '#0d6efd' }}>Risk Threshold</label>
                    <select
                      className="form-select"
                      style={{ background: '#f8f9fa', color: '#222', border: '1px solid #e5e7eb' }}
                      value={shieldData.risk_threshold}
                      onChange={(e) => setShieldData({ ...shieldData, risk_threshold: e.target.value })}
                    >
                      <option value="CRITICAL_BOMB">Critical Bomb</option>
                      <option value="HIGH_RISK">High Risk</option>
                      <option value="MEDIUM_RISK">Medium Risk</option>
                      <option value="LOW_RISK">Low Risk</option>
                    </select>
                    <small style={{ color: '#888' }}>Minimum threat level to trigger this shield</small>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label style={{ color: '#0d6efd' }}>Threat Categories (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#f8f9fa', color: '#222', border: '1px solid #e5e7eb' }}
                      value={shieldData.threat_categories}
                      onChange={(e) => setShieldData({ ...shieldData, threat_categories: e.target.value })}
                      placeholder="TIME_BOMB, USER_BOMB, COUNTER_BOMB, DESTRUCTIVE_PAYLOAD"
                    />
                    <small style={{ color: '#888' }}>Types of threats this shield should protect against</small>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label style={{ color: '#0d6efd' }}>Protection Rules (JSON format)</label>
                    <textarea
                      className="form-control"
                      style={{ background: '#f8f9fa', color: '#222', border: '1px solid #e5e7eb', minHeight: '200px' }}
                      value={shieldData.protection_rules}
                      onChange={(e) => setShieldData({ ...shieldData, protection_rules: e.target.value })}
                      placeholder={JSON.stringify([
                        {
                          "threat_type": "TIME_BOMB",
                          "risk_threshold": "HIGH_RISK",
                          "block": true,
                          "alert": true
                        },
                        {
                          "threat_type": "DESTRUCTIVE_PAYLOAD",
                          "risk_threshold": "CRITICAL_BOMB",
                          "block": true,
                          "alert": true
                        }
                      ], null, 2)}
                    />
                    <small style={{ color: '#888' }}>Define specific protection rules in JSON format</small>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb' }}>
                  <button type="submit" className="btn btn-primary">
                    {formMode === 'create' ? 'Create Shield' : 'Update Shield'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatShields;