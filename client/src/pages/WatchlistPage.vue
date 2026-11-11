<script setup>
import { QPage } from 'quasar';
import { appStore } from '../stores/appStore';
import StatsRow from '../components/StatsRow.vue';
import AddAnimeForm from '../components/AddAnimeForm.vue';
import ListToolbar from '../components/ListToolbar.vue';
import AnimeCard from '../components/AnimeCard.vue';
import EmptyState from '../components/EmptyState.vue';

const store = appStore;
</script>

<!-- ── Watchlist page (shown when logged in) ──────────────── -->
<template>
  <q-page id="top" class="page-content">
    <template v-if="store.isLoggedIn">

      <!-- ── Hero section ────────────── -->
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">WATCHLIST / 2026</p>
          <h1>Keep your next<br><span>story close.</span></h1>
          <p class="hero-text">A calm corner for the shows you are watching, loving, and saving for later.</p>
        </div>
        <div class="hero-orbit" aria-hidden="true">
          <div class="orbit-ring ring-one"></div>
          <div class="orbit-ring ring-two"></div>
          <div class="orbit-core">W</div>
          <span class="orbit-dot dot-one"></span>
          <span class="orbit-dot dot-two"></span>
        </div>
      </section>

      <StatsRow />

      <section class="workspace-grid">
        <AddAnimeForm />

        <section class="list-panel">
          <ListToolbar />

          <transition-group v-if="store.filteredAnime.length" name="card-list" tag="div" class="anime-grid">
            <AnimeCard v-for="anime in store.filteredAnime" :key="anime.id" :anime="anime" />
          </transition-group>
          <EmptyState v-else />
        </section>
      </section>

    </template><!-- end isLoggedIn -->
  </q-page>
</template>
