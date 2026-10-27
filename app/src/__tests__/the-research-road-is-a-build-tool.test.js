// @vitest-environment node
// =============================================================================
// The research road answers a build's question too (DR-1127)
// =============================================================================
// Darrell, 2026-10-20: "Can this research tab also be used for building...
// testing... development... etc?"
//
// The road already could; only the question was nailed down. research-health.yml
// joins the tailnet, SSHes to the NAS so the family token never leaves it, and
// asks ONE fixed question -- fixed on purpose, so its green means the same thing
// week to week. research-ask.yml is its sibling with the QUESTION as an input.
//
// WHY IT FITS A BUILD AND NOT A LESSON. research.js: the road "marks every
// answer verified:false". For a lesson that is disqualifying -- a wrong figure
// reaches a reader and the verifier is slow and external. For a build the
// verifier is already sitting there: a wrong answer about an API costs one red
// check. Unverified lead plus cheap local proof is right here and wrong there.
//
// THE CASE THAT MATTERS MOST IS THE PORT. My first draft of this workflow posted
// to 127.0.0.1:8099 -- a number I invented. The forwarder listens on 8797
// (research_forwarder.py's own default, and what the witness calls). And 8099 is
// not an unused number: it is the PROPERTY-PHOTO server's own port, a live
// listener on the same box, which 404s any POST but /upload and /media-upload.
// So the invented port would not have timed out -- it would have handed the
// question and the family-key bearer to the photo server and come back 404, and
// this workflow's own failure path would have printed "/ask answered 404: the
// road refused the call": one service's refusal wearing another's name. The port
// is pinned against the forwarder's own source, and 8099 against the photo
// server's, so the two can never be confused again by reading this file.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const ASK = readFileSync(join(REPO, '.github/workflows/research-ask.yml'), 'utf8');
const WITNESS = readFileSync(join(REPO, '.github/workflows/research-health.yml'), 'utf8');
const FORWARDER = readFileSync(join(REPO, 'infra/nas-research/research_forwarder.py'), 'utf8');
const ROAD = readFileSync(join(REPO, 'app/src/lib/research.js'), 'utf8');
const PHOTOS = readFileSync(join(REPO, 'infra/nas-property-photos/photo_server.py'), 'utf8');

/** Shell/YAML with `#` comments removed — prose must never be measured as code. */
const codeOnly = (t) => t.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

describe('it asks the road the caller\'s question, not a fixed one', () => {
  it('the question is an INPUT', () => {
    expect(ASK).toMatch(/inputs:[\s\S]*question:/);
    expect(codeOnly(ASK)).toMatch(/QUESTION: \$\{\{ inputs\.question \}\}/);
  });

  it('and the WITNESS keeps its fixed question, so its green stays comparable', () => {
    // The sibling exists precisely so the witness never has to take a parameter.
    expect(WITNESS).toMatch(/Where were the Dead Sea Scrolls found, and when\?/);
    expect(WITNESS).not.toMatch(/inputs\.question/);
  });
});

describe('PROVEN-TO-CATCH: the port is the forwarder\'s own, not one I made up', () => {
  it('the forwarder listens on 8797 by its own default', () => {
    expect(FORWARDER).toMatch(/--port[\s\S]{0,120}default=int\(os\.environ\.get\("PORT", "8797"\)\)/);
  });

  it('the ask road posts to that same port', () => {
    expect(codeOnly(ASK)).toMatch(/http:\/\/127\.0\.0\.1:8797\/ask/);
    // And never to the number my first draft invented. Only the code is checked:
    // the header above NAMES 8099 on purpose, so a reader meets the hazard.
    expect(codeOnly(ASK)).not.toMatch(/127\.0\.0\.1:8099/);
  });

  it('8099 is NOT spare — it is the photo server, which would have answered', () => {
    // This is why the port deserves a pin rather than a careful reading. 8099 is
    // a live listener on the same box, so the invented port would not have timed
    // out; it would have taken the question AND the family-key bearer and come
    // back 404, which this workflow reports as "the road refused the call".
    expect(PHOTOS).toMatch(/--port[\s\S]{0,120}default=int\(os\.environ\.get\("PHOTO_PORT", "8099"\)\)/);
    // Any POST but /upload and /media-upload: 404, not a silence.
    expect(PHOTOS).toMatch(/if not \(path\.endswith\("\/upload"\) or path == "\/upload"\):\s*\n\s*self\._send\(404,/);
  });

  it('the witness agrees on the port, so the two roads cannot drift', () => {
    expect(WITNESS).toMatch(/http:\/\/127\.0\.0\.1:8797/);
  });
});

describe('the family token never leaves the NAS, and free text never reaches a shell', () => {
  it('the HTTP call runs on the box over SSH, reading the token there', () => {
    const c = codeOnly(ASK);
    expect(c).toMatch(/ssh -i \/tmp\/nas_key/);
    expect(c).toMatch(/chat-bridge-token\.txt/);
    expect(c).toMatch(/umask 077/);
  });

  it('the token is never echoed, printed or put in a summary', () => {
    const c = codeOnly(ASK);
    expect(c).not.toMatch(/echo\s+"?\$TOK/);
    expect(c).not.toMatch(/print\(.*TOK/);
    // It reaches python as an env var and only ever becomes a header.
    expect(c).toMatch(/"Authorization": "Bearer " \+ \(os\.environ\.get\("TOK"\) or ""\)/);
  });

  it('the question is base64-encoded, because it is free text', () => {
    // The witness only passes true/false, so its plain interpolation is safe;
    // a question carrying a quote would break out of this one's.
    const c = codeOnly(ASK);
    expect(c).toMatch(/base64 -w0/);
    expect(c).toMatch(/base64\.b64decode/);
    expect(c).not.toMatch(/QUESTION='\$QUESTION'/);
  });

  it('and refuses a question past the road\'s own cap before spending the trip', () => {
    // The ONE cap, read from the app and required of the other two places it is
    // written. Spelled as a literal here before, which is how a raise of the
    // forwarder alone passed this case while the reader was still refused at 500.
    const cap = /MAX_QUERY_CHARS = (\d+)/.exec(ROAD)?.[1];
    expect(cap, 'the app must state the cap').toBeTruthy();
    expect(codeOnly(ASK)).toMatch(new RegExp(`-gt ${cap}`));
  });
});

describe('the answer is a lead, and the road says so about itself', () => {
  it('the road marks every answer unverified', () => {
    expect(ROAD).toMatch(/verified:false/);
  });

  it('the output says in words that nothing here may be treated as a finding', () => {
    expect(ASK).toMatch(/LEAD, not a finding/);
    expect(ASK).toMatch(/until something in this repo reproduces it/);
  });

  it('it fails when the ROAD failed, never because an answer is unwelcome', () => {
    const c = codeOnly(ASK);
    expect(c).toMatch(/the NAS did not answer over the tailnet/);
    expect(c).toMatch(/answered 200 with an empty answer/);
    // No judgement of the answer's content anywhere in the failure path.
    expect(c).not.toMatch(/if .*answer.*(contains|match).*: *sys\.exit\(1\)/);
  });

  it('only http(s) sources are carried out, as the app\'s own safeSources does', () => {
    expect(ROAD).toMatch(/export function safeSources/);
    expect(codeOnly(ASK)).toMatch(/startswith\(\("https:\/\/", "http:\/\/"\)\)/);
  });
});
