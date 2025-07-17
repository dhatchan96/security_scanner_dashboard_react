import React, { useEffect, useState } from "react";
import API from "../api";
import "../style.css";
import { Toast } from "bootstrap";
import JSZip from "jszip";

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [health, setHealth] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchHealth();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await API.get("/api/dashboard/metrics");
      if (res.data && !res.data.error) {
        setMetrics(res.data);
        setRecentIssues(res.data.recent_issues || []);
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

  const resolveIssue = async (id) => {
    try {
      await API.put(`/api/issues/${id}/status`, { status: "RESOLVED" });
      fetchMetrics();
    } catch (error) {
      console.error("Failed to resolve issue:", error);
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
      project_id: `upload-scan-${Date.now()}`,
      project_name: "Quick Security Scan",
      timestamp: new Date().toISOString(),
      file_contents: fileContents,
    };

    try {
      setUploading(true);
      await API.post("/api/scan/files", payload);
      fetchMetrics();
      fetchHealth();
      const toastEl = document.getElementById("uploadSuccessToast");
      if (toastEl) new Toast(toastEl).show();
    } catch (err) {
      console.error(err);
      const toastEl = document.getElementById("uploadErrorToast");
      if (toastEl) new Toast(toastEl).show();
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
      zip: "zip",
    };
    return map[ext] || "unknown";
  };

  const timeAgo = (isoTime) => {
    const diffMs = Date.now() - new Date(isoTime).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1 minute ago";
    return `${diffMin} minutes ago`;
  };

  if (!metrics) return <p className="text-center mt-5">Loading metrics...</p>;

  const {
    ratings,
    scan_info,
    quality_gate,
    issues,
    metrics: metricData,
  } = metrics;

  return (
    <div className="container-fluid mt-4 px-5">
      {health && (
        <div
          className={`alert ${
            health.status === "healthy" ? "alert-success" : "alert-danger"
          } mb-4`}
        >
          {health.status === "healthy"
            ? `✅ All systems operational. Last scan completed ${timeAgo(
                health.timestamp
              )}.`
            : `⚠️ System is experiencing issues. Last checked ${timeAgo(
                health.timestamp
              )}.`}
        </div>
      )}

      <div className="card mb-5 shadow">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-upload"></i> Quick Security Scan
          </h5>
          <button className="btn btn-secondary btn-sm">
            ⚙️ Advanced Options
          </button>
        </div>
        <div
          className={`card-body text-center bg-light border border-primary rounded ${
            dragOver ? "bg-info" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          style={{ padding: "50px", transition: "background 0.3s ease" }}
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
              className="bi bi-cloud-upload"
              style={{ fontSize: "3rem", color: "#0d6efd" }}
            ></i>
            <h5 className="mt-3">
              Drop your source code files here for instant security analysis
            </h5>
            <small className="text-muted">
              Supports: folders, zip files, or code files
            </small>
          </div>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById("fileInput").click()}
              disabled={uploading}
            >
              {uploading ? "Scanning..." : "📂 Browse Files or Folder"}
            </button>
            <button className="btn btn-outline-secondary">🎯 Try Demo</button>
          </div>
        </div>
      </div>

      <div
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 1055 }}
      >
        <div
          id="uploadSuccessToast"
          className="toast align-items-center text-white bg-success border-0"
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              ✅ File scan completed successfully!
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
            ></button>
          </div>
        </div>
        <div
          id="uploadErrorToast"
          className="toast align-items-center text-white bg-danger border-0"
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              ❌ File scan failed. Please try again.
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
            ></button>
          </div>
        </div>
      </div>

      <h2 className="mb-4">Overview</h2>
      <div className="row g-4 mb-4">
        {[
          {
            label: "Security Rating",
            value: ratings.security,
            className: `rating-${ratings.security}`,
          },
          {
            label: "Reliability Rating",
            value: ratings.reliability,
            className: `rating-${ratings.reliability}`,
          },
          {
            label: "Maintainability Rating",
            value: ratings.maintainability,
            className: `rating-${ratings.maintainability}`,
          },
          {
            label: "Quality Gate",
            value: quality_gate.status,
            className: `quality-gate-${quality_gate.status}`,
          },
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className="metric-card text-center">
              <div className={`metric-value ${item.className}`}>
                {item.value}
              </div>
              <div className="metric-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-5">
        {[
          { label: "Total Issues", value: issues.total },
          { label: "Files Scanned", value: scan_info.files_scanned },
          {
            label: "Lines of Code",
            value: scan_info.lines_of_code.toLocaleString(),
          },
          {
            label: "Technical Debt",
            value: Math.round(metricData.technical_debt / 60) + "h",
          },
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
                <th>Recommendation</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.length > 0 ? (
                recentIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <span className={`severity-${issue.severity}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td>{issue.type}</td>
                    <td>{issue.rule_id}</td>
                    <td style={{ wordBreak: "break-word" }}>
                      {issue.file_path}
                    </td>
                    <td className="text-center">{issue.line_number}</td>
                    <td>{issue.message}</td>
                    <td style={{ whiteSpace: "pre-wrap" }}>
                      {issue.suggested_fix || "—"}
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-primary">
                          Details
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => resolveIssue(issue.id)}
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No issues found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
