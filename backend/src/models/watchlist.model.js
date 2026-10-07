const db = require('../config/db');

const VALID_STATUSES = ['Watching', 'Completed', 'Plan to Watch'];

const WatchlistModel = {
  findByUser(userId) {
    const rows = db.prepare(
      `SELECT w.id, w.anime_id, a.title, a.genre, a.episodes, a.image,
              a.release_year, w.status, w.favorite AS isFavorite,
              w.created_at AS dateAdded, w.updated_at
       FROM watchlist w
       JOIN anime a ON a.id = w.anime_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    ).all(userId);
    return rows.map(r => ({ ...r, isFavorite: r.isFavorite === 1 }));
  },

  findByIdAndUser(watchlistId, userId) {
    const row = db.prepare(
      `SELECT w.*, a.title, a.genre, a.episodes, a.image
       FROM watchlist w JOIN anime a ON a.id = w.anime_id
       WHERE w.id = ? AND w.user_id = ?`
    ).get(watchlistId, userId);
    if (!row) return null;
    return { ...row, isFavorite: row.isFavorite === 1 };
  },

  findByUserAndAnime(userId, animeId) {
    return db.prepare(
      'SELECT id FROM watchlist WHERE user_id = ? AND anime_id = ?'
    ).get(userId, animeId) || null;
  },

  create({ userId, animeId, status = 'Plan to Watch', favorite = false }) {
    if (!VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Invalid status: ${status}`), { status: 400 });
    }
    const result = db.prepare(
      `INSERT INTO watchlist (user_id, anime_id, status, favorite) VALUES (?, ?, ?, ?)`
    ).run(userId, animeId, status, favorite ? 1 : 0);
    return WatchlistModel.findByIdAndUser(result.lastInsertRowid, userId);
  },

  update(watchlistId, userId, { status, favorite }) {
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Invalid status: ${status}`), { status: 400 });
    }
    const parts = [];
    const values = [];
    if (status   !== undefined) { parts.push('status = ?');              values.push(status); }
    if (favorite !== undefined) { parts.push('favorite = ?');            values.push(favorite ? 1 : 0); }
    if (parts.length === 0) throw Object.assign(new Error('Nothing to update'), { status: 400 });

    parts.push("updated_at = datetime('now')");
    values.push(watchlistId, userId);
    db.prepare(
      `UPDATE watchlist SET ${parts.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...values);
    return WatchlistModel.findByIdAndUser(watchlistId, userId);
  },

  delete(watchlistId, userId) {
    const result = db.prepare(
      'DELETE FROM watchlist WHERE id = ? AND user_id = ?'
    ).run(watchlistId, userId);
    return result.changes > 0;
  },
};

module.exports = WatchlistModel;
