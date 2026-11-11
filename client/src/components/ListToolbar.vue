<script setup>
import { appStore } from '../stores/appStore';

const store = appStore;
</script>

<!-- ── Library toolbar: title, search, sort, filters ───────── -->
<template>
  <div class="list-toolbar">
    <div>
      <p class="eyebrow">YOUR LIBRARY</p>
      <h2>Anime collection <span>{{ store.filteredAnime.length }}</span></h2>
    </div>
    <div class="library-tools">
      <label class="search-box" for="search"><span aria-hidden="true">⌕</span><input id="search" v-model.trim="store.searchQuery" type="search" placeholder="Search anime..."></label>
      <select class="sort-select" v-model="store.sortBy" aria-label="Sort anime">
        <option value="added">Recently added</option>
        <option value="title">Title A-Z</option>
        <option value="episodes">Most episodes</option>
        <option value="favorites">Favorites first</option>
      </select>
    </div>
    <div class="filter-group" aria-label="Filter anime">
      <button v-for="filter in store.filters" :key="filter" class="filter-button" :class="{ active: store.activeFilter === filter }" @click="store.activeFilter = filter">{{ filter }}</button>
    </div>
  </div>
</template>
