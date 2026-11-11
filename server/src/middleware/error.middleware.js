/**
 * Global error handler — catches anything passed to next(err).
 * Returns a consistent JSON shape for every unhandled error.
 */
function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);

  const status = err.code === '23505'
    ? 409
    : err.status || err.statusCode || 500;
  let message = err.code === '23505'
    ? 'A record with the same unique value already exists.'
    : err.message || 'Internal server error';

  // Never leak internal error details to clients in production.
  if (process.env.NODE_ENV === 'production' && status >= 500) {
    message = 'Internal server error';
  }

  res.status(status).json({ success: false, message });
}

module.exports = { errorHandler };
