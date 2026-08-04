// =============================================================================
// advocacy-cases — the Advocacy Case Manager's pure model (DR-0274 seed;
// pb-advocacy-outcomes made real). Darrell 2026-08-04: "a system inside PoeTech
// to facilitate the management of the students experiences for documentation of
// their situations so when they ask for help we will have data to support their
// perspectives and also help keep context."
//
// The proven shape this serves is the family's own January 2024 school case:
// what won attention was DOCUMENTATION AT THE TIME — dated entries, the
// institution's own words kept verbatim, the family's witness labeled as the
// family's witness, and the records the institution holds named precisely so a
// records request can fill them. This module turns that lived practice into a
// standing instrument any student or family can use from day one.
//
// Pure model + transforms only (node-testable, no browser APIs beyond
// localStorage via safeStorage). Surface: components/AdvocacyCases.jsx.
// Cross-device sync: lib/advocacy-sync.js (table advocacy_records, 0132).
//
// EVIDENTIARY ARCHITECTURE (the three tiers, DR-0100 discipline):
//   their-words — the institution's OWN statements, kept verbatim with date and
//                 speaker role. Strongest tier: quotable back to them.
//   our-witness — the family's dated observation, honestly labeled as ours.
//   their-data  — records THEY hold (rosters, seat counts, policies), named
//                 precisely so a public-records request can fill the gap.
// Judgment stands on measured substance, never on who sounds confident.
// =============================================================================

// --- Scripture anchors (KJV, fetched verbatim from the local corpus; gated by
// --- advocacy-cases.test.js — DR-0076/DR-0270 class) -------------------------
export const ADVOCACY_VERSES = [
  {
    ref: 'Habakkuk 2:2',
    text: 'And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.',
    why: 'Write it down, plainly, at the time — the record is the instrument.',
  },
  {
    ref: 'Matthew 18:16',
    text: 'But if he will not hear thee, then take with thee one or two more, that in the mouth of two or three witnesses every word may be established.',
    why: 'Established words need witnesses — dated entries are witnesses that do not forget.',
  },
  {
    ref: 'Proverbs 18:17',
    text: 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
    why: 'A one-sided account is not yet the truth — keep their words and ours separate, and let the record be searchable.',
  },
  {
    ref: 'Amos 5:12',
    text: 'For I know your manifold transgressions and your mighty sins: they afflict the just, they take a bribe, and they turn aside the poor in the gate from their right.',
    why: 'Yahweh sees the gate where the poor are turned aside — the case file is how a family stands in that gate with the record in hand.',
  },
  {
    ref: 'Luke 18:5',
    text: 'Yet because this widow troubleth me, I will avenge her, lest by her continual coming she weary me.',
    why: 'Persistence with a paper trail — the widow kept coming, and the record of continual coming is what moved the unjust judge.',
  },
];

// --- The pre-sourced shelf: documented procedures to cite (Darrell 2026-08-04:
// --- "presource the unit 4 policies and historical decisions for supporting
// --- communications that allow us to have clarification on documented
// --- procedures"). Three layers, each honestly labeled and dated (DR-0100):
// ---   law      — statutes that bind the district regardless of local pages
// ---   district — where the district's OWN policies and minutes live
// ---   history  — documented decisions already on the public record
// --- Every entry names its sources; anything not verified to the letter here
// --- carries a `verify` note instead of an asserted specific (DR-0076).
export const POLICY_SHELF = [
  {
    id: 'ps-accelerated-placement-act',
    layer: 'law',
    cite: '105 ILCS 5/14A-32',
    name: 'Illinois Accelerated Placement Act — school district responsibilities',
    gives: 'Every Illinois district MUST have an accelerated placement policy that (1) is open to all children who demonstrate high ability — not only those labeled gifted; (2) uses a fair and equitable decision-making process that involves multiple persons AND includes the student’s parents or guardians; (3) has procedures for notifying parents of a decision affecting their child’s participation; (4) uses an assessment process with multiple valid, reliable indicators. And by no later than the 2023–24 school year, the policy must allow AUTOMATIC ENROLLMENT into the next most rigorous level of advanced coursework for a student who meets or exceeds State standards in English language arts, math, or science on a State assessment.',
    useIt: 'When a placement or advanced-course decision is made about your child without you, or without stated criteria, cite this: the decision process is required by state law to include the parents and to be communicated. If your child meets/exceeds on a state assessment, automatic enrollment in the next most rigorous course is the statutory default — ask in writing which provision of the district’s accelerated placement policy was applied. ISBE also collects accelerated-placement participation data disaggregated by demographic group — citable without any records request.',
    sources: [
      { label: 'ISBE — Accelerated Placement Act FAQ (PDF)', url: 'https://www.isbe.net/Documents/Accelerated-Placement-Act-FAQ.pdf' },
      { label: 'Statute text (FindLaw)', url: 'https://codes.findlaw.com/il/chapter-105-schools/il-st-sect-105-5-14a-32/' },
      { label: 'Article 14A (Justia)', url: 'https://law.justia.com/codes/illinois/chapter-105/act-105-ilcs-5/article-14a/' },
    ],
    asOf: '2026-08-04',
  },
  {
    id: 'ps-issra',
    layer: 'law',
    cite: '105 ILCS 10 (ISSRA)',
    name: 'Illinois School Student Records Act — your child’s records without FOIA',
    gives: 'A parent (or the parent’s designated representative) has the right to inspect and copy ALL of their child’s permanent and temporary school records. This is a direct parental right — it does not go through FOIA. Parents may also challenge the accuracy of records, with an appeal path to the Regional Superintendent on a defined clock.',
    useIt: 'Request your own child’s records (placement decisions, assessments, counselor notes that are student records) as an ISSRA request, in writing, addressed to the school — faster and broader for YOUR child than FOIA. Keep FOIA for records about the SYSTEM (rosters, seat counts, policies, aggregate data).',
    sources: [
      { label: 'ISSRA full text (Justia)', url: 'https://law.justia.com/codes/illinois/chapter-105/act-105-ilcs-10/' },
    ],
    asOf: '2026-08-04',
    verify: 'The exact day-count for initial access is set by ISBE rule (23 Ill. Adm. Code 375) — confirm the current number before quoting a deadline in a letter.',
  },
  {
    id: 'ps-foia',
    layer: 'law',
    cite: '5 ILCS 140 (FOIA)',
    name: 'Illinois Freedom of Information Act — the system’s records',
    gives: 'School districts are public bodies. Rosters, seat counts, enrollment criteria, policies, and communications about decisions are public records reachable by written request; denials must cite exemptions and are reviewable by the Attorney General’s Public Access Counselor.',
    useIt: 'This fills the their-data tier: when the record shows a claim like “no open seats,” the seat counts and rosters that test the claim are FOIA-reachable. Name the records precisely and date-bound the request.',
    sources: [
      { label: 'Statute (ILGA)', url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=85' },
    ],
    asOf: '2026-08-04',
  },
  {
    id: 'ps-oma',
    layer: 'law',
    cite: '5 ILCS 120 (Open Meetings Act)',
    name: 'Open Meetings Act — the board’s decisions are public, and so is your voice',
    gives: 'Board meetings, agendas, and minutes are public; the Act requires public bodies to provide an opportunity for public comment. Historical board decisions live in the published minutes.',
    useIt: 'Minutes are the documented-decision archive — quote them as the board’s own words. Public comment is the on-the-record rung of the escalation ladder.',
    sources: [
      { label: 'Statute (ILGA)', url: 'https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=84' },
    ],
    asOf: '2026-08-04',
  },
  {
    id: 'ps-unit4-policies',
    layer: 'district',
    cite: 'Unit 4 board policy manual + minutes (BoardDocs)',
    name: 'Champaign Unit 4 — where the district’s own documented procedures live',
    gives: 'Unit 4’s board policies, meeting agendas, and minutes are published on its public BoardDocs portal; the district’s accelerated placement procedures (early entrance, single-subject and whole-grade acceleration, the assessment battery) are documented on its own site; a Board Policy Committee maintains the manual. Leadership, verified 2026-08-04: Dr. Geovanny Ponce became superintendent July 1, 2026, succeeding Dr. Shelia Boozer, whose contract was ended by the board elected in 2025 amid publicly reported transparency and communication concerns — commitments made under prior leadership are inherited items the current administration can simply answer.',
    useIt: 'Before writing, pull the district’s OWN policy language and quote it back — “your published policy states…” is the strongest their-words evidence there is. These portals block automated tools; open them directly in a browser and save the policy as a dated document entry on the case.',
    sources: [
      { label: 'BoardDocs public portal (policies · agendas · minutes)', url: 'https://go.boarddocs.com/il/champil/Board.nsf/public' },
      { label: 'Unit 4 — Accelerated Placement page', url: 'https://www.champaignschools.org/page/accelerated-placement' },
      { label: 'Unit 4 — FOIA / Public Records page', url: 'https://www.champaignschools.org/page/foia-public-records' },
      { label: 'Unit 4 — Board Policy Committee', url: 'https://www.champaignschools.org/resources/committees/board_policy_committee' },
    ],
    asOf: '2026-08-04',
  },
  {
    id: 'ps-unit4-consent-decree',
    layer: 'history',
    cite: 'Johnson v. Board of Education (C.D. Ill.); consent decree 2002–2009',
    name: 'Unit 4’s documented equity history — the consent decree covered gifted access',
    gives: 'On the public record: a 1996 federal civil-rights complaint over unequal services for African-American students led to the Second Revised Consent Decree (signed January 29, 2002), which required Unit 4 to eliminate racial inequality in — among other areas — gifted and talented programs; the decree ended November 4, 2009; in 2019 the local ACLU and NAACP publicly documented that racial disparities had widened since. Court records and the district’s own monitoring reports are archived.',
    useIt: 'This is context, not accusation: when raising access-to-advanced-coursework concerns, the district’s OWN documented history shows this exact class of disparity was serious enough for federal oversight — which is why written criteria, seat data, and demographic participation data are reasonable, historically grounded asks.',
    sources: [
      { label: 'Johnson v. Board of Ed. records, 1991–2009 (U. of I. archives)', url: 'https://archon.library.illinois.edu/ihlc/index.php?p=collections/controlcard&id=972' },
      { label: 'Johnson v. Board of Ed., 188 F. Supp. 2d 944 (C.D. Ill. 2002)', url: 'https://law.justia.com/cases/federal/district-courts/FSupp2/188/944/2577035/' },
      { label: 'Illinois Public Media, 2019 — ACLU/NAACP on post-decree equity', url: 'https://will.illinois.edu/news/story/champaign-aclu-naacp-call-out-lack-of-progress-on-racial-equity-in-unit-4-schools' },
    ],
    asOf: '2026-08-04',
  },
];

export const POLICY_LAYERS = [
  { id: 'law', label: 'The law that binds them' },
  { id: 'district', label: 'Their own published procedures' },
  { id: 'history', label: 'Documented history' },
];

// --- The three evidence tiers -------------------------------------------------
export const EVIDENCE_TIERS = [
  {
    id: 'their-words',
    label: 'Their words',
    detail: 'What the institution itself said or wrote — kept verbatim, with the date and the speaker’s role. Quotable back to them.',
  },
  {
    id: 'our-witness',
    label: 'Our witness',
    detail: 'What the family observed, dated at the time it happened — honestly labeled as our own observation.',
  },
  {
    id: 'their-data',
    label: 'Their data',
    detail: 'Records the institution holds (rosters, seat counts, policies, communications). Name what exists precisely so a records request can fill it.',
  },
];

// --- Entry types --------------------------------------------------------------
export const ENTRY_TYPES = [
  { id: 'incident', label: 'Incident', detail: 'Something happened to the student — what, where, who was present.' },
  { id: 'communication', label: 'Communication', detail: 'An email, call, note, or message — theirs or ours.' },
  { id: 'meeting', label: 'Meeting', detail: 'A sit-down or call with staff — who attended, what was said, what was promised.' },
  { id: 'response', label: 'Their response', detail: 'The institution’s answer to a request — or the silence where an answer should be.' },
  { id: 'document', label: 'Document', detail: 'A record obtained — policy, roster, report card, records-request result.' },
  { id: 'outcome', label: 'Outcome', detail: 'A result — schedule changed, seat granted, request denied, issue resolved.' },
];

// --- Case status --------------------------------------------------------------
export const CASE_STATUSES = [
  { id: 'documenting', label: 'Documenting', detail: 'Building the record as things happen.' },
  { id: 'asking', label: 'Asking for help', detail: 'The request has been made; responses are being logged.' },
  { id: 'escalating', label: 'Escalating', detail: 'Moving up the ladder with the record in hand.' },
  { id: 'resolved', label: 'Resolved', detail: 'The ask was met — the outcome is logged.' },
  { id: 'unresolved', label: 'Closed unresolved', detail: 'Paused without resolution — the record stands ready to reopen.' },
];

// --- The escalation ladder (the path the family actually walked, generalized) --
export const ESCALATION_LADDER = [
  { id: 'direct', label: 'Direct conversation', who: 'Teacher / direct staff', tip: 'Start where the issue lives. Log the date and what was said — most issues resolve here, and the log proves you started here.' },
  { id: 'counselor', label: 'Counselor / coordinator', who: 'The gatekeeper of schedules and seats', tip: 'Put requests in writing. If told "no seats," ask how many seats exist and how they are filled — that is their data.' },
  { id: 'principal', label: 'Building leadership', who: 'Principal / assistant principal', tip: 'Bring the dated record so far. Ask for the decision and its basis in writing.' },
  { id: 'district', label: 'District administration', who: 'Directors, family liaisons, superintendent’s office', tip: 'Forward the thread — their own words carry the case. Name what you asked, when, and what came back.' },
  { id: 'records', label: 'Public records request', who: 'The records officer (FOIA / state equivalent)', tip: 'Request the named data precisely: rosters, seat counts, enrollment criteria, communications about the decision.' },
  { id: 'board', label: 'Board / public comment', who: 'The elected board, on the record', tip: 'Three minutes, dated receipts, structural asks. Roles, not personal attacks — the record speaks.' },
];

// --- Factories ----------------------------------------------------------------
let seq = 0;
function freshId(prefix) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export function newCase(fields = {}) {
  return {
    id: fields.id || freshId('ac'),
    kind: 'case',
    caseSlug: fields.caseSlug || fields.id || freshId('ac'),
    title: (fields.title || '').trim(),
    student: (fields.student || '').trim(),
    institution: (fields.institution || '').trim(),
    ask: (fields.ask || '').trim(),
    status: CASE_STATUSES.some((s) => s.id === fields.status) ? fields.status : 'documenting',
    ladderStep: ESCALATION_LADDER.some((s) => s.id === fields.ladderStep) ? fields.ladderStep : 'direct',
    occurredAt: fields.occurredAt || null,
    createdAt: fields.createdAt || new Date().toISOString(),
  };
}

export function newEntry(caseSlug, fields = {}) {
  return {
    id: fields.id || freshId('ae'),
    kind: 'entry',
    caseSlug,
    entryType: ENTRY_TYPES.some((t) => t.id === fields.entryType) ? fields.entryType : 'incident',
    evidenceTier: EVIDENCE_TIERS.some((t) => t.id === fields.evidenceTier) ? fields.evidenceTier : 'our-witness',
    occurredAt: fields.occurredAt || new Date().toISOString().slice(0, 10),
    parties: (fields.parties || '').trim(),
    summary: (fields.summary || '').trim(),
    theirWords: (fields.theirWords || '').trim(),
    followUp: (fields.followUp || '').trim(),
    createdAt: fields.createdAt || new Date().toISOString(),
  };
}

// --- Transforms ----------------------------------------------------------------
export function casesOf(records) {
  return (records || []).filter((r) => r && r.kind === 'case');
}

export function entriesOf(records, caseSlug) {
  return (records || [])
    .filter((r) => r && r.kind === 'entry' && r.caseSlug === caseSlug)
    .sort((a, b) => String(a.occurredAt || '').localeCompare(String(b.occurredAt || '')));
}

export function caseStats(records, caseSlug) {
  const entries = entriesOf(records, caseSlug);
  const byTier = {};
  for (const t of EVIDENCE_TIERS) byTier[t.id] = 0;
  for (const e of entries) if (byTier[e.evidenceTier] != null) byTier[e.evidenceTier] += 1;
  const dates = entries.map((e) => e.occurredAt).filter(Boolean).sort();
  return {
    total: entries.length,
    byTier,
    first: dates[0] || null,
    last: dates[dates.length - 1] || null,
  };
}

export function ladderIndex(stepId) {
  const i = ESCALATION_LADDER.findIndex((s) => s.id === stepId);
  return i === -1 ? 0 : i;
}

// --- The context pack — the "when they ask for help" deliverable ---------------
// Assembles one case's real records into a dated, tiered, paste-ready narrative:
// the header names the student, institution, ask, and span; the timeline lists
// every entry in order with its tier label; their-words quotes are marked as
// verbatim; the evidence summary counts what the record holds and names the
// their-data gaps a records request can fill. Nothing in the pack is generated
// prose ABOUT the case — every line traces to a real entry (DR-0076).
export function buildContextPack(caseRecord, records) {
  if (!caseRecord) return '';
  const entries = entriesOf(records, caseRecord.caseSlug);
  const stats = caseStats(records, caseRecord.caseSlug);
  const tierLabel = (id) => (EVIDENCE_TIERS.find((t) => t.id === id) || {}).label || id;
  const typeLabel = (id) => (ENTRY_TYPES.find((t) => t.id === id) || {}).label || id;
  const statusLabel = (id) => (CASE_STATUSES.find((s) => s.id === id) || {}).label || id;
  const step = ESCALATION_LADDER[ladderIndex(caseRecord.ladderStep)];

  const lines = [];
  lines.push(`CASE FILE: ${caseRecord.title || '(untitled)'}`);
  if (caseRecord.student) lines.push(`Student: ${caseRecord.student}`);
  if (caseRecord.institution) lines.push(`Institution: ${caseRecord.institution}`);
  lines.push(`Status: ${statusLabel(caseRecord.status)} — current step: ${step.label} (${step.who})`);
  if (caseRecord.ask) lines.push(`The ask: ${caseRecord.ask}`);
  if (stats.first) {
    lines.push(`Documented span: ${stats.first} to ${stats.last} (${stats.total} dated ${stats.total === 1 ? 'entry' : 'entries'})`);
  }
  lines.push('');
  lines.push('DATED RECORD (in order):');
  if (!entries.length) {
    lines.push('  (no entries yet — the record starts with the first dated entry)');
  }
  for (const e of entries) {
    lines.push(`  ${e.occurredAt} — [${typeLabel(e.entryType)} / ${tierLabel(e.evidenceTier)}]${e.parties ? ` ${e.parties}:` : ''}`);
    if (e.summary) lines.push(`    ${e.summary}`);
    if (e.theirWords) lines.push(`    Their words, verbatim: "${e.theirWords}"`);
    if (e.followUp) lines.push(`    Follow-up: ${e.followUp}`);
  }
  lines.push('');
  lines.push('EVIDENCE ON HAND:');
  for (const t of EVIDENCE_TIERS) {
    lines.push(`  ${t.label}: ${stats.byTier[t.id]} ${stats.byTier[t.id] === 1 ? 'entry' : 'entries'}`);
  }
  if (!stats.byTier['their-data']) {
    lines.push('  Gap: no institution-held records logged yet — a public records request can fill this (name rosters, seat counts, criteria, and communications precisely).');
  }
  return lines.join('\n');
}

// --- Device-local persistence (local-first; sync is the courier) ---------------
function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch { return null; }
}

const KEY = 'poetech-advocacy-v1';

export function loadAdvocacy() {
  const ls = safeStorage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveAdvocacy(records) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(KEY, JSON.stringify(Array.isArray(records) ? records : []));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}
