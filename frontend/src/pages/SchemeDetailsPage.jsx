import React from 'react';
import EligibilityBadge from '../components/EligibilityBadge';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  Sparkles,
  Bot,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function SchemeDetailsPage({ scheme, onBack, setActiveTab, onAskAboutScheme }) {
  if (!scheme) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-slate-500">No scheme selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          Back to Recommendations
        </button>
      </div>
    );
  }

  const reqDocs = scheme.required_documents || [];
  const matched = scheme.matched_criteria || [];
  const failed = scheme.failed_criteria || [];
  const missing = scheme.missing_info || [];
  const recommendedDocs = scheme.recommended_docs || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Schemes</span>
      </button>

      {/* Main Scheme Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {scheme.category}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">{scheme.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {scheme.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{scheme.ministry}</span>
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start sm:items-end space-y-2">
            <EligibilityBadge status={scheme.status} score={scheme.score} size="md" />
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all"
            >
              <span>Visit Official Application Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Benefits Highlight Box */}
        <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Scheme Benefits & Financial Assistance</span>
          </h3>
          <p className="text-xs text-slate-800 font-semibold mt-1.5 leading-relaxed">
            {scheme.benefits}
          </p>
        </div>
      </div>

      {/* Explainable AI Decision Engine Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Explainable AI Eligibility Decision Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Transparent rule evaluation matching your profile against official gazette criteria.
            </p>
          </div>
          <button
            onClick={() => onAskAboutScheme(scheme)}
            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AI About This</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matched Criteria */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <h3 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Matched Criteria ({matched.length})</span>
            </h3>
            {matched.length === 0 ? (
              <p className="text-xs text-emerald-700 italic">No criteria matched yet.</p>
            ) : (
              <ul className="space-y-1 text-xs text-emerald-800">
                {matched.map((m, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Failed or Disqualifying Criteria */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
            <h3 className="text-xs font-bold text-rose-900 flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Failed Criteria ({failed.length})</span>
            </h3>
            {failed.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No disqualifying criteria found!</p>
            ) : (
              <ul className="space-y-1 text-xs text-rose-800">
                {failed.map((f, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Missing Info / Required Steps */}
        {(missing.length > 0 || recommendedDocs.length > 0) && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <h3 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Action Items to Complete Application</span>
            </h3>
            <ul className="space-y-1 text-xs text-amber-800 pl-4 list-disc">
              {missing.map((mi, idx) => (
                <li key={idx}>Profile update needed: {mi}</li>
              ))}
              {recommendedDocs.map((rd, idx) => (
                <li key={`rd-${idx}`}>
                  Missing supporting document:{' '}
                  <span className="font-bold text-amber-950">{rd}</span>. Upload it in Document Vault.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Description & Application Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Scheme Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Scheme Overview & Objectives</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {scheme.description}
          </p>
        </div>

        {/* Required Documents Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Mandatory Documents Checklist</span>
          </h2>
          <div className="space-y-2">
            {reqDocs.map((doc, idx) => {
              const isMissing = recommendedDocs.includes(doc);
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isMissing
                      ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span className="font-semibold">{doc}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isMissing
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isMissing ? 'Not Uploaded' : 'Verified'}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setActiveTab('upload-doc')}
            className="w-full mt-2 py-2 text-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
          >
            Upload Missing Documents in Vault →
          </button>
        </div>
      </div>

      {/* Step-by-Step Application Process */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Step-by-Step Official Application Instructions</span>
        </h2>
        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
          {scheme.application_process}
        </div>
        <div className="pt-2 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            Source: Official Central / State Gazette Portal
          </span>
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <span>Launch Official Application</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
