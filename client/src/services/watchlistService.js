import { apiRequest } from './apiClient';

/**
 * Watchlist service — thin wrappers around the /api/watchlist endpoints.
 * All routes require a valid JWT (attached by apiRequest).
 */
export function getWatchlist() {
  return apiRequest('/watchlist');
}

export function addWatchlistItem(payload) {
  return apiRequest('/watchlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeWatchlistItem(id) {
  return apiRequest(`/watchlist/${id}`, { method: 'DELETE' });
}

export function setWatchlistFavorite(id, favorite) {
  return apiRequest(`/watchlist/${id}/favorite`, {
    method: 'PUT',
    body: JSON.stringify({ favorite }),
  });
}

export function setWatchlistStatus(id, status) {
  return apiRequest(`/watchlist/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
