require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');

const authRouter      = require('./routes/auth.routes');
const animeRouter     = require('./routes/anime.routes');
const watchlistRouter = require('./routes/watchlist.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the frontend origin (Live Server, file://, etc.)
const allowed = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
  // file:// origin appears as null in some browsers — allow for local dev
  'null',
];
app.use(cors({
  origin(origin, callback) {
    // allow server-to-server (no origin) and allowed origins
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Nightwave API is running 🎵' });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/anime',     animeRouter);
app.use('/api/watchlist', watchlistRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
