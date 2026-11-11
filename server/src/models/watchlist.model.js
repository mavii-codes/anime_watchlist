const { pool } = require('../config/db');

const VALID_STATUSES = ['Watching', 'Completed', 'Plan to Watch'];

const WatchlistModel = {
  async findByUser(userId) {
    const result = await pool.query(
      `SELECT w.id, w.anime_id, a.title, a.genre, a.episodes, a.image,
              a.release_year, w.status, w.favorite AS "isFavorite",
              w.created_at AS "dateAdded", w.updated_at
       FROM watchlist w
       JOIN anime a ON a.id = w.anime_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findByIdAndUser(watchlistId, userId) {
    const result = await pool.query(
      `SELECT w.*, w.favorite AS "isFavorite", a.title, a.genre, a.episodes, a.image
       FROM watchlist w JOIN anime a ON a.id = w.anime_id
       WHERE w.id = $1 AND w.user_id = $2`,
      [watchlistId, userId]
    );
    return result.rows[0] || null;
  },

  async findByUserAndAnime(userId, animeId) {
    const result = await pool.query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND anime_id = $2',
      [userId, animeId]
    );
    return result.rows[0] || null;
  },

  async create({ userId, animeId, status = 'Plan to Watch', favorite = false }) {
    if (!VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Invalid status: ${status}`), { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, anime_id, status, favorite)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, animeId, status, Boolean(favorite)]
    );
    return WatchlistModel.findByIdAndUser(result.rows[0].id, userId);
  },

  async update(watchlistId, userId, { status, favorite }) {
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Invalid status: ${status}`), { status: 400 });
    }
    const updates = [];
    const values = [];
    if (status !== undefined) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }
    if (favorite !== undefined) {
      values.push(Boolean(favorite));
      updates.push(`favorite = $${values.length}`);
    }
    if (updates.length === 0) {
      throw Object.assign(new Error('Nothing to update'), { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(watchlistId, userId);
    await pool.query(
      `UPDATE watchlist SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
      values
    );
    return WatchlistModel.findByIdAndUser(watchlistId, userId);
  },

  async delete(watchlistId, userId) {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE id = $1 AND user_id = $2',
      [watchlistId, userId]
    );
    return result.rowCount > 0;
  },
};

module.exports = WatchlistModel;
