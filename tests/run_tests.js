/* Run with: node tests/run_tests.js   (from the package root) */
var path = require('path');
var SPEC = require(path.join(__dirname, '..', 'web', 'spec.js'));
var V = require(path.join(__dirname, '..', 'web', 'validation.js'));
var cases = require(path.join(__dirname, 'acceptance.json'));

var pass = 0, fail = 0;
cases.forEach(function (c, i) {
  var r = V.validateSelection(SPEC, c.track, c.picks, {});
  var ok = (c.expect === 'accept') ? r.ok : !r.ok;
  if (ok) { pass++; }
  else {
    fail++;
    console.log('FAIL #' + i + ' [' + c.track + '] expected ' + c.expect + ' (' + c.note + ')');
    console.log('   got ok=' + r.ok + ' ects=' + r.totalEcts + ' violations=' + JSON.stringify(r.violations));
  }
});
console.log('\n' + pass + ' passed, ' + fail + ' failed, of ' + cases.length + ' acceptance cases.');
if (fail > 0) { process.exit(1); }
