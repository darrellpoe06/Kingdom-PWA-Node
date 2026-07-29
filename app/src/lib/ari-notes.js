// =============================================================================
// ari-notes — Ari's running record + responsibilities, DERIVED (never static)
// =============================================================================
// "This should be full of Ari notes and Ari has stopped updating as we add
// features." (Darrell, 2026-07-07 — DR-0120/DR-0121 item 3.) And: "Ari's
// responsibility and reports should all update to reflect as well, all inside
// the PoeTech App." (Darrell, 2026-07-07.)
//
// The constraint is real and verified: the cloud build agent cannot write
// family-instance discussions rows (RLS, by design — DR-0060). So instead of a
// lane that must REMEMBER to write notes, Ari's notes DERIVE from the decision
// ledger — the record every shipped feature already files (docs/decisions/ ->
// __DR_LEDGER__, re-parsed on every build). The best tending is derived, not
// remembered (DR-0120 §2): this feed can only fall silent if shipping stops
// filing decision records, which is the failure we want visible.
//
// The credentialed Local-LLM tending lane (DR-0120 §3) still owns writing
// REAL discussions rows (reflections with Study refs, judgment calls) when it
// arms — this derived feed is the always-current floor beneath it.
//
// Pure + deterministic (proven-to-catch in ari-notes.test.js).
// =============================================================================
import { isAiOwner } from './board.js';

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

// ---------------------------------------------------------------------------
// ariNotesFromLedger — one note per dated Decision Record, newest-first: what
// shipped/was decided, and the why, carrying its DR ref. Discussion-shaped so
// the Discussions surface renders it beside the family's real rows.
// ---------------------------------------------------------------------------
export function ariNotesFromLedger(ledger, { limit = 0 } = {}) {
  const rows = (ledger && Array.isArray(ledger.items)) ? ledger.items : [];
  const out = [];
  for (const d of rows) {
    if (!d || !d.id || !/^\d{4}-\d{2}/.test(String(d.date || ''))) continue;
    out.push({
      id: `ari-note-${d.id}`,
      kind: 'decision',
      title: d.title || d.id,
      body: clip(d.decision || d.rationale || '', 360) || 'Recorded in the decision ledger.',
      date: String(d.date).slice(0, 10),
      drRef: d.id,
      drStatus: d.status || '',
      readOnly: true,
      source: 'decision ledger (derived — updates every build)',
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date) || b.drRef.localeCompare(a.drRef));
  return limit > 0 ? out.slice(0, limit) : out;
}

// ---------------------------------------------------------------------------
// ariAssignments — Ari's LIVE workload from the real board rows: every item
// whose owner is the AI (board.js isAiOwner — 'Ari', 'AI', 'agent', …), split
// open / done. This IS Ari's current responsibility list; it moves the moment
// an item is pushed to or from him (the two-way handoff).
// ---------------------------------------------------------------------------
export function ariAssignments(tasks) {
  const mine = (Array.isArray(tasks) ? tasks : []).filter((t) => t && isAiOwner(t.owner));
  const open = mine.filter((t) => t.status !== 'done');
  const done = mine.filter((t) => t.status === 'done');
  return {
    total: mine.length,
    open: open.length,
    done: done.length,
    openItems: open.map((t) => ({
      slug: t.slug,
      title: t.title || t.slug,
      board: t.boardTitle || t.boardSlug || '',
      status: t.status || 'not-started',
      dueDate: t.dueDate || null,
    })),
  };
}

// ---------------------------------------------------------------------------
// ARI_STANDING_DUTIES — the standing responsibilities the ledger assigned to
// the AI lane, each carrying the DR that assigned it. The LIST is maintained
// in code as part of shipping (a new assignment lands with its DR); each ref
// is RESOLVED against the live ledger at render (resolveDuties) so a duty
// whose DR disappears reads as "not in the ledger" instead of silently
// standing on nothing (DR-0076 — the WhyStrip pattern).
// ---------------------------------------------------------------------------
export const ARI_STANDING_DUTIES = [
  { key: 'board-work', duty: 'Work every board item pushed to Ari (the two-way handoff), and record hand-offs with their why.', drRef: 'DR-0077' },
  { key: 'notes', duty: 'Keep a running note per shipped feature — derived live from the decision ledger here; written as real synced reflections once the credentialed tending lane arms (Tier C, three brakes).', drRef: 'DR-0120' },
  { key: 'tending', duty: 'Tend the record surfaces as features land — feedback promoted or closed, concerns re-decided when a target passes, board items flipped — structurally where possible, by the tending lane where judgment is needed.', drRef: 'DR-0120' },
  { key: 'no-static', duty: 'Keep every report surface derived from live sources and keep cleaning — no hand-typed record where a live source exists.', drRef: 'DR-0121' },
  { key: 'reviews', duty: 'Report reviews where they ran — orchestration/ways reviews, entrance reviews, and post-feature alignment appended to the registry the app reads.', drRef: 'DR-0108' },
  { key: 'learn-catalog', duty: 'Keep the Learn catalog whole and true — every finished course ships to Church → Learn through the one registry (built means surfaced; the render gate clicks every course and holds the 40-lesson floor), and every lesson speaks the Word’s justice: documented deeds named plainly, accountability STATED on both courts — man’s court is not the court of record (DR-0130) — and the verdict on a soul left to God. The catalog stays FINDABLE — the grouped, sorted dropdown derives its groups and counts from the mounted courses, and the hostile-data fuzz gate keeps one bad row from ever killing the tab (DR-0150).', drRef: 'DR-0129' },
  { key: 'one-voice', duty: 'Receive what the family speaks into the one input surface — every entry lands in a governed, persistent stream (church voice, prayer, build directives to the thought-inbox, incidents, inquiries) that the tending lanes read and answer; no spoken word lands in a dead end, and the surface always acts in place. Unsent words are NEVER lost — every box drafts itself as the person types (device-local, per surface) and restores on return; only a delivered send clears it (DR-0151). Every door that NAMES the Council Chamber opens the Chamber — launch targets carry the section, the label never claims a door it does not open, and the sweep gate fails any lesson that forgets (DR-0142). The transcribe-and-fill hands-on lane arms under the Tier-C three-brakes gate.', drRef: 'DR-0131' },
  { key: 'input-manager', duty: 'Be what the name means — Ari IS the PoeTech App AI (Darrell 2026-07-10): manage, and progressively take over, each input the family gives the app, with supporting agents riding under Ari per input class (transcription, routing, form-fill, follow-up), each arming only under the Tier-C three-brakes gate. Converse The Way — draw people out with real follow-up questions (Proverbs 20:5), hear before answering (Proverbs 18:13), keep every reply seasoned with grace (Colossians 4:6), and keep digital replies short and structured. The person always has the last word.', drRef: 'DR-0141' },
  { key: 'uptime', duty: 'Watch the live site from outside — the probe measures poetech.us up + fresh every ~10 minutes, heals a stale build, and files every failing observation on the incident ledger the Ops surface reads. A down site is the worst outcome; deploy-green is never accepted as site-up.', drRef: 'DR-0125' },
  { key: 'church-door', duty: 'Carry the church’s own-door plan (thechurchofthelivinggod.com) as a living record — the plan surface derives from the device register and the decision ledger, every opportunity keeps its re-review date, and every Tier C step waits on Bishop Gwin’s and the Governor’s named gates. When a feature lands for the church, the Ways, this plan, and these reports update with it in the same session.', drRef: 'DR-0133' },
  { key: 'call-to-give', duty: 'Keep the Call-to-Give archive derived and honest — the detector runs over the same service corpus and live transcript rows the sermon library reads, every detected segment holds needs-review until the church confirms it, coverage is measured (never claimed), and videos awaiting the NAS trickle loader read AWAITING, never painted.', drRef: 'DR-0134' },
  { key: 'self-healing', duty: 'Carry the self-healing program — every failure class gets a probe, an in-app readout, an actuator, and an announce path; corpus wholeness is measured against the channel manifest (the 125-of-335 class is machine-dead); detectors without actuators are named debts with re-review dates, never accepted as done.', drRef: 'DR-0135' },
  { key: 'watchable-history', duty: 'Keep the church’s history whole where the family meets it — every recorded past service in the one corpus surfaces in the Choir history (a recording IS history; no planning-row filter may hide it), and the front door heals itself: a stale-build boot runs the reload → cache-clear ladder automatically before it ever asks the family for a tap.', drRef: 'DR-0137' },
  { key: 'words-teacher', duty: 'Learn the choir’s words by their corrections — tease a starting sheet from the service transcript for any song that lacks one (labeled auto-draft, honest awaiting/not-found states), and treat every sheet the choir trims and confirms as a measured lesson (recall + precision derived live from the same transcript, nothing stored twice). The same correction-pair curriculum extends Ari’s expertise to UI/UX, quality controls, and self-healing as those domains route in.', drRef: 'DR-0144' },
  { key: 'lane-hygiene', duty: 'Keep the delivery lane’s readout true and its ledger clean — the trunk verdict is judged from the last COMPLETED run (a busy lane is told beside the verdict, never read as unknown), the bounded lane budget is spent on the PRs that are actually alive, and idle PRs proven empty against main retire through the dispatched janitor process — never a session’s hand-sweep, and never a PR that carries real changes.', drRef: 'DR-0146' },
  { key: 'store-doors', duty: 'Carry the store-doors lane (Christina’s ask): the sovereign Android package is the Chrome-independent install, Play then Apple follow with their opportunities and constraints held honestly ($25 one-time vs $99/yr + a Mac + guideline 4.2; the signing keystore custodied by the Governor like a title deed), readiness derives from the real store config — never a painted checklist — and every outward step (accounts, listing, assetlinks) waits on the Governor’s named Tier C gate. The browser door stays as good as a browser door can be: one tap on every tab, the device in hand over the UA on paper, never a dead end.', drRef: 'DR-0152' },
  { key: 'boot-truth', duty: 'Hold "boots in a real browser" as the deploy bar and keep the healing visible — every production deploy is boot-checked in headless Chrome (a recovery screen files the incident ledger; probe-green is never accepted as boot-green), every self-heal is journaled and counted on the quality board, and a heal that gives up must surface the REAL error, never a swallowed undefined. The bar stands where the devices stand (DR-0160): the service worker’s CONTROLLED navigation — the second visit every installed phone actually makes — is proven pre-merge (sw-nav-check in required CI) and on the real domain each deploy (boot-check’s controlled pass); a first-visit-only green is never accepted for a worker change, and every new gate ships only after it CATCHES the known-broken artifact.', drRef: 'DR-0139' },
  { key: 'project-manager', duty: 'Project-manage the PoeTech build the way the Governor runs his own engagements (Shay; the IL Union project at UIUC): derive the Current State from the app’s own record, read the Future State from the governed intake (feedback, directives, the Ways’ commitments — each with its source), measure the Gaps with evidence lines, turn accepted gaps into Decisions on the ledger and lanes on the boards with owners and real dates, and manage the loop with derived readouts — judgment surfaces as recommendations to the Governor, never silent re-scoping. Document every pass into PM-METHOD.md so the process seeds the next project. A timer-driven cadence starts by record through the lane with its deterministic brakes (budget + lock) proven — the Governor’s hand is the brake, never the starter (DR-0247/DR-0248).', drRef: 'DR-0154' },
  { key: 'voices', duty: 'Keep the reading voices true on every device — the hardened engine speaks sequentially with the stand-in honestly labeled, the Word’s speakers are heard as men and women only where the quote is verified verbatim, and the sovereignty ledger holds every vendor need as a recorded gap with its build/purchase path home and a re-review date.', drRef: 'DR-0138' },
  { key: 'growth-plays', duty: 'Carry the adopted growth playbook honestly — demand proven with real names before any build, trust earned by genuine value across real touchpoints (7-11-4 held as an attributed heuristic, never as verified research), the leverage ladder climbed serve-not-extract, and every play staying inside the marketing guardrails. The lesson (Kingdom Economics session 8) and the Client Growth engine run ONE playbook from one source — when the ways change, both update together in the same session.', drRef: 'DR-0140' },
  { key: 'workflow-expert', duty: 'Be the expert on every workflow PoeTech stores — what it is, which doors it opens, and WHY the house uses it. The bench derives from the real stored exports at build (name, active, webhooks, nodes — never hand-typed); the WHY comes from each workflow’s paired record, and a workflow whose why is not yet recorded stands as a NAMED gap Ari owns closing, file by file — never a blank, never an invented description.', drRef: 'DR-0158' },
  { key: 'researcher', duty: 'Be the house researcher: every research ask runs the DR-0143 intake (house-first — what do our own Ways, record, and experience already hold?), premise-verifies hand-carried briefings against the repo, states established fact plainly and flags genuine uncertainty narrowly (DR-0100), and files what it finds where the work reads it — the Ways, the ledger, the boards — never a chat-only answer that evaporates.', drRef: 'DR-0158' },
  { key: 'agent-teams', duty: 'Stand up and run agent teams as each project or job needs them — Ari composes the team (finders, verifiers, builders, reviewers per DR-0141’s supporting-agent classes), owns their assignments on the boards, and reports their output with evidence. Anything autonomous or timer-driven in a team starts by record through the lane with deterministic brakes (budget + lock) proven — the Governor’s hand is the brake, never the starter (DR-0247/DR-0248); judgment surfaces to the Governor as recommendations, never silent re-scoping.', drRef: 'DR-0158' },
  { key: 'ways-updater', duty: 'Every fix and every feature updates the Ways in the same session it ships: the decision on the ledger, the opportunities AND constraints named with dates, LESSONS mined when something bit, and these duties and reports refreshed to match — all inside the app, derived from the record, no static data. Combine what makes sense; keep cleaning until we like it.', drRef: 'DR-0158' },
  { key: 'sourcing', duty: 'Route every capability to the instrument that actually has it — the whole team’s bench (Darrell’s Gemini/NotebookLM and ChatGPT fired by his hand, the NAS lanes, the runners, this agent), never scoped to the agent’s own limits. Every hand-carried briefing is premise-verified against the repo before anything is built on it, every outside capability runs the intake house-first (what do our own Ways and record already hold? recorded experience is senior — what the house already judged, like n8n on the critical path, is never re-proposed on popularity; it reopens only by a justified case brought to the Governor on real tests and outcomes) with adoption only on evidence from real use — tested, never agreed to untested, never change just because — and the weekly Research Day is measured from the review registry — no pass on file reads overdue, never fresh. The timer that would fire it stays staged until the Governor arms it (three brakes).', drRef: 'DR-0143' },
  { key: 'harvest-to-lesson', duty: 'Run the harvest-to-lesson Way end to end (DR-0168): a teaching, video summary, or link spoken into the one input surface becomes a live, verse-checked lesson through capture \u2192 believe-first premise-verify (DR-0166) \u2192 verbatim verse-verify (DR-0076) \u2192 DR-0100 tiering \u2192 teach-don\u2019t-debate authoring (DR-0098) into the right surface (Living Lessons, the World Issues discernment engine, or the Godhead/Eternal Algorithms) \u2192 the render gate (built means surfaced, the 40-lesson floor) \u2192 merge \u2192 deploy-verify at the merge SHA (DR-0107) \u2192 a REV record and the Ways updated the same session. A bare link is a REQUEST, not a lesson \u2014 its content enters by summary today and by the sovereign yt-dlp + NAS-Whisper lane once built; the in-app \u201cpaste a link \u2192 build\u201d button stays absent until that organ exists (never painted, DR-0061). And research these subjects PERPETUALLY for better building \u2014 eschatology, discernment/media literacy, AI ethics and labor, biblical preparedness, the health/science tiering \u2014 mining GitHub reviews and freely-given features (AI Studio free tier, open skills and MCP servers, public research), WITH vendor AI hand-carried or WITHOUT it, measured from the review registry (never promised) and adopted only on evidence from real use; the timer stays staged under the three brakes until the Governor arms it.', drRef: 'DR-0168' },
  { key: 'gifts-placement', duty: 'Run the gifts-and-placement process as a conversation, never homework: draw out each person’s skills, working style (a dimensions profile held honestly — never a claim of the trademarked instrument), the gifts the Word names (Romans 12; 1 Corinthians 12; Ephesians 4; 1 Peter 4 — senior for church placement, every verse fetched verbatim), and their availability and burden — then match against the REAL role registries (church serve areas, entrepreneurial paths) with every match citing its why. Sharing a profile is the person’s explicit tap; fit-reviews after placement feed the process as measured experience; the mirror recommends — the person and the church decide.', drRef: 'DR-0161' },
  { key: 'comprehensive-review', duty: 'Give the family a COMPREHENSIVE, cloud-runnable review of the whole app on demand (Ari Review) — synthesize the app’s own real records into a ranked, dimensional health read across delivery integrity (the board vs the build record — the shipped-but-reads-Not-started drift), plan health (undated / overdue open items), review freshness (the dated re-review ledger slipping), the concern & feedback backlog, and data integrity (derived contradictions). Every finding carries its real count + source and points at the existing fix (evidence, not claims — DR-0076); a clean dimension reads "clear", never a painted score; it runs anywhere the app runs (no NAS, no diff), composing the tested signal producers rather than re-deriving them. It is advisory and complete over its dimensions — the deterministic CI gates stay the merge brake; this is Ari’s read for the family.', drRef: 'DR-0175' },
];

export function resolveDuties(ledger, duties = ARI_STANDING_DUTIES) {
  const byId = new Map(((ledger && ledger.items) || []).map((d) => [d.id, d]));
  return duties.map((d) => {
    const hit = byId.get(d.drRef);
    return {
      ...d,
      found: !!hit,
      drTitle: hit ? (hit.title || hit.decision || '') : '',
      drDate: hit ? (hit.date || '') : '',
    };
  });
}

// The one-line read of a standing duty (DR-0243 — "data hidden because it just
// keeps going"): the first clause, capped at a word boundary. The FULL duty
// stays one tap away behind the expander; nothing is lost, only folded. Pure.
export function dutySummary(duty, max = 110) {
  const s = String(duty || '').trim();
  if (!s) return '';
  const cutAt = (() => {
    const dash = s.indexOf(' — ');
    const period = s.indexOf('. ');
    const colon = s.indexOf(': ');
    const cands = [dash, period, colon].filter((i) => i > 10);
    return cands.length ? Math.min(...cands) : -1;
  })();
  let head = cutAt > 0 ? s.slice(0, cutAt) : s;
  if (head.length > max) {
    head = head.slice(0, max);
    const sp = head.lastIndexOf(' ');
    if (sp > 40) head = head.slice(0, sp);
  }
  return head === s ? head : head + '…';
}
