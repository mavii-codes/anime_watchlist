process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const test = require('node:test');
const assert = require('node:assert');

if (!process.env.DATABASE_URL) {
  test('Nightwave API integration suite', {
    skip: 'DATABASE_URL is not set — skipping database-backed integration tests.',
  }, () => {});
} else {
  const app = require('../src/app');
  const { pool } = require('../src/config/db');

  const stamp = Date.now();
  const username = `testgw${stamp}`;
  const email = `testgw-${stamp}@example.com`;
  const password = 'testgw-pass-123';
  const animeTitle = `TESTGW-${stamp} Frieren`;

  test.describe('Nightwave API integration', () => {
    let server;
    let baseUrl;
    let token;
    let itemId;

    async function api(path, options = {}) {
      const response = await fetch(`${baseUrl}${path}`, options);
      let body = null;
      try {
        body = await response.json();
      } catch {
        // non-JSON response — leave body as null
      }
      return { status: response.status, body };
    }

    function jsonRequest(method, payload, bearerToken) {
      const headers = { 'Content-Type': 'application/json' };
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
      return { method, headers, body: JSON.stringify(payload) };
    }

    test.before(async () => {
      await new Promise((resolve, reject) => {
        server = app.listen(0, resolve);
        server.on('error', reject);
      });
      baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    test.after(async () => {
      await pool.query("DELETE FROM users WHERE email LIKE 'testgw-%'");
      await pool.query("DELETE FROM anime WHERE title LIKE 'TESTGW-%'");
      if (server) {
        await new Promise((resolve) => {
          server.close(resolve);
          if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
        });
      }
      await pool.end();
    });

    test.it('GET /api/health returns success true', async () => {
      const res = await api('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    test.it('POST /api/auth/register creates a user and returns a JWT', async () => {
      const res = await api('/api/auth/register', jsonRequest('POST', { username, email, password }));
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.token.split('.').length, 3);
      token = res.body.token;
    });

    test.it('duplicate registration returns 409', async () => {
      const res = await api('/api/auth/register', jsonRequest('POST', { username, email, password }));
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    test.it('GET /api/auth/me returns the current user with a valid token', async () => {
      const res = await api('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, email);
    });

    test.it('GET /api/auth/me without a token returns 401', async () => {
      const res = await api('/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test.it('GET /api/auth/me with a garbage token returns 401', async () => {
      const res = await api('/api/auth/me', {
        headers: { Authorization: 'Bearer garbage.token.value' },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test.it('POST /api/watchlist adds an anime to the watchlist', async () => {
      const res = await api('/api/watchlist', jsonRequest('POST', {
        title: animeTitle,
        genre: 'Fantasy',
        episodes: 28,
        status: 'Watching',
      }, token));
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.item.id);
      assert.strictEqual(res.body.item.status, 'Watching');
      itemId = res.body.item.id;
    });

    test.it('adding the same anime twice returns 409', async () => {
      const res = await api('/api/watchlist', jsonRequest('POST', {
        title: animeTitle,
        genre: 'Fantasy',
        episodes: 28,
        status: 'Watching',
      }, token));
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    test.it('GET /api/watchlist returns exactly one item', async () => {
      const res = await api('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.watchlist.length, 1);
      assert.strictEqual(res.body.watchlist[0].title, animeTitle);
    });

    test.it('PUT /api/watchlist/:id/status updates the status', async () => {
      const res = await api(`/api/watchlist/${itemId}/status`, jsonRequest('PUT', {
        status: 'Completed',
      }, token));
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.item.status, 'Completed');
    });

    test.it('PUT /api/watchlist/:id/favorite marks the item as favorite', async () => {
      const res = await api(`/api/watchlist/${itemId}/favorite`, jsonRequest('PUT', {
        favorite: true,
      }, token));
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.item.isFavorite, true);
    });

    test.it('PUT /api/watchlist/:id/status rejects an invalid status', async () => {
      const res = await api(`/api/watchlist/${itemId}/status`, jsonRequest('PUT', {
        status: 'Dropped',
      }, token));
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test.it('DELETE /api/watchlist/:id removes the item', async () => {
      const res = await api(`/api/watchlist/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    test.it('GET /api/watchlist is empty after deletion', async () => {
      const res = await api('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body.watchlist, []);
    });

    test.it('POST /api/auth/login returns a JWT for valid credentials', async () => {
      const res = await api('/api/auth/login', jsonRequest('POST', { email, password }));
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.token.split('.').length, 3);
    });

    test.it('POST /api/auth/login rejects a wrong password', async () => {
      const res = await api('/api/auth/login', jsonRequest('POST', { email, password: 'wrong-password' }));
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test.it('GET /api/anime returns at least 18 seeded rows', async () => {
      const res = await api('/api/anime');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.anime));
      assert.ok(res.body.anime.length >= 18, `expected >= 18 anime, got ${res.body.anime.length}`);
    });
  });
}
