// =============================================================================
// intake-outcomes — every door a person speaks into, and what comes BACK to
// them, declared per audience (DR-0629: connected is not the same as answered)
// =============================================================================
// Darrell, 2026-09-24, on the Speak box's Lesson chip: a member spoke their
// situation, was told "Heard as a lesson", and got nothing back. The flow graph
// (DR-0622) passed it, because the connection EXISTED: agent_inbox → the
// lesson reader → the class. It never asked WHO gets an answer. The reader
// captures only the Governor's rows (DR-0608 / DR-0312); a member's row is
// counted and never answered. "This is why we check end to end right away."
//
// So every intake door declares, for each audience — the Governor, a signed-in
// member, and someone signed out — the OUTCOME that returns to the sender and
// WHERE they see it, with the file + token that prove the return path exists:
//   answer  — someone acts on it and the sender reads the result;
//   receipt — it lands where its reader reads it, and the sender sees it there;
//   kept    — it is the sender's own (a private note), kept where they see it;
//   refused — it cannot reach anyone for this audience, and the screen SAYS so;
//   none    — it reaches no one and the sender is not told: the failure.
// A declared `open` exception is allowed only for a genuine blocker — an
// undecided bright line, a value only Darrell holds, a physical step — with a
// re-review date. "Being built" is not a blocker: that door fails until the
// real answer lands (app/src/__tests__/answered-for-every-audience.test.js).
// =============================================================================

export const AUDIENCES = Object.freeze(['governor', 'member', 'signed-out']);
export const PASSING = new Set(['answer', 'receipt', 'kept', 'refused']);
export const BLOCKERS = new Set(['bright-line', 'his-value', 'physical']);

const FEEDBACK_RECEIPT = { file: 'app/src/components/FeedbackCenter.jsx', token: 'receiptStatus(f, myFeedback)' };
const SIGNED_OUT_SAID = { file: 'app/src/components/OneVoiceInput.jsx', token: 'cfg.confirmations.signedOut || SIGNED_OUT_SAID' };

// One entry per door. `route` doors are OneVoiceInput chips (walked through
// planDispatch); `door` entries are the other intake surfaces.
export const INTAKE_DOORS = Object.freeze([
  {
    id: 'private', route: 'private', name: 'Private note',
    outcomes: {
      governor: { kind: 'kept', where: 'Your thoughts, on this device', proof: { file: 'app/src/components/ThinkingSpace.jsx', token: 'Your thoughts' } },
      member: { kind: 'kept', where: 'Your thoughts, on this device', proof: { file: 'app/src/components/ThinkingSpace.jsx', token: 'Your thoughts' } },
      'signed-out': { kind: 'kept', where: 'Your thoughts, on this device', proof: { file: 'app/src/components/ThinkingSpace.jsx', token: 'Your thoughts' } },
    },
  },
  {
    id: 'lesson', route: 'lesson', name: 'Lesson',
    outcomes: {
      governor: { kind: 'answer', where: 'the lesson, written into the class (the armed reader and the Gmail Way, DR-0610 / DR-0312)', proof: { file: 'app/src/lib/sovereign-ai-class.js', token: 'Gmail-lesson-intake Way' } },
      // THE GAP THIS GATE WAS BUILT FOR, CLOSED BY THE REAL ANSWER (DR-0629):
      // at once, the lessons already written from the Word for their words
      // (DR-0630); then the Governor's approve-or-decline, said on their own
      // row with his reason (DR-0635).
      member: { kind: 'answer', where: 'at once, three lessons from the Word matched to their words under the Lesson chip; then, on their own row in the Lesson inbox, Approved or Not written with the Governor’s reason', proof: { file: 'app/src/components/OneVoiceInput.jsx', token: '<LessonsForSituation words={lessonWords} />' }, via: { file: 'app/src/components/LessonInbox.jsx', token: 'data-testid="lesson-review"' } },
      // Signed out, nothing is relayed (the box says so), but the matched
      // lessons are shown all the same.
      'signed-out': { kind: 'answer', where: 'the lessons from the Word matched to their words, shown under the Lesson chip; the box says the words were not sent', proof: { file: 'app/src/components/OneVoiceInput.jsx', token: '<LessonsForSituation words={lessonWords} />' }, via: { file: 'app/src/lib/one-voice-surfaces.js', token: 'lessonFailed' } },
    },
  },
  {
    id: 'poetech', route: 'poetech', name: 'PoeTech request',
    outcomes: {
      governor: { kind: 'answer', where: 'the steward’s Feedback queue; its status under Your feedback, marked Fixed by the change that ships it', proof: FEEDBACK_RECEIPT, via: { file: 'app/src/lib/poetech-request.js', token: 'uploadFeedback' } },
      member: { kind: 'answer', where: 'the steward’s Feedback queue; its status under Your feedback, marked Fixed by the change that ships it', proof: FEEDBACK_RECEIPT, via: { file: 'app/src/lib/poetech-request.js', token: 'uploadFeedback' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'conference', route: 'conference', name: 'Conference (the Assembly feedback line)',
    outcomes: {
      governor: { kind: 'answer', where: 'the steward’s Feedback queue; its status under Your feedback', proof: FEEDBACK_RECEIPT, via: { file: 'app/src/components/OneVoiceInput.jsx', token: "currentView: 'Conference · One Voice'" } },
      member: { kind: 'answer', where: 'the steward’s Feedback queue; its status under Your feedback', proof: FEEDBACK_RECEIPT, via: { file: 'app/src/components/OneVoiceInput.jsx', token: "currentView: 'Conference · One Voice'" } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'prayer', route: 'prayer', name: 'Prayer',
    outcomes: {
      governor: { kind: 'receipt', where: 'the prayer list on the Church tab, where the family prays and marks it sent', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'markPrayerRequestSent' } },
      member: { kind: 'receipt', where: 'the prayer list on the Church tab, where the church prays and marks it sent', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'markPrayerRequestSent' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'pastor', route: 'pastor', name: 'A note to the pastors',
    outcomes: {
      governor: { kind: 'receipt', where: 'the church voice list the pastors read on the Church tab, and the box’s recent list', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'churchVoice' } },
      member: { kind: 'receipt', where: 'the church voice list the pastors read on the Church tab, and the box’s recent list', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'churchVoice' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'serve', route: 'serve', name: 'Serve',
    outcomes: {
      governor: { kind: 'receipt', where: 'the church voice list leadership reads, and the box’s recent list', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'churchVoice' } },
      member: { kind: 'receipt', where: 'the church voice list leadership reads, and the box’s recent list', proof: { file: 'app/src/components/ChurchHome.jsx', token: 'churchVoice' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'work', route: 'work', name: 'Work order',
    outcomes: {
      governor: { kind: 'receipt', where: 'the Action Queue, where it dispatches to a worker', proof: { file: 'app/src/components/BigPictureDashboard.jsx', token: 'Action Queue' } },
      member: { kind: 'receipt', where: 'the Action Queue of their instance, where it dispatches to a worker', proof: { file: 'app/src/components/BigPictureDashboard.jsx', token: 'Action Queue' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'counseling', route: 'counseling', name: 'Counseling',
    outcomes: {
      // Measured 2026-09-24: the inquiry is filed in the SENDER's own instance
      // (lib/inquiries-sync.js: instance_id = the caller's), while the TLC
      // practice runs in its own instance (DR-0193), so the practice never
      // sees it — and it carries no way back (phone and email empty by the
      // TLC bright line). Carrying a member's name and a way to reach them
      // into the practice's instance is a new privacy line (a person's
      // request for counseling leaving their instance): Darrell's to decide.
      governor: { kind: 'none', where: 'the inquiry lands in the sender’s own instance; the practice’s instance never sees it', proof: { file: 'app/src/lib/inquiries-sync.js', token: 'instance_id:        tenantId' },
        open: { blocker: 'bright-line', why: 'whether a counseling request, with a way to reach the person, may cross into the TLC practice’s own instance — a privacy line only Darrell decides', reReview: '2026-10-01' } },
      member: { kind: 'none', where: 'the inquiry lands in the sender’s own instance; the practice’s instance never sees it', proof: { file: 'app/src/lib/inquiries-sync.js', token: 'instance_id:        tenantId' },
        open: { blocker: 'bright-line', why: 'whether a counseling request, with a way to reach the person, may cross into the TLC practice’s own instance — a privacy line only Darrell decides', reReview: '2026-10-01' } },
      'signed-out': { kind: 'refused', where: '"Kept on this device only — you are signed out", in the box', proof: SIGNED_OUT_SAID },
    },
  },
  {
    id: 'feedback', door: 'feedback', name: 'Feedback (any screen)',
    outcomes: {
      governor: { kind: 'answer', where: 'the reference code at once, then its status under Your feedback — being worked on, fixed, or declined with the reason', proof: FEEDBACK_RECEIPT },
      member: { kind: 'answer', where: 'the reference code at once, then its status under Your feedback — being worked on, fixed, or declined with the reason', proof: FEEDBACK_RECEIPT },
      'signed-out': { kind: 'refused', where: '"Kept on this device only" on the receipt', proof: { file: 'app/src/components/FeedbackCenter.jsx', token: 'SIGNED_OUT_RECEIPT' } },
    },
  },
  {
    id: 'notes-recorder', door: 'notes-recorder', name: 'Record a conversation (Notes)',
    outcomes: {
      governor: { kind: 'answer', where: 'the words Whisper wrote, back inside the note', proof: { file: 'app/src/components/ConversationRecorder.jsx', token: 'words come back into the note' } },
      member: { kind: 'answer', where: 'the words Whisper wrote, back inside the note', proof: { file: 'app/src/components/ConversationRecorder.jsx', token: 'words come back into the note' } },
      'signed-out': { kind: 'refused', where: '"you are signed out", on the recorder', proof: { file: 'app/src/components/ConversationRecorder.jsx', token: "'you are signed out'" } },
    },
  },
]);

/** Which OneVoiceInput handlers a surface passes (mirrors the real mounts). */
export const SURFACE_HANDLERS = Object.freeze({
  // ThinkingSpace.jsx → OneVoiceInput: addNote, sendToPoeTech, addPrayerRequest,
  // addChurchVoice, addIncident, addInquiry (no updateConference).
  notes: { poetech: true, prayer: true, churchVoice: true, conference: false, incident: true, inquiry: true, note: true, lesson: true },
  // ChurchOneVoice.jsx → OneVoiceInput: every handler but addNote.
  church: { poetech: true, prayer: true, churchVoice: true, conference: true, incident: true, inquiry: true, note: false, lesson: true },
});

/**
 * Walk one door as one audience: the route the chip really takes (through
 * planDispatch), the declared outcome for that audience, and whether it
 * passes. `fileText(path)` proves the declared return path is in the code.
 */
export function judge(door, audience, fileText) {
  const o = door.outcomes && door.outcomes[audience];
  if (!o) return { ok: false, why: `${door.id}: no outcome declared for ${audience}` };
  for (const p of [o.proof, o.via].filter(Boolean)) {
    const t = fileText(p.file);
    if (t == null) return { ok: false, why: `${door.id}/${audience}: ${p.file} does not exist (the declared return path is not in the code)` };
    if (!t.includes(p.token)) return { ok: false, why: `${door.id}/${audience}: "${p.token}" is not in ${p.file} (the declared return path is not in the code)` };
  }
  if (PASSING.has(o.kind)) return { ok: true, why: '' };
  if (o.kind === 'none' && o.open && BLOCKERS.has(o.open.blocker) && /^\d{4}-\d{2}-\d{2}$/.test(String(o.open.reReview || '')) && String(o.open.why || '').trim()) {
    return { ok: true, open: true, why: `${door.id}/${audience}: no answer yet — ${o.open.blocker}: ${o.open.why} (re-review ${o.open.reReview})` };
  }
  return { ok: false, why: `${door.id}/${audience}: the sender gets nothing back (${o.where})` };
}
