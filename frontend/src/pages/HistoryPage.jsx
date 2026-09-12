import React, { useState, useEffect } from 'react';
import { historyApi } from '../services/api';
import {
  History as HistoryIcon,
  Cpu,
  UploadCloud,
  ExternalLink,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function HistoryPage({ showToast }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await historyApi.list();
      setHistoryList(data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading application history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (actionType) => {
    const map = {
      eligibility_check: { label: 'AI Eligibility Check', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Cpu },
      applied_external: { label: 'Applied on Portal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ExternalLink },
      document_upload: { label: 'Document Uploaded', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: UploadCloud },
      scheme_view: { label: 'Scheme Details Viewed', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Eye },
      profile_update: { label: 'Profile Updated', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: CheckCircle2 },
    };
    const item = map[actionType] || { label: actionType, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HistoryIcon };
    const Icon = item.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.color}`}>
        <Icon className="w-3 h-3" />
        <span>{item.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Application & Activity Audit Trail</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete historical record of your document uploads, AI checks, and scheme applications.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh history"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading audit trail...</div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <HistoryIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">No activity recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Your actions like document uploads and eligibility checks will be tracked here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getActionBadge(item.action_type)}
                    {item.scheme_name && (
                      <span className="text-xs font-bold text-slate-800">
                        {item.scheme_name}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-600 pl-1">{item.notes}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400 shrink-0 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
