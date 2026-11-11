/* ============================================================
   Nightwave — main entry (slim)
   All state/actions moved to stores/appStore.js; the UI moved
   to layouts/, pages/ and components/ and is routed via vue-router.
   ============================================================ */

import { createApp } from 'vue';
import { Quasar } from 'quasar';
import 'quasar/src/css/index.sass';

import './assets/css/style.css';

import App from './App.vue';
import router from './router';
import { ensureAuthReady } from './stores/appStore';

// Start the auth-session restore that used to live in the root
// component's mounted() hook; the router guard waits for it.
ensureAuthReady();

createApp(App).use(Quasar).use(router).mount('#app');
