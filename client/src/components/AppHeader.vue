<script setup>
import { QBtn } from 'quasar';
import { appStore } from '../stores/appStore';

const store = appStore;

// Original behavior: a plain #top anchor jump. With hash routing a raw
// href="#top" would be parsed as a route, so we prevent the default and
// scroll to the page top ourselves.
function scrollToTop(event) {
  event.preventDefault();
  document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
}
</script>

<template>
  <header class="topbar">
    <div class="header-left">
      <a class="brand" href="#top" aria-label="Nightwave home" @click="scrollToTop">
        <span class="brand-mark">NW</span>
        <span>Nightwave</span>
      </a>
      <q-btn flat round dense class="theme-toggle" @click="store.toggleTheme" :aria-label="store.isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'" :label="store.isLightTheme ? '☾' : '☀'"></q-btn>
    </div>
    <!-- Right side: user info or login prompt -->
    <div class="topbar-right">
      <span class="topbar-note" v-if="!store.isLoggedIn">Your personal anime log</span>
      <div class="user-info" v-else>
        <span class="user-greeting">👋 {{ store.currentUser.username }}</span>
        <button class="logout-btn" @click="store.logout" title="Log out">Log out</button>
      </div>
    </div>
  </header>
</template>
