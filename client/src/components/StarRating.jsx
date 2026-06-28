// Pure display version, used on cards and detail pages. For the input
// version (used when leaving a review) see StarInput.jsx.
export default function StarRating({ rating, reviewCount }) {
  if (!rating) {
    return <span className="stars" style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>No reviews yet</span>;
  }

  const fullStars = Math.round(rating);
  const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);

  return (
    <span className="stars" title={`${rating} out of 5`}>
      {stars}{' '}
      <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>
        {rating} ({reviewCount})
      </span>
    </span>
  );
}
