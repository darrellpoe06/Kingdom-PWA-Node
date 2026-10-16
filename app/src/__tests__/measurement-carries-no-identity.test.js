// @vitest-environment node
//
// DR-1071. Darrell, 2026-10-16, twice in one sitting:
//
//   "Just tell the users!!! We are transitioning and need data to have clarity
//    and understanding.... not to prey on our users... however without data...
//    we have no analytics!!! Which we use to get better!!!"
//
//   "Count what makes sure we build solid solutions... period... dont add
//    constraints for fake values... we won't willingly sell data... period...
//    however we are still learning and researching and don't know everything
//    yet... so its a risk... period!!! Grow with us or don't!!!"
//
// The posture that produced this guard: measurement is ALLOWED and DISCLOSED,
// the promise is a WILL rather than a perfection, and the only constraint
// worth adding is one that holds something really inside our hands. Our source
// is inside our hands. So the guard refuses exactly one thing — a third-party
// measurement call that carries WHO the person is or WHAT THEY GAVE — and
// claims nothing beyond that.
//
// This file is the proof that the refusal works, because a gate that always
// passes is itself a lie (DR-0076 rule 3). The mutations below are the real
// lines somebody would write: each is one plausible argument, added for a good
// reason, that breaks a sentence a member signed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanSource, stripComments, SINKS } from '../../../scripts/measurement-carries-no-identity-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('PROVEN-TO-CATCH — the line a reasonable person would add', () => {
  it('catches a user id on a Google Analytics event ("so we can segment")', () => {
    const hits = scanSource("gtag('event', 'gave', { user_id: session.user.id });", 'Give.jsx');
    expect(hits.length).toBe(1);
    expect(hits[0]).toMatchObject({ file: 'Give.jsx', line: 1, kind: 'identifier' });
  });

  it('catches an email on a dataLayer push ("to match the CRM")', () => {
    const hits = scanSource("dataLayer.push({ event: 'signup', email: form.contactEmail });");
    expect(hits.length).toBe(1);
    expect(hits[0].kind).toBe('identifier');
  });

  it('catches what they GAVE even with nobody named — a lone amount still tells on them', () => {
    // This is the subtler one. No identifier anywhere, so an identity-only
    // check would wave it through; but a giving event on a signed-in surface
    // is the giving record walking out the door one event at a time.
    const hits = scanSource("plausible('Gave', { props: { amount_cents: gift.amountCents } });");
    expect(hits.length).toBe(1);
    expect(hits[0]).toMatchObject({ kind: 'protected subject' });
  });

  it('catches a prayer request on a product-analytics call', () => {
    expect(scanSource("posthog.capture('prayer_submitted', { prayer: body });")[0].kind).toBe('protected subject');
  });

  it('catches the identify() calls, which exist to do exactly this', () => {
    for (const line of [
      "mixpanel.identify(user.id);",
      "amplitude.setUserId(session.user.id);",
      "analytics.identify(member_id, { email });",
    ]) {
      expect(scanSource(line), line).toHaveLength(1);
    }
  });
});

describe('...and does NOT cry wolf, because a guard nobody trusts gets switched off', () => {
  it('a page count with no person in it passes — measurement is the point, not the enemy', () => {
    expect(scanSource("gtag('event', 'page_view', { page_path: '/give' });")).toEqual([]);
    expect(scanSource("plausible('Opened the Songbook');")).toEqual([]);
  });

  it('OUR OWN sovereign counting passes untouched — it never leaves the family’s equipment', () => {
    // recordView() writes a row in usage_events on our own Supabase, governed
    // by RLS. It is not a third-party sink and this file has no opinion on it.
    expect(scanSource("await recordView({ user_id: session.user.id, path });")).toEqual([]);
    expect(scanSource("supabase.from('usage_events').insert({ user_id, path });")).toEqual([]);
  });

  it('GOOGLE SIGN-IN passes — the covenant names that door rather than forbidding it', () => {
    // app/src/lib/supabase.js offers signInWithOAuth provider 'google'. DR-1071
    // discloses it in the signed statement; a guard that broke the build over it
    // would be a constraint defending a value we do not actually hold.
    expect(scanSource("supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });")).toEqual([]);
  });

  it('a comment that merely DESCRIBES the hazard does not fail the build', () => {
    // Including this file's own prose, and this record's. Three suites in this
    // repo have now been caught matching their own documentation.
    const src = [
      "// never gtag('event', { user_id }) — that is the thing we refuse",
      "/* and not fbq('track', { email }) either */",
      "const ok = true;",
    ].join('\n');
    expect(scanSource(src)).toEqual([]);
  });

  it('...but the comment-stripper cannot silently blank a file either', () => {
    // The failure mode that would make every assertion above meaningless: a
    // stripper so eager it returns whitespace, after which the guard passes on
    // anything. Caught explicitly rather than assumed.
    expect(stripComments("gtag('event', { user_id })").trim()).toBeTruthy();
    const blanked = scanSource('/* everything is a comment */');
    expect(blanked).toEqual([]);         // genuinely nothing to find
    const notBlanked = scanSource("/* c */\ngtag('e', { user_id });");
    expect(notBlanked).toHaveLength(1);  // real code below a comment still scans
  });
});

describe('the guard runs green on the tree as it stands', () => {
  it('no third-party measurement sink is even installed yet (DR-1070 measured this)', () => {
    // The honest state of things as this ships: index.html loads no tracker, so
    // there is not yet a single sink for the guard to refuse. It is in place
    // BEFORE the thing it governs arrives, which is the only time a guard is
    // cheap to add. Read from the real file rather than claimed.
    const html = readFileSync(join(ROOT, 'app', 'index.html'), 'utf8');
    for (const vendor of [/googletagmanager/i, /google-analytics/i, /gtag\(/, /connect\.facebook/i, /segment\.(com|io)/i]) {
      expect(html, `a third-party tracker appeared in index.html: ${vendor}`).not.toMatch(vendor);
    }
  });

  it('and the sink list is a real regex, not an empty one that matches nothing', () => {
    // A guard whose pattern matches nothing is the "always passes" lie in its
    // purest form.
    expect(SINKS.test("gtag('event')")).toBe(true);
    expect(SINKS.test("const x = render();")).toBe(false);
  });
});
