// @vitest-environment jsdom
// =============================================================================
// The office issues the statement (DR-1073) — Church → Giving book → Reports
// =============================================================================
// DR-1064's statement had no caller. These cases are weighted at what a STEWARD
// could hand a member by mistake: a document whose number is short with no
// explanation, one issued in the church's trading name with no EIN, or a blank
// where a refusal should be.
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ContributionStatement, { yearsInClaims } from '../components/ContributionStatement.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const RUTH = 'aaaaaaaa-0000-0000-0000-000000000001';
const STEWARD = 'cccccccc-0000-0000-0000-000000000003';
const CHURCH = {
  name: 'The Love Corner',
  legalName: 'The Love Corner Church of God in Christ',
  address: '1 Example St, Champaign, IL',
  ein: '00-0000000',
};
const claim = (o) => ({
  id: o.id, slug: o.id, batchId: 'batch-1',
  giverName: o.giverName || 'Ruth Example',
  parishionerId: o.parishionerId === undefined ? RUTH : o.parishionerId,
  matchBasis: 'name',
  confirmedBy: o.confirmedBy === undefined ? STEWARD : o.confirmedBy,
  givenOn: o.givenOn, givenAt: '10:30:00',
  grossCents: o.grossCents, feeCents: o.feeCents || 0,
  amountClaimedCents: o.grossCents - (o.feeCents || 0),
  fund: 'offering', note: '', txnId: '',
});

async function render(props) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(createElement(ContributionStatement, props)); });
  return host;
}

describe('yearsInClaims — the years the book HOLDS, never a guessed range', () => {
  it('lists each year once, newest first, and ignores a row with no date', () => {
    expect(yearsInClaims([
      claim({ id: 'a', givenOn: '2025-12-28', grossCents: 100 }),
      claim({ id: 'b', givenOn: '2026-01-04', grossCents: 100 }),
      claim({ id: 'c', givenOn: '2026-07-04', grossCents: 100 }),
      claim({ id: 'd', givenOn: '', grossCents: 100 }),
    ])).toEqual(['2026', '2025']);
  });
});

describe('the statement a steward hands over', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders the year’s total from the claims, in the church’s LEGAL name', async () => {
    const host = await render({
      claims: [
        claim({ id: 'g1', givenOn: '2026-01-04', grossCents: 30000, feeCents: 900 }),
        claim({ id: 'g2', givenOn: '2026-06-07', grossCents: 5000 }),
      ],
      batches: [{ id: 'batch-1', source: 'cashapp' }],
      church: CHURCH,
      giverKey: `id:${RUTH}`,
      giverLabel: 'Ruth Example',
    });
    const body = host.querySelector('[data-testid="cs-body"]');
    expect(body, 'the statement did not render').toBeTruthy();
    expect(body.textContent).toContain('$350.00');          // gross, not $341.00 net
    expect(body.textContent).not.toContain('$341.00');
    // The $250 gift is called out, because that one cannot be claimed without
    // this page at all.
    expect(body.textContent).toMatch(/Needing this written receipt/);
    expect(host.querySelector('[data-testid="cs-teaching"]').textContent).toMatch(/only if you ITEMIZE/);
    expect(host.querySelector('[data-testid="cs-download"]')).toBeTruthy();
  });

  it('SAYS WHY THE NUMBER IS SHORT before showing the number', async () => {
    const host = await render({
      claims: [
        claim({ id: 'g1', givenOn: '2026-01-04', grossCents: 30000 }),
        claim({ id: 'u1', givenOn: '2026-02-01', grossCents: 40000, confirmedBy: null }),
      ],
      church: CHURCH, giverKey: `id:${RUTH}`, giverLabel: 'Ruth Example',
    });
    const notices = [...host.querySelectorAll('[data-testid="cs-notice"]')].map((n) => n.textContent).join(' ');
    expect(notices).toMatch(/nobody has confirmed them/);
    // And the notice is above the figure in the DOM, not below it.
    expect(host.innerHTML.indexOf('nobody has confirmed them'))
      .toBeLessThan(host.innerHTML.indexOf('cs-body'));
  });

  it('REFUSES IN WORDS rather than issuing a blank $0 — an empty year', async () => {
    // The book holds 2026, but nothing of Ruth's: a statement reading $0 reads
    // as a denial of something, so nothing is issued and the page says why.
    const host = await render({
      claims: [claim({
        id: 'other', givenOn: '2026-05-05', grossCents: 10000,
        parishionerId: 'dddddddd-0000-0000-0000-000000000004', giverName: 'Someone Else',
      })],
      church: CHURCH, giverKey: `id:${RUTH}`, giverLabel: 'Ruth Example',
    });
    const refusal = host.querySelector('[data-testid="cs-refusal"]');
    expect(refusal, 'a $0 statement was issued instead of a refusal').toBeTruthy();
    expect(refusal.textContent).toMatch(/No gifts are recorded for Ruth Example in 2026/);
    expect(refusal.textContent).toMatch(/reads like a denial/);
    expect(host.querySelector('[data-testid="cs-body"]')).toBeNull();
    expect(host.querySelector('[data-testid="cs-download"]')).toBeNull();
  });

  it('refuses when the church’s own details are not on file, and names them', async () => {
    const host = await render({
      claims: [claim({ id: 'g1', givenOn: '2026-01-04', grossCents: 30000 })],
      church: { name: '' },                   // no legal name, no address
      giverKey: `id:${RUTH}`, giverLabel: 'Ruth Example',
    });
    const refusal = host.querySelector('[data-testid="cs-refusal"]');
    expect(refusal, 'a statement was issued with no issuer').toBeTruthy();
    expect(refusal.textContent).toMatch(/legal name/);
    expect(refusal.textContent).toMatch(/address/);
    expect(host.querySelector('[data-testid="cs-download"]'), 'a blank was downloadable').toBeNull();
  });

  it('renders nothing at all until a giver is chosen', async () => {
    const host = await render({ claims: [], church: CHURCH, giverKey: '' });
    expect(host.querySelector('[data-testid="contribution-statement"]')).toBeNull();
  });

  it('labels the sender path as the sender, not as a member account', async () => {
    const host = await render({
      claims: [claim({ id: 's1', givenOn: '2026-04-04', grossCents: 2000, parishionerId: null, confirmedBy: null, giverName: 'Visitor Jones' })],
      church: CHURCH, giverKey: 'raw:Visitor Jones', giverLabel: 'Visitor Jones',
    });
    expect(host.textContent).toMatch(/name the payment processor printed/);
  });

  it('is wired into the giving book, with the church record reaching it', async () => {
    // An orphaned component is the exact failure this record closes, twice
    // over: DR-1064's statement and DR-1070's funnel both shipped unread.
    const book = read('app/src/components/ChurchGivingBook.jsx');
    expect(book).toMatch(/import ContributionStatement from '\.\/ContributionStatement\.jsx'/);
    expect(book).toMatch(/<ContributionStatement/);
    expect(book).toMatch(/church=\{church\}/);
    expect(book, 'the book must accept the church record to pass it on').toMatch(/church = \{\}/);
    const shell = read('app/src/poe-financial-mvp-v28.jsx');
    expect(shell, 'the shell never handed the book a church record').toMatch(/<ChurchGivingBook[^>]*church=\{data\.church \|\| \{\}\}/);
  });

  it('the church profile can hold the two facts a tax statement needs', async () => {
    const { PROFILE_FIELDS, profileFromForm, formFromProfile, mergeChurchRecord } =
      await import('../lib/church-profile.js');
    const keys = PROFILE_FIELDS.map((f) => f.key);
    expect(keys).toContain('legalName');
    expect(keys).toContain('ein');
    // Round-trips through the form, and reaches the record a surface renders.
    const p = profileFromForm({ name: 'The Love Corner', legalName: 'TLC COGIC', ein: '00-0000000' });
    expect(p.legalName).toBe('TLC COGIC');
    expect(formFromProfile(p).ein).toBe('00-0000000');
    expect(mergeChurchRecord({ name: 'x' }, p).legalName).toBe('TLC COGIC');
    expect(mergeChurchRecord({ name: 'x' }, p).ein).toBe('00-0000000');
  });
});
