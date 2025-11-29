 import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, Loader, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const DocumentVerification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    setExtractedText('');
    setVerificationResult(null);
    extractText(file);
  };

  const extractText = (file) => {
    setIsLoading(true);
    Tesseract.recognize(
      file,
      'eng',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      setExtractedText(text);
      verifyDocument(text);
    }).catch(error => {
      console.error('OCR Error:', error);
      setVerificationResult({
        riskScore: 100,
        riskFactors: ['❌ Failed to process document image'],
        documentType: 'Error',
        documentNumber: 'Not detected'
      });
    }).finally(() => {
      setIsLoading(false);
    });
  };

  // ... (rest of the component code remains the same until the return statement)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Document Verification
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Upload your Aadhaar or PAN card for verification
          </p>
        </div>

        <div 
          className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
            dragActive ? 'ring-2 ring-blue-500 scale-[1.01]' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-50">
              <Upload className="h-12 w-12 text-blue-600" />
            </div>
            <div className="mt-5">
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-1 text-sm text-gray-600">
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, PDF up to 5MB
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3 flex-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-gray-600">Processing your document...</p>
            </div>
          </div>
        )}

        {extractedText && !isLoading && (
          <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Extracted Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-800 overflow-auto max-h-60">
                  {extractedText}
                </pre>
              </div>
            </div>
          </div>
        )}

        {verificationResult && !isLoading && (
          <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Verification Results</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Document Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Type:</span>
                      <span className="font-medium">{verificationResult.documentType}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 w-32">Number:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {verificationResult.documentNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Risk Assessment</h4>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Risk Level</span>
                      <span className={`font-medium ${
                        verificationResult.riskScore <= 30 ? 'text-green-600' :
                        verificationResult.riskScore <= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getRiskLevel(verificationResult.riskScore)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          verificationResult.riskScore <= 30 ? 'bg-green-500' :
                          verificationResult.riskScore <= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${verificationResult.riskScore}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">
                      {verificationResult.riskScore}% risk
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-700 mb-3">Verification Details</h4>
                <ul className="space-y-3">
                  {verificationResult.riskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start">
                      {factor.startsWith('✓') ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : factor.startsWith('⚠️') ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="text-gray-700">{factor.replace(/^[✓⚠️❌]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => {
                    setSelectedFile(null);
                    setExtractedText('');
                    setVerificationResult(null);
                  }}
                >
                  Upload Another
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        )}

        {!verificationResult && !isLoading && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No document uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a document to begin verification
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;