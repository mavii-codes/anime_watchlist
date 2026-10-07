-- ============================================================
-- Nightwave Anime Watchlist — Seed Data
-- Populates the anime catalogue with the same titles that
-- appear in the original Vue.js app so the app works immediately.
-- Usage: mysql -u root -p nightwave_db < database/seed.sql
-- ============================================================

USE nightwave_db;

-- Truncate catalogue only (watchlist rows cascade via FK)
TRUNCATE TABLE watchlist;
DELETE FROM anime;
ALTER TABLE anime AUTO_INCREMENT = 1;

INSERT INTO anime (title, genre, episodes, release_year, image) VALUES
  ('Fullmetal Alchemist: Brotherhood', 'Adventure',   64, 2009, 'images/alchemist.jpg'),
  ('The Apothecary Diaries',           'Mystery',      48, 2023, 'images/apothecary.jpg'),
  ('Attack on Titan',                  'Action',       89, 2013, 'images/attackontitan.jpg'),
  ('Bleach',                           'Supernatural', 366, 2004, 'images/bleach.jpg'),
  ('Dandadan',                         'Sci-fi',       12, 2024, 'images/dandadan.jpg'),
  ('Demon Slayer',                     'Fantasy',      55, 2019, 'images/demonslayer.jpg'),
  ('Dragon Ball',                      'Action',       153, 1986, 'images/dragonball.jpg'),
  ('Delicious in Dungeon',             'Adventure',    24, 2024, 'images/dungeon.jpg'),
  ('Frieren: Beyond Journey\'s End',   'Fantasy',      28, 2023, 'images/frieren.jpg'),
  ('Inuyasha',                         'Romance',      167, 2000, 'images/inuyasha.jpg'),
  ('Jujutsu Kaisen',                   'Supernatural', 47, 2020, 'images/jujutsu.jpg'),
  ('Mob Psycho 100',                   'Action',       37, 2016, 'images/mob.jpg'),
  ('One Piece',                        'Adventure',    1122, 1999, 'images/onepiece.jpg'),
  ('I Want to Eat Your Pancreas',      'Drama',        1,  2018, 'images/pancreas.jpg'),
  ('Rent-a-Girlfriend',               'Romance',      36, 2020, 'images/rentagirlfriend.jpg'),
  ('One Punch Man',                    'Comedy',       24, 2015, 'images/saitama.jpg'),
  ('Solo Leveling',                    'Action',       25, 2024, 'images/solo leveling.jpg'),
  ('Yumeko Jabami',                    'Psychological',24, 2018, 'images/yuma.jpg');
