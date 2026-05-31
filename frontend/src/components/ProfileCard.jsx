// components/ProfileCard.jsx
// Displays the enriched GitHub profile returned from our backend.

import React from "react";

// Language colour map — covers the most common languages
const LANG_COLORS = {
  JavaScript: "#F7DF1E", TypeScript: "#3178C6", Python: "#3572A5",
  Java: "#B07219",  "C++": "#F34B7D",  C: "#555555",  "C#": "#178600",
  Ruby: "#701516",  Go: "#00ADD8",  Rust: "#DEA584",  PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Shell: "#89E051", HTML: "#E34C26",
  CSS: "#563D7C",   Dart: "#00B4AB",  Scala: "#C22D40",
};

const langColor = (lang) => LANG_COLORS[lang] || "#6B7280";

// Circular score gauge drawn with SVG
const ScoreGauge = ({ score }) => {
  const r  = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  const color =
    score >= 70 ? "#4ADE80" :
    score >= 40 ? "#FBBF24" :
                  "#F87171";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2E333D" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="font-mono text-2xl font-medium" style={{ color }}>
        {score}
      </span>
      <span className="text-muted text-xs uppercase tracking-widest">Activity Score</span>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="font-mono text-lg font-semibold text-white">
      {Number(value).toLocaleString()}
    </span>
    <span className="text-muted text-xs uppercase tracking-wider">{label}</span>
  </div>
);

const ProfileCard = ({ profile }) => {
  const langs = profile.primary_stack
    ? profile.primary_stack.split(", ").filter(Boolean)
    : [];

  return (
    <div className="animate-fade-up bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full mx-auto">

      {/* Header strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-accent via-green to-amber" />

      <div className="p-6 sm:p-8 space-y-6">

        {/* Avatar + identity */}
        <div className="flex items-center gap-5">
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-20 h-20 rounded-2xl ring-2 ring-border object-cover"
          />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight truncate">
              {profile.name || profile.username}
            </h2>
            <a
              href={`https://github.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-accent text-sm hover:underline"
            >
              @{profile.username}
            </a>
            {profile.bio && (
              <p className="text-muted text-sm mt-1 line-clamp-2">{profile.bio}</p>
            )}
            {profile.location && (
              <p className="text-muted text-xs mt-0.5 flex items-center gap-1">
                <span>📍</span> {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Repos"     value={profile.public_repos} />
          <Stat label="Gists"     value={profile.public_gists} />
          <Stat label="Followers" value={profile.followers} />
          <Stat label="Following" value={profile.following} />
        </div>

        {/* Score + stack */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate rounded-xl p-5">

          <ScoreGauge score={parseFloat(profile.activity_score)} />

          <div className="flex-1 space-y-3 w-full">
            <div>
              <p className="text-muted text-xs uppercase tracking-widest mb-2">Primary Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {langs.length ? langs.map((lang) => (
                  <span
                    key={lang}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium"
                    style={{
                      background: `${langColor(lang)}20`,
                      border: `1px solid ${langColor(lang)}50`,
                      color: langColor(lang),
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: langColor(lang) }}
                    />
                    {lang}
                  </span>
                )) : (
                  <span className="text-muted text-sm">No language data</span>
                )}
              </div>
            </div>

            {profile.top_languages?.length > 0 && (
              <div>
                <p className="text-muted text-xs uppercase tracking-widest mb-1.5">Language Breakdown</p>
                <div className="space-y-1.5">
                  {profile.top_languages.slice(0, 3).map(([lang, count]) => (
                    <div key={lang} className="flex items-center gap-2">
                      <span className="text-xs font-mono w-24 truncate" style={{ color: langColor(lang) }}>
                        {lang}
                      </span>
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((count / (profile.top_languages[0][1] || 1)) * 100, 100)}%`,
                            background: langColor(lang),
                          }}
                        />
                      </div>
                      <span className="text-muted text-xs font-mono w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-muted text-xs text-center">
          Analyzed at {new Date().toLocaleTimeString()} · Data from GitHub Public API
        </p>
      </div>
    </div>
  );
};

export default ProfileCard;
