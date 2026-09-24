// =============================================================================
// intake-outcome — every intake is carried to an outcome the ecosystem
// communicates (DR-0621 item 3a; built as DR-0622)
// =============================================================================
// Darrell, 2026-09-24: "any direction you get it from intake, however it comes,
// it should go through our workflow system and be categorized in a way where if
// it's low hanging fruit, then we fix it. The system fixes it automatically ...
// but if it's something that we already ... ascertained and said we're not
// doing then there's an explanation and then there's a reason why ... i don't
// want humans to have to communicate that i want the PoeTech whole ecosystem to
// do the work".
//
// This module is the deterministic heart of that loop. PURE: no I/O, no clock
// (the clock is an argument), no model. The same note, ledger and history give
// the same answer on the sender's phone, on the steward's board and on the
// runner that feeds the fix queue, so a category can always be re-derived and
// audited from its `basis`.
//
//   categorizeIntake(item, { ledger, history })  -> { category, basis, ... }
//   outcomeFor(item, cat, { delivery, fix })     -> what the sender reads
//   deliveryWindow(merges, cls)                  -> a window MEASURED from
//                                                   merged pull requests
//
// THE CATEGORIES (DR-0621 3a, in its order):
//   fix      low-hanging fruit: a small wording / label / legibility change the
//            system fixes through the gated lane;
//   decided  already decided: a decision record (or a steward's earlier
//            decline of the same thing) covers it, cited with its reason;
//   work     real work: it goes on the board with an owner role and a window;
//   ask      needs one thing from a person: we ask for exactly that thing.
// Two more are said plainly rather than forced into those four:
//   thanks   praise, received;
//   signal   machine telemetry ("[Learn engagement] ..."), not a person's note.
// UNKNOWN STAYS UNKNOWN: a note no rule recognizes is `work` with the basis
// "no rule matched; a person reads it", never a guess (DR-0076).
//
// No model is called here. Where a model would help (CLAUDE-TOOL-ROUTING), it
// belongs on the sovereign NAS path and its answer would be recorded as a
// basis of kind 'model'; nothing in this build needs one, and the census on
// the live rows (DR-0622) is the measurement that says whether it ever will.
// =============================================================================
import { evaluateFeedback, feedbackText, feedbackScreenshotCount } from './feedback-triage.js';

export const CATEGORIZER_VERSION = 'intake-1';

export const INTAKE_CATEGORIES = Object.freeze({
  fix: { key: 'fix', label: 'Low-hanging fruit', steward: 'The system fixes it through the gated lane', accent: '#5A6E3D' },
  decided: { key: 'decided', label: 'Already decided', steward: 'Answered with the decision and its reason', accent: '#2A5A8E' },
  work: { key: 'work', label: 'Real work', steward: 'On the board with an owner and a window', accent: '#B85838' },
  ask: { key: 'ask', label: 'Needs one thing', steward: 'Asked for exactly one thing', accent: '#8B6F47' },
  thanks: { key: 'thanks', label: 'Praise', steward: 'Received with thanks', accent: '#5A6E3D' },
  signal: { key: 'signal', label: 'Telemetry', steward: 'Machine signal, not a person’s note', accent: '#5A5751' },
});
export const CATEGORY_ORDER = ['fix', 'decided', 'work', 'ask', 'thanks', 'signal'];

// --- The note's own parts ------------------------------------------------------
// A remote row carries one composed body ("Working: .. | Not working: .. |
// Missing: .. | [bug, idea]" or "Rated: love"); a local row carries the fields.
// The complaint is the "not working" and "missing" parts; "working" is praise.
export function noteParts(item = {}) {
  const out = { working: '', not: '', missing: '', tags: [], rating: String(item.rating || ''), raw: '' };
  if (item.whatsWorking || item.whatsNot || item.whatsMissing) {
    out.working = String(item.whatsWorking || '');
    out.not = String(item.whatsNot || '');
    out.missing = String(item.whatsMissing || '');
    out.tags = Array.isArray(item.categories) ? item.categories.map(String) : [];
    out.raw = [out.working, out.not, out.missing].filter(Boolean).join(' · ');
    return out;
  }
  const body = String(feedbackText(item) || item.body || item.title || '');
  out.raw = body;
  let matchedAny = false;
  for (const seg of body.split(/\s\|\s/)) {
    const s = seg.trim();
    let m;
    if ((m = /^Working:\s*([\s\S]*)$/i.exec(s))) { out.working = m[1]; matchedAny = true; }
    else if ((m = /^Not working:\s*([\s\S]*)$/i.exec(s))) { out.not = m[1]; matchedAny = true; }
    else if ((m = /^Missing:\s*([\s\S]*)$/i.exec(s))) { out.missing = m[1]; matchedAny = true; }
    else if ((m = /^Rated:\s*(\w+)$/i.exec(s))) { out.rating = m[1]; matchedAny = true; }
    else if ((m = /^\[([a-z, -]+)\]$/i.exec(s))) { out.tags = m[1].split(',').map((t) => t.trim()).filter(Boolean); matchedAny = true; }
    else if (!matchedAny) { out.not = s; }
    else { out.not = [out.not, s].filter(Boolean).join(' '); }
  }
  return out;
}

// The words a note is judged on: what is wrong and what is missing. Praise in
// the "working" box never makes a complaint look like praise, or the reverse.
function complaintText(p) {
  return [p.not, p.missing].filter(Boolean).join(' ').trim();
}

// --- Tokens, for the similarity match ------------------------------------------
const STOP = new Set(('a an and are as at be been but by can could did do does doing for from had has have he her his how i if in into is it its just like me my no not of on or our out she so some than that the their them then there these they this to too up us was we were what when where which who why will with would you your yours about after again all also am any because before being both each few get got here itself more most much only other own same should such very via app page tab screen thing things one make made use using want need please add able way see').split(/\s+/));

function stem(w) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 4 && /(ss|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function tokensOf(text) {
  const out = new Set();
  for (const raw of String(text || '').toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP.has(raw) || /^\d+$/.test(raw)) continue;
    const s = stem(raw);
    if (s.length >= 3 && !STOP.has(s)) out.add(s);
  }
  return out;
}

// --- The ledger index (built once per ledger) -----------------------------------
const CLOSED = ['superseded', 'rejected', 'retired', 'withdrawn', 'proposed', 'open', 'pending', 'draft'];
const firstWord = (s) => String(s || '').trim().toLowerCase().split(/[\s(]/)[0];
const indexCache = new WeakMap();

export function ledgerIndex(ledger) {
  const items = ledger && Array.isArray(ledger.items) ? ledger.items : [];
  if (ledger && typeof ledger === 'object' && indexCache.has(ledger)) return indexCache.get(ledger);
  const docs = [];
  for (const r of items) {
    if (!r || !r.id) continue;
    // Only a record that decided something can answer "already decided": a
    // proposed or superseded record is not the house's word.
    if (CLOSED.includes(firstWord(r.status))) continue;
    const decision = String(r.decision || (r.chain && r.chain.decision && r.chain.decision.text) || '').trim();
    if (!decision) continue;
    docs.push({ id: r.id, title: String(r.title || ''), decision, tokens: tokensOf(`${r.title || ''} ${decision}`), titleTokens: tokensOf(r.title || '') });
  }
  const df = new Map();
  for (const d of docs) for (const t of d.tokens) df.set(t, (df.get(t) || 0) + 1);
  const n = Math.max(1, docs.length);
  const idf = (t) => Math.log((n + 1) / ((df.get(t) || 0) + 1));
  // RARE is relative to the ledger's size, so the rule means the same thing on
  // 448 records and on a test's 13: a word in at most rareShare of records.
  const rareMax = Math.max(1, Math.floor(docs.length * DECIDED_MATCH.rareShare));
  const isRare = (t) => (df.get(t) || 0) <= rareMax;
  const out = { docs, idf, isRare, n };
  if (ledger && typeof ledger === 'object') indexCache.set(ledger, out);
  return out;
}

// The thresholds of the "already decided" match. Conservative on purpose: a
// wrong "already decided" brushes a person off, which is worse than carrying
// the note as work. Every threshold is pinned by a test on both sides.
// `newerWithin`: the ledger is append-only (DR-0011), so a NEWER record on the
// same subject governs the older one it amends (DR-0248 amends DR-0110's kill-
// switch). A newer candidate within this much coverage of the best one wins.
export const DECIDED_MATCH = Object.freeze({ minShared: 4, minRareShared: 3, minCoverage: 0.6, minTitleShared: 2, rareShare: 0.1, newerWithin: 0.1 });

const drNum = (id) => parseInt(String(id || '').replace(/\D/g, ''), 10) || 0;

/** The best decision record for a note, or null. Deterministic; the newest governing record wins a near-tie. */
export function matchDecision(text, ledger) {
  const idx = ledgerIndex(ledger);
  const note = tokensOf(text);
  if (note.size < DECIDED_MATCH.minShared) return null;
  let noteWeight = 0;
  for (const t of note) noteWeight += idx.idf(t);
  const passing = [];
  for (const d of idx.docs) {
    const shared = [];
    let w = 0;
    let rare = 0;
    let titleShared = 0;
    for (const t of note) {
      if (!d.tokens.has(t)) continue;
      shared.push(t);
      const i = idx.idf(t);
      w += i;
      if (idx.isRare(t)) rare += 1;
      if (d.titleTokens.has(t)) titleShared += 1;
    }
    if (shared.length < DECIDED_MATCH.minShared || rare < DECIDED_MATCH.minRareShared || titleShared < DECIDED_MATCH.minTitleShared) continue;
    const coverage = noteWeight > 0 ? w / noteWeight : 0;
    if (coverage < DECIDED_MATCH.minCoverage) continue;
    passing.push({ id: d.id, title: d.title, decision: d.decision, shared: shared.sort(), coverage: Math.round(coverage * 100) / 100 });
  }
  if (!passing.length) return null;
  const top = Math.max(...passing.map((c) => c.coverage));
  const near = passing.filter((c) => c.coverage >= top - DECIDED_MATCH.newerWithin);
  near.sort((a, b) => drNum(b.id) - drNum(a.id));
  return near[0];
}

// The first sentence (or two) of a decision, in plain words, for the sender.
export function plainReason(decision, max = 320) {
  const t = String(decision || '').replace(/\s+/g, ' ').replace(/^\d+\.\s*/, '').trim();
  if (!t) return '';
  const m = /^(.{40,}?[.!?])(\s|$)/.exec(t);
  const first = m ? m[1] : t;
  return first.length > max ? `${first.slice(0, max - 1)}…` : first;
}

// --- Past triaged notes: the steward's earlier word on the same thing ------------
export const HISTORY_MATCH = Object.freeze({ minShared: 3, minJaccard: 0.5 });

export function matchHistory(text, history = [], selfId = null) {
  const note = tokensOf(text);
  if (note.size < HISTORY_MATCH.minShared) return null;
  let best = null;
  for (const h of history || []) {
    if (!h || (selfId && h.id === selfId)) continue;
    const st = h.triageStatus || h.triage_status || '';
    if (!['declined', 'fixed', 'in-progress', 'promoted'].includes(st)) continue;
    const other = tokensOf(complaintText(noteParts(h)) || feedbackText(h));
    let shared = 0;
    for (const t of note) if (other.has(t)) shared += 1;
    const union = note.size + other.size - shared;
    const j = union ? shared / union : 0;
    if (shared < HISTORY_MATCH.minShared || j < HISTORY_MATCH.minJaccard) continue;
    if (!best || j > best.jaccard) best = { id: h.id, status: st, reason: String(h.triageNotes || h.triage_notes || '').trim(), jaccard: Math.round(j * 100) / 100 };
  }
  return best;
}

// --- Low-hanging fruit: the allowlist -------------------------------------------
// A fix rule names what it is, the regex that recognizes it, and the SCOPE the
// fix may touch (enforced again on the branch by scripts/intake-autofix-scope-
// guard.mjs, so a broad fix cannot ride a narrow category).
export const FIX_RULES = Object.freeze([
  { key: 'wording', label: 'Wording or spelling', scope: 'copy', test: /\b(typo|typos|misspel\w*|spelled wrong|spelling|grammar|wording|reword|punctuation|capitali[sz]\w*|lower ?case|upper ?case|should (say|read)|wrong word|extra space|double space|says .{1,40} instead|label(?:ed|led)? wrong|mislabel\w*)\b/ },
  { key: 'label', label: 'A label or button that says the wrong thing', scope: 'copy', test: /\b(button|label|heading|title|placeholder|tooltip)\b.{0,40}\b(says|reads|wrong|confusing|unclear|misleading)\b/ },
  { key: 'legibility', label: 'Text too small or hard to read', scope: 'style', test: /\b((text|font|letters?|words?|print)\s+(is\s+|are\s+)?(too\s+small|tiny|too\s+light|faint)|hard to read|can'?t read (it|the text)|low contrast|contrast)\b/ },
]);

// Never low-hanging, however small it sounds: money, identity, security, data,
// schema, the Word's own text (a quotation is fetched verbatim, never edited
// by a fix, DR-0076), and the Godhead's names (DR-0210's bright line).
export const NEVER_AUTOFIX = /\b(money|pay|paid|payment|giving|give|gave|donat\w*|tithe|offering|bank|tax|taxes|invoice|price|charge|card|refund|password|passcode|pin|sign ?in|log ?in|login|account|privacy|private|secur\w*|hack\w*|delete\w*|lost|disappear\w*|database|permission|role|access|admin|membership|roll|record|schema|migration|scripture|verse|bible|kjv|esv|yahweh|jesus|god|lord|holy spirit)\b/;

export const FIX_MAX_CHARS = 400;

// --- Ownership: the role that carries a note, never an invented person ----------
export function ownerRoleFor(category, area = '') {
  const a = String(area || '').toLowerCase();
  if (category === 'fix') return 'The PoeTech agent, through the gated lane';
  if (category === 'ask') return 'You';
  if (/^(church|choir|pulpit)/.test(a)) return 'The church office stewards (owner or admin of the church space)';
  if (/^tlc/.test(a)) return 'The TLC office stewards (owner or admin of the practice)';
  return 'The PoeTech stewards (owner or admin)';
}

const basisOf = (kind, extra = {}) => ({ kind, version: CATEGORIZER_VERSION, ...extra });

/**
 * categorizeIntake(item, { ledger, history }) — the category and the basis it
 * stands on. `basis.kind` names the rule family; everything the sender or a
 * steward is shown about WHY comes from `basis`, so it can be audited.
 */
export function categorizeIntake(item = {}, { ledger = null, history = [] } = {}) {
  const p = noteParts(item);
  const complaint = complaintText(p);
  const lower = complaint.toLowerCase();
  // Judge the person's own words. The composed body's "Not working:" label is
  // the form's, not theirs; evaluated raw it made every note read as a bug.
  const evalRow = evaluateFeedback({ ...item, text: complaint || p.working || p.raw });
  const area = evalRow.routeArea || item.which_tab || item.currentView || item.area || '';
  const status = item.triageStatus || item.triage_status || '';
  const notes = String(item.triageNotes || item.triage_notes || '').trim();
  const res = (category, basis) => ({ category, basis, area, severity: evalRow.severity, ownerRole: ownerRoleFor(category, area) });

  // 1. Machine telemetry is not a person's note.
  if (evalRow.isNoise) return res('signal', basisOf('telemetry', { rule: evalRow.category }));

  // 2. A steward's own word wins over any rule: it was read by a person.
  if (status === 'declined' && notes) return res('decided', basisOf('steward', { status, reason: notes }));
  if (status === 'needs-info') return res('ask', basisOf('steward', { status, ask: notes || 'One more detail so this can be acted on.' }));

  // 3. A reply to an outcome goes to a person. The system never answers a
  //    push-back with the same automatic answer twice.
  const replyTo = item.replyTo || item.reply_to || null;
  if (replyTo) return res('work', basisOf('reply', { replyTo }));

  // 4. Nothing to read. A picture alone, or a rating alone, asks for words.
  const shots = feedbackScreenshotCount(item);
  if (!complaint && !p.working) {
    if (/^(love|good)$/i.test(p.rating)) return res('thanks', basisOf('rating', { rating: p.rating }));
    if (shots > 0) return res('ask', basisOf('no-text', { ask: 'In a sentence, what should we look at in the picture you sent?' }));
    return res('ask', basisOf('no-text', { ask: 'In a sentence, what felt wrong or what would help?' }));
  }
  if (!complaint && p.working) return res('thanks', basisOf('praise-only', { rule: 'working' }));

  // 5. Steward states that already place it on the board.
  if (['in-progress', 'promoted', 'reviewed', 'fixed'].includes(status)) {
    return res('work', basisOf('steward', { status }));
  }

  // 6. Too short to act on, and not praise.
  const words = lower.split(/\s+/).filter(Boolean).length;
  if (words < 3 && evalRow.category !== 'praise') {
    return res('ask', basisOf('too-short', { ask: 'A little more: where in the app, and what happened?' }));
  }

  // 7. Serious classes are always real work, never auto-answered or auto-fixed.
  const serious = ['data-loss', 'privacy-tenancy', 'auth', 'broken'].includes(evalRow.category);

  // 8. Low-hanging fruit (allowlisted, small, never a bright-line subject).
  if (!serious && complaint.length <= FIX_MAX_CHARS && !NEVER_AUTOFIX.test(lower)) {
    const tagCopy = p.tags.includes('copy') && !p.tags.includes('bug');
    const rule = FIX_RULES.find((r) => r.test.test(lower)) || (tagCopy ? FIX_RULES[0] : null);
    if (rule) return res('fix', basisOf('fix-rule', { rule: rule.key, scope: rule.scope, label: rule.label }));
  }

  // 9. Already decided: first a steward's earlier word on the same thing,
  //    then the decision ledger. Never for a serious class (a bug report is
  //    never answered with "already decided").
  if (!serious) {
    const past = matchHistory(complaint, history, item.id);
    if (past && past.status === 'declined' && past.reason) {
      return res('decided', basisOf('history', { earlierId: past.id, reason: past.reason, similarity: past.jaccard }));
    }
    const dr = matchDecision(complaint, ledger);
    if (dr) {
      return res('decided', basisOf('ledger', { dr: dr.id, title: dr.title, reason: plainReason(dr.decision), shared: dr.shared, coverage: dr.coverage }));
    }
    if (past) return res('work', basisOf('history', { earlierId: past.id, earlierStatus: past.status, similarity: past.jaccard }));
  }

  // 10. Praise with no complaint words.
  if (evalRow.category === 'praise') return res('thanks', basisOf('rule', { rule: 'praise' }));

  // 11. Real work. An unrecognized note is still real work, said as unknown.
  if (evalRow.category === 'uncategorized' || evalRow.category === 'needs-image-review') {
    return res('work', basisOf('unknown', { note: 'No rule matched; a person reads it.' }));
  }
  return res('work', basisOf('rule', { rule: evalRow.category, label: evalRow.categoryLabel }));
}

/** One line a steward reads: why this note is in its category. */
export function basisLine(cat) {
  const b = (cat && cat.basis) || {};
  switch (b.kind) {
    case 'telemetry': return 'Machine telemetry (the Learn engagement signal), not a note from a person.';
    case 'steward': return b.status === 'declined' ? `A steward declined it: ${b.reason}` : `A steward set it to "${b.status}"${b.ask ? `: ${b.ask}` : ''}.`;
    case 'reply': return 'A reply to an earlier outcome. Replies always go to a person.';
    case 'rating': return `Rated "${b.rating}" with no words.`;
    case 'praise-only': return 'Only the "what’s working" box was filled in.';
    case 'no-text': return 'No words to act on yet.';
    case 'too-short': return 'Fewer than three words; one more detail is asked for.';
    case 'fix-rule': return `Fix rule "${b.rule}" (${b.label}); allowed scope: ${b.scope}.`;
    case 'history': return b.reason ? `Matches an earlier note a steward declined (similarity ${b.similarity}): ${b.reason}` : `Matches an earlier note now "${b.earlierStatus}" (similarity ${b.similarity}).`;
    case 'ledger': return `Matches ${b.dr} (coverage ${b.coverage}; shared words: ${(b.shared || []).join(', ')}).`;
    case 'unknown': return 'No rule matched; a person reads it.';
    case 'rule': return `Rule "${b.rule}"${b.label ? ` (${b.label})` : ''}.`;
    default: return 'Not categorized yet.';
  }
}

// --- The delivery record -> a timeline window ------------------------------------
export const WINDOW_MIN_SAMPLES = 5;
const HOUR_MS = 3600000;

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function humanDuration(hours) {
  if (!Number.isFinite(hours)) return 'unknown';
  if (hours < 1) { const m = Math.max(1, Math.round(hours * 60)); return `${m} minute${m === 1 ? '' : 's'}`; }
  if (hours < 48) { const h = Math.round(hours * 10) / 10; return `${h} hour${h === 1 ? '' : 's'}`; }
  const d = Math.round(hours / 24);
  return `${d} day${d === 1 ? '' : 's'}`;
}

/**
 * The window for a class of work, measured. `merges` are merged pull requests
 * ({ branch, createdAt, mergedAt }); `outcomes` are notes that reached an
 * outcome ({ submittedAt, outcomeAt, category }). Intake-to-outcome is the
 * truer measure and wins when there are enough samples; otherwise the lane's
 * open-to-merge time is given AND named as that. Too few samples = unknown.
 */
export function deliveryWindow({ merges = [], outcomes = [], cls = 'work' } = {}) {
  const intake = (outcomes || [])
    .filter((o) => o && (o.category === cls || !o.category))
    .map((o) => (Date.parse(o.outcomeAt) - Date.parse(o.submittedAt)) / HOUR_MS)
    .filter((h) => Number.isFinite(h) && h >= 0)
    .sort((a, b) => a - b);
  if (intake.length >= WINDOW_MIN_SAMPLES) {
    const p50 = quantile(intake, 0.5);
    const p90 = quantile(intake, 0.9);
    return { ok: true, measure: 'intake-to-outcome', n: intake.length, p50Hours: p50, p90Hours: p90, text: `Notes like this have reached their outcome in a median of ${humanDuration(p50)} from when they were sent; 9 in 10 within ${humanDuration(p90)} (measured over ${intake.length}).` };
  }
  const all = (merges || [])
    .map((m) => ({ branch: String(m.branch || ''), h: (Date.parse(m.mergedAt) - Date.parse(m.createdAt)) / HOUR_MS }))
    .filter((m) => Number.isFinite(m.h) && m.h >= 0);
  const own = all.filter((m) => m.branch.startsWith('claude/intake-fix-'));
  const pick = cls === 'fix' && own.length >= WINDOW_MIN_SAMPLES ? own : all;
  const hours = pick.map((m) => m.h).sort((a, b) => a - b);
  if (hours.length < WINDOW_MIN_SAMPLES) return { ok: false, measure: 'none', n: hours.length, text: 'No timeline yet: too few measured changes to give an honest window.' };
  const p50 = quantile(hours, 0.5);
  const p90 = quantile(hours, 0.9);
  const which = pick === own ? 'system fixes' : 'changes';
  return { ok: true, measure: 'lane', n: hours.length, p50Hours: p50, p90Hours: p90, text: `Once a change for it is opened, ${which} like it have merged in a median of ${humanDuration(p50)}; 9 in 10 within ${humanDuration(p90)} (measured over the last ${hours.length} merged). When the work starts depends on the board's order.` };
}

// --- What the sender reads --------------------------------------------------------
/**
 * outcomeFor(item, cat, { delivery, fix }) — the receipt state for one note.
 * `delivery` is { merges, outcomes } (the measured record); `fix` is the note's
 * fix-queue row when there is one. Every sentence is derived from a stored
 * field or a measurement; nothing is written by a person for this.
 */
export function outcomeFor(item = {}, cat = null, { delivery = null, fix = null } = {}) {
  const c = cat || categorizeIntake(item);
  const status = item.triageStatus || item.triage_status || '';
  const changed = String(item.outcomeNote || item.outcome_note || '').trim();
  const ref = String(item.outcomeRef || item.outcome_ref || '').trim();
  const b = c.basis || {};
  if (status === 'fixed' || (fix && fix.status === 'merged')) {
    const what = changed || (fix && fix.prTitle) || String(item.triageNotes || item.triage_notes || '').trim();
    return { key: 'fixed', category: c.category, label: 'Fixed', detail: what ? `What changed: ${what}` : 'This one is done. If it is still happening for you, reply and say so.', ref: ref || (fix && fix.prNumber ? `#${fix.prNumber}` : ''), replyable: true };
  }
  if (c.category === 'signal') return { key: 'signal', category: 'signal', label: 'Telemetry', detail: 'A machine signal, not a note.', replyable: false };
  if (c.category === 'thanks') return { key: 'thanks', category: 'thanks', label: 'Thank you', detail: 'Received. Praise is counted on the stewards’ board beside the problems, so what works is kept.', replyable: true };
  if (c.category === 'ask') return { key: 'needs-info', category: 'ask', label: 'We need one thing from you', detail: b.ask || 'One more detail so this can be acted on.', reason: b.kind === 'steward' ? (b.ask || '') : '', replyable: true };
  if (c.category === 'decided') {
    const cite = b.kind === 'ledger' ? `${b.dr}${b.title ? ` — ${b.title}` : ''}` : b.kind === 'history' ? 'an earlier note on the same thing' : 'a steward’s decision';
    return { key: 'decided', category: 'decided', label: 'Already decided', detail: 'This was already looked at and decided. The reason is below. If that is not what you meant, reply and a person will read it.', reason: b.reason || '', cite, replyable: true };
  }
  const win = deliveryWindow({ merges: delivery?.merges || [], outcomes: delivery?.outcomes || [], cls: c.category });
  if (c.category === 'fix') {
    const opened = fix && fix.status === 'opened' && fix.prNumber;
    const failed = fix && fix.status === 'failed';
    if (failed) {
      return { key: 'on-board', category: 'work', label: 'On the board', detail: 'The system tried a small fix and it did not pass the checks, so a person carries it now.', owner: ownerRoleFor('work', c.area), window: win.text, replyable: true };
    }
    return { key: 'fixing', category: 'fix', label: opened ? 'Fix in review' : 'Being fixed by the system', detail: opened ? `A fix is open (#${fix.prNumber}) and running through the checks.` : 'This is a small change the system makes itself, through the same checks every change passes.', owner: c.ownerRole, window: win.text, replyable: true };
  }
  const working = ['in-progress', 'promoted'].includes(status);
  return { key: working ? 'working' : 'on-board', category: 'work', label: working ? 'Being worked on' : 'On the board', detail: working ? 'Someone has picked this up. It is in progress.' : 'It is on the stewards’ board as real work.', owner: c.ownerRole, window: win.text, replyable: true };
}

/** Counts per category, for the board and the Decision Intelligence readouts. */
export function categoryCounts(cats = []) {
  const out = Object.fromEntries(CATEGORY_ORDER.map((k) => [k, 0]));
  for (const c of cats) if (c && out[c.category] != null) out[c.category] += 1;
  return out;
}
