# SETUP — deploy the EHESP enrolment app

Two free pieces, two one-time logins. No subscription, no institutional access.

---

## A. Back end first (Google Apps Script + Sheet)

1. Create a Google Sheet to hold responses. Copy its ID from the URL
   (`https://docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit`).
2. Go to https://script.google.com → New project.
3. In the project create three script files and paste in:
   - `Code.gs`        ← from `apps-script/Code.gs`
   - `validation.gs`  ← from `apps-script/validation.gs`
   - `spec.gs`        ← from `apps-script/spec.gs`
   (Apps Script shares one global scope across files, so `SPEC` and `validateSelection`
   defined in spec.gs/validation.gs are visible to Code.gs.)
4. In `Code.gs`, set `CONFIG.sheetId` to your Sheet ID. Choose `CONFIG.dedupMode`
   (`overwrite` is the safe default). Optionally set `ccProgramme` and `ectsCeiling`.
5. Deploy → New deployment → type **Web app**.
   - Description: anything.
   - **Execute as: Me** (so it can write your Sheet and send mail from your account).
   - **Who has access: Anyone**.
   - Deploy. Approve the permission prompt (this is **login #1**, your Google account —
     it authorises storage + email; it is a security boundary, not a step you can skip).
6. Copy the **Web app URL**. That is your endpoint.

### Optional: deploy with `clasp` instead of clicking
If `clasp` is installed and logged in (`clasp login`), you can `clasp create`, `clasp push`,
and `clasp deploy` the `apps-script/` folder, then read the deployment URL. Same Google
login is still required once.

---

## B. Front end (GitHub Pages)

1. In `web/index.html`, set `APP_CONFIG.endpoint` to the Web app URL from step A6.
   (Optionally set `ectsCeiling` to match the backend.)
2. Create a free GitHub account if needed (a personal account is fine — no institution).
3. New repository (public is fine; the page contains no secrets). Upload the **contents of
   `web/`** (`index.html`, `spec.js`, `validation.js`) to the repo root via "Add file →
   Upload files", or push with git/`gh`.
4. Repo **Settings → Pages** → Source: deploy from branch, `main`, `/root`. Save.
   (This is **login #2**, your GitHub account.)
5. After a minute the live URL appears, like `https://<user>.github.io/<repo>/`. That is the
   link you give students.

### Optional: deploy with the `gh` CLI
If `gh` is authenticated (`gh auth status`), Claude Code can `gh repo create`, push `web/`,
and enable Pages via the API in one pass. Same one-time GitHub login.

---

## C. The one fragile point: cross-origin POST

The page lives on `github.io`; the script lives on `google.com`. A browser treats that as a
cross-site request and will block a "complex" one. Avoid that by posting as a **simple
request**: `Content-Type: text/plain` and a JSON string body (already done in `index.html`).
Do **not** send `application/json` or custom headers — that triggers a CORS preflight Apps
Script does not answer, and the call fails silently. If you ever see the submit "hang" with a
CORS error in the console, this is why; revert to `text/plain`.

---

## D. Smoke test before sharing the link
1. Open the GitHub Pages link. Pick a track, complete a valid selection, submit.
2. Confirm: a row appears in the Sheet, and a confirmation email arrives.
3. Resubmit with the same email → confirm it updates the same row (overwrite mode), or is
   blocked (lock mode).
4. Try an invalid selection (too few electives, or a clashing module) → confirm Submit stays
   disabled and the violations are shown.
5. Send one test confirmation to a real institutional address to check it is not filtered as
   spam. If it is, deploy the Apps Script under an EHESP/Workspace account or set a reply-to.

Once C and D pass, the loop is fully autonomous: student opens link → validates → submits →
stored + emailed, with no one in the middle.
