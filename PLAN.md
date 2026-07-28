# Universal App Plan

## Product Direction

The app should become a personal operating system where each domain is a module: money, goals, habits, projects, notes, assets, and later shared household or business workflows. The first useful module is money tracking.

## Architecture Direction

- `index.html` is the frontend entry point.
- `src/styles.css` owns the visual system and responsive layout.
- `src/app.js` owns the frontend app shell, module registry, local persistence, and the Money module.
- `backend/app/main.py` is the Python API entry point.
- `backend/app/api/v1/` contains versioned module routes.
- `backend/app/models/` contains SQLAlchemy database models.
- `backend/app/schemas/` contains request and response contracts.
- Frontend modules should expose a small contract: `id`, `label`, `description`, `render()`, and optional action handlers.
- Backend modules should keep route, schema, and model files separate, then register their router in `backend/app/api/routes.py`.
- Shared capabilities should remain in the shell/core: storage, notifications, date and currency formatting, import/export, navigation, settings, auth, and database sessions.

## Money Tracking Scope

Current frontend slice:

- Track income and expense transactions.
- Define custom money categories.
- Categorize each transaction from the user-defined category list.
- Show balance, income, expense, and savings rate.
- Show monthly category spending and budget progress.
- Add friends by email or user id and show only their aggregate budget progress percentage.
- Add, rename, delete, and edit budget checklist rows.
- Filter by month, type, category, and search text.
- Edit and delete transactions.
- Persist data in `localStorage`.
- Keep the visible money screen focused on daily tracking, without import/export/demo actions in the main header.

Current backend slice:

- Register and login users.
- Issue JWT bearer tokens.
- Store users, friend links, transactions, and budgets in a database.
- Keep money records scoped to the authenticated user.
- Provide category CRUD, transaction CRUD, budget CRUD/upsert/list, and monthly summary APIs.
- Provide friend list/add/delete APIs that expose friend budget progress only as percentages.

## Future Extension Ideas

- Goals module: saving targets, debt payoff, milestones.
- Projects module: tasks, deadlines, lightweight kanban.
- Habit module: streaks and routines.
- Assets module: recurring subscriptions, warranties, documents.
- Shared account mode: household or small team permissions.
- Sync backend: API, authentication, and multi-device storage.
- Data tools: optional import/export and sample-data utilities in a settings or admin area.
