// =============================================================================
// LegacyProvisions — the family trust's three provisions, as a WORKING system
// =============================================================================
// Darrell 2026-09-02 spoke the three provisions he wrote into the family trust
// and asked for them built into the app "right now... prepopulated for our
// family to use within the system", teaching our children, and adoptable by any
// other family here. This is that surface. It mounts inside Books -> Plan,
// beside the written family plan, because the provisions ARE the plan's spine.
//
// REALITY-TRACE (DR-0061 / P15), stated before the code:
//   • REAL DATA — the AUTHORED half (constitution articles, the three provision
//     records, the production policy, the review questions) is version-
//     controlled content in lib/family-trust.js. The LIVE half is real ledger
//     rows: contributions, distributions, attestations, exemptions and
//     spendthrift answers, kept device-local (lib/family-trust-store.js) and
//     synced family-wide through family_trust_records (migration 0167, RLS).
//   • END-TO-END — every control on this surface writes a real entry, and every
//     status shown is computed from those entries by the pure engine.
//   • THE SCREEN THE USER USES — Books -> Plan, the tab the family already opens
//     to read its own money; no new top-level nav, no new shell lines.
//   • ASSUMPTION STATED — nothing here is legal advice. The provision limits
//     ride in the data and are rendered WITH each provision, never buried.
//
// THE HONESTY THIS SURFACE KEEPS (DR-0076): an empty ledger reads "no record",
// never a zero and never a pass; an unanswered review item reads "not reviewed",
// never "protected"; and a distribution review holds for a human on unknown.
// Those are engine guarantees (family-trust.test.js proves each by feeding the
// failing case) — this component only renders them faithfully.
//
// THEMING: structural color routes through the shared theme CLASS tokens
// (#1A1815 / #5A5751 / #B85838 / #E8E4DC / #FAF8F4 / white) which already carry
// the midnight remaps. Status tints are inline and chosen to read at AA on the
// light card, the same approach HarvestLedger uses. Icons are <UiIcon>, never
// emoji (DR-0079).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import {
  FAMILY_CONSTITUTION,
  TRUST_PROVISIONS,
  PRODUCTION_KINDS,
  POE_PRODUCTION_POLICY,
  spendthriftAnswersFrom,
  spendthriftReview,
  constitutionStanding,
  productionStanding,
  distributionReview,
  exportConstitutionMarkdown,
  exportProvisionsMarkdown,
} from '../lib/family-trust.js';
import {
  loadTrustEntries, saveTrustEntries,
  loadBeneficiaries, saveBeneficiaries,
  newRecordId,
} from '../lib/family-trust-store.js';
import { familyTrustSync, mergeRemoteTrustRecords } from '../lib/family-trust-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

// Status -> AA-on-light visual (inline, like HarvestLedger). No status is ever
// green unless the record actually says so.
const TONE = {
  good: { color: '#166534', border: '#166534', bg: '#F0FAF1' },
  warn: { color: '#92400E', border: '#B8893B', bg: '#FBF6EC' },
  bad: { color: '#9B1C1C', border: '#9B1C1C', bg: '#FDF2F2' },
  none: { color: '#5A5751', border: '#E8E4DC', bg: '#FAF8F4' },
};

const STANDING_TONE = {
  meets: 'good', exempt: 'good', short: 'bad', unverified: 'warn', 'no-record': 'none',
};
const STANDING_LABEL = {
  meets: 'Standing met', exempt: 'Exempt', short: 'Short', unverified: 'Unverified', 'no-record': 'No record',
};
const REVIEW_TONE = { protected: 'good', exposed: 'bad', stale: 'warn', unreviewed: 'none' };
const REVIEW_LABEL = { protected: 'Confirmed', exposed: 'Exposed', stale: 'Stale', unreviewed: 'Not reviewed' };
const DECISION_TONE = { clear: 'good', hold: 'bad', review: 'warn' };

const today = () => new Date().toISOString().slice(0, 10);
const money = (v) => (v == null ? '—' : `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

function Pill({ tone = 'none', children }) {
  const t = TONE[tone] || TONE.none;
  return (
    <span
      className="inline-block text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border"
      style={{ color: t.color, borderColor: t.border, backgroundColor: t.bg }}
    >
      {children}
    </span>
  );
}

function Card({ label, icon, children, note }) {
  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon ? <UiIcon name={icon} /> : null}
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">{label}</div>
      </div>
      {note ? <p className="text-xs text-[#5A5751] leading-relaxed" style={serif}>{note}</p> : null}
      {children}
    </section>
  );
}

// Copy-to-clipboard with an honest result — a browser that refuses says so
// instead of silently pretending the copy happened.
function CopyButton({ text, label }) {
  const [state, setState] = useState('idle');
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('done');
    } catch {
      setState('failed');
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-xs border border-[#1A1815] px-3 py-1.5 hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
      style={serif}
    >
      {state === 'done' ? 'Copied' : state === 'failed' ? 'Copy blocked — select the text instead' : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// The three provisions, stated up front — what each does and what it does NOT.
// ---------------------------------------------------------------------------
function ProvisionSummary() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      {TRUST_PROVISIONS.map((p) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="border border-[#E8E4DC] p-3 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm" style={{ ...serif, fontWeight: 600 }}>{p.number}. {p.name}</h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.id)}
                aria-expanded={isOpen}
                className="text-[0.625rem] uppercase tracking-wider text-[#B85838] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
              >
                {isOpen ? 'Less' : 'What it does'}
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={serif}>{p.oneLine}</p>
            {isOpen && (
              <div className="space-y-3 pt-1">
                <p className="text-xs leading-relaxed" style={serif}><strong>Answers:</strong> {p.answers}</p>
                <p className="text-xs leading-relaxed" style={serif}><strong>How it works:</strong> {p.mechanism}</p>
                <div>
                  <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">What the instrument must say</div>
                  <ul className="list-disc pl-5 space-y-1 text-xs" style={serif}>
                    {p.mustSay.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Honest limits — what it does NOT do</div>
                  <ul className="list-disc pl-5 space-y-1 text-xs" style={serif}>
                    {p.limits.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                {p.anchor?.quote && (
                  <p className="text-xs italic border-l-2 border-[#B85838] pl-3" style={serif}>
                    KJV — {p.anchor.ref}: “{p.anchor.quote}”
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. The constitution — read it, and attest to it, article by article.
// ---------------------------------------------------------------------------
function ConstitutionSection({ people, entries, onAttest }) {
  const [who, setWho] = useState(people[0]?.id || '');
  const [openArticle, setOpenArticle] = useState(FAMILY_CONSTITUTION.articles[0]?.id || null);
  useEffect(() => { if (!who && people[0]) setWho(people[0].id); }, [people, who]);

  const standing = useMemo(
    () => (who ? constitutionStanding(entries, { beneficiary: who }) : null),
    [entries, who],
  );

  return (
    <div className="space-y-4">
      <Card label="Provision one — the constitution the trust points at" icon="book"
        note="A private document. It is not the trust and is not filed anywhere; the trust references it, so the instrument moves assets while this moves the thinking that is supposed to govern them.">
        <p className="text-sm leading-relaxed" style={serif}>{FAMILY_CONSTITUTION.preamble}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <CopyButton text={exportConstitutionMarkdown()} label="Copy the constitution" />
          <CopyButton text={exportProvisionsMarkdown()} label="Copy the three provisions" />
        </div>
        <p className="text-[0.625rem] text-[#5A5751]" style={serif}>
          Copy either one to start your own house’s version — replace every article with your own convictions. Teaching, not legal advice.
        </p>
      </Card>

      {people.length > 0 && (
        <Card label="Attestation — who has actually read what" icon="users"
          note="An article with no attestation on record shows as unattested. The surface never assumes a document was read.">
          <label className="block text-xs" style={serif}>
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Reading as</span>
            <select
              value={who}
              onChange={(e) => setWho(e.target.value)}
              className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
              style={serif}
            >
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          {standing && (
            <p className="text-xs text-[#5A5751]" style={serif}>
              {standing.attested.length} of {standing.total} articles attested ({standing.pct}%).
              {standing.missing.length ? ` ${standing.missing.length} still unattested.` : ' Every article attested.'}
            </p>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {FAMILY_CONSTITUTION.articles.map((a) => {
          const isOpen = openArticle === a.id;
          const attestedAt = standing?.attestedAt?.[a.id];
          return (
            <section key={a.id} className="bg-white border border-[#1A1815] p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm" style={{ ...serif, fontWeight: 600 }}>
                  Article {a.number} — {a.title}
                </h3>
                <Pill tone={attestedAt ? 'good' : 'none'}>{attestedAt ? 'Attested' : 'Unattested'}</Pill>
              </div>
              <p className="text-sm leading-relaxed" style={serif}>{a.statement}</p>
              <button
                type="button"
                onClick={() => setOpenArticle(isOpen ? null : a.id)}
                aria-expanded={isOpen}
                className="text-[0.625rem] uppercase tracking-wider text-[#B85838] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
              >
                {isOpen ? 'Close' : 'The standard + the anchor'}
              </button>
              {isOpen && (
                <div className="space-y-2 pt-1">
                  <ul className="list-disc pl-5 space-y-1 text-xs" style={serif}>
                    {a.standards.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                  {a.anchor?.quote && (
                    <p className="text-xs italic border-l-2 border-[#B85838] pl-3" style={serif}>
                      KJV — {a.anchor.ref}: “{a.anchor.quote}”
                    </p>
                  )}
                </div>
              )}
              {who && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onAttest(who, a.id)}
                    disabled={!!attestedAt}
                    className="text-xs border border-[#1A1815] px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                    style={serif}
                  >
                    {attestedAt ? 'Already attested' : 'I have read this article'}
                  </button>
                  {attestedAt && (
                    <span className="text-[0.625rem] text-[#5A5751]" style={mono}>{attestedAt}</span>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. The wall — the spendthrift exposure review, answered on the record.
// ---------------------------------------------------------------------------
function SpendthriftSection({ entries, onAnswer }) {
  const answers = useMemo(() => spendthriftAnswersFrom(entries), [entries]);
  const review = useMemo(() => spendthriftReview(answers, { asOf: today() }), [answers]);
  const provision = TRUST_PROVISIONS.find((p) => p.id === 'spendthrift');

  return (
    <div className="space-y-4">
      <Card label="Provision two — the wall" icon="lock"
        note={provision?.oneLine}>
        <div className="flex flex-wrap gap-2">
          <Pill tone={review.tally.protected ? 'good' : 'none'}>{review.tally.protected} confirmed</Pill>
          <Pill tone={review.tally.exposed ? 'bad' : 'none'}>{review.tally.exposed} exposed</Pill>
          <Pill tone={review.tally.stale ? 'warn' : 'none'}>{review.tally.stale} stale</Pill>
          <Pill tone="none">{review.tally.unreviewed} not reviewed</Pill>
        </div>
        <p className="text-sm leading-relaxed" style={serif}>{review.headline}</p>
        <p className="text-xs text-[#5A5751] leading-relaxed" style={serif}>
          The posture is reported as confirmed only when every item is answered protectively and inside the review interval.
          An unanswered item is unknown — it is never counted as protection.
        </p>
      </Card>

      <div className="space-y-3">
        {review.items.map((item) => (
          <section key={item.id} className="bg-white border border-[#1A1815] p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm leading-snug" style={{ ...serif, fontWeight: 600 }}>{item.question}</h3>
              <Pill tone={REVIEW_TONE[item.status]}>{REVIEW_LABEL[item.status]}</Pill>
            </div>
            <p className="text-xs text-[#5A5751] leading-relaxed" style={serif}>{item.why}</p>
            {item.status !== 'unreviewed' && (
              <p className="text-[0.625rem] text-[#5A5751]" style={mono}>
                Answered “{item.answer}”{item.reviewedAt ? ` on ${item.reviewedAt}` : ' (undated)'}.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAnswer(item.id, 'yes')}
                className="text-xs border border-[#1A1815] px-3 py-1.5 hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={serif}
              >
                Yes — confirmed
              </button>
              <button
                type="button"
                onClick={() => onAnswer(item.id, 'no')}
                className="text-xs border border-[#1A1815] px-3 py-1.5 hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={serif}
              >
                No — exposed
              </button>
            </div>
          </section>
        ))}
      </div>

      {provision?.limits?.length ? (
        <Card label="What this clause does NOT do">
          <ul className="list-disc pl-5 space-y-1 text-xs" style={serif}>
            {provision.limits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Produce before you take — the real ledger and the computed standing.
// ---------------------------------------------------------------------------
function ProductionSection({ people, entries, onAddPerson, onAddEntry, onRemoveEntry }) {
  const [personName, setPersonName] = useState('');
  const [addingPerson, setAddingPerson] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [form, setForm] = useState({
    beneficiary: '', kind: 'production', productionKind: 'earned',
    occurredAt: today(), label: '', amount: '', reason: '',
  });

  const asOf = today();
  const standings = useMemo(
    () => people.map((p) => ({ person: p, standing: productionStanding(entries, { beneficiary: p.id, asOf }) })),
    [people, entries, asOf],
  );

  const ledger = useMemo(
    () => entries
      .filter((e) => e.kind === 'production' || e.kind === 'distribution' || e.kind === 'exemption')
      .slice()
      .sort((a, b) => String(b.occurredAt || '').localeCompare(String(a.occurredAt || ''))),
    [entries],
  );

  const nameOf = useCallback(
    (id) => people.find((p) => p.id === id)?.name || id,
    [people],
  );

  const submit = (e) => {
    e.preventDefault();
    if (!form.beneficiary) return;
    onAddEntry({
      kind: form.kind,
      beneficiary: form.beneficiary,
      occurredAt: form.occurredAt || null,
      label: form.label.trim(),
      productionKind: form.kind === 'production' ? form.productionKind : null,
      amount: form.amount === '' ? null : Number(form.amount),
      reason: form.kind === 'exemption' ? form.reason.trim() : null,
    });
    setForm((f) => ({ ...f, label: '', amount: '', reason: '' }));
  };

  return (
    <div className="space-y-4">
      <Card label="Provision three — produce before you take" icon="coins"
        note={POE_PRODUCTION_POLICY.note}>
        <p className="text-sm leading-relaxed" style={serif}>
          The rule this house is running: at least {POE_PRODUCTION_POLICY.minProductionEntries} recorded production entries
          per {POE_PRODUCTION_POLICY.periodMonths} months, and at least {Math.round(POE_PRODUCTION_POLICY.contributeBackRatio * 100)}% of
          what a beneficiary receives contributed back as recorded value. Distributions at or under {money(POE_PRODUCTION_POLICY.reviewFloorAmount)} are
          support-level and are not weighed against production at all.
        </p>
        <div className="text-xs text-[#5A5751]" style={serif}>
          Exemptions on record for: {POE_PRODUCTION_POLICY.exemptionReasons.join(', ')}.
        </div>
      </Card>

      <Card label="The house" icon="users" note="Add each beneficiary this ledger tracks. Names stay on this family's own records.">
        <form
          onSubmit={(e) => { e.preventDefault(); if (personName.trim()) { onAddPerson(personName.trim()); setPersonName(''); } }}
          className="flex flex-wrap gap-2 items-end"
        >
          <label className="text-xs flex-1 min-w-[12rem]" style={serif}>
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Add a beneficiary</span>
            <input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Name"
              className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
              style={serif}
            />
          </label>
          {/* 2f.3 — a disabled control says what it is waiting for. */}
          <button
            type="submit"
            disabled={!personName.trim()}
            className="text-xs border border-[#1A1815] px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
            style={serif}
          >
            {personName.trim() ? 'Add' : 'Type a name to add'}
          </button>
        </form>
        {people.length === 0 && (
          <p className="text-xs text-[#5A5751]" style={serif}>
            No beneficiaries added yet. Standing cannot be computed for anyone until someone is here — which is why nothing below claims a score.
          </p>
        )}
      </Card>

      {standings.length > 0 && (
        <Card label="Standing — computed from the real entries only" icon="chart">
          <div className="space-y-3">
            {standings.map(({ person, standing }) => {
              const decision = distributionReview(standing);
              return (
                <div key={person.id} className="border border-[#E8E4DC] p-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm" style={{ ...serif, fontWeight: 600 }}>{person.name}</h3>
                    <Pill tone={STANDING_TONE[standing.status]}>{STANDING_LABEL[standing.status]}</Pill>
                  </div>
                  <p className="text-xs leading-relaxed" style={serif}>{standing.headline}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-[#E8E4DC] p-2">
                      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Produced</div>
                      <div className="text-sm" style={mono}>{standing.produced.count} · {money(standing.produced.total)}</div>
                    </div>
                    <div className="border border-[#E8E4DC] p-2">
                      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Contributed back</div>
                      <div className="text-sm" style={mono}>{standing.contributed.count} · {money(standing.contributed.total)}</div>
                    </div>
                    <div className="border border-[#E8E4DC] p-2">
                      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Received</div>
                      <div className="text-sm" style={mono}>{standing.received.count} · {money(standing.received.total)}</div>
                    </div>
                  </div>
                  {standing.checks.length > 0 && (
                    <ul className="space-y-1">
                      {standing.checks.map((c) => (
                        <li key={c.id} className="text-xs flex items-start gap-2" style={serif}>
                          <Pill tone={c.result === 'pass' ? 'good' : c.result === 'fail' ? 'bad' : c.result === 'unknown' ? 'warn' : 'none'}>
                            {c.result}
                          </Pill>
                          <span><strong>{c.label}.</strong> {c.detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs" style={serif}>
                    <Pill tone={DECISION_TONE[decision.decision]}>Distribution: {decision.decision}</Pill>{' '}
                    <span className="text-[#5A5751]">{decision.reason}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card label="Record what actually happened" icon="pencil"
        note="Every entry here is a real dated record. Leave the amount blank when nothing was costed — the engine reports the ratio as unknown rather than computing over a zero nobody entered.">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs" style={serif}>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Who</span>
              {/* 2f.2 — a dropdown never leaves a person with nowhere to go. This
                  select can legitimately be empty on day one, so it offers the way
                  to fill it IN PLACE, through the SAME builder the roster card uses
                  (one way to add a beneficiary, reachable from two places), and
                  selects the new person. It also SAYS it is empty rather than
                  looking like a considered single option. */}
              <select
                value={form.beneficiary}
                onChange={(e) => {
                  if (e.target.value === '__add__') { setAddingPerson(true); return; }
                  setForm({ ...form, beneficiary: e.target.value });
                }}
                className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={serif}
              >
                <option value="">{people.length ? 'Choose a beneficiary…' : 'No beneficiaries yet — add the first one'}</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="__add__">+ Add a beneficiary…</option>
              </select>
              {addingPerson && (
                <div className="mt-2 border border-[#1A1815] bg-[#FAF8F4] p-2 space-y-2">
                  <input
                    autoFocus
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    placeholder="Name"
                    className="block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                    style={serif}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!inlineName.trim()}
                      onClick={() => {
                        const id = onAddPerson(inlineName.trim());
                        setForm((f) => ({ ...f, beneficiary: id }));
                        setInlineName('');
                        setAddingPerson(false);
                      }}
                      className="text-xs border border-[#1A1815] px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                      style={serif}
                    >
                      {inlineName.trim() ? 'Add and select' : 'Type a name to add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingPerson(false); setInlineName(''); }}
                      className="text-xs px-3 py-1.5 text-[#5A5751] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                      style={serif}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </label>
            <label className="text-xs" style={serif}>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">What kind of record</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={serif}
              >
                <option value="production">Production — value they made or contributed</option>
                <option value="distribution">Distribution — what the trust paid out to them</option>
                <option value="exemption">Exemption — a season that does not forfeit standing</option>
              </select>
            </label>
            {form.kind === 'production' && (
              <label className="text-xs" style={serif}>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">What counts here</span>
                <select
                  value={form.productionKind}
                  onChange={(e) => setForm({ ...form, productionKind: e.target.value })}
                  className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                  style={serif}
                >
                  {PRODUCTION_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </label>
            )}
            {form.kind === 'exemption' && (
              <label className="text-xs" style={serif}>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Reason</span>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                  style={serif}
                >
                  <option value="">Choose a reason…</option>
                  {POE_PRODUCTION_POLICY.exemptionReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            )}
            <label className="text-xs" style={serif}>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Date</span>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={serif}
              />
            </label>
            <label className="text-xs" style={serif}>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount (leave blank if not costed)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                style={mono}
              />
            </label>
          </div>
          <label className="text-xs block" style={serif}>
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">What it was</span>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Rebuilt the unit 3 bathroom; six weekends of labor"
              className="mt-1 block w-full border border-[#1A1815] bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B85838]"
              style={serif}
            />
          </label>
          <button
            type="submit"
            disabled={!form.beneficiary}
            className="text-xs border-2 border-[#1A1815] px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#B85838]"
            style={serif}
          >
            {form.beneficiary ? 'Record it' : 'Choose a beneficiary first'}
          </button>
        </form>
      </Card>

      <Card label="The ledger" icon="landmark">
        {ledger.length === 0 ? (
          <p className="text-xs text-[#5A5751]" style={serif}>
            No entries yet. Nothing above is claiming a standing — an empty ledger reads as no record, never as a pass.
          </p>
        ) : (
          <ul className="divide-y divide-[#E8E4DC]">
            {ledger.map((e) => (
              <li key={e.id} className="py-2 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm" style={serif}>
                    <strong>{nameOf(e.beneficiary)}</strong> · {e.label || (e.reason ? e.reason : e.kind)}
                  </div>
                  <div className="text-[0.625rem] text-[#5A5751]" style={mono}>
                    {e.occurredAt || 'undated'} · {e.kind}{e.productionKind ? ` · ${e.productionKind}` : ''} · {money(e.amount)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEntry(e.id)}
                  className="text-[0.625rem] uppercase tracking-wider text-[#B85838] shrink-0 focus:outline-none focus:ring-2 focus:ring-[#B85838]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The surface.
// ---------------------------------------------------------------------------
export function LegacyProvisions() {
  const [entries, setEntries] = useState(() => loadTrustEntries());
  const [people, setPeople] = useState(() => loadBeneficiaries());

  useEffect(() => { saveTrustEntries(entries); }, [entries]);
  useEffect(() => { saveBeneficiaries(people); }, [people]);

  // Cross-device sync (0167). Signed out this never fires and the surface runs
  // entirely on the device's own records.
  useEffect(() => {
    const unsub = familyTrustSync.subscribe((items) => {
      setEntries((cur) => mergeRemoteTrustRecords(cur, items));
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // The roster is the locally-kept list UNION every person named by an entry, so
  // a record synced from another device brings its person along instead of
  // silently disappearing from the standing table.
  const roster = useMemo(() => {
    const seen = new Map(people.map((p) => [p.id, p]));
    for (const e of entries) {
      if (!e.beneficiary || seen.has(e.beneficiary)) continue;
      seen.set(e.beneficiary, { id: e.beneficiary, name: e.beneficiary });
    }
    return [...seen.values()];
  }, [people, entries]);

  const addEntry = useCallback((entry) => {
    const record = { id: newRecordId(), ...entry };
    setEntries((cur) => [record, ...cur]);
    familyTrustSync.upload(record);
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((cur) => {
      const target = cur.find((e) => e.id === id);
      if (target && target.remoteUuid) familyTrustSync.deleteRow(target.remoteUuid);
      return cur.filter((e) => e.id !== id);
    });
  }, []);

  // Returns the id so an in-place "+ Add a beneficiary…" can select what it made
  // (2f.2 — one builder, reachable from two places).
  const addPerson = useCallback((name) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || newRecordId('who');
    setPeople((cur) => (cur.some((p) => p.id === id) ? cur : [...cur, { id, name }]));
    return id;
  }, []);

  const attest = useCallback((who, articleId) => {
    addEntry({ kind: 'attestation', beneficiary: who, articleId, occurredAt: today(), label: 'Read and attested' });
  }, [addEntry]);

  const answerReviewItem = useCallback((itemId, answer) => {
    addEntry({ kind: 'spendthrift', beneficiary: '', itemId, answer, occurredAt: today(), label: 'Spendthrift review' });
  }, [addEntry]);

  const sections = [
    {
      id: 'constitution',
      label: 'Constitution',
      icon: 'book',
      render: () => <ConstitutionSection people={roster} entries={entries} onAttest={attest} />,
    },
    {
      id: 'wall',
      label: 'The wall',
      icon: 'lock',
      render: () => <SpendthriftSection entries={entries} onAnswer={answerReviewItem} />,
    },
    {
      id: 'production',
      label: 'Produce before you take',
      icon: 'coins',
      render: () => (
        <ProductionSection
          people={roster}
          entries={entries}
          onAddPerson={addPerson}
          onAddEntry={addEntry}
          onRemoveEntry={removeEntry}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5 space-y-3">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">
          Legacy provisions — the family trust, as a working system
        </div>
        <h2 className="text-lg" style={{ ...serif, fontWeight: 600 }}>
          Three provisions that decide whether an inheritance survives
        </h2>
        <p className="text-sm leading-relaxed" style={serif}>
          Pass down money without passing down principles and the wealth usually disappears by the second or third
          generation. These three provisions answer the three ways it actually leaves: never learned, taken by
          somebody else, or only ever drawn from. The whole teaching is free in Church → Learn — “Secure the Legacy:
          The Provisions That Hold.”
        </p>
        <ProvisionSummary />
        <p className="text-[0.625rem] text-[#5A5751] leading-relaxed" style={serif}>
          Teaching and a family operating system — not legal advice. Trust law is state-specific and a spendthrift
          clause is strong but not absolute. Have a licensed estate attorney in your own state draft and execute the
          instrument.
        </p>
      </section>

      <SectionTabs sections={sections} ariaLabel="Legacy provisions" idBase="legacy" defaultId="constitution" />
    </div>
  );
}

export default LegacyProvisions;
