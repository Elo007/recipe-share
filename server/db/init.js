// Sets up the SQLite database file and creates all tables if they don't exist yet.
// Run this once with `node db/init.js` before starting the server for the first time.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'recipeshare.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    cook_time_minutes INTEGER NOT NULL,
    servings INTEGER DEFAULT 4,
    image_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(user_id, recipe_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(user_id, recipe_id)
  );
`);

// Only seed demo data if the users table is empty, so re-running this is safe.
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  console.log('Seeding demo data...');

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?)'
  );
  const hash = bcrypt.hashSync('password123', 10);
  const user1 = insertUser.run('chefmaria', 'maria@example.com', hash, 'Home cook, obsessed with one-pot meals.');
  const user2 = insertUser.run('jakethebaker', 'jake@example.com', hash, 'Baking is my therapy.');

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (user_id, title, description, category, cook_time_minutes, servings, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertIngredient = db.prepare(
    'INSERT INTO ingredients (recipe_id, name, amount, sort_order) VALUES (?, ?, ?, ?)'
  );
  const insertStep = db.prepare(
    'INSERT INTO steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)'
  );

  const recipesData = [
    {
      userId: user1.lastInsertRowid,
      title: 'One-Pot Creamy Garlic Pasta',
      description: 'Weeknight dinner that takes 20 minutes and one pot to clean.',
      category: 'Dinner',
      cookTime: 20,
      servings: 4,
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
      ingredients: [
        ['Spaghetti', '400g'],
        ['Garlic cloves, minced', '4'],
        ['Heavy cream', '200ml'],
        ['Parmesan, grated', '50g'],
        ['Vegetable stock', '600ml'],
        ['Olive oil', '2 tbsp'],
        ['Salt', 'to taste'],
        ['Black pepper', 'to taste'],
      ],
      steps: [
        'Heat olive oil in a large pot over medium heat and saute garlic until fragrant.',
        'Add the stock and bring to a boil, then add the dry pasta directly into the pot.',
        'Cook, stirring occasionally, until pasta is tender and most liquid is absorbed.',
        'Stir in cream and parmesan, season with salt and pepper, and serve hot.',
      ],
    },
    {
      userId: user1.lastInsertRowid,
      title: 'Chicken and Rice Skillet',
      description: 'Comfort food classic, all in one skillet.',
      category: 'Dinner',
      cookTime: 35,
      servings: 4,
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',
      ingredients: [
        ['Chicken thighs', '4'],
        ['Rice', '1.5 cups'],
        ['Chicken broth', '3 cups'],
        ['Onion, diced', '1'],
        ['Garlic cloves', '3'],
        ['Paprika', '1 tsp'],
        ['Olive oil', '2 tbsp'],
      ],
      steps: [
        'Season chicken with paprika, salt and pepper, then sear in olive oil until golden. Remove and set aside.',
        'In the same skillet, saute onion and garlic until soft.',
        'Add rice and broth, stir, then place chicken back on top.',
        'Cover and simmer on low for 20 minutes until rice is cooked and chicken is done.',
      ],
    },
    {
      userId: user2.lastInsertRowid,
      title: 'Classic Chocolate Chip Cookies',
      description: 'Crispy edges, chewy centers, the only recipe you need.',
      category: 'Dessert',
      cookTime: 25,
      servings: 24,
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
      ingredients: [
        ['Butter, softened', '225g'],
        ['Brown sugar', '200g'],
        ['White sugar', '100g'],
        ['Eggs', '2'],
        ['Vanilla extract', '1 tsp'],
        ['Flour', '375g'],
        ['Baking soda', '1 tsp'],
        ['Chocolate chips', '300g'],
        ['Salt', '1/2 tsp'],
      ],
      steps: [
        'Preheat oven to 190C and line baking trays with parchment paper.',
        'Cream butter and both sugars together until light and fluffy.',
        'Beat in eggs and vanilla, then mix in flour, baking soda and salt until just combined.',
        'Fold in chocolate chips, scoop onto trays, and bake for 10-12 minutes until edges are golden.',
      ],
    },
    {
      userId: user2.lastInsertRowid,
      title: 'Fluffy Buttermilk Pancakes',
      description: 'Weekend breakfast that actually feels like a treat.',
      category: 'Breakfast',
      cookTime: 20,
      servings: 4,
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600',
      ingredients: [
        ['Flour', '250g'],
        ['Baking powder', '2 tsp'],
        ['Sugar', '2 tbsp'],
        ['Buttermilk', '400ml'],
        ['Eggs', '2'],
        ['Butter, melted', '40g'],
        ['Salt', 'pinch'],
      ],
      steps: [
        'Whisk together flour, baking powder, sugar and salt in a bowl.',
        'In a separate bowl, whisk buttermilk, eggs and melted butter.',
        'Combine wet and dry ingredients, stirring just until no large lumps remain.',
        'Cook spoonfuls of batter on a hot, lightly greased pan until bubbles form, then flip and cook through.',
      ],
    },
    {
      userId: user1.lastInsertRowid,
      title: 'Fresh Garden Salad with Lemon Vinaigrette',
      description: 'Light, crisp, and ready in 10 minutes.',
      category: 'Salad',
      cookTime: 10,
      servings: 2,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
      ingredients: [
        ['Mixed greens', '150g'],
        ['Cherry tomatoes', '1 cup'],
        ['Cucumber', '1'],
        ['Red onion, thinly sliced', '1/4'],
        ['Olive oil', '3 tbsp'],
        ['Lemon juice', '2 tbsp'],
        ['Salt', 'to taste'],
      ],
      steps: [
        'Wash and chop the greens, tomatoes, cucumber and onion, then combine in a large bowl.',
        'Whisk olive oil, lemon juice and salt together in a small bowl.',
        'Pour the dressing over the salad just before serving and toss well.',
      ],
    },
    {
      userId: user2.lastInsertRowid,
      title: 'Spicy Thai Basil Beef',
      description: 'Bold, fast stir-fry with serious flavor.',
      category: 'Dinner',
      cookTime: 15,
      servings: 3,
      image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600',
      ingredients: [
        ['Beef strips', '400g'],
        ['Thai basil leaves', '1 cup'],
        ['Garlic, minced', '4 cloves'],
        ['Thai chilies, sliced', '3'],
        ['Soy sauce', '2 tbsp'],
        ['Fish sauce', '1 tbsp'],
        ['Sugar', '1 tsp'],
        ['Vegetable oil', '2 tbsp'],
      ],
      steps: [
        'Heat oil in a wok over high heat, then add garlic and chilies and stir-fry for 30 seconds.',
        'Add beef and stir-fry until just browned, about 2-3 minutes.',
        'Stir in soy sauce, fish sauce and sugar, cooking for another minute.',
        'Remove from heat and fold in basil leaves until wilted, then serve immediately over rice.',
      ],
    },
  ];

  for (const r of recipesData) {
    const recipe = insertRecipe.run(
      r.userId, r.title, r.description, r.category, r.cookTime, r.servings, r.image
    );
    const recipeId = recipe.lastInsertRowid;
    r.ingredients.forEach(([name, amount], idx) => {
      insertIngredient.run(recipeId, name, amount, idx);
    });
    r.steps.forEach((instruction, idx) => {
      insertStep.run(recipeId, idx + 1, instruction);
    });
  }

  // A couple of seed reviews so the ratings UI has something to show.
  const insertReview = db.prepare(
    'INSERT INTO reviews (user_id, recipe_id, rating, comment) VALUES (?, ?, ?, ?)'
  );
  insertReview.run(user2.lastInsertRowid, 1, 5, 'Made this three times already, so easy.');
  insertReview.run(user1.lastInsertRowid, 3, 5, 'Best chocolate chip cookies I have made.');
  insertReview.run(user2.lastInsertRowid, 5, 4, 'Great with grilled chicken on top too.');

  console.log(`Seeded ${recipesData.length} recipes from 2 users.`);
} else {
  console.log('Database already has data, skipping seed.');
}

db.close();
console.log('Database ready at', dbPath);
