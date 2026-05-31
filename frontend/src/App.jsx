// src/App.jsx — root component

import React, { useState, useEffect, useRef } from "react";
import ProfileCard  from "./components/ProfileCard.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import { useGitHubAnalyzer } from "./hooks/useGitHubAnalyzer.js";

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center gap-4 py-12">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-border" />
      <div className="absolute inset-0 rounded-full border-2 border-t-accent animate-spin" />
    </div>
    <p className="text-muted text-sm font-mono animate-pulse">Fetching GitHub data…</p>
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────
const ErrorCard = ({ message }) => (
  <div className="animate-fade-up flex items-start gap-3 bg-coral/10 border border-coral/30
                  rounded-xl p-5 max-w-2xl w-full mx-auto">
    <span className="text-coral text-xl mt-0.5">⚠</span>
    <div>
      <p className="text-coral font-semibold text-sm">Analysis Failed</p>
      <p className="text-muted text-sm mt-0.5">{message}</p>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [input, setInput]   = useState("");
  const inputRef            = useRef(null);
  const { profile, history, loading, error, analyze, loadHistory } = useGitHubAnalyzer();

  // Load history on mount
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Refresh history whenever a new profile is returned
  useEffect(() => { if (profile) loadHistory(); }, [profile, loadHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) analyze(input.trim());
  };

  const handleHistorySelect = (username) => {
    setInput(username);
    analyze(username);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-border bg-slate/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⬡</span>
            <div>
              <h1 className="font-display text-lg leading-none">GitHub Analyzer</h1>
              <p className="text-muted text-xs font-mono">Educase India · Backend Assignment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse-dot" />
            <span className="text-muted text-xs font-mono">API Live</span>
          </div>
        </div>
      </header>

      {/* ── Hero + Search ── */}
      <section className="border-b border-border py-12 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-4xl sm:text-5xl leading-tight">
            Decode any{" "}
            <span className="text-accent">GitHub</span>{" "}
            profile
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Enter a GitHub username to calculate the{" "}
            <span className="text-amber font-medium">Developer Activity Score</span>,
            identify the{" "}
            <span className="text-green font-medium">Primary Tech Stack</span>,
            and store insights in MySQL.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">
                @
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="torvalds"
                disabled={loading}
                className="w-full pl-8 pr-4 py-3 bg-panel border border-border rounded-xl
                           font-mono text-sm text-white placeholder:text-muted
                           focus:outline-none focus:border-accent transition-colors
                           disabled:opacity-50"
                aria-label="GitHub username"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-accent text-ink font-semibold text-sm rounded-xl
                         hover:bg-sky-300 active:scale-95 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? "…" : "Analyze"}
            </button>
          </form>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-8 items-start">

          {/* Results area */}
          <div className="flex-1 min-w-0 space-y-6">
            {loading  && <Spinner />}
            {error    && !loading && <ErrorCard message={error} />}
            {profile  && !loading && <ProfileCard profile={profile} />}

            {!profile && !loading && !error && (
              <div className="text-center py-20 text-muted space-y-2">
                <p className="text-5xl">🔍</p>
                <p className="font-mono text-sm">Search a GitHub username to get started</p>
              </div>
            )}
          </div>

          {/* History sidebar */}
          {history.length > 0 && (
            <HistoryPanel profiles={history} onSelect={handleHistorySelect} />
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-muted text-xs font-mono">
          Built with Node.js · Express · MySQL · React · Tailwind CSS
          <span className="mx-2">·</span>
          Educase India Assignment © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
