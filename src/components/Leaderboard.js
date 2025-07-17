import React, { useEffect, useState } from 'react';
import API from '../api';
import '../style.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get('/api/leaderboard');
      if (Array.isArray(res.data)) {
        setLeaderboard(res.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">Project Leaderboard</h2>
      <div className='section'>
        <div className="table-responsive">
          <table
            className="table table-bordered table-striped table-hover align-middle table-sm"
            style={{ minWidth: '700px' }}
          >
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Project</th>
                <th>Score</th>
                <th>Issues</th>
                <th>Blockers</th>
                <th>Security</th>
                <th>Reliability</th>
                <th>Maintainability</th>
                <th>Quality Gate</th>
                <th>Tech Debt (min)</th>
                <th>Lines of Code</th>
                <th>Coverage (%)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? leaderboard.map((p, i) => (
                <tr key={p.project_id}>
                  <td>{i + 1}</td>
                  <td style={{ maxWidth: '250px', wordBreak: 'break-word' }}>{p.project_id}</td>
                  <td>{p.score}</td>
                  <td>{p.total_issues}</td>
                  <td><span className="severity-BLOCKER">{p.blocker_issues}</span></td>
                  <td><span className={`rating-${p.security_rating}`}>{p.security_rating}</span></td>
                  <td><span className={`rating-${p.reliability_rating}`}>{p.reliability_rating}</span></td>
                  <td><span className={`rating-${p.maintainability_rating}`}>{p.maintainability_rating}</span></td>
                  <td><span className={`quality-gate-${p.quality_gate_status}`}>{p.quality_gate_status}</span></td>
                  <td>{p.technical_debt}</td>
                  <td>{p.lines_of_code.toLocaleString()}</td>
                  <td>{p.coverage}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="12" className="text-center">No leaderboard data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
