// =============================================================================
// The public shelf has a witness (DR-0973)
// =============================================================================
// On 2026-10-11 a fix was reported to Darrell as live when it rendered
// nothing. Every gate was green — tests, the migration ledger, the deploy run
// on the exact SHA — and the card a stranger sees was still wrong, because
// nothing in the system had ever read it.
//
// He found all three faults himself, from his phone:
//   "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
//   "None say co-living!!!!!!!!!!!!!!!!!!!!!!"
//   "Why don't we show the same photos for both listings??????!!!!!!!!!"
//
// These cases pin the RULES the witness applies, so the instrument itself is
// proven to catch before it is trusted — a witness that cannot fail is the
// thing it exists to prevent (DR-0076 section 3).
import { describe, it, expect } from 'vitest';
import { judgeShelf, report, judgeDoorsAgainstShelf, parseDoorRows } from '../../../scripts/public-shelf-rules.mjs';

// His shelf, as it actually read before the fix.
const BEFORE = [
  { title: '1-bed multi-family in Champaign, Illinois', size: 'Rent on request · 1 bed · 1 bath', sharedLine: '', photos: 'See all 16 photos — 1 of 16' },
  { title: '1-bed multi-family in Champaign, Illinois', size: '$750/mo · 1 bed', sharedLine: '', photos: 'See all 39 photos — 1 of 39' },
  { title: 'multi-family in Champaign, Illinois', size: '$750/mo', sharedLine: '', photos: 'PHOTOGRAPHS COMING' },
];

// The same shelf as it should read once the level is inferred.
const AFTER = [
  { title: '1-bed multi-family in Champaign, Illinois', size: 'Rent on request · 1 bed · 1 bath', sharedLine: '', photos: 'See all 16 photos — 1 of 16' },
  { title: 'Bed in a shared multi-family in Champaign, Illinois', size: '$750/mo', sharedLine: 'A bed in a shared bedroom, two to a room, in a shared home. You would have housemates; the kitchen and bathroom are shared.', photos: 'See all 39 photos — 1 of 39' },
  { title: 'Bed in a shared multi-family in Champaign, Illinois', size: '$750/mo', sharedLine: 'A bed in a shared bedroom, two to a room, in a shared home. You would have housemates; the kitchen and bathroom are shared.', photos: 'See all 39 photos — 1 of 39' },
];

describe('the witness passes a shelf that tells the truth', () => {
  it('the corrected shelf raises nothing', () => {
    const r = judgeShelf(AFTER);
    expect(r.findings, r.findings.join('\n')).toEqual([]);
    expect(r.checked).toBe(3);
  });

  it('a whole unit keeps its bedroom count, because there it is true', () => {
    const r = judgeShelf([{ title: '2-bed multi-family in Champaign, Illinois', size: '$1200/mo · 2 bed · 1 bath', sharedLine: '', photos: 'See all 4 photos' }]);
    expect(r.findings).toEqual([]);
  });
});

describe('PROVEN-TO-CATCH: it fails on exactly what Darrell found', () => {
  it('THE LIMIT, MEASURED: it CANNOT catch his original shelf, and that is the honest finding', () => {
    // This is the case that stops the witness being theater. Run against his
    // real pre-fix shelf it raises NOTHING:
    const r = judgeShelf(BEFORE);
    expect(r.findings, 'if this ever finds something, the limit below has been closed and this case must be rewritten').toEqual([]);

    // WHY, and why it is not fixable from the DOM. Before 0278 his Bed B card
    // read "1-bed multi-family in Champaign, Illinois" — which is CHARACTER
    // FOR CHARACTER what a genuine one-bedroom apartment reads. The fact that
    // makes it wrong (the door is a bed in a shared room) is not on the page
    // at all. No rule over the rendered text can recover information the
    // page does not contain.
    //
    // So this witness catches a REGRESSION FROM THE CORRECTED STATE — a card
    // that says "shared" and also claims a bedroom count, a bed with no
    // housemates line, a card showing neither photographs nor an honest
    // absence. It would NOT have caught the founding incident.
    //
    // THE INSTRUMENT THAT DOES CATCH IT IS BUILT, in this same change:
    // judgeDoorsAgainstShelf below takes a SECOND reading from the database —
    // the level derived from what each door is CALLED — and compares it
    // against the label the shelf prints. Its own proven-to-catch case runs
    // the pre-fix rows and finds both beds. So the witness as a whole does
    // catch the founding incident; this case records precisely WHICH of its
    // two readings cannot, so nobody later mistakes the DOM half for the
    // whole instrument.
  });

  it('"0.5 Bedroom or 1-Bedroom?" — a shared card may not claim a bedroom count', () => {
    const r = judgeShelf([{
      title: 'Bed in a shared multi-family in Champaign, Illinois',
      size: '$750/mo · 1 bed · 1 bath',
      sharedLine: 'A bed in a shared bedroom, two to a room, in a shared home. You would have housemates; the kitchen and bathroom are shared.',
      photos: 'See all 39 photos',
    }]);
    expect(r.findings.join(' ')).toMatch(/says it is shared AND claims/);
    expect(r.findings.join(' ')).toMatch(/not a 1-bedroom place/);
  });

  it('"None say co-living!!!" — a bed with no housemates sentence is a finding', () => {
    const r = judgeShelf([{ title: 'Bed in a shared multi-family', size: '$750/mo', sharedLine: '', photos: 'See all 39 photos' }]);
    expect(r.findings.join(' ')).toMatch(/never says there are housemates/);
  });

  it('"Why don\'t we show the same photos" — neither pictures nor an honest absence is a finding', () => {
    const r = judgeShelf([{ title: 'Bed in a shared multi-family', size: '$750/mo', sharedLine: 'You would have housemates', photos: '' }]);
    expect(r.findings.join(' ')).toMatch(/neither photographs nor an honest/);
  });

  it('an honest "PHOTOGRAPHS COMING" is NOT a finding — a door nobody has photographed is allowed', () => {
    const r = judgeShelf([{ title: 'Bed in a shared multi-family', size: '$750/mo', sharedLine: 'You would have housemates', photos: 'PHOTOGRAPHS COMING' }]);
    expect(r.findings).toEqual([]);
  });
});

describe('UNKNOWN IS NOT PASS (DR-0076 section 8)', () => {
  it('PROVEN-TO-CATCH: an empty shelf FAILS rather than reading as healthy', () => {
    // "Nothing is advertised" and "the page is broken" look identical from a
    // browser, and a broken storefront is the worse of the two. This is the
    // case that stops the witness being a green tick that means nothing.
    const r = judgeShelf([]);
    expect(r.findings.length).toBe(1);
    expect(r.findings[0]).toMatch(/NO cards at all/);
    expect(r.checked).toBe(0);
  });

  it('a non-array is treated as empty, never as fine', () => {
    for (const junk of [null, undefined, 'cards', 42, {}]) {
      expect(judgeShelf(junk).findings.length, `${JSON.stringify(junk)} read as healthy`).toBe(1);
    }
  });
});

describe('what it prints', () => {
  it('a clean run says so plainly and names the base', () => {
    const text = report(judgeShelf(AFTER), 'https://poetech.us/properties/app/');
    expect(text).toMatch(/Cards read: 3/);
    expect(text).toMatch(/tells the truth about what it is/);
  });

  it('a failing run lists every finding', () => {
    // A shelf with a real regression on it, since BEFORE is undetectable
    // from the DOM (see the limit case above).
    const broken = [{ title: 'Bed in a shared multi-family', size: '$750/mo · 1 bed · 1 bath', sharedLine: '', photos: '' }];
    const text = report(judgeShelf(broken), 'https://poetech.us/properties/app/');
    expect(text).toMatch(/finding\(s\)/);
    expect(text.split('\n- ').length).toBeGreaterThan(1);
  });
});

describe('the second reading — the one a browser cannot take (DR-0973)', () => {
  // HIS DOORS, as the database would report them BEFORE 0278: the level
  // derived from what each door is CALLED, beside the label the shelf was
  // actually printing.
  const BEFORE_ROWS = [
    { level: 'unit', label: '1-bed multi-family in Champaign, Illinois', photos: 16 },
    { level: 'bed', label: '1-bed multi-family in Champaign, Illinois', photos: 39 },
    { level: 'bed', label: 'multi-family in Champaign, Illinois', photos: 0 },
  ];

  const AFTER_ROWS = [
    { level: 'unit', label: '1-bed multi-family in Champaign, Illinois', photos: 16 },
    { level: 'bed', label: 'Bed in a shared multi-family in Champaign, Illinois', photos: 39 },
    { level: 'bed', label: 'Bed in a shared multi-family in Champaign, Illinois', photos: 39 },
  ];

  it('PROVEN-TO-CATCH: it DOES catch the founding incident, which the DOM reading cannot', () => {
    // This is the whole reason the witness takes two readings. Run against
    // his real pre-fix shelf it finds both beds mislabelled.
    const r = judgeDoorsAgainstShelf(BEFORE_ROWS);
    expect(r.checked, 'only the shared doors are judged').toBe(2);
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
    expect(r.findings.join(' ')).toMatch(/bedroom count on a shared door is the 2026-10-11 fault/);
    expect(r.findings.join(' ')).toMatch(/never says it is shared/);
  });

  it('the corrected shelf agrees, and raises nothing', () => {
    const r = judgeDoorsAgainstShelf(AFTER_ROWS);
    expect(r.findings, r.findings.join('\n')).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it('a whole unit is never judged — there a bedroom count is true', () => {
    const r = judgeDoorsAgainstShelf([{ level: 'unit', label: '3-bed multi-family', photos: 4 }]);
    expect(r.checked).toBe(0);
    expect(r.findings).toEqual([]);
  });

  it('a shared door offered no photographs is a WARNING, not a finding', () => {
    // A bed nobody has photographed, in an apartment with none either, is
    // honest. Failing the run on it would be a guard that cries wolf (P46).
    const r = judgeDoorsAgainstShelf([{ level: 'bed', label: 'Bed in a shared multi-family', photos: 0 }]);
    expect(r.findings).toEqual([]);
    expect(r.warnings.join(' ')).toMatch(/no photographs at all/);
  });

  it('parseDoorRows reads what live-sql.sh prints, and ignores its chatter', () => {
    const out = [
      '== advertised doors (level_from_labels|shelf_label|photos_offered) ==',
      'bed|Bed in a shared multi-family in Champaign, Illinois|39',
      'unit|1-bed multi-family in Champaign, Illinois|16',
      'BEGIN',
      '',
    ].join('\n');
    const rows = parseDoorRows(out);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ level: 'bed', label: 'Bed in a shared multi-family in Champaign, Illinois', photos: 39 });
  });

  it('junk is judged as nothing, never as fine', () => {
    for (const junk of [null, undefined, 'rows', 7, {}]) {
      expect(judgeDoorsAgainstShelf(junk).checked).toBe(0);
    }
    expect(parseDoorRows(null)).toEqual([]);
  });
});

describe('the witness walks the path a stranger walks (DR-0974)', () => {
  // ITS OWN FIRST LIVE RUN FOUND THIS. Run 38178556102, 2026-10-11:
  //
  //   Cards read: 0
  //   - the shelf rendered NO cards at all
  //
  // The shelf is not the landing page. PropertiesDoor opens on "Who are
  // you?" and only calls loadPublicVacancies() once `who === 'applicant'`
  // (PropertiesDoor.jsx:321-330), so the witness had photographed the
  // chooser and judged that. It FAILED rather than passing, which is the
  // only reason this surfaced in minutes instead of becoming a daily green
  // tick over a page nobody read — "unknown is not pass" earning its keep on
  // the instrument's own first outing.
  //
  // A source pin, because the alternative is discovering it again live.
  it('PROVEN-TO-CATCH: it clicks through the chooser before judging anything', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../../../scripts/public-shelf-witness.mjs'), 'utf8');

    const goto = src.indexOf('page.goto(BASE');
    const judge = src.indexOf("waitForSelector('li'");
    expect(goto, 'the witness no longer loads the base URL').toBeGreaterThan(0);
    expect(judge, 'the witness no longer waits for cards').toBeGreaterThan(0);
    expect(judge, 'it must click through BEFORE waiting for cards').toBeGreaterThan(goto);

    const between = src.slice(goto, judge);
    expect(between, 'nothing clicks the one option that needs no account').toMatch(/Looking for a place/);
    expect(between, 'it must actually click, not merely find').toMatch(/\.click\(/);
  });

  it('it clicks by visible text, not a testid', async () => {
    // A testid would let the button be renamed out from under the witness in
    // silence; the visible words are what a stranger reads and clicks.
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, '../../../scripts/public-shelf-witness.mjs'), 'utf8');
    expect(src).toMatch(/getByRole\('button', \{ name: \/Looking for a place/);
  });

  it('the label it clicks is the real one, from WHO_OPTIONS', async () => {
    // If the option is ever renamed, this fails here rather than as a zero
    // on a live run at 02:41 in the morning.
    const { WHO_OPTIONS } = await import('../modules/properties/model.js');
    const browse = WHO_OPTIONS.filter((w) => !w.needsAccount);
    expect(browse, 'exactly one option should need no account').toHaveLength(1);
    expect(browse[0].label).toBe('Looking for a place');
    expect(browse[0].goes).toBe('vacancies');
  });
});

