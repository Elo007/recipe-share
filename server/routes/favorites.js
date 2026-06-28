const express = require('express');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites - all recipes the logged-in user has favorited
router.get('/', requireAuth, (req, res) => {
  const recipes = db
    .prepare(`
      SELECT r.*, u.username as author FROM favorites f
      JOIN recipes r ON r.id = f.recipe_id
      JOIN users u ON u.id = r.user_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `)
    .all(req.session.userId);
  res.json(recipes);
});

// POST /api/favorites/:recipeId - add a favorite
router.post('/:recipeId', requireAuth, (req, res) => {
  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(req.params.recipeId);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });

  try {
    db.prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(
      req.session.userId,
      req.params.recipeId
    );
    res.status(201).json({ message: 'Added to favorites.' });
  } catch (err) {
    // UNIQUE constraint means it's already favorited, treat that as a no-op success
    res.json({ message: 'Already in favorites.' });
  }
});

// DELETE /api/favorites/:recipeId - remove a favorite
router.delete('/:recipeId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(
    req.session.userId,
    req.params.recipeId
  );
  res.json({ message: 'Removed from favorites.' });
});

// GET /api/favorites/check/:recipeId - whether the current user has favorited this recipe
router.get('/check/:recipeId', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?')
    .get(req.session.userId, req.params.recipeId);
  res.json({ favorited: !!row });
});

module.exports = router;
