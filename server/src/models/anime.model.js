const { pool } = require('../config/db');

const AnimeModel = {
  async findAll({ search } = {}) {
    const values = [];
    let where = '';
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      where = 'WHERE title ILIKE $1 OR genre ILIKE $1';
    }

    const result = await pool.query(
      `SELECT id, title, genre, episodes, release_year, image, description
       FROM anime ${where} ORDER BY title ASC`,
      values
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, title, genre, episodes, release_year, image, description, created_at
       FROM anime WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByTitle(title) {
    const result = await pool.query(
      'SELECT id FROM anime WHERE LOWER(title) = LOWER($1)',
      [title]
    );
    return result.rows[0] || null;
  },

  async create({ title, genre, episodes, release_year, image, description }) {
    const result = await pool.query(
      `INSERT INTO anime (title, genre, episodes, release_year, image, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [title, genre || null, episodes || null, release_year || null, image || null, description || null]
    );
    return AnimeModel.findById(result.rows[0].id);
  },

  async update(id, { title, genre, episodes, release_year, image, description }) {
    await pool.query(
      `UPDATE anime SET
         title = COALESCE($1, title),
         genre = COALESCE($2, genre),
         episodes = COALESCE($3, episodes),
         release_year = COALESCE($4, release_year),
         image = COALESCE($5, image),
         description = COALESCE($6, description),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title, genre, episodes, release_year, image, description, id]
    );
    return AnimeModel.findById(id);
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM anime WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = AnimeModel;
