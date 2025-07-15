import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await API.get('/api/issues');
      setIssues(res.data || []);
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
  };

  const updateIssueStatus = async (id, newStatus) => {
    try {
      await API.put(`/api/issues/${id}/status`, { status: newStatus });
      fetchIssues();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filtered = issues.filter(i =>
    (!severityFilter || i.severity === severityFilter) &&
    (!statusFilter || i.status === statusFilter)
  );

  return (
    <div className="container-fluid mt-4 px-5">
      <div className="section">
        <h2 className="mb-4 ps-2">Security Issues</h2>

        <div className="d-flex gap-2 mb-3 ps-2">
          <select className="form-select w-auto" onChange={e => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="BLOCKER">Blocker</option>
            <option value="CRITICAL">Critical</option>
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
            <option value="INFO">Info</option>
          </select>

          <select className="form-select w-auto" onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>

        <div className="table-responsive w-100">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: '90px' }}>Severity</th>
                <th style={{ width: '110px' }}>Type</th>
                <th style={{ width: '180px' }}>Rule</th>
                <th>File</th>
                <th style={{ width: '60px' }}>Line</th>
                <th style={{ width: '80px' }}>Status</th>
                <th>Message</th>
                <th>Suggested Fix</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(issue => (
                <tr key={issue.id}>
                  <td>
                    <span className={`severity-${issue.severity} d-inline-block w-100 text-center`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td>{issue.type}</td>
                  <td>{issue.rule_id}</td>
                  <td style={{ wordBreak: 'break-word' }}>{issue.file_path}</td>
                  <td className="text-center">{issue.line_number}</td>
                  <td className="text-center">{issue.status}</td>
                  <td>{issue.message}</td>
                  <td>{issue.suggested_fix || 'N/A'}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      onChange={e => updateIssueStatus(issue.id, e.target.value)}
                      value=""
                    >
                      <option value="">Change</option>
                      <option value="OPEN">Open</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="FALSE_POSITIVE">False Positive</option>
                    </select>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="text-center">No issues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Issues;
