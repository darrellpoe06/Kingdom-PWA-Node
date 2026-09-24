// =============================================================================
// system-flow-registry — the declared whole-system flow graph (DR-0622)
// =============================================================================
// Every workflow, NAS rider and app surface that moves data declares:
//   reads  — the resources it reads, each with the file + token that PROVE the
//            read is in the code (the gate greps for it; default token = the
//            table name, default file = the node's own file);
//   writes — the resources it writes, proven the same way;
//   seeds  — the node(s) its output feeds next (each must share a resource).
//
// Resources:
//   db:<table>[#facet]   a table on the live database (facet = a slice of it,
//                        measured with its own WHERE);
//   gh:<thing>           GitHub state (a PR, a check, main, an incident issue,
//                        a release) — the lane and the witnesses;
//   gh:run:<file>        a workflow's run result — added for EVERY workflow
//                        node automatically; read by the flow proof, which
//                        turns each run into a live row the app and the
//                        decision board read (the monitors join the loop);
//   site:, http:, nas:, file:, code:, event:, mail:, yt:, hosted:  the other
//                        carriers the system really uses, named plainly.
//
// A resource written and read by no one else is a DEAD END; read and written
// by no one is an ORPHAN. Either fails the build unless it is declared a
// `sink` / `source` with the reason (a person reads it; the outside world
// writes it). A gap being fixed carries `open: { blocker, reReview }`.
// Built from the real code (grep of .from('<table>'), remoteTable, rpc, the
// NAS jobs' /rest/v1 paths, and each workflow's own steps), 2026-09-24.
// =============================================================================

// A workflow node: its own file is the anchor; its run result is added below.
const wf = (file, o) => ({ kind: 'workflow', workflow: file, file: `.github/workflows/${file}`, ...o });
const rider = (ref, file, o) => ({ kind: 'nas', rider: ref, file, ...o });
const app = (file, o) => ({ kind: 'surface', file, ...o });

const NODES = [
  // ===========================================================================
  // 1. FEEDBACK AND TRIAGE — the loop the sender sees close
  // ===========================================================================
  app('app/src/lib/feedback-sync.js', {
    id: 'feedback-door', name: 'Feedback door (any screen)',
    purpose: 'A person says what is wrong or wanted, from any screen.',
    writes: [{ res: 'db:feedback', token: "from('feedback').insert" }],
    reads: [
      { res: 'event:use-prompt', file: 'app/src/components/OneVoiceInput.jsx', token: 'USE_PROMPT_EVENT' },
      // The sender's own notes come back with the steward's answer on them.
      { res: 'db:feedback#triaged', token: "'triage_status'" },
    ],
    seeds: ['feedback-queue', 'concerns-board', 'decision-board'],
  }),
  app('app/src/components/FeedbackCenter.jsx', {
    id: 'feedback-queue', name: 'Feedback queue (steward triage)',
    purpose: 'A steward works each note: promote it to work, mark it being worked on or fixed, or answer it with the reason.',
    reads: [{ res: 'db:feedback', file: 'app/src/lib/feedback-sync.js', token: 'FEEDBACK_LIST_COLUMNS' }],
    writes: [
      { res: 'db:feedback#triaged', file: 'app/src/lib/feedback-loop.js', token: "from('feedback').update" },
      { res: 'db:projects', token: 'addProject' },
      { res: 'db:incidents', token: 'addIncident' },
    ],
    seeds: ['feedback-receipt', 'projects', 'itsm-incidents'],
  }),
  wf('feedback-fixed.yml', {
    id: 'feedback-fixed', name: 'The shipped fix marks its note Fixed',
    purpose: 'Once a change that names a note (its board reference or its id) is on the deployed build, the note reads Fixed and says which change fixed it.',
    reads: [
      { res: 'db:feedback', token: 'FROM public.feedback' },
      { res: 'gh:run:deploy-cloudflare-pages.yml', token: 'deploy-cloudflare-pages.yml/runs' },
    ],
    writes: [{ res: 'db:feedback#triaged', file: 'scripts/feedback-fixed.mjs', token: "SET triage_status = 'fixed'" }],
    seeds: ['feedback-receipt', 'feedback-door'],
  }),
  app('app/src/lib/feedback-receipt.js', {
    id: 'feedback-receipt', name: "Sender's receipt",
    purpose: 'The sender reads where their note stands — received, being worked on, fixed, or declined with the reason.',
    reads: [{ res: 'db:feedback#triaged', file: 'app/src/components/FeedbackCenter.jsx', token: 'receiptStatus(f, myFeedback)' }],
    seeds: [],
  }),
  app('app/src/components/ConcernsBoard.jsx', {
    id: 'concerns-board', name: 'Concerns & Solutions board',
    purpose: 'Every concern with its solution, owner and date — feedback lands here on its own.',
    reads: [
      { res: 'db:feedback', file: 'app/src/lib/concerns.js', token: 'feedbackToConcernCards' },
      { res: 'db:concerns', file: 'app/src/lib/concerns-sync.js' },
      { res: 'file:audit-findings', file: 'app/src/lib/concerns.js', token: 'audit-findings' },
    ],
    writes: [{ res: 'db:concerns', file: 'app/src/lib/concerns-sync.js' }],
    seeds: ['decision-board'],
  }),
  app('app/src/lib/projects-sync.js', {
    id: 'projects', name: 'Projects',
    purpose: 'The work a note or a decision became.',
    reads: [{ res: 'db:projects' }],
    writes: [{ res: 'db:projects' }],
    seeds: ['decision-board'],
  }),
  app('app/src/lib/incidents-sync.js', {
    id: 'itsm-incidents', name: 'Incidents (service desk)',
    purpose: 'A reported fault with its due date and dispatch.',
    reads: [{ res: 'db:incidents' }],
    writes: [{ res: 'db:incidents' }],
    seeds: ['decision-board'],
  }),
  app('app/src/lib/use-board-tasks.js', {
    id: 'board-tasks', name: 'Project boards (tasks)',
    purpose: 'Each item of work on a board; closing one moves the board.',
    reads: [{ res: 'db:board_tasks', file: 'app/src/lib/board-tasks-sync.js' }],
    writes: [{ res: 'db:board_tasks', file: 'app/src/lib/board-tasks-sync.js' }],
    seeds: ['decision-board'],
  }),
  app('app/src/lib/discussions-sync.js', {
    id: 'discussions', name: 'Discussions and hand-offs',
    purpose: 'Who handed what to whom.',
    reads: [{ res: 'db:discussions' }],
    writes: [{ res: 'db:discussions' }],
    seeds: ['decision-board'],
  }),

  // ===========================================================================
  // 2. THE DECISION BOARD — reads everything above AND the flow proof
  // ===========================================================================
  app('app/src/components/DecisionIntelligence.jsx', {
    id: 'decision-board', name: 'Decision intelligence board',
    purpose: 'Risks, stalls, owners and decisions, derived from the live rows — and every broken or stale connection in this graph as an escalation.',
    reads: [
      { res: 'db:concerns', file: 'app/src/components/Projects.jsx', token: 'concerns={concerns}' },
      { res: 'db:projects', file: 'app/src/components/Projects.jsx', token: 'projects={projects}' },
      { res: 'db:discussions', file: 'app/src/components/Projects.jsx', token: 'discussions={discussions}' },
      { res: 'db:board_tasks', file: 'app/src/components/Projects.jsx', token: 'boardTasks={boardTasks}' },
      { res: 'db:feedback', file: 'app/src/components/Projects.jsx', token: 'feedback={feedback}' },
      { res: 'db:incidents', file: 'app/src/components/Projects.jsx', token: 'incidents={incidents}' },
      { res: 'db:decision_readouts', file: 'app/src/lib/decision-readouts.js' },
    ],
    writes: [{ res: 'db:decision_readouts', file: 'app/src/lib/decision-readouts.js' }],
    seeds: ['flow-proof'],
  }),
  app('app/src/components/OperationsIntelligence.jsx', {
    id: 'ops-board', name: 'PoeTech operations board',
    purpose: 'The platform’s own escalations: open incidents, due re-reviews, stale loops — and every broken, quiet or open connection of this graph.',
    reads: [
      { res: 'gh:incident', token: 'fetchSiteHealth' },
      { res: 'db:system_flow_proof', token: 'fetchFlowProof' },
    ],
    seeds: [],
  }),

  // ===========================================================================
  // 3. THE FLOW PROOF — every connection measured on the live database
  // ===========================================================================
  wf('system-flow-proof.yml', {
    id: 'flow-proof', name: 'System flow proof (every 6 hours)',
    purpose: 'Reads every connection’s live numbers and every workflow’s latest run, and writes them where the app and the decision board read them.',
    reads: [
      { res: 'db:decision_readouts', file: 'scripts/system-flow-registry.mjs', token: "'db:decision_readouts'" },
      { res: 'db:feedback', file: 'scripts/system-flow-registry.mjs', token: "'db:feedback'" },
    ],
    writes: [{ res: 'db:system_flow_proof', file: 'scripts/system-flow-graph.mjs' }],
    seeds: ['ops-board', 'flow-surface'],
  }),
  app('app/src/components/QualityProof.jsx', {
    id: 'flow-surface', name: 'Interconnect — the whole flow, with its live numbers',
    purpose: 'Every chain, every connection, its numbers and its age, said plainly.',
    reads: [{ res: 'db:system_flow_proof', file: 'app/src/lib/system-flow.js' }],
    seeds: [],
  }),

  // ===========================================================================
  // 4. OPERATIONS QUEUE — app → NAS ops-runner → app
  // ===========================================================================
  app('app/src/lib/ops-commands.js', {
    id: 'ops-queue', name: 'Operations queue (in the app)',
    purpose: 'A steward asks the NAS to do a whitelisted job and watches it finish.',
    writes: [{ res: 'db:ops_commands', token: "from('ops_commands').insert" }],
    reads: [{ res: 'db:ops_commands#finished', token: "from('ops_commands')" }],
    seeds: ['ops-runner'],
  }),
  rider('service:ops-runner', 'infra/nas-sme-pipeline/ops-runner.py', {
    id: 'ops-runner', name: 'NAS ops-runner',
    purpose: 'Drains the queue, runs the job, writes the outcome back to the row.',
    reads: [{ res: 'db:ops_commands', token: 'status=eq.queued' }],
    writes: [
      { res: 'db:ops_commands#finished', token: '"finished_at"' },
      { res: 'db:video_transcripts', token: 'load-transcripts.py' },
    ],
    seeds: ['ops-queue', 'sermon-reader'],
  }),
  wf('ops-queue-health.yml', {
    id: 'ops-queue-health', name: 'Ops-queue health witness',
    purpose: 'Proves from outside the NAS that the queue still drains.',
    reads: [{ res: 'db:ops_commands', token: 'ops_commands' }],
    writes: [{ res: 'gh:incident', token: 'label incident' }],
    seeds: ['ops-surface'],
  }),

  // ===========================================================================
  // 5. LESSON INTAKE — the Gmail door, the in-app door, voice → Whisper
  // ===========================================================================
  wf('lesson-mail-watch.yml', {
    id: 'lesson-mail-watch', name: 'Gmail lesson door (watch)',
    purpose: 'A forwarded "Lesson." mail wakes the capture session.',
    reads: [{ res: 'mail:lesson', token: 'imaplib' }],
    writes: [{ res: 'gh:signal-pr', token: 'SIGNAL_PR' }],
    seeds: ['lesson-capture'],
  }),
  {
    kind: 'session', id: 'lesson-capture', name: 'Lesson capture (the lesson reader + the Gmail Way)',
    file: 'docs/decisions/DR-0610-both-lesson-doors-run-in-parallel-until-the-governor-is-confident-the-in-app-reader-is-armed-for-the-parallel-run.md',
    purpose: 'The armed reader (every 4 hours) and the Gmail Way read each lesson, verify every verse, and write it into the class.',
    reads: [
      { res: 'gh:signal-pr', file: '.github/workflows/lesson-mail-watch.yml', token: 'wakes the subscribed capture session' },
      { res: 'hosted:lesson-mirror', file: 'docs/decisions/DR-0614-the-nas-jobs-follow-the-database-the-app-reads-and-lesson-rows-are-mirrored-to-where-the-reader-can-see-them.md', token: 'the lesson reader picks it up' },
      { res: 'file:source-transcripts', file: '.github/workflows/source-transcript.yml', token: 'docs/99-session-notes/sources/' },
    ],
    writes: [{ res: 'code:lessons', file: 'app/src/lib/sovereign-ai-class.js', token: 'Gmail-lesson-intake Way' }],
    seeds: ['learn'],
  },
  app('app/src/lib/sovereign-ai-class.js', {
    id: 'learn', name: 'Learn (the classes)',
    purpose: 'The lessons a person reads, week by week.',
    reads: [{ res: 'code:lessons', token: 'buildSovereignAiSchedule' }],
    seeds: [],
  }),
  app('app/src/lib/agent-inbox-sync.js', {
    id: 'lesson-door', name: 'In-app lesson door (One Voice)',
    purpose: 'A lesson typed or spoken into the app is filed for capture, and the lessons already written from the Word for those words are shown on the spot (DR-0630).',
    writes: [
      { res: 'db:agent_inbox#lesson', token: "from('agent_inbox')" },
      { res: 'db:agent_inbox#voice', file: 'app/src/lib/lesson-voice.js', token: 'voiceLessonTags' },
    ],
    reads: [
      { res: 'event:use-prompt', file: 'app/src/components/OneVoiceInput.jsx', token: 'USE_PROMPT_EVENT' },
      // DR-0630: the published lessons, ranked for the person's own words.
      { res: 'code:lessons', file: 'app/src/lib/lessons-for-situation.js', token: 'buildSelfPacedDescriptors' },
    ],
    seeds: ['lesson-voice', 'lesson-inbox', 'member-lesson-queue'],
  }),
  rider('service:lesson-voice', 'infra/nas-lesson-voice/lesson_voice_transcribe.py', {
    id: 'lesson-voice', name: 'Whisper + the lesson mirror',
    purpose: 'Transcribes each spoken lesson on our own machines, and carries every lesson row to where the cloud reader can see it.',
    reads: [
      { res: 'db:agent_inbox#voice', token: '/rest/v1/agent_inbox' },
      { res: 'db:agent_inbox#lesson', token: 'list_lesson_rows' },
      { res: 'db:agent_inbox#voice-transcript', token: 'rows_to_mirror' },
      // DR-0635: the Governor's decision on a member's lesson reaches the reader.
      { res: 'db:agent_inbox#lesson-review', token: 'list_reviewed_rows' },
    ],
    writes: [
      { res: 'db:agent_inbox#voice-transcript', token: '"voice-transcript"' },
      { res: 'hosted:lesson-mirror', token: 'insert_hosted' },
    ],
    seeds: ['lesson-capture', 'lesson-inbox'],
  }),
  wf('voice-intake-health.yml', {
    id: 'voice-intake-health', name: 'Voice intake witness',
    purpose: 'Proves on the live database that a spoken recording becomes words: voice rows in, transcripts out, and which Whisper rung wrote each.',
    reads: [{ res: 'db:agent_inbox#voice', token: 'agent_inbox' }, { res: 'db:agent_inbox#voice-transcript', token: 'voice-transcript' }],
    writes: [], seeds: [],
  }),
  app('app/src/components/LessonInbox.jsx', {
    id: 'lesson-inbox', name: 'Your lessons (sent, heard, written down)',
    purpose: 'The speaker sees each lesson they sent: received, transcribed, and the words Whisper wrote.',
    reads: [
      { res: 'db:agent_inbox#lesson', file: 'app/src/lib/lesson-inbox.js', token: "from('agent_inbox')" },
      { res: 'db:agent_inbox#voice-transcript', file: 'app/src/lib/lesson-inbox.js', token: 'voice-transcript' },
      // DR-0635: approved (being written, name not used) or declined with the reason.
      { res: 'db:agent_inbox#lesson-review', file: 'app/src/lib/lesson-inbox.js', token: 'review_reason' },
    ],
    seeds: [],
  }),
  app('app/src/components/MemberLessonQueue.jsx', {
    id: 'member-lesson-queue', name: 'Members\u2019 lessons to review (the Governor)',
    purpose: 'A member\u2019s lesson is reviewed by the Governor \u2192 a lesson (approved; the reader writes it, name never used) or a reason (declined; the member reads it beside the lessons they were shown). DR-0635.',
    reads: [{ res: 'db:agent_inbox#lesson', file: 'app/src/lib/member-lesson-review.js', token: "rpc('member_lesson_queue')" }],
    writes: [{ res: 'db:agent_inbox#lesson-review', file: 'app/src/lib/member-lesson-review.js', token: "rpc('review_member_lesson'" }],
    seeds: ['lesson-voice', 'lesson-inbox'],
  }),

  // ===========================================================================
  // 6. PROMPT HISTORY — what you sent comes back to be sent again
  // ===========================================================================
  app('app/src/components/OneVoiceInput.jsx', {
    id: 'one-voice', name: 'One Voice box',
    purpose: 'The one box every lesson and request is sent from; each one is kept.',
    writes: [
      { res: 'db:saved_prompts', file: 'app/src/lib/saved-prompts.js', token: "rpc('remember_prompt'" },
      // The PoeTech and Conference chips reach the steward's feedback queue (DR-0622).
      { res: 'db:feedback', file: 'app/src/lib/poetech-request.js', token: 'uploadFeedback' },
      { res: 'db:feedback', token: "currentView: 'Conference · One Voice'" },
      { res: 'db:agent_inbox#poetech', file: 'app/src/lib/poetech-request.js', token: "'tell-poetech'" },
    ],
    reads: [{ res: 'event:use-prompt', token: 'USE_PROMPT_EVENT' }],
    seeds: ['prompt-history', 'feedback-queue'],
  }),
  app('app/src/components/PromptHistory.jsx', {
    id: 'prompt-history', name: 'Your prompts',
    purpose: 'Every prompt, dated and reusable — "Put it in the box" sends it again.',
    reads: [{ res: 'db:saved_prompts', file: 'app/src/lib/saved-prompts.js', token: "from('saved_prompts')" }],
    writes: [{ res: 'event:use-prompt', file: 'app/src/lib/saved-prompts.js', token: 'USE_PROMPT_EVENT' }],
    seeds: ['one-voice', 'lesson-door', 'feedback-door'],
  }),

  // ===========================================================================
  // 7. ASK THE MODELS — app → NAS agent → app
  // ===========================================================================
  app('app/src/components/ChatPane.jsx', {
    id: 'chat-pane', name: 'Ask the models',
    purpose: 'A question goes to the box; the answer comes back into the pane.',
    writes: [{ res: 'db:agent_tasks', token: "from('agent_tasks').insert" }],
    reads: [{ res: 'db:agent_tasks#answered', token: "from('agent_tasks')" }],
    seeds: ['agent-consumer'],
  }),
  rider('service:agent-consumer', 'infra/nas-agent/agent_consumer.py', {
    id: 'agent-consumer', name: 'NAS agent (answers the pane)',
    purpose: 'Answers each question on our own models and writes the answer to the row.',
    reads: [{ res: 'db:agent_tasks', token: 'agent_tasks' }, { res: 'nas:agent-credential', token: 'AGENT_DB_URL' }],
    writes: [{ res: 'db:agent_tasks#answered', token: 'result' }],
    seeds: ['chat-pane'],
  }),

  // ===========================================================================
  // 8. THE FAMILY KEY — NAS publishes, every device provisions itself
  // ===========================================================================
  rider('service:family-key', 'infra/nas-bridge-publish/publish_family_key.py', {
    id: 'family-key', name: 'NAS publishes the family key',
    purpose: 'The key the family NAS doors need, published by the NAS itself.',
    writes: [{ res: 'db:family_secure_config', token: 'box_publish_family_bridge_token' }],
    seeds: ['bridge-provision'],
  }),
  app('app/src/lib/bridge-provision.js', {
    id: 'bridge-provision', name: 'Device provisions the family key',
    purpose: 'Each family device picks up the key on its own.',
    reads: [{ res: 'db:family_secure_config', token: 'get_family_bridge_token' }],
    writes: [
      { res: 'device:family-key', token: 'localStorage' },
      { res: 'db:family_secure_config', file: 'app/src/lib/bridge-provision.js', token: 'set_family_bridge_token' },
    ],
    seeds: ['nas-photos', 'voice-studio', 'books-taxes'],
  }),
  app('app/src/lib/nas-photos.js', {
    id: 'nas-photos', name: 'Photos from the family NAS',
    purpose: 'Property, family and album photos served from our own box.',
    reads: [{ res: 'device:family-key', token: 'bridgeToken' }, { res: 'http:nas-photos', token: '/nas-photos' }],
    seeds: [],
  }),
  app('app/src/lib/clip-queue.js', {
    id: 'reader-audio-voice', name: 'Reader audio voice (keeps playing when you switch apps)',
    purpose: 'The reading as real audio clips from the NAS voice, so a phone keeps playing it in the background (DR-0627).',
    reads: [{ res: 'device:family-key', file: 'app/src/lib/voice-service.js', token: 'bridgeToken' }, { res: 'http:voice-lite', file: 'app/src/lib/voice-service.js', token: '/voice-lite' }],
    seeds: [],
  }),
  app('app/src/components/VoiceStudio.jsx', {
    id: 'voice-studio', name: 'Voice studio',
    purpose: 'The reading voice, spoken by our own studio.',
    reads: [{ res: 'device:family-key', token: 'provisionBridgeToken' }, { res: 'http:voice', file: 'app/src/lib/voice-service.js', token: '/voice' }],
    seeds: [],
  }),
  app('app/src/components/BooksTaxes.jsx', {
    id: 'books-taxes', name: 'Books → Taxes',
    purpose: 'Tax documents uploaded to and read back from our own box.',
    reads: [{ res: 'device:family-key', token: 'provisionBridgeToken' }, { res: 'http:taxes', token: '/taxes' }],
    writes: [{ res: 'http:taxes-upload', token: '/taxes' }],
    seeds: ['tax-upload'],
  }),

  // ===========================================================================
  // 9. TRANSCRIPTS → SERMONS → THE WORD / LEARN
  // ===========================================================================
  rider('service:choir-dates', 'infra/church-media-golive/choir_dates_sync.py', {
    id: 'choir-dates', name: 'NAS dates every service video',
    purpose: 'Gives each undated service its real date from the video itself.',
    reads: [{ res: 'db:choir_sermons', token: 'choir_sermons' }, { res: 'yt:channel', token: 'yt-dlp' }],
    writes: [{ res: 'db:choir_sermons', token: 'service_date' }],
    seeds: ['sermon-reader', 'transcript-trickle'],
  }),
  rider('service:transcript-trickle', 'infra/nas-sme-pipeline/load-transcripts.py', {
    id: 'transcript-trickle', name: 'NAS transcript trickle',
    purpose: 'Fetches each service video’s words from the NAS’s own address.',
    reads: [{ res: 'db:choir_sermons', token: 'choir_sermons' }, { res: 'yt:channel', token: 'youtube' }],
    writes: [{ res: 'db:video_transcripts', token: 'video_transcripts' }],
    seeds: ['sermon-reader', 'harvest-ledger', 'harvest-health'],
  }),
  app('app/src/lib/choir-sync.js', {
    id: 'sermon-store', name: 'Service record (sermons + songs)',
    purpose: 'Stewards add and correct services and songs by hand.',
    writes: [
      { res: 'db:choir_sermons', token: "from('choir_sermons').insert" },
      { res: 'db:choir_songs', token: "from('choir_songs').insert" },
    ],
    reads: [{ res: 'db:choir_sermons', token: 'choir_sermons' }, { res: 'db:choir_songs', token: 'choir_songs' }],
    seeds: ['sermon-reader', 'songbook', 'scripture-web', 'library'],
  }),
  app('app/src/components/Pulpit.jsx', {
    id: 'sermon-reader', name: 'The Word (Pulpit) — sermons with their words',
    purpose: 'Each service with its transcript, harvest and reach.',
    reads: [
      { res: 'db:choir_sermons', token: 'subscribeSermons' },
      { res: 'db:video_transcripts', file: 'app/src/lib/sermon-library-sync.js' },
      { res: 'db:video_harvests', file: 'app/src/lib/sermon-library-sync.js' },
      { res: 'db:sermon_video_stats', file: 'app/src/lib/sermon-library-sync.js' },
    ],
    seeds: [],
  }),
  app('app/src/components/HarvestLedger.jsx', {
    id: 'harvest-ledger', name: 'Harvest ledger',
    purpose: 'What each service yielded — songs, points, words — recorded against its video.',
    reads: [{ res: 'db:video_transcripts', file: 'app/src/lib/harvest-ledger.js' }, { res: 'db:video_harvests', file: 'app/src/lib/harvest-ledger.js' }],
    writes: [{ res: 'db:video_harvests', file: 'app/src/lib/harvest-ledger.js', token: "from('video_harvests').insert" }],
    seeds: ['sermon-reader'],
  }),
  app('app/src/components/ScriptureLibrary.jsx', {
    id: 'scripture-web', name: 'Scripture connections',
    purpose: 'A verse shows where the church preached and sang it.',
    reads: [{ res: 'db:choir_sermons', token: 'subscribeSermons' }, { res: 'db:choir_songs', file: 'app/src/components/ScriptureConnections.jsx', token: 'connectionsFor' }],
    seeds: [],
  }),
  app('app/src/components/Library.jsx', {
    id: 'library', name: 'Library (sermon-based books)',
    purpose: 'Book recipes built from the real sermons.',
    reads: [{ res: 'db:choir_sermons', token: 'subscribeSermons' }],
    seeds: [],
  }),
  app('app/src/components/ChoirSongbook.jsx', {
    id: 'songbook', name: 'Choir songbook + order of service',
    purpose: 'The repertoire, and the songs placed in each service.',
    reads: [
      { res: 'db:choir_songs', file: 'app/src/components/Choir.jsx', token: 'subscribeSongs' },
      { res: 'db:church_service_segments', file: 'app/src/lib/service-program.js' },
    ],
    writes: [
      { res: 'db:choir_songs', file: 'app/src/lib/choir-songbook-sync.js', token: "from('choir_songs').insert" },
      { res: 'db:church_service_segments', file: 'app/src/lib/service-program.js' },
    ],
    seeds: ['scripture-web'],
  }),
  wf('harvest-health.yml', {
    id: 'harvest-health', name: 'Harvest health witness',
    purpose: 'Proves from outside the NAS that transcripts keep arriving; heals a silent rider.',
    reads: [{ res: 'db:video_transcripts' }, { res: 'db:choir_sermons' }, { res: 'hosted:db', token: 'SUPABASE_DB_URL' }],
    writes: [{ res: 'gh:incident', token: '--label incident' }, { res: 'gh:heal-nas', token: 'gh workflow run nas-bootstrap.yml' }],
    seeds: ['ops-surface', 'nas-bootstrap'],
  }),
  wf('video-stats.yml', {
    id: 'video-stats', name: 'Video reach from the channel’s own feed',
    purpose: 'Each recent service video’s public views and likes, onto the service record the Pulpit ranks by.',
    reads: [
      { res: 'yt:channel', file: 'scripts/video-stats-feed.mjs', token: 'FEED_URL' },
      { res: 'db:choir_sermons', file: 'scripts/video-stats-feed.mjs', token: 'choir_sermons' },
    ],
    writes: [{ res: 'db:sermon_video_stats', file: 'scripts/video-stats-feed.mjs', token: 'INSERT INTO public.sermon_video_stats' }],
    seeds: ['sermon-reader'],
  }),
  wf('corpus-reconcile.yml', {
    id: 'corpus-reconcile', name: 'Corpus reconcile (the channel vs our record)',
    purpose: 'Compares the channel’s videos with the service record so none is missing.',
    reads: [{ res: 'db:choir_sermons', token: 'choir_sermons' }, { res: 'yt:channel', token: 'youtube' }],
    writes: [],
    seeds: [],
  }),
  wf('transcript-backfill.yml', {
    id: 'transcript-backfill', name: 'Transcript backfill (hosted, retired side)',
    purpose: 'The CI caption harvest; it still writes the retired hosted database.',
    reads: [{ res: 'yt:channel', file: 'infra/nas-sme-pipeline/transcript-backfill-ci.py', token: 'youtube' }],
    writes: [{ res: 'hosted:db', token: 'SUPABASE_DB_URL' }],
    seeds: ['content-sync'],
  }),
  wf('sovereign-content-sync.yml', {
    id: 'content-sync', name: 'Sovereign content sync (retired → live)',
    purpose: 'Carries rows the NAS pipelines filed on the retired backend to the database the app reads.',
    reads: [{ res: 'hosted:db', file: 'infra/nas-supabase/content_sync.py', token: 'source' }],
    writes: [
      { res: 'db:choir_sermons', file: 'infra/nas-supabase/content_sync.py', token: 'choir_sermons' },
      { res: 'db:video_transcripts', file: 'infra/nas-supabase/content_sync.py', token: 'video_transcripts' },
    ],
    seeds: ['sermon-reader'],
  }),

  // ===========================================================================
  // 10. SITE HEALTH → INCIDENTS → THE OPERATIONS READOUT
  // ===========================================================================
  wf('site-health.yml', {
    id: 'site-health', name: 'Site health witness',
    purpose: 'Proves poetech.us is up, whole and fresh, from outside; heals a stale build.',
    reads: [{ res: 'site:poetech.us', token: 'poetech.us' }],
    writes: [{ res: 'gh:incident', token: '--label incident' }, { res: 'gh:deploy-heal', token: 'gh workflow run deploy-cloudflare-pages.yml' }],
    seeds: ['ops-surface', 'deploy'],
  }),
  app('app/src/lib/site-health.js', {
    id: 'ops-surface', name: 'OpsBoard uptime + incident ledger',
    purpose: 'Every outage and stall the witnesses recorded, with its duration.',
    reads: [{ res: 'gh:incident', token: 'labels=incident' }],
    seeds: [],
  }),

  // ===========================================================================
  // 11. THE DELIVERY LANE — branch → PR → gates → merge → deploy → witness
  // ===========================================================================
  wf('auto-open-pr.yml', {
    id: 'auto-open-pr', name: 'Auto-open PR', runRule: 'any-success', purpose: 'A pushed branch becomes a PR.',
    reads: [{ res: 'gh:branch', token: 'push:' }], writes: [{ res: 'gh:pr', token: 'gh pr create' }], seeds: ['ci', 'auto-merge', 'pr-janitor'],
  }),
  wf('ci.yml', {
    id: 'ci', name: 'CI — every gate', runRule: 'any-success', purpose: 'Lint, the full test suite, every guard (this graph’s included) and a real build.',
    reads: [{ res: 'gh:pr', token: 'pull_request' }], writes: [{ res: 'gh:check', token: 'npx vitest run' }], seeds: ['auto-merge'],
  }),
  wf('auto-merge.yml', {
    id: 'auto-merge', name: 'Auto-merge on green', runRule: 'any-success', purpose: 'Merges the PR the moment its gates pass; dispatches the deploy.',
    reads: [{ res: 'gh:pr', token: 'gh pr list' }, { res: 'gh:check', token: 'workflow_run' }],
    writes: [{ res: 'gh:main', token: 'gh pr merge' }, { res: 'gh:deploy-heal', token: 'gh workflow run deploy-cloudflare-pages.yml' }],
    seeds: ['deploy', 'db-migrate', 'deploy-freshness'],
  }),
  wf('deploy-cloudflare-pages.yml', {
    id: 'deploy', name: 'Deploy to Cloudflare Pages', purpose: 'Main becomes the live site.',
    reads: [{ res: 'gh:main', token: 'branches' }, { res: 'gh:deploy-heal', token: 'workflow_dispatch' }],
    writes: [{ res: 'site:poetech.us', token: 'wrangler' }, { res: 'gh:incident', token: '--label incident' }],
    seeds: ['site-health', 'install-health', 'live-link-probe', 'level-witness'],
  }),
  wf('deploy-freshness.yml', {
    id: 'deploy-freshness', name: 'Deploy freshness heal', purpose: 'A merge that never deployed is deployed.',
    reads: [{ res: 'gh:main', token: 'main' }], writes: [{ res: 'gh:deploy-heal', token: 'gh workflow run deploy-cloudflare-pages.yml' }], seeds: ['deploy'],
  }),
  wf('db-migrate.yml', {
    id: 'db-migrate', name: 'Migration lane', purpose: 'A merged migration is applied to the live database and recorded in its ledger.',
    reads: [{ res: 'gh:main', token: 'migrations-auto' }, { res: 'gh:migrate-heal', token: 'workflow_dispatch' }],
    writes: [
      { res: 'db:_sovereign_replay', file: 'infra/nas-supabase/replay_migrations.sh', token: 'INSERT INTO public._sovereign_replay' },
      { res: 'hosted:db', file: 'scripts/db-migrate-apply.sh', token: '_schema_migrations' },
      { res: 'gh:rls-dispatch', token: 'rls-isolation' },
    ],
    seeds: ['rls-isolation', 'schema-health'],
  }),
  wf('migrate-freshness.yml', {
    id: 'migrate-freshness', name: 'Migration freshness heal', purpose: 'A merged migration that never applied is applied.',
    reads: [{ res: 'gh:main', token: 'main' }], writes: [{ res: 'gh:migrate-heal', token: 'gh workflow run db-migrate.yml' }], seeds: ['db-migrate'],
  }),
  wf('rls-isolation.yml', {
    id: 'rls-isolation', name: 'RLS isolation matrix', purpose: 'Proves on the real database that no tenant reads another’s rows.',
    reads: [{ res: 'gh:rls-dispatch', token: 'workflow_run' }], writes: [], seeds: [],
  }),
  app('app/src/lib/db-health.js', {
    id: 'schema-health', name: 'Schema health (migration ledger in the app)',
    purpose: 'Which migrations reached the live database, read in the app.',
    reads: [{ res: 'db:_sovereign_replay', file: 'infra/supabase/migrations-auto/0235-the-migration-ledger-the-app-shows-is-the-live-ones.sql', token: 'FROM public._sovereign_replay' }], seeds: [],
  }),
  wf('pr-janitor.yml', {
    id: 'pr-janitor', name: 'PR janitor', purpose: 'Closes PRs that carry nothing beyond main.',
    reads: [{ res: 'gh:pr', token: 'gh pr list' }], writes: [], seeds: [],
  }),
  wf('install-health.yml', {
    id: 'install-health', name: 'Install health witness', purpose: 'Proves the site installs as an app.',
    reads: [{ res: 'site:poetech.us', token: 'poetech.us' }], writes: [], seeds: [],
  }),
  wf('live-link-probe.yml', {
    id: 'live-link-probe', name: 'Live link probe', purpose: 'A real browser opens a shared lesson link.',
    reads: [{ res: 'site:poetech.us', token: 'poetech.us' }], writes: [], seeds: [],
  }),
  wf('level-witness.yml', {
    id: 'level-witness', name: 'Reader level witness', purpose: 'Proves the reader’s level switch on the live site.',
    reads: [{ res: 'site:poetech.us', token: 'poetech.us' }], writes: [{ res: 'gh:incident', token: 'incident' }], seeds: ['ops-surface'],
  }),
  wf('daily-review.yml', {
    id: 'daily-review', name: 'Daily system review', purpose: 'The daily deterministic health and leverage scan.',
    reads: [{ res: 'gh:main', token: 'checkout' }], writes: [], seeds: [],
  }),
  wf('review-watcher.yml', {
    id: 'review-watcher', name: 'Review watcher', purpose: 'Every dated re-review becomes a tracked item when it falls due.',
    reads: [{ res: 'file:decision-ledger', file: 'scripts/review-watcher.mjs', token: 'decisions' }], writes: [{ res: 'gh:review-issue', token: 'gh issue create' }], seeds: [],
  }),
  wf('ari-comprehensive-review.yml', {
    id: 'ari-review', name: 'Ari comprehensive review', purpose: 'The event-activated comprehensive review, report only.',
    reads: [{ res: 'gh:main', token: 'checkout' }], writes: [], seeds: [],
  }),
  wf('pm-synth.yml', {
    id: 'pm-synth', name: 'PM synthesizer', purpose: 'A read-only portfolio brief of the open PRs.',
    reads: [{ res: 'gh:pr', token: 'gh pr list' }], writes: [], seeds: [],
  }),

  // ===========================================================================
  // 12. RELEASES — the installable app
  // ===========================================================================
  wf('android-package.yml', {
    id: 'android-package', name: 'Android package', purpose: 'Builds the installable Android app.',
    reads: [{ res: 'gh:main', token: 'checkout' }], writes: [{ res: 'gh:release', token: 'gh release' }], seeds: ['app-store'],
  }),
  wf('native-shell.yml', {
    id: 'native-shell', name: 'Native shell', purpose: 'Builds the family’s local Android app.',
    reads: [{ res: 'gh:main', token: 'checkout' }], writes: [{ res: 'gh:release', token: 'gh release' }], seeds: ['app-store'],
  }),
  app('app/src/lib/app-store.js', {
    id: 'app-store', name: 'Get the app (download)', purpose: 'The download button reads the latest release.',
    reads: [{ res: 'gh:release', token: 'releases/download' }], seeds: [],
  }),

  // ===========================================================================
  // 13. NAS REMOTE HANDS — the runner reaches the box
  // ===========================================================================
  wf('nas-bootstrap.yml', {
    id: 'nas-bootstrap', name: 'NAS bootstrap (remote hands)', purpose: 'Pulls the repo mirror and runs every installer.',
    reads: [{ res: 'gh:heal-nas', token: 'workflow_dispatch' }], writes: [{ res: 'nas:mirror', token: 'services-sync' }], seeds: ['services-sync'],
  }),
  rider('loop:services-sync', 'infra/nas-loops/loops/services-sync.sh', {
    id: 'services-sync', name: 'NAS self-deploy (services-sync)', purpose: 'Merging a service to main IS its NAS deploy.',
    reads: [{ res: 'nas:mirror', token: 'services.json' }, { res: 'nas:clock', file: 'infra/nas-loops/install-clock.sh', token: 'run.mjs' }],
    writes: [{ res: 'nas:services', token: 'install' }],
    seeds: ['ops-runner', 'lesson-voice', 'family-key', 'transcript-trickle', 'choir-dates', 'agent-consumer'],
  }),
  wf('nas-clock.yml', {
    id: 'nas-clock', name: 'NAS clock', purpose: 'Gives the NAS loop fleet its clock.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'nas:clock', token: 'install-clock.sh' }], seeds: ['services-sync'],
  }),
  wf('nas-health.yml', {
    id: 'nas-health', name: 'NAS health (look, never touch)', purpose: 'What the NAS is doing right now — GPU, containers, services, and the live tables’ row counts.',
    reads: [{ res: 'nas:services', token: 'systemctl' }, { res: 'db:feedback', token: 'FROM feedback' }, { res: 'db:board_tasks', token: 'FROM board_tasks' }],
    writes: [], seeds: [],
  }),
  wf('nas-agent-arm.yml', {
    id: 'nas-agent-arm', name: 'Arm the NAS agent', purpose: 'Places the agent’s database credential on the NAS.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'nas:agent-credential', token: 'agent' }], seeds: ['agent-consumer'],
  }),
  wf('nas-email-door.yml', {
    id: 'nas-email-door', name: 'Email door (sign-in mail from our own stack)', purpose: 'Wires the sovereign stack’s mail sender from the one secret only Darrell mints.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'nas:smtp', token: 'SMTP' }], seeds: ['supabase'],
  }),
  wf('nas-user-rescue.yml', {
    id: 'nas-user-rescue', name: 'Get a locked-out family member back in', purpose: 'Clears a PIN or resets a password on the live stack, by dispatch.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'auth:users', token: 'reset_password.sh' }], seeds: ['supabase'],
  }),
  wf('nas-storage-sync.yml', {
    id: 'nas-storage-sync', name: 'Storage copy (retired → live)', purpose: 'Copies the files the repoint left behind to the live storage.',
    reads: [{ res: 'hosted:db', token: 'hosted' }], writes: [{ res: 'nas:storage', token: 'storage_sync.py' }], seeds: ['supabase'],
  }),
  wf('nas-rotate-bearer.yml', {
    id: 'nas-rotate-bearer', name: 'Rotate the wf18 bearer (n8n)', purpose: 'Rotates the PII-webhook bearer of the n8n wf18 workflow.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'nas:wf18-bearer', token: 'wf18' }], seeds: [],
  }),
  wf('arm-voice-studio.yml', {
    id: 'arm-voice-studio', name: 'Arm the voice studio (the 4070 tower)', purpose: 'Starts the sovereign reading-voice studio on the GPU tower.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'tower:voice-studio', token: 'voice' }], seeds: ['voice-transport'],
  }),
  wf('enable-auth-hook.yml', {
    id: 'enable-auth-hook', name: 'Enable the renter-portal auth hook', purpose: 'Turns on the access-token hook the renter portal signs in with.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'auth:hook', token: 'hook' }], seeds: [],
  }),
  wf('push-vapid-keys.yml', {
    id: 'push-vapid-keys', name: 'Push keys (VAPID)', purpose: 'Mints and installs the push signing keys with no hand on the private key.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'cf:push-env', token: 'VAPID' }], seeds: ['push-send'],
  }),
  wf('push-sender-credentials.yml', {
    id: 'push-sender-credentials', name: 'Push sender credentials', purpose: 'Installs the database credentials the push sender needs.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'cf:push-env', token: 'SUPABASE_SERVICE_KEY' }], seeds: ['push-send'],
  }),
  app('app/functions/api/push-send.js', {
    id: 'push-send', name: 'Push sender (buzzes a phone)', purpose: 'Sends a notification to the devices that asked for it.',
    reads: [{ res: 'cf:push-env', token: 'VAPID_PUBLIC_KEY' }, { res: 'db:push_subscriptions', token: 'push_subscriptions' }, { res: 'http:push-send', token: 'fault' }],
    writes: [{ res: 'push:phone', token: 'endpoint' }],
    seeds: [],
  }),
  app('app/src/lib/push-subscribe.js', {
    id: 'push-subscribe', name: 'Notifications on (this device)', purpose: 'A device asks to be told.',
    writes: [{ res: 'db:push_subscriptions', token: 'push_subscriptions' }],
    seeds: ['push-send'],
  }),
  app('app/src/lib/door-feedback-sync.js', {
    id: 'door-feedback', name: 'A door’s own feedback + fault reports', purpose: 'A customer says a door is broken; a door that breaks reports itself; the office works each one.',
    writes: [
      { res: 'db:door_feedback', token: 'door_feedback_submit' },
      { res: 'db:push_outbox', file: 'infra/supabase/migrations-auto/0220-a-new-door-fault-enqueues-an-office-push-the-outbox.sql', token: 'INSERT INTO public.push_outbox' },
    ],
    reads: [{ res: 'db:door_feedback', token: "from('door_feedback')" }],
    seeds: ['push-outbox-drain'],
  }),
  wf('push-outbox-drain.yml', {
    id: 'push-outbox-drain', name: 'Office push drain', purpose: 'Delivers each new door fault to the office’s phones.',
    reads: [{ res: 'db:push_outbox', file: 'scripts/push-outbox-drain-over-tailnet.sh', token: 'push_outbox' }],
    writes: [{ res: 'http:push-send', file: 'scripts/push-outbox-drain-over-tailnet.sh', token: 'push-send' }, { res: 'db:push_outbox#sent', file: 'scripts/push-outbox-drain-over-tailnet.sh', token: 'sent_at' }],
    seeds: ['push-send'],
  }),
  wf('node-availability.yml', {
    id: 'node-availability', name: 'Pipeline device availability', purpose: 'Is every always-on node actually up?',
    reads: [{ res: 'tailnet:nodes', token: 'tailscale' }], writes: [{ res: 'gh:incident', token: 'incident' }], seeds: ['ops-surface'],
  }),
  wf('mcp-health.yml', {
    id: 'mcp-health', name: 'MCP server health', purpose: 'Proves the sovereign MCP server answers and enforces its token.',
    reads: [{ res: 'http:mcp', token: '/mcp' }], writes: [], seeds: [],
  }),
  wf('history-voices-witness.yml', {
    id: 'history-voices-witness', name: 'History voices witness', purpose: 'Fetches each quoted historical record and proves the quoted words are in it.',
    reads: [{ res: 'web:primary-records', token: 'history-voices-witness.mjs' }], writes: [], seeds: [],
  }),
  wf('source-transcript.yml', {
    id: 'source-transcript', name: 'Source transcript (runner)', purpose: 'Turns a video Darrell sends into text the capture session can read.',
    reads: [{ res: 'yt:channel', token: 'youtube' }], writes: [{ res: 'file:source-transcripts', token: 'docs/99-session-notes/sources/' }], seeds: ['lesson-capture'],
  }),
  wf('source-transcript-nas.yml', {
    id: 'source-transcript-nas', name: 'Source transcript (NAS address)', purpose: 'The same, fetched from the NAS’s residential address YouTube does not block.',
    reads: [{ res: 'yt:channel', token: 'youtube' }], writes: [{ res: 'file:source-transcripts', token: 'transcripts' }], seeds: ['lesson-capture'],
  }),
  wf('sovereign-read.yml', {
    id: 'sovereign-read', name: 'Ask the live database', purpose: 'A session reads the database the app reads — feedback, tables, and the lessons waiting.',
    reads: [{ res: 'db:feedback', file: 'scripts/sovereign-read-over-tailnet.sh', token: 'feedback' }],
    writes: [], seeds: [],
  }),
  wf('sovereign-drift.yml', {
    id: 'sovereign-drift', name: 'Migration drift witness', purpose: 'Which migrations the live database is missing.',
    reads: [{ res: 'db:_sovereign_replay', token: '_sovereign_replay' }], writes: [], seeds: [],
  }),
  wf('sovereign-replay.yml', {
    id: 'sovereign-replay', name: 'Migration replay (by hand)', purpose: 'Replays the migrations the live database is missing.',
    reads: [{ res: 'gh:dispatch', token: 'workflow_dispatch' }], writes: [{ res: 'db:_sovereign_replay', file: 'infra/nas-supabase/replay_migrations.sh', token: 'INSERT INTO public._sovereign_replay' }], seeds: ['schema-health'],
  }),

  // ===========================================================================
  // 14. THE NAS SERVICES AND LOOPS
  // ===========================================================================
  rider('service:supabase', 'infra/nas-supabase/docker-compose.yml', {
    id: 'supabase', name: 'The live database (our own Supabase)', purpose: 'Every table above lives here; the app and every rider reach it.',
    reads: [{ res: 'nas:smtp', file: 'infra/nas-supabase/enable_email_smtp.sh', token: 'SMTP' }, { res: 'nas:storage', token: 'storage' }, { res: 'auth:users', file: 'infra/nas-supabase/reset_password.sh', token: 'auth.users' }],
    writes: [{ res: 'http:supabase', token: 'kong' }],
    seeds: ['app-client'],
  }),
  app('app/src/lib/supabase.js', {
    id: 'app-client', name: 'The app’s database client', purpose: 'Every screen reads and writes through it.',
    reads: [{ res: 'http:supabase', token: 'createClient' }], seeds: [],
  }),
  rider('service:mcp', 'infra/nas-mcp/mcp_server.py', {
    id: 'mcp', name: 'Sovereign MCP server', purpose: 'Read-only tools over the dispatch reel and the task snapshot, for the sessions.',
    reads: [{ res: 'nas:reel', token: '_reel.jsonl' }], writes: [{ res: 'http:mcp', token: 'dispatch_reel' }], seeds: ['mcp-health'],
  }),
  rider('service:scribe', 'infra/nas-scribe/scribe_ingest_server.py', {
    id: 'scribe', name: 'Scribe ingest (recordings in)', purpose: 'Takes each Scribe recording in and queues it for transcription.',
    reads: [{ res: 'http:scribe-upload', token: 'complete' }, { res: 'nas:scribe-minutes', file: 'infra/nas-scribe/scribe_results.py', token: 'minutes.md' }],
    writes: [{ res: 'nas:scribe-queue', token: 'whisper-queue.jsonl' }, { res: 'http:scribe-results', token: '/scribe/sessions' }],
    seeds: ['scribe-transcribe', 'scribe-surface'],
  }),
  app('app/src/components/WorkflowScribe.jsx', {
    id: 'scribe-surface', name: 'Scribe (record a workflow or a meeting)', purpose: 'Records, uploads, and hands the recording to our own box.',
    writes: [{ res: 'http:scribe-upload', token: '/scribe/complete' }],
    reads: [{ res: 'http:scribe-results', file: 'app/src/components/ScribeRecordings.jsx', token: 'fetchScribeSessions' }],
    seeds: ['scribe'],
  }),
  rider('loop:scribe-transcribe', 'infra/nas-scribe/scribe_queue_consumer.py', {
    id: 'scribe-transcribe', name: 'Scribe transcription (queue → words → minutes)', purpose: 'Turns each recording into a transcript and minutes.',
    reads: [{ res: 'nas:scribe-queue', token: 'whisper-queue.jsonl' }], writes: [{ res: 'nas:scribe-minutes', token: 'minutes.md' }], seeds: ['scribe'],
  }),
  rider('service:property-photos', 'infra/nas-property-photos/photo_server.py', {
    id: 'property-photos', name: 'Photo server', purpose: 'Serves property, family and album photos from our own box.',
    writes: [{ res: 'http:nas-photos', token: 'photo' }], seeds: ['nas-photos'],
  }),
  rider('service:tax-upload', 'infra/nas-tax-ingest/tax_upload_server.py', {
    id: 'tax-upload', name: 'Tax archive server', purpose: 'Takes tax documents in and serves the archive back.',
    reads: [{ res: 'http:taxes-upload', token: 'upload' }], writes: [{ res: 'http:taxes', token: 'archive.json' }], seeds: ['books-taxes'],
  }),
  rider('service:voice-transport', 'infra/voice-studio/install.sh', {
    id: 'voice-transport', name: 'Voice transport (the road to the studio)', purpose: 'Carries the app’s /voice requests to the studio on the tower.',
    reads: [{ res: 'tower:voice-studio', token: 'tlcmediadpt' }], writes: [{ res: 'http:voice', token: '/voice' }], seeds: ['voice-studio'],
  }),
  rider('service:voice-lite', 'infra/nas-voice-lite/voice_lite_server.py', {
    id: 'voice-lite', name: 'NAS audio voice (Piper)', purpose: 'Speaks a paragraph as a real audio clip on the NAS CPU, so the stand-in voice keeps playing in the background (DR-0627).',
    reads: [{ res: 'nas:services', file: 'infra/nas-loops/services.json', token: 'voice-lite' }], writes: [{ res: 'http:voice-lite', token: '/voice-lite' }], seeds: ['reader-audio-voice'],
  }),
  wf('voice-lite-probe.yml', {
    id: 'voice-lite-probe', name: 'Voice-lite probe (a real clip, end to end)', purpose: 'Asks /voice-lite for a paragraph the way the app does and keeps the clip.',
    reads: [{ res: 'http:voice-lite', token: 'voice-lite' }], writes: [], seeds: [],
  }),
  rider('service:funnel', 'infra/nas-loops/loops/funnel_watchdog.py', {
    id: 'funnel', name: 'Public Funnel (the NAS’s front door)', purpose: 'Keeps the recorded sovereign routes served to the app’s proxy.',
    reads: [{ res: 'nas:services', file: 'infra/nas-loops/services.json', token: 'funnel' }], writes: [{ res: 'http:funnel', token: 'funnel' }], seeds: ['transport'],
  }),
  rider('loop:funnel-watchdog', 'infra/nas-loops/loops/funnel-watchdog.sh', {
    id: 'funnel-watchdog', name: 'Funnel watchdog (loop)', purpose: 'The same restore on its own clock.',
    reads: [{ res: 'nas:clock', file: 'infra/nas-loops/registry.json', token: 'funnel-watchdog' }], writes: [{ res: 'http:funnel', token: 'funnel_watchdog.py' }], seeds: ['transport'],
  }),
  app('app/functions/_lib/funnel-proxy.js', {
    id: 'transport', name: 'Same-origin transport to the NAS', purpose: 'Every NAS-backed route the app calls rides this proxy.',
    reads: [{ res: 'http:funnel', token: 'Funnel' }], seeds: [],
  }),
  rider('service:ytzero', 'infra/nas-ytzero/docker-compose.yml', {
    id: 'ytzero', name: 'YT Zero (chosen channels only)', purpose: 'A YouTube inbox of only the channels chosen, on our own box.',
    reads: [{ res: 'yt:channel', file: 'infra/nas-ytzero/README.md', token: 'RSS' }], writes: [{ res: 'nas:ytzero-inbox', file: 'infra/nas-ytzero/README.md', token: 'SQLite' }], seeds: [],
  }),
  rider('loop:health-check', 'infra/nas-loops/loops/health-check.sh', {
    id: 'health-check', name: 'Is-the-system-up probe (loop)', purpose: 'Probes each health target every 10 minutes; a failure rings the phone.',
    reads: [{ res: 'nas:clock', file: 'infra/nas-loops/registry.json', token: 'health-check' }], writes: [{ res: 'nas:reel', file: 'infra/nas-loops/run.mjs', token: '_reel.jsonl' }], seeds: ['mcp'],
  }),
  rider('loop:surface-audit', 'infra/nas-loops/loops/surface-audit.sh', {
    id: 'surface-audit', name: 'Surface audit (loop)', purpose: 'Runs the human-needs rubric against every surface.',
    reads: [{ res: 'nas:clock', file: 'infra/nas-loops/registry.json', token: 'surface-audit' }], writes: [{ res: 'nas:reel', file: 'infra/nas-loops/run.mjs', token: '_reel.jsonl' }], seeds: ['mcp'],
  }),
  rider('loop:transcript-backfill', 'infra/nas-loops/loops/transcript-backfill.sh', {
    id: 'transcript-backfill-loop', name: 'Transcript backfill (dedicated clock, off by record)', purpose: 'The same loader as the trickle on its own clock; combined into the trickle, off by record.',
    reads: [{ res: 'nas:clock', file: 'infra/nas-loops/registry.json', token: 'transcript-backfill' }], writes: [{ res: 'db:video_transcripts', token: 'load-transcripts.py' }], seeds: ['sermon-reader'],
  }),
];

// Every service rider and loop reads nas:services (the install services-sync
// did) — declared once here instead of on each node.
for (const n of NODES) {
  if (n.kind === 'nas' && n.id !== 'services-sync' && String(n.rider).startsWith('service:')) {
    n.reads = [...(n.reads || []), { res: 'nas:services', file: 'infra/nas-loops/services.json', token: n.rider ? n.rider.split(':')[1] : n.id }];
  }
}

// Every workflow's run result is a written resource; the flow proof reads it.
for (const n of NODES) {
  if (n.kind === 'workflow') {
    n.writes = [...(n.writes || []), { res: `gh:run:${n.workflow}`, token: 'runs-on:' }];
  }
}
const proof = NODES.find((n) => n.id === 'flow-proof');
proof.reads = [
  ...proof.reads,
  ...NODES.filter((n) => n.kind === 'workflow').map((n) => ({ res: `gh:run:${n.workflow}`, file: 'scripts/system-flow-proof.mjs', token: 'actions/workflows/' })),
];

// ---------------------------------------------------------------------------
// RESOURCES — what each carrier is, how it is measured live, sinks + sources.
// proof: { ts, fresh (days), consumed (SQL predicate), where (facet) }.
// ---------------------------------------------------------------------------
const RESOURCES = {
  'db:feedback': { label: 'feedback notes', proof: { ts: 'submitted_at', fresh: 14, consumed: "triage_status <> 'new'", where: "feedback_text !~* '^\\s*\\[learn engagement\\]'" } },
  'db:feedback#triaged': { label: 'feedback notes a steward has answered', proof: { ts: 'submitted_at', fresh: 30, where: "triage_status <> 'new' AND feedback_text !~* '^\\s*\\[learn engagement\\]'", consumed: "triage_status IN ('fixed','declined')" } },
  'db:concerns': { label: 'concerns', proof: { ts: 'updated_at', fresh: 21 } },
  'db:projects': { label: 'projects', proof: { ts: 'updated_at', fresh: 30 } },
  'db:incidents': { label: 'service-desk incidents', proof: { ts: 'updated_at', fresh: 60, consumed: "status IN ('resolved','closed','done','declined','duplicate')" } },
  'db:board_tasks': { label: 'board tasks', proof: { ts: 'updated_at', fresh: 14, consumed: "status = 'done'" } },
  'db:discussions': { label: 'discussions and hand-offs', proof: { ts: 'updated_at', fresh: 30 } },
  'db:decision_readouts': { label: 'the decision board’s daily record', proof: { ts: 'created_at', fresh: 3 } },
  'db:system_flow_proof': { label: 'the flow proof’s own readings', proof: { ts: 'measured_at', fresh: 1 } },
  'db:ops_commands': { label: 'operations queue', proof: { ts: 'created_at', fresh: 30, consumed: "status <> 'queued'" } },
  'db:ops_commands#finished': { label: 'operations finished by the NAS', proof: { ts: 'finished_at', fresh: 30, where: 'finished_at IS NOT NULL' } },
  'db:agent_inbox#lesson': { label: 'lessons sent from the app', proof: { ts: 'created_at', fresh: 30, where: "tags ? 'lesson' AND NOT tags ? 'voice' AND NOT tags ? 'voice-transcript' AND NOT tags ? 'voice-failed'", consumed: "tags ? 'mirrored'" } },
  'db:agent_inbox#voice': { label: 'spoken lessons waiting for Whisper', proof: { ts: 'created_at', fresh: 30, where: "tags ? 'voice'", consumed: "tags ? 'voice-transcribed' OR tags ? 'voice-failed'" } },
  'db:agent_inbox#lesson-review': { label: 'members\u2019 lessons the Governor decided', proof: { ts: 'reviewed_at', fresh: 30, where: "tags ? 'lesson-approved' OR tags ? 'lesson-declined'", consumed: "tags ? 'review-mirrored'" } },
  'db:agent_inbox#voice-transcript': { label: 'spoken lessons written down', proof: { ts: 'created_at', fresh: 30, where: "tags ? 'voice-transcript'", consumed: "tags ? 'mirrored'" } },
  'db:agent_inbox#poetech': { label: 'PoeTech requests relayed to the inbox', proof: { ts: 'created_at', fresh: 60, where: "tags ? 'tell-poetech'" },
    open: { blocker: 'Nothing reads these rows (measured 2026-09-24: no code, NAS job or routine reads the tell-poetech tag). The same words now also reach the feedback queue; this relay retires once a PoeTech request is seen landing there on the live database, not before (never dismantle what may still deliver until its replacement is proven).', reReview: '2026-10-01' } },
  'hosted:lesson-mirror': { label: 'lessons carried to the cloud reader (DR-0614)' },
  'db:saved_prompts': { label: 'kept prompts', proof: { ts: 'last_used_at', fresh: 30, consumed: 'use_count > 1' } },
  'db:agent_tasks': { label: 'questions to the models', proof: { ts: 'created_at', fresh: 30, consumed: "status <> 'queued'" } },
  'db:agent_tasks#answered': { label: 'answers from the NAS agent', proof: { ts: 'updated_at', fresh: 30, where: "status IN ('done','failed','error')" } },
  'db:family_secure_config': { label: 'family key published', proof: { ts: 'updated_at', fresh: 365 } },
  'db:choir_sermons': { label: 'service record', proof: { ts: 'updated_at', fresh: 14, consumed: 'service_date IS NOT NULL' } },
  'db:choir_songs': { label: 'songs', proof: { ts: 'created_at', fresh: 60 } },
  'db:video_transcripts': { label: 'service transcripts', proof: { ts: 'created_at', fresh: 7, consumed: "length(coalesce(text,'')) > 0" } },
  'db:video_harvests': { label: 'harvests recorded', proof: { ts: 'updated_at', fresh: 60 } },
  'db:sermon_video_stats': { label: 'video reach', proof: { ts: 'fetched_at', fresh: 2 } },
  'db:church_service_segments': { label: 'order of service', proof: { ts: 'updated_at', fresh: 30 } },
  'db:_sovereign_replay': { label: 'the live database’s migration ledger', proof: { ts: 'applied_at', fresh: 30 } },

  'event:use-prompt': { label: '“Put it in the box” (reuse a prompt)' },
  'device:family-key': { label: 'the family key on this device' },
  'code:lessons': { label: 'lessons written into the classes' },
  'file:audit-findings': { label: 'surface audit findings', source: 'Written by scripts/surface-audit.mjs, run on the NAS every 30 minutes and by an agent before a commit; the committed file is what the app reads.' },
  'file:decision-ledger': { label: 'the decision ledger', source: 'The decision records in docs/decisions, written by the sessions that decide.' },

  'mail:lesson': { label: 'forwarded “Lesson.” mail', source: 'Darrell forwards a lesson from his own mailbox.' },
  'yt:channel': { label: 'the church’s YouTube channel', source: 'The church publishes each service on its channel.' },
  'gh:branch': { label: 'a pushed branch', source: 'An agent session or a person pushes a branch.' },
  'gh:dispatch': { label: 'a hand dispatch', source: 'A person or a session dispatches a remote-hands workflow on purpose.' },
  'gh:signal-pr': { label: 'the lesson signal PR (#1346)' },
  'gh:pr': { label: 'pull requests' },
  'gh:check': { label: 'the gates’ verdict' },
  'gh:main': { label: 'main (merged)' },
  'gh:deploy-heal': { label: 'a deploy dispatch' },
  'gh:migrate-heal': { label: 'a migration dispatch' },
  'gh:rls-dispatch': { label: 'the isolation matrix dispatch' },
  'gh:heal-nas': { label: 'a NAS heal dispatch' },
  'gh:incident': { label: 'incident issues (the downtime ledger)' },
  'gh:release': { label: 'the app release' },
  'gh:review-issue': { label: 'due re-review items', sink: 'A due re-review opens an issue a steward works; the ledger itself is the record.' },
  'site:poetech.us': { label: 'the live site' },
  'hosted:db': { label: 'the retired hosted database' },
  'http:nas-photos': { label: 'photo server on the NAS', route: '/nas-photos' },
  'http:voice': { label: 'the reading voice studio', route: '/voice' },
  'http:voice-lite': { label: 'the NAS audio voice (Piper)', route: '/voice-lite' },
  'http:taxes': { label: 'the tax archive on the NAS', route: '/taxes' },
  'http:taxes-upload': { label: 'a tax document uploaded', route: '/taxes' },
  'nas:mirror': { label: 'the NAS repo mirror' },
  'nas:clock': { label: 'the NAS loop clock' },
  'nas:services': { label: 'installed NAS services' },
  'nas:reel': { label: 'the NAS event reel' },
  'nas:smtp': { label: 'the sign-in mail sender' },
  'nas:storage': { label: 'the live file storage' },
  'nas:agent-credential': { label: 'the NAS agent’s credential' },
  'nas:scribe-queue': { label: 'Scribe recordings waiting' },
  'nas:scribe-minutes': { label: 'Scribe transcripts + minutes' },
  'http:scribe-results': { label: 'what each recording became, read back', route: '/scribe' },
  'nas:ytzero-inbox': { label: 'the chosen-channels inbox', sink: 'Darrell reads it himself at its LAN page (port 3701); it is a personal inbox by design, not data another workflow uses.' },
  'nas:wf18-bearer': { label: 'the n8n wf18 bearer', open: { blocker: 'Its only reader is n8n wf18, which leaves by Darrell’s decision (DR-0617, PR #1774). This workflow leaves with n8n once wf18’s replacement is proven.', reReview: '2026-10-01' } },
  'auth:users': { label: 'sign-in accounts' },
  'db:push_subscriptions': { label: 'devices that asked for notifications', proof: { ts: 'last_seen_at', fresh: 30 } },
  'db:door_feedback': { label: 'door feedback + fault reports', proof: { ts: 'created_at', fresh: 30, consumed: "status <> 'new'" } },
  'db:push_outbox': { label: 'office pushes waiting', proof: { ts: 'created_at', fresh: 30, consumed: 'sent_at IS NOT NULL' } },
  'db:push_outbox#sent': { label: 'office pushes delivered', proof: { ts: 'sent_at', fresh: 30, where: 'sent_at IS NOT NULL' },
    open: { blocker: 'The drain ships OFF until a real phone is proven to receive a push (DR-0400 / DR-0334) — a phone in a person’s hand is the proof, which this session cannot hold. Until then the outbox fills and the board shows every fault.', reReview: '2026-10-01' } },
  'http:push-send': { label: 'a push sent' },
  'push:phone': { label: 'a notification on a phone', sink: 'A person reads it on their phone.' },
  'cf:push-env': { label: 'the push sender’s settings' },
  'tower:voice-studio': { label: 'the reading-voice studio on the tower' },
  'auth:hook': { label: 'the renter-portal sign-in hook', sink: 'GoTrue calls it on every renter sign-in; its effect is the renter portal’s own access, proven by the renter-portal isolation smokes.' },
  'tailnet:nodes': { label: 'the always-on devices', source: 'The tailnet itself reports which devices answer.' },
  'http:mcp': { label: 'the MCP server' },
  'web:primary-records': { label: 'the historical primary records', source: 'Yale Avalon, Cornell LII, the National Archives, Gutenberg and the other named record holders.' },
  'file:source-transcripts': { label: 'a sent video’s transcript text' },
  'http:scribe-upload': { label: 'a Scribe recording uploaded', route: '/scribe' },
  'http:supabase': { label: 'the live database’s API', route: '/sb' },
  'http:funnel': { label: 'the NAS’s public routes' },
};

// ---------------------------------------------------------------------------
// LOOPS — the chains that must close into continuous loops.
// ---------------------------------------------------------------------------
const LOOPS = [
  { id: 'feedback-loop', name: 'Feedback → triage → the sender’s receipt → new feedback', path: ['feedback-door', 'feedback-queue'] },
  { id: 'fix-loop', name: 'Feedback → the fix ships naming it → the note reads Fixed → the sender', path: ['feedback-door', 'feedback-fixed'] },
  { id: 'ops-loop', name: 'Ops command → NAS runner → outcome back in the app', path: ['ops-queue', 'ops-runner'] },
  { id: 'models-loop', name: 'Question → NAS agent → answer in the pane', path: ['chat-pane', 'agent-consumer'] },
  { id: 'prompt-loop', name: 'Prompt sent → kept → put back in the box → sent again', path: ['one-voice', 'prompt-history'] },
  { id: 'monitor-loop', name: 'Every workflow’s run → the flow proof → the operations board', path: ['site-health', 'flow-proof', 'ops-board'],
    open: { blocker: 'The board’s escalations reach a steward, who fixes and ships; the next proof run shows the connection flowing again. That return passes through a person by design (the Governor decides), so this loop closes through the delivery lane, not a table.', reReview: '2026-10-24' } },
  { id: 'scribe-loop', name: 'A recording → our own Whisper → its words back on the Scribe screen', path: ['scribe-surface', 'scribe'] },
  { id: 'lane-loop', name: 'Merge → deploy → site witness → heal → deploy', path: ['deploy', 'site-health'] },
];

// Chains shown on the surface, in reading order (phone-first list).
const CHAINS = [
  { id: 'feedback', name: 'Feedback and triage', nodes: ['feedback-door', 'feedback-queue', 'feedback-fixed', 'feedback-receipt', 'concerns-board', 'projects', 'itsm-incidents', 'board-tasks', 'decision-board'] },
  { id: 'lessons', name: 'Lesson intake', nodes: ['lesson-mail-watch', 'lesson-door', 'lesson-voice', 'voice-intake-health', 'lesson-inbox', 'lesson-capture', 'learn'] },
  { id: 'prompts', name: 'Prompt history', nodes: ['one-voice', 'prompt-history'] },
  { id: 'ops', name: 'Operations queue', nodes: ['ops-queue', 'ops-runner', 'ops-queue-health', 'ops-surface'] },
  { id: 'models', name: 'Ask the models', nodes: ['chat-pane', 'agent-consumer'] },
  { id: 'sermons', name: 'Transcripts → sermons → The Word', nodes: ['choir-dates', 'transcript-trickle', 'transcript-backfill', 'video-stats', 'content-sync', 'sermon-store', 'sermon-reader', 'harvest-ledger', 'scripture-web', 'library', 'songbook', 'harvest-health', 'corpus-reconcile'] },
  { id: 'family-key', name: 'The family key', nodes: ['family-key', 'bridge-provision', 'nas-photos', 'voice-studio', 'books-taxes'] },
  { id: 'health', name: 'Site health → incidents → operations readout', nodes: ['site-health', 'level-witness', 'node-availability', 'harvest-health', 'ops-queue-health', 'ops-surface', 'ops-board'] },
  { id: 'decisions', name: 'Decision readouts, the flow proof and the operations board', nodes: ['decision-board', 'flow-proof', 'ops-board', 'flow-surface'] },
  { id: 'scribe', name: 'Scribe: recording → words → back to the person', nodes: ['scribe-surface', 'scribe', 'scribe-transcribe'] },
  { id: 'lane', name: 'Delivery lane', nodes: ['auto-open-pr', 'ci', 'auto-merge', 'deploy', 'deploy-freshness', 'db-migrate', 'migrate-freshness', 'rls-isolation', 'schema-health', 'pr-janitor'] },
];

export const SYSTEM_FLOW = { nodes: NODES, resources: RESOURCES, loops: LOOPS, chains: CHAINS };
