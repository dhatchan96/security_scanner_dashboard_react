import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaFolder, FaBug, FaClipboardList, FaShieldAlt, FaTrophy, FaChartLine, FaTools, FaBell, FaChevronDown } from 'react-icons/fa';

export default function TopNavbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm px-3">
      <span className="navbar-brand fw-bold">
        <FaShieldAlt className="me-2" />
        Enhanced Security Scanner
      </span>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <NavLink to="/dashboard" className="nav-link">
              <FaTachometerAlt className="me-1" /> Overview
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/scan-history" className="nav-link">
              <FaFolder className="me-1" /> Projects
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/issues" className="nav-link">
              <FaBug className="me-1" /> Issues
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/rules" className="nav-link">
              <FaClipboardList className="me-1" /> Rules
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/quality-gates" className="nav-link">
              <FaShieldAlt className="me-1" /> Quality Gates
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/leaderboard" className="nav-link">
              <FaTrophy className="me-1" /> Leaderboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/summary" className="nav-link">
              <FaChartLine className="me-1" /> Analytics
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/admin" className="nav-link">
              <FaTools className="me-1" /> Administration
            </NavLink>
          </li>
        </ul>

        <ul className="navbar-nav ms-auto">
          <li className="nav-item me-3">
            <span className="position-relative">
              <FaBell />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
              </span>
            </span>
          </li>
          <li className="nav-item d-flex align-items-center text-white">
            <div className="bg-primary rounded-circle text-center me-2" style={{ width: '24px', height: '24px', lineHeight: '24px' }}>
              <span style={{ fontSize: '14px' }}>A</span>
            </div>
            Admin User <FaChevronDown className="ms-1" />
          </li>
        </ul>
      </div>
    </nav>
  );
}
