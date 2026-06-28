import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const CATEGORY_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Salad', 'Snack', 'Drink', 'Other'];

export default function RecipeForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Dinner');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState(4);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '' }]);
  const [steps, setSteps] = useState(['']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    api.getRecipe(id).then((r) => {
      setTitle(r.title);
      setDescription(r.description);
      setCategory(r.category);
      setCookTime(r.cook_time_minutes);
      setServings(r.servings);
      setImageUrl(r.image_url);
      setIngredients(r.ingredients.map((i) => ({ name: i.name, amount: i.amount })));
      setSteps(r.steps.map((s) => s.instruction));
      setLoading(false);
    });
  }, [id, isEditing]);

  function updateIngredient(index, field, value) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: '', amount: '' }]);
  }

  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index, value) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStepRow() {
    setSteps((prev) => [...prev, '']);
  }

  function removeStepRow(index) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanSteps = steps.filter((s) => s.trim());

    if (!title.trim() || !category || !cookTime || cleanIngredients.length === 0 || cleanSteps.length === 0) {
      setError('Title, category, cook time, at least one ingredient and one step are required.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      cookTimeMinutes: Number(cookTime),
      servings: Number(servings) || 4,
      imageUrl: imageUrl.trim(),
      ingredients: cleanIngredients,
      steps: cleanSteps,
    };

    try {
      if (isEditing) {
        await api.updateRecipe(id, payload);
        navigate(`/recipes/${id}`);
      } else {
        const created = await api.createRecipe(payload);
        navigate(`/recipes/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="page page-narrow">
      <span className="eyebrow">{isEditing ? 'Edit recipe' : 'Share a recipe'}</span>
      <h1>{isEditing ? 'Update your recipe' : 'Post a new recipe'}</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {error && <div className="error-banner">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="description">Short description</label>
          <textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cookTime">Cook time (minutes)</label>
            <input
              id="cookTime"
              type="number"
              min="1"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="servings">Servings</label>
            <input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL (optional)</label>
          <input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Ingredients</h2>
        {ingredients.map((ing, i) => (
          <div className="dynamic-row" key={i}>
            <div className="form-group">
              <input
                placeholder="Ingredient, e.g. Garlic cloves"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: '0 0 120px' }}>
              <input
                placeholder="Amount"
                value={ing.amount}
                onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
              />
            </div>
            {ingredients.length > 1 && (
              <button
                type="button"
                className="remove-row-btn"
                onClick={() => removeIngredientRow(i)}
                aria-label="Remove ingredient"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addIngredientRow}>
          + Add ingredient
        </button>

        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Steps</h2>
        {steps.map((step, i) => (
          <div className="dynamic-row" key={i}>
            <div className="form-group">
              <textarea
                rows={2}
                placeholder={`Step ${i + 1}`}
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
              />
            </div>
            {steps.length > 1 && (
              <button
                type="button"
                className="remove-row-btn"
                onClick={() => removeStepRow(i)}
                aria-label="Remove step"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addStepRow}>
          + Add step
        </button>

        <div style={{ marginTop: 32 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Post recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
