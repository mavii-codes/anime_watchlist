/* ============================================================
   Nightwave — global app store
   A reactive() singleton holding the exact state and methods
   that previously lived in the root component (old main.js).
   Logic is unchanged — same services, same localStorage keys,
   same fallbacks, same toasts — only the owner moved.

   `authReady` is new: it settles once the initial session
   restore resolves, so the router guard can wait for it and
   never flash the wrong page on load.
   ============================================================ */

import { reactive } from 'vue';

import { login as apiLogin, register as apiRegister, getMe } from '../services/authService';
import {
  getWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
  setWatchlistFavorite,
  setWatchlistStatus,
} from '../services/watchlistService';
import defaults from '../data/defaultCatalogue';
import { resolveImagePath, DEFAULT_POSTER } from '../utils/image';

export const appStore = reactive({
  // ── Auth state ─────────────────────────────────────────────
  authView:     'login',   // 'login' | 'register'
  authLoading:  false,
  authError:    '',
  currentUser:  null,      // { id, username, email } when logged in
  apiAvailable: true,      // false = backend unreachable → localStorage fallback
  authReady:    false,     // true once the initial session restore has resolved

  // Auth form fields
  loginForm:    { email: '', password: '' },
  registerForm: { username: '', email: '', password: '', confirm: '' },

  // ── Watchlist — mirrors original structure exactly ─────────
  animeList: [],

  // ── UI state (identical to original) ───────────────────────
  activeFilter:  'All',
  filters:       ['All', 'Watching', 'Completed', 'Plan to Watch'],
  searchQuery:   '',
  sortBy:        'added',
  isLightTheme:  localStorage.getItem('nightwave-theme') === 'light',
  notification:  '',
  notificationTimer: null,
  newAnime: { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' },

  // ── Original component computed properties, as getters ─────
  get isLoggedIn() {
    return !!this.currentUser;
  },

  get filteredAnime() {
    const query = this.searchQuery.toLowerCase();
    const matches = this.animeList.filter(anime =>
      (this.activeFilter === 'All' || anime.status === this.activeFilter) &&
      (!query || `${anime.title} ${anime.genre}`.toLowerCase().includes(query))
    );
    return [...matches].sort((a, b) => {
      if (this.sortBy === 'title')     return a.title.localeCompare(b.title);
      if (this.sortBy === 'episodes')  return b.episodes - a.episodes;
      if (this.sortBy === 'favorites') return Number(b.isFavorite) - Number(a.isFavorite);
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
  },

  get summary() {
    return {
      total:     this.animeList.length,
      watching:  this.animeList.filter(a => a.status === 'Watching').length,
      completed: this.animeList.filter(a => a.status === 'Completed').length,
    };
  },

  // ── Auth actions (identical logic, formerly root methods) ──
  async handleLogin() {
    this.authError   = '';
    this.authLoading = true;
    try {
      const data = await apiLogin(this.loginForm);
      localStorage.setItem('nightwave-token', data.token);
      this.currentUser  = data.user;
      this.apiAvailable = true;
      this.loginForm    = { email: '', password: '' };
      await this.fetchWatchlist();
      this.showNotification(`Welcome back, ${data.user.username}! 👋`);
    } catch (err) {
      if (err.status === 0 || !err.status) {
        // Backend unreachable — allow offline use
        this.apiAvailable = false;
        this.currentUser  = { id: 0, username: 'Guest', email: '' };
        this.loadFromLocalStorage();
        this.showNotification('Offline mode — using local storage.');
      } else {
        this.authError = err.message || 'Login failed. Please try again.';
      }
    } finally {
      this.authLoading = false;
    }
  },

  async handleRegister() {
    this.authError = '';
    if (this.registerForm.password !== this.registerForm.confirm) {
      this.authError = 'Passwords do not match.';
      return;
    }
    this.authLoading = true;
    try {
      const data = await apiRegister({
        username: this.registerForm.username,
        email:    this.registerForm.email,
        password: this.registerForm.password,
      });
      localStorage.setItem('nightwave-token', data.token);
      this.currentUser  = data.user;
      this.apiAvailable = true;
      this.registerForm = { username: '', email: '', password: '', confirm: '' };
      this.animeList    = [];
      this.showNotification(`Account created! Welcome, ${data.user.username} 🎉`);
    } catch (err) {
      this.authError = err.message || 'Registration failed. Please try again.';
    } finally {
      this.authLoading = false;
    }
  },

  // Tab switcher switches the auth panel and clears any error.
  // (Same inline logic the template previously ran on every click.)
  switchAuthView(view) {
    this.authView = view;
    this.authError = '';
  },

  logout() {
    localStorage.removeItem('nightwave-token');
    this.currentUser = null;
    this.animeList   = [];
    this.showNotification('Logged out. See you next time!');
  },

  // ── Watchlist API helpers ──────────────────────────────────
  async fetchWatchlist() {
    try {
      const data = await getWatchlist();
      this.animeList = data.watchlist.map(this.mapApiItem);
    } catch (err) {
      console.warn('fetchWatchlist failed:', err.message);
      if (!this.apiAvailable) this.loadFromLocalStorage();
    }
  },

  // Map a backend watchlist row to the shape the original app expects
  mapApiItem(item) {
    return {
      id:         item.id,          // watchlist row id
      anime_id:   item.anime_id,
      title:      item.title,
      genre:      item.genre       || '',
      episodes:   item.episodes    || 0,
      image:      item.image       || DEFAULT_POSTER,
      status:     item.status,
      isFavorite: Boolean(item.isFavorite),
      dateAdded:  item.dateAdded   || item.created_at || new Date().toISOString().slice(0, 10),
    };
  },

  // ── localStorage fallback (when backend is unreachable) ────
  loadFromLocalStorage() {
    const saved = localStorage.getItem('nightwave-anime');
    this.animeList = saved
      ? JSON.parse(saved).map(a => ({
          ...a,
          dateAdded: a.dateAdded || new Date().toISOString().slice(0, 10),
          image:     a.image     || DEFAULT_POSTER,
        }))
      // Copy each entry: mutating the list must never leak into the
      // shared defaults array (which would corrupt later sessions).
      : defaults.map(a => ({ ...a }));
  },

  saveToLocalStorage() {
    localStorage.setItem('nightwave-anime', JSON.stringify(this.animeList));
  },

  // ── Add anime (original form; unchanged UX) ────────────────
  async addAnime() {
    const title = this.newAnime.title.trim();
    if (!title) return;

    if (this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0) {
      try {
        const data = await addWatchlistItem({
          title,
          genre:    this.newAnime.genre,
          episodes: Number(this.newAnime.episodes),
          image:    this.imagePath(this.newAnime.image),
          status:   this.newAnime.status,
        });
        this.animeList.unshift(this.mapApiItem(data.item));
        this.showNotification(`${title} added to your list`);
      } catch (err) {
        // Duplicate → inform user instead of silently failing
        this.showNotification(err.message || 'Could not add anime.');
        return;
      }
    } else {
      // Offline / guest fallback
      this.animeList.unshift({
        id:         Date.now(),
        title,
        genre:      this.newAnime.genre,
        episodes:   Number(this.newAnime.episodes),
        status:     this.newAnime.status,
        isFavorite: false,
        dateAdded:  new Date().toISOString().slice(0, 10),
        image:      this.imagePath(this.newAnime.image),
      });
      this.saveToLocalStorage();
      this.showNotification(`${title} added to your list`);
    }

    this.newAnime = { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' };
  },

  // ── Remove anime ───────────────────────────────────────────
  async removeAnime(id) {
    const anime = this.animeList.find(a => a.id === id);
    if (!anime) return;

    const useApi = this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0;
    if (useApi) {
      try {
        await removeWatchlistItem(id);
      } catch (err) {
        this.showNotification(err.message || 'Could not remove anime.');
        return;
      }
    }

    this.animeList = this.animeList.filter(a => a.id !== id);
    // Persist AFTER the removal so the deleted item can't come back on reload.
    if (!useApi) this.saveToLocalStorage();
    this.showNotification(`${anime.title} removed`);
  },

  // ── Toggle favorite ────────────────────────────────────────
  async toggleFavorite(id) {
    const anime = this.animeList.find(a => a.id === id);
    if (!anime) return;

    const newFav = !anime.isFavorite;

    const useApi = this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0;
    if (useApi) {
      try {
        await setWatchlistFavorite(id, newFav);
      } catch (err) {
        this.showNotification(err.message || 'Could not update favorite.');
        return;
      }
    }

    anime.isFavorite = newFav;
    // Persist AFTER the mutation so offline favorite changes survive reload.
    if (!useApi) this.saveToLocalStorage();
    this.showNotification(newFav
      ? `${anime.title} added to favorites`
      : `${anime.title} removed from favorites`
    );
  },

  // ── Change status ──────────────────────────────────────────
  async changeStatus(id, status) {
    const anime = this.animeList.find(a => a.id === id);
    if (!anime) return;

    const useApi = this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0;
    if (useApi) {
      try {
        await setWatchlistStatus(id, status);
      } catch (err) {
        this.showNotification(err.message || 'Could not update status.');
        return;
      }
    }

    anime.status = status;
    // Persist AFTER the mutation so offline status changes survive reload.
    if (!useApi) this.saveToLocalStorage();
    this.showNotification(`${anime.title} marked ${status.toLowerCase()}`);
  },

  // ── Theme / notifications (unchanged from original) ────────
  toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
    document.body.classList.toggle('light-theme', this.isLightTheme);
    localStorage.setItem('nightwave-theme', this.isLightTheme ? 'light' : 'dark');
    this.showNotification(`${this.isLightTheme ? 'Light' : 'Dark'} mode enabled`);
  },

  showNotification(message) {
    this.notification = message;
    clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => { this.notification = ''; }, 2600);
  },

  imagePath(filename) {
    return resolveImagePath(filename);
  },

  usePlaceholder(anime) {
    if (anime.image !== DEFAULT_POSTER) {
      anime.image = DEFAULT_POSTER;
      if (!this.apiAvailable) this.saveToLocalStorage();
    }
  },

  artClass(anime) { return `art-${(anime.id % 4) + 1}`; },
});

/* ── Initial session restore (formerly the mounted() hook) ─────
   Runs once at app boot; sets store.authReady when it resolves
   so the router guard can wait for the result. ───────────────── */
async function restoreSession() {
  document.body.classList.toggle('light-theme', appStore.isLightTheme);

  // Try to restore session from stored token
  const token = localStorage.getItem('nightwave-token');
  if (token) {
    try {
      const data = await getMe();
      appStore.currentUser  = data.user;
      appStore.apiAvailable = true;
      await appStore.fetchWatchlist();
    } catch (err) {
      // Token invalid/expired or backend down
      if (err.status === 401) {
        localStorage.removeItem('nightwave-token');
      } else {
        // Backend unreachable — fall back to localStorage
        appStore.apiAvailable = false;
        appStore.loadFromLocalStorage();
      }
    }
  }

  appStore.authReady = true;
}

let sessionRestore = null;

// Kick off (or join) the one-time restore; the router awaits this.
export function ensureAuthReady() {
  if (!sessionRestore) {
    sessionRestore = restoreSession();
  }
  return sessionRestore;
}
