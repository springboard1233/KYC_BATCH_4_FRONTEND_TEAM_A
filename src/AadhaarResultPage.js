import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AadhaarResultPage() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [extractSuccess, setExtractSuccess] = useState(false);

  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState(null);

  // Add configurable API base (set REACT_APP_API_BASE in .env if your backend runs on another origin/port)
  // default to the backend you specified
  const API_BASE = ((process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) || 'http://127.0.0.1:8000').replace(/\/$/, ''); // e.g. http://127.0.0.1:8000

  // handle file selection and preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch {
        setPreviewUrl(null);
      }
      setExtractError(null);
      setExtractedData(null);
      setExtractSuccess(false);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // upload image to backend and fetch extracted details
  const handleUploadAndExtract = async () => {
    if (!selectedFile) {
      setExtractError('Please select an image to upload.');
      return;
    }
    setIsExtracting(true);
    setExtractError(null);
    setExtractedData(null);
    setExtractSuccess(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Use configured base or relative path if empty
      const endpoint = `${API_BASE || ''}/api/extract-aadhaar`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        // try to get text and strip HTML tags for a friendly message
        const text = await res.text().catch(() => null);
        const plain = text ? text.replace(/<[^>]*>/g, '').trim() : null;
        // helpful hint when backend not found or wrong path
        let message = plain || `Server returned ${res.status}`;
        if (res.status === 404 || /cannot post/i.test(message)) {
          message = `Extraction endpoint not found at ${endpoint}. Start/point your backend there or set REACT_APP_API_BASE. (${message})`;
        }
        throw new Error(message);
      }

      // try to parse JSON safely
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error('Server did not return valid JSON.');
      }

      // Accept multiple shapes: json.data, json.result, json.extracted or top-level fields
      const maybe = json?.data || json?.result || json?.extracted || json;
      // minimal validation: check for at least one expected field
      const hasField = maybe && (maybe.name || maybe.dob || maybe.gender || maybe.aadhaarNo || maybe.address);
      if (!hasField) {
        const message = json?.message || 'No extracted data returned from server.';
        throw new Error(message);
      }

      setExtractedData({
        name: maybe.name || '',
        dob: maybe.dob || '',
        gender: maybe.gender || '',
        aadhaarNo: maybe.aadhaarNo || maybe.aadhar || maybe.aadhaar_number || maybe.aadhaarNumber || '',
        // normalize father name from common possible keys
        fatherName: maybe.fatherName || maybe.father_name || maybe.father || maybe.fathersName || maybe.fathername || '',
        address: maybe.address || ''
      });
      setExtractSuccess(true);
    } catch (err) {
      setExtractError(err?.message || 'Extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      const info = {
        id: `KYC-${Date.now()}`,
        time: new Date().toLocaleString()
      };
      setVerificationInfo(info);
      setIsConfirming(false);
      setShowSuccess(true);
    }, 1500);
  };

  const handleReupload = () => {
    // go back to dashboard or reset as desired
    navigate('/dashboard');
  };

  const handleDownloadReceipt = () => {
    if (!verificationInfo || !extractedData) return;
    const content = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Verification Receipt - ${verificationInfo.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { color: #0f172a; }
            .meta { margin-top: 12px; color: #334155; }
            .section { margin-top: 18px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: 700; color: #0f172a; display:inline-block; width:160px; }
            .value { color:#0f172a; }
          </style>
        </head>
        <body>
          <h1>Verification Receipt</h1>
          <div class="meta">
            Reference ID: <strong>${verificationInfo.id}</strong><br />
            Verified At: <strong>${verificationInfo.time}</strong>
          </div>

          <div class="section">
            <div class="field"><span class="label">Full Name:</span> <span class="value">${extractedData.name || ''}</span></div>
+           <div class="field"><span class="label">Father's Name:</span> <span class="value">${extractedData.fatherName || extractedData.father || ''}</span></div>
            <div class="field"><span class="label">Date of Birth:</span> <span class="value">${extractedData.dob || ''}</span></div>
            <div class="field"><span class="label">Gender:</span> <span class="value">${extractedData.gender || ''}</span></div>
            <div class="field"><span class="label">Aadhaar Number:</span> <span class="value">${extractedData.aadhaarNo || ''}</span></div>
            <div class="field"><span class="label">Address:</span> <span class="value">${extractedData.address || ''}</span></div>
          </div>

          <div style="margin-top:24px; color:#475569;">This receipt confirms that the submitted Aadhaar document was verified successfully.</div>
        </body>
      </html>
    `;
    const newWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
      // avoid inline script (CSP) — call print from this script after a short delay
      setTimeout(() => {
        try {
          newWindow.focus();
          newWindow.print();
        } catch (e) {
          // ignore errors (popup blocked, etc.)
        }
      }, 500);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleVerifyAnother = () => {
    setShowSuccess(false);
    setVerificationInfo(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setExtractError(null);
  };

  if (showSuccess && verificationInfo) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background:
            "radial-gradient(circle at 12% 22%, rgba(3,105,161,0.06), transparent 12%), " +
            "radial-gradient(circle at 88% 78%, rgba(8,145,178,0.05), transparent 12%), " +
            "linear-gradient(135deg,#eef9ff 0%, #f8fcfb 66%)"
        }}
      >
        <div className="bg-white rounded-lg shadow p-8 max-w-3xl w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Verification Successful</h2>
              <p className="text-sm text-gray-600">Reference ID: <span className="font-mono text-gray-800">{verificationInfo.id}</span></p>
              <p className="text-sm text-gray-500">Verified at {verificationInfo.time}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-100 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Verified Details</h3>
              <div className="text-sm text-gray-800">
                <div className="mb-2"><strong>Full Name:</strong> {extractedData?.name}</div>
                <div className="mb-2"><strong>Father's Name:</strong> {extractedData?.fatherName ?? extractedData?.father}</div>
                <div className="mb-2"><strong>DOB:</strong> {extractedData?.dob}</div>
                <div className="mb-2"><strong>Gender:</strong> {extractedData?.gender}</div>
                <div className="mb-2"><strong>Aadhaar:</strong> <span className="font-mono">{extractedData?.aadhaarNo}</span></div>
                <div className="mb-2"><strong>Address:</strong> {extractedData?.address}</div>
              </div>
            </div>

            <div className="border border-gray-100 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Steps</h3>
              <p className="text-sm text-gray-600 mb-4">
                The verified record has been saved. You can download a printable receipt for your records or continue to the dashboard.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded font-medium hover:bg-gray-50"
                >
                  Download Receipt / Print
                </button>

                <button
                  onClick={handleContinue}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded font-medium hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>

                <button
                  onClick={handleVerifyAnother}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 py-2 px-3 rounded font-medium hover:bg-gray-100"
                >
                  Verify Another Document
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            If you need to update any details, please contact support or re-upload a corrected document.
          </div>
        </div>
      </div>
    );
  }

  // main upload + review UI
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 12% 22%, rgba(3,105,161,0.06), transparent 12%), " +
          "radial-gradient(circle at 88% 78%, rgba(8,145,178,0.05), transparent 12%), " +
          "linear-gradient(135deg,#eef9ff 0%, #f8fcfb 66%)"
      }}
    >
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Aadhaar KYC Verification</h1>
        <p className="text-gray-600 mb-6 text-center">Upload your Aadhaar image to extract details</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Aadhaar Image</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1"
            />
            <button
              onClick={handleUploadAndExtract}
              disabled={isExtracting || !selectedFile}
              className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isExtracting ? 'Extracting...' : 'Upload & Extract'}
            </button>
          </div>
          {extractError && <p className="text-sm text-red-600 mt-2">{extractError}</p>}
        </div>

        {previewUrl && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <img src={previewUrl} alt="preview" className="max-h-48 object-contain border rounded" />
          </div>
        )}

        {isExtracting && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6 flex items-center">
            <div className="animate-spin mr-2 w-4 h-4 border-b-2 border-yellow-600 rounded-full" />
            <span className="text-yellow-800 text-sm font-medium">Extracting data... please wait</span>
          </div>
        )}

        {extractError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-red-800 text-sm font-medium">Extraction failed: {extractError}</span>
          </div>
        )}

        {extractSuccess && extractedData && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
            <span className="text-green-800 text-sm font-medium">Extraction successful — review the extracted details below</span>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* extracted details area — shows server response */}
          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Full Name:</label>
            <span className="col-span-2 text-gray-900">{extractedData?.name ?? '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Father's Name:</label>
            <span className="col-span-2 text-gray-900">{extractedData?.fatherName ?? extractedData?.father ?? '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Date of Birth:</label>
            <span className="col-span-2 text-gray-900">{extractedData?.dob ?? '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Gender:</label>
            <span className="col-span-2 text-gray-900">{extractedData?.gender ?? '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700">Aadhaar Number:</label>
            <span className="col-span-2 text-gray-900 font-mono tracking-wider">{extractedData?.aadhaarNo ?? '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 py-3">
            <label className="text-sm font-semibold text-gray-700">Address:</label>
            <span className="col-span-2 text-gray-900 leading-relaxed">{extractedData?.address ?? '-'}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            Please verify all details carefully. If any information is incorrect, re-upload a clearer image or contact support.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleReupload}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
          >
            <Upload className="w-5 h-5 mr-2" />
            Re-upload Aadhaar
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirming || !extractedData}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm & Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
