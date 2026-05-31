// controllers/profileController.js
// Controllers are intentionally thin: validate input → call service → send response.
// All heavy lifting (API calls, score calculation, DB writes) lives in the Service.

const githubService = require("../services/githubService");

const ProfileController = {
  /**
   * GET /api/analyze/:username
   * Analyze a GitHub profile, persist it, and return enriched data.
   */
  analyze: async (req, res, next) => {
    try {
      const { username } = req.params;

      // Basic input sanitization
      if (!username || !/^[a-zA-Z0-9_-]{1,39}$/.test(username)) {
        return res.status(400).json({
          success: false,
          error: "Invalid GitHub username format.",
        });
      }

      const profile = await githubService.analyzeProfile(username);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err); // forward to global error handler
    }
  },

  /**
   * GET /api/profiles
   * Return all previously analyzed profiles from the database.
   */
  getAll: async (req, res, next) => {
    try {
      const profiles = await githubService.getAllProfiles();
      return res.status(200).json({
        success: true,
        count: profiles.length,
        data: profiles,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProfileController;
