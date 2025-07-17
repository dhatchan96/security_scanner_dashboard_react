import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({
    id: '', name: '', description: '', severity: 'BLOCKER', type: 'VULNERABILITY',
    language: '*', pattern: '', remediation_effort: 30
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await API.get('/api/rules');
      setRules(Object.values(res.data));
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    }
  };

  const openCreateModal = () => {
    setFormMode('create');
    setFormData({
      id: '', name: '', description: '', severity: 'BLOCKER', type: 'VULNERABILITY',
      language: '*', pattern: '', remediation_effort: 30
    });
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setFormMode('edit');
    setFormData({ ...rule });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'create') {
        await API.post('/api/rules', {
          ...formData,
          enabled: true,
          custom: true,
          tags: ['custom'],
          remediation_effort: parseInt(formData.remediation_effort),
        });
      } else {
        await API.put(`/api/rules/${formData.id}`, {
          ...formData,
          remediation_effort: parseInt(formData.remediation_effort),
        });
      }
      fetchRules();
      setShowModal(false);
    } catch (err) {
      console.error('Failed to submit rule:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete rule: ${id}?`)) return;
    try {
      await API.delete(`/api/rules/${id}`);
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      await API.put(`/api/rules/${id}`, { enabled });
      fetchRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Security Rules</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>Create New Rule</button>
      </div>

      <div className="section">
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Rule ID</th>
                <th>Name</th>
                <th>Language</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Enabled</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.id}</td>
                  <td>{rule.name}</td>
                  <td>{rule.language}</td>
                  <td><span className={`severity-${rule.severity}`}>{rule.severity}</span></td>
                  <td>{rule.type}</td>
                  <td>{rule.enabled ? 'Yes' : 'No'}</td>
                  <td className="text-center">
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-sm btn-primary" onClick={() => openEditModal(rule)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rule.id)}>Delete</button>
                      <button
                        className={`btn btn-sm ${rule.enabled ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggle(rule.id, !rule.enabled)}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && <tr><td colSpan="7" className="text-center">No rules found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{formMode === 'create' ? 'Create New Rule' : 'Edit Rule'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Rule ID</label>
                      <input
                        type="text"
                        className="form-control"
                        name="id"
                        required
                        value={formData.id}
                        disabled={formMode === 'edit'}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Name</label>
                      <input type="text" className="form-control" name="name" required value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" name="description" required value={formData.description} onChange={handleChange}></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Severity</label>
                      <select className="form-select" name="severity" value={formData.severity} onChange={handleChange}>
                        <option value="BLOCKER">Blocker</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="MAJOR">Major</option>
                        <option value="MINOR">Minor</option>
                        <option value="INFO">Info</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Type</label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                        <option value="VULNERABILITY">Vulnerability</option>
                        <option value="BUG">Bug</option>
                        <option value="CODE_SMELL">Code Smell</option>
                        <option value="SECURITY_HOTSPOT">Security Hotspot</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Language</label>
                      <select className="form-select" name="language" value={formData.language} onChange={handleChange}>
                        <option value="*">All</option>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="php">PHP</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Remediation Effort (mins)</label>
                      <input type="number" className="form-control" name="remediation_effort" value={formData.remediation_effort} onChange={handleChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Regex Pattern</label>
                      <input type="text" className="form-control" name="pattern" required value={formData.pattern} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">{formMode === 'create' ? 'Create Rule' : 'Update Rule'}</button>
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

export default Rules;
