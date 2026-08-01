# Project Context

This file is the shared working context for contributors and coding agents. Read it before changing the project, and update it after meaningful work so the next person does not have to rediscover decisions.

## Current State

- The project is a small universal personal app, currently focused on money tracking.
- The frontend is static HTML/CSS/JavaScript: `index.html`, `src/styles.css`, `src/app.js`.
- Local service ports are configured through the root `.env` file copied from `.env.example`.
- The app language is Vietnamese. Users can choose VND, Dollar, or Euro display/input formatting in `Hồ sơ`; stored amounts are not exchange-rate converted.
- Default money category values are Vietnamese/expense-focused in the frontend. Known legacy English default names are translated/migrated for older local and backend data, but income-related defaults such as salary/freelance are excluded from default/recommended category lists.
- Project documentation, scripts, backend internals, and collaboration notes should stay in English unless explicitly requested.
- The backend is a FastAPI app under `backend/`.
- Authentication exists with register/login/me endpoints, profile update, password change, and JWT bearer tokens.
- JWT sessions default to 30 days through `ACCESS_TOKEN_EXPIRE_MINUTES=43200`.
- The frontend validates saved auth tokens before showing onboarding, automatically clears stale/invalid tokens, and returns users to the login screen with a Vietnamese message when the backend returns invalid authentication credentials. If this happens while a user is editing onboarding, the draft is preserved locally and restored after the next login.
- Friend APIs use pending requests: adding by email/id creates a request, the other user must accept, and accepted friends show only aggregate budget progress percentages.
- Money backend APIs exist for expense transactions, budgets, and monthly summaries.
- Money category APIs exist for user-defined category names.
- The frontend login/register screen talks to the backend auth endpoints.
- The app UI does not expose the API URL; API base configuration comes from generated `src/runtime-config.js`, a previously stored value, or the local default.
- After login, the frontend money tracker syncs transactions and budgets with the backend.
- The sidebar separates `Ngân sách` and `Giao dịch` into their own navigation items.
- Budget checklist rows can be added, renamed, edited, and deleted from the UI.
- Users can manage money categories on the `Danh mục` page.
- The budget-add dropdown and transaction-add dropdown use the category list defined on the `Danh mục` page; historical categories may still appear in filters so old data remains searchable. The budget-add control is collapsed to a single add button by default, expands into category and amount fields on click, shows the full defined category list, and blocks duplicate current-month budgets with a toast.
- Users can manage friends on the `Bạn bè` page and see only each friend's total budget progress percentage; the page also shows the current user as a local, non-removable comparison row. Friend lists and request lists are deduped by user id so reciprocal/legacy duplicate friendship rows do not render twice.
- Users can manage profile settings on the `Hồ sơ` page, including display name, avatar image upload, currency preference, and password.
- First-time login shows an onboarding screen that asks currency unit, monthly income, and two budget levels per category: `Chi tiêu tối thiểu` and `Chi tiêu đầy đủ`; users can skip with `Thiết lập sau` or rerun it from `Hồ sơ`. Registration auto-login is allowed, onboarding only appears for an authenticated user, and onboarding money fields intentionally start blank instead of prefilled from saved values. The onboarding screen shows financial independence/freedom timeline estimates directly while the user enters values.
- Onboarding has a recommended category list and a user-selected category list. Users add recommendations into their list, use the plus control at the end of recommendations to add custom categories, remove selected categories, and the two budget levels are saved independently without requiring `Chi tiêu đầy đủ` to be greater than `Chi tiêu tối thiểu`. Selected onboarding rows use polished card-style edit/display modes: users type values while editing, then confirm the row into labels and can reopen it with the edit button. Recommended/default expense categories include `Dating` and `Gửi bố mẹ`, with costly defaults ordered first (`Nhà ở`, `Ăn uống`, `Gửi bố mẹ`) and `Tiết kiệm` excluded.
- The budget dashboard estimates time to `Độc lập tài chính` from 25 years of `Chi tiêu tối thiểu`, and `Tự do tài chính` from 25 years of `Chi tiêu đầy đủ`, using monthly income minus the matching budget level as monthly savings.
- The current money UI is cost/budget focused: income categories, income transaction controls, and income summary cards are hidden/disabled.
- Budget progress uses backend summary/budget reads so edits recalculate spent amounts from current transaction history.
- Budget settings are effective from their selected month onward: creating or changing a budget applies to that month and later months until the user changes it again from a later month.
- Budget progress includes an overall monthly total progress bar above category cards.
- Budget progress uses two-column chart cards per category with percentage used, spent/limit values, and saved minimum/full spending levels.
- Budget cards show read-only category names; card edit mode changes only monthly amount and background color.
- Red is reserved for over-budget/danger states, is not available in user-selected budget card colors, and budget cards at or above 100% automatically render with red danger styling.
- The UI uses a more colorful visual system with varied card accents, richer sidebar/auth surfaces, colorful progress bars, and chart colors.
- `index.html` includes version query strings on frontend assets to avoid stale browser cache after deploys.
- The visible money screen no longer exposes import/export/demo-data buttons.

## How To Run

```bash
bash start_service.sh
```

Stop services started by the script:

```bash
bash stop_service.sh
```

Default URLs:

- UI: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

Change ports in the root `.env` file:

```dotenv
BACKEND_PORT=8484
FRONTEND_PORT=5174
```

Then run `bash start_service.sh` again. The script generates ignored `src/runtime-config.js` so the frontend uses the configured API URL.
`start_service.sh` launches backend/frontend with `nohup`, returns after writing `.service-pids`, and writes ignored logs under `.service-logs/`.

For LAN/public access, bind to all interfaces but use a reachable URL for browser API calls:

```dotenv
BACKEND_HOST=0.0.0.0
FRONTEND_HOST=0.0.0.0
BACKEND_PORT=4578
FRONTEND_PORT=6060
API_BASE_URL=http://YOUR_SERVER_IP:4578
BACKEND_CORS_ORIGINS='["http://YOUR_SERVER_IP:6060"]'
```

Do not put the public IP in `BACKEND_HOST` or `FRONTEND_HOST` unless that IP is assigned directly to the server's network interface. Do not set `API_BASE_URL` to `http://0.0.0.0:4578`; `0.0.0.0` is only a bind address.

## Important Files

- `src/app.js`: frontend state, auth UI, money UI, API calls, and remaining local backup helper code.
- `src/runtime-config.js`: generated by `start_service.sh`, ignored by git, and used by the frontend for `API_BASE_URL`.
- `src/styles.css`: app and auth screen styling.
- `backend/app/main.py`: FastAPI app setup and CORS middleware.
- `backend/app/core/config.py`: settings, database URL, CORS origins.
- `backend/app/core/security.py`: JWT and password hashing.
- `backend/app/api/v1/auth.py`: register, login, current user, profile update, password change, onboarding completion.
- `backend/uploads/`: ignored runtime storage for uploaded avatar images served from `/uploads`.
- `backend/app/api/v1/friends.py`: friend request create/accept/reject/cancel, friend delete, and aggregate friend budget percent calculation.
- `backend/app/api/v1/money.py`: transaction, budget, and summary endpoints.
- `backend/scripts/smoke_test.py`: backend integration smoke test.
- `backend/scripts/cors_smoke_test.py`: CORS preflight smoke test.
- `start_service.sh`: starts both backend and frontend in the background with `nohup`.
- `stop_service.sh`: stops backend/frontend processes recorded by `start_service.sh`.

## Design Decisions

- Use SQLite by default through `DATABASE_URL`; this can move to Postgres later without changing route logic.
- Use root `.env` for local service ports: `BACKEND_HOST`, `BACKEND_PORT`, `FRONTEND_HOST`, `FRONTEND_PORT`, and optional `API_BASE_URL`. For public/LAN access, bind hosts should usually be `0.0.0.0`, while `API_BASE_URL` and `BACKEND_CORS_ORIGINS` use the real IP/domain reachable by the browser.
- Keep frontend module labels and money UI in Vietnamese.
- UI and UX quality should be treated as a core requirement: flows should be polished, clear, compact, responsive, and easy to use before work is considered complete.
- Keep backend schema field names in English. The transaction table still has a `type` field for compatibility, but the API/UI currently accept and show only `expense` transactions.
- Store JWT in `localStorage` for now for simple local development.
- Friend progress intentionally exposes only aggregate percentage and budget count, not friend money amounts; pending friend requests expose identity/status only.
- Use root `AGENTS.md` for agent instructions instead of a `.codex` directory, because it is more visible to collaborators and coding agents.

## Known Gaps

- The frontend still calculates top-level summary cards locally from loaded transactions; budget progress now uses backend summary data.
- Import/export helper code still exists in `src/app.js`, but it is not exposed in the current UI.
- There are no Alembic migrations yet; tables are created by `Base.metadata.create_all`.
- Runtime schema checks add missing columns for older local SQLite databases, including budget recurrence state.
- There is no production auth hardening yet: refresh tokens, cookie-based auth, rate limits, password reset, email verification, or CSRF strategy.
- Currency selection only changes formatting and numeric input step; it does not convert existing amounts between currencies.
- Onboarding income is stored for planning context only; the active money workflow still tracks expenses and budgets, not income transactions.
- Friend links do not have blocking or per-user privacy controls yet.
- There is no automated frontend browser test yet.
- Uploaded avatars are stored on the local backend filesystem; there is no cleanup job or object-storage integration yet.

## Verification Commands

```bash
node --check src/app.js
bash -n start_service.sh
backend/.venv/bin/python backend/scripts/smoke_test.py
backend/.venv/bin/python backend/scripts/cors_smoke_test.py
```

## Recent Work Log

- Created static money tracker UI with local data.
- Added FastAPI backend with SQLAlchemy models, SQLite config, JWT auth, and money APIs.
- Added `start_service.sh` to launch backend and frontend together.
- Switched app UI language to Vietnamese and currency display to VND.
- Added login/register screen connected to backend auth.
- Connected money transactions and budgets to backend APIs after login.
- Fixed local CORS preflight failures for frontend/backend running on different local ports.
- Reworked login/register screen into a cleaner two-column account layout with a dark product summary panel and compact form.
- Fixed auth page clipping by switching the root `#app` class between `auth-root` and `app-shell`.
- Removed Import, Export, and Demo buttons from the money header.
- Reworked the month filter in the `Giao dịch` panel into a compact previous/current/next month control.
- Added full budget checklist editing with add, category change, amount change, and delete support through backend budget endpoints.
- Switched budget progress rendering to backend recalculated `spent_amount`/`percent_used` after budget edits.
- Added user-owned money categories with backend CRUD, a `Danh mục` frontend page, and category dropdowns sourced from user-defined categories.
- Added stronger visual separators between budget progress rows.
- Added an overall total progress bar to the budget progress panel.
- Added friend links with add-by-email/id, a `Bạn bè` frontend page, and percent-only friend budget progress.
- Moved local backend/frontend port configuration into root `.env` and generated frontend runtime API config from it.
- Added `stop_service.sh` and `.service-pids` tracking for stopping services started by `start_service.sh`.
- Changed `start_service.sh` to launch backend/frontend with `nohup`, write logs to `.service-logs/`, and return immediately; tightened `stop_service.sh` so it stops detached PIDs reliably.
- Added CORS environment value logging in `start_service.sh` to debug public deployment issues.
- Added backend CORS preflight logging in `backend/app/main.py` to print Origin, requested method, and requested headers for OPTIONS requests.
- Refreshed the frontend visual style with broader accent colors and more colorful dashboard/list/chart treatments.
- Split `Ngân sách` and `Giao dịch` into separate sidebar navigation items, with `Ngân sách` as the default first page.
- Added frontend asset cache-busting query strings to `index.html` so deployed UI changes are visible after refresh.
- Reworked the category spending area away from a long single-row chart and then merged it into the budget-progress card view.
- Merged `Chi tiêu theo danh mục` into `Tiến độ ngân sách`; budget progress now uses the chart-card box UI and keeps per-card edit controls.
- Added persistent budget card background colors and changed budget card editing so users can edit only amount/color, not category name.
- Removed red from selectable budget card colors; legacy red card values render with the default blue.
- Changed frontend money category defaults, demo data, local-state normalization, and backend category-load migration so known default categories use Vietnamese names instead of legacy English values.
- Synced budget and transaction add dropdowns to the `Danh mục` page category list instead of mixing in historical transaction/budget categories.
- Changed the budget-add dropdown to show the full defined category list and show `Đã có ngân sách cho hạn mục này, xem ở dưới` when a selected category already has a budget this month.
- Expanded budget card edit color choices with additional non-red-adjacent swatches, removed the old orange/red-adjacent selectable color, and made budget cards automatically render red danger styling when progress is at or above 100%.
- Added user profile settings with display name, avatar URL, currency preference, account info, and password change.
- Added VND, Dollar, and Euro formatting preferences controlled from the profile page.
- Changed friend adding into a request flow with incoming accept/reject and outgoing cancel actions; existing direct friendship rows migrate as accepted.
- Removed income from the active money workflow: defaults/demo data exclude income categories, transaction forms submit only expenses, API transaction lists/summaries are expense-only, and old local income rows are ignored.
- Extended default login sessions to 30 days.
- Added the current user to the `Bạn bè` list as a non-removable comparison row using the same aggregate budget percent format as friends.
- Added first-login onboarding with monthly income and two per-category budget levels (`Chi tiêu tối thiểu`, `Chi tiêu đầy đủ`), plus a profile action to rerun onboarding.
- Added financial timeline estimates for `Độc lập tài chính` and `Tự do tài chính` based on monthly income and the two onboarding budget levels.
- Kept registration auto-login, ensured onboarding only appears for authenticated users, and kept onboarding input fields empty when opened.
- Reworked onboarding category setup into recommended and user-selected lists with add/remove/custom category controls, and removed the validation that forced full spending to be at least minimum spending.
- Added currency unit selection to onboarding and persisted it through the existing profile update endpoint before onboarding completion.
- Replaced the separate onboarding custom-category row with a plus control at the end of the recommended list that expands into an inline name input.
- Changed selected onboarding budget rows from always-editable boxes into confirmed label rows with explicit edit and delete controls.
- Fixed the onboarding selected-row layout so edit fields no longer squeeze the action buttons, and the delete button remains visible.
- Widened the onboarding setup panel, reduced and tightened the left explanation column so it fits in one desktop viewport, narrowed the recommendation list, and added live onboarding estimate cards for `Độc lập tài chính` and `Tự do tài chính`.
- Added `Thiết lập sau` to onboarding so users can enter the app without creating initial budgets, and updated default/recommended categories to exclude income-related items while adding `Dating` and `Gửi bố mẹ`.
- Reordered onboarding default/recommended categories to put costly categories first and kept `Tiết kiệm` out of the default/recommendation list, including legacy normalization.
- Added frontend recovery for stale/invalid auth tokens so users are sent back to login automatically instead of needing DevTools/localStorage cleanup.
- Improved stale-token recovery by validating the saved token before onboarding renders and preserving in-progress onboarding drafts when a session expires during save.
- Hid API URL from login/register and profile UI while keeping runtime-config based API resolution.
- Deduped friend and friend-request lists in backend responses and frontend rendering, and made friend deletion remove all accepted reciprocal rows between two users.
- Added authenticated avatar image uploads from the profile screen, local `/uploads` static serving, frontend preview/type/size validation, and backend smoke coverage for uploaded avatar URLs.
- Collapsed the `Ngân sách` tab add-budget form to a single add button until users choose to add a new budget, then shows category and amount fields with save/cancel actions.
- Changed budget writes to effective-from-month behavior: new budgets, edits, and deletes apply from the selected month onward, while earlier months keep the earlier budget values.
