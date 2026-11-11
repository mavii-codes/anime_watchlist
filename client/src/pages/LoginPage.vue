<script setup>
import { QPage } from 'quasar';
import AuthPanel from '../components/AuthPanel.vue';
</script>

<!-- ── Login page: auth panel only ────────────────────────── -->
<template>
  <q-page id="top" class="page-content">
    <AuthPanel />
  </q-page>
</template>
