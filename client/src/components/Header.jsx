import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo">
          Recipe<span>Share</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Browse</Link>
          {user && <Link to="/recipes/new">Post a recipe</Link>}
          {user && <Link to="/favorites">Favorites</Link>}
        </nav>
        <div className="nav-user">
          {user ? (
            <>
              <Link to={`/profile/${user.id}`}>{user.username}</Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
