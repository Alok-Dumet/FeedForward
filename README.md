# FeedForward

FeedForward is a food redistribution web app for connecting organizations that have surplus food with organizations that need food.

The app has two account types:

- Food providers can create food offers and accept recipient food requests.
- Recipient organizations can create food requests and accept provider food offers.

Users can create listings, browse opposite-role listings, accept listings, manage their own listings, cancel listings, complete accepted listings, and view completed or cancelled history.

## Tech Stack

### Backend

- Python `http.server`
- Custom router in `backend/router.py`
- Custom access middleware in `backend/access.py`
- PostgreSQL database through `psycopg2`
- Supabase-hosted PostgreSQL database
- In-memory session storage with HTTP-only cookies
- Nominatim/OpenStreetMap geocoding during registration

### Frontend

- React 19
- Vite
- React Router
- TanStack Query
- Tailwind CSS

## Main Features

- User registration and login
- Role-based access for food providers and recipient organizations
- Food offer creation
- Food request creation
- Public browse pages for opposite-role listings
- Listing detail pages
- Listing editing while listings are still available
- Listing accepting/claiming
- Listing cancellation
- Listing completion
- User listing management pages
- Listing history for completed and cancelled listings
- Backend route protection for API endpoints and protected page loads
- Frontend session checks for protected pages
- Frontend not-authorized page for users without a valid session

## Project Structure

```text
backend/
  app.py                    Backend entry point
  router.py                 Small custom route handler
  access.py                 Authentication and role access checks
  sessions.py               In-memory session handling
  utils.py                  Shared backend parsing and validation helpers
  geocoding.py              City/state geocoding helper
  database/
    database.py             PostgreSQL connection
    dumped_schema.sql       Current database schema
  routes/
    authHandler.py          Login, logout, register, session
    listingHandler.py       Listing browse, details, create, edit
    claimHandler.py         Accept, cancel, complete listings
    historyHandler.py       History query helper
    serveHandler.py         Serves the built React app

frontend/
  src/
    App.jsx                 Frontend routes
    auth.js                 Loader helper that requires a session
    session.js              Frontend session cache and route helpers
    pages/                  Page-level route components and loaders
    components/             Shared UI components
    hooks/                  Shared React hooks
    utils/
      api.js                Shared helper for frontend API writes
      format.js             Display formatting helpers
      listings.js           Shared listing loaders and listing data helpers
```

## Backend Access Model

Backend access rules live in `backend/access.py`.

The app separates routes into these groups:

- Public routes that anyone can access
- Authenticated routes that require any logged-in user
- Food-provider-only routes
- Recipient-organization-only routes

The backend protects API endpoints first. Frontend route checks exist to keep the normal user experience clean, but the backend is the main protection against misuse.

The frontend checks whether a session exists before loading protected routes. Role authorization is handled by the backend.

## Listing Location Behavior

When a user registers, the app stores that user's organization location.

When a user creates an offer or request, the listing uses the user's saved organization location. The create listing form does not create a new location record for every listing.

## Running The Project

### 1. Install Python Dependencies

From the repo root:

```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create an `.env` file available to the backend with:

```bash
DATABASE_URL=your_postgres_connection_string
```

The database schema is stored in:

```text
backend/database/dumped_schema.sql
```

### 4. Build The Frontend

The Python backend serves the built frontend from `frontend/dist`.

```bash
cd frontend
npm run build
```

### 5. Start The Backend

Run the backend from the `backend` directory:

```bash
cd backend
python3 app.py
```

The app runs at:

```text
http://localhost:3000
```

## Useful Commands

Run frontend linting:

```bash
cd frontend
npm run lint
```

Build the frontend:

```bash
cd frontend
npm run build
```

Check backend Python syntax:

```bash
python3 -m py_compile backend/app.py backend/router.py backend/access.py backend/sessions.py backend/utils.py backend/geocoding.py backend/routes/*.py
```

## API Overview

### Auth

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/session`

### Listings

- `GET /api/listings`
- `GET /api/listings?scope=mine`
- `GET /api/listings?scope=history`
- `POST /api/listings`
- `GET /api/listings/:id`
- `PATCH /api/listings/:id`

### Claims

- `POST /api/listings/:id/claim`
- `PATCH /api/listings/:id/status`

The status endpoint accepts:

```json
{
  "status": "cancelled"
}
```

or:

```json
{
  "status": "completed"
}
```

## Frontend Routes

- `/`
- `/login`
- `/register`
- `/not_authorized`
- `/offers`
- `/offers/:id`
- `/requests`
- `/requests/:id`
- `/users/:id/offers`
- `/users/:id/offers/create`
- `/users/:id/requests`
- `/users/:id/requests/create`
- `/history`
- `/history/:id`

## Notes

Sessions are stored in backend memory instead of the database. This keeps the implementation simple, but it means sessions disappear when the backend restarts.

The session cookie is HTTP-only and uses `SameSite=Lax`. The app does not currently set the `Secure` cookie flag because HTTPS is not set up yet.

The backend currently supports `GET`, `POST`, and `PATCH` requests. It does not implement `DELETE`; users cancel listings instead of deleting them.
