/*
 * test-wf36-quality-gatekeeper.js   (Node, ASCII only)
 *
 * MVP test harness for wf36 (Quality Gatekeeper). Reads the LIVE jsCode out of
 * docs/00-foundations/n8n-workflows/36-quality-gatekeeper.json (single source
 * of truth -- no drift from the deployed workflow), runs it in a vm sandbox
 * with a stubbed n8n $input + in-memory fs, and asserts the decision against
 * the six binding MVP scenarios:
 *
 *   3 known-good surfaces        -> expect PASS
 *   3 known-drift hypotheticals  -> expect BLOCK
 *
 * Run from anywhere:
 *   node C:\Users\dpoe\Kingdom-PWA-Node\scripts\test-wf36-quality-gatekeeper.js
 *
 * Exit code 0 = all scenarios matched expectation; 1 = at least one mismatch.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const wfPath = path.join(repoRoot, 'docs', '00-foundations', 'n8n-workflows', '36-quality-gatekeeper.json');

const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const codeNode = wf.nodes.find(function (n) { return n.name === 'Run four-test gate'; });
if (!codeNode) {
  console.error('FAIL: could not find the "Run four-test gate" Code node in wf36 JSON.');
  process.exit(1);
}
const jsCode = codeNode.parameters.jsCode;

// In-memory fs stub: no real disk writes during the test; readFileSync of the
// events log throws (clean slate, no prior BLOCK history) unless seeded.
function makeFakeFs(seedEvents) {
  return {
    mkdirSync: function () {},
    writeFileSync: function () {},
    appendFileSync: function () {},
    readFileSync: function (p) {
      if (seedEvents && String(p).indexOf('_events.jsonl') !== -1) return seedEvents;
      throw new Error('ENOENT (test stub)');
    }
  };
}

function runGate(body, seedEvents) {
  const fakeFs = makeFakeFs(seedEvents);
  const sandbox = {
    $input: { first: function () { return { json: { body: body } }; } },
    require: function (m) {
      if (m === 'fs') return fakeFs;
      if (m === 'path') return path;
      return require(m);
    },
    console: console
  };
  vm.createContext(sandbox);
  const script = new vm.Script('__result = (function(){\n' + jsCode + '\n})();');
  script.runInContext(sandbox);
  return sandbox.__result[0].json;
}

// ---- The six binding MVP scenarios. Copy is representative of the real
// surfaces (drawn from BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md and the shipped
// cards) and the three named drift counterfeits.
const scenarios = [
  {
    name: 'GOOD 1 - Loved Ones tier card',
    expect: 'PASS',
    body: {
      surface_type: 'persona-card',
      content_snapshot: 'Loved Ones - Founding Family. Free PoeTech+ for life: the first 100 Church of the Living God families and chosen family invited directly by the Poe family. The Free African Society pattern made personal: belonging, not transaction. Soul first, then the family economy.',
      metadata: { surface_id: 'loved-ones-card', commit_hash: 'c381793', author: 'Darrell Poe' }
    }
  },
  {
    name: 'GOOD 2 - data-as-proof co-parents card',
    expect: 'PASS',
    body: {
      surface_type: 'pwa-feature',
      content_snapshot: 'Co-parents, on the same page. The system records what actually happened - debt reduced, buffer fund grown, tithe consistency, net worth trend - and shows it back to your family. Your data, owned by you, exportable any time. Data as proof, not a promise. Faithfulness is the metric, not yield.',
      metadata: { surface_id: 'coparents-card', commit_hash: '4e9cf68', author: 'Darrell Poe' }
    }
  },
  {
    name: 'GOOD 3 - testimony-diary spec',
    expect: 'PASS',
    body: {
      surface_type: 'foundation-doc',
      content_snapshot: 'Testimony Diary spec. A private, soul-first surface where a believer records what the Holy Spirit is doing - the watching, recognizing, recording posture. Yahweh is the source; the diary is the witness. Open to every user on their worst day without being driven further from the Father. Grace does not grow colder on the nth return.',
      metadata: { surface_id: 'testimony-diary-spec', commit_hash: 'abc1234', author: 'Claude' }
    }
  },
  {
    name: 'DRIFT 1 - prosperity-gospel distortion',
    expect: 'BLOCK',
    body: {
      surface_type: 'pwa-feature',
      content_snapshot: 'Activate your breakthrough! Sow a seed of $100 today and God guarantees you a hundredfold financial return. Name it and claim it - your faith unlocks guaranteed wealth. Plant your seed to reap your harvest.',
      metadata: { surface_id: 'prosperity-distortion-sample', commit_hash: 'deadbeef', author: 'unknown' }
    }
  },
  {
    name: 'DRIFT 2 - white-nationalist church counterfeit',
    expect: 'BLOCK',
    body: {
      surface_type: 'foundation-doc',
      content_snapshot: 'A church for the white race only. God ordained the separation of the races, and this congregation serves our people alone. Whites-only fellowship; no minorities.',
      metadata: { surface_id: 'racial-counterfeit-sample', commit_hash: 'deadbeef', author: 'unknown' }
    }
  },
  {
    name: 'DRIFT 3 - data-extractive engagement optimization',
    expect: 'BLOCK',
    body: {
      surface_type: 'workflow',
      content_snapshot: 'Growth plan: maximize daily active users with infinite scroll and dark patterns. Optimize for engagement and time-on-app. Sell anonymized user data to advertisers via our ad network. Build data lock-in so users cannot export.',
      metadata: { surface_id: 'extractive-engagement-sample', commit_hash: 'deadbeef', author: 'unknown' }
    }
  }
];

let pass = 0;
let fail = 0;
console.log('wf36 Quality Gatekeeper - MVP scenario test');
console.log('source: ' + wfPath);
console.log('--------------------------------------------------------------');
for (let i = 0; i < scenarios.length; i++) {
  const s = scenarios[i];
  let out, err = null;
  try { out = runGate(s.body); } catch (e) { err = e; }
  if (err) {
    fail++;
    console.log('[ERROR] ' + s.name + ' -> threw: ' + err.message);
    continue;
  }
  const ok = out.decision === s.expect;
  if (ok) pass++; else fail++;
  console.log('[' + (ok ? ' OK ' : 'FAIL') + '] ' + s.name);
  console.log('        expected ' + s.expect + ', got ' + out.decision);
  if (out.decision !== 'PASS') {
    console.log('        why: ' + out.reasoning);
    console.log('        anchor: ' + out.scripture_anchor.ref);
  }
}
console.log('--------------------------------------------------------------');
console.log('result: ' + pass + '/' + scenarios.length + ' scenarios matched expectation' + (fail ? ' (' + fail + ' MISMATCH)' : ''));
process.exit(fail ? 1 : 0);
