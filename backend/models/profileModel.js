// models/profileModel.js
// The Model layer is responsible for direct database interactions.
// Services call these methods; no SQL leaks into controllers.

const { pool } = require("../config/db");

const ProfileModel = {
  /**
   * Find a profile by username.
   * Used by the controller to check for a cached result.
   */
  findByUsername: async (username) => {
    // Changed .execute to .query, array destructuring to object destructuring, and ? to $1
    const { rows } = await pool.query(
      "SELECT * FROM profiles WHERE username = $1 LIMIT 1",
      [username]
    );
    return rows[0] || null;
  },

  /**
   * Return all profiles ordered by most recently analyzed.
   */
  findAll: async () => {
    // Changed .execute to .query and array destructuring to object destructuring
    const { rows } = await pool.query(
      "SELECT * FROM profiles ORDER BY analyzed_at DESC"
    );
    return rows;
  },

  /**
   * Fetch language breakdown for a given profile id.
   */
  getLanguageStats: async (profileId) => {
    // Changed .execute to .query, array destructuring to object destructuring, and ? to $1
    const { rows } = await pool.query(
      "SELECT language, repo_count FROM language_stats WHERE profile_id = $1 ORDER BY repo_count DESC",
      [profileId]
    );
    return rows;
  },
};

module.exports = ProfileModel;