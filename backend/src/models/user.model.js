const db     = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserModel = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
  },

  findByUsername(username) {
    return db.prepare('SELECT id FROM users WHERE username = ?').get(username) || null;
  },

  findById(id) {
    return db.prepare(
      'SELECT id, username, email, created_at FROM users WHERE id = ?'
    ).get(id) || null;
  },

  async create({ username, email, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, password_hash);
    return { id: result.lastInsertRowid, username, email };
  },

  comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },
};

module.exports = UserModel;
