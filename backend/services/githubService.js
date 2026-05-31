// services/githubService.js
// ALL business logic lives here. Controllers are kept thin — they only
// validate input, delegate to this service, and format the HTTP response.

const axios = require("axios");
const { pool } = require("../config/db");

// ─── GitHub API client ────────────────────────────────────────────────────────
const githubClient = axios.create({
  baseURL: "https://api.github.com",
  timeout: 8000, // fail fast rather than hanging the request
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    // A personal token lifts the rate limit from 60 → 5 000 req/hr
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

// ─── Activity Score Algorithm ─────────────────────────────────────────────────
/**
 * Derives a 0–100 "Developer Activity Score" from public GitHub metadata.
 *
 * Scoring weights (chosen to reward breadth of public contributions):
 * • Public repositories  → up to 40 pts  (log-scaled; plateaus at ~200 repos)
 * • Public gists         → up to 10 pts  (bonus for sharing snippets)
 * • Followers            → up to 25 pts  (community reach)
 * • Following            → up to 10 pts  (active community member)
 * • Account age (years)  → up to 15 pts  (longevity proxy for consistency)
 *
 * Log-scaling prevents power users from scoring 10× a typical developer.
 */
const calculateActivityScore = (userData) => {
  const logScale = (value, cap) =>
    Math.min(Math.log1p(value) / Math.log1p(cap), 1);

  const repoScore     = logScale(userData.public_repos,  200) * 40;
  const gistScore     = logScale(userData.public_gists,   50) * 10;
  const followerScore = logScale(userData.followers,     500) * 25;
  const followScore   = logScale(userData.following,     300) * 10;

  const accountAgeYears =
    (Date.now() - new Date(userData.created_at).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25);
  const ageScore = logScale(accountAgeYears, 10) * 15;

  return Math.round((repoScore + gistScore + followerScore + followScore + ageScore) * 100) / 100;
};

// ─── Primary Stack Detector ───────────────────────────────────────────────────
/**
 * Fetches up to 100 repos, tallies languages, and returns the top-3.
 * We fetch with `?sort=pushed` so recently active repos rank higher,
 * giving a more current picture of what the developer actually uses.
 */
const detectPrimaryStack = async (username) => {
  try {
    const { data: repos } = await githubClient.get(
      `/users/${username}/repos?per_page=100&sort=pushed`
    );

    const langCount = {};
    repos.forEach(({ language }) => {
      if (language) langCount[language] = (langCount[language] || 0) + 1;
    });

    // Sort desc by repo count, take top 3
    const sorted = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      topLanguages: sorted, // [[lang, count], ...]
      primaryStack: sorted.map(([lang]) => lang).join(", ") || "N/A",
    };
  } catch {
    return { topLanguages: [], primaryStack: "N/A" };
  }
};

// ─── Persistence ─────────────────────────────────────────────────────────────
/**
 * Upserts a profile row (INSERT … ON CONFLICT DO UPDATE) so that
 * re-analyzing the same username refreshes data rather than creating dupes.
 * Then rebuilds language_stats rows atomically.
 */
const saveProfile = async (profileData, topLanguages) => {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // PostgreSQL uses ON CONFLICT (username) DO UPDATE instead of ON DUPLICATE KEY UPDATE
    const upsertQuery = `
      INSERT INTO profiles
        (username, name, avatar_url, bio, location,
         public_repos, public_gists, followers, following,
         activity_score, primary_stack, github_created_at, analyzed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (username) DO UPDATE SET
         name              = EXCLUDED.name,
         avatar_url        = EXCLUDED.avatar_url,
         bio               = EXCLUDED.bio,
         location          = EXCLUDED.location,
         public_repos      = EXCLUDED.public_repos,
         public_gists      = EXCLUDED.public_gists,
         followers         = EXCLUDED.followers,
         following         = EXCLUDED.following,
         activity_score    = EXCLUDED.activity_score,
         primary_stack     = EXCLUDED.primary_stack,
         github_created_at = EXCLUDED.github_created_at,
         analyzed_at       = NOW()
       RETURNING id;
    `;

    const upsertValues = [
      profileData.username,
      profileData.name,
      profileData.avatar_url,
      profileData.bio,
      profileData.location,
      profileData.public_repos,
      profileData.public_gists,
      profileData.followers,
      profileData.following,
      profileData.activity_score,
      profileData.primary_stack,
      profileData.github_created_at,
    ];

    const { rows } = await conn.query(upsertQuery, upsertValues);
    let profileId = rows[0]?.id;

    if (!profileId) {
      const result = await conn.query(
        "SELECT id FROM profiles WHERE username = $1",
        [profileData.username]
      );
      profileId = result.rows[0]?.id;
    }

    // Rebuild language stats (delete-then-insert keeps it clean)
    await conn.query("DELETE FROM language_stats WHERE profile_id = $1", [profileId]);
    
    if (topLanguages.length) {
      // PostgreSQL doesn't accept the nested array format that MySQL does for bulk insertions.
      // We safely loop through the top languages using parameters to avoid syntax compatibility constraints.
      for (const [lang, count] of topLanguages) {
        await conn.query(
          "INSERT INTO language_stats (profile_id, language, repo_count) VALUES ($1, $2, $3)",
          [profileId, lang, count]
        );
      }
    }

    await conn.query("COMMIT");
    return profileId;
  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    conn.release();
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * analyzeProfile — the main orchestration function.
 * 1. Fetch user data from GitHub
 * 2. Fetch repos and detect primary stack
 * 3. Calculate activity score
 * 4. Persist to PostgreSQL
 * 5. Return enriched profile object
 */
const analyzeProfile = async (username) => {
  let githubUser;
  try {
    const { data } = await githubClient.get(`/users/${username}`);
    githubUser = data;
  } catch (err) {
    if (err.response?.status === 404) {
      const notFound = new Error(`GitHub user '${username}' not found`);
      notFound.statusCode = 404;
      throw notFound;
    }
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      const timeout = new Error("GitHub API request timed out. Please try again.");
      timeout.statusCode = 504;
      throw timeout;
    }
    throw err;
  }

  const activityScore = calculateActivityScore(githubUser);
  const { topLanguages, primaryStack } = await detectPrimaryStack(username);

  const profileData = {
    username:           githubUser.login,
    name:               githubUser.name,
    avatar_url:         githubUser.avatar_url,
    bio:                githubUser.bio,
    location:           githubUser.location,
    public_repos:       githubUser.public_repos,
    public_gists:       githubUser.public_gists,
    followers:          githubUser.followers,
    following:          githubUser.following,
    activity_score:     activityScore,
    primary_stack:      primaryStack,
    github_created_at:  githubUser.created_at
      ? new Date(githubUser.created_at).toISOString().slice(0, 19).replace("T", " ")
      : null,
    github_url:         githubUser.html_url,
    blog:               githubUser.blog,
  };

  await saveProfile(profileData, topLanguages);

  return { ...profileData, top_languages: topLanguages };
};

/**
 * getAllProfiles — returns every analyzed profile, newest first.
 */
const getAllProfiles = async () => {
  const { rows } = await pool.query(
    `SELECT id, username, name, avatar_url, bio, location,
            public_repos, public_gists, followers, following,
            activity_score, primary_stack, github_created_at, analyzed_at
     FROM profiles
     ORDER BY analyzed_at DESC`
  );
  return rows;
};

module.exports = { analyzeProfile, getAllProfiles, calculateActivityScore };