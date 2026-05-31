-- =============================================================
-- GitHub Profile Analyzer — Database Schema
-- Run this file once against your MySQL instance:
--   mysql -u root -p < config/schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

-- -------------------------------------------------------------
-- profiles: one row per analyzed GitHub username.
-- Indexed on username for fast lookups and on analyzed_at for
-- sorting/pagination of the history view.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username            VARCHAR(100)  NOT NULL,
  name                VARCHAR(255)  DEFAULT NULL,
  avatar_url          TEXT          DEFAULT NULL,
  bio                 TEXT          DEFAULT NULL,
  location            VARCHAR(255)  DEFAULT NULL,
  public_repos        INT UNSIGNED  DEFAULT 0,
  public_gists        INT UNSIGNED  DEFAULT 0,
  followers           INT UNSIGNED  DEFAULT 0,
  following           INT UNSIGNED  DEFAULT 0,
  activity_score      DECIMAL(6,2)  DEFAULT 0.00 COMMENT 'Calculated Developer Activity Score (0–100)',
  primary_stack       VARCHAR(255)  DEFAULT NULL COMMENT 'Top 3 languages comma-separated',
  github_created_at   DATETIME      DEFAULT NULL,
  analyzed_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- A unique index lets us do an INSERT … ON DUPLICATE KEY UPDATE
  -- so re-analyzing a profile refreshes the row instead of duplicating it.
  UNIQUE KEY uq_username (username),
  INDEX idx_analyzed_at (analyzed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- language_stats: per-profile language breakdown.
-- Kept in a child table (not a JSON blob) so we can query
-- aggregate language popularity across all profiles later.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS language_stats (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id  INT UNSIGNED NOT NULL,
  language    VARCHAR(100) NOT NULL,
  repo_count  INT UNSIGNED DEFAULT 1,

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_language   (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;