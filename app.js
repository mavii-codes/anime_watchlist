const { createApp } = Vue;

createApp({
  data() {
    const savedAnime = localStorage.getItem('nightwave-anime');
    const defaults = [
      ['Fullmetal Alchemist: Brotherhood', 'Adventure', 64, 'Completed', true, 'alchemist.jpg'], ['The Apothecary Diaries', 'Mystery', 48, 'Watching', true, 'apothecary.jpg'], ['Attack on Titan', 'Action', 89, 'Completed', false, 'attackontitan.jpg'], ['Bleach', 'Supernatural', 366, 'Plan to Watch', false, 'bleach.jpg'], ['Dandadan', 'Sci-fi', 12, 'Watching', true, 'dandadan.jpg'], ['Demon Slayer', 'Fantasy', 55, 'Completed', false, 'demonslayer.jpg'], ['Dragon Ball', 'Action', 153, 'Plan to Watch', false, 'dragonball.jpg'], ['Delicious in Dungeon', 'Adventure', 24, 'Plan to Watch', false, 'dungeon.jpg'], ['Frieren: Beyond Journey\'s End', 'Fantasy', 28, 'Watching', true, 'frieren.jpg'], ['Inuyasha', 'Romance', 167, 'Plan to Watch', false, 'inuyasha.jpg'], ['Jujutsu Kaisen', 'Supernatural', 47, 'Completed', false, 'jujutsu.jpg'], ['Mob Psycho 100', 'Action', 37, 'Completed', true, 'mob.jpg'], ['One Piece', 'Adventure', 1122, 'Watching', true, 'onepiece.jpg'], ['I Want to Eat Your Pancreas', 'Drama', 1, 'Completed', false, 'pancreas.jpg'], ['Rent-a-Girlfriend', 'Romance', 36, 'Plan to Watch', false, 'rentagirlfriend.jpg'], ['One Punch Man', 'Comedy', 24, 'Watching', false, 'saitama.jpg'], ['Solo Leveling', 'Action', 25, 'Completed', false, 'solo leveling.jpg'], ['Yumeko Jabami', 'Psychological', 24, 'Plan to Watch', false, 'yuma.jpg']
    ].map((item, index) => ({ id: index + 1, title: item[0], genre: item[1], episodes: item[2], status: item[3], isFavorite: item[4], dateAdded: `2026-0${(index % 3) + 1}-${String(index + 5).padStart(2, '0')}`, image: `images/${item[5]}` }));
    const animeList = savedAnime ? JSON.parse(savedAnime) : defaults;
    return {
      animeList: animeList.map((anime) => ({ ...anime, dateAdded: anime.dateAdded || new Date().toISOString().slice(0, 10), image: anime.image || 'images/default.jpg' })),
      activeFilter: 'All', filters: ['All', 'Watching', 'Completed', 'Plan to Watch'], searchQuery: '', sortBy: 'added',
      isLightTheme: localStorage.getItem('nightwave-theme') === 'light', notification: '', notificationTimer: null,
      newAnime: { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' }
    };
  },
  mounted() { document.body.classList.toggle('light-theme', this.isLightTheme); },
  computed: {
    filteredAnime() {
      const query = this.searchQuery.toLowerCase();
      const matches = this.animeList.filter((anime) => (this.activeFilter === 'All' || anime.status === this.activeFilter) && (!query || `${anime.title} ${anime.genre}`.toLowerCase().includes(query)));
      return [...matches].sort((first, second) => this.sortBy === 'title' ? first.title.localeCompare(second.title) : this.sortBy === 'episodes' ? second.episodes - first.episodes : this.sortBy === 'favorites' ? Number(second.isFavorite) - Number(first.isFavorite) : new Date(second.dateAdded) - new Date(first.dateAdded));
    },
    summary() { return { total: this.animeList.length, watching: this.animeList.filter((anime) => anime.status === 'Watching').length, completed: this.animeList.filter((anime) => anime.status === 'Completed').length }; }
  },
  methods: {
    saveAnime() { localStorage.setItem('nightwave-anime', JSON.stringify(this.animeList)); },
    addAnime() { const title = this.newAnime.title; this.animeList.unshift({ id: Date.now(), title, genre: this.newAnime.genre, episodes: Number(this.newAnime.episodes), status: this.newAnime.status, isFavorite: false, dateAdded: new Date().toISOString().slice(0, 10), image: this.imagePath(this.newAnime.image) }); this.newAnime = { title: '', genre: '', image: '', episodes: 12, status: 'Plan to Watch' }; this.saveAnime(); this.showNotification(`${title} added to your list`); },
    removeAnime(id) { const anime = this.animeList.find((item) => item.id === id); this.animeList = this.animeList.filter((item) => item.id !== id); this.saveAnime(); this.showNotification(`${anime.title} removed`); },
    toggleFavorite(id) { const anime = this.animeList.find((item) => item.id === id); if (anime) { anime.isFavorite = !anime.isFavorite; this.saveAnime(); this.showNotification(anime.isFavorite ? `${anime.title} added to favorites` : `${anime.title} removed from favorites`); } },
    changeStatus(id, status) { const anime = this.animeList.find((item) => item.id === id); if (anime) { anime.status = status; this.saveAnime(); this.showNotification(`${anime.title} marked ${status.toLowerCase()}`); } },
    toggleTheme() { this.isLightTheme = !this.isLightTheme; document.body.classList.toggle('light-theme', this.isLightTheme); localStorage.setItem('nightwave-theme', this.isLightTheme ? 'light' : 'dark'); this.showNotification(`${this.isLightTheme ? 'Light' : 'Dark'} mode enabled`); },
    showNotification(message) { this.notification = message; clearTimeout(this.notificationTimer); this.notificationTimer = setTimeout(() => { this.notification = ''; }, 2600); },
    imagePath(filename) { const clean = (filename || '').trim(); return clean ? (clean.startsWith('images/') ? clean : `images/${clean}`) : 'images/default.jpg'; },
    usePlaceholder(anime) { if (anime.image !== 'images/default.jpg') { anime.image = 'images/default.jpg'; this.saveAnime(); } },
    artClass(anime) { return `art-${(anime.id % 4) + 1}`; }
  }
}).mount('#app');