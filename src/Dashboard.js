import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument, getUserDocs } from "./api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [docs, setDocs] = useState([]);
  const [showDocsPanel, setShowDocsPanel] = useState(true);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropRef = useRef(null);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      fetchDocuments(token);
    }
  }, [navigate]);

  const fetchDocuments = async (token) => {
    try {
      const data = await getUserDocs(token);
      const list = data.documents || [];
      // Deduplicate by _id when available, else by filename+docType
      const seen = new Set();
      const deduped = [];
      for (const d of list) {
        const key = d._id ? d._id : `${d.filename || ""}::${d.docType || ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(d);
        }
      }
      setDocs(deduped);
    } catch {
      // ignore silently - docs optional
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setError("");
    setMessage("");
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG or PDF allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large. Max allowed size is 2MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      try {
        setPreviewUrl(URL.createObjectURL(file));
      } catch {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleExtractData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }
    setLoading(true);
    setMessage("Uploading and extracting...");
    setExtractedData(null);
    setError("");
    try {
      const res = await uploadDocument(token, selectedFile);
      // backend returns { message, data }
      setMessage(res?.message || "Uploaded");
      const parsed =
        res?.data?.parsed ||
        res?.data?.parsedData ||
        res?.parsed ||
        null;
      if (parsed) {
        setExtractedData(parsed);
      } else if (res?.data) {
        // try common keys
        const rec = res.data;
        const maybe = rec.parsed || rec.parsedData || rec;
        setExtractedData(maybe || null);
      }
      fetchDocuments(token);
    } catch (err) {
      setError(err?.message || "Upload failed. Check token or file.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 18% 25%, rgba(3,105,161,0.06), transparent 14%), " +
          "radial-gradient(circle at 82% 75%, rgba(6,182,212,0.04), transparent 14%), " +
          "linear-gradient(135deg,#eefbff 0%, #f9fdfa 66%)",
      }}
    >
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white shadow flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 2C8 2 4 6 4 10c0 7 8 12 8 12s8-5 8-12c0-4-4-8-8-8z"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Verification Portal
              </h1>
              <p className="text-sm text-gray-500">
                Upload Aadhaar / PAN to extract identity details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="bg-white border rounded-lg shadow p-6">
          {/* Drag & Drop */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border border-dashed rounded-md p-6 mb-4 text-center cursor-pointer hover:border-gray-400"
            style={{ background: "#fafafa" }}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="fileInput" className="block">
              <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                📁
              </div>
              <div className="text-sm text-gray-700">
                Drag & drop a file here, or{" "}
                <span className="text-blue-600 underline cursor-pointer">
                  browse
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                JPEG, PNG, PDF — max 2MB
              </div>
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}
          {message && !error && (
            <div className="text-sm text-green-600 mb-3">{message}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-3 text-sm text-gray-600">Preview</div>
              <div className="h-56 border rounded flex items-center justify-center bg-gray-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : selectedFile ? (
                  <div className="text-sm text-gray-600">{selectedFile.name}</div>
                ) : (
                  <div className="text-sm text-gray-400">No preview available</div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleExtractData}
                  disabled={loading}
                  className={`flex-1 py-2 rounded text-white ${
                    loading
                      ? "bg-blue-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Processing..." : "Upload & Extract"}
                </button>
                <button
                  onClick={resetSelection}
                  className="py-2 px-3 rounded border hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm text-gray-600">Extracted Details</div>
              <div className="border rounded p-4 min-h-[224px] bg-white">
                {!extractedData ? (
                  <div className="text-sm text-gray-400">
                    No data extracted yet.
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 space-y-2">
                    <div>
                      <strong>Name:</strong> {extractedData.name || "-"}
                    </div>
                    <div>
                      <strong>Father's Name:</strong>{" "}
                      {extractedData.fatherName ||
                        extractedData.father_name ||
                        extractedData.father ||
                        "-"}
                    </div>
                    <div>
                      <strong>DOB:</strong> {extractedData.dob || "-"}
                    </div>
                    <div>
                      <strong>Gender:</strong> {extractedData.gender || "-"}
                    </div>
                    <div>
                      <strong>
                        Aadhaar / PAN:
                      </strong>{" "}
                      {extractedData.aadhaarNumber ||
                        extractedData.panNumber ||
                        extractedData.aadhaar ||
                        extractedData.pan ||
                        "-"}
                    </div>
                    <div>
                      <strong>Address:</strong> {extractedData.address || "-"}
                    </div>

                    <details className="mt-2 text-xs text-gray-500">
                      <summary className="cursor-pointer">
                        Raw parsed JSON
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(extractedData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Uploaded docs list (deduped). show/hide + clear controls */}
        {docs.length > 0 && showDocsPanel && (
          <section className="mt-4 bg-white border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-700">Uploaded documents</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchDocuments(localStorage.getItem("token"))}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowDocsPanel(false)}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Hide
                </button>
                <button
                  onClick={() => setDocs([])}
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-auto">
              {docs.map((d) => (
                <li key={d._id || `${d.filename}::${d.docType}`} className="flex justify-between">
                  <span>{d.filename}</span>
                  <span className="text-xs text-gray-400">{d.docType}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* Show toggle when hidden */}
        {docs.length > 0 && !showDocsPanel && (
          <div className="mt-4">
            <button
              onClick={() => setShowDocsPanel(true)}
              className="text-sm text-blue-600 underline"
            >
              Show uploaded documents
            </button>
            <button
              onClick={() => setDocs([])}
              className="ml-3 text-sm text-gray-600 underline"
            >
              Clear list
            </button>
          </div>
        )
        }
      </div>
    </div>
  );
}
