import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaEye,
  FaBrain,
  FaCog,
  FaHistory,
  FaHeartbeat,
} from "react-icons/fa";

export default function ThreatGuardNavbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-3">
      <span
        className="navbar-brand fw-bold"
        style={{ color: "#0d6efd", fontSize: "1.5rem" }}
      >
        <FaShieldAlt className="me-2" />
        ThreatGuard Pro
      </span>
      <span className="badge bg-primary ms-2" style={{ fontSize: "0.7rem" }}>
        LOGIC BOMB DETECTION
      </span>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <NavLink
              to="/thread-demo"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              🧪 Thread Demo
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaEye className="me-1" /> Command Center
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/threats"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaExclamationTriangle className="me-1" /> Active Threats
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/threat-shields"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaShieldAlt className="me-1" /> Threat Shields
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/threat-intelligence"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaBrain className="me-1" /> Threat Intel
            </NavLink>
          </li>
          {/* <li className="nav-item">
            <NavLink
              to="/scan-history"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaHistory className="me-1" /> Scan History
            </NavLink>
          </li> */}
          {/* <li className="nav-item">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaCog className="me-1" /> Administration
            </NavLink>
          </li> */}
          <li className="nav-item">
            <NavLink
              to="/health"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "#0d6efd" : "#222",
                background: isActive ? "#e9f3ff" : "transparent",
                borderRadius: "5px",
                fontWeight: isActive ? "bold" : "normal",
              })}
            >
              <FaHeartbeat className="me-1" /> System Health
            </NavLink>
          </li>
        </ul>

        <ul className="navbar-nav ms-auto">
          <li className="nav-item d-flex align-items-center" style={{ color: "#222" }}>
            <div
              className="rounded-circle text-center me-2"
              style={{
                width: "32px",
                height: "32px",
                lineHeight: "32px",
                background: "#e9f3ff",
                color: "#0d6efd",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              A
            </div>
            Security Admin
          </li>
        </ul>
      </div>
    </nav>
  );
}