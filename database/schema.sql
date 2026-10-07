-- ============================================================
-- Nightwave Anime Watchlist — Database Schema
-- Run this once to initialize the database.
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS nightwave_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nightwave_db;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username      VARCHAR(80)      NOT NULL,
  email         VARCHAR(255)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_users         PRIMARY KEY (id),
  CONSTRAINT uq_users_email   UNIQUE (email),
  CONSTRAINT uq_users_uname   UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Anime catalogue ──────────────────────────────────────────
-- Global catalogue of anime titles that every user can add to
-- their personal watchlist.
CREATE TABLE IF NOT EXISTS anime (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  title        VARCHAR(200)     NOT NULL,
  description  TEXT,
  image        VARCHAR(400),
  genre        VARCHAR(100),
  release_year YEAR,
  created_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_anime PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Watchlist ─────────────────────────────────────────────────
-- Per-user watchlist entries.  Each (user_id, anime_id) pair is
-- unique — a user can only add the same title once.
CREATE TABLE IF NOT EXISTS watchlist (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED     NOT NULL,
  anime_id   INT UNSIGNED     NOT NULL,
  status     ENUM('Watching','Completed','Plan to Watch') NOT NULL DEFAULT 'Plan to Watch',
  favorite   TINYINT(1)       NOT NULL DEFAULT 0,
  episodes   INT UNSIGNED,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_watchlist       PRIMARY KEY (id),
  CONSTRAINT uq_user_anime      UNIQUE (user_id, anime_id),
  CONSTRAINT fk_wl_user         FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_wl_anime        FOREIGN KEY (anime_id) REFERENCES anime (id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
