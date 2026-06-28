# RecipeShare

A full-stack recipe sharing platform. Users sign up, post recipes with
ingredients and steps, browse and search what others posted, favorite
recipes, and leave star ratings with comments.

## Stack

- **Frontend**: React (Vite), React Router
- **Backend**: Node.js, Express
- **Database**: SQLite, using Node's built-in `node:sqlite` module (no
  external database server, no native build step, the database is just a
  file on disk)
- **Auth**: sessions with `express-session`, passwords hashed with bcrypt

## Features

- Sign up / log in / log out with hashed passwords and real sessions
- Browse all recipes, search by title/description, filter by category,
  filter by ingredient ("what can I make with chicken")
- "Surprise me" random recipe button
- Post a recipe with a dynamic list of ingredients and steps
- Edit or delete your own recipes (other users can't touch them, enforced
  server-side, not just hidden in the UI)
- Favorite/unfavorite recipes, view your favorites list
- Rate (1-5 stars) and comment on other people's recipes, one review per
  person per recipe, can be updated later
- Average rating and review count shown on every card and detail page
- Public profile pages with a bio and a list of recipes that user has
  posted

## Running it

You need Node.js 22 or newer (for the built-in SQLite module).

**1. Start the backend**

```
cd server
npm install
node db/init.js     # creates and seeds the database, only needed once
node index.js
```

The API runs on `http://localhost:4000`.

**2. Start the frontend** (in a separate terminal)

```
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Open that in your browser.

## Demo account

A couple of users are pre-seeded so there's content to look at immediately:

- username `chefmaria`, password `password123`
- username `jakethebaker`, password `password123`

Or just sign up with a new account, that works too.

## Project structure

```
server/
  db/
    init.js          # creates tables + seeds demo data, run once
    connection.js     # shared SQLite connection used by every route
    recipeshare.db    # the actual database file (created when you run init.js)
  middleware/
    auth.js           # requireAuth guard for protected routes
  routes/
    auth.js            # signup, login, logout, /me
    recipes.js          # browse, search, filter, full CRUD
    favorites.js        # add/remove/check/list favorites
    reviews.js           # leave or update a rating + comment
    users.js              # public profile + bio editing
  index.js             # wires it all together

client/
  src/
    api.js             # every fetch call to the backend lives here
    AuthContext.jsx     # global logged-in user state
    components/         # Header, RecipeCard, StarRating, StarInput, ProtectedRoute
    pages/               # Home, Login, Signup, RecipeDetail, RecipeForm, Favorites, Profile
    index.css             # all styling, no CSS framework
```

## Notes for the writeup

If your assignment wants you to explain technical decisions:

- **Why SQLite over a hosted database**: zero setup, the whole database is
  one file, and it's plenty for a single-server app like this.
- **Why sessions over JWT**: simpler to reason about, the server can
  immediately invalidate a session on logout, and there's no token to
  accidentally leak in client-side storage.
- **Why ownership checks happen on the server, not just hiding buttons in
  the UI**: anyone can call the API directly with a tool like curl or
  Postman, so the real security boundary has to be server-side. The UI
  hiding edit/delete buttons is just a nicer experience, not the actual
  protection.
