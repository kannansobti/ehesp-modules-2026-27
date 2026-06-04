# BUILD BRIEF FOR CLAUDE CODE — EHESP Module Selection App (2026-27)

You are finishing and deploying a student module-selection web app. The hard parts
(the rules, the data, the validation engine, the backend logic) are DONE and verified.
Your job is to assemble, polish the UI, and deploy. **Do not re-derive or relax any rule.**

## What this app must do
A master student opens a link, enters name/surname/email, picks one of 8 tracks, gets
mandatory modules auto-selected and locked, chooses electives in fixed stages, optionally
adds Supra modules, and submits. An invalid selection is **blocked at submit time, in the
browser**. On submit the validated selection goes to a Google Apps Script that stores one
row per student in a Google Sheet (keyed on email) and emails a confirmation.

## Architecture (already decided)
- **Front end:** a single static page (`web/index.html`) hosted on **GitHub Pages**.
  All validation runs client-side via `web/validation.js`, driven by `web/spec.js`.
- **Back end:** a **Google Apps Script web app** (`apps-script/`) = the only "server".
  It stores to a Sheet and sends email. GitHub Pages cannot do storage or email; the
  Apps Script is what does.
- One shared rules engine (`validation.js`) runs in BOTH places so the browser and the
  server enforce identical rules.

## Files
```
docs/
  BUILD_BRIEF.md      <- this file
  LOGIC_SPEC.md       <- full human-readable rules, data tables, acceptance tests, decisions
  SETUP.md            <- step-by-step deploy (GitHub Pages + Apps Script + the 2 logins)
data/
  spec.json           <- machine-readable source of truth (rules + modules)
web/
  spec.js             <- spec.json embedded as `var SPEC = {...}` for the static page
  validation.js       <- the rules engine. validateSelection(spec, track, picks, opts)
  index.html          <- WORKING skeleton wiring spec+validation+UI+submit. Redesign freely.
apps-script/
  Code.gs             <- backend: re-validate, upsert, email, reply
  validation.gs       <- copy of validation.js (paste into the Apps Script project)
  spec.gs             <- copy of spec.js (paste into the Apps Script project)
tests/
  acceptance.json     <- per-track valid + invalid cases with expected accept/reject
  run_tests.js        <- `node tests/run_tests.js` must print "29 passed, 0 failed"
```

## Your tasks, in order
1. **Verify the engine still passes:** run `node tests/run_tests.js`. It must show all
   acceptance cases passing before and after any change you make. Treat this as the contract.
2. **Build the real UI** on top of `index.html` (use your frontend-design skill). Keep the
   exact flow: details → track → locked mandatory → staged electives (reveal tier N+1 only
   when tier N has exactly its required count) → optional Supra → review → submit. Disable
   any candidate that would clash; show a live ECTS total vs the floor; enable Submit only
   when `validateSelection(...).ok` is true. **Reuse `validateSelection`; never reimplement it.**
3. **Wire submission** to the Apps Script endpoint (POST as `text/plain` to avoid a CORS
   preflight — see SETUP.md, this is the one place a naive call fails silently).
4. **Set the config** in `web/index.html` (APP_CONFIG.endpoint) and `apps-script/Code.gs`
   (CONFIG.sheetId, dedupMode, etc.) — see SETUP.md.
5. **Deploy** per SETUP.md: publish `web/` to GitHub Pages; deploy the Apps Script as a web
   app. These need exactly two one-time browser logins (GitHub, Google). Use the `gh` CLI
   and `clasp` if available; otherwise give the user the click steps.
6. **Smoke test** end to end: submit a valid selection for one track, confirm a row appears
   in the Sheet and a confirmation email arrives; submit an invalid one, confirm it is blocked.

## Rules you must NOT change (see LOGIC_SPEC.md for full detail)
- Clash = teaching-week-set overlap, EXCEPT the Advanced-Module block (codes 202–206) which
  is exempt from clashing with itself. This is implemented in `validation.js`; keep it.
- ECTS floors: EPH = 33, MPH = 36. Sum REAL ECTS (module 241 = 1.5, 242 = 4.5); never count modules.
- Tier picks are exact counts. Mandatory are auto and locked. Supra is optional and clash-gated.
- One row per student, keyed on lower-cased email (upsert). Server re-validates before storing.

## Open settings the user may flip (defaults are set; change in one place if asked)
- `CONFIG.dedupMode` in Code.gs: `overwrite` (default) | `lock` | `deadline`.
- `ectsCeiling` (in both APP_CONFIG and CONFIG): `null` = floor only (default), or a number to cap.
- Two rule items are provisional pending the programme owner (EPH_HECC third elective; module
  228 rescheduled to week 47). They are already baked into spec.json. If overridden, edit
  spec.json, regenerate spec.js/spec.gs, and re-run the tests.

Start by reading LOGIC_SPEC.md and running the tests.
