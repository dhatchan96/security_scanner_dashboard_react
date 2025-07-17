import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const Issues = () => {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await API.get('/api/issues');
      setIssues(res.data || []);
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    }
  };

  const handleStatusToggle = async (id) => {
    const issue = issues.find(i => i.id === id);
    const newStatus = issue.status === 'OPEN' ? 'RESOLVED' : 'OPEN';
    try {
      await API.put(`/api/issues/${id}/status`, { status: newStatus });
      fetchIssues();
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await API.delete(`/api/issues/${id}`);
      fetchIssues();
    } catch (err) {
      console.error('Failed to delete issue:', err);
    }
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">All Security Issues</h2>
 
      <div className="section">
        <div className="table-responsive w-100">
          <table className="table table-bordered table-striped table-hover align-middle table-sm" style={{ minWidth: '1000px' }}>
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Rule</th>
                <th>File</th>
                <th>Line</th>
                <th>Message</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.length > 0 ? issues.map((issue, index) => (
                <tr key={issue.id}>
                  <td>{index + 1}</td>
                  <td><span className={`severity-${issue.severity}`}>{issue.severity}</span></td>
                  <td>{issue.type}</td>
                  <td>{issue.rule_id}</td>
                  <td style={{ wordBreak: 'break-word', maxWidth: '200px' }}>{issue.file_path}</td>
                  <td className="text-center">{issue.line_number}</td>
                  <td style={{ whiteSpace: 'pre-wrap', maxWidth: '250px' }}>{issue.message}</td>
                  <td>
                    <span className={`badge bg-${issue.status === 'RESOLVED' ? 'success' : 'warning'} text-dark`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusToggle(issue.id)}>
                        {issue.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue.id)}>
                        Delete
                      </button>
                    </div>
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
