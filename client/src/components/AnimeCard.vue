<script setup>
import { appStore } from '../stores/appStore';

defineProps({
  anime: { type: Object, required: true },
});

const store = appStore;
</script>

<!-- ── Single anime card ───────────────────────────────────── -->
<template>
  <article class="anime-card" :class="{ favorite: anime.isFavorite }">
    <div class="card-topline">
      <span class="status-badge watching"  v-if="anime.status === 'Watching'">Watching</span>
      <span class="status-badge completed" v-else-if="anime.status === 'Completed'">Completed</span>
      <span class="status-badge planned"   v-else>Plan to Watch</span>
      <button class="favorite-button" :class="{ active: anime.isFavorite }" @click="store.toggleFavorite(anime.id)" :aria-label="anime.isFavorite ? 'Remove from favorites' : 'Add to favorites'">{{ anime.isFavorite ? '★' : '☆' }}</button>
    </div>
    <div class="card-art" :class="store.artClass(anime)">
      <img :src="anime.image || 'images/default.jpg'" :alt="`${anime.title} poster`" @error="store.usePlaceholder(anime)">
    </div>
    <div class="card-body">
      <h3>{{ anime.title }}</h3>
      <p>{{ anime.genre }} <span class="dot-separator">•</span> {{ anime.episodes }} episodes</p>
      <div class="card-actions">
        <select :value="anime.status" @change="store.changeStatus(anime.id, $event.target.value)" :aria-label="`Change status for ${anime.title}`">
          <option>Watching</option>
          <option>Completed</option>
          <option>Plan to Watch</option>
        </select>
        <button class="remove-button" @click="store.removeAnime(anime.id)">Remove</button>
      </div>
    </div>
  </article>
</template>
