process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

const { requireAuth } = require('../src/middleware/auth.middleware');
const { errorHandler } = require('../src/middleware/error.middleware');

const JWT_SECRET = process.env.JWT_SECRET || 'nightwave_fallback_secret_change_me';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function runErrorHandler(err, env = 'test') {
  const originalEnv = process.env.NODE_ENV;
  const originalError = console.error;
  process.env.NODE_ENV = env;
  console.error = () => {};
  const res = mockRes();
  try {
    errorHandler(err, {}, res, () => {});
  } finally {
    console.error = originalError;
    process.env.NODE_ENV = originalEnv;
  }
  return res;
}

test.describe('requireAuth middleware', () => {
  test.it('rejects a request with no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { success: false, message: 'No token provided. Please log in.' });
    assert.strictEqual(nextCalled, false);
  });

  test.it('rejects a non-Bearer Authorization header', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(nextCalled, false);
  });

  test.it('rejects a garbage token', () => {
    const req = { headers: { authorization: 'Bearer this-is-not-a-jwt' } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(nextCalled, false);
  });

  test.it('rejects an expired token with the session-expired message', () => {
    const token = jwt.sign({ id: 1, username: 'expired' }, JWT_SECRET, { expiresIn: '-10s' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { success: false, message: 'Session expired. Please log in again.' });
    assert.strictEqual(nextCalled, false);
  });

  test.it('accepts a valid token, calls next() and populates req.user', () => {
    const payload = { id: 42, username: 'tester', email: 'tester@example.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.body, null);
    assert.strictEqual(req.user.id, payload.id);
    assert.strictEqual(req.user.username, payload.username);
    assert.strictEqual(req.user.email, payload.email);
  });
});

test.describe('errorHandler middleware', () => {
  test.it('maps PostgreSQL unique violations (23505) to 409', () => {
    const err = Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
    const res = runErrorHandler(err);

    assert.strictEqual(res.statusCode, 409);
    assert.deepStrictEqual(res.body, {
      success: false,
      message: 'A record with the same unique value already exists.',
    });
  });

  test.it('passes through err.status and err.message for 4xx errors', () => {
    const err = Object.assign(new Error('Invalid status: Dropped'), { status: 400 });
    const res = runErrorHandler(err);

    assert.strictEqual(res.statusCode, 400);
    assert.deepStrictEqual(res.body, { success: false, message: 'Invalid status: Dropped' });
  });

  test.it('exposes the error message for generic 500s outside production', () => {
    const err = new Error('Database connection failed');
    const res = runErrorHandler(err, 'development');

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { success: false, message: 'Database connection failed' });
  });

  test.it('sanitizes generic 500s in production', () => {
    const err = new Error('Database connection failed');
    const res = runErrorHandler(err, 'production');

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(res.body, { success: false, message: 'Internal server error' });
  });
});
