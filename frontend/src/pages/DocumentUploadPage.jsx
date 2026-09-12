import React, { useState, useEffect } from 'react';
import { docApi } from '../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileSearch,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const DOC_TYPES = [
  'Aadhaar Card',
  'Income Certificate',
  'Caste Certificate',
  'Residence Certificate',
  'PAN Card',
  'Ration Card (BPL/AAY)',
  'Disability Certificate',
  'Student ID / Bonafide',
  'Land Record (Khatauni)',
  'Other Certificate',
];

export default function DocumentUploadPage({ setActiveTab, onSelectDocForAnalysis, showToast }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Aadhaar Card');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await docApi.list();
      setDocuments(docs || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load documents list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

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
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file to upload', 'warning');
      return;
    }

    setUploading(true);
    try {
      const result = await docApi.upload(selectedFile, docType);
      showToast(`Document uploaded and analyzed successfully!`, 'success');
      setSelectedFile(null);
      await loadDocuments();

      // Automatically offer to view the analysis
      onSelectDocForAnalysis(result.id);
      setActiveTab('doc-analysis');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await docApi.delete(docId);
      showToast('Document deleted', 'info');
      loadDocuments();
    } catch (err) {
      showToast('Failed to delete document', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">
              Document Upload & OCR Intelligence
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
              Instant OCR Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload certificates in PDF or image format (PNG, JPG). Our OCR model extracts your credentials to verify scheme criteria automatically.
          </p>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document Category *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Select document type for tailored regex & OCR field parsing.
              </p>
            </div>

            {/* Dropzone */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attach File (PDF, PNG, JPG - Max 10MB) *
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                }`}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports Aadhaar, Income, Caste, Domicile, Marksheets
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{uploading ? 'Extracting & Validating OCR...' : 'Upload & Run Document AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Document Vault</h2>
            <p className="text-xs text-slate-500">
              {documents.length} verified government certificate(s) on record
            </p>
          </div>
          <button
            onClick={loadDocuments}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">No documents uploaded yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload your Aadhaar, Income Certificate, or Caste Certificate above to begin OCR verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {doc.doc_type}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        doc.is_verified
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {doc.is_verified ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>OCR Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pending Review</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2 truncate" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Size: {(doc.file_size / 1024).toFixed(1)} KB • Uploaded on{' '}
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>

                  {/* Extracted fields snippet */}
                  {doc.extracted_data && (
                    <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      {doc.extracted_data.name && (
                        <p><span className="font-semibold text-slate-700">Name:</span> {doc.extracted_data.name}</p>
                      )}
                      {doc.extracted_data.id_number && (
                        <p><span className="font-semibold text-slate-700">ID No:</span> {doc.extracted_data.id_number}</p>
                      )}
                      {doc.extracted_data.annual_income !== undefined && doc.extracted_data.annual_income !== null && (
                        <p><span className="font-semibold text-slate-700">Income:</span> ₹{doc.extracted_data.annual_income.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectDocForAnalysis(doc.id);
                      setActiveTab('doc-analysis');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>View OCR Analysis</span>
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
