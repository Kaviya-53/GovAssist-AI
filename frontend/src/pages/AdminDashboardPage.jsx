import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  Layers,
  FileCheck,
  Cpu,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AdminDashboardPage({ setActiveTab, showToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      showToast('Error loading administrative analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format data for Recharts
  const categoryData = Object.entries(stats.category_distribution || {}).map(([key, val]) => ({
    category: key,
    count: val,
  }));

  const eligibilityData = [
    { name: 'Eligible', value: stats.eligibility_distribution?.['Eligible'] || 0, color: '#10b981' },
    { name: 'Maybe Eligible', value: stats.eligibility_distribution?.['Maybe Eligible'] || 0, color: '#f59e0b' },
    { name: 'Not Eligible', value: stats.eligibility_distribution?.['Not Eligible'] || 0, color: '#ef4444' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="bg-linear-to-r from-purple-800 via-indigo-900 to-purple-950 p-6 sm:p-8 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/20">
              Administrative Command Center
            </span>
            <span className="text-xs text-purple-300">• Live Governance Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Central Scheme & Citizen Governance
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
            Monitor citizen onboarding, AI eligibility distributions, document verification rates, and manage policy criteria.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('admin-schemes')}
            className="px-4 py-2.5 bg-white text-purple-900 font-bold text-xs rounded-xl shadow-xs hover:bg-purple-50 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Schemes</span>
          </button>
          <button
            onClick={() => setActiveTab('admin-users')}
            className="px-4 py-2.5 bg-purple-600/50 hover:bg-purple-600 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>View Citizens</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Citizens"
          value={stats.total_citizens}
          icon={Users}
          color="purple"
          subtext="Active Indian beneficiaries"
        />
        <StatCard
          title="Active Central Schemes"
          value={stats.active_schemes}
          icon={Layers}
          color="blue"
          subtext={`Across ${categoryData.length} key sectors`}
        />
        <StatCard
          title="Certificates Analyzed"
          value={stats.total_documents}
          icon={FileCheck}
          color="emerald"
          subtext="OCR pipeline extractions"
        />
        <StatCard
          title="AI Evaluated Results"
          value={stats.total_evaluations}
          icon={Cpu}
          color="amber"
          subtext="Rule-based matching runs"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sector Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Schemes Distribution by Sector</span>
              </h2>
              <p className="text-[11px] text-slate-400">Number of active schemes per department</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Schemes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Eligibility Distribution Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>Eligibility Decisions Split</span>
              </h2>
              <p className="text-[11px] text-slate-400">Total matched citizen evaluations</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eligibilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {eligibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
