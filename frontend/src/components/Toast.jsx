import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      icon: XCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-300 text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  }[type] || {
    bg: 'bg-slate-50 border-slate-300 text-slate-900',
    icon: Info,
    iconColor: 'text-slate-600',
  };

  const Icon = styles.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md">
      <div className={`flex items-start p-4 rounded-xl border shadow-lg ${styles.bg}`}>
        <Icon className={`w-5 h-5 shrink-0 mr-3 mt-0.5 ${styles.iconColor}`} />
        <div className="flex-1 text-xs font-semibold leading-relaxed">
          {message}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
