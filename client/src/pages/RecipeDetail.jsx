import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import StarRating from '../components/StarRating';
import StarInput from '../components/StarInput';

export default function RecipeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  async function load() {
    setLoading(true);
    const data = await api.getRecipe(id);
    setRecipe(data);
    if (user) {
      const fav = await api.checkFavorite(id);
      setFavorited(fav.favorited);
      const myReview = data.reviews.find((r) => r.user_id === user.id);
      if (myReview) {
        setReviewRating(myReview.rating);
        setReviewComment(myReview.comment);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function toggleFavorite() {
    if (favorited) {
      await api.removeFavorite(id);
    } else {
      await api.addFavorite(id);
    }
    setFavorited(!favorited);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    await api.deleteRecipe(id);
    navigate('/');
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError('');
    if (!reviewRating) {
      setReviewError('Pick a star rating first.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.addReview(id, { rating: reviewRating, comment: reviewComment });
      await load();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <p className="loading-text">Loading recipe...</p>;
  if (!recipe) return <p className="loading-text">Recipe not found.</p>;

  const isOwner = user && user.id === recipe.user_id;
  const myExistingReview = user && recipe.reviews.find((r) => r.user_id === user.id);

  return (
    <div className="page">
      <div className="recipe-detail">
        <img
          className="recipe-detail-hero"
          src={recipe.image_url || 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=1200'}
          alt={recipe.title}
        />
        <div className="recipe-detail-body">
          <div className="recipe-detail-top">
            <div>
              <span className="recipe-stamp">{recipe.category}</span>
              <h1 style={{ marginTop: 12 }}>{recipe.title}</h1>
              <p>{recipe.description}</p>
              <p style={{ fontSize: '0.9rem' }}>
                by <Link to={`/profile/${recipe.user_id}`} style={{ fontWeight: 600, color: 'var(--paprika)' }}>{recipe.author}</Link>
              </p>
            </div>
            <div className="recipe-actions">
              {user && !isOwner && (
                <button className="btn btn-ghost" onClick={toggleFavorite}>
                  {favorited ? '★ Favorited' : '☆ Add to favorites'}
                </button>
              )}
              {isOwner && (
                <>
                  <button className="btn btn-ghost" onClick={() => navigate(`/recipes/${id}/edit`)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="recipe-detail-meta-row">
            <div className="meta-item">
              <span className="meta-label">Cook time</span>
              <span className="meta-value">{recipe.cook_time_minutes} min</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Servings</span>
              <span className="meta-value">{recipe.servings}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Rating</span>
              <span className="meta-value">
                <StarRating rating={recipe.avgRating} reviewCount={recipe.reviewCount} />
              </span>
            </div>
          </div>

          <div className="detail-columns">
            <div>
              <h2>Ingredients</h2>
              <ul className="ingredient-list">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id}>
                    <span>{ing.name}</span>
                    <span className="ingredient-amount">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Steps</h2>
              <ol className="steps-list">
                {recipe.steps.map((step) => (
                  <li key={step.id}>{step.instruction}</li>
                ))}
              </ol>
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <h2>Reviews ({recipe.reviews.length})</h2>

            {user && !isOwner && (
              <form onSubmit={handleReviewSubmit} style={{ margin: '20px 0', padding: 20, background: 'var(--paper-dark)', borderRadius: 'var(--radius)' }}>
                {reviewError && <div className="error-banner">{reviewError}</div>}
                <div className="form-group">
                  <label>{myExistingReview ? 'Update your rating' : 'Leave a rating'}</label>
                  <StarInput value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="form-group">
                  <label htmlFor="comment">Comment (optional)</label>
                  <textarea
                    id="comment"
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary btn-sm" type="submit" disabled={submittingReview}>
                  {myExistingReview ? 'Update review' : 'Submit review'}
                </button>
              </form>
            )}

            {recipe.reviews.length === 0 ? (
              <p>No reviews yet, be the first to try it and leave one.</p>
            ) : (
              <div style={{ marginTop: 16 }}>
                {recipe.reviews.map((r) => (
                  <div className="review" key={r.id}>
                    <div className="review-head">
                      <span className="review-author">{r.username}</span>
                      <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
