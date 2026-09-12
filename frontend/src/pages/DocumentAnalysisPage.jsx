import React, { useState, useEffect } from 'react';
import { docApi } from '../services/api';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Download,
  Copy,
  Info,
} from 'lucide-react';

export default function DocumentAnalysisPage({
  selectedDocId,
  setActiveTab,
  showToast,
  onTriggerEligibilityCheck,
}) {
  const [documents, setDocuments] = useState([]);
  const [currentId, setCurrentId] = useState(selectedDocId);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAllDocs();
  }, []);

  useEffect(() => {
    if (currentId) {
      loadAnalysis(currentId);
    }
  }, [currentId]);

  const loadAllDocs = async () => {
    try {
      const list = await docApi.list();
      setDocuments(list || []);
      if (!currentId && list && list.length > 0) {
        setCurrentId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalysis = async (id) => {
    try {
      setLoading(true);
      const data = await docApi.getAnalysis(id);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading OCR document analysis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToProfile = async () => {
    if (!currentId) return;
    setSyncing(true);
    try {
      const res = await docApi.syncToProfile(currentId);
      showToast(res.message, 'success');
      if (onTriggerEligibilityCheck) {
        onTriggerEligibilityCheck();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to synchronize data with profile', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (!currentId && (!documents || documents.length === 0)) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto my-12">
        <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">No Documents Uploaded Yet</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload an Aadhaar card or Income Certificate to run our OCR Document Intelligence pipeline.
        </p>
        <button
          onClick={() => setActiveTab('upload-doc')}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 cursor-pointer"
        >
          <span>Upload Document</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Document Picker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">
              Document Intelligence & OCR Analysis
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
              AI Field Extraction
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deep analysis of OCR raw text, extracted demographic fields, confidence scoring, and validation rules.
          </p>
        </div>

        {/* Document Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-700 shrink-0">Viewing Doc:</label>
          <select
            value={currentId || ''}
            onChange={(e) => setCurrentId(Number(e.target.value))}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.doc_type} - {d.file_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !analysis ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Processing OCR payload...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Status & Confidence Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  OCR Status
                </p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-black text-slate-900 capitalize">
                    {analysis.ocr_status}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                Processed
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Extraction Confidence
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {Math.round(analysis.confidence_score * 100)}%
                  </span>
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${analysis.confidence_score * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                Regex + NLP
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Profile Sync
                </p>
                <p className="text-xs text-slate-600 mt-1">Auto-populate profile fields</p>
              </div>
              <button
                onClick={handleSyncToProfile}
                disabled={syncing}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{syncing ? 'Syncing...' : 'Sync to Profile'}</span>
              </button>
            </div>
          </div>

          {/* Validation Warnings / Alerts if any */}
          {analysis.validation_warnings && analysis.validation_warnings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Document Engine Notice:</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-0.5 pl-6 list-disc">
                {analysis.validation_warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Fields Alert */}
          {analysis.missing_fields && analysis.missing_fields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Missing Key Parameters:</span>
              </div>
              <p className="text-xs text-amber-800">
                The following expected fields could not be conclusively determined from the raw image:{' '}
                <span className="font-bold">{analysis.missing_fields.join(', ')}</span>. You may enter them manually in your profile.
              </p>
            </div>
          )}

          {/* Side-by-Side: Extracted Fields vs Raw OCR Text */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Structured Fields (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Structured Extracted Entity Fields</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">JSON Entities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Citizen Name</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.name || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Certificate / ID Number</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                    {analysis.extracted_fields?.id_number || analysis.extracted_fields?.certificate_number || (
                      <span className="text-slate-400 italic">Not detected</span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth (DOB)</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                    {analysis.extracted_fields?.dob || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Age</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.age ? `${analysis.extracted_fields.age} Years` : <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Gender</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.gender || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Annual Family Income</span>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {analysis.extracted_fields?.annual_income !== null && analysis.extracted_fields?.annual_income !== undefined
                      ? `₹${analysis.extracted_fields.annual_income.toLocaleString('en-IN')}`
                      : <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Social Category / Caste</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.category || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">State / Region</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.state || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">District</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {analysis.extracted_fields?.district || <span className="text-slate-400 italic">Not detected</span>}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Click Sync to update your profile automatically
                </span>
                <button
                  onClick={handleSyncToProfile}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{syncing ? 'Syncing...' : 'Sync to Profile'}</span>
                </button>
              </div>
            </div>

            {/* Raw OCR Text Viewer (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h2 className="text-sm font-bold text-slate-900">Extracted Raw OCR Text</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.raw_text);
                    showToast('Raw OCR text copied to clipboard', 'info');
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                  title="Copy text"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-y-auto max-h-96 whitespace-pre-wrap select-all">
                {analysis.raw_text}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Processed via Tesseract OCR engine / PyPDF native text stream.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
