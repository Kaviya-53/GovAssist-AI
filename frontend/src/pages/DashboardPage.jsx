import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, eligibilityApi, schemeApi } from '../services/api';
import StatCard from '../components/StatCard';
import EligibilityBadge from '../components/EligibilityBadge';
import {
  Sparkles,
  FileCheck,
  Award,
  Layers,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  UserCheck,
  Bot,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function DashboardPage({ setActiveTab, onSelectScheme, showToast }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [topSchemes, setTopSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const statsData = await dashboardApi.getStats();
      setStats(statsData);

      const eligResults = await eligibilityApi.getResults();
      // Pick top 3 eligible or maybe eligible
      const sorted = (eligResults || []).filter((s) => s.status !== 'Not Eligible').slice(0, 3);
      setTopSchemes(sorted);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      showToast('Error loading dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading citizen dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-700 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wider text-orange-300">
            Citizen Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Namaste, {user?.full_name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            GovAssist AI has evaluated your profile against all active Central and State schemes. Review your verified eligibility and apply directly with your extracted credentials.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('schemes')}
              className="px-4 py-2 bg-white text-blue-900 font-bold text-xs rounded-xl shadow-xs hover:bg-blue-50 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>View All Recommendations</span>
            </button>
            <button
              onClick={() => setActiveTab('upload-doc')}
              className="px-4 py-2 bg-blue-600/40 hover:bg-blue-600/60 border border-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eligible Schemes"
          value={stats?.eligible_schemes_count ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Ready for direct application"
        />
        <StatCard
          title="Maybe Eligible"
          value={stats?.maybe_eligible_count ?? 0}
          icon={Sparkles}
          color="amber"
          subtext="Upload documents to qualify"
        />
        <StatCard
          title="Documents Analyzed"
          value={stats?.documents_count ?? 0}
          icon={FileCheck}
          color="blue"
          subtext={`${stats?.verified_documents_count ?? 0} verified with OCR`}
        />
        <StatCard
          title="Profile Health"
          value={`${stats?.profile_completion_percent ?? 0}%`}
          icon={UserCheck}
          color="purple"
          subtext="Affects match accuracy"
        />
      </div>

      {/* Profile Health Progress Callout if not 100% */}
      {stats && stats.profile_completion_percent < 80 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Complete your citizen profile ({stats.profile_completion_percent}% complete)
              </h4>
              <p className="text-[11px] text-amber-700">
                Adding your family income, land holding, or social category unlocks higher match accuracy.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shrink-0 cursor-pointer"
          >
            Update Profile
          </button>
        </div>
      )}

      {/* Top Scheme Matches Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Top Ranked Schemes for You
            </h2>
            <p className="text-xs text-slate-500">
              Ranked dynamically by the Explainable Rule-Based Eligibility Engine
            </p>
          </div>
          <button
            onClick={() => setActiveTab('schemes')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>See All ({stats?.total_schemes || 16})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topSchemes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No evaluated schemes yet. Click "Run AI Eligibility Check" in the sidebar to calculate!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {scheme.category}
                    </span>
                    <EligibilityBadge status={scheme.status} score={scheme.score} size="sm" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 line-clamp-2">
                    {scheme.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {scheme.benefits}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectScheme(scheme);
                      setActiveTab('scheme-details');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Details
                  </button>
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-700 text-xs flex items-center space-x-1"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Help Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('upload-doc')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-start space-x-3"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Upload Aadhaar / Certificates</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Extract and auto-fill your personal details securely via OCR.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('eligibility')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex items-start space-x-3"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Explainable AI Results</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Understand matched criteria, income limits, and why you qualify.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('chatbot')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex items-start space-x-3"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">GovAssist AI Chatbot</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Ask questions about documents, application steps, or scheme benefits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
