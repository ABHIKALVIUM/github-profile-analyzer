// tests/api.test.js
// Integration tests using Supertest — spins up the Express app without a real
// server port, then fires HTTP requests against it in-process.
// The GitHub API and MySQL pool are mocked so tests are fast and hermetic.

const request = require("supertest");
const app     = require("../server");

// ─── Mock Dependencies ────────────────────────────────────────────────────────

// Mock the entire githubService so no real network calls or DB writes happen
jest.mock("../services/githubService", () => ({
  analyzeProfile: jest.fn(),
  getAllProfiles:  jest.fn(),
}));

const githubService = require("../services/githubService");

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("GitHub Profile Analyzer API", () => {

  // ── GET /health ─────────────────────────────────────────────────────────────
  describe("GET /health", () => {
    it("should return 200 with status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  // ── GET /api/analyze/:username ───────────────────────────────────────────────
  describe("GET /api/analyze/:username", () => {

    const mockProfile = {
      username:       "torvalds",
      name:           "Linus Torvalds",
      avatar_url:     "https://avatars.githubusercontent.com/u/1024025",
      bio:            "Linux kernel creator",
      location:       "Portland, OR",
      public_repos:   7,
      public_gists:   0,
      followers:      230000,
      following:      0,
      activity_score: 72.5,
      primary_stack:  "C, Shell, Perl",
      top_languages:  [["C", 4], ["Shell", 2], ["Perl", 1]],
    };

    it("should return 200 and a profile object for a valid username", async () => {
      githubService.analyzeProfile.mockResolvedValueOnce(mockProfile);

      const res = await request(app).get("/api/analyze/torvalds");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe("torvalds");
      expect(res.body.data).toHaveProperty("activity_score");
      expect(res.body.data).toHaveProperty("primary_stack");
    });

    it("should return 404 when GitHub user is not found", async () => {
      const notFound = new Error("GitHub user 'nonexistent_xyz_abc' not found");
      notFound.statusCode = 404;
      githubService.analyzeProfile.mockRejectedValueOnce(notFound);

      const res = await request(app).get("/api/analyze/nonexistent_xyz_abc");

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found/i);
    });

    it("should return 400 for an invalid username format", async () => {
      // Username with special chars — rejected before the service is called
      const res = await request(app).get("/api/analyze/invalid!@#user");

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid/i);
    });
  });

  // ── GET /api/profiles ────────────────────────────────────────────────────────
  describe("GET /api/profiles", () => {

    it("should return 200 with an array of profiles", async () => {
      const mockList = [
        { id: 1, username: "torvalds", activity_score: 72.5 },
        { id: 2, username: "gaearon",  activity_score: 61.3 },
      ];
      githubService.getAllProfiles.mockResolvedValueOnce(mockList);

      const res = await request(app).get("/api/profiles");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBe(2);
    });

    it("should return an empty array when no profiles exist", async () => {
      githubService.getAllProfiles.mockResolvedValueOnce([]);

      const res = await request(app).get("/api/profiles");

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.count).toBe(0);
    });
  });

  // ── Unit: calculateActivityScore ─────────────────────────────────────────────
  describe("Unit: calculateActivityScore", () => {
    const { calculateActivityScore } = jest.requireActual("../services/githubService");

    it("should return a numeric score between 0 and 100", () => {
      const score = calculateActivityScore({
        public_repos:  50,
        public_gists:  10,
        followers:     500,
        following:     100,
        created_at:    "2015-01-01T00:00:00Z",
      });
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should score a new account with 0 activity close to 0", () => {
      const score = calculateActivityScore({
        public_repos: 0,
        public_gists: 0,
        followers:    0,
        following:    0,
        created_at:   new Date().toISOString(), // brand-new account
      });
      expect(score).toBeLessThan(5);
    });
  });
});
