// components/ThreadDemo.js
import React, { useState } from "react";
import API from "../api";
import JSZip from "jszip";
import { Toast } from "bootstrap";

export default function ThreadDemo() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    const all = await Promise.all(entries.map((entry) => traverseFileTree(entry)));
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
      project_id: `thread-demo-${Date.now()}`,
      project_name: "Thread Demo Scan",
      timestamp: new Date().toISOString(),
      file_contents: fileContents,
    };

    try {
      setUploading(true);
      await API.post("/api/scan/files", payload);
      alert("✅ File scanned successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Scan failed");
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

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">Thread Demo: Drag & Drop Scan</h2>
      <div
        className={`card p-5 border border-primary ${dragOver ? "bg-info bg-opacity-25" : "bg-light"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        style={{ transition: "background 0.3s ease" }}
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
        <div className="text-center">
          <i className="bi bi-cloud-upload" style={{ fontSize: "3rem", color: "#0d6efd" }}></i>
          <h5 className="mt-3">Drop source files or folders to scan</h5>
          <small className="text-muted">Supports zip files and folders</small>
          <div className="mt-4">
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById("fileInput").click()}
              disabled={uploading}
            >
              {uploading ? "Scanning..." : "📂 Browse Files or Folder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
