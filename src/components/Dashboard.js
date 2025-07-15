import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await API.get('/api/dashboard/metrics');
      if (res.data && !res.data.error) {
        setMetrics(res.data);
        setRecentIssues(res.data.recent_issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const resolveIssue = async (id) => {
    try {
      await API.put(`/api/issues/${id}/status`, { status: 'RESOLVED' });
      fetchMetrics();
    } catch (error) {
      console.error('Failed to resolve issue:', error);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
      console.log('Dropped file:', e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length) {
      setFile(e.target.files[0]);
      console.log('Selected file:', e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('fileInput').click();
  };

  if (!metrics) return <p className="text-center mt-5">Loading metrics...</p>;

  const { ratings, scan_info, quality_gate, issues, metrics: metricData } = metrics;

  return (
    <div className="container-fluid mt-4 px-5">
      <div className="alert alert-success mb-4">
        ✅ All systems operational. Last scan completed successfully 2 minutes ago.
      </div>

      <div className="card mb-5 shadow">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-upload"></i> Quick Security Scan</h5>
          <button className="btn btn-secondary btn-sm">⚙️ Advanced Options</button>
        </div>
        <div
          className={`card-body text-center bg-light border border-primary rounded ${dragOver ? 'bg-info' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          style={{ padding: '50px', transition: 'background 0.3s ease' }}
        >
          <input
            type="file"
            id="fileInput"
            hidden
            accept=".js,.py,.java,.cs,.php,.go,.rs,.cpp,.ts,.jsx,.vue,.rb,.sql,.yaml,.json"
            onChange={handleFileSelect}
          />
          <div className="mb-3">
            <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
            <h5 className="mt-3">Drop your source code files here for instant security analysis</h5>
            <small className="text-muted">Supports: js, py, java, cs, php, go, rs, cpp, ts, jsx, vue, rb, sql, yaml, json</small>
          </div>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button className="btn btn-primary" onClick={triggerFileInput}>📂 Browse Files</button>
            <button className="btn btn-outline-secondary">🎯 Try Demo</button>
          </div>
        </div>
      </div>

      <h2 className="mb-4">Overview</h2>

      <div className="row g-4 mb-4">
        {[
          { label: 'Security Rating', value: ratings.security, className: `rating-${ratings.security}` },
          { label: 'Reliability Rating', value: ratings.reliability, className: `rating-${ratings.reliability}` },
          { label: 'Maintainability Rating', value: ratings.maintainability, className: `rating-${ratings.maintainability}` },
          { label: 'Quality Gate', value: quality_gate.status, className: `quality-gate-${quality_gate.status}` }
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className="metric-card text-center">
              <div className={`metric-value ${item.className}`}>{item.value}</div>
              <div className="metric-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-5">
        {[
          { label: 'Total Issues', value: issues.total },
          { label: 'Files Scanned', value: scan_info.files_scanned },
          { label: 'Lines of Code', value: scan_info.lines_of_code.toLocaleString() },
          { label: 'Technical Debt', value: Math.round(metricData.technical_debt / 60) + 'h' }
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className="metric-card text-center">
              <div className="metric-value">{item.value}</div>
              <div className="metric-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2 className="mb-3">Recent Issues</h2>
        <div className="table-responsive w-100">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Rule</th>
                <th>File</th>
                <th>Line</th>
                <th>Message</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.length > 0 ? recentIssues.map((issue) => (
                <tr key={issue.id}>
                  <td><span className={`severity-${issue.severity}`}>{issue.severity}</span></td>
                  <td>{issue.type}</td>
                  <td>{issue.rule_id}</td>
                  <td style={{ wordBreak: 'break-word' }}>{issue.file_path}</td>
                  <td className="text-center">{issue.line_number}</td>
                  <td>{issue.message}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-primary">Details</button>
                      <button className="btn btn-sm btn-success" onClick={() => resolveIssue(issue.id)}>Resolve</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="text-center">No issues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
