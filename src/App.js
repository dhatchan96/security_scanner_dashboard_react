import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Issues from './components/Issues';
import Rules from './components/Rules';
import QualityGates from './components/QualityGates';
import AdminPanel from './components/AdminPanel';
import Leaderboard from './components/Leaderboard';
import HealthCheck from './components/HealthCheck';
import ScanHistory from './components/ScanHistory';
import MetricsSummary from './components/MetricsSummary';
import TopNavbar from './components/TopNavbar';



export default function App() {
  return (
    <Router>
      <TopNavbar />
      <div className="container-fluid mt-4 px-4">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/quality-gates" element={<QualityGates />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/summary" element={<MetricsSummary />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/scan-history" element={<ScanHistory />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
