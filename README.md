# EHESP Module Selection 2026-27 — Claude Code handover package

Hand this whole folder to Claude Code and point it at `docs/BUILD_BRIEF.md`.

Everything correctness-critical is done and verified:
- Rules + module data: `data/spec.json` (source of truth), embedded for the page in `web/spec.js`.
- Validation engine: `web/validation.js` — runs in the browser AND in Google Apps Script.
- Backend: `apps-script/` — stores to a Google Sheet (one row per student, keyed on email)
  and emails a confirmation.
- Front-end skeleton: `web/index.html` — working; Claude Code redesigns the UI but reuses the engine.
- Tests: `node tests/run_tests.js` must print "29 passed, 0 failed".

Read order: docs/BUILD_BRIEF.md → docs/LOGIC_SPEC.md → docs/SETUP.md.
