import React, { useState } from 'react';
import API from '../api'; // ✅ Import your centralized Axios instance

export default function FileUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return alert('Please select files to scan.');

    const fileContents = await Promise.all(
      selectedFiles.map(async (file) => {
        const content = await readFileContent(file);
        return {
          id: generateId(),
          name: file.name,
          type: getFileLanguage(file.name),
          content: content,
        };
      })
    );

    const payload = {
      scan_id: generateId(),
      scan_type: 'manual',
      project_id: `upload-scan-${Date.now()}`,
      project_name: 'Quick Security Scan',
      timestamp: new Date().toISOString(),
      file_contents: fileContents
    };

    try {
      setUploading(true);
      const res = await API.post('/api/scan/files', payload); // ✅ Axios call using baseURL
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
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

  const generateId = () => 'id_' + Math.random().toString(36).substr(2, 9);

  const getFileLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      py: 'python', js: 'javascript', ts: 'typescript', java: 'java',
      html: 'html', css: 'css', json: 'json', xml: 'xml', sql: 'sql',
    };
    return map[ext] || 'unknown';
  };

  return (
    <div className="card p-4 shadow-sm">
      <h5>Quick Security Scan</h5>
      <input type="file" multiple onChange={handleFileChange} className="form-control mt-3" />
      <button className="btn btn-primary mt-3" onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Scanning...' : 'Start Scan'}
      </button>
    </div>
  );
}
