// routes/profileRoutes.js

const express = require("express");
const rateLimit = require("express-rate-limit");
const ProfileController = require("../controllers/profileController");

const router = express.Router();

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// The /analyze route triggers an outbound call to the GitHub API.
// We protect it aggressively: 30 requests per 15 minutes per IP.
// The lighter /profiles route gets a more relaxed 100 req / 15 min limit.

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,   // send RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many analysis requests. Please wait before trying again.",
  },
});

const profilesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Route Definitions ────────────────────────────────────────────────────────
router.get("/analyze/:username", analyzeLimiter, ProfileController.analyze);
router.get("/profiles",          profilesLimiter, ProfileController.getAll);

module.exports = router;
