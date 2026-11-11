const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : undefined
);

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in server/.env before starting the API.');
  }

  // server/src/config → two levels up is the server package root
  const serverRoot = path.join(__dirname, '../../');
  const schema = fs.readFileSync(path.join(serverRoot, 'database/schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(serverRoot, 'database/seed.sql'), 'utf8');

  await pool.query(schema);
  await pool.query(seed);
  console.log('PostgreSQL database schema ready and catalogue seeded.');
}

module.exports = { pool, initializeDatabase };
