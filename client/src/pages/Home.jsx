import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import RecipeCard from '../components/RecipeCard';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [ingredient, setIngredient] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (ingredient) params.ingredient = ingredient;
    try {
      const data = await api.getRecipes(params);
      setRecipes(data);
    } finally {
      setLoading(false);
    }
  }, [search, category, ingredient]);

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  // Debounce so we're not firing a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(loadRecipes, 300);
    return () => clearTimeout(timer);
  }, [loadRecipes]);

  async function handleRandom() {
    const recipe = await api.getRandomRecipe();
    navigate(`/recipes/${recipe.id}`);
  }

  return (
    <div className="page">
      <span className="eyebrow">Cook something good</span>
      <h1>Recipes worth making twice.</h1>
      <p style={{ maxWidth: 560 }}>
        Browse what the community is cooking, search by name or ingredient, and save your favorites.
      </p>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Have an ingredient? e.g. garlic"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '2px solid var(--ink)', borderRadius: 'var(--radius)', fontSize: '0.95rem' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={handleRandom} type="button">
          Surprise me
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading recipes...</p>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing matches that search.</h3>
          <p>Try a different ingredient, category, or clear your filters.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
