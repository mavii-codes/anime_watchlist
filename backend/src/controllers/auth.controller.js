const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');

const JWT_SECRET     = process.env.JWT_SECRET     || 'nightwave_dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

const AuthController = {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }
      const { username, email, password } = req.body;

      if (UserModel.findByEmail(email)) {
        return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
      }
      if (UserModel.findByUsername(username)) {
        return res.status(409).json({ success: false, message: 'That username is already taken.' });
      }

      const user  = await UserModel.create({ username, email, password });
      const token = signToken(user);
      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const user = UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const valid = await UserModel.comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const token = signToken(user);
      res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (err) { next(err); }
  },

  async me(req, res, next) {
    try {
      const user = UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      res.json({ success: true, user });
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;
