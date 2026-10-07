const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// Store the SQLite file next to server.js  →  backend/nightwave.db
const DB_PATH = path.join(__dirname, '../../nightwave.db');

const db = new Database(DB_PATH);

// Performance tuning
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Auto-create tables on first run ──────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS anime (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    description  TEXT,
    image        TEXT,
    genre        TEXT,
    episodes     INTEGER,
    release_year INTEGER,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    anime_id   INTEGER NOT NULL REFERENCES anime(id)  ON DELETE CASCADE,
    status     TEXT    NOT NULL DEFAULT 'Plan to Watch'
                       CHECK(status IN ('Watching','Completed','Plan to Watch')),
    favorite   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, anime_id)
  );
`);

// ── Seed the anime catalogue once (only when table is empty) ─
const count = db.prepare('SELECT COUNT(*) AS n FROM anime').get().n;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO anime (title, genre, episodes, release_year, image)
    VALUES (@title, @genre, @episodes, @release_year, @image)
  `);
  const seedMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  seedMany([
    { title: 'Fullmetal Alchemist: Brotherhood', genre: 'Adventure',    episodes: 64,   release_year: 2009, image: 'images/alchemist.jpg'      },
    { title: 'The Apothecary Diaries',           genre: 'Mystery',      episodes: 48,   release_year: 2023, image: 'images/apothecary.jpg'     },
    { title: 'Attack on Titan',                  genre: 'Action',       episodes: 89,   release_year: 2013, image: 'images/attackontitan.jpg'  },
    { title: 'Bleach',                           genre: 'Supernatural', episodes: 366,  release_year: 2004, image: 'images/bleach.jpg'         },
    { title: 'Dandadan',                         genre: 'Sci-fi',       episodes: 12,   release_year: 2024, image: 'images/dandadan.jpg'       },
    { title: 'Demon Slayer',                     genre: 'Fantasy',      episodes: 55,   release_year: 2019, image: 'images/demonslayer.jpg'    },
    { title: 'Dragon Ball',                      genre: 'Action',       episodes: 153,  release_year: 1986, image: 'images/dragonball.jpg'     },
    { title: 'Delicious in Dungeon',             genre: 'Adventure',    episodes: 24,   release_year: 2024, image: 'images/dungeon.jpg'        },
    { title: "Frieren: Beyond Journey's End",    genre: 'Fantasy',      episodes: 28,   release_year: 2023, image: 'images/frieren.jpg'        },
    { title: 'Inuyasha',                         genre: 'Romance',      episodes: 167,  release_year: 2000, image: 'images/inuyasha.jpg'       },
    { title: 'Jujutsu Kaisen',                   genre: 'Supernatural', episodes: 47,   release_year: 2020, image: 'images/jujutsu.jpg'        },
    { title: 'Mob Psycho 100',                   genre: 'Action',       episodes: 37,   release_year: 2016, image: 'images/mob.jpg'            },
    { title: 'One Piece',                        genre: 'Adventure',    episodes: 1122, release_year: 1999, image: 'images/onepiece.jpg'       },
    { title: 'I Want to Eat Your Pancreas',      genre: 'Drama',        episodes: 1,    release_year: 2018, image: 'images/pancreas.jpg'       },
    { title: 'Rent-a-Girlfriend',               genre: 'Romance',      episodes: 36,   release_year: 2020, image: 'images/rentagirlfriend.jpg'},
    { title: 'One Punch Man',                    genre: 'Comedy',       episodes: 24,   release_year: 2015, image: 'images/saitama.jpg'        },
    { title: 'Solo Leveling',                    genre: 'Action',       episodes: 25,   release_year: 2024, image: 'images/solo leveling.jpg'  },
    { title: 'Yumeko Jabami',                    genre: 'Psychological',episodes: 24,   release_year: 2018, image: 'images/yuma.jpg'           },
  ]);
  console.log('✅  Seeded 18 anime into catalogue');
}

console.log(`✅  SQLite database ready: ${DB_PATH}`);

module.exports = db;
