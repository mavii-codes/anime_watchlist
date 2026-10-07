/**
 * Global error handler — catches anything passed to next(err).
 * Returns a consistent JSON shape for every unhandled error.
 */
function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ success: false, message });
}

module.exports = { errorHandler };
