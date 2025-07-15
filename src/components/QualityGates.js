import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const QualityGates = () => {
  const [gates, setGates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [gateData, setGateData] = useState({ id: '', name: '', conditions: '' });

  useEffect(() => {
    fetchGates();
  }, []);

  const fetchGates = async () => {
    try {
      const res = await API.get('/api/quality-gates');
      setGates(Object.values(res.data || {}));
    } catch (err) {
      console.error('Failed to fetch gates:', err);
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setGateData({ id: '', name: '', conditions: '' });
    setShowModal(true);
  };

  const openEditModal = (gate) => {
    setFormMode('edit');
    setGateData({
      id: gate.id,
      name: gate.name,
      conditions: gate.conditions.map(
        (c) => `${c.metric}:${c.operator}:${c.value}`
      ).join(', ')
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: gateData.name,
      conditions: gateData.conditions.split(',').map(condStr => {
        const [metric, operator, value] = condStr.trim().split(':');
        return {
          metric,
          operator,
          value: isNaN(value) ? value : Number(value)
        };
      })
    };

    try {
      if (formMode === 'create') {
        await API.post('/api/quality-gates', payload);
      } else {
        await API.put(`/api/quality-gates/${gateData.id}`, payload);
      }
      fetchGates();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to submit gate:', err);
    }
  };

  const deleteGate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quality gate?')) return;
    try {
      await API.delete(`/api/quality-gates/${id}`);
      fetchGates();
    } catch (err) {
      console.error('Failed to delete gate:', err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Quality Gates</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>Create New Gate</button>
      </div>

      <div className="row">
        {gates.map(gate => (
          <div key={gate.id} className="col-md-6 mb-3">
            <div className="section">
              <h5>
                {gate.name} {gate.is_default && <span className="badge bg-secondary">Default</span>}
              </h5>
              <p><strong>Conditions:</strong></p>
              <ul className="mb-2">
                {gate.conditions.map((cond, idx) => (
                  <li key={idx}>
                    {cond.metric} {cond.operator} {cond.value}
                  </li>
                ))}
              </ul>
              <div className="mt-2 d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(gate)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteGate(gate.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {gates.length === 0 && <p>No quality gates found.</p>}
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{formMode === 'create' ? 'Create Quality Gate' : 'Edit Quality Gate'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={gateData.name}
                      onChange={(e) => setGateData({ ...gateData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Conditions (comma-separated):</label>
                    <small className="text-muted d-block mb-1">Format: <code>metric:operator:value</code></small>
                    <input
                      type="text"
                      className="form-control"
                      value={gateData.conditions}
                      onChange={(e) => setGateData({ ...gateData, conditions: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">
                    {formMode === 'create' ? 'Create Gate' : 'Update Gate'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityGates;
