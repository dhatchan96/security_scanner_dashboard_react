import React, { useState } from 'react';
import API from '../api';
import '../style.css';

const AdminPanel = () => {
  const [projectPath, setProjectPath] = useState('');
  const [projectId, setProjectId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState('');

  const startScan = async () => {
    if (!projectPath || !projectId) return alert("Please fill path and ID");
    try {
      await API.post('/api/scan', { project_path: projectPath, project_id: projectId });
      alert("✅ Scan started");
    } catch {
      alert("❌ Scan failed");
    }
  };

  const exportData = async () => {
    try {
      const res = await API.get('/api/export');
      const blob = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "scanner_export.json";
      link.click();
    } catch {
      alert("❌ Export failed");
    }
  };

  const importData = () => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result);
        await API.post('/api/import', json);
        alert("✅ Data imported");
      } catch {
        alert("❌ Import failed");
      }
    };
    reader.readAsText(importFile);
  };

  const resetIssues = async () => {
    try {
      await API.delete('/api/issues');
      setMessage('✅ All issues have been reset.');
    } catch {
      setMessage('❌ Failed to reset issues.');
    }
  };

  const clearScanHistory = async () => {
    try {
      await API.delete('/api/scan-history');
      setMessage('✅ Scan history cleared.');
    } catch {
      setMessage('❌ Failed to clear scan history.');
    }
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">Admin Panel</h2>

      {message && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{message}</span>
          <button className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Start New Scan */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h5 className="card-title">Start New Scan</h5>
            <div className="mb-3">
              <label className="form-label">Project Path</label>
              <input className="form-control" value={projectPath} onChange={(e) => setProjectPath(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Project ID</label>
              <input className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={startScan}>Start Scan</button>
          </div>
        </div>

        {/* Import / Export */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h5 className="card-title">Data Management</h5>
            <button className="btn btn-success me-2" onClick={exportData}>Export Data</button>
            <div className="mt-3">
              <input type="file" className="form-control" onChange={(e) => setImportFile(e.target.files[0])} />
              <button className="btn btn-warning mt-2" onClick={importData}>Import Data</button>
            </div>
          </div>
        </div>

        {/* System Maintenance */}
        <div className="col-md-6">
          <div className="card p-4 shadow-sm">
            <h5 className="card-title">System Reset</h5>
            <button className="btn btn-danger me-2" onClick={resetIssues}>Reset All Issues</button>
            <button className="btn btn-secondary mt-2" onClick={clearScanHistory}>Clear Scan History</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
