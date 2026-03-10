# Lead App System Overview (Frontend + Backend)

## Repos / folders
- `lead-be-test/`
  - Node backend serving API + static dashboard on `http://localhost:3000/`.
- `lead-app-fe/`
  - Frontend repo containing the **current production dashboard** (modular ES modules).
  - Also contains friend-delivered reference UIs:
    - `lead-app-fe/frontend/` (reference glass UI)
    - `lead-app-fe/admin/` (reference admin console)

## What is the “current dashboard”?
The authoritative UI is:
- `lead-app-fe/index.html`
- `lead-app-fe/style-2.css`
- `lead-app-fe/main.js`
- `lead-app-fe/js/*`

This is the version we actively maintain.

## Frontend technologies used
- **Vanilla HTML/CSS/JS** (no React/Vue).
- **ES Modules** (`main.js` imports from `js/*`).
- Fonts:
  - `Inter` (UI)
  - `JetBrains Mono` (email/phone/URLs)
- Icons:
  - Monochrome inline SVG via `js/icons.js`.
- Theme:
  - Light/dark driven by `data-theme` + CSS variables in `style-2.css`.

## Backend contract (current)
The dashboard is built around these existing endpoints:
- `POST /api/run-outreach` (streams NDJSON)
- `GET /api/history`
- `DELETE /api/history/:id`

### Streaming message types (NDJSON)
The UI expects lines of JSON containing:
- `{"type":"status","message":"..."}`
- `{"type":"result","data":{...}}`
- `{"type":"done","summary":"..."}`
- `{"type":"error","message":"..."}`

## Modularity / code organization (why it stays clean)
### Entry point
- `main.js` is the only script referenced by the dashboard HTML.
- `main.js`:
  - calls initializers (theme, mode tag)
  - wires global event handlers
  - exposes a small set of functions onto `window` for inline `onclick` attributes

### Modules (single responsibility)
- `js/outreach.js`
  - owns the outreach run: fetch, stream parsing, progress updates, stage updates
- `js/resultsTable.js`
  - owns rendering + filtering of the results table and summary counters
- `js/history.js`
  - owns the history modal, search/dedup, delete row
- `js/modal.js`
  - owns “View Draft” modal display + copy email body
- `js/stages.js`
  - owns the stage indicator DOM toggles (`#stageBar`, `data-stage`)
- `js/toast.js`
  - owns toasts + clipboard helper
- `js/theme.js`
  - owns theme application + toggle
- `js/icons.js`
  - owns the icon set
- `js/state.js`
  - shared in-memory state (results, filters, history rows)
- `js/utils.js`
  - small pure helpers (escaping, date formatting, etc.)

### Maintenance rules (keep it low-debug)
- Keep modules **pure and single-purpose**.
- Do not add new inline scripts in `index.html`.
- Keep UI hooks stable:
  - do not change element IDs used by JS
  - if new hooks are needed, add **classes**
- Prefer adding a new module rather than growing a "god" file.
- Centralize fetch logic (future): if/when auth/admin is added, use one `apiClient` module.

## Pages we have today
### Production dashboard
- `/` → `lead-app-fe/index.html`
  - Campaign setup
  - Live results
  - History modal
  - Draft modal

### Reference pages (friend)
These are **not authoritative** and should be treated as reference/prototypes:
- `lead-app-fe/frontend/index.html`, `lead-app-fe/frontend/login.html`
- `lead-app-fe/admin/index.html`, `lead-app-fe/admin/login.html`

## What your friend’s UI has that yours does not (pure UI/UX)
If you only compare *look and feel* (ignoring auth/admin API requirements), their UI includes:
- **Glassmorphism design system**
  - gradient background + floating orbs
  - glass cards, bento layout
- **Richer navigation framing**
  - pill header style
  - more tooltips/labeling
- **More UI surfaces**
  - settings modal UX
  - stop/cancel button UX (visual + control)
  - collapsible config card controls
- **Admin console visuals** (charts, activity feed, kill-switch toggle)

## Recommended future pages (useful for your system)
These are pages that typically reduce confusion and keep ops smooth:
- **History / Archive page** (full page view, not only modal)
- **Run logs page** (per campaign, streamed messages persisted)
- **Templates page** (saved templates, variables, preview)
- **Settings page** (default sender config; theme)
- **Admin page** (only if you decide to implement admin endpoints)
- **Help / Docs page** (placeholder list, streaming meanings, troubleshooting)

## How we will track which ideas we adopted
We’ll keep a simple “borrowed ideas” note documenting:
- which visual components came from the friend prototype
- what we implemented in the modular dashboard
- where it lives (file/module)

File:
- `documents/borrowed-ideas.md`
