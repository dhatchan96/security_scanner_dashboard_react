import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="bg-dark text-white p-3 vh-100" style={{ width: '250px' }}>
      <h4 className="text-center">🛡️ Scanner</h4>
      <nav className="nav flex-column mt-4">
        <NavLink to="/dashboard" className="nav-link text-white">Dashboard</NavLink>
        <NavLink to="/issues" className="nav-link text-white">Issues</NavLink>
        <NavLink to="/rules" className="nav-link text-white">Rules</NavLink>
        <NavLink to="/quality-gates" className="nav-link text-white">Quality Gates</NavLink>
        <NavLink to="/leaderboard" className="nav-link text-white">Leaderboard</NavLink>
        <NavLink to="/health" className="nav-link text-white">Health</NavLink>
        <NavLink to="/scan-history" className="nav-link text-white">Scan History</NavLink>
        {/* Optional links */}
        <NavLink to="/summary" className="nav-link text-white">Metrics Summary</NavLink>
        <NavLink to="/admin" className="nav-link text-white">Admin</NavLink>
      </nav>
    </div>
  );
}
