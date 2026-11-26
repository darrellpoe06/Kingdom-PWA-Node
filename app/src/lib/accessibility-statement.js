// =============================================================================
// accessibility-statement — what we hold ourselves to, and where we stand (DR-1660)
// =============================================================================
// Darrell 2026-11-25: "Make sure WCAG 2.1 AA is being honest about ourselves
// and make sure we're good" and "I need references to the WCAG 2.1 AA etc
// inside all apps."
//
// ONE SOURCE, EVERY APP. The statement renders in the shared "Appearance &
// Accessibility" sheet (PersonalizeSheet), which every door opens. It says the
// standard by name, what has been MEASURED, and what has NOT, in plain words.
// It never says "fully compliant": a claim this page makes must trace to a
// measurement (DR-0076). When a gap closes, its line moves from `notYet` to
// `measured` in the same change that proves it, with the date.
// =============================================================================

import HEALTH from './legibility-health.json';

// Read from the legibility guard's own measured file, never typed by hand, so
// the statement moves when the measurement does.
const SUM = (HEALTH && HEALTH.summary) || {};
export const PAGES = Object.freeze({ total: Number(SUM.pages) || 0, passing: Number(SUM.passing) || 0 });
const BELOW = PAGES.total - PAGES.passing;

export const WCAG = Object.freeze({
  name: 'WCAG 2.1 Level AA',
  full: 'Web Content Accessibility Guidelines 2.1, Level AA (W3C)',
  url: 'https://www.w3.org/TR/WCAG21/',
});

export const STATEMENT = Object.freeze({
  checkedOn: '2026-11-25',
  goal: `Our standard is ${WCAG.name}: text you can read, controls you can reach by keyboard and screen reader, and nothing that depends on color alone.`,
  measured: Object.freeze([
    'The theme colors are checked for 4.5:1 text contrast on every build.',
    `Each page’s text colors are checked against its backgrounds on every build: ${PAGES.passing} of ${PAGES.total} pages pass, and no page may get worse.`,
    'Learn, the four lesson views (Watch, Read, Listen, Study) and the download door were scanned at phone size with axe-core against the WCAG 2.0 and 2.1 A and AA rules: no violations found.',
    'The new Institute view (its home and six sections) was scanned the same way in three color themes: after fixing the low-contrast red text it found, no violations remain.',
  ]),
  notYet: Object.freeze([
    ...(BELOW > 0 ? [`${BELOW} pages still have text colors below 4.5:1 against their background; they are listed and being worked down.`] : []),
    'Words over photographs (Learn covers and headlines, and the Institute banner and course cards) are improved but not yet measured to pass contrast on every picture.',
    'Many screens have not had an automated WCAG scan yet; the scan does not run on every build yet.',
  ]),
  report: 'Something hard to see, hear or reach? Tell us here. It goes to the stewards with the page you were on.',
});

/** The text a barrier report sends (pure). */
export function barrierReportText(words, where = '') {
  const w = String(words || '').trim();
  return `Accessibility barrier (${WCAG.name}): ${w || '(no details given)'}${where ? ` (${where})` : ''}`;
}

/** Send a barrier report on the feedback pipe. -> { ok } or { ok:false, why }. */
export async function sendBarrierReport(words, { where = '', upload } = {}) {
  const send = upload || (await import('./feedback-sync.js')).uploadFeedback;
  try {
    const r = await send({ text: barrierReportText(words, where), area: 'Accessibility', sentiment: 'negative' }, { activeTab: 'Accessibility' });
    if (r && r.uploaded) return { ok: true };
    return { ok: false, why: r && r.skipped === 'signed-out' ? 'sign-in' : 'failed' };
  } catch {
    return { ok: false, why: 'failed' };
  }
}
