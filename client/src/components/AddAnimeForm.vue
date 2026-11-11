<script setup>
import { appStore } from '../stores/appStore';

const store = appStore;
</script>

<!-- ── Add-anime panel (original form; unchanged UX) ───────── -->
<template>
  <aside class="add-panel panel-surface">
    <div class="section-heading">
      <div>
        <p class="eyebrow">NEW ENTRY</p>
        <h2>Add to your list</h2>
      </div>
      <span class="plus-icon">+</span>
    </div>
    <form @submit.prevent="store.addAnime">
      <label for="title">Title</label>
      <input id="title" v-model.trim="store.newAnime.title" type="text" placeholder="e.g. Frieren" required>

      <label for="genre">Genre</label>
      <input id="genre" v-model.trim="store.newAnime.genre" type="text" placeholder="e.g. Fantasy" required>

      <label for="image">Poster filename <span class="optional-label">(optional)</span></label>
      <input id="image" v-model.trim="store.newAnime.image" type="text" placeholder="e.g. frieren.jpg">

      <div class="form-split">
        <div>
          <label for="episodes">Episodes</label>
          <input id="episodes" v-model.number="store.newAnime.episodes" type="number" min="1" placeholder="12" required>
        </div>
        <div>
          <label for="status">Status</label>
          <select id="status" v-model="store.newAnime.status">
            <option>Watching</option>
            <option>Completed</option>
            <option>Plan to Watch</option>
          </select>
        </div>
      </div>
      <button class="primary-button" type="submit">Add anime <span>+</span></button>
    </form>
  </aside>
</template>
