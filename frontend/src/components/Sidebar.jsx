import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  UploadCloud,
  FileSearch,
  Sparkles,
  CheckCircle2,
  Bot,
  History,
  BarChart3,
  Layers,
  Users,
  Cpu,
  HelpCircle,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onTriggerEligibilityCheck, isEvaluating }) {
  const { user, isAdmin } = useAuth();

  const citizenNavItems = [
    { id: 'dashboard', label: 'Citizen Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Citizen Profile', icon: UserCheck },
    { id: 'upload-doc', label: 'Document Upload', icon: UploadCloud },
    { id: 'doc-analysis', label: 'Document Intelligence', icon: FileSearch },
    { id: 'schemes', label: 'Scheme Recommendations', icon: Sparkles },
    { id: 'eligibility', label: 'Eligibility Results', icon: CheckCircle2 },
    { id: 'chatbot', label: 'AI Scheme Assistant', icon: Bot },
    { id: 'history', label: 'Application History', icon: History },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Admin Analytics', icon: BarChart3 },
    { id: 'admin-schemes', label: 'Scheme Management', icon: Layers },
    { id: 'admin-users', label: 'Registered Citizens', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Quick Status Pill */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-700">AI Engine Online</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            v1.2-local
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Citizen Menu */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Citizen Services
          </div>
          <nav className="space-y-1">
            {citizenNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administrator Section */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-purple-600 flex items-center justify-between">
              <span>Admin Console</span>
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold">STAFF</span>
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Instant Eligibility Re-Calculation Action */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onTriggerEligibilityCheck}
          disabled={isEvaluating}
          className="w-full py-2.5 px-3 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Cpu className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
          <span>{isEvaluating ? 'Analyzing Criteria...' : 'Run AI Eligibility Check'}</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-2 leading-tight">
          Evaluates all 16 schemes against your verified documents & profile.
        </p>
      </div>
    </aside>
  );
}
