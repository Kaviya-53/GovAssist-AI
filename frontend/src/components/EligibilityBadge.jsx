import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function EligibilityBadge({ status, score, showScore = true, size = 'md' }) {
  let config = {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    barBg: 'bg-emerald-500',
    icon: CheckCircle2,
    label: 'Eligible',
  };

  if (status === 'Maybe Eligible') {
    config = {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      barBg: 'bg-amber-500',
      icon: AlertCircle,
      label: 'Maybe Eligible',
    };
  } else if (status === 'Not Eligible') {
    config = {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      barBg: 'bg-rose-500',
      icon: XCircle,
      label: 'Not Eligible',
    };
  }

  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2">
      <span
        className={`inline-flex items-center space-x-1 font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{config.label}</span>
      </span>

      {showScore && score !== undefined && score !== null && (
        <div className="flex items-center space-x-1.5">
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.barBg}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-slate-700 font-mono">
            {Math.round(score)}%
          </span>
        </div>
      )}
    </div>
  );
}
