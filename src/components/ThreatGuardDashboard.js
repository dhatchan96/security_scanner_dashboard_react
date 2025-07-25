import React, { useEffect, useState } from "react";
import API from "../api";
import "../style.css";
import { Toast } from "bootstrap";
import JSZip from "jszip";

const ThreatGuardDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentThreats, setRecentThreats] = useState([]);
  const [health, setHealth] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logicBombStats, setLogicBombStats] = useState(null);
  const [activeTab, setActiveTab] = useState("logicbombs");

  const logicBombThreats = recentThreats.filter(
    (t) =>
      t.message?.toLowerCase().includes("logic bomb") ||
      t.message?.toLowerCase().includes("destructive payload") ||
      t.message?.toLowerCase().includes("file destruction") ||
      t.message?.toLowerCase().includes("conditional trigger")
  );

  const logicBombIds = new Set(logicBombThreats.map((t) => t.id));
  const otherThreats = recentThreats.filter((t) => !logicBombIds.has(t.id));

  useEffect(() => {
    // Restore metrics from localStorage if available
    const savedMetrics = localStorage.getItem("tg_metrics");
    const savedThreats = localStorage.getItem("tg_recent_threats");
    const savedLogicBombStats = localStorage.getItem("tg_logic_bomb_stats");

    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
    if (savedThreats) {
      setRecentThreats(JSON.parse(savedThreats));
    }
    if (savedLogicBombStats) {
      setLogicBombStats(JSON.parse(savedLogicBombStats));
    }

    // Always fetch latest health
    fetchHealth();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await API.get("/api/command-center/metrics");
      if (res.data && !res.data.error) {
        setMetrics(res.data);
        // setRecentThreats(res.data.recent_threats || []);
        console.log("All threats returned:", res.data.recent_threats);

        if (res.data.logic_bomb_analysis) {
          setLogicBombStats({
            count: Object.values(res.data.logic_bomb_analysis.by_type).reduce(
              (a, b) => a + b,
              0
            ),
            details: Object.entries(
              res.data.logic_bomb_analysis.by_type || {}
            ).map(([type, count]) => `${type.replace("_", " ")}: ${count}`),
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await API.get("/api/health");
      setHealth(res.data);
    } catch (err) {
      console.error("Failed to fetch health info:", err);
    }
  };

  const neutralizeThreat = async (id) => {
    try {
      await API.post(`/api/threats/${id}/neutralize`);
      fetchMetrics();
      showToast("Threat neutralized successfully!", "success");
    } catch (error) {
      console.error("Failed to neutralize threat:", error);
      showToast("Failed to neutralize threat", "error");
    }
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.items;
    const files = await extractFilesFromItems(items);
    handleUpload(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    handleUpload(files);
  };

  const extractFilesFromItems = async (items) => {
    const traverseFileTree = (item, path = "") => {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file((file) => {
            file.fullPath = path + file.name;
            resolve([file]);
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          dirReader.readEntries(async (entries) => {
            const results = await Promise.all(
              entries.map((entry) =>
                traverseFileTree(entry, path + item.name + "/")
              )
            );
            resolve(results.flat());
          });
        }
      });
    };

    const entries = Array.from(items).map((item) => item.webkitGetAsEntry());
    const all = await Promise.all(
      entries.map((entry) => traverseFileTree(entry))
    );
    return all.flat();
  };

  const handleUpload = async (files) => {
    if (!files.length) return;

    setMetrics(null);
    setRecentThreats([]);
    setLogicBombStats(null);

    const fileContents = [];

    for (const file of files) {
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "zip") {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        for (const [relativePath, zipEntry] of Object.entries(zipData.files)) {
          if (!zipEntry.dir) {
            const content = await zipEntry.async("text");
            fileContents.push({
              id: generateId(),
              name: zipEntry.name,
              type: getFileLanguage(zipEntry.name),
              content: content,
            });
          }
        }
      } else {
        const content = await readFileContent(file);
        fileContents.push({
          id: generateId(),
          name: file.fullPath || file.webkitRelativePath || file.name,
          type: getFileLanguage(file.name),
          content: content,
        });
      }
    }

    const payload = {
      scan_id: generateId(),
      scan_type: "manual",
      project_id: `logic-bomb-scan-${Date.now()}`,
      project_name: "Logic Bomb Detection Scan",
      timestamp: new Date().toISOString(),
      file_contents: fileContents,
    };

    try {
      setUploading(true);
      const response = await API.post("/api/scan/files", payload);

      // Use scan response for immediate UI update
      const scanData = response.data;
      setMetrics(scanData);

      // Normalize scanData to match dashboard metrics structure
      const normalizedMetrics = {
        ...scanData,
        threat_ratings: scanData.threat_ratings || scanData.summary || {},
        threat_shield:
          scanData.threat_shield || scanData.summary?.threat_shield || {},
        threat_intelligence:
          scanData.threat_intelligence || scanData.summary?.threat_intelligence ||
          {},
        logic_bomb_metrics: scanData.logic_bomb_metrics || {},
        summary: scanData.summary || {},
        scan_info: scanData.scan_info || {},
        // add other fields as needed
      };

      setMetrics(normalizedMetrics);
      localStorage.setItem("tg_metrics", JSON.stringify(normalizedMetrics));

      // Flatten all issues from file_results for use in tables and counts
      const allIssues = [];
      if (scanData.file_results) {
        scanData.file_results.forEach((file) => {
          if (file.issues) allIssues.push(...file.issues);
        });
      }
      setRecentThreats(allIssues);

      // Patch logic bomb stats for summary table
      if (scanData.logic_bomb_metrics) {
        const stats = Object.entries(scanData.logic_bomb_metrics)
          .filter(([k, v]) => v > 0)
          .map(([k, v]) => `${k.replace("_", " ")}: ${v}`);
        setLogicBombStats({ count: stats.length, details: stats });
      } else {
        setLogicBombStats(null);
        localStorage.removeItem("tg_logic_bomb_stats");
      }

      // Save to localStorage
      localStorage.setItem("tg_metrics", JSON.stringify(scanData));
      localStorage.setItem("tg_recent_threats", JSON.stringify(allIssues));

      showToast(
        `Logic bomb scan completed! Found ${allIssues.length} threats. Risk Score: ${
          scanData.logic_bomb_metrics?.logic_bomb_risk_score || 0
        }/100`,
        allIssues.length > 0 ? "warning" : "success"
      );

      // Optionally, refresh dashboard metrics after a short delay
      // setTimeout(fetchMetrics, 2000);
      fetchHealth();
    } catch (err) {
      console.error(err);
      showToast("Logic bomb scan failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const readFileContent = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const generateId = () => "id_" + Math.random().toString(36).substr(2, 9);

  const getFileLanguage = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    const map = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      sql: "sql",
      cpp: "cpp",
      cs: "csharp",
      rb: "ruby",
      php: "php",
      go: "golang",
      rs: "rust",
      c: "c",
    };
    return map[ext] || "unknown";
  };

  const showToast = (message, type) => {
    const toastEl = document.getElementById(`${type}Toast`);
    if (toastEl) {
      toastEl.querySelector(".toast-body").textContent = message;
      new Toast(toastEl).show();
    }
  };

  const timeAgo = (isoTime) => {
    const diffMs = Date.now() - new Date(isoTime).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1 minute ago";
    return `${diffMin} minutes ago`;
  };

  const downloadThreatPrompts = async () => {
    try {
      const res = await API.get("/api/threat-prompts/download", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "threatguard_prompts.zip";
      link.click();
    } catch (err) {
      console.error("Failed to download prompts:", err);
      showToast("Failed to download threat prompts.", "error");
    }
  };

  // if (!metrics)
  //   return <p className="text-center mt-5">Loading ThreatGuard metrics...</p>;

  const {
    threat_ratings,
    scan_info,
    threat_shield,
    threats,
    threat_intelligence,
  } = metrics || {};

  // Calculate scan date and time
  const scanDateTime = scan_info?.scan_date
    ? new Date(scan_info.scan_date)
    : new Date();
  const scanDate = scanDateTime.toLocaleDateString();
  const scanTime = scanDateTime.toLocaleTimeString();

  const summary = metrics?.summary || {};
  const threatInt = metrics?.threat_intelligence || {};
  const logicBombMetrics = metrics?.logic_bomb_metrics || {};
  const threatShield = metrics?.threat_shield || {};

  const detectionMetricCards = [
    {
      label: "Logic Bomb Risk Score",
      value: `${
        summary.logic_bomb_risk_score ??
        threat_ratings?.logic_bomb_risk_score ??
        0
      }/100`,
      className:
        (summary.logic_bomb_risk_score ??
          threat_ratings?.logic_bomb_risk_score ??
          0) >= 70
          ? "text-danger"
          : (summary.logic_bomb_risk_score ??
              threat_ratings?.logic_bomb_risk_score ??
              0) >= 40
          ? "text-warning"
          : "text-success",
    },
    {
      label: "Threat Exposure Level",
      value: summary.threat_level || threatInt.threat_level || "MINIMAL",
      className:
        (summary.threat_level || threatInt.threat_level) === "CRITICAL"
          ? "text-danger"
          : (summary.threat_level || threatInt.threat_level) === "HIGH"
          ? "text-warning"
          : "text-success",
    },
    {
      label: "Critical Logic Bombs",
      value: threatInt.critical_bombs ?? summary.critical_threats ?? 0,
      className: "text-danger",
    },
    {
      label: "Threat Shield Status",
      value: threatShield.status || "UNKNOWN",
      className:
        threatShield.status === "PROTECTED"
          ? "text-success"
          : threatShield.status === "BLOCKED"
          ? "text-danger"
          : "text-warning",
    },
  ];

  return (
    <div
      className="container-fluid mt-4 px-5"
      style={{ background: "#fff", color: "#222" }}
    >
      {!metrics && (
        <div className="alert alert-warning mt-3">
          ⚠️ Metrics not loaded. Please upload a scan file to begin.
        </div>
      )}
      <div
        className="container-fluid mt-4 px-5"
        style={{ background: "#fff", color: "#222" }}
      >
        {/* System Status Header */}
        {health && (
          <div
            className={`alert ${
              health.status === "healthy" ? "alert-success" : "alert-danger"
            } mb-4`}
            style={{
              background: "#f8f9fa",
              border: "1px solid #d1d5db",
              color: health.status === "healthy" ? "#198754" : "#dc3545",
            }}
          >
            {health.status === "healthy"
              ? `🛡️ ThreatGuard Pro operational. Logic bomb detection active. Last scan: ${timeAgo(
                  health.timestamp
                )}.`
              : `⚠️ ThreatGuard Pro experiencing issues. Last checked: ${timeAgo(
                  health.timestamp
                )}.`}
          </div>
        )}

        {/* Quick Logic Bomb Scan */}
        <div
          className="card mb-5 shadow"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{
              background: "#f8f9fa",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h5 className="mb-0" style={{ color: "#222" }}>
              <i className="bi bi-shield-exclamation"></i> Logic Bomb Detection
              Scanner
            </h5>
            <div>
              <span className="badge bg-secondary me-2">THREAT FOCUSED</span>
              <button className="btn btn-outline-secondary btn-sm">
                ⚙️ Advanced Detection
              </button>
            </div>
          </div>
          <div
            className="card-body upload-area"
            style={{
              background: "#f8f9fa",
              border: "1px dashed #b0b0b0",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <input
              type="file"
              id="fileInput"
              hidden
              multiple
              webkitdirectory="true"
              mozdirectory="true"
              directory="true"
              onChange={handleFileSelect}
            />
            <div className="mb-3">
              <i
                className="bi bi-shield-exclamation"
                style={{ fontSize: "3rem", color: "#0d6efd" }}
              ></i>
              <h5 className="mt-3" style={{ color: "#222" }}>
                Drop your source code for instant logic bomb detection
              </h5>
              <small style={{ color: "#666" }}>
                Specialized detection for Scheduled Threat, Targeted Attack,
                Execution Trigger & destructive payloads
              </small>
            </div>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button
                className="btn btn-primary"
                onClick={() => document.getElementById("fileInput").click()}
                disabled={uploading}
              >
                {uploading
                  ? "🔍 Scanning for Logic Bombs..."
                  : "🎯 Scan for Logic Bombs"}
              </button>
              <button className="btn btn-outline-secondary">
                🧪 Try Sample Threats
              </button>
            </div>
          </div>
        </div>

        {/* Project & Scan Info */}
        {metrics && (
          <>
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.files_scanned ?? metrics.file_results?.length ?? 0}
                  </div>
                  <div className="metric-label">Files Scanned</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.lines_of_code?.toLocaleString() ?? 0}
                  </div>
                  <div className="metric-label">Lines of Code</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.coverage ?? 0}%
                  </div>
                  <div className="metric-label">Coverage</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.duplications ?? 0}%
                  </div>
                  <div className="metric-label">Duplications</div>
                </div>
              </div>
            </div>
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.security_rating ?? "-"}
                  </div>
                  <div className="metric-label">Security Rating</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.reliability_rating ?? "-"}
                  </div>
                  <div className="metric-label">Reliability Rating</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.maintainability_rating ?? "-"}
                  </div>
                  <div className="metric-label">Maintainability</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="metric-card text-center">
                  <div className="metric-value">
                    {metrics.metrics?.technical_debt_hours ?? 0}h
                  </div>
                  <div className="metric-label">Technical Debt</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quality Gate */}
        {metrics && (
  <div className="mb-4">
    <span
      className={`badge ${
        metrics.summary?.quality_gate_passed ? "bg-success" : "bg-danger"
      }`}
    >
      Quality Gate:{" "}
      {metrics.summary?.quality_gate_passed ? "PASSED" : "FAILED"}
    </span>
  </div>
)}

        {/* Threat Distribution by Type */}
     {metrics?.threat_intelligence?.threat_distribution && (
  <div className="mb-4">
    <h5 style={{ color: "#0d6efd" }}>Threat Distribution by Type</h5>
    <ul>
      {Object.entries(metrics.threat_intelligence.threat_distribution).map(
        ([type, count]) => (
          <li key={type}>
            <strong>{type.replace(/_/g, " ")}:</strong> {count}
          </li>
        )
      )}
    </ul>
  </div>
)}

        {/* Issue Breakdown */}
        {metrics?.issue_breakdown != null &&  (
          <div className="mb-4">
            <h5 style={{ color: "#0d6efd" }}>Issue Breakdown</h5>
            <div className="row">
              <div className="col-md-4">
                <h6>By File</h6>
                <ul>
                  {Object.entries(metrics.issue_breakdown.by_file || {}).map(
                    ([file, count]) => (
                      <li key={file}>
                        {file}: {count}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="col-md-4">
                <h6>By Severity</h6>
                <ul>
                  {Object.entries(metrics.issue_breakdown.by_severity || {}).map(
                    ([sev, count]) => (
                      <li key={sev}>
                        {sev}: {count}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="col-md-4">
                <h6>By Type</h6>
                <ul>
                  {Object.entries(metrics.issue_breakdown.by_type || {}).map(
                    ([type, count]) => (
                      <li key={type}>
                        {type.replace(/_/g, " ")}: {count}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Per-File Scan Results */}
        {Array.isArray(metrics?.file_results) && metrics.file_results.length > 0 && (
          <div className="mb-4">
            <h5 style={{ color: "#0d6efd" }}>Per-File Scan Results</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Lines</th>
                    <th>Threat Level</th>
                    <th>Critical Threats</th>
                    <th>Issues</th>
                    <th>Logic Bombs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.file_results.map((file) => (
                    <tr key={file.file_id}>
                      <td>{file.file_name}</td>
                      <td>{file.file_type}</td>
                      <td>{file.lines_scanned}</td>
                      <td>{file.threat_level}</td>
                      <td>{file.critical_threats}</td>
                      <td>{file.issues_count}</td>
                      <td>{file.logic_bomb_count}</td>
                      <td>{file.scan_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1055 }}
        >
          <div
            id="successToast"
            className="toast align-items-center text-white bg-success border-0"
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">
                ✅ Operation completed successfully!
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"
              ></button>
            </div>
          </div>
          <div
            id="warningToast"
            className="toast align-items-center text-white bg-warning border-0"
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">⚠️ Logic bombs detected!</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"
              ></button>
            </div>
          </div>
          <div
            id="errorToast"
            className="toast align-items-center text-white bg-danger border-0"
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">
                ❌ Operation failed. Please try again.
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"
              ></button>
            </div>
          </div>
        </div>

        {/* Logic Bomb Stats */}
        {logicBombStats?.details?.length > 0 && (
          <div
            className="section mt-5"
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              padding: "1.5rem",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="mb-0" style={{ color: "#0d6efd" }}>
                🚨 Logic Bomb Patterns Detected
              </h2>
            </div>
            <div className="table-responsive w-100">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ color: "#0d6efd" }}>Threat Type</th>
                    <th style={{ color: "#0d6efd" }}>Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {logicBombStats.details.map((entry, idx) => {
                    const [type, count] = entry.split(":");
                    return (
                      <tr key={idx}>
                        <td className="fw-bold" style={{ color: "#dc3545" }}>
                          {type.trim()}
                        </td>
                        <td style={{ color: "#222" }}>{count.trim()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enhanced Scan Information */}
        <div
          className="mb-4 p-3"
          style={{
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ color: "#0d6efd" }}>📊 Latest Scan Information</h3>
          <div className="row">
            <div className="col-md-3">
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#222",
                }}
              >
                {scan_info?.project_id || "No scan data"}
              </div>
              <div style={{ color: "#888" }}>Project ID</div>
            </div>
            <div className="col-md-3">
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#222",
                }}
              >
                {scanDate}
              </div>
              <div style={{ color: "#888" }}>Scan Date</div>
            </div>
            <div className="col-md-3">
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#222",
                }}
              >
                {scanTime}
              </div>
              <div style={{ color: "#888" }}>Scan Time</div>
            </div>
            <div className="col-md-3">
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#0d6efd",
                }}
              >
                {scan_info?.duration_ms ? `${scan_info.duration_ms}ms` : "0ms"}
              </div>
              <div style={{ color: "#888" }}>Duration</div>
            </div>
          </div>
        </div>

        <h2 className="mb-4" style={{ color: "#0d6efd" }}>
          🛡️ Logic Bomb Detection Metrics
        </h2>
        <div className="row g-4 mb-4">
          {detectionMetricCards.map((item, i) => (
            <div className="col-md-3" key={i}>
              <div
                className="metric-card text-center"
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  color: "#222",
                  padding: "1.5rem",
                  borderRadius: "8px",
                }}
              >
                <div
                  className={`metric-value ${item.className}`}
                  style={{ fontSize: "2.5rem", fontWeight: "bold" }}
                >
                  {item.value}
                </div>
                <div className="metric-label" style={{ color: "#888" }}>
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logic Bomb Pattern Breakdown */}
{metrics?.logic_bomb_metrics && (
  <div className="row g-4 mb-5">
    {[
      {
        label: "Scheduled Threat",
        value: metrics.logic_bomb_metrics?.SCHEDULED_THREAT || 0,
        description: "Date/time triggered threats",
        color: "#dc3545",
      },
      {
        label: "Targeted Attack",
        value: metrics.logic_bomb_metrics?.TARGETED_ATTACK || 0,
        description: "User-targeted attacks",
        color: "#0d6efd",
      },
      {
        label: "Execution Trigger",
        value: metrics.logic_bomb_metrics?.EXECUTION_TRIGGER || 0,
        description: "Execution-based triggers",
        color: "#198754",
      },
      {
        label: "Destructive Payloads",
        value: metrics.logic_bomb_metrics?.DESTRUCTIVE_PAYLOAD || 0,
        description: "Direct destructive actions",
        color: "#fd7e14",
      },
    ].map((item, i) => (
      <div className="col-md-3" key={i}>
        <div
          className="metric-card text-center"
          style={{
            background: "#f8f9fa",
            border: `1px solid ${item.color}`,
            color: "#222",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <div
            className="metric-value"
            style={{ fontSize: "2rem", color: item.color }}
          >
            {item.value}
          </div>
          <div
            className="metric-label"
            style={{ color: "#222", fontWeight: "bold" }}
          >
            {item.label}
          </div>
          <div
            style={{
              color: "#888",
              fontSize: "0.8rem",
              marginTop: "0.5rem",
            }}
          >
            {item.description}
          </div>
        </div>
      </div>
    ))}
  </div>
)}

        {/* Advanced Logic Bomb Metrics */}
        {/* Advanced Logic Bomb Metrics */}
{metrics?.logic_bomb_metrics && (
  <div className="row g-4 mb-5">
    {[
      {
        label: "Trigger Complexity",
        value: `${Math.round(
          metrics.logic_bomb_metrics?.trigger_complexity_score ??
          metrics?.trigger_complexity_score ??
          0
        )}%`,
        description: "Sophistication of trigger mechanisms",
      },
      {
        label: "Payload Severity",
        value: `${Math.round(
          metrics.logic_bomb_metrics?.payload_severity_score ??
          metrics?.payload_severity_score ??
          0
        )}%`,
        description: "Potential damage assessment",
      },
      {
        label: "Detection Confidence",
        value: `${Math.round(
          (metrics.logic_bomb_metrics?.detection_confidence_avg ??
            metrics?.detection_confidence_avg ??
            0) * 100
        )}%`,
        description: "Average detection confidence",
      },
      {
        label: "Threat Density",
        value: `${(
          metrics.logic_bomb_metrics?.threat_density ??
          metrics?.threat_density ??
          0
        ).toFixed(1)}/1K`,
        description: "Logic bombs per 1000 lines",
      },
    ].map((item, i) => (
      <div className="col-md-3" key={i}>
        <div
          className="metric-card text-center"
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            color: "#222",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <div
            className="metric-value"
            style={{ fontSize: "1.8rem", color: "#0d6efd" }}
          >
            {item.value}
          </div>
          <div
            className="metric-label"
            style={{
              color: "#222",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              color: "#888",
              fontSize: "0.75rem",
              marginTop: "0.3rem",
            }}
          >
            {item.description}
          </div>
        </div>
      </div>
    ))}
  </div>
)}

        {/* Enhanced Threat Intelligence Summary */}
        {threat_intelligence && (
          <div
            className="mb-5"
            style={{
              background: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ color: "#0d6efd" }}>
              🧠 Current Threat Intelligence Assessment
            </h3>
            <div className="row">
              <div className="col-md-4">
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color:
                      threat_intelligence.threat_level === "CRITICAL"
                        ? "#dc3545"
                        : threat_intelligence.threat_level === "HIGH"
                        ? "#fd7e14"
                        : "#198754",
                  }}
                >
                  {threat_intelligence.threat_level}
                </div>
                <div style={{ color: "#888" }}>Current Threat Level</div>
              </div>
              <div className="col-md-4">
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#0d6efd",
                  }}
                >
                  {Math.round(
                    metrics.logic_bomb_metrics?.neutralization_urgency_hours ||
                      0
                  )}
                  h
                </div>
                <div style={{ color: "#888" }}>Neutralization Urgency</div>
              </div>
              <div className="col-md-4">
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color:
                      threat_shield?.protection_effectiveness >= 80
                        ? "#198754"
                        : threat_shield?.protection_effectiveness >= 60
                        ? "#fd7e14"
                        : "#dc3545",
                  }}
                >
                  {Math.round(threat_shield?.protection_effectiveness || 0)}%
                </div>
                <div style={{ color: "#888" }}>Shield Effectiveness</div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-12">
                <h5 style={{ color: "#0d6efd", marginBottom: "1rem" }}>
                  🚨 Immediate Actions Required:
                </h5>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {(
                    metrics.threat_analysis?.recommended_actions ||
                    threat_intelligence.recommendations ||
                    []
                  )
                    .slice(0, 3)
                    .map((rec, idx) => (
                      <li
                        key={idx}
                        style={{
                          padding: "0.7rem",
                          borderLeft: "4px solid #dc3545",
                          paddingLeft: "1rem",
                          margin: "0.5rem 0",
                          background: "#fff",
                          color: "#222",
                          borderRadius: "4px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <strong style={{ color: "#dc3545" }}>ACTION:</strong>{" "}
                        {rec}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Threat Tabs */}
        <ul
          className="nav nav-tabs mb-3"
          style={{ borderBottom: "2px solid #e5e7eb" }}
        >
          <li className="nav-item">
            <button
              className={`nav-link ${
                activeTab === "logicbombs" ? "active" : ""
              }`}
              onClick={() => setActiveTab("logicbombs")}
              style={{
                color: activeTab === "logicbombs" ? "#0d6efd" : "#888",
                background:
                  activeTab === "logicbombs" ? "#f8f9fa" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === "logicbombs"
                    ? "3px solid #0d6efd"
                    : "3px solid transparent",
              }}
            >
              🚨 Logic Bomb Threats
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "other" ? "active" : ""}`}
              onClick={() => setActiveTab("other")}
              style={{
                color: activeTab === "other" ? "#0d6efd" : "#888",
                background: activeTab === "other" ? "#f8f9fa" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === "other"
                    ? "3px solid #0d6efd"
                    : "3px solid transparent",
              }}
            >
              📄 Other Security Issues
            </button>
          </li>
        </ul>

        {/* Threat Analysis Table */}
        <div
          className="section"
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0" style={{ color: "#0d6efd" }}>
              {activeTab === "logicbombs"
                ? "🚨 Logic Bomb Threats"
                : "📄 Other Security Issues"}
            </h2>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={downloadThreatPrompts}
              style={{ borderColor: "#0d6efd", color: "#0d6efd" }}
            >
              🤖 Download AI Prompts
            </button>
          </div>

          <div className="table-responsive w-100">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr className="text-center">
                  <th style={{ color: "#0d6efd" }}>Threat Level</th>
                  <th style={{ color: "#0d6efd" }}>Type</th>
                  {/* <th style={{ color: "#0d6efd" }}>Rule</th> */}
                  <th style={{ color: "#0d6efd" }}>File Name</th>
                  <th style={{ color: "#0d6efd" }}>Line #</th>
                  <th style={{ color: "#0d6efd" }}>Code Snippet</th>
                  <th style={{ color: "#0d6efd" }}>Trigger Analysis</th>
                  <th style={{ color: "#0d6efd" }}>Payload Risk</th>
                  <th style={{ color: "#0d6efd" }}>Neutralization</th>
                  <th className="text-center" style={{ color: "#0d6efd" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {(activeTab === "logicbombs" ? logicBombThreats : otherThreats)
                  .length > 0 ? (
                  (activeTab === "logicbombs"
                    ? logicBombThreats
                    : otherThreats
                  ).map((threat) => (
                    <tr key={threat.id}>
                      <td>
                        <span
                          className={`badge ${
                            threat.severity === "CRITICAL_BOMB"
                              ? "bg-danger"
                              : threat.severity === "HIGH_RISK"
                              ? "bg-warning"
                              : threat.severity === "MEDIUM_RISK"
                              ? "bg-info"
                              : "bg-secondary"
                          }`}
                          style={{ fontSize: "0.8rem", fontWeight: "bold" }}
                        >
                          {threat.severity}
                        </span>
                      </td>
                      <td style={{ color: "#222" }}>{threat.type}</td>
                      {/* <td style={{ color: "#888", fontSize: "0.9rem" }}>
                        {threat.rule_id}
                      </td> */}
                      <td
                        style={{
                          wordBreak: "break-all",
                          color: "#222",
                          maxWidth: "300px",
                          whiteSpace: "normal",
                          overflow: "auto",
                        }}
                      >
                        {threat.file_name?.split("/").pop() || threat.file_name}
                      </td>
                      <td style={{ color: "#555" }}>{threat.line_number}</td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          color: "#333",
                        }}
                      >
                        {threat.code_snippet}
                      </td>

                      {/* <td className="text-center" style={{ color: "#0d6efd" }}>
                        {threat.line_number}
                      </td> */}
                      <td
                        style={{
                          whiteSpace: "pre-wrap",
                          color: "#fd7e14",
                          fontSize: "0.85rem",
                        }}
                      >
                        {threat.trigger_analysis ||
                          "Conditional trigger detected"}
                      </td>
                      <td
                        style={{
                          whiteSpace: "pre-wrap",
                          color: "#dc3545",
                          fontSize: "0.85rem",
                        }}
                      >
                        {threat.payload_analysis || "Potential system impact"}
                      </td>
                      <td
                        style={{
                          whiteSpace: "pre-wrap",
                          color: "#198754",
                          fontSize: "0.85rem",
                          maxWidth: "200px",
                        }}
                      >
                        {threat.suggested_fix || "Neutralization guide pending"}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-danger"
                            style={{
                              color: "white",
                              border: "none",
                            }}
                            onClick={() => neutralizeThreat(threat.id)}
                          >
                            Neutralize
                          </button>
                          <button className="btn btn-sm btn-outline-secondary">
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center"
                      style={{ color: "#888" }}
                    >
                      No{" "}
                      {activeTab === "logicbombs"
                        ? "logic bomb threats"
                        : "other security issues"}{" "}
                      found.
                      {activeTab === "logicbombs" &&
                        " 🛡️ Your code appears to be clean of logic bombs!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threat Statistics */}
        {recentThreats.length > 0 && (
          <div className="row g-4 mt-4">
            <div className="col-md-6">
              <div
                className="card"
                style={{ background: "#fff", border: "1px solid #e5e7eb" }}
              >
                <div
                  className="card-header"
                  style={{
                    background: "#f8f9fa",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h5 style={{ color: "#0d6efd" }}>🎯 Threat Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Logic Bomb Threats</span>
                      <span className="badge bg-danger">
                        {logicBombThreats.length}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Other Security Issues</span>
                      <span className="badge bg-warning">
                        {otherThreats.length}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Logic Bomb Risk Score</span>
                      <span
                        className={`badge ${
                          (summary.logic_bomb_risk_score ??
                            threat_ratings?.logic_bomb_risk_score ??
                            0) >= 70
                            ? "bg-danger"
                            : (summary.logic_bomb_risk_score ??
                                threat_ratings?.logic_bomb_risk_score ??
                                0) >= 40
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                      >
                        {summary.logic_bomb_risk_score ??
                          threat_ratings?.logic_bomb_risk_score ??
                          0}
                        /100
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Threat Density</span>
                      <span className="badge bg-info">
                        {(
                          metrics.logic_bomb_metrics?.threat_density || 0
                        ).toFixed(1)}
                        /1K lines
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Critical Bomb Ratio</span>
                      <span
                        className={`badge ${
                          metrics.logic_bomb_metrics?.critical_bomb_ratio >= 50
                            ? "bg-danger"
                            : metrics.logic_bomb_metrics?.critical_bomb_ratio >=
                              25
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                      >
                        {Math.round(
                          metrics.logic_bomb_metrics?.critical_bomb_ratio || 0
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="card"
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  color: "#222",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    background: "#f8f9fa",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <h5 style={{ color: "#0d6efd" }}>🛡️ Protection Status</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Threat Shield</span>
                      <span
                        className={`badge ${
                          threat_shield?.status === "PROTECTED"
                            ? "bg-success"
                            : threat_shield?.status === "BLOCKED"
                            ? "bg-danger"
                            : "bg-warning"
                        }`}
                      >
                        {threat_shield?.status || "UNKNOWN"}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Detection Engine</span>
                      <span className="badge bg-success">ACTIVE</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>AI Analysis</span>
                      <span className="badge bg-info">ENABLED</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Shield Effectiveness</span>
                      <span
                        className={`badge ${
                          threat_shield?.protection_effectiveness >= 80
                            ? "bg-success"
                            : threat_shield?.protection_effectiveness >= 60
                            ? "bg-warning"
                            : "bg-danger"
                        }`}
                      >
                        {Math.round(
                          threat_shield?.protection_effectiveness || 0
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Information Footer */}
        <div
          className="mt-5 pt-4"
          style={{
            borderTop: "1px solid #e5e7eb",
            color: "#888",
            fontSize: "0.9rem",
          }}
        >
          <div className="row">
            <div className="col-md-6">
              <strong style={{ color: "#0d6efd" }}>ThreatGuard Pro</strong> -
              Advanced Logic Bomb Detection System
              <br />
              Specialized in Scheduled Threat, Targeted Attack, Execution
              Trigger & destructive payloads
            </div>
            <div className="col-md-6 text-end">
              Last Update: {new Date().toLocaleString()}
              <br />
              System Status:{" "}
              <span style={{ color: "#198754" }}>🟢 Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatGuardDashboard;
