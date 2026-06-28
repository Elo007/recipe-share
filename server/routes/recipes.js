const express = require('express');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Pulls average rating and review count for a recipe in one query, reused
// by both the list and detail endpoints so the numbers always match.
function getRatingStats(recipeId) {
  const row = db
    .prepare('SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount FROM reviews WHERE recipe_id = ?')
    .get(recipeId);
  return {
    avgRating: row.avgRating ? Math.round(row.avgRating * 10) / 10 : null,
    reviewCount: row.reviewCount,
  };
}

// GET /api/recipes - browse with optional search, category filter, and ingredient filter
router.get('/', (req, res) => {
  const { search, category, ingredient } = req.query;

  let query = `
    SELECT DISTINCT r.*, u.username as author
    FROM recipes r
    JOIN users u ON u.id = r.user_id
  `;
  const conditions = [];
  const params = [];

  if (ingredient) {
    query += ' JOIN ingredients i ON i.recipe_id = r.id';
    conditions.push('i.name LIKE ?');
    params.push(`%${ingredient}%`);
  }
  if (search) {
    conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push('r.category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY r.created_at DESC';

  const recipes = db.prepare(query).all(...params);
  const withStats = recipes.map((r) => ({ ...r, ...getRatingStats(r.id) }));
  res.json(withStats);
});

// GET /api/recipes/categories - distinct category list for the filter dropdown
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM recipes ORDER BY category').all();
  res.json(rows.map((r) => r.category));
});

// GET /api/recipes/random - one random recipe, used by the "surprise me" button
router.get('/random', (req, res) => {
  const recipe = db
    .prepare(`
      SELECT r.*, u.username as author FROM recipes r
      JOIN users u ON u.id = r.user_id
      ORDER BY RANDOM() LIMIT 1
    `)
    .get();
  if (!recipe) return res.status(404).json({ error: 'No recipes exist yet.' });
  res.json({ ...recipe, ...getRatingStats(recipe.id) });
});

// GET /api/recipes/:id - full detail with ingredients, steps, and reviews
router.get('/:id', (req, res) => {
  const recipe = db
    .prepare(`
      SELECT r.*, u.username as author FROM recipes r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = ?
    `)
    .get(req.params.id);

  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });

  const ingredients = db
    .prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order')
    .all(req.params.id);
  const steps = db
    .prepare('SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_number')
    .all(req.params.id);
  const reviews = db
    .prepare(`
      SELECT rv.*, u.username FROM reviews rv
      JOIN users u ON u.id = rv.user_id
      WHERE rv.recipe_id = ?
      ORDER BY rv.created_at DESC
    `)
    .all(req.params.id);

  res.json({
    ...recipe,
    ...getRatingStats(recipe.id),
    ingredients,
    steps,
    reviews,
  });
});

// POST /api/recipes - create a new recipe (logged in users only)
router.post('/', requireAuth, (req, res) => {
  const { title, description, category, cookTimeMinutes, servings, imageUrl, ingredients, steps } = req.body;

  if (!title || !category || !cookTimeMinutes || !ingredients?.length || !steps?.length) {
    return res.status(400).json({
      error: 'Title, category, cook time, at least one ingredient and one step are required.',
    });
  }

  const result = db
    .prepare(`
      INSERT INTO recipes (user_id, title, description, category, cook_time_minutes, servings, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(req.session.userId, title, description || '', category, cookTimeMinutes, servings || 4, imageUrl || '');

  const recipeId = result.lastInsertRowid;

  const insertIngredient = db.prepare(
    'INSERT INTO ingredients (recipe_id, name, amount, sort_order) VALUES (?, ?, ?, ?)'
  );
  ingredients.forEach((ing, idx) => {
    insertIngredient.run(recipeId, ing.name, ing.amount || '', idx);
  });

  const insertStep = db.prepare('INSERT INTO steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)');
  steps.forEach((instruction, idx) => {
    insertStep.run(recipeId, idx + 1, instruction);
  });

  res.status(201).json({ id: recipeId });
});

// PUT /api/recipes/:id - edit a recipe, only the original author can do this
router.put('/:id', requireAuth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });
  if (recipe.user_id !== req.session.userId) {
    return res.status(403).json({ error: 'You can only edit your own recipes.' });
  }

  const { title, description, category, cookTimeMinutes, servings, imageUrl, ingredients, steps } = req.body;

  db.prepare(`
    UPDATE recipes SET title = ?, description = ?, category = ?, cook_time_minutes = ?, servings = ?, image_url = ?
    WHERE id = ?
  `).run(title, description || '', category, cookTimeMinutes, servings || 4, imageUrl || '', req.params.id);

  // Simplest correct approach: replace all ingredients and steps rather than diffing them.
  db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(req.params.id);
  db.prepare('DELETE FROM steps WHERE recipe_id = ?').run(req.params.id);

  const insertIngredient = db.prepare(
    'INSERT INTO ingredients (recipe_id, name, amount, sort_order) VALUES (?, ?, ?, ?)'
  );
  (ingredients || []).forEach((ing, idx) => {
    insertIngredient.run(req.params.id, ing.name, ing.amount || '', idx);
  });

  const insertStep = db.prepare('INSERT INTO steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)');
  (steps || []).forEach((instruction, idx) => {
    insertStep.run(req.params.id, idx + 1, instruction);
  });

  res.json({ message: 'Recipe updated.' });
});

// DELETE /api/recipes/:id - only the original author can delete
router.delete('/:id', requireAuth, (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });
  if (recipe.user_id !== req.session.userId) {
    return res.status(403).json({ error: 'You can only delete your own recipes.' });
  }

  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Recipe deleted.' });
});

module.exports = router;
