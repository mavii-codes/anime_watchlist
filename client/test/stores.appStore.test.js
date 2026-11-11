import { describe, it, expect, beforeEach, vi } from 'vitest';

import { appStore as store, ensureAuthReady } from '../src/stores/appStore';
import * as authService from '../src/services/authService';
import * as watchlistService from '../src/services/watchlistService';

vi.mock('../src/services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('../src/services/watchlistService', () => ({
  getWatchlist: vi.fn(),
  addWatchlistItem: vi.fn(),
  removeWatchlistItem: vi.fn(),
  setWatchlistFavorite: vi.fn(),
  setWatchlistStatus: vi.fn(),
}));

const DEFAULT_NEW_ANIME = { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' };

const ONLINE_USER = { id: 1, username: 'neo', email: 'n@e.com' };

function sampleAnime(overrides = {}) {
  return {
    id: 5,
    title: 'T',
    genre: '',
    episodes: 1,
    status: 'Watching',
    isFavorite: false,
    image: 'images/default.jpg',
    dateAdded: '2026-01-01',
    ...overrides,
  };
}

function resetStore() {
  clearTimeout(store.notificationTimer);
  store.authView = 'login';
  store.authLoading = false;
  store.authError = '';
  store.currentUser = null;
  store.apiAvailable = true;
  store.authReady = false;
  store.loginForm = { email: '', password: '' };
  store.registerForm = { username: '', email: '', password: '', confirm: '' };
  store.animeList = [];
  store.activeFilter = 'All';
  store.searchQuery = '';
  store.sortBy = 'added';
  store.notification = '';
  store.notificationTimer = null;
  store.newAnime = { ...DEFAULT_NEW_ANIME };
  localStorage.clear();
  vi.clearAllMocks();
}

beforeEach(resetStore);

describe('appStore auth actions', () => {
  it('handleLogin stores the token, sets the user, clears the form and fetches the list', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt.a.b',
      user: { id: 1, username: 'neo', email: 'n@e.com' },
    });
    watchlistService.getWatchlist.mockResolvedValue({ watchlist: [] });
    store.loginForm = { email: 'neo@example.com', password: 'secret' };

    await store.handleLogin();

    expect(localStorage.getItem('nightwave-token')).toBe('jwt.a.b');
    expect(store.currentUser).toEqual({ id: 1, username: 'neo', email: 'n@e.com' });
    expect(store.loginForm).toEqual({ email: '', password: '' });
    expect(watchlistService.getWatchlist).toHaveBeenCalledTimes(1);
    expect(store.notification).toBe('Welcome back, neo! 👋');
  });

  it('handleLogin falls back to guest offline mode on network failure', async () => {
    authService.login.mockRejectedValue(new Error('boom'));

    await store.handleLogin();

    expect(store.apiAvailable).toBe(false);
    expect(store.currentUser).toEqual({ id: 0, username: 'Guest', email: '' });
    expect(store.notification).toBe('Offline mode — using local storage.');
  });

  it('handleLogin surfaces the server message on a 401 and keeps the user logged out', async () => {
    authService.login.mockRejectedValue(
      Object.assign(new Error('Invalid email or password.'), { status: 401 })
    );

    await store.handleLogin();

    expect(store.authError).toBe('Invalid email or password.');
    expect(store.currentUser).toBeNull();
  });

  it('handleRegister rejects mismatched passwords without calling the API', async () => {
    store.registerForm = { username: 'neo', email: 'n@e.com', password: 'one', confirm: 'two' };

    await store.handleRegister();

    expect(store.authError).toBe('Passwords do not match.');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('handleRegister stores the token and resets registration state', async () => {
    authService.register.mockResolvedValue({
      token: 'jwt.c.d',
      user: { id: 2, username: 'trinity', email: 't@e.com' },
    });
    store.registerForm = { username: 'trinity', email: 't@e.com', password: 'secret', confirm: 'secret' };
    store.animeList = [sampleAnime({ id: 42, title: 'Old' })];

    await store.handleRegister();

    expect(localStorage.getItem('nightwave-token')).toBe('jwt.c.d');
    expect(store.currentUser).toEqual({ id: 2, username: 'trinity', email: 't@e.com' });
    expect(store.registerForm).toEqual({ username: '', email: '', password: '', confirm: '' });
    expect(store.animeList).toEqual([]);
    expect(store.notification).toBe('Account created! Welcome, trinity 🎉');
  });

  it('logout clears the token, user and list', () => {
    store.currentUser = { ...ONLINE_USER };
    localStorage.setItem('nightwave-token', 'jwt.a.b');
    store.animeList = [sampleAnime({ id: 1, title: 'X' })];

    store.logout();

    expect(localStorage.getItem('nightwave-token')).toBeNull();
    expect(store.currentUser).toBeNull();
    expect(store.animeList).toEqual([]);
    expect(store.notification).toBe('Logged out. See you next time!');
  });

  it('switchAuthView changes the tab and clears any error', () => {
    store.authError = 'x';

    store.switchAuthView('register');

    expect(store.authView).toBe('register');
    expect(store.authError).toBe('');
  });
});

describe('appStore watchlist actions', () => {
  it('addAnime posts to the API and maps the response when online', async () => {
    store.currentUser = { ...ONLINE_USER };
    store.apiAvailable = true;
    store.newAnime = { title: 'X', genre: 'G', image: '', episodes: 12, status: 'Watching' };
    watchlistService.addWatchlistItem.mockResolvedValue({
      item: {
        id: 9,
        anime_id: 4,
        title: 'X',
        genre: 'G',
        episodes: 12,
        image: null,
        status: 'Watching',
        isFavorite: false,
        dateAdded: '2026-01-01',
      },
    });

    await store.addAnime();

    expect(watchlistService.addWatchlistItem).toHaveBeenCalledTimes(1);
    expect(store.animeList[0].title).toBe('X');
    expect(store.animeList[0].image).toBe('images/default.jpg');
    expect(store.newAnime).toEqual(DEFAULT_NEW_ANIME);
    expect(store.notification).toBe('X added to your list');
  });

  it('addAnime surfaces duplicate errors without mutating the list or form', async () => {
    store.currentUser = { ...ONLINE_USER };
    store.newAnime = { title: 'X', genre: 'G', image: '', episodes: 12, status: 'Watching' };
    watchlistService.addWatchlistItem.mockRejectedValue(
      Object.assign(new Error('X is already in your watchlist.'), { status: 409 })
    );

    await store.addAnime();

    expect(store.notification).toBe('X is already in your watchlist.');
    expect(store.animeList).toEqual([]);
    expect(store.newAnime.title).toBe('X');
    expect(store.newAnime.genre).toBe('G');
  });

  it('addAnime falls back to localStorage for guest/offline users', async () => {
    store.currentUser = { id: 0, username: 'Guest', email: '' };
    store.newAnime = { title: 'Offline Show', genre: 'Drama', image: '', episodes: 3, status: 'Plan to Watch' };
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1712345678901);

    await store.addAnime();

    const saved = JSON.parse(localStorage.getItem('nightwave-anime'));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      id: 1712345678901,
      title: 'Offline Show',
      genre: 'Drama',
      episodes: 3,
      status: 'Plan to Watch',
      image: 'images/default.jpg',
    });
    expect(store.animeList[0].id).toBe(1712345678901);
    expect(watchlistService.addWatchlistItem).not.toHaveBeenCalled();

    nowSpy.mockRestore();
  });

  it('toggleFavorite syncs both directions with the API and notifies', async () => {
    store.currentUser = { ...ONLINE_USER };
    store.animeList = [sampleAnime()];
    watchlistService.setWatchlistFavorite.mockResolvedValue({});

    await store.toggleFavorite(5);

    expect(watchlistService.setWatchlistFavorite).toHaveBeenNthCalledWith(1, 5, true);
    expect(store.animeList[0].isFavorite).toBe(true);
    expect(store.notification).toBe('T added to favorites');

    await store.toggleFavorite(5);

    expect(watchlistService.setWatchlistFavorite).toHaveBeenNthCalledWith(2, 5, false);
    expect(store.animeList[0].isFavorite).toBe(false);
    expect(store.notification).toBe('T removed from favorites');
  });

  it('changeStatus syncs with the API and notifies with the lowercased status', async () => {
    store.currentUser = { ...ONLINE_USER };
    store.animeList = [sampleAnime()];
    watchlistService.setWatchlistStatus.mockResolvedValue({});

    await store.changeStatus(5, 'Completed');

    expect(watchlistService.setWatchlistStatus).toHaveBeenCalledWith(5, 'Completed');
    expect(store.animeList[0].status).toBe('Completed');
    expect(store.notification).toBe('T marked completed');
  });

  it('mapApiItem normalizes backend rows', () => {
    const mapped = store.mapApiItem({
      id: 1,
      anime_id: 2,
      title: 'A',
      genre: null,
      episodes: null,
      image: null,
      status: 'Watching',
      isFavorite: 1,
    });

    expect(mapped).toEqual({
      id: 1,
      anime_id: 2,
      title: 'A',
      genre: '',
      episodes: 0,
      image: 'images/default.jpg',
      status: 'Watching',
      isFavorite: true,
      dateAdded: expect.any(String),
    });
  });
});

describe('appStore derived list view', () => {
  const list = [
    sampleAnime({ id: 1, title: 'Beta Show', genre: 'Fantasy', episodes: 12, status: 'Watching', dateAdded: '2026-03-01' }),
    sampleAnime({ id: 2, title: 'Alpha Show', genre: 'Action', episodes: 24, status: 'Completed', isFavorite: true, dateAdded: '2026-02-01' }),
    sampleAnime({ id: 3, title: 'Gamma Show', genre: 'Drama', episodes: 6, status: 'Plan to Watch', dateAdded: '2026-01-01' }),
  ];

  it('computes summary counts from the anime list', () => {
    store.animeList = list;

    expect(store.summary).toEqual({ total: 3, watching: 1, completed: 1 });
  });

  it('filters by case-insensitive search across title and genre', () => {
    store.animeList = list;

    store.searchQuery = 'ALPHA';
    expect(store.filteredAnime.map(a => a.id)).toEqual([2]);

    store.searchQuery = 'fant';
    expect(store.filteredAnime.map(a => a.id)).toEqual([1]);
  });

  it('filters by active status tab', () => {
    store.animeList = list;
    store.activeFilter = 'Completed';

    expect(store.filteredAnime.map(a => a.id)).toEqual([2]);
  });

  it('sorts alphabetically when sortBy is title', () => {
    store.animeList = list;
    store.sortBy = 'title';

    expect(store.filteredAnime.map(a => a.title)).toEqual([
      'Alpha Show',
      'Beta Show',
      'Gamma Show',
    ]);
  });
});

describe('ensureAuthReady', () => {
  it('resolves the one-time session restore when no token is stored', async () => {
    await ensureAuthReady();

    expect(store.authReady).toBe(true);
    expect(authService.getMe).not.toHaveBeenCalled();
  });
});
