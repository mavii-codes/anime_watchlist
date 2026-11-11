const { Router } = require('express');
const WatchlistController = require('../controllers/watchlist.controller');
const { requireAuth }       = require('../middleware/auth.middleware');

// All watchlist routes require a valid JWT
const router = Router();
router.use(requireAuth);

// GET    /api/watchlist           — user's full list
router.get('/',    WatchlistController.getAll);

// POST   /api/watchlist           — add an anime
router.post('/',   WatchlistController.add);

// PUT    /api/watchlist/:id       — update status and/or favorite
router.put('/:id', WatchlistController.update);

// DELETE /api/watchlist/:id       — remove
router.delete('/:id', WatchlistController.remove);

// PUT    /api/watchlist/:id/favorite  — toggle/set favorite
router.put('/:id/favorite', WatchlistController.setFavorite);

// PUT    /api/watchlist/:id/status    — change status
router.put('/:id/status',   WatchlistController.setStatus);

module.exports = router;
