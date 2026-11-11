const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserModel = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findByUsername(username) {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ username, email, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [username, email, password_hash]
    );
    return { id: result.rows[0].id, username, email };
  },

  comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },
};

module.exports = UserModel;
