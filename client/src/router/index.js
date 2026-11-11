/* ============================================================
   Nightwave — vue-router setup
   Uses hash history so static hosting works with zero server
   config. The layout ('/' + '/login') is AppLayout; every other
   path redirects home.
   ============================================================ */

import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import LoginPage from '../pages/LoginPage.vue';
import WatchlistPage from '../pages/WatchlistPage.vue';
import { appStore, ensureAuthReady } from '../stores/appStore';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '',     name: 'watchlist', component: WatchlistPage },
        { path: 'login', name: 'login', component: LoginPage },
      ],
    },

    // Unknown paths → home (its guard then picks login vs watchlist)
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

// Global navigation guard: waits for the initial session restore
// (authReady) so page loads never flash the wrong screen.
router.beforeEach(async (to) => {
  await ensureAuthReady();

  // Watchlist requires a session; login page is for guests only.
  if (to.name === 'watchlist' && !appStore.currentUser) return { path: '/login' };
  if (to.name === 'login' && appStore.currentUser) return { path: '/' };
});

export default router;
