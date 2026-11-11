<script setup>
import { appStore } from '../stores/appStore';

const store = appStore;
</script>

<!-- ── Summary counts row ─────────────────────────────────── -->
<template>
  <section class="stats-row" aria-label="Watchlist summary">
    <div class="stat-block">
      <span class="stat-value">{{ store.summary.total }}</span>
      <span class="stat-label">Total anime</span>
    </div>
    <div class="stat-block">
      <span class="stat-value">{{ store.summary.watching }}</span>
      <span class="stat-label">Watching now</span>
    </div>
    <div class="stat-block">
      <span class="stat-value">{{ store.summary.completed }}</span>
      <span class="stat-label">Completed</span>
    </div>
    <div class="stat-quote">"Every episode is a<br>small escape."</div>
  </section>
</template>
