# Borrowed Ideas Tracker (Friend UI → Modular Dashboard)

## Purpose
Keep a running list of which concepts from the friend-provided `lead-app-fe/frontend` + `lead-app-fe/admin` prototypes we actually adopt into the maintained modular dashboard (`lead-app-fe/index.html` + `main.js` + `js/*` + `style-2.css`).

## Adopted so far
- None explicitly copied 1:1 as a system.

## Direction
- Keep the maintained dashboard in a clean SaaS style.
- Treat friend-delivered `frontend/` and `admin/` as reference/prototypes.

## Shortlist to consider adopting (UI-only, SaaS-friendly)
- Stop/Cancel run UX (only after confirming backend can safely cancel)
- Collapsible “Advanced settings” sections (reduce cognitive load)
- A small Settings surface (defaults for sender fields + theme)
- Tooltip patterns (CSS-only)
- Stronger onboarding empty-states + “How it works” helper panel

## Not adopting unless backend exists
- Token-gated login redirects
- `/api/auth/*` flows
- `/api/admin/*` console requirements

## Notes
- Any adoption should be done by porting **visual components** and reusing the modular JS code paths.
