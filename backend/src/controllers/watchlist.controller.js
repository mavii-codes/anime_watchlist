const WatchlistModel = require('../models/watchlist.model');
const AnimeModel     = require('../models/anime.model');

const WatchlistController = {
  async getAll(req, res, next) {
    try {
      const items = WatchlistModel.findByUser(req.user.id);
      res.json({ success: true, watchlist: items });
    } catch (err) { next(err); }
  },

  async add(req, res, next) {
    try {
      let animeId = req.body.anime_id;

      // Quick-add from Vue form: title/genre/episodes sent, no anime_id
      if (!animeId && req.body.title) {
        const { title, genre, episodes, image, release_year, description } = req.body;
        let found = AnimeModel.findByTitle(title.trim());
        if (!found) {
          found = AnimeModel.create({ title: title.trim(), genre, episodes, image, release_year, description });
        }
        animeId = found.id;
      }

      if (!animeId) {
        return res.status(400).json({ success: false, message: 'anime_id or title is required.' });
      }

      const anime = AnimeModel.findById(animeId);
      if (!anime) {
        return res.status(404).json({ success: false, message: 'Anime not found in catalogue.' });
      }

      if (WatchlistModel.findByUserAndAnime(req.user.id, animeId)) {
        return res.status(409).json({ success: false, message: `${anime.title} is already in your watchlist.` });
      }

      const item = WatchlistModel.create({
        userId:   req.user.id,
        animeId,
        status:   req.body.status   || 'Plan to Watch',
        favorite: req.body.favorite || false,
      });
      res.status(201).json({ success: true, item });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      if (!WatchlistModel.findByIdAndUser(req.params.id, req.user.id)) {
        return res.status(404).json({ success: false, message: 'Watchlist entry not found.' });
      }
      const { status, favorite } = req.body;
      const updated = WatchlistModel.update(req.params.id, req.user.id, { status, favorite });
      res.json({ success: true, item: updated });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ success: false, message: err.message });
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = WatchlistModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Watchlist entry not found.' });
      res.json({ success: true, message: 'Removed from watchlist.' });
    } catch (err) { next(err); }
  },

  async setFavorite(req, res, next) {
    try {
      const item = WatchlistModel.findByIdAndUser(req.params.id, req.user.id);
      if (!item) return res.status(404).json({ success: false, message: 'Watchlist entry not found.' });
      const favorite = req.body.favorite !== undefined ? Boolean(req.body.favorite) : !item.isFavorite;
      const updated  = WatchlistModel.update(req.params.id, req.user.id, { favorite });
      res.json({ success: true, item: updated });
    } catch (err) { next(err); }
  },

  async setStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'status is required.' });
      if (!WatchlistModel.findByIdAndUser(req.params.id, req.user.id)) {
        return res.status(404).json({ success: false, message: 'Watchlist entry not found.' });
      }
      const updated = WatchlistModel.update(req.params.id, req.user.id, { status });
      res.json({ success: true, item: updated });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ success: false, message: err.message });
      next(err);
    }
  },
};

module.exports = WatchlistController;
