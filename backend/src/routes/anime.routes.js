const { Router } = require('express');
const { body }   = require('express-validator');
const AnimeController = require('../controllers/anime.controller');
const { requireAuth }   = require('../middleware/auth.middleware');

const router = Router();

// GET /api/anime          — public (browsing the catalogue)
router.get('/',    AnimeController.getAll);

// GET /api/anime/:id      — public
router.get('/:id', AnimeController.getOne);

// POST /api/anime         — protected (add to global catalogue)
router.post('/',
  requireAuth,
  [body('title').trim().notEmpty().withMessage('Title is required.')],
  AnimeController.create
);

// PUT /api/anime/:id      — protected
router.put('/:id',  requireAuth, AnimeController.update);

// DELETE /api/anime/:id   — protected
router.delete('/:id', requireAuth, AnimeController.remove);

module.exports = router;
