# AGENTS.md

## Project

FeedForward is a frontend-only React application for redistributing surplus food from restaurants to people or organizations in need.

Current stage:

- UI-first
- React + Vite
- frontend-only
- mock-data driven
- no confirmed backend integration

If a detail is not clear from the repo, mark it as `to be confirmed` instead of guessing.

## Current Repo State

Top-level files currently relevant to app work:

- `src/main.jsx`: app entry point
- `src/App.jsx`: router and `QueryClientProvider`
- `src/index.css`: Tailwind import
- `vite.config.js`: Vite config with React and Tailwind plugins
- `eslint.config.js`: ESLint flat config
- `package.json`: scripts and dependencies

Main source folders currently present:

- `src/components`
- `src/pages`

Shared route wrapper currently in use:

- `src/components/background1.jsx`

Current route error boundary:

- `src/pages/errorCheck/errorCheck.jsx`

## Current Routes

Current pages/routes in `src/App.jsx`:

- `/` -> `src/pages/index/index.jsx`
- `/login` -> `src/pages/login/login.jsx`
- `/register` -> `src/pages/register/register.jsx`
- `/home` -> `src/pages/home/home.jsx`
- `/offers` -> `src/pages/offers/offers.jsx`
- `/requests` -> `src/pages/requests/requests.jsx`
- `/details` -> `src/pages/details/details.jsx`
- `/history` -> `src/pages/history/history.jsx`
- `/users/:id/offers` -> `src/pages/userOffers/userOffers.jsx`
- `/users/:id/offers/create` -> `src/pages/userOfferCreate/userOfferCreate.jsx`
- `/users/:id/requests` -> `src/pages/userRequests/userRequests.jsx`
- `/users/:id/requests/create` -> `src/pages/userRequestCreate/userRequestCreate.jsx`

Current loader-backed routes:

- `/home` -> `src/pages/home/homeLoader.jsx`
- `/offers` -> `src/pages/offers/offersLoader.jsx`
- `/requests` -> `src/pages/requests/requestsLoader.jsx`
- `/details` -> `src/pages/details/detailsLoader.jsx`
- `/history` -> `src/pages/history/historyLoader.jsx`
- `/users/:id/offers` -> `src/pages/userOffers/userOffersLoader.jsx`
- `/users/:id/offers/create` -> `src/pages/userOfferCreate/userOfferCreateLoader.jsx`
- `/users/:id/requests` -> `src/pages/userRequests/userRequestsLoader.jsx`
- `/users/:id/requests/create` -> `src/pages/userRequestCreate/userRequestCreateLoader.jsx`

## Current Page Structure

Public or general pages:

- landing page
- login page
- register page
- home page
- offers listing page
- requests listing page
- history page
- details page

User-scoped owner-facing pages:

- user offers list
- user requests list
- user offer create page
- user request create page

Current page folders:

- `src/pages/index`
- `src/pages/login`
- `src/pages/register`
- `src/pages/home`
- `src/pages/offers`
- `src/pages/requests`
- `src/pages/details`
- `src/pages/history`
- `src/pages/userOffers`
- `src/pages/userRequests`
- `src/pages/userOfferCreate`
- `src/pages/userRequestCreate`
- `src/pages/errorCheck`

## Shared UI Patterns

### Shared Listing Pattern

The current browse/archive-style listing pages use:

- `src/components/listingPageShell.jsx`
- `src/components/listingCard.jsx`

`listingPageShell.jsx` currently provides:

- dark hero/header area
- summary stat cards
- configurable secondary action link
- configurable filter label
- item list rendering through `ListingCard`
- per-page card mapping through `cardConfig`

`listingCard.jsx` currently supports:

- eyebrow text
- title
- summary
- one highlighted value block
- a simple detail field grid
- tag chips

Pages currently using this shared listing pattern:

- `/offers`
- `/requests`
- `/history`

### Owner-Facing Pattern

Owner-facing pages currently follow a consistent pattern:

- dark hero/header with owner context or page purpose
- white/glass content panels underneath
- motion-based entrance animation
- UI-only actions such as create, edit, save draft, publish, or view details
- mock data from route loaders where page data is needed

Pages currently following this owner-facing pattern:

- `/details`
- `/users/:id/offers`
- `/users/:id/requests`
- `/users/:id/offers/create`
- `/users/:id/requests/create`

### Create-Page Pattern

The current create pages are:

- `/users/:id/offers/create`
- `/users/:id/requests/create`

They currently use:

- route loader for basic owner context
- page-local form layout
- `src/components/formField.jsx` for simple label/hint/field structure
- plain inputs, selects, and textareas
- UI-only primary and secondary actions

Keep create forms simple unless the request explicitly asks for validation or real submission behavior.

### Other Shared Components

- `src/components/detailFieldGrid.jsx`: simple label/value grid used by the details page
- `src/components/formField.jsx`: simple wrapper for form label, hint, and field spacing

## Stack And Patterns

Use only what is already present in the repo:

- React 19
- Vite
- React Router DOM
- Tailwind CSS via `@import "tailwindcss"`
- `motion` for animation
- `@tanstack/react-query` configured at the app root

Notes:

- React Query is available globally, but current pages are still mostly loader + mock-data based.
- Login and register pages still contain placeholder `fetch` calls to `/api/login` and `/api/register`.
- There is no confirmed backend, API client layer, auth system, or persistent data flow yet.

## Working Rules

- Keep diffs minimal and focused on the request.
- Reuse existing components and route patterns before creating new ones.
- Prefer extending `src/components` for shared UI and keeping page screens in `src/pages`.
- Do not add unnecessary dependencies.
- Use concise English comments only when they help explain non-obvious code.
- Prioritize page implementation and visual flow over production-ready behavior.
- Use mock/static data when real data is unavailable.
- Do not invent backend architecture, services, or API wrappers unless explicitly requested.
- Do not replace the routing setup unless there is a clear issue.

## Page Guidance

When building or editing pages in this repo:

- Inspect `src/App.jsx` first to fit the existing router structure.
- Preserve the current background/layout pattern for pages under the shared public flow.
- Match the existing styling approach: Tailwind utility classes with occasional `motion` animations.
- Keep forms simple unless real validation or backend wiring is explicitly requested.
- If a page needs data, prefer route loaders with mock/static data.
- Reuse the shared listing pattern when the page is fundamentally a stat + filter + card-list view.
- Reuse the owner-facing pattern when the page is meant for a user to manage their own record(s).

## Confirmed vs To Be Confirmed

Confirmed:

- This is a client-side React/Vite app.
- Routing is set up with `createBrowserRouter`.
- A shared background layout exists.
- An error route component exists.
- Tailwind is active.
- The app is still UI-first and mock-data driven.
- The repo now includes browse, history, detail, owner-list, and owner-create pages.

To be confirmed:

- Final role-specific dashboards and flows
- Real backend endpoints and authentication behavior
- Whether React Query will become the main data-fetching pattern
- Whether additional shared layouts beyond `background1.jsx` will be added

## Implementation Bias

For now, optimize for:

- clean page composition
- consistent navigation
- believable mock states
- easy future backend integration

Do not optimize for:

- full API integration
- complex state architecture
- production auth
- speculative backend workflows
- speculative folder expansion that is not already supported by the repo
