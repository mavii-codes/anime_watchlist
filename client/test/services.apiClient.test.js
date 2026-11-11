import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiRequest } from '../src/services/apiClient';

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: () => Promise.resolve(body) };
}

describe('services/apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('attaches the Bearer token from localStorage', async () => {
    localStorage.setItem('nightwave-token', 'token-123');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/auth/me');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/me');
    expect(options.headers.Authorization).toBe('Bearer token-123');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('omits the Authorization header when there is no token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/watchlist');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('throws an Error carrying the status and server message on failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ message: 'Invalid email or password.' }, { ok: false, status: 401 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const error = await apiRequest('/auth/login', { method: 'POST' }).catch(err => err);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Invalid email or password.');
  });

  it('falls back to the unexpected-response message when the error body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });
    vi.stubGlobal('fetch', fetchMock);

    const error = await apiRequest('/watchlist').catch(err => err);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(500);
    expect(error.message).toBe('Server returned an unexpected response.');
  });

  it('resolves with the fallback shape when a successful response body is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/watchlist')).resolves.toEqual({
      success: false,
      message: 'Server returned an unexpected response.',
    });
  });
});
