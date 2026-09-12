import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtext, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${selectedColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500 font-medium">
          {trend && (
            <span className="text-emerald-600 font-bold mr-1.5 flex items-center">
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
