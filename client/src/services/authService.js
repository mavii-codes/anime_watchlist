import { apiRequest } from './apiClient';

/**
 * Auth service — thin wrappers around the /api/auth endpoints.
 * Each resolves with the parsed JSON response or throws an Error
 * with an attached `status` (see apiRequest).
 */
export function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiRequest('/auth/me');
}
