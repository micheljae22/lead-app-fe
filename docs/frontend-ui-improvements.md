# Frontend UI Improvements (RankRadar)

## Change Log
- 10:03am 07/03/2026 +05:30 GMT (Sri Lanka time): Added JS modular entrypoint (`main.js`) for the dashboard (`index.html`), split dashboard logic into `js/*` modules, and improved Contact History view (safe date parsing + optional dedup view toggle).
- 10:26am 07/03/2026 +05:30 GMT (Sri Lanka time): Renamed dashboard to `index.html` and moved old UI to `index-legacy.html` + `style-legacy.css`. Updated backend static hosting so `GET /` serves the dashboard over HTTP (required for ES modules). Improved Contact History "Hide duplicates" to dedupe per business/domain (one row per business).
- 10:37am 07/03/2026 +05:30 GMT (Sri Lanka time): Organized legacy UI into `lead-app-fe/legacy/` and kept the dashboard at the repo root. Legacy page is now `legacy/index-legacy.html` with `legacy/style-legacy.css` + `legacy/script.js`. Dashboard continues to use ES modules (`main.js` + `js/*`) and should be opened over `http://localhost:3000/`.

## Files produced
- `lead-app-fe/index.html` (dashboard)
- `lead-app-fe/style-2.css`
- `lead-app-fe/main.js` (ES module entrypoint for the dashboard)
- `lead-app-fe/js/*` (modularized dashboard JS)

Legacy UI copies:
- `lead-app-fe/legacy/index-legacy.html`
- `lead-app-fe/legacy/style-legacy.css`
- `lead-app-fe/legacy/script.js`

## What changed

### Layout / Structure
- Replaced the single-column page flow with a **dashboard-style two-panel layout**:
  - **Left panel**: campaign form + templates + sender settings
  - **Right panel**: live results table + summary metrics
- Added a compact top header and simplified hero section.

### Campaign Form UX
- Clear labels + helper text.
- Kept all existing payload fields and IDs used by `script.js`:
  - `queryInput`, `emailTemplate`, `smsTemplate`
  - `senderName`, `gmailUser`, `gmailPass`, `subjectTemplate`
  - `voiplineToken`, `voiplineCallerId`
  - `runBtn`, `btnIcon`, `btnLabel`

### Live Results UX
- Added optional UI elements that `script.js` will use if present:
  - `autoScroll` checkbox
  - progress counters: `prProcessed`, `prTotal`
  - `liveHint` status text
- Improved "run in progress" behavior:
  - button disabled while streaming
  - button label/icon changes during the run
- Auto-scroll support (only if `autoScroll` exists and is checked).

### History UX
- Added optional `historySearch` input in the history modal.
- Updated `script.js` to filter the history table client-side when you type.
 - Added a frontend-only "Hide duplicates" toggle in the history modal (view-only deduplication; backend storage remains unchanged).
 - Fixed history date rendering to avoid `Invalid Date` by using safer timestamp parsing.

### JS modularization (dashboard only)
- `index.html` now loads `main.js` using `<script type="module">`.
- `main.js` imports smaller modules from `js/*` (theme, outreach stream, results table, modal, history).
- Inline HTML handlers (e.g. `onclick="runOutreach()"`) still work because `main.js` attaches the required functions to `window`.
- The legacy UI lives in `index-legacy.html` and continues using `script.js`.

### Visual Design
- New `style-2.css` provides a more modern SaaS dashboard feel:
  - card/panel styling
  - consistent spacing
  - improved typography hierarchy
  - sticky table header

## What was intentionally kept unchanged (backend compatibility)

### API endpoints
- `POST http://localhost:3000/api/run-outreach`
- `GET http://localhost:3000/api/history`
- `DELETE http://localhost:3000/api/history/:id`

### Request payload structure
`script.js` still sends:
- `query`
- `emailTemplate`
- `smsTemplate`
- `senderConfig` (with the same keys)
- `voiplineConfig` (with the same keys)

### Streaming contract
`script.js` still parses NDJSON messages in the same format:
- `{ "type": "status", "message": "..." }`
- `{ "type": "result", "data": { ... } }`
- `{ "type": "done", "summary": "..." }`
- `{ "type": "error", "message": "..." }`

### Result field names
The results UI continues to rely on the same result field names the backend streams:
- `businessName`, `email`, `phone`, `address`, `url`, `source`, `emailStatus`, `generatedEmail`

## Script changes summary
- **Button state**: uses `runBtn.disabled` instead of hiding the button.
- **Validation feedback**: shows an error message if query is empty.
- **Progress counters**: attempts to parse `Processing X/Y` from streamed status messages.
- **Auto-scroll**: scrolls the table container to bottom when enabled.
- **History search**: stores loaded rows, filters them on input.
- **Theme toggle**: preserves theme persistence via `localStorage` (`rr-theme`).

## Recommended next improvements (optional)
- Add a dedicated "Run in progress" cancel button that aborts the fetch stream.
- Add a small toast system for copy/delete confirmations.
- Add a dedicated empty-state illustration component.
- Add a compact "campaign settings" collapse/expand for smaller screens.
