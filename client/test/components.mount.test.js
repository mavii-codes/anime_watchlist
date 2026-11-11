import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import { appStore as store } from '../src/stores/appStore';
import AppHeader from '../src/components/AppHeader.vue';
import AuthPanel from '../src/components/AuthPanel.vue';
import StatsRow from '../src/components/StatsRow.vue';
import AnimeCard from '../src/components/AnimeCard.vue';
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

const QUASAR_STUBS = {
  'q-btn': true,
  'q-layout': true,
  'q-page': true,
  'q-page-container': true,
  transition: true,
  'transition-group': true,
};

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
  store.newAnime = { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' };
  localStorage.clear();
  vi.clearAllMocks();
}

function mountWithStubs(component, options = {}) {
  return mount(component, {
    ...options,
    global: {
      ...(options.global || {}),
      stubs: QUASAR_STUBS,
    },
  });
}

function buttonByText(wrapper, label) {
  const button = wrapper.findAll('button').find(node => node.text() === label);
  expect(button, `expected a button labelled "${label}"`).toBeTruthy();
  return button;
}

function makeAnime(overrides = {}) {
  return {
    id: 1,
    title: 'Frieren',
    genre: 'Fantasy',
    episodes: 28,
    status: 'Watching',
    isFavorite: false,
    image: 'images/frieren.jpg',
    dateAdded: '2026-01-01',
    ...overrides,
  };
}

beforeEach(resetStore);

describe('AppHeader', () => {
  it('shows the brand and the login prompt when logged out', () => {
    const wrapper = mountWithStubs(AppHeader);

    expect(wrapper.find('.brand').text()).toContain('Nightwave');
    expect(wrapper.text()).toContain('Your personal anime log');
    expect(wrapper.find('.user-info').exists()).toBe(false);
  });

  it('greets the user and logs out when the button is clicked', async () => {
    store.currentUser = { id: 1, username: 'neo', email: 'n@e.com' };
    localStorage.setItem('nightwave-token', 'jwt.a.b');
    const logoutSpy = vi.spyOn(store, 'logout');

    const wrapper = mountWithStubs(AppHeader);

    expect(wrapper.find('.user-greeting').text()).toContain('neo');
    const logoutButton = wrapper.find('.logout-btn');
    expect(logoutButton.text()).toBe('Log out');

    await logoutButton.trigger('click');

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('nightwave-token')).toBeNull();
    expect(store.currentUser).toBeNull();
    expect(wrapper.text()).toContain('Your personal anime log');

    logoutSpy.mockRestore();
  });
});

describe('AuthPanel', () => {
  it('renders the login form by default', () => {
    const wrapper = mountWithStubs(AuthPanel);

    expect(wrapper.find('#login-email').exists()).toBe(true);
    expect(wrapper.find('#login-password').exists()).toBe(true);
    expect(wrapper.find('#reg-username').exists()).toBe(false);
  });

  it('switches to register and back while clearing auth errors', async () => {
    store.authError = 'Previous failure';
    const wrapper = mountWithStubs(AuthPanel);

    await buttonByText(wrapper, 'Register').trigger('click');

    expect(store.authView).toBe('register');
    expect(store.authError).toBe('');
    expect(wrapper.find('#reg-username').exists()).toBe(true);
    expect(wrapper.find('#login-email').exists()).toBe(false);
    expect(wrapper.find('.auth-error').exists()).toBe(false);

    await buttonByText(wrapper, 'Log In').trigger('click');

    expect(store.authView).toBe('login');
    expect(wrapper.find('#login-email').exists()).toBe(true);
    expect(wrapper.find('#reg-username').exists()).toBe(false);
  });

  it('submits the login form through the real store', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt.a.b',
      user: { id: 1, username: 'neo', email: 'n@e.com' },
    });
    watchlistService.getWatchlist.mockResolvedValue({ watchlist: [] });
    store.loginForm = { email: 'neo@example.com', password: 'secret' };

    const wrapper = mountWithStubs(AuthPanel);
    await wrapper.find('form.auth-form').trigger('submit');
    await flushPromises();

    expect(authService.login).toHaveBeenCalledWith({ email: 'neo@example.com', password: 'secret' });
    expect(localStorage.getItem('nightwave-token')).toBe('jwt.a.b');
    expect(store.currentUser).toEqual({ id: 1, username: 'neo', email: 'n@e.com' });
    expect(watchlistService.getWatchlist).toHaveBeenCalledTimes(1);
  });
});

describe('StatsRow', () => {
  it('renders the summary counts', () => {
    store.animeList = [
      makeAnime({ id: 1, title: 'A', status: 'Watching' }),
      makeAnime({ id: 2, title: 'B', status: 'Completed' }),
      makeAnime({ id: 3, title: 'C', status: 'Plan to Watch' }),
    ];

    const wrapper = mountWithStubs(StatsRow);

    expect(wrapper.findAll('.stat-value').map(node => node.text())).toEqual(['3', '1', '1']);
    expect(wrapper.text()).toContain('Total anime');
    expect(wrapper.text()).toContain('Watching now');
    expect(wrapper.text()).toContain('Completed');
  });
});

describe('AnimeCard', () => {
  function mountCard(overrides = {}) {
    store.currentUser = { id: 1, username: 'neo', email: 'n@e.com' };
    store.apiAvailable = true;
    store.animeList = [makeAnime(overrides)];
    return mountWithStubs(AnimeCard, { props: { anime: store.animeList[0] } });
  }

  it('renders the title, status badge and favorite state', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Frieren');
    expect(wrapper.text()).toContain('Fantasy');
    expect(wrapper.find('.status-badge').text()).toBe('Watching');
    expect(wrapper.find('.favorite-button').attributes('aria-label')).toBe('Add to favorites');
    expect(wrapper.find('.favorite-button').text()).toBe('☆');
  });

  it('marks the anime as favorite through the store', async () => {
    watchlistService.setWatchlistFavorite.mockResolvedValue({});
    const wrapper = mountCard();

    await wrapper.find('.favorite-button').trigger('click');
    await flushPromises();

    expect(watchlistService.setWatchlistFavorite).toHaveBeenCalledWith(1, true);
    expect(store.animeList[0].isFavorite).toBe(true);
    expect(wrapper.find('.favorite-button').attributes('aria-label')).toBe('Remove from favorites');
    expect(wrapper.find('.favorite-button').text()).toBe('★');
  });

  it('removes the anime through the store when Remove is clicked', async () => {
    watchlistService.removeWatchlistItem.mockResolvedValue({});
    const wrapper = mountCard();
    const removeSpy = vi.spyOn(store, 'removeAnime');

    await wrapper.find('.remove-button').trigger('click');
    await flushPromises();

    expect(removeSpy).toHaveBeenCalledWith(1);
    expect(watchlistService.removeWatchlistItem).toHaveBeenCalledWith(1);
    expect(store.animeList).toHaveLength(0);

    removeSpy.mockRestore();
  });
});
