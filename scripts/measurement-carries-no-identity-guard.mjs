#!/usr/bin/env node
// =============================================================================
// measurement-carries-no-identity-guard — the covenant's second half, in code
// =============================================================================
// Darrell, 2026-10-16: "We will not personally sell data... we all have Google
// currently... we will build what we need to offload from these services in the
// meantime we will get all the value from our data!!! Just tell the users!!!
// We are transitioning and need data to have clarity and understanding.... not
// to prey on our users." And then, sharpening it: "Count what makes sure we
// build solid solutions... period... dont add constraints for fake values... we
// won't willingly sell data... period... however we are still learning and
// researching and don't know everything yet... so its a risk... period!!!"
//
// So measurement is ALLOWED and DISCLOSED (DR-1071), and the covenant promises
// a WILL rather than a perfection: "the church will never willingly sell my
// record, my giving or my prayer requests."
//
// THAT IS WHY THIS FILE EXISTS AND WHY IT IS NARROW. A guard cannot make a
// system safe, and a guard that pretends to is the "constraint for a fake
// value" he named -- it buys a feeling of safety with none of the substance.
// What a guard CAN do is hold the one thing fully inside our hands: our own
// code. "Willingly" is a statement about intent, and intent in software is
// what the source says. The cheap way a signed sentence goes false is not a
// decision anyone makes -- it is a convenient extra argument on a measurement
// call six months from now: a user id "so we can segment", an email "to match
// the CRM", a fund name on a giving event. Each is one line, each is a WILLING
// hand-over, and each breaks a sentence somebody put their name to. This file
// makes that line fail the build.
//
// WHAT IT REFUSES: a call to a third-party measurement/analytics sink that
// carries an identifier or a protected subject. It does NOT forbid measurement,
// it does not forbid Google sign-in (app/src/lib/supabase.js, signInWithOAuth
// provider 'google', which the covenant now names plainly), and it does not
// touch our own sovereign usage_events -- those stay on the family's own
// equipment and are governed by RLS, not by this file.
//
// WHAT IT DOES NOT CLAIM: that nothing leaks. A dependency, a header, a
// referrer, an IP, a mistake we have not thought of yet -- none of that is
// visible here. The covenant says so in its own words rather than letting this
// guard's green check stand in for a safety nobody has built (DR-0076 ss3).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'app', 'src');

/** Third-party measurement sinks. Adding one is allowed; feeding it is not. */
const SINKS = /\b(gtag|ga|dataLayer\.push|fbq|_paq\.push|posthog\.(capture|identify)|mixpanel\.(track|identify)|analytics\.(track|identify)|amplitude\.(logEvent|setUserId)|plausible|umami\.track)\s*\(/;

/** Things that must never ride along to one. */
const IDENTITY = /\b(user_?id|userId|member_?id|memberId|\bemail\b|display_?name|displayName|full_?name|fullName|phone|session\.user|auth\.user|user\.id)\b/i;
const SUBJECT = /\b(giving|gift_?amount|amount_?cents|tithe|offering|prayer|prayer_?request|contribution|donat\w*|balance|debt|ssn|dob|diagnos\w*|phi)\b/i;

export { SINKS, IDENTITY, SUBJECT };

export function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '__tests__') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * Scan one file's source. Pure: no I/O, no clock. Returns one finding per
 * offending line, each naming the word that must not have ridden along.
 *
 * The scan is LINE-SCOPED on purpose. A sink call and its arguments are
 * written on one line in practice, and widening to a multi-line argument list
 * would start flagging unrelated code below an innocent call -- a guard that
 * cries wolf gets switched off, and a gate nobody trusts protects nothing.
 * The honest statement of its reach is in the header, not in a wider regex.
 */
export function scanSource(text, file = '<source>') {
  const stripped = stripComments(text);
  // A stripper eager enough to blank real code would make this guard pass on
  // anything -- which is the "always green" lie. A file that is GENUINELY all
  // comments strips to nothing and is fine, so the signal has to be narrower
  // than "went blank": the raw text held a sink call and the stripped text
  // holds nothing at all. That can only be the stripper's doing.
  if (SINKS.test(text) && !stripped.trim()) {
    return [{ file, line: 0, kind: 'unreadable file', word: 'comment-strip blanked a file that held a sink call' }];
  }
  const out = [];
  stripped.split('\n').forEach((l, i) => {
    if (!SINKS.test(l)) return;
    const id = l.match(IDENTITY);
    const sub = l.match(SUBJECT);
    if (id) out.push({ file, line: i + 1, kind: 'identifier', word: id[0] });
    else if (sub) out.push({ file, line: i + 1, kind: 'protected subject', word: sub[0] });
  });
  return out;
}

export function main() {
  const findings = [];
  let files = 0;
  for (const file of walk(SRC)) {
    files += 1;
    findings.push(...scanSource(readFileSync(file, 'utf8'), relative(ROOT, file)));
  }
  if (findings.length === 0) {
    console.log(`measurement-carries-no-identity-guard: OK — ${files} file(s), no measurement call carries an identifier or a protected subject.`);
    return 0;
  }
  console.log('measurement-carries-no-identity-guard FAILED — a sentence somebody signed would become false:\n');
  for (const f of findings) {
    const article = /^[aeiou]/i.test(f.kind) ? 'an' : 'a';
    console.log(`  ${f.file}:${f.line} — a measurement call carries ${article} ${f.kind} (${f.word})`);
  }
  console.log('\nThe member covenant says the church "will never willingly sell my record, my');
  console.log('giving or my prayer requests" (DR-1071), and somebody put their name to that.');
  console.log('Measurement is allowed and disclosed; sending WHO, or WHAT THEY GAVE, along with');
  console.log('it is the willing hand-over that sentence rules out. Count the page, not the person.');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
