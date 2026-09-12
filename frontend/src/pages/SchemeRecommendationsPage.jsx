import React, { useState, useEffect } from 'react';
import { eligibilityApi, schemeApi, historyApi } from '../services/api';
import EligibilityBadge from '../components/EligibilityBadge';
import {
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Building,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Agriculture',
  'Education',
  'Healthcare',
  'Women Welfare',
  'Employment',
  'Housing',
  'Social Welfare',
];

export default function SchemeRecommendationsPage({
  setActiveTab,
  onSelectScheme,
  showToast,
  onTriggerEligibilityCheck,
  isEvaluating,
}) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    loadEvaluatedSchemes();
  }, []);

  const loadEvaluatedSchemes = async () => {
    try {
      setLoading(true);
      const results = await eligibilityApi.getResults();
      setSchemes(results || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load scheme recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
    const matchQuery =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.ministry.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchQuery;
  });

  const handleViewScheme = async (scheme) => {
    onSelectScheme(scheme);
    try {
      await historyApi.record('scheme_view', scheme.id, scheme.name, 'Viewed scheme details');
    } catch (e) {}
    setActiveTab('scheme-details');
  };

  const handleApplyClick = async (scheme, e) => {
    e.stopPropagation();
    try {
      await historyApi.record('applied_external', scheme.id, scheme.name, 'Redirected to official application portal');
    } catch (e) {}
    window.open(scheme.official_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">
              Government Scheme Recommendations
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
              AI Ranked ({schemes.length} Schemes)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schemes evaluated against your current citizen profile & uploaded documents.
          </p>
        </div>

        <button
          onClick={async () => {
            if (onTriggerEligibilityCheck) {
              await onTriggerEligibilityCheck();
              await loadEvaluatedSchemes();
            }
          }}
          disabled={isEvaluating}
          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Recalculating...' : 'Refresh Matches'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by scheme name, ministry, or keyword (e.g. Kisan, Awas, Mudra)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Eligible">Eligible Only</option>
              <option value="Maybe Eligible">Maybe Eligible</option>
              <option value="Not Eligible">Not Eligible</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Sector:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No schemes match criteria</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting your search query or switching the status filter.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              onClick={() => handleViewScheme(scheme)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {scheme.category}
                  </span>
                  <EligibilityBadge status={scheme.status} score={scheme.score} size="sm" />
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  {scheme.name}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5 font-mono">
                  {scheme.code}
                </p>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Benefits Banner */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">🎁 Benefit: </span>
                  <span className="text-slate-600">{scheme.benefits}</span>
                </div>

                {/* Required Documents Tags */}
                {scheme.required_documents && scheme.required_documents.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">Docs:</span>
                    {scheme.required_documents.slice(0, 3).map((d, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        {d}
                      </span>
                    ))}
                    {scheme.required_documents.length > 3 && (
                      <span className="text-[10px] text-slate-400">
                        +{scheme.required_documents.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewScheme(scheme);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Check Criteria Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleApplyClick(scheme, e)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
