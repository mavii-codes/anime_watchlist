/* ============================================================
   Nightwave — updated app.js
   Original Vue.js logic fully preserved.
   Changes: localStorage persistence replaced with API calls;
   auth state (login/register) added around the existing UI.
   ============================================================ */

const { createApp } = Vue;

// ── API base URL ──────────────────────────────────────────────
// Adjust this if your backend runs on a different port/host.
const API_BASE = 'http://localhost:3001/api';

// ── Helpers ───────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('nightwave-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, message: 'Server returned an unexpected response.' }));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status });
  return data;
}

// ── Default catalogue (used when API is unreachable) ──────────
const defaults = [
  ['Fullmetal Alchemist: Brotherhood', 'Adventure',   64, 'Completed',     true,  'alchemist.jpg'],
  ['The Apothecary Diaries',           'Mystery',      48, 'Watching',      true,  'apothecary.jpg'],
  ['Attack on Titan',                  'Action',       89, 'Completed',     false, 'attackontitan.jpg'],
  ['Bleach',                           'Supernatural', 366,'Plan to Watch', false, 'bleach.jpg'],
  ['Dandadan',                         'Sci-fi',       12, 'Watching',      true,  'dandadan.jpg'],
  ['Demon Slayer',                     'Fantasy',      55, 'Completed',     false, 'demonslayer.jpg'],
  ['Dragon Ball',                      'Action',       153,'Plan to Watch', false, 'dragonball.jpg'],
  ['Delicious in Dungeon',             'Adventure',    24, 'Plan to Watch', false, 'dungeon.jpg'],
  ["Frieren: Beyond Journey's End",    'Fantasy',      28, 'Watching',      true,  'frieren.jpg'],
  ['Inuyasha',                         'Romance',      167,'Plan to Watch', false, 'inuyasha.jpg'],
  ['Jujutsu Kaisen',                   'Supernatural', 47, 'Completed',     false, 'jujutsu.jpg'],
  ['Mob Psycho 100',                   'Action',       37, 'Completed',     true,  'mob.jpg'],
  ['One Piece',                        'Adventure',    1122,'Watching',     true,  'onepiece.jpg'],
  ['I Want to Eat Your Pancreas',      'Drama',        1,  'Completed',     false, 'pancreas.jpg'],
  ['Rent-a-Girlfriend',               'Romance',      36, 'Plan to Watch', false, 'rentagirlfriend.jpg'],
  ['One Punch Man',                    'Comedy',       24, 'Watching',      false, 'saitama.jpg'],
  ['Solo Leveling',                    'Action',       25, 'Completed',     false, 'solo leveling.jpg'],
  ['Yumeko Jabami',                    'Psychological',24, 'Plan to Watch', false, 'yuma.jpg'],
].map((item, index) => ({
  id:         index + 1,
  title:      item[0],
  genre:      item[1],
  episodes:   item[2],
  status:     item[3],
  isFavorite: item[4],
  dateAdded:  `2026-0${(index % 3) + 1}-${String(index + 5).padStart(2, '0')}`,
  image:      `images/${item[5]}`,
}));

createApp({
  // ─────────────────────────────────────────────────────────────
  data() {
    return {
      // Auth state
      authView:     'login',   // 'login' | 'register'
      authLoading:  false,
      authError:    '',
      currentUser:  null,      // { id, username, email } when logged in
      apiAvailable: true,      // false = backend unreachable → localStorage fallback

      // Auth form fields
      loginForm:    { email: '', password: '' },
      registerForm: { username: '', email: '', password: '', confirm: '' },

      // Watchlist — mirrors original structure exactly
      animeList: [],

      // UI state (identical to original)
      activeFilter:  'All',
      filters:       ['All', 'Watching', 'Completed', 'Plan to Watch'],
      searchQuery:   '',
      sortBy:        'added',
      isLightTheme:  localStorage.getItem('nightwave-theme') === 'light',
      notification:  '',
      notificationTimer: null,
      newAnime: { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' },
    };
  },

  // ─────────────────────────────────────────────────────────────
  async mounted() {
    document.body.classList.toggle('light-theme', this.isLightTheme);

    // Try to restore session from stored token
    const token = localStorage.getItem('nightwave-token');
    if (token) {
      try {
        const data = await apiRequest('/auth/me');
        this.currentUser  = data.user;
        this.apiAvailable = true;
        await this.fetchWatchlist();
      } catch (err) {
        // Token invalid/expired or backend down
        if (err.status === 401) {
          localStorage.removeItem('nightwave-token');
        } else {
          // Backend unreachable — fall back to localStorage
          this.apiAvailable = false;
          this.loadFromLocalStorage();
        }
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  computed: {
    isLoggedIn() { return !!this.currentUser; },

    filteredAnime() {
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

    summary() {
      return {
        total:     this.animeList.length,
        watching:  this.animeList.filter(a => a.status === 'Watching').length,
        completed: this.animeList.filter(a => a.status === 'Completed').length,
      };
    },
  },

  // ─────────────────────────────────────────────────────────────
  methods: {
    // ── Auth ────────────────────────────────────────────────────
    async handleLogin() {
      this.authError   = '';
      this.authLoading = true;
      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body:   JSON.stringify(this.loginForm),
        });
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
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body:   JSON.stringify({
            username: this.registerForm.username,
            email:    this.registerForm.email,
            password: this.registerForm.password,
          }),
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

    logout() {
      localStorage.removeItem('nightwave-token');
      this.currentUser = null;
      this.animeList   = [];
      this.showNotification('Logged out. See you next time!');
    },

    // ── Watchlist API helpers ───────────────────────────────────
    async fetchWatchlist() {
      try {
        const data    = await apiRequest('/watchlist');
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
        image:      item.image       || 'images/default.jpg',
        status:     item.status,
        isFavorite: Boolean(item.isFavorite),
        dateAdded:  item.dateAdded   || item.created_at || new Date().toISOString().slice(0, 10),
      };
    },

    // ── localStorage fallback (when backend is unreachable) ─────
    loadFromLocalStorage() {
      const saved = localStorage.getItem('nightwave-anime');
      this.animeList = saved
        ? JSON.parse(saved).map(a => ({
            ...a,
            dateAdded: a.dateAdded || new Date().toISOString().slice(0, 10),
            image:     a.image     || 'images/default.jpg',
          }))
        : defaults;
    },

    saveToLocalStorage() {
      localStorage.setItem('nightwave-anime', JSON.stringify(this.animeList));
    },

    // ── Add anime (original form; unchanged UX) ─────────────────
    async addAnime() {
      const title = this.newAnime.title.trim();
      if (!title) return;

      if (this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0) {
        try {
          const data = await apiRequest('/watchlist', {
            method: 'POST',
            body:   JSON.stringify({
              title,
              genre:    this.newAnime.genre,
              episodes: Number(this.newAnime.episodes),
              image:    this.imagePath(this.newAnime.image),
              status:   this.newAnime.status,
            }),
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

    // ── Remove anime ────────────────────────────────────────────
    async removeAnime(id) {
      const anime = this.animeList.find(a => a.id === id);
      if (!anime) return;

      if (this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0) {
        try {
          await apiRequest(`/watchlist/${id}`, { method: 'DELETE' });
        } catch (err) {
          this.showNotification(err.message || 'Could not remove anime.');
          return;
        }
      } else {
        this.saveToLocalStorage();
      }

      this.animeList = this.animeList.filter(a => a.id !== id);
      this.showNotification(`${anime.title} removed`);
    },

    // ── Toggle favorite ─────────────────────────────────────────
    async toggleFavorite(id) {
      const anime = this.animeList.find(a => a.id === id);
      if (!anime) return;

      const newFav = !anime.isFavorite;

      if (this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0) {
        try {
          await apiRequest(`/watchlist/${id}/favorite`, {
            method: 'PUT',
            body:   JSON.stringify({ favorite: newFav }),
          });
        } catch (err) {
          this.showNotification(err.message || 'Could not update favorite.');
          return;
        }
      } else {
        this.saveToLocalStorage();
      }

      anime.isFavorite = newFav;
      this.showNotification(newFav
        ? `${anime.title} added to favorites`
        : `${anime.title} removed from favorites`
      );
    },

    // ── Change status ───────────────────────────────────────────
    async changeStatus(id, status) {
      const anime = this.animeList.find(a => a.id === id);
      if (!anime) return;

      if (this.apiAvailable && this.isLoggedIn && this.currentUser.id !== 0) {
        try {
          await apiRequest(`/watchlist/${id}/status`, {
            method: 'PUT',
            body:   JSON.stringify({ status }),
          });
        } catch (err) {
          this.showNotification(err.message || 'Could not update status.');
          return;
        }
      } else {
        this.saveToLocalStorage();
      }

      anime.status = status;
      this.showNotification(`${anime.title} marked ${status.toLowerCase()}`);
    },

    // ── Theme / notifications (unchanged from original) ─────────
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
      const clean = (filename || '').trim();
      return clean
        ? (clean.startsWith('images/') ? clean : `images/${clean}`)
        : 'images/default.jpg';
    },

    usePlaceholder(anime) {
      if (anime.image !== 'images/default.jpg') {
        anime.image = 'images/default.jpg';
        if (!this.apiAvailable) this.saveToLocalStorage();
      }
    },

    artClass(anime) { return `art-${(anime.id % 4) + 1}`; },
  },
}).mount('#app');