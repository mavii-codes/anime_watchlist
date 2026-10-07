require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app  = require('./src/app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🎵  Nightwave API listening on http://localhost:${PORT}`);
  console.log(`   Health check → http://localhost:${PORT}/api/health\n`);
});
