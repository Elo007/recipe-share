const express = require('express');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id - public profile: bio plus the recipes they've posted
router.get('/:id', (req, res) => {
  const user = db
    .prepare('SELECT id, username, bio, created_at FROM users WHERE id = ?')
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const recipes = db
    .prepare('SELECT id, title, category, cook_time_minutes, image_url FROM recipes WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.params.id);

  res.json({ ...user, recipes });
});

// PUT /api/users/me - update your own bio
router.put('/me', requireAuth, (req, res) => {
  const { bio } = req.body;
  db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio || '', req.session.userId);
  res.json({ message: 'Profile updated.' });
});

module.exports = router;
