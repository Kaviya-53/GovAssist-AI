import React, { useState, useEffect } from 'react';
import { eligibilityApi } from '../services/api';
import EligibilityBadge from '../components/EligibilityBadge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Cpu,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function EligibilityResultsPage({
  setActiveTab,
  onSelectScheme,
  showToast,
  onTriggerEligibilityCheck,
  isEvaluating,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await eligibilityApi.getResults();
      setResults(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading eligibility results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eligibleCount = results.filter((r) => r.status === 'Eligible').length;
  const maybeCount = results.filter((r) => r.status === 'Maybe Eligible').length;
  const notEligibleCount = results.filter((r) => r.status === 'Not Eligible').length;

  const filtered = results.filter((r) => {
    if (filter === 'All') return true;
    return r.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">
              Explainable AI Eligibility Engine Audit
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 font-mono">
              Rule-Based Classifier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparent breakdown of why your profile qualified or failed every scheme criterion.
          </p>
        </div>

        <button
          onClick={async () => {
            if (onTriggerEligibilityCheck) {
              await onTriggerEligibilityCheck();
              await loadResults();
            }
          }}
          disabled={isEvaluating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <Cpu className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Recalculating...' : 'Re-Run AI Engine'}</span>
        </button>
      </div>

      {/* Stats and Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'All'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Results ({results.length})
          </button>

          <button
            onClick={() => setFilter('Eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'Eligible'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Eligible ({eligibleCount})
          </button>

          <button
            onClick={() => setFilter('Maybe Eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'Maybe Eligible'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Maybe Eligible ({maybeCount})
          </button>

          <button
            onClick={() => setFilter('Not Eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'Not Eligible'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Not Eligible ({notEligibleCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filtered.length} evaluated schemes
        </span>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="text-xs text-slate-500">No schemes found in this filter category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {r.category}
                    </span>
                    <span className="text-xs font-bold font-mono text-blue-600">{r.code}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{r.name}</h3>
                </div>

                <div className="flex items-center space-x-3">
                  <EligibilityBadge status={r.status} score={r.score} size="md" />
                  <button
                    onClick={() => {
                      onSelectScheme(r);
                      setActiveTab('scheme-details');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Explainable Criteria Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Matched */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="font-bold text-[11px] text-emerald-900 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matched Criteria ({r.matched_criteria?.length || 0})</span>
                  </span>
                  {r.matched_criteria && r.matched_criteria.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-emerald-800">
                      {r.matched_criteria.map((m, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">None</p>
                  )}
                </div>

                {/* Failed */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <span className="font-bold text-[11px] text-rose-900 flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Failed Criteria ({r.failed_criteria?.length || 0})</span>
                  </span>
                  {r.failed_criteria && r.failed_criteria.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-rose-800">
                      {r.failed_criteria.map((f, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-rose-600 font-bold">✕</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-600 font-medium">All eligible</p>
                  )}
                </div>

                {/* Missing / Recommended Documents */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="font-bold text-[11px] text-amber-900 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Required Documents Missing</span>
                  </span>
                  {r.recommended_docs && r.recommended_docs.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-amber-800">
                      {r.recommended_docs.map((rd, idx) => (
                        <li key={idx} className="flex items-start space-x-1">
                          <span className="text-amber-600">•</span>
                          <span>{rd}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-600 font-medium">All documents on record</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
