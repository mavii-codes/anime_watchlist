const db = require('../config/db');

const AnimeModel = {
  findAll({ search } = {}) {
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      return db.prepare(
        `SELECT id, title, genre, episodes, release_year, image, description
         FROM anime WHERE title LIKE ? OR genre LIKE ?
         ORDER BY title ASC`
      ).all(like, like);
    }
    return db.prepare(
      `SELECT id, title, genre, episodes, release_year, image, description
       FROM anime ORDER BY title ASC`
    ).all();
  },

  findById(id) {
    return db.prepare(
      `SELECT id, title, genre, episodes, release_year, image, description, created_at
       FROM anime WHERE id = ?`
    ).get(id) || null;
  },

  findByTitle(title) {
    return db.prepare(
      'SELECT id FROM anime WHERE LOWER(title) = LOWER(?)'
    ).get(title) || null;
  },

  create({ title, genre, episodes, release_year, image, description }) {
    const result = db.prepare(
      `INSERT INTO anime (title, genre, episodes, release_year, image, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(title, genre || null, episodes || null, release_year || null, image || null, description || null);
    return AnimeModel.findById(result.lastInsertRowid);
  },

  update(id, { title, genre, episodes, release_year, image, description }) {
    db.prepare(
      `UPDATE anime SET
         title        = COALESCE(?, title),
         genre        = COALESCE(?, genre),
         episodes     = COALESCE(?, episodes),
         release_year = COALESCE(?, release_year),
         image        = COALESCE(?, image),
         description  = COALESCE(?, description),
         updated_at   = datetime('now')
       WHERE id = ?`
    ).run(title, genre, episodes, release_year, image, description, id);
    return AnimeModel.findById(id);
  },

  delete(id) {
    const result = db.prepare('DELETE FROM anime WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = AnimeModel;
