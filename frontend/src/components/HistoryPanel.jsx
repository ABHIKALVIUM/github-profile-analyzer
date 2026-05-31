// components/HistoryPanel.jsx
// Sidebar list of previously analyzed profiles.

import React from "react";

const HistoryPanel = ({ profiles, onSelect }) => {
  if (!profiles.length) return null;

  return (
    <aside className="w-full sm:w-64 shrink-0">
      <h3 className="text-muted text-xs uppercase tracking-widest mb-3 px-1">
        Previously Analyzed
      </h3>
      <ul className="space-y-1.5">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.username)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
                         bg-panel border border-border hover:border-accent/50
                         hover:bg-slate transition-all text-left group"
            >
              <img
                src={p.avatar_url}
                alt={p.username}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-border"
              />
              <div className="min-w-0">
                <p className="font-mono text-sm text-white truncate group-hover:text-accent transition-colors">
                  {p.username}
                </p>
                <p className="text-muted text-xs">
                  Score: {parseFloat(p.activity_score).toFixed(1)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default HistoryPanel;
