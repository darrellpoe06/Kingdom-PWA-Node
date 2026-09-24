// =============================================================================
// decision-intake — paste a transcript, notes or a status report; get back the
// candidate concerns it contains, each quoting the line it came from (DR-0610)
// =============================================================================
// Darrell, 2026-09-24, on the Decision Intelligence Layer: the inputs are
// "recordings, transcripts, AI notes, boards, tickets, status reports,
// stakeholder communications"; then "Build the paste-in intake"; then "No we
// dont want TDX or Monday... we want our own version of those systems inside
// of PoeTech App". So this intake reads TEXT a person brings in by hand. It
// connects to no outside system, and boards and tickets are PoeTech's own
// rows, read directly by the board (decision-intelligence.js), never imported.
//
// THE RULES ARE DETERMINISTIC (DR-0076). No model reads the text: each signal
// is a named pattern a reader can check, so the same paste with the same
// clock always returns the same candidates. A candidate is a PROPOSAL. It
// becomes a concern row only when a person ticks it, and the row carries the
// verbatim quote and its line number as its evidence.
//
// THE PASTED TEXT IS NOT STORED. Only the rows a person approves are written,
// through the same concerns path the board uses. The database allows the
// sources 'manual' and 'feedback' only (concerns_source_check, measured on
// the live project 2026-09-24), so an intake row is 'manual' and names its
// origin in links.intake.
// =============================================================================
import { signatureOf } from './decision-intelligence.js';

export const INTAKE_KINDS = Object.freeze([
  { key: 'transcript', label: 'Meeting transcript' },
  { key: 'notes', label: 'Meeting or AI notes' },
  { key: 'status', label: 'Status report' },
  { key: 'email', label: 'Stakeholder message' },
  { key: 'other', label: 'Other text' },
]);

export const MAX_INTAKE_CHARS = 200000;
export const MAX_CANDIDATES = 60;

// Priority order: the first signal a line trips is its primary kind.
export const SIGNALS = Object.freeze([
  { key: 'dependency', label: 'waits on', re: /\b(waiting (?:on|for)|blocked (?:by|on)|depends on|dependent on|dependency|gated (?:by|on)|pending (?:approval|review|sign-?off|access)|can(?:not|'t|’t) (?:\w+ ){0,4}until)\b/i },
  { key: 'decision', label: 'decision', re: /\b(need(?:s|ed)? (?:a )?decision|decision (?:needed|required|on)|decide (?:on|whether|if|between)|needs? (?:approval|sign-?off)|approval (?:needed|required)|sign-?off (?:needed|required|on|from))\b/i },
  { key: 'escalation', label: 'stalled', re: /\b(stalled|stuck|no response|no update|still waiting|overdue|past due|escalat\w*|slipped|slipping)\b/i },
  { key: 'timeline', label: 'date at risk', re: /\b(at risk|behind schedule|falling behind|running behind|delay(?:ed|s)?|push(?:ed)? (?:back|out)|miss(?:ed)? (?:the )?(?:date|deadline)|deadline|go-?live)\b/i },
  { key: 'risk', label: 'risk', re: /\b(risks?|concern(?:s|ed)?|worr(?:y|ied)|issues?|problems?|unclear|blockers?)\b/i },
  { key: 'action', label: 'action', re: /(\b(action items?|todo|to-do|follow(?:s)? up|next steps?|assigned to|owner\s*:)|^\s*(?:ai|a\.i\.)\s*[:-])/i },
]);

const LABEL_WORDS = new Set(['owner', 'action', 'ai', 'risk', 'decision', 'issue', 'status', 'note', 'notes', 'due', 'blocker', 'dependency', 'subject', 'from', 'to', 'cc', 'date', 're', 'next steps', 'summary', 'update']);
const NOT_A_PERSON = new Set(['We', 'I', 'They', 'It', 'This', 'That', 'The', 'He', 'She', 'You', 'Team', 'Everyone', 'Someone', 'Nobody', 'Who', 'What', 'Which', 'There', 'Here', 'If', 'When', 'Then', 'So', 'And', 'But', 'Also', 'Please', 'Let', 'Need', 'Needs']);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tues', 'wednes', 'thurs', 'fri', 'satur'];
const NAME = "[A-Z][A-Za-z.'’-]*(?:\\s[A-Z][A-Za-z.'’-]*)?";

function pad(n) { return String(n).padStart(2, '0'); }

function validDay(y, m, d) {
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return '';
  return `${y}-${pad(m)}-${pad(d)}`;
}

// A date with no year takes the clock's year; one that would then sit more
// than 60 days in the past is read as next year's.
function withYear(m, d, nowMs) {
  if (!Number.isFinite(nowMs)) return '';
  const y = new Date(nowMs).getUTCFullYear();
  const iso = validDay(y, m, d);
  if (!iso) return '';
  return Date.parse(`${iso}T00:00:00Z`) < nowMs - 60 * 86400000 ? validDay(y + 1, m, d) : iso;
}

/** The first date a line names, as YYYY-MM-DD, or ''. The clock is an argument. */
export function findDate(text, nowMs) {
  const s = String(text || '');
  let m = s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return validDay(+m[1], +m[2], +m[3]);
  m = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    if (m[3]) return validDay(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]);
    return withYear(+m[1], +m[2], nowMs);
  }
  m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i);
  if (m) {
    const mo = MONTHS.indexOf(m[1].toLowerCase()) + 1;
    return m[3] ? validDay(+m[3], mo, +m[2]) : withYear(mo, +m[2], nowMs);
  }
  m = s.match(/\b(?:by|on|before|until|due|this|next)\s+(sun|mon|tues|wednes|thurs|fri|satur)day\b/i);
  if (m && Number.isFinite(nowMs)) {
    const want = WEEKDAYS.indexOf(m[1].toLowerCase());
    const today = new Date(nowMs).getUTCDay();
    const ahead = ((want - today + 7) % 7) || 7;
    const t = new Date(nowMs + ahead * 86400000);
    return validDay(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }
  return '';
}

/** Who the line names as carrying the work, or ''. The speaker counts only for "I will". */
export function findOwner(text, speaker = '') {
  const s = String(text || '');
  const pick = (v) => {
    const name = String(v || '').trim().replace(/[.,;:]+$/, '');
    if (!name) return '';
    const first = name.split(/\s+/)[0];
    return NOT_A_PERSON.has(first) ? '' : name;
  };
  let m = s.match(new RegExp(`\\bowner\\s*[:=-]\\s*(${NAME})`, 'i'));
  if (m && pick(m[1])) return pick(m[1]);
  m = s.match(new RegExp(`\\bassigned to\\s+(${NAME})`));
  if (m && pick(m[1])) return pick(m[1]);
  m = s.match(/@([A-Za-z][\w.-]*[A-Za-z0-9])/);
  if (m) return m[1];
  m = s.match(new RegExp(`\\((${NAME})\\)\\s*[.]?\\s*$`));
  if (m && pick(m[1])) return pick(m[1]);
  m = s.match(new RegExp(`^(${NAME})\\s+(?:will|to|owns|is going to|needs to)\\b`));
  if (m && pick(m[1])) return pick(m[1]);
  if (speaker && /\bI(?:'ll|’ll| will| can take| am going to| own)\b/.test(s)) return speaker;
  return '';
}

function capture(text, re) {
  const m = String(text || '').match(re);
  return m ? m[1].trim().replace(/[\s,;:]+$/, '') : '';
}

/** What the line says it waits on, as the words it uses, or ''. */
export function findWaitsOn(text) {
  return capture(text, /\b(?:waiting (?:on|for)|blocked (?:by|on)|depends on|dependent on|gated (?:by|on)|until)\s+(.{3,120}?)(?:[.;]|,\s|$)/i);
}

/** The decision the line says is needed, or ''. */
export function findDecision(text) {
  return capture(text, /\b(?:need(?:s|ed)? (?:a )?decision (?:on|about|whether|if)|decision (?:needed|required) (?:on|about|for)|decide (?:on|whether|if|between)|needs? (?:approval|sign-?off) (?:on|for|of|from)|approval (?:needed|required) (?:on|for))\s+(.{3,160}?)(?:[.;]|$)/i);
}

// One line of pasted text → { speaker, text } with the transcript furniture
// removed: WebVTT cues, timestamps, "<v Name>" voice tags, bullets, and a
// leading "Name:" speaker label (never a field label like "Owner:").
export function parseLine(raw) {
  let s = String(raw || '').replace(/\s+$/, '');
  if (!s.trim() || /^WEBVTT\b/.test(s) || /-->/.test(s) || /^\s*\d+\s*$/.test(s) || /^NOTE\b/.test(s)) return null;
  let speaker = '';
  const v = s.match(/^\s*<v\s+([^>]+)>(.*?)(?:<\/v>)?\s*$/);
  if (v) { speaker = v[1].trim(); s = v[2]; }
  s = s.replace(/^\s*\[?\(?\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\)?\]?\s*/, '');
  s = s.replace(/^\s*(?:[-*•▪◦–]|\d+[.)]|\[[ xX]\])\s+/, '');
  if (!speaker) {
    const sp = s.match(/^\s*([A-Z][A-Za-z.'’-]*(?:\s[A-Z][A-Za-z.'’-]*){0,2})\s*:\s+(.+)$/);
    if (sp && !LABEL_WORDS.has(sp[1].toLowerCase())) { speaker = sp[1]; s = sp[2]; }
  }
  s = s.trim();
  return s ? { speaker, text: s } : null;
}

// A long paragraph is read sentence by sentence, so one line that names two
// worries yields two candidates.
function sentences(text) {
  return String(text).split(/(?<=[.!?])\s+(?=[A-Z"“@])/).map((x) => x.trim()).filter(Boolean);
}

/**
 * extractCandidates(text, { kind, nowMs }) → the proposals in a paste.
 * Returns { ok, reason?, kind, lines, candidates, quiet, truncated }.
 * Each candidate: { id, line, speaker, quote, text, signals, primary, owner,
 * targetDate, waitsOn, decision, signature, count, lines }.
 */
export function extractCandidates(text, { kind = 'other', nowMs } = {}) {
  const raw = String(text || '');
  if (!raw.trim()) return { ok: false, reason: 'Nothing pasted yet.', kind, lines: 0, candidates: [], quiet: 0, truncated: false };
  if (raw.length > MAX_INTAKE_CHARS) return { ok: false, reason: `The paste is ${raw.length} characters; the intake reads at most ${MAX_INTAKE_CHARS}. Paste it in parts.`, kind, lines: 0, candidates: [], quiet: 0, truncated: false };
  const all = raw.split(/\r?\n/);
  const bySig = new Map();
  const out = [];
  let quiet = 0;
  let scanned = 0;
  all.forEach((rawLine, i) => {
    const p = parseLine(rawLine);
    if (!p) return;
    scanned += 1;
    let hit = false;
    for (const sent of sentences(p.text)) {
      const signals = SIGNALS.filter((sg) => sg.re.test(sent)).map((sg) => sg.key);
      if (!signals.length) continue;
      hit = true;
      const signature = signatureOf(sent) || sent.toLowerCase();
      const seen = bySig.get(signature);
      if (seen) { seen.count += 1; seen.lines.push(i + 1); continue; }
      const c = {
        id: `ic-${i + 1}-${out.length + 1}`,
        line: i + 1,
        speaker: p.speaker,
        quote: rawLine.trim(),
        text: sent,
        signals,
        primary: signals[0],
        owner: findOwner(sent, p.speaker),
        targetDate: findDate(sent, nowMs),
        waitsOn: signals.includes('dependency') ? findWaitsOn(sent) : '',
        decision: signals.includes('decision') ? (findDecision(sent) || sent) : '',
        signature,
        count: 1,
        lines: [i + 1],
      };
      bySig.set(signature, c);
      out.push(c);
    }
    if (!hit) quiet += 1;
  });
  const truncated = out.length > MAX_CANDIDATES;
  return { ok: true, kind, lines: scanned, candidates: out.slice(0, MAX_CANDIDATES), quiet, truncated };
}

/**
 * candidateToConcern(candidate, { kind, label, area, pastedAt }) → the item
 * addConcern takes. The quote and its line are the evidence; the origin rides
 * in links.intake; a named dependency rides in links.waits_on, which the board
 * reads as a dependency.
 */
export function candidateToConcern(c, { kind = 'other', label = '', area = '', pastedAt = '' } = {}) {
  const kindLabel = (INTAKE_KINDS.find((k) => k.key === kind) || INTAKE_KINDS[INTAKE_KINDS.length - 1]).label;
  const where = [kindLabel, String(label || '').trim()].filter(Boolean).join(' · ');
  const said = c.count > 1 ? `, said ${c.count} times (lines ${c.lines.join(', ')})` : `, line ${c.line}`;
  const who = c.speaker ? `${c.speaker}: ` : '';
  const links = {
    intake: { kind, label: String(label || '').trim(), line: c.line, lines: c.lines, signals: c.signals, pastedAt },
    ...(c.waitsOn ? { waits_on: c.waitsOn } : {}),
  };
  return {
    concern: String(c.text || '').slice(0, 240),
    solution: null,
    targetDate: c.targetDate || null,
    status: 'open',
    area: String(area || '').trim() || null,
    source: 'manual',
    links,
    evidence: `${who}“${String(c.text || '').slice(0, 400)}” (${where}${said})`,
    owner: c.owner || null,
    decisionRequired: c.decision ? String(c.decision).slice(0, 240) : null,
  };
}
