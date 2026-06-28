// Guards routes that require a logged-in user. Reads from the session,
// which express-session has already populated from the cookie.
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  next();
}

module.exports = { requireAuth };
