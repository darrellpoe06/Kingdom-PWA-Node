// =============================================================================
// one-voice-routing — ONE router under every input surface
// =============================================================================
// Darrell 2026-06-11: "There will be a tell PoeTech or church pastors or 1099
// workers or counseling or therapy — all options are in notes or the pipeline
// information somewhere in the system. Same system under the hood, just
// starting on the page of Note... church expects spiritual-module sources,
// however if they start talking about development and the PoeTech pipeline,
// program processes and procedures begin."
//
// This is MODE-ROUTING.md made concrete: a single classifier shared by every
// input surface (Thinking Space, Church One Voice, and whatever comes next).
// The SURFACE sets the default expectation (Notes starts private; Church
// starts spiritual); the WORDS can pull the route anywhere in the system —
// and per MODE-ROUTING the suggestion is always VISIBLE and the person
// always has the last word. Nothing routes invisibly; nothing auto-acts.
//
// Destinations and the real pipeline each lands in:
//   private    -> your diary (device-local, sovereign)
//   poetech    -> the build inbox (appDirectives -> Build board / wf26 lane)
//   prayer     -> the church prayer list
//   pastor     -> the pastoral inbox (churchVoice kind:'pastor' — a note the
//                 pastors see; pastoral, NOT clinical)
//   conference -> the Assembly feedback line (church surface)
//   serve      -> serving-hands note for leadership
//   work       -> a work order on the Action Queue (the 1099 dispatch loop)
//   counseling -> a Practice inquiry (the TLC intake lane — contact-level
//                 only; per the bright line, clinical content lives with the
//                 clinician, never in app notes)

export const DESTINATIONS = [
  { key: 'private',    label: '📓 Private',    hint: 'stays yours alone — your diary' },
  { key: 'poetech',    label: '💡 PoeTech',    hint: 'a build directive — shapes what gets built' },
  { key: 'prayer',     label: '🙏 Prayer',     hint: 'goes to the church prayer list' },
  { key: 'pastor',     label: '⛪ Pastor',     hint: 'a note the pastors see' },
  { key: 'conference', label: '🎪 Conference', hint: 'the Assembly feedback line' },
  { key: 'serve',      label: '🤝 Serve',      hint: 'tells leadership you want to help' },
  { key: 'work',       label: '🛠 Work',       hint: 'becomes a work order on the Action Queue' },
  { key: 'counseling', label: '💚 Counseling', hint: 'a private intake note to the practice' },
];

const RULES = [
  // Order matters: more specific intents first.
  { key: 'counseling', re: /\b(counsel|counseling|therapy|therapist|anxiety|depress|grief support|marriage counsel|session with|mental health)\b/i },
  { key: 'work',       re: /\b(fix(ed|ing)?|broken|leak(s|ed|ing)?|repair(s|ed|ing)?|furnace|plumb(ing|er)?|roof|electric(al|ian)?|contractor|work order|maintenance|handyman|paint(ing)?|install(ed|ing|ation)?)\b/i },
  { key: 'poetech',    re: /\b(app|build|feature|pipeline|develop|development|software|bug|screen|button|module|poetech|program process|procedure)\b/i },
  { key: 'conference', re: /\b(conference|assembly|register|rsvp|hotel|program book|session schedule)\b/i },
  { key: 'serve',      re: /\b(serve|volunteer|usher|hospitality|sign me up|kitchen|media team|help with)\b/i },
  { key: 'prayer',     re: /\b(pray|prayer|intercede|heal(ing)?|comfort|salvation|grie(f|ving))\b/i },
  { key: 'pastor',     re: /\b(pastor|bishop|shepherd|sermon|scripture question|bible question|word from)\b/i },
];

// Suggests a destination for the text. `surfaceDefault` is the entry page's
// expectation (Notes: 'private', Church: 'prayer') — used only when the
// words don't clearly pull elsewhere. The same words route the same way on
// every surface: that is the "same system under the hood."
export function suggestDestination(text, surfaceDefault = 'private') {
  const t = (text || '').trim();
  if (!t) return surfaceDefault;
  for (const rule of RULES) {
    if (rule.re.test(t)) return rule.key;
  }
  return surfaceDefault;
}

export function destinationsFor(surface) {
  // Conference belongs to church-context surfaces; everything else is
  // everywhere ("all options are in notes").
  if (surface === 'church') return DESTINATIONS.filter(d => d.key !== 'private');
  return DESTINATIONS.filter(d => d.key !== 'conference');
}
