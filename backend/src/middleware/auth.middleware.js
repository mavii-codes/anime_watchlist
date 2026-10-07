const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nightwave_fallback_secret_change_me';

/**
 * Middleware — verifies the Bearer JWT sent in the Authorization header.
 * Attaches req.user = { id, username, email } if valid.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token. Please log in.';
    return res.status(401).json({ success: false, message: msg });
  }
}

module.exports = { requireAuth };
