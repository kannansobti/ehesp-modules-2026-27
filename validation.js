/*
 * validation.js  -  EHESP track & module selection rules engine.
 *
 * Pure logic, no DOM and no platform APIs, so the SAME file runs in three places:
 *   1. the browser form (include with <script src="validation.js">)
 *   2. Google Apps Script (paste this file in as "validation.gs" - server-side re-check)
 *   3. Node (require it in tests/run_tests.js)
 *
 * It needs a SPEC object (see spec.js / data/spec.json). All rules below are the
 * FINAL, solver-verified rules. Do not relax them. Clash detection uses the full
 * teaching-week set with the Advanced-Module block (codes 202-206) exempt from
 * clashing with itself, because that block runs concurrently by design.
 *
 * Main entry point:
 *   validateSelection(spec, trackId, picks, opts)
 *     picks = [{ code: "203", role: "mandatory" | "<TierName>" | "supra" }, ...]
 *     opts  = { ectsCeiling: <number|null> }   // optional cap; omit for floor-only
 *   -> { ok: Boolean, violations: [String], totalEcts: Number }
 */

function ehespModuleIndex(spec) {
  var mm = {};
  for (var i = 0; i < spec.modules.length; i++) { mm[spec.modules[i].code] = spec.modules[i]; }
  return mm;
}
function ehespIsAdvanced(mod) {
  return !!(mod && mod.name && mod.name.indexOf('Advanced Module ') === 0);
}
function ehespWeeksOverlap(a, b) {
  for (var i = 0; i < a.length; i++) { if (b.indexOf(a[i]) !== -1) return true; }
  return false;
}
function ehespClash(mm, a, b) {
  if (a === b) return false;
  var ma = mm[a], mb = mm[b];
  if (!ma || !mb) return false;
  if (ehespIsAdvanced(ma) && ehespIsAdvanced(mb)) return false; // concurrent block
  return ehespWeeksOverlap(ma.teaching_weeks, mb.teaching_weeks);
}

function validateSelection(spec, trackId, picks, opts) {
  opts = opts || {};
  var v = [];
  var track = spec.tracks[trackId];
  if (!track) { return { ok: false, violations: ['Unknown track: ' + trackId], totalEcts: 0 }; }

  var mm = ehespModuleIndex(spec);
  var codes = [];
  for (var i = 0; i < picks.length; i++) { codes.push(picks[i].code); }

  // unknown modules
  for (var i = 0; i < codes.length; i++) {
    if (!mm[codes[i]]) v.push('Unknown module: ' + codes[i]);
  }
  // distinct
  var seen = {};
  for (var i = 0; i < codes.length; i++) {
    if (seen[codes[i]]) v.push('Duplicate module: ' + codes[i]);
    seen[codes[i]] = true;
  }

  var mandSet = {}; for (var i = 0; i < track.mandatory.length; i++) mandSet[track.mandatory[i].code] = true;
  var supraSet = {}; for (var i = 0; i < track.supra.length; i++) supraSet[track.supra[i].code] = true;

  // role / availability of each pick
  for (var i = 0; i < picks.length; i++) {
    var p = picks[i];
    if (p.role === 'mandatory') {
      if (!mandSet[p.code]) v.push('Module ' + p.code + ' tagged mandatory but is not mandatory for ' + trackId);
    } else if (p.role === 'supra') {
      if (!supraSet[p.code]) v.push('Module ' + p.code + ' tagged supra but is not a supra option for ' + trackId);
    } else {
      var tier = track.electives[p.role];
      if (!tier) { v.push('Unknown elective tier "' + p.role + '" for module ' + p.code); }
      else if (tier.candidates.indexOf(p.code) === -1) { v.push('Module ' + p.code + ' is not a candidate for ' + p.role + ' in ' + trackId); }
    }
  }

  // all mandatory present
  for (var i = 0; i < track.mandatory.length; i++) {
    var mc = track.mandatory[i].code, has = false;
    for (var j = 0; j < picks.length; j++) { if (picks[j].code === mc && picks[j].role === 'mandatory') { has = true; break; } }
    if (!has) v.push('Missing mandatory module: ' + mc);
  }

  // exact tier counts
  for (var tierName in track.electives) {
    if (!track.electives.hasOwnProperty(tierName)) continue;
    var need = track.electives[tierName].select_n, got = 0;
    for (var j = 0; j < picks.length; j++) { if (picks[j].role === tierName) got++; }
    if (got !== need) v.push('Tier ' + tierName + ': pick exactly ' + need + ', selected ' + got);
  }

  // ECTS floor (+ optional ceiling)
  var total = 0;
  for (var i = 0; i < codes.length; i++) { if (mm[codes[i]]) total += mm[codes[i]].ects; }
  if (total < track.ects_floor) v.push('Total ' + total + ' ECTS is below the floor of ' + track.ects_floor);
  if (opts.ectsCeiling != null && total > opts.ectsCeiling) v.push('Total ' + total + ' ECTS exceeds the ceiling of ' + opts.ectsCeiling);

  // week clash (all pairs)
  for (var a = 0; a < codes.length; a++) {
    for (var b = a + 1; b < codes.length; b++) {
      if (ehespClash(mm, codes[a], codes[b])) v.push('Week clash: ' + codes[a] + ' and ' + codes[b] + ' share a teaching week');
    }
  }

  return { ok: v.length === 0, violations: v, totalEcts: total };
}

/* convenience helpers the UI uses */
function ehespMandatoryFor(spec, trackId) {
  var t = spec.tracks[trackId]; if (!t) return [];
  return t.mandatory.map(function (m) { return m.code; });
}
function ehespTierOrder(spec, trackId) {
  var t = spec.tracks[trackId]; if (!t) return [];
  return Object.keys(t.electives);
}
// returns candidates of a tier that do NOT clash with the already-chosen codes (for live disabling / supra gating)
function ehespNonClashingCandidates(spec, trackId, tierOrSupra, chosenCodes) {
  var t = spec.tracks[trackId]; if (!t) return [];
  var mm = ehespModuleIndex(spec);
  var pool = (tierOrSupra === 'supra')
    ? t.supra.map(function (m) { return m.code; })
    : (t.electives[tierOrSupra] ? t.electives[tierOrSupra].candidates : []);
  return pool.filter(function (c) {
    if (chosenCodes.indexOf(c) !== -1) return false;
    for (var i = 0; i < chosenCodes.length; i++) { if (ehespClash(mm, c, chosenCodes[i])) return false; }
    return true;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateSelection: validateSelection,
    clash: ehespClash,
    moduleIndex: ehespModuleIndex,
    mandatoryFor: ehespMandatoryFor,
    tierOrder: ehespTierOrder,
    nonClashingCandidates: ehespNonClashingCandidates
  };
}
