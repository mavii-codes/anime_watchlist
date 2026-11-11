<script setup>
import { QLayout, QPageContainer } from 'quasar';
import AppHeader from '../components/AppHeader.vue';
import { appStore } from '../stores/appStore';

const store = appStore;
</script>

<template>
  <q-layout view="hHh lpR fFf" class="app-shell" :class="{ 'light-theme': store.isLightTheme }">
    <AppHeader />

    <q-page-container>
      <router-view />
    </q-page-container>

    <footer class="footer">NIGHTWAVE <span>•</span> Your watchlist, your pace</footer>
    <transition name="toast"><div v-if="store.notification" class="notification" role="status">{{ store.notification }}</div></transition>
  </q-layout>
</template>
