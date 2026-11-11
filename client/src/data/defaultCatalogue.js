// ── Default catalogue (used when API is unreachable) ──────────
const defaults = [
  ['Fullmetal Alchemist: Brotherhood', 'Adventure',   64, 'Completed',     true,  'alchemist.jpg'],
  ['The Apothecary Diaries',           'Mystery',      48, 'Watching',      true,  'apothecary.jpg'],
  ['Attack on Titan',                  'Action',       89, 'Completed',     false, 'attackontitan.jpg'],
  ['Bleach',                           'Supernatural', 366,'Plan to Watch', false, 'bleach.jpg'],
  ['Dandadan',                         'Sci-fi',       12, 'Watching',      true,  'dandadan.jpg'],
  ['Demon Slayer',                     'Fantasy',      55, 'Completed',     false, 'demonslayer.jpg'],
  ['Dragon Ball',                      'Action',       153,'Plan to Watch', false, 'dragonball.jpg'],
  ['Delicious in Dungeon',             'Adventure',    24, 'Plan to Watch', false, 'dungeon.jpg'],
  ["Frieren: Beyond Journey's End",    'Fantasy',      28, 'Watching',      true,  'frieren.jpg'],
  ['Inuyasha',                         'Romance',      167,'Plan to Watch', false, 'inuyasha.jpg'],
  ['Jujutsu Kaisen',                   'Supernatural', 47, 'Completed',     false, 'jujutsu.jpg'],
  ['Mob Psycho 100',                   'Action',       37, 'Completed',     true,  'mob.jpg'],
  ['One Piece',                        'Adventure',    1122,'Watching',     true,  'onepiece.jpg'],
  ['I Want to Eat Your Pancreas',      'Drama',        1,  'Completed',     false, 'pancreas.jpg'],
  ['Rent-a-Girlfriend',               'Romance',      36, 'Plan to Watch', false, 'rentagirlfriend.jpg'],
  ['One Punch Man',                    'Comedy',       24, 'Watching',      false, 'saitama.jpg'],
  ['Solo Leveling',                    'Action',       25, 'Completed',     false, 'solo leveling.jpg'],
  ['Yumeko Jabami',                    'Psychological',24, 'Plan to Watch', false, 'yuma.jpg'],
].map((item, index) => ({
  id:         index + 1,
  title:      item[0],
  genre:      item[1],
  episodes:   item[2],
  status:     item[3],
  isFavorite: item[4],
  dateAdded:  `2026-0${(index % 3) + 1}-${String(index + 5).padStart(2, '0')}`,
  image:      `images/${item[5]}`,
}));

export default defaults;
