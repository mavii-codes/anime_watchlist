# Nightwave Anime Watchlist

Frontend: Vue 3 + Quasar, built with Vite.
Backend: Express + PostgreSQL (Neon-compatible) with JWT authentication.

## Project structure

```
anime_watchlist/
├── client/                          # Frontend (Vue 3 + Quasar + Vite + vue-router)
│   ├── index.html                   # Minimal app shell
│   ├── vite.config.js               # Vite config (API proxy → localhost:3001)
│   ├── public/images/               # Static poster images (served at /images/...)
│   └── src/
│       ├── main.js                  # Entry point (createApp + router + Quasar)
│       ├── App.vue                  # Root component (router-view)
│       ├── router/index.js          # Routes: /login, / (watchlist), catch-all
│       ├── stores/appStore.js       # Shared reactive store (auth + watchlist state)
│       ├── layouts/AppLayout.vue    # Shell: topbar, footer, toast, router-view
│       ├── pages/                   # LoginPage, WatchlistPage
│       ├── components/              # AppHeader, AuthPanel, StatsRow, AddAnimeForm,
│       │                            # ListToolbar, AnimeCard, EmptyState
│       ├── services/                # apiClient, authService, watchlistService
│       ├── data/                    # Default offline catalogue
│       ├── utils/                   # Pure helpers (image path resolution)
│       └── assets/css/style.css     # Styles
├── server/                          # Backend (Express + pg + JWT)
│   ├── server.js                    # Entry point (listens on PORT, boots schema)
│   ├── package.json                 # "npm test" runs the node:test suite
│   ├── .env.example                 # Placeholders only — copy to .env
│   ├── database/                    # schema.sql + seed.sql (applied at startup)
│   ├── data/legacy/                 # Legacy SQLite files (unused)
│   ├── test/                        # node:test suite (unit + API integration)
│   └── src/
│       ├── app.js                   # Express app (helmet, CORS, rate limits, routes)
│       ├── config/db.js             # pg Pool + schema/seed initialization
│       ├── controllers/             # auth, anime, watchlist handlers
│       ├── middleware/              # JWT auth + sanitized global error handler
│       ├── models/                  # Data access layer (SQL)
│       └── routes/                  # /api/auth, /api/anime, /api/watchlist
├── .github/workflows/ci.yml         # CI: install → lint → build → test
├── eslint.config.mjs                # ESLint (Vue + Node, correctness-focused)
└── package.json                     # npm workspaces root (client, server)
```

## Requirements

- Node.js 20.19+ or 22.12+ (tested on Node 24)
- A PostgreSQL database (Neon works out of the box)

## Setup

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and a private `JWT_SECRET`.
2. Install dependencies from the project root:

   ```sh
   npm install
   ```

3. Start the frontend and API:

   ```sh
   npm run dev
   ```

The frontend is available at `http://localhost:5173` (Vite proxies `/api` to the backend on port 3001). The API initializes the PostgreSQL schema and inserts any missing catalogue titles when it starts.

## Scripts (from the project root)

| Script                | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Frontend + API together (concurrently)     |
| `npm run dev:client`  | Frontend only                              |
| `npm run dev:server`  | API only                                   |
| `npm run build`       | Production frontend build → `client/dist`  |
| `npm run preview`     | Preview the production build               |
| `npm run lint`        | ESLint across client and server            |
| `npm test`            | Test suites (backend + frontend workspaces)|

Configure `VITE_API_BASE` in `client` if the deployed API is not available at the same origin under `/api`.

## Testing

- **Backend** (`node:test`, no extra deps): `npm test --workspace server`
  - Unit tests for JWT middleware and the error handler
  - Full API integration flow against PostgreSQL — requires `DATABASE_URL` in `server/.env`; without it the integration suite skips cleanly (used by CI)
  - Test data is cleaned up automatically (unique `testgw-*` users / `TESTGW-*` titles)
- **Frontend** (Vitest + jsdom): `npm test --workspace client`
  - Unit tests for utils, data, and the API client
  - Store tests with mocked services
  - Mount smoke tests for key components

## Security

- **helmet** security headers and **express-rate-limit** (strict limit on `/api/auth`, general limit on `/api`; disabled automatically when `NODE_ENV=test`)
- JWT auth with bcrypt-hashed passwords (12 rounds); `JWT_SECRET` rotated per deployment — keep it in `server/.env` only, never in `.env.example`
- The global error handler returns generic messages for 5xx in production (full details are logged server-side); 4xx messages pass through for the UI
- `.env` is gitignored; `.env.example` contains placeholders only

## Lint & CI

- `npm run lint` runs ESLint (flat config in `eslint.config.mjs`) over both workspaces — correctness rules only, no mass reformatting of existing style
- GitHub Actions (`.github/workflows/ci.yml`) runs install → lint → build → test on every push/PR. To also run the DB integration suite in CI, add a repository secret named `DATABASE_URL`.

The legacy SQLite database (`server/data/legacy/nightwave.db`) is not modified or automatically imported. The running application uses PostgreSQL.
