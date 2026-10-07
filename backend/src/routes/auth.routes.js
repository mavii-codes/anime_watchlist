const { Router } = require('express');
const { body }   = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { requireAuth }  = require('../middleware/auth.middleware');

const router = Router();

// POST /api/auth/register
router.post('/register',
  [
    body('username').trim().isLength({ min: 3, max: 80 }).withMessage('Username must be 3–80 characters.'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  AuthController.register
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  AuthController.login
);

// GET /api/auth/me  (protected)
router.get('/me', requireAuth, AuthController.me);

module.exports = router;
