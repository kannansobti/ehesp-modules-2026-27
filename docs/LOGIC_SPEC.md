# EHESP Master Track & Module Selection - Validation Logic Handover Spec

**Version:** 2026-27, generated from a rules file that has been corrected and verified feasible across all 8 tracks by an automated constraint solver.

## 0. How to use this document (read first)

You are building a single app that lets a master student pick their track, auto-fills mandatory modules, lets them choose electives in fixed stages, blocks any invalid combination AT THE MOMENT OF SUBMIT (not after), then writes one row per student to a SharePoint list and confirms by email.

Rules below are FINAL and already proven satisfiable. Do not "simplify", "fix", or relax any rule. Every data value (module codes, ECTS, teaching weeks, tier candidates) is given inline in Section 2 and as JSON in Appendix A. Use those exact values; do not invent modules.

The single hardest rule is the week-clash check (Section 4, R6). Implement it exactly as specified, including the Advanced-block exemption, or the app will wrongly reject valid selections. Section 6 gives the Power Fx patterns for it.

## 1. Glossary

| Designation | Meaning |
|---|---|
| **Mandatory** | Auto-selected for the track, shown ticked and locked (student cannot remove). |
| **Elective1 .. Elective5** | Progressive choice tiers. Student completes Elective1 picks before Elective2 is enabled, and so on. |
| **Supra** | Optional extra module chosen only at the very end, and only if it does not clash (R6) with already-selected modules. |
| **NO** | Module is not available for that track. Never show it as selectable for that track. |

Some elective steps are an OR across tiers, written e.g. `Elective4/Elective3/Elective2`: the candidate pool is the union of those tiers, and the student picks the required count from that pool.

## 2. Data (use exactly)

### 2.1 Module catalog

`TeachingWeeks` is the set of ISO weeks the module occupies (it is the basis for clash detection, NOT the start date). `IsAdvancedBlock = true` marks the parallel September block (codes 202-206) that is exempt from clashing with itself.

| Code | Name | ECTS | Start | End | TeachingWeeks | IsAdvancedBlock |
|---|---|---|---|---|---|---|
| BioUp | Biostastistics Upgrade | 3.0 | 2026-08-24 | 2026-08-28 | 2026-W35 | false |
| 202 | Advanced Module Prevention & Health Promotion | 3.0 | 2026-09-07 | 2026-10-09 | 2026-W37,2026-W38,2026-W39,2026-W40,2026-W41 | true |
| 203 | Advanced Module Epidemiology | 3.0 | 2026-09-07 | 2026-10-09 | 2026-W37,2026-W38,2026-W39,2026-W40,2026-W41 | true |
| 204 | Advanced Module Biostatistics | 3.0 | 2026-09-07 | 2026-10-09 | 2026-W37,2026-W38,2026-W39,2026-W40,2026-W41 | true |
| 205 | Advanced Module Health Policy & Management | 3.0 | 2026-09-07 | 2026-10-09 | 2026-W37,2026-W38,2026-W39,2026-W40,2026-W41 | true |
| 206 | Advanced Module Health and Environment in a context of Climate Change | 3.0 | 2026-09-07 | 2026-10-09 | 2026-W37,2026-W38,2026-W39,2026-W40,2026-W41 | true |
| 209 | Health Promotion & Education | 3.0 | 2026-10-19 | 2026-10-23 | 2026-W43 | false |
| 223 | Design & Concepts | 3.0 | 2026-10-19 | 2026-10-23 | 2026-W43 | false |
| 228 | Managing Community Program Implementation | 3.0 | 2026-11-16 | 2026-11-20 | 2026-W47 | false |
| 218 | Identification & Diagnosis of Environmental Health Problems in a Territory | 3.0 | 2026-10-19 | 2026-10-23 | 2026-W43 | false |
| 215 | Introduction to R for Data Science in Public Health | 3.0 | 2026-10-26 | 2026-10-30 | 2026-W44 | false |
| 220 | Health Communication | 3.0 | 2026-10-26 | 2026-10-30 | 2026-W44 | false |
| 210 | Infectious Disease Epidemiology | 3.0 | 2026-11-02 | 2026-11-06 | 2026-W45 | false |
| 211 | Chronic Disease Epidemiology | 3.0 | 2026-11-02 | 2026-11-06 | 2026-W45 | false |
| 213 | Health Economics | 3.0 | 2026-11-02 | 2026-11-06 | 2026-W45 | false |
| 233 | GIS & Environmental Health | 3.0 | 2026-11-02 | 2026-11-06 | 2026-W45 | false |
| 212 | Politics of Health Financing | 3.0 | 2026-11-16 | 2026-11-20 | 2026-W47 | false |
| 219 | Integration of Environmental Health in Policies, Projects & Interventions | 3.0 | 2026-11-16 | 2026-11-20 | 2026-W47 | false |
| 231 | Spatial Stastistical Analysis | 3.0 | 2026-11-16 | 2026-11-20 | 2026-W47 | false |
| 226 | Health Care Management | 3.0 | 2026-11-30 | 2026-12-04 | 2026-W49 | false |
| 240 | Advanced Quantitative Methods in Population Mental Health | 3.0 | 2026-11-30 | 2026-12-04 | 2026-W49 | false |
| 214 | Data Mining & Longitudinal Data | 3.0 | 2026-12-07 | 2026-12-11 | 2026-W50 | false |
| 217 | Impact Assessment in Environmental Health | 3.0 | 2026-12-07 | 2026-12-11 | 2026-W50 | false |
| 235 | Humanitarian Health in Crisis Situations | 3.0 | 2026-12-07 | 2026-12-11 | 2026-W50 | false |
| 230 | Multi-Level Analysis | 3.0 | 2026-12-14 | 2026-12-18 | 2026-W51 | false |
| 239 | Health Promotion & Disease Prevention Program & Policy Planning | 3.0 | 2026-12-14 | 2026-12-18 | 2026-W51 | false |
| 241 | Monitoring and following Environmental Health actions | 1.5 | 2026-12-14 | 2026-12-16 | 2026-W51 | false |
| 208 | Evaluation of Public Health Programs | 3.0 | 2027-01-04 | 2027-01-08 | 2027-W01 | false |
| 224 | Analysis in Epidemiology I | 3.0 | 2027-01-04 | 2027-01-08 | 2027-W01 | false |
| 242 | Case Study in EOHS | 4.5 | 2027-01-06 | 2027-01-15 | 2027-W01,2027-W02 | false |
| 221 | Prevention & Lifestyle Behaviour Change | 3.0 | 2027-01-11 | 2027-01-15 | 2027-W02 | false |
| 225 | Analysis in Epidemiology II | 3.0 | 2027-01-11 | 2027-01-15 | 2027-W02 | false |
| 227 | Health Policies & Health System Analysis in LMICs | 3.0 | 2027-01-18 | 2027-01-22 | 2027-W03 | false |
| 229 | Modelling of Infectious Diseases | 3.0 | 2027-01-18 | 2027-01-22 | 2027-W03 | false |
| 238 | Perinatal & Pediatric Epidemiology | 3.0 | 2027-01-18 | 2027-01-22 | 2027-W03 | false |
| 201 | Cross-Disciplinary Module - Global Health | 3.0 | 2027-02-01 | 2027-02-05 | 2027-W05 | false |
| IntEPH | Integration Module EPH | 3.0 | 2027-06-14 | 2027-06-25 | 2027-W24,2027-W25 | false |

Note non-3-ECTS modules: 241 = 1.5, 242 = 4.5. Always SUM real ECTS; never count modules.

### 2.2 Per-track rules

| Track | Level | ECTS floor |
|---|---|---|
| EPH_EPI/ISB | EPH | 33 |
| EPH_HECC | EPH | 33 |
| MPH_EPI | MPH | 36 |
| MPH_ISB | MPH | 36 |
| MPH_HECC | MPH | 36 |
| MPH_HPM | MPH | 36 |
| MPH_PHP | MPH | 36 |
| MPH_GEN | MPH | 36 |

#### EPH_EPI/ISB  (level EPH, floor 33 ECTS)

*Original rule text:* Mandatory Modules for 12 ECTS. One Elective1 modules for 3 ECTS. Five Elective2 modules for 15 ECTS. One Elective3 module for 3 ECTS. Supra can be selected among electives.

**Mandatory (auto-select, locked):** 203, 204, 223, IntEPH  - 12.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 202, 205, 206 |
| Elective2 | 5 | 215, 231, 214, 230, 224, 225, 229 |
| Elective3 | 1 | 210, 211, 238 |

**Supra (optional, end only, clash-gated):** BioUp, 233, 240

#### EPH_HECC  (level EPH, floor 33 ECTS)

*Original rule text:* Mandatory modules for 24 ECTS and two elective1 modules for 6 ECTS. EPH Integration module for 3 ECTS.

**Mandatory (auto-select, locked):** 204, 206, 218, 233, 219, 241, 242, IntEPH  - 24.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 3 | 215, 226, 229 |

#### MPH_EPI  (level MPH, floor 36 ECTS)

*Original rule text:* Mandatory modules for 18 ECTS. One Elective1 module for 3 ECTS. One Elective2 module for 3 ECTS. One Elective3 module for 3 ETCS. One Elective 4 or Elective3 or Elective2 module for 3 ECTS. Two elective5 modules for 6 ECTS.

**Mandatory (auto-select, locked):** 203, 204, 223, 224, 225, 201  - 18.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 202, 205, 206 |
| Elective2 | 1 | 210, 211, 238 |
| Elective3 | 1 | 231, 214, 230 |
| Elective4/Elective3/Elective2 | 1 | 215, 231, 214, 230, 210, 211, 238 |
| Elective5 | 2 | 209, 228, 218, 213, 233, 212, 219, 226, 240, 217, 235, 239, 241, 227, 229 |

#### MPH_ISB  (level MPH, floor 36 ECTS)

*Original rule text:* Mandatory modules for 21 ECTS. One Elective1 module for 3 ECTS. Three Elective2 modules for 9 ECTS. One Elective3 module or Elective2 module for 3 ECTS.

**Mandatory (auto-select, locked):** 203, 204, 231, 214, 230, 229, 201  - 21.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 202, 205, 206 |
| Elective2 | 3 | 223, 215, 233, 240, 224, 225 |
| Elective3/Elective2 | 1 | 228, 218, 220, 210, 211, 213, 226, 208, 242, 221, 223, 215, 233, 240, 224, 225 |

#### MPH_HECC  (level MPH, floor 36 ECTS)

*Original rule text:* Mandatory modules for 27 ECTS. One Elective1 module for 3 ECTS. Two Elective2 modules for 6 ECTS.

**Mandatory (auto-select, locked):** 204, 206, 218, 233, 219, 217, 241, 242, 201  - 27.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 202, 203, 205 |
| Elective2 | 2 | 215, 226, 229 |

**Supra (optional, end only, clash-gated):** 240, 227, 238

#### MPH_HPM  (level MPH, floor 36 ECTS)

*Original rule text:* Mandatory modules for 6 ECTS. One Elective1 module for 3 ECTS. One Elective2 module for 3 ECTS. Five Elective3 modules for 15 ECTS. Three Elective4 or Elective3 modules for 9 ETCS.

**Mandatory (auto-select, locked):** 205, 201  - 6.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 202, 206 |
| Elective2 | 1 | 203, 204 |
| Elective3 | 5 | 228, 213, 212, 226, 235, 208, 227 |
| Elective4/Elective3 | 3 | 209, 223, 218, 215, 220, 210, 211, 233, 219, 231, 240, 214, 217, 230, 239, 241, 224, 242, 221, 225, 229, 238, 228, 213, 212, 226, 235, 208, 227 |

#### MPH_PHP  (level MPH, floor 36 ECTS)

*Original rule text:* Mandatory modules for 27 ECTS. One Elective1 module for 3 ECTS. Two Elective2 modules for 6 ECTS.

**Mandatory (auto-select, locked):** 202, 205, 209, 228, 220, 226, 239, 221, 201  - 27.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 1 | 203, 204, 206 |
| Elective2 | 2 | 218, 210, 211, 213, 233, 214, 217, 235, 230, 208, 224, 242, 227, 229, 238 |

#### MPH_GEN  (level MPH, floor 36 ECTS)

*Original rule text:* One Mandatory module for 3 ECTS. Three Elective1 modules for 9 ECTS. 8 Elective2 modules for 24 ECTS.

**Mandatory (auto-select, locked):** 201  - 3.0 ECTS

**Elective steps (in order):**

| Step | Pick exactly | From candidates |
|---|---|---|
| Elective1 | 3 | 202, 203, 204, 205, 206 |
| Elective2 | 8 | 209, 223, 228, 218, 215, 220, 210, 211, 213, 233, 212, 219, 231, 226, 240, 214, 217, 235, 230, 239, 241, 208, 224, 242, 221, 225, 227, 229, 238 |

### 2.3 Output: SharePoint list `TrackSelections`

One row per student. **StudentEmail is the unique key** (upsert on it; never create a duplicate).

| Column | Type | Notes |
|---|---|---|
| StudentEmail | Single line of text | **Unique key.** Lower-cased. Use to upsert. |
| FirstName | Single line of text | |
| LastName | Single line of text | |
| Track | Choice | One of the 8 track codes. |
| SelectedModules | Single line of text | Comma-separated module codes, sorted. |
| SelectedModulesDetail | Multiple lines of text | JSON array of {code, tier, ects} for audit. |
| TotalECTS | Number | Computed sum, must equal stored selection. |
| Status | Choice | Submitted / Updated. |
| SubmittedAtUtc | Date and Time | Set on write. |
| SubmittedBy | Single line of text | User().Email of the signed-in submitter. |

Recommended reference lists so dashboards and the app share one source: `Modules` (Section 2.1 columns) and `TrackRules` (Section 2.2 as rows: Track, Tier, SelectN, CandidateCodes). The app can also hold these as in-memory collections seeded on start if you prefer not to maintain lists.

## 3. Selection flow (UX)

1. Screen 1 - Identity: capture FirstName, LastName, StudentEmail (validate email format). Pre-fill StudentEmail from User().Email if available; still editable.
2. Screen 2 - Track: single choice of the 8 tracks. On select, build the working set: add all Mandatory modules for that track (ticked, locked) and compute the running ECTS total.
3. Screen 3 - Electives, staged: present Elective1 first. Show only that tier's candidate modules (exclude NO and already-selected). Enforce the exact pick count for the step before enabling the next step. For OR-steps, show the union of the listed tiers. Disable any candidate that would clash (R6) with the current selection, with a tooltip naming the clashing week.
4. Screen 4 - Supra (optional): show Supra candidates that do NOT clash with the current selection. Student may add zero or more.
5. Screen 5 - Review & submit: show the full selection grouped by tier, the ECTS total vs the floor, and a green/blocked state. The Submit button is enabled only when ALL validation rules (Section 4) pass. On submit, write to SharePoint (Section 5) and show confirmation.

Throughout, keep a live panel: running ECTS, count remaining per current step, and a list of occupied weeks. Never let the student advance past a step whose pick count is unmet.

## 4. Validation rules (the contract - all must pass to submit)

**R1 Mandatory present & locked.** Every Mandatory module for the chosen track is in the selection and cannot be deselected.

**R2 Progressive tiers.** Tier N picks are only enabled after tier N-1 has exactly its required count. The student cannot select from a later tier while an earlier tier is unmet.

**R3 Exact tier counts.** For each elective step, the number of selected modules drawn from that step's candidate pool equals the required count exactly (not at least). A module counts toward only one step.

**R4 Distinct modules.** No module appears twice. OR-steps share pools with other tiers, so enforce global distinctness across the whole selection.

**R5 Availability.** No selected module has designation NO for the chosen track. Only Mandatory, the track's tier candidates, and Supra are selectable.

**R6 No week clash (with Advanced-block exemption).** For every pair of selected modules A and B: if their TeachingWeeks sets intersect, that is a clash and the selection is INVALID - EXCEPT when both A.IsAdvancedBlock and B.IsAdvancedBlock are true (the parallel September block runs concurrently by design and never clashes with itself). Clash is on the FULL week set, not the start date: a module spanning several weeks occupies all of them.

**R7 Supra gating.** A Supra module may be added only if it passes R6 against the already-selected set. Supra is never required.

**R8 ECTS floor.** Sum of ECTS over all selected modules (using real ECTS values, incl. 1.5 and 4.5) is >= the track's floor (EPH = 33, MPH = 36).

Submit is permitted iff R1-R8 all hold. If any fail, block submit and list the specific failures (e.g. "Elective2: pick 3, you picked 2"; "Week clash: 209 and 228 both in 2026-W43"; "Total 30 ECTS below floor 33").

## 5. Submit, idempotency, confirmation

1. **Upsert, never append.** Look up an existing `TrackSelections` row where StudentEmail equals the (lower-cased) entered email. If found, UPDATE it and set Status = Updated; otherwise CREATE and set Status = Submitted. This guarantees one row per student even on resubmission, so the data can never be collected twice or duplicated.
2. Re-run Section 4 server-side on write where possible (a Power Automate flow validating before Patch) so a crafted client cannot store an invalid row.
3. Write SelectedModules (sorted, comma-separated), SelectedModulesDetail (JSON), TotalECTS, SubmittedAtUtc = Now() in UTC, SubmittedBy = User().Email.
4. Send a confirmation email to StudentEmail listing the track, the modules with ECTS, and the total. State that resubmitting will overwrite the previous choice.
5. Show an on-screen confirmation with the same summary and a note that they may return and edit until the deadline.

## 6. Power Apps / Power Fx implementation notes (where generators usually fail)

These are patterns, adapt names as needed.

**Store teaching weeks as a delimited string** on each module (e.g. `"2026-W37,2026-W38"`). Compare two modules by splitting and intersecting:

```
// returns true if modules with week-strings wsA and wsB share any week
WeeksOverlap(wsA:Text, wsB:Text):Boolean =
  CountRows(
    Filter( Split(wsA, ","),
            !IsBlank(LookUp(Split(wsB, ","), Value = Result)) )
  ) > 0;
```

**Clash test for a candidate `cand` against selected collection `colSel`** (R6 with exemption):

```
ClashesWithSelection(cand:Record):Boolean =
  CountRows(
    Filter( colSel,
       !( cand.IsAdvancedBlock && IsAdvancedBlock )   // both advanced => no clash
       && WeeksOverlap(cand.TeachingWeeks, TeachingWeeks) )
  ) > 0;
```

**Running ECTS:** `Sum(colSel, ECTS)`  - keep colSel as records carrying ECTS so this is one call.

**Tier count check (exact):** for a step over candidate codes in `tierCodes` needing `n`: `CountRows(Filter(colSel, Code in tierCodes)) = n`.

**Identity / dedup:** seed StudentEmail with `Lower(User().Email)`; on submit `LookUp(TrackSelections, StudentEmail = Lower(txtEmail.Text))` then `Patch` the found record or `Defaults`.

**Delegation:** SharePoint has delegation limits; keep the Modules reference list small (it is ~37 rows) and load it into a collection on Start: `ClearCollect(colModules, Modules)`. Do all filtering against the collection, not the live list, to avoid delegation warnings.

**Do not** try to express R6 with a single nested-gallery formula generated blindly; build the named helpers above first, then call them. This is the step Copilot tends to get wrong.

## 7. Acceptance tests (the app MUST reproduce these)

Each track has at least one valid full selection (proven by solver). The app must accept these and must reject the listed invalid cases.

### EPH_EPI/ISB
- **VALID** (expect accept, 39.0 ECTS, floor 33): `203, 204, 223, IntEPH, 202, 210, 215, 231, 214, 230, 224, BioUp, 240`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `203, 204, 223, IntEPH`

### EPH_HECC
- **VALID** (expect accept, 33.0 ECTS, floor 33): `204, 206, 218, 233, 219, 241, 242, IntEPH, 215, 226, 229`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `204, 206, 218, 233, 219, 241, 242, IntEPH`

### MPH_EPI
- **VALID** (expect accept, 36.0 ECTS, floor 36): `203, 204, 223, 224, 225, 201, 202, 210, 231, 215, 226, 217`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `203, 204, 223, 224, 225, 201`

### MPH_ISB
- **VALID** (expect accept, 36.0 ECTS, floor 36): `203, 204, 231, 214, 230, 229, 201, 202, 223, 215, 233, 226`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `203, 204, 231, 214, 230, 229, 201`

### MPH_HECC
- **VALID** (expect accept, 39.0 ECTS, floor 36): `204, 206, 218, 233, 219, 217, 241, 242, 201, 202, 215, 226, 227`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `204, 206, 218, 233, 219, 217, 241, 242, 201`

### MPH_HPM
- **VALID** (expect accept, 36.0 ECTS, floor 36): `205, 201, 202, 203, 228, 213, 226, 235, 208, 209, 215, 230`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `205, 201`

### MPH_PHP
- **VALID** (expect accept, 36.0 ECTS, floor 36): `202, 205, 209, 228, 220, 226, 239, 221, 201, 203, 210, 214`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `202, 205, 209, 228, 220, 226, 239, 221, 201`

### MPH_GEN
- **VALID** (expect accept, 36.0 ECTS, floor 36): `201, 202, 203, 204, 209, 228, 215, 210, 226, 214, 230, 208`
- **INVALID** (expect reject - mandatory only, fails tier counts & floor): `201`

General invalid cases that must be rejected for any track:
- Any selection containing two modules that share a teaching week and are not both Advanced-block (e.g. picking both 209 and 228 if 228 were still in W43).
- Any selection with total ECTS below the track floor.
- Any selection missing a required elective-tier count or including a NO module.
- Two submissions from the same email must result in ONE row (the second updates the first).

## 8. Decisions already made (do not revert)

The source rules were internally inconsistent; the following were resolved and verified. Keep them:

- **1. Clash policy fixed** (HIGH): Adopted ADV_EXEMPT as the official rule. Under the literal all-pairs reading, 0/8 tracks were solvable.
- **2. ECTS floor EPH_EPI/ISB** (HIGH): Floor 36 -> 33. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor EPH_HECC** (HIGH): Floor 36 -> 33. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_EPI** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_ISB** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_HECC** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_HPM** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_PHP** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **2. ECTS floor MPH_GEN** (HIGH): Floor 33 -> 36. Every EPH rule text sums to 33 and every MPH rule text to 36; the stated floors were inverted.
- **3. EPH_HECC Elective1** (NEEDS SIGN-OFF): Pick 2 -> 3 Elective1 so the track reaches the 33 floor (its modules max out at 30 with 2). Deviates from rule text "two elective1". Alternative: set EPH_HECC floor to 30.
- **4. MPH_PHP clash** (NEEDS SIGN-OFF): Module 228 moved from ['2026-W43'] to 2026-W47 (proposed). 209 and 228 were both mandatory in W43 and cannot share a week. Replace with the real timetable date if different.

Two items are marked NEEDS SIGN-OFF above; they are provisional defaults pending the programme owner. Build to them as written; they are easy to change in one place if overridden.

## Appendix A - full machine-readable data

The exact data and rules are in the accompanying file `track_selection_spec_2026-27_FIXED.json` (same values as Section 2). Structure: `meta`, `modules[]` (code, name, ects, start, end, teaching_weeks, n_weeks), `tracks{}` (level, ects_floor, mandatory[], electives{tier:{select_n, available, candidates[]}}, supra[], rule_text). Feed that JSON alongside this document.
