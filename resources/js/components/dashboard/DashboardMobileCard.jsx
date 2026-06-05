import React from 'react';

export default function DashboardMobileCard({
  title,
  subtitle,
  metadata = [],
  badges = [],
  actionLabel,
  onAction,
  loading = false,
  actions = [],
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-xs font-bold text-emerald-700 font-mono leading-tight">
          {title}
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {badges.map((badge, i) => (
              <span key={i}>{badge}</span>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm font-semibold text-slate-900 mb-2.5">
        {subtitle}
      </div>

      {metadata.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {metadata.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 shrink-0">{item.label}</span>
              <span className="text-xs text-slate-800 text-right leading-tight">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex items-center justify-end gap-1 pt-2.5 border-t border-slate-100">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {actionLabel && onAction && actions.length === 0 && (
        <button
          onClick={onAction}
          disabled={loading}
          className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : actionLabel}
        </button>
      )}
    </div>
  );
}
