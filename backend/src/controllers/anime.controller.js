const { validationResult } = require('express-validator');
const AnimeModel = require('../models/anime.model');

const AnimeController = {
  async getAll(req, res, next) {
    try {
      const anime = AnimeModel.findAll({ search: req.query.search });
      res.json({ success: true, anime });
    } catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try {
      const anime = AnimeModel.findById(req.params.id);
      if (!anime) return res.status(404).json({ success: false, message: 'Anime not found.' });
      res.json({ success: true, anime });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }
      const anime = AnimeModel.create(req.body);
      res.status(201).json({ success: true, anime });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      if (!AnimeModel.findById(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Anime not found.' });
      }
      const anime = AnimeModel.update(req.params.id, req.body);
      res.json({ success: true, anime });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      const deleted = AnimeModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Anime not found.' });
      res.json({ success: true, message: 'Anime removed from catalogue.' });
    } catch (err) { next(err); }
  },
};

module.exports = AnimeController;
