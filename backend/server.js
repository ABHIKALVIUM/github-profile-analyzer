// server.js — application entry point

require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const { testConnection } = require("./config/db");
const profileRoutes  = require("./routes/profileRoutes");
const errorHandler   = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests only from our React frontend.
// In production, replace CLIENT_ORIGIN with the deployed frontend URL.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", profileRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  testConnection()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Failed to establish startup database mapping layer:", err.message);
  });
}
module.exports = app; // export for Supertest // export for Supertest

// ─── Boot ─────────────────────────────────────────────────────────────────────
