import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ThreatGuardDashboard from './components/ThreatGuardDashboard';
import ThreatIssues from './components/ThreatIssues';
import ThreatShields from './components/ThreatShields';
import ThreatIntelligence from './components/ThreatIntelligence';
import AdminPanel from './components/AdminPanel';
import HealthCheck from './components/HealthCheck';
import ScanHistory from './components/ScanHistory';
import MetricsSummary from './components/MetricsSummary';
import ThreatGuardNavbar from './components/ThreatGuardNavbar';
import ThreadDemo from './components/ThreadDemo';

export default function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <ThreatGuardNavbar />
        <Routes>
          {/* <Route path="/thread-demo" element={<ThreadDemo />} /> */}
          <Route path="/dashboard" element={<ThreatGuardDashboard />} />
          <Route path="/threats" element={<ThreatIssues />} />
          <Route path="/threat-shields" element={<ThreatShields />} />
          <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/scan-history" element={<ScanHistory />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/summary" element={<MetricsSummary />} />
          <Route path="/" element={<ThreatGuardDashboard />} />
          <Route path="/metrics" element={<MetricsSummary />} />
        </Routes>
      </div>
    </Router>
  );
}