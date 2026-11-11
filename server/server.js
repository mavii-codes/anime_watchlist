require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app  = require('./src/app');
const { initializeDatabase, pool } = require('./src/config/db');
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initializeDatabase();
  const server = app.listen(PORT, () => {
    console.log(`\nNightwave API listening on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health\n`);
  });
  server.on('error', async (error) => {
    console.error('Failed to start the API server:', error);
    await pool.end();
    process.exitCode = 1;
  });
}

startServer().catch(async (error) => {
  console.error('Failed to initialize PostgreSQL:', error);
  await pool.end();
  process.exitCode = 1;
});
