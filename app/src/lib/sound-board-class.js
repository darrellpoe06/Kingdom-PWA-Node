// =============================================================================
// sound-board-class — "Running the Board: Live Sound for the House of God"
// =============================================================================
// A Word-first, SELF-PACED training track for the COLG sound team — how to run the
// live mixing board for worship: the signal chain, gain staging, EQ fundamentals
// (the real frequency ranges), taming feedback, monitors vs the house mix, mixing
// the worship team and the CHOIR, and the three services of the operator (BEFORE /
// DURING / AFTER a service). It rides the SAME shared Learn engine as the other
// PoeTech / COLG courses — the generic helpers in church-classes.js, the self-driving
// tutor (class-tutor.js → askTutor), and the multi-modal lesson schema + age/
// experience-adaptive levels + quiz + graduate→helper from learn-framework.js. Like
// "Living Lessons," it is SELF-PACED (a sound-team member joins and trains whenever
// they step up to the board), so it sets `meta.unit` to render rows as "Lessons"
// instead of weekly cohort sessions (a small, back-compatible label layer; the four
// weekly cohort courses, which set no `meta.unit`, are unchanged).
//
// SOURCE / SME (COMMUNITY-FIRST, faithful extraction):
//   The seed content here is authored to be ENRICHED and VERIFIED by the church's
//   own sound engineer (the SME) through the sovereign SME video pipeline
//   (`infra/nas-sme-pipeline/` — the sound-engineer lesson profile, the sibling of
//   the choir-keyboardist profile). His real, captured instruction layers on top of
//   this scaffold; the pipeline never invents technique he didn't teach. His
//   expertise is the asset — this file is the shape it pours into.
//
// VERIFICATION / NO-FABRICATION (DR-0076, and the Source-of-Answers rule):
//   • The AUDIO ENGINEERING is real and checkable: the frequency ranges, the
//     gain-staging target, the feedback loop + ring-out technique, the high-pass /
//     EQ-lane discipline, and the monitor-vs-FOH split are stated as the established
//     practice they are — not invented. Where a value is a rule-of-thumb (e.g. a
//     healthy digital gain target ~ -18 dBFS), it is named as a rule-of-thumb, not a
//     hard law, because consoles and rooms differ.
//   • SCRIPTURE is cited by REFERENCE with a plain-language theme gloss — NOT a
//     quoted translation — per SCRIPTURE-REFERENCE-STANDARD (do not present a
//     paraphrase as a translation; fetch the actual translation if a quote is ever
//     wanted). The anchors are real worship-music / order-of-service passages
//     (Chenaniah the skillful music leader, "play skillfully," "decently and in
//     order," the Spirit-given craftsman, work heartily as for the Lord).
//   • WELL-BEING-POSITIVE + servant-framed: the operator serves so the WORD is heard
//     and the worship carries; skill is a calling and an offering, never a stage for
//     the operator. Hearing-safety (responsible loudness) is named as care for the
//     congregation, not an afterthought.
//
// SAFETY TIE (the AI-assist sibling): a local-AI EQ/mix ASSISTANT is specced
// separately (GPU-gated — `docs/99-session-notes/2026-06-24-live-sound-eq-mix-ai-
// assist-spec.md`). Binding there and echoed here: any A.I. is ASSISTIVE — it
// suggests; the human operator decides and acts. Nothing auto-changes a live mix.
// =============================================================================

// Self-paced: no cohort, no weekly clock. These exports mirror the other courses so
// the host wiring is identical, but the start is null (no painted dates) and the UI
// reads "Self-paced."
export const SOUND_BOARD_PROPOSED_COHORT_START = null;
export const SOUND_BOARD_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const SOUND_BOARD_META = {
  key: 'sound-board',
  title: 'Running the Board: Live Sound for the House of God',
  audience: 'the COLG sound team — and anyone learning to run live sound for worship',
  tagline: 'Mix so the Word is heard and the worship carries — skillfully, and in order.',
  format: 'Self-paced · learn right at the board, alone or with the sound engineer · paced to your experience',
  cadenceDays: 7,
  weeks: 7, // seven lessons today; the track grows as the sound engineer teaches more
  handsOnLabel: 'Take it to the board',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to learn it (at the board, alone or with the engineer)',
    countNoun: 'lesson',
  },
  footer: '_Built for the Church of the Living God sound team · taught with the church’s own sound engineer · on PoeTech. Skill is a calling (1 Chronicles 15:22) and an offering (Colossians 3:23) — we mix so the Word is heard and the worship carries, decently and in order. Sovereign and local; the A.I. assistant only ever suggests — a person runs the board._',
};

// A practical learning rhythm for time AT the board — not a lecture clock.
export const SOUND_BOARD_SESSION_FLOW = [
  { minutes: 3, name: 'Pray + read the anchor — we serve the Word' },
  { minutes: 10, name: 'The big idea, in plain words' },
  { minutes: 15, name: 'Go deeper — the real technique' },
  { minutes: 20, name: 'Hands-on at the board (or the virtual console)' },
  { minutes: 7, name: 'Check yourself + take it to the next service' },
];
export const SOUND_BOARD_SESSION_MINUTES = SOUND_BOARD_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const SOUND_BOARD_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'snd1-the-board-and-the-signal-chain',
    title: 'The board and the signal chain',
    bigIdea: 'Before you touch a knob, know where the sound goes. Every voice and instrument is a SIGNAL that travels a chain: source → microphone or DI → input (gain) → channel strip (EQ, dynamics, fader) → bus → the mains (the house) and the monitors (the stage). The board is just the place you shape that journey. Master the map and nothing on the console is mysterious — every control is one stop on the path.',
    inApp: 'Stand at the board and trace ONE channel end to end out loud: “the lead vocal mic plugs into input 1, its gain sets the level, the channel strip shapes it, the fader sends it to the mains and to the monitor.” Find the input, the gain, the EQ, the fader, the mute, and the monitor send for that one channel before you do anything else.',
    anchor: {
      ref: '1 Corinthians 14:40; 1 Corinthians 14:33',
      theme: 'Everything in the gathering is to be done decently and in order, because God is a God of peace, not confusion. The signal chain IS that order made physical — sound moving cleanly from source to room so the gathering is clear, not chaotic.',
    },
    benefits: [
      'The console stops being a wall of mystery knobs — every control is just one stop on a path you can name.',
      'You can find and fix a dead channel fast, because you know the order sound travels.',
      'Confidence to sit down at any board — the layout changes, the signal chain never does.',
      'A calm, ordered start that serves the gathering instead of fighting it.',
    ],
    levels: {
      teen: 'Think of the board like the plumbing for sound. A voice goes into a microphone, the microphone plugs into an input on the board, and from there the sound flows through a little assembly line called a channel strip — first the GAIN (how strong the signal is), then EQ (the tone), then the FADER (the volume going out). From the fader the sound goes two places: the MAINS (the big speakers the church hears) and the MONITORS (the smaller speakers so the singers can hear themselves). That whole path — source to mic to input to strip to speakers — is the signal chain. Once you can point to each stop for one channel, you understand the whole board, because every channel does the exact same thing. Don’t memorize knobs; learn the path the sound takes.',
      senior: 'For someone who has run sound before, the value here is naming the chain precisely so troubleshooting is deductive, not guesswork: source → transducer (dynamic/condenser mic, or a DI for a line/instrument source) → preamp gain/trim (where the signal is brought to a healthy operating level) → the channel strip in order (high-pass filter, EQ, dynamics/compression, then the channel fader) → bus routing (the main L/R, plus aux/monitor sends, plus any subgroups and effects sends) → the outputs (mains to the house system, aux sends to wedges or in-ear monitors). When something is wrong, you walk the chain in order: is there signal at the input (gain/meter), is the channel unmuted and the fader up, is it routed to the bus you expect, is the bus up, is the amp/speaker live. The console layout differs box to box (analog vs digital, scenes/layers, DCAs), but the chain is invariant — that invariance is what lets a seasoned operator sit down at an unfamiliar desk and be productive in minutes.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the correct order of the basic signal chain?',
          options: [
            'Fader → EQ → gain → microphone → speaker',
            'Source → mic/DI → gain (input) → channel strip (EQ, dynamics, fader) → bus → mains + monitors',
            'Speaker → monitor → board → microphone',
          ],
          answer: 1,
          explain: 'Sound travels source → mic/DI → input gain → the channel strip → the bus → out to the mains and the monitors. Knowing the order is how you find a problem fast.',
        },
        {
          q: 'Where does a channel’s sound go AFTER the fader?',
          options: [
            'Only to the microphone',
            'To the mains (the house) and, via the monitor send, to the stage monitors',
            'Nowhere — the fader is the last stop',
          ],
          answer: 1,
          explain: 'The fader feeds the main bus (the house) and the channel’s monitor/aux sends feed the stage — one channel, two destinations with different needs.',
        },
      ],
    },
    lesson: 'A live mixing board looks like a wall of identical strips, and that look scares new operators into memorizing knobs. Don’t. Learn the PATH the sound takes, and every knob explains itself. The path is called the signal chain, and it is the same for every voice and instrument in the room. It starts at the SOURCE — a singer, a preacher, a guitar, the keys. The source has to become an electrical signal, so it goes into a MICROPHONE (for a voice or an amp or a drum) or a DI box (for a keyboard or an electric instrument plugged in directly). That signal arrives at an INPUT on the board, and the very first control is GAIN (sometimes called trim): how strongly the board grabs that signal. Gain is so important it gets its own lesson next — get it wrong and nothing downstream can save you. After gain, the signal flows down a little assembly line called the CHANNEL STRIP, in order: usually a high-pass filter (to roll off rumble), then EQ (tone shaping), then dynamics like a compressor (evening out the loud and soft), and finally the channel FADER (the volume that channel sends out). From the fader the signal goes to a BUS — most importantly the MAIN bus, which feeds the house speakers (the “mains,” or “front of house”) that the congregation hears. But the same channel also feeds MONITOR sends (aux sends) that go to the speakers on stage — wedges or in-ear monitors — so the musicians can hear themselves. That is the whole board: many identical channels, each carrying one source down the same chain to the same two kinds of destinations. This is why order matters spiritually too — Scripture says the gathering should be done decently and in order, because God is not a God of confusion but of peace (1 Corinthians 14:40, 14:33). A clean signal chain is that order made physical: sound moving cleanly from a voice to the room so the Word is heard and the worship carries, instead of a chaotic mess that pulls people out of worship. When you can stand at any board and trace one channel from its input to the mains and the monitor, you have the map. Everything else in this track is just learning to shape what travels along it.',
    facilitator: {
      talkingPoints: [
        'Teach the PATH, not the panel: source → mic/DI → gain → channel strip (HPF, EQ, dynamics, fader) → bus → mains + monitors. Every knob is one stop on it.',
        'Two destinations from one channel: the mains (what the house hears) and the monitor sends (what the stage hears) — different needs, same source.',
        'Troubleshooting is just walking the chain in order: signal at input? unmuted, fader up? routed to the right bus? bus up? amp/speaker live?',
        'The layout changes board to board; the chain never does. That is what lets you sit down at any console.',
        'Order is ministry: "decently and in order" (1 Cor 14:40) — a clean chain serves the gathering; chaos pulls people out of worship.',
      ],
      howToRun: 'Pray + read the anchor (3): pray, read 1 Corinthians 14:40 — we serve order so the Word is heard. | The big idea (10): walk to the board and physically trace one channel; have the learner point to each stop. | Go deeper (15): name the channel-strip order (HPF → EQ → dynamics → fader) and the two destinations (mains + monitor). | Hands-on at the board (20): the learner traces THREE different channels (a vocal, an instrument, the choir mic) end to end, out loud. | Check yourself + next service (7): troubleshoot a "dead channel" together by walking the chain in order.',
      discussionPrompts: [
        'Trace your own voice from the mic to the congregation’s ears — name every stop.',
        'A channel is silent in the house but the singer hears themselves on stage. Where in the chain is the problem likely to be?',
        'Why does “decently and in order” matter for the person running sound, not just the people on stage?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd2-gain-staging',
    title: 'Gain staging — get it right at the source',
    bigIdea: 'Gain (trim) is the most important knob on the board and the one beginners ignore. It sets how strong each signal is the moment it enters — before EQ, before the fader. Set it too low and you fight noise and hiss all night; set it too high and it distorts and clips, and no fader can un-distort it. Aim for a healthy, consistent level on every input first. Good gain staging is the clean foundation the whole mix is built on — garbage in, garbage out.',
    inApp: 'Ring out the gain on every input before you mix anything. One at a time: have the source make sound at its LOUDEST realistic level (the singer belts, the drummer hits hard), then bring that channel’s gain up until the meter sits in the healthy zone and peaks short of clipping — not into the red. Do it for every channel so they all start even.',
    anchor: {
      ref: 'Luke 6:48; 1 Corinthians 3:10',
      theme: 'The house that stood through the flood was the one dug deep and founded on the rock; a wise builder lays the foundation with care because everything rests on it. Gain staging is the foundation of the mix — get the base right and everything built on it stands.',
    },
    benefits: [
      'A clean, quiet, distortion-free mix that holds up loud or soft — no hiss, no crackle.',
      'Faders that actually work, because every channel starts from a healthy level.',
      'Far fewer “why does this sound bad?” mysteries — most bad sound is bad gain.',
      'Headroom to handle the loud moment (the full choir, the shout) without clipping.',
    ],
    levels: {
      teen: 'Gain is the first knob the sound hits when it comes into the board, and it decides how strong that signal is. Here’s the trap: people leave gain wherever it is and try to fix everything with the fader (the volume slider). That doesn’t work. If the gain is too LOW, you have to crank everything later and you get hiss and noise — like turning a quiet recording way up. If the gain is too HIGH, the signal distorts and clips — it crackles and sounds nasty, and pulling the fader down just gives you quieter nasty. So you set gain FIRST, one channel at a time: have the singer sing as loud as they really will, watch the meter, and turn the gain up until the meter is healthy (good and strong) but stops short of the red. Do that for every input. Now every channel starts even and clean, and your faders are free to actually mix. Gain first, fader second. Always.',
      senior: 'Gain staging is the discipline of keeping signal at a healthy operating level at every stage so you maximize signal-to-noise without ever clipping. On a digital console a common rule-of-thumb target is to set input gain so the channel averages around -18 dBFS with peaks reaching roughly -6 to -10 dBFS, leaving real headroom (the -18 dBFS reference corresponds roughly to 0 VU / +4 dBu on the analog world many of us came up in). It’s a rule-of-thumb, not a law — consoles, converters, and sources differ — but the principle is universal: enough level to bury the noise floor, enough headroom that the loudest real moment doesn’t clip. Set it with the source at its true performance level, not a polite soundcheck mumble, or you’ll re-gain mid-service. Watch for the subtler traps: a compressor with heavy makeup gain or a big EQ boost adds gain downstream, so re-check the post-processing level; and on digital desks remember the channel can clip at the input even if the fader is low, because gain is pre-fader. Unity gain through the chain, consistent input levels across channels, and disciplined headroom is what makes a mix sound “clean” — and it’s why faders behave. The fader is for mixing; gain is for staging. Conflating the two is the single most common cause of an amateur-sounding house.',
    },
    quiz: {
      questions: [
        {
          q: 'You set the gain too high and the channel is distorting. What fixes it?',
          options: [
            'Pull the channel fader down',
            'Turn the input gain down so the signal stops clipping at the source',
            'Add more EQ',
          ],
          answer: 1,
          explain: 'Clipping happens at the input, before the fader. Lowering the fader just gives you quieter distortion — you have to fix the gain at the source.',
        },
        {
          q: 'When should you set gain, and at what source level?',
          options: [
            'After the mix is built, with the source at any level',
            'FIRST, with the source at its loudest realistic performance level, aiming for a healthy meter that peaks short of clipping',
            'Only if a channel sounds bad',
          ],
          answer: 1,
          explain: 'Gain is the foundation — set it first, with the source performing at its true level, so every channel starts clean and even with real headroom.',
        },
      ],
    },
    lesson: 'If you only master one thing on this whole board, make it gain staging — because it is the foundation the entire mix is built on, and a foundation laid wrong makes everything above it shaky. Gain (also called trim) is the very first control the signal meets when it enters a channel, and it sets how strong that signal is BEFORE the EQ and BEFORE the fader. New operators almost universally make the same mistake: they leave gain wherever it happens to be and try to fix every level problem with the fader. It doesn’t work, for a simple reason. If the gain is too LOW, the signal is weak, so you end up pushing everything downstream hard to hear it — and you amplify the noise floor right along with it, so the channel hisses and sounds thin. If the gain is too HIGH, the signal overloads and CLIPS — it distorts, crackles, and sounds harsh — and because clipping happens at the input, before the fader, pulling the fader down only gives you quieter distortion. The damage is already done. So the workflow is: set gain FIRST, one input at a time, with the source performing at its real, loudest level — the singer actually belting, the drummer actually hitting hard, not a timid soundcheck. Bring the gain up until the meter sits in the healthy zone and the loudest peaks stop short of the red. A useful rule-of-thumb on a digital desk is to aim for an average around -18 dBFS with peaks up to roughly -6 dBFS — plenty of signal, plenty of headroom — but treat it as a guide, not a law, because rooms and consoles differ. Do this for every channel and two things happen: the whole mix gets quiet and clean (great signal-to-noise), and your faders finally do their real job, which is mixing, because every channel now starts from the same healthy place. Watch one subtle trap: anything that adds gain downstream — a compressor’s makeup gain, a big EQ boost — can push a well-set channel back into clipping, so re-check after you process. This is why Scripture’s picture of the wise builder fits so well: the house that stood through the storm was the one founded deep on the rock (Luke 6:48), and the wise builder lays the foundation with care because everything rests on it (1 Corinthians 3:10). Gain staging is that foundation. Get the base right and everything you build on top of it — EQ, balance, the whole worship set — stands.',
    facilitator: {
      talkingPoints: [
        'Gain is FIRST and it is pre-fader: it sets the signal’s strength before EQ and the fader. Most "bad sound" is bad gain.',
        'Too low → noise/hiss when you push downstream. Too high → clipping/distortion that no fader can undo.',
        'Set it with the source at its TRUE loudest performance level, not a polite soundcheck — or you’ll re-gain mid-service.',
        'Rule-of-thumb (digital): ~ -18 dBFS average, peaks to ~ -6 dBFS. A guide, not a law — rooms and desks differ.',
        'Re-check level after a compressor’s makeup gain or a big EQ boost — downstream gain can re-clip a good channel.',
        'Foundation theology: the wise builder founds on the rock (Luke 6:48) — get the base right and the mix stands.',
      ],
      howToRun: 'Pray + read the anchor (3): read Luke 6:48 — build on the rock. | The big idea (10): demonstrate gain-first vs fader-first; let them hear hiss (too low) and clipping (too high). | Go deeper (15): show the meter, the healthy zone, the headroom target; explain pre-fader clipping. | Hands-on at the board (20): the learner gain-stages every input with sources at real performance level. | Check yourself + next service (7): add a compressor with makeup gain and watch them catch the re-clip.',
      discussionPrompts: [
        'Why can’t the fader fix a clipping channel?',
        'What goes wrong over a whole service if you gain-stage to a timid soundcheck instead of the real performance level?',
        'How is laying gain right like a builder laying a foundation?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd3-eq-the-frequency-ranges',
    title: 'EQ and the frequency ranges',
    bigIdea: 'EQ (equalization) shapes TONE by turning specific frequency ranges up or down. The audible spectrum runs from deep sub-bass (~20 Hz) to airy highs (~20 kHz), and every range has a job: lows are weight and warmth, low-mids hide mud, mids carry body, high-mids carry clarity and intelligibility, highs add air and sparkle. The pro instinct is to CUT before you boost — remove what’s muddy or harsh rather than piling on more. Subtractive EQ, used surgically, is how a crowded worship mix becomes clear.',
    inApp: 'Practice the “sweep and cut.” On a vocal channel, take a narrow EQ band, boost it a lot, and sweep it slowly through the low-mids (around 200–500 Hz) until you find the boxy, muddy spot — then CUT it a few dB instead. Then high-pass the channel below ~100 Hz to clear out rumble. Notice how cutting makes the voice clearer than any boost did.',
    anchor: {
      ref: '1 Corinthians 14:7-9; Psalm 33:3',
      theme: 'Paul’s point about instruments: if the notes are not DISTINCT, no one knows what is played; speech must be intelligible or it is just air. EQ serves intelligibility — carving each voice and instrument so the Word and the worship come through clear and distinct. And we are called to play skillfully (Psalm 33:3); skillful tone-shaping is part of that craft.',
    },
    benefits: [
      'A clear mix where every voice and instrument has its own space, instead of a muddy wall of sound.',
      'Vocals and the spoken Word that cut through and stay intelligible without being painfully loud.',
      'The skill to fix “muddy,” “boxy,” “harsh,” or “thin” on the spot — because you know where those live.',
      'Less ear fatigue for the congregation, because you removed the harsh frequencies instead of adding more.',
    ],
    levels: {
      teen: 'EQ is the tone control — it lets you turn certain pitches up or down. Sound is made of frequencies, measured in hertz (Hz): low numbers are deep/bass sounds, high numbers are bright/treble sounds. Here’s a simple map. The LOWS (under ~250 Hz) are the deep weight — bass and kick drum. The LOW-MIDS (250–500 Hz) are where “mud” and “boxiness” hide. The MIDS (500 Hz–2 kHz) are the body of most sounds. The HIGH-MIDS (2–6 kHz) are clarity — this is where you understand words. The HIGHS (above 6 kHz) are air and sparkle. The big secret the pros use: when something sounds bad, CUT the bad part instead of boosting more. If a voice sounds muddy, find the muddy frequency (sweep around 200–400 Hz) and turn it DOWN. If it sounds thin, you might add a little up high. Less is more. And almost every channel that isn’t bass should get a “high-pass filter” — that just removes the useless deep rumble below the voice so the mix isn’t cluttered. Cut first, boost rarely, and the mix gets clear.',
      senior: 'A practical frequency map for a worship mix, with the moves that matter: Sub-bass 20–60 Hz (felt more than heard — kick/bass extension; high-pass almost everything else out of here). Bass 60–250 Hz (fundamental weight and warmth; the 200–300 Hz region is where buildup turns to mud across many channels at once). Low-mids 250–500 Hz (boxiness/honk; usually a cut zone). Mids 500 Hz–2 kHz (body and presence, but 800 Hz–1 kHz can get nasal/“honky”). High-mids/presence 2–6 kHz (intelligibility and attack — the consonants that make a vocal or the preacher understandable; also where harshness lives around 3–4 kHz, so boost with care). Highs/air 6–20 kHz (sheen and sparkle; ~6–8 kHz is also sibilance — the harsh “sss” — which is why a de-esser lives here). The disciplines that separate pros: (1) subtractive first — sweep-and-cut to remove the offending resonance rather than boosting its neighbors, which keeps gain and headroom under control; (2) high-pass aggressively — roll off everything below a source’s real low end (vocals ~80–120 Hz, most instruments accordingly) so the low end isn’t a mud pile of forty channels’ worth of rumble; (3) carve complementary lanes — if the kick owns 60–80 Hz, give the bass its own pocket; if guitars and keys fight in the mids, cut a window in one for the other; (4) narrow Q for surgical cuts (killing a resonance), wider Q for musical tone shaping. EQ is not about making one channel sound great soloed — it’s about making everything fit together so each element is distinct in the whole. That is exactly Paul’s point in 1 Corinthians 14: if the notes aren’t distinct, no one knows the tune; intelligibility is the goal.',
    },
    quiz: {
      questions: [
        {
          q: 'A vocal sounds muddy and boxy. What’s the pro first move?',
          options: [
            'Boost the high frequencies a lot',
            'Sweep the low-mids (~250–500 Hz) to find the offending frequency and CUT it',
            'Turn the whole channel up',
          ],
          answer: 1,
          explain: 'Mud and boxiness live in the low-mids. Subtractive EQ — find it and cut it — clears the voice far better than boosting more on top.',
        },
        {
          q: 'Which range carries intelligibility — the consonants that make words understandable?',
          options: [
            'Sub-bass, 20–60 Hz',
            'High-mids / presence, roughly 2–6 kHz',
            'Nothing — clarity is about volume',
          ],
          answer: 1,
          explain: 'The presence range (~2–6 kHz) is where consonants and attack live, which is why it carries intelligibility for vocals and the spoken Word.',
        },
        {
          q: 'Why high-pass filter most non-bass channels?',
          options: [
            'It makes them louder',
            'It rolls off useless low rumble so the low end isn’t a cluttered mud pile of many channels',
            'It adds sparkle',
          ],
          answer: 1,
          explain: 'A high-pass filter removes sub-bass rumble a source doesn’t need, so the combined low end stays clean instead of forty channels of mud stacking up.',
        },
      ],
    },
    lesson: 'EQ — equalization — is how you shape TONE, by turning specific bands of frequency up or down. To use it well you need a mental map of the spectrum, because every range has a job. Human hearing runs roughly 20 Hz to 20 kHz. The SUB-BASS (about 20–60 Hz) is felt more than heard — the deep extension of the kick and bass; almost everything else should have it filtered out. The BASS (about 60–250 Hz) is fundamental weight and warmth, and the 200–300 Hz region is exactly where “mud” builds up when many channels pile low energy together. The LOW-MIDS (250–500 Hz) are where “boxy” and “honky” live — usually a place you cut. The MIDS (500 Hz–2 kHz) are the body of most sounds, though 800 Hz–1 kHz can get nasal. The HIGH-MIDS or PRESENCE range (about 2–6 kHz) is the most important range in church audio, because it carries INTELLIGIBILITY — the consonants and attack that make a vocal or the preacher’s words understandable; it’s also where harshness lurks around 3–4 kHz, so you boost it carefully. The HIGHS (above 6 kHz) are air and sparkle, and 6–8 kHz is also where sibilance — the harsh “ess” sound — lives. Now the technique that separates a pro from a beginner: CUT before you boost. When something sounds wrong, the instinct of the beginner is to add — more highs, more bass. The instinct of the pro is to remove what’s offending. If a voice is muddy, you don’t boost the highs to compensate; you sweep through the low-mids to find the muddy frequency and cut it. This “subtractive EQ” keeps your gain and headroom under control and makes the channel clearer than any boost could. Two more disciplines make the biggest difference in a crowded worship mix. First, HIGH-PASS aggressively: put a high-pass filter on everything that isn’t bass — vocals around 80–120 Hz, most instruments accordingly — so the combined low end isn’t a mud pile of every channel’s rumble stacked together. Second, carve COMPLEMENTARY LANES: if the kick owns the deep low end, give the bass guitar its own pocket above it; if the keys and the electric guitar are fighting in the mids, cut a window in one to make room for the other. The goal is never to make one channel sound huge by itself — it’s to make everything FIT so each element stays distinct in the whole. That is precisely Paul’s argument in 1 Corinthians 14:7–9: if a flute or harp doesn’t give distinct notes, no one knows the tune; if a trumpet’s call is unclear, no one prepares for battle; and speech that isn’t intelligible is just air. EQ in the house of God serves that distinctness — so the worship and the Word come through clear. And it’s craft: “play skillfully” (Psalm 33:3) applies to the one shaping the tone just as much as the one playing the notes.',
    facilitator: {
      talkingPoints: [
        'Give them the map: sub-bass 20–60, bass 60–250 (mud ~200–300), low-mids 250–500 (boxy), mids 500–2k (nasal ~800–1k), presence 2–6k (intelligibility + harsh ~3–4k), air 6k+ (sibilance ~6–8k).',
        'CUT before you boost (subtractive EQ): find the offending frequency by sweep-and-cut; it beats boosting on top and keeps headroom.',
        'High-pass aggressively — vocals ~80–120 Hz, most non-bass channels accordingly — so the low end isn’t forty channels of mud.',
        'Carve complementary lanes: kick vs bass, keys vs guitar — make room rather than turning everything up.',
        'Narrow Q to kill a resonance, wide Q for musical shaping. The goal is FIT in the whole, not a great soloed channel.',
        'Intelligibility is the point: 1 Cor 14:7–9 — distinct notes, clear speech — and "play skillfully" (Ps 33:3) is the craft.',
      ],
      howToRun: 'Pray + read the anchor (3): read 1 Corinthians 14:7–9 — make it distinct. | The big idea (10): play a muddy vocal, then a cut-clean one; let them HEAR subtractive EQ. | Go deeper (15): walk the frequency map; demo the sweep-and-cut and a high-pass. | Hands-on at the board (20): learner sweeps-and-cuts a vocal, high-passes it, then carves keys vs guitar. | Check yourself + next service (7): have them name the range for "muddy," "boxy," "harsh," "thin," "no air."',
      discussionPrompts: [
        'Why does cutting a muddy frequency beat boosting the highs to compensate?',
        'Where does intelligibility live, and why does that matter most for the spoken Word?',
        'How is carving frequency lanes like making room for each voice in a choir?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd4-taming-feedback',
    title: 'Taming feedback',
    bigIdea: 'Feedback — that squeal or low howl — is a LOOP: a microphone picks up sound from a speaker, the board re-amplifies it, the speaker plays it louder, the mic picks it up again, and it runs away at whatever frequency the room rings at. You don’t beat it by yanking the master down in a panic. You beat it by understanding the loop and breaking it: gain-before-feedback discipline, smart mic and speaker placement, muting open mics, and “ringing out” the system to notch the offending frequencies before they ever sing.',
    inApp: 'Ring out a monitor safely. With the stage empty, slowly raise one monitor’s level until it just begins to ring — then STOP, identify the ringing frequency on a graphic or parametric EQ, and cut (notch) it a few dB. Repeat to find the next one. Then set your working level a few dB BELOW where it rang. You’ve just bought yourself gain-before-feedback for the whole service.',
    anchor: {
      ref: '1 Corinthians 14:33; James 1:19',
      theme: 'God is not a God of confusion but of peace — a screaming feedback loop is the opposite of the peace the room is meant to carry. And “quick to hear, slow to speak”: the operator listens for the ring and acts before it runs away, keeping the room peaceful so worship is not interrupted.',
    },
    benefits: [
      'No more panic-grabbing the master fader — you know what’s happening and how to stop it.',
      'More usable volume (gain-before-feedback) so the vocals and the Word can be heard clearly and safely.',
      'A stable system you’ve “rung out” in advance, so feedback rarely happens at all.',
      'Protection for the congregation’s ears and the moment of worship from a sudden painful squeal.',
    ],
    levels: {
      teen: 'Feedback is that awful squeal or howl, and it happens because of a LOOP. A microphone hears a speaker, the board makes it louder, the speaker plays it louder, the mic hears it again even louder… and around it goes until it screams. So to stop it you break the loop. First rule: don’t point microphones at speakers, and keep mics away from the monitors as much as you can. Second: turn OFF (mute) any microphone nobody is using — every open mic is another chance for feedback. Third: don’t crank the gain higher than you need; the louder you push, the closer you are to the loop running away. And the pro trick is “ringing out”: before the service, with the stage empty, you slowly turn a monitor up until it just barely starts to ring, find that exact frequency on the EQ, and turn it DOWN a little. Do that for the worst few frequencies, then keep your level a bit below where it rang. Now you can run louder without it squealing. If feedback ever does start in service, don’t panic and kill everything — pull down the channel or monitor that’s ringing. Calm and specific beats panic.',
      senior: 'Feedback is a closed acoustic loop that becomes unstable when the loop gain reaches unity at the room’s resonant frequencies — which is why it always rings at specific pitches, not a random noise. Managing it is a stack of disciplines, not one trick. Gain-before-feedback: every additional open mic adds roughly 3 dB to the feedback potential and reduces your usable gain, so the single biggest win is muting or gating unused mics and using the fewest mics that do the job (this is also why a “more mics = better” instinct backfires). Placement: keep microphones out of the direct field of the speakers — mains in front of the mics, wedges aimed across the null of the mic’s pattern; choose directional patterns (cardioid/hypercardioid/supercardioid) and orient the null toward the monitor; respect the inverse-square law (get the mic closer to the source so you need less gain). Ringing out: with the stage clear, bring a monitor (or the mains) up until the system just begins to ring, identify the frequency (graphic EQ band, or better, a parametric for a narrow surgical notch), cut it a few dB, and continue to the next mode; then back the operating level off a few dB below the ring point for margin. Tools: a 31-band graphic EQ across monitor/main outputs is the classic ring-out tool; parametric notches are more surgical; modern automatic-feedback-suppression units detect a sustained tone and drop a notch automatically — useful as a safety net but not a substitute for placement and gain discipline (they can dull the sound if they pile on notches). Common trouble frequencies cluster in the low-mids (250 Hz–500 Hz) and the presence range (2–4 kHz), but the room decides. In service, respond surgically: pull the specific ringing send/channel, not the master — and ideally you’ve already bought margin by ringing out, so it rarely starts. Peace, not confusion (1 Cor 14:33), is the standard for the room; a runaway squeal is its opposite, and the operator who is “quick to hear” (James 1:19) catches the ring before it runs.',
    },
    quiz: {
      questions: [
        {
          q: 'What actually causes feedback?',
          options: [
            'A broken microphone',
            'A loop: a mic picks up a speaker, the board re-amplifies it, the speaker replays it louder, and it runs away at the room’s resonant frequency',
            'Too many people in the room',
          ],
          answer: 1,
          explain: 'Feedback is a closed acoustic loop that goes unstable at specific resonant frequencies — which is why it rings at a pitch and why you break the loop to stop it.',
        },
        {
          q: 'What’s one of the most effective ways to increase gain-before-feedback?',
          options: [
            'Open every microphone just in case',
            'Mute/gate unused mics and use the fewest mics needed — each open mic adds feedback potential',
            'Turn the master all the way up',
          ],
          answer: 1,
          explain: 'Every additional open mic adds roughly 3 dB of feedback potential. Fewer open mics = more usable volume before it rings.',
        },
        {
          q: 'Feedback suddenly starts during a song. Best response?',
          options: [
            'Yank the master fader down to kill everything',
            'Pull down the SPECIFIC ringing channel or monitor send',
            'Turn the gain up to push through it',
          ],
          answer: 1,
          explain: 'Respond surgically — drop the specific source that’s ringing — rather than killing the whole mix in a panic. Ringing out beforehand means it rarely happens at all.',
        },
      ],
    },
    lesson: 'Feedback is the squeal or low howl every sound operator dreads, and the first step to defeating it is understanding that it is not random noise — it is a LOOP. A microphone picks up sound coming from a speaker; the board amplifies that; the speaker plays it back louder; the same mic picks it up again, louder still; and the cycle runs away. It always settles on specific pitches because it locks onto the frequencies the room naturally resonates at — that’s why feedback rings at a note instead of hissing. Because it’s a loop, you don’t beat it by panicking and yanking the master fader down. You beat it by breaking the loop, and there’s a stack of disciplines that do exactly that. The biggest single win is gain-before-feedback through fewer open mics: every additional open microphone adds roughly 3 dB to your feedback potential and steals usable volume, so you MUTE or gate any mic nobody is using and you use the fewest mics that do the job. (This is the counterintuitive truth that “more mics” usually makes things worse, not better.) Next is placement: keep microphones out of the direct firing line of the speakers — the mains should be in front of the mics, the stage monitors aimed so the mic’s “dead” side faces them — and use directional mics (cardioid, hypercardioid) oriented so their least-sensitive angle points at the monitor. Getting the mic closer to the singer’s mouth also means you need less gain, which buys margin. Then comes the pro move that prevents most feedback before it ever happens: RINGING OUT the system. With the stage empty, you slowly bring a monitor (or the mains) up until the system just begins to ring; you identify the ringing frequency — using a 31-band graphic EQ, or better a parametric EQ for a narrow surgical notch — and you cut that frequency a few dB; then you go find the next one. When you’ve tamed the worst few, you set your working level a few dB below where it rang, and now you have real headroom to run the service loud enough without it singing. Common offenders cluster in the low-mids (250–500 Hz) and the presence range (2–4 kHz), but the room always decides. Automatic feedback-suppression boxes exist and can drop a notch on a sustained tone for you — a fine safety net, but never a substitute for placement and gain discipline, because if they pile on notches they dull the whole system. And if feedback does start mid-service, the response is surgical: pull down the specific channel or monitor send that’s ringing, not the master. This is ministry, not just engineering: God is not a God of confusion but of peace (1 Corinthians 14:33), and a runaway squeal is the very opposite of the peace the room is meant to carry. The operator who is “quick to hear” (James 1:19) catches the ring the instant it starts and acts before it runs away — keeping the room peaceful so the worship is never interrupted.',
    facilitator: {
      talkingPoints: [
        'Feedback is a LOOP that goes unstable at the room’s resonant frequencies — that’s why it rings at a pitch. Break the loop; don’t panic the master.',
        'Gain-before-feedback: every open mic adds ~3 dB of feedback potential. Mute/gate unused mics; use the fewest mics that work.',
        'Placement: mics out of the speakers’ direct field; directional patterns with the null toward the monitor; closer mic = less gain needed.',
        'Ring out BEFORE service: raise until it just rings, notch the frequency (parametric = surgical, graphic = classic), back off a few dB for margin.',
        'Offenders cluster ~250–500 Hz and ~2–4 kHz, but the room decides. Auto-suppressors are a safety net, not a substitute for discipline.',
        'In service: pull the SPECIFIC ringing source, not the master. Peace not confusion (1 Cor 14:33); quick to hear (James 1:19).',
      ],
      howToRun: 'Pray + read the anchor (3): read 1 Corinthians 14:33 — peace, not confusion. | The big idea (10): explain the loop with a diagram; show why it rings at a pitch. | Go deeper (15): teach gain-before-feedback, placement, and the ring-out procedure step by step. | Hands-on at the board (20): supervise a real, safe ring-out of one monitor; find and notch two frequencies. | Check yourself + next service (7): rehearse the calm, surgical in-service response (pull the ringing source, not the master).',
      discussionPrompts: [
        'Why does muting unused mics give you more usable volume?',
        'Walk through ringing out a monitor — what are you listening for and what do you do when you hear it?',
        'Why is the calm, specific response better than killing the whole mix when feedback starts?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd5-monitors-vs-the-house',
    title: 'Monitors vs the house — two different mixes',
    bigIdea: 'There are really two mixes happening at once, and they have opposite goals. The HOUSE mix (front of house) is the blend the congregation hears — balanced, full, worshipful. The MONITOR mix is what the musicians hear on stage so they can play and sing together — and each person needs MORE of themselves and the things they follow, not a pretty blend. Confusing the two is why bands sound lost and houses sound thin. Serve the stage so they can lead, and serve the room so the people can worship.',
    inApp: 'Build one monitor mix from the musician’s point of view. Ask the vocalist what they NEED to hear to stay on pitch and in time — usually more of their own voice and a little of the keys/click. Build that on the monitor (aux) send, which is separate from the house. Then go to the house and confirm your front-of-house blend didn’t change at all. Feel how the two mixes are independent.',
    anchor: {
      ref: 'Philippians 2:3-4; 1 Corinthians 12:14-20',
      theme: 'Count others more significant; look to others’ interests — the monitor mix is literally serving what each musician needs, not what you’d prefer to hear. And the body has many members with different roles: the stage and the house are different members with different needs, and the operator honors both.',
    },
    benefits: [
      'A worship team that can actually hear themselves, so they sing on pitch and lock in together.',
      'A house mix that stays balanced and worshipful no matter what the stage asks for.',
      'You stop the classic mistake of “fixing” the house by changing the monitors (or vice-versa).',
      'A servant posture made practical — you’re meeting real needs on stage and in the room.',
    ],
    levels: {
      teen: 'There are two totally different mixes going at the same time, and beginners mix them up — literally. The HOUSE mix is what the people in the seats hear. It should be a beautiful, balanced blend: vocals on top, music supporting, full and worshipful. The MONITOR mix is what the singers and musicians hear from the speakers pointed back at them on stage (wedges) or in their in-ear monitors. Here’s the key: the monitor mix is NOT supposed to be pretty. Each musician needs to hear whatever helps THEM do their job — usually a lot more of their own voice or instrument, plus maybe the click track or the keys to stay on time. A drummer might want bass and click; a singer wants their own voice loud so they don’t go flat. These are separate controls on the board called “aux sends” or “monitor sends.” The mistake to avoid: a singer says “I can’t hear myself,” and a beginner turns the singer up in the HOUSE — now the congregation gets blasted with one voice and the singer still can’t hear. No — you turn them up in their MONITOR only. Two mixes, two sets of controls, two different goals. Serve the stage so they can lead, and serve the room so the people can worship.',
      senior: 'Front-of-house and monitors are independent mix worlds fed from the same channels via different buses: the channel fader (and main bus) builds the house; the aux/monitor sends build each performer’s foldback. The goals diverge: FOH optimizes the congregation’s experience — translation of the worship, vocal intelligibility on top, musical balance, appropriate level for the room; monitors optimize each performer’s ability to perform — pitch reference, timing reference, and enough of their own source that they’re not straining. Practical doctrine: build monitors from the performer’s perspective and ask what they need rather than imposing a blend (a lead vocalist usually wants self + a little pitch/timing reference; a drummer wants click + bass; keep each wedge as sparse as it can be, because every extra thing in a wedge raises stage volume and feedback risk and muddies what they actually need). Stage volume is the hidden enemy: loud wedges bleed into vocal mics, fight the house, and force a loudness arms race — which is a major reason many teams move to in-ear monitors (IEMs), which isolate, protect hearing, and dramatically clean up both the stage and the house. Watch send structure: pre-fader sends are standard for monitors so a house fader move doesn’t change what the performer hears (you do NOT want the singer’s monitor to drop because you pulled their channel down in the house). And resist the cardinal error — “solve” a monitor complaint in the house or vice-versa; they are separate problems with separate controls. The theology fits exactly: count others more significant and look to their interests (Philippians 2:3–4) — a monitor mix is the discipline of giving each person what THEY need; and the body is many members with different functions (1 Corinthians 12) — the stage and the house are different members, each honored on its own terms.',
    },
    quiz: {
      questions: [
        {
          q: 'A singer says “I can’t hear myself.” What do you do?',
          options: [
            'Turn the singer up in the house mix',
            'Turn the singer up in THEIR monitor (aux) send — not the house',
            'Turn the whole band down',
          ],
          answer: 1,
          explain: 'Self-monitoring is a monitor-mix problem. Raising them in the house blasts the congregation and still may not fix what they hear on stage.',
        },
        {
          q: 'What is the goal of a MONITOR mix (vs the house mix)?',
          options: [
            'A beautiful, balanced blend for the congregation',
            'Whatever each performer needs to hear to play/sing together — usually more of themselves plus a timing/pitch reference',
            'Exactly the same as the house, just quieter',
          ],
          answer: 1,
          explain: 'The house serves the congregation’s blend; the monitor serves the performer’s ability to perform. Opposite goals, separate controls.',
        },
        {
          q: 'Why do many worship teams move to in-ear monitors (IEMs)?',
          options: [
            'They’re cheaper than wedges',
            'They isolate sound, protect hearing, lower stage volume, and clean up both the stage and the house',
            'They make feedback worse',
          ],
          answer: 1,
          explain: 'IEMs cut the stage-volume arms race — less bleed into vocal mics, less feedback, hearing protection, and a cleaner house.',
        },
      ],
    },
    lesson: 'One of the biggest leaps a new operator makes is realizing there are really TWO mixes happening at the same time, fed from the same channels but built on different controls, and they have opposite goals. The HOUSE mix — “front of house,” or FOH — is the blend the congregation hears out of the main speakers. Its goal is the worship experience of the people: vocals intelligible and on top, the music supporting, the whole thing balanced, full, and at a level that serves the room. You build it with the channel faders feeding the main bus. The MONITOR mix is completely different. It’s what the singers and musicians hear from the wedges pointed back at them on stage, or from their in-ear monitors, and its goal is not beauty — it’s function. Each performer needs to hear whatever lets THEM do their job: a lead vocalist usually needs a lot more of their own voice (so they don’t drift flat) plus a little pitch or timing reference; a drummer wants the click and the bass; a keys player wants the vocal they’re following. You build these on separate controls called aux sends or monitor sends, and each performer can have their own. Here is the classic, painful beginner mistake, and the whole reason this lesson exists: a singer says “I can’t hear myself,” and the beginner turns that singer UP IN THE HOUSE — now the congregation is getting blasted with one loud voice, the mix is ruined, and the singer still can’t hear themselves on stage because nothing changed in their monitor. The right move is to turn them up in THEIR monitor send only, leaving the house untouched. Two mixes, two sets of controls, two goals — never solve a stage problem in the house or a house problem on the stage. A few seasoned disciplines: keep each monitor as sparse as possible, because every extra thing in a wedge raises stage volume, increases feedback risk, and buries what the performer actually needs. Stage volume is the hidden enemy — loud wedges bleed into the vocal mics and force a loudness arms race — which is exactly why many teams move to in-ear monitors, which isolate the sound, protect hearing, and clean up both the stage and the house dramatically. And use pre-fader sends for monitors, so that when you move a channel’s fader down in the house, the performer’s monitor doesn’t suddenly drop out from under them. The heart of this is service, and Scripture names it precisely: count others more significant than yourselves, and look not only to your own interests but to the interests of others (Philippians 2:3–4) — a monitor mix is that verse turned into faders, giving each person what THEY need rather than what you’d prefer to hear. And the body has many members with different functions (1 Corinthians 12:14–20): the stage and the house are different members of one body, and the faithful operator honors both on their own terms.',
    facilitator: {
      talkingPoints: [
        'Two simultaneous mixes, opposite goals: HOUSE = the congregation’s blend (faders → main bus); MONITOR = what each performer needs (aux sends).',
        'The cardinal error: "I can’t hear myself" → turning them up in the HOUSE. Fix it in their MONITOR only. Never solve a stage problem in the house.',
        'Build monitors from the performer’s view — ask what they need (self + a pitch/timing reference); keep wedges sparse.',
        'Stage volume is the hidden enemy: loud wedges bleed into vocal mics and force a loudness war. IEMs isolate, protect hearing, clean up both worlds.',
        'Use pre-fader sends for monitors so a house fader move doesn’t drop what the performer hears.',
        'Servant theology made faders: Phil 2:3–4 (others’ interests) + 1 Cor 12 (many members, different needs).',
      ],
      howToRun: 'Pray + read the anchor (3): read Philippians 2:3–4 — look to others’ interests. | The big idea (10): demonstrate the two mixes — change a monitor, show the house didn’t move. | Go deeper (15): the cardinal error, pre-fader sends, sparse wedges, the stage-volume problem, IEMs. | Hands-on at the board (20): learner builds a monitor mix by asking what the performer needs, then verifies the house is unchanged. | Check yourself + next service (7): role-play "I can’t hear myself" and have them fix it in the right place.',
      discussionPrompts: [
        'Why is turning a singer up in the house the wrong fix for "I can’t hear myself"?',
        'How does a servant heart change the way you build a monitor mix?',
        'What problems does high stage volume create, and how do in-ears help?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd6-mixing-the-worship-team-and-choir',
    title: 'Mixing the worship team and the choir',
    bigIdea: 'Now you put it all together on the real thing: a worship team and, at COLG, a full CHOIR. Vocals lead and sit on top; instruments each get their own frequency lane so they don’t fight; and the choir — many voices into just a few mics — needs blend, not spotlight, with feedback discipline because those mics are open and far from the singers. The goal is one clear, worshipful sound where the lead is understood, the choir lifts as one body, and nothing is muddy or harsh.',
    inApp: 'Mix the choir as one instrument. Set the few choir mics (overhead condensers) with careful gain-before-feedback, high-pass them to cut stage rumble, and blend them so the SECTION sounds like one rich voice — not so you can pick out individuals. Then bring the lead vocal up on top with a presence lift and confirm you can understand every word over the full choir and band.',
    anchor: {
      ref: '1 Chronicles 15:22; 2 Chronicles 5:13',
      theme: 'Chenaniah was put in charge of the music because he was SKILLFUL — leading many voices well is a skilled calling. And when the trumpeters and singers were as ONE, making one sound to praise the LORD, the glory filled the house. Blending many into one clear voice is exactly the mixer’s craft in service of that unity.',
    },
    benefits: [
      'A lead vocal you can always understand, sitting clearly on top of a full band and choir.',
      'A choir that sounds like one rich, unified voice lifting the room — not a muddy or feedback-prone mess.',
      'Instruments that support instead of fight, because each has its own frequency lane.',
      'The confidence to mix a big, full COLG service and keep it clear and worshipful.',
    ],
    levels: {
      teen: 'This is where everything comes together on a real worship set. Start with a simple priority: the LEAD VOCAL is the most important thing in the mix, because people follow the words — so it sits on top and you must always understand it. Give it a little high-pass (cut the low rumble) and a gentle presence boost (around 3–5 kHz) so the words are clear. Then the band: don’t turn everything up to be heard — instead give each instrument its own “lane.” The kick drum and bass own the low end (but not the same exact spot, or they get muddy together); guitars and keys live in the middle (carve a little room so they don’t clash); cymbals and the top of things live up high. Now the CHOIR, which at our church is big and powerful. You’re catching a lot of voices with only a few microphones hanging over them, so two things matter most: (1) feedback discipline — those mics are open and far from the singers, so set them carefully and high-pass them; and (2) blend, not spotlight — you want the choir to sound like ONE big beautiful voice, not so you can hear one person. Bring the choir up as a section under the lead, get the band supporting, and check: can I understand every word, and does the choir lift the room as one? That’s the goal.',
      senior: 'This is the integration lesson. Establish a hierarchy: lead vocal first (intelligibility is non-negotiable — HPF ~100–120 Hz, controlled presence lift ~3–5 kHz, de-ess if sibilant, a touch of compression to keep it steady over dynamic singing), then the rhythm foundation (kick and bass occupying complementary low-end pockets — e.g., kick fundamental ~60–80 Hz with click/beater ~2–4 kHz, bass filling just above the kick — so they reinforce instead of mud), then harmonic instruments (keys and guitars carved into complementary mid lanes; pan for width), then color/percussion up top. The CHOIR is the COLG-specific craft and the hardest feedback case: a large ensemble captured by a few overhead condensers means high open-mic gain at distance — so gain-before-feedback discipline is paramount (ring those mics out, HPF to kill stage rumble, ride them down when not singing), and the mixing aesthetic is blend, not solo — you’re reinforcing the section as a unified body, not isolating voices. Use the fewest choir mics that give even coverage; more mics = more feedback and phase mush, not more choir. Manage the whole as a dynamic arc: the mix during a quiet verse is not the mix at the peak of a full-choir vamp — ride the faders to keep the lead intelligible at every dynamic and let the choir swell without washing the words out. The standard is the picture in 2 Chronicles 5:13 — the trumpeters and singers “as one,” making one sound — that unity is literally the mixer’s job, and Chenaniah was appointed leader of the music because he was skillful (1 Chronicles 15:22): leading many voices into one clear, worshipful sound is a skilled, God-honored calling.',
    },
    quiz: {
      questions: [
        {
          q: 'What sits on top of a worship mix and must always be intelligible?',
          options: [
            'The kick drum',
            'The lead vocal — people follow the words',
            'The cymbals',
          ],
          answer: 1,
          explain: 'The lead vocal leads worship; the congregation follows the words, so it sits on top with presence and clarity above the band and choir.',
        },
        {
          q: 'How should you mix a large choir captured by a few overhead mics?',
          options: [
            'Add lots of mics and spotlight individual voices',
            'Use the fewest mics that cover evenly, ring them out for feedback, high-pass them, and blend the SECTION as one unified voice',
            'Turn them up as loud as possible',
          ],
          answer: 1,
          explain: 'A choir is mixed as one body — blend, not spotlight — and few open distant mics demand gain-before-feedback discipline and high-passing.',
        },
        {
          q: 'Two instruments sound muddy together in the low end. Best fix?',
          options: [
            'Turn them both up',
            'Give them complementary lanes — let one own a frequency pocket and carve room in the other',
            'Add reverb',
          ],
          answer: 1,
          explain: 'Kick and bass (and clashing mids) need their own lanes so they reinforce rather than fight — carving beats boosting.',
        },
      ],
    },
    lesson: 'This is the lesson where everything in the track meets the real thing: a live worship team and, at the Church of the Living God, a big, powerful CHOIR. Start with a clear priority, because a mix is a hierarchy, not a pile. The LEAD VOCAL is first and non-negotiable — people follow worship through the words, so the lead must sit on top and stay intelligible at every moment. Give it a high-pass filter around 100–120 Hz to clear rumble, a controlled presence lift around 3–5 kHz so consonants cut through, a de-esser if it gets sibilant, and a touch of compression so a dynamic singer stays steady. Next comes the rhythm foundation: the kick and bass, placed in COMPLEMENTARY low-end pockets so they reinforce instead of turning to mud — for instance the kick’s weight around 60–80 Hz with its beater click up around 2–4 kHz, and the bass filling the pocket just above the kick. Then the harmonic instruments — keys and guitars — carved into complementary mid lanes and panned for width so they don’t fight in the same space. Color and percussion sit up top. The instinct to fight for clarity by turning everything UP is the trap; clarity comes from giving each element its own lane. Now the choir, which is the COLG-specific craft and also the single hardest feedback situation you’ll face. A large ensemble is captured by just a few overhead condenser mics, which means you’re running open microphones at high gain, far from the singers — a feedback magnet. So two disciplines dominate. First, gain-before-feedback: ring those choir mics out ahead of time, high-pass them to kill stage rumble, use the fewest mics that give even coverage (more mics means more feedback and phase mush, NOT more choir), and ride them down when the choir isn’t singing. Second, the aesthetic is BLEND, not spotlight: you are reinforcing the section as one unified body, not isolating individual voices — the choir should sound like one big, rich voice lifting the room. Finally, mix the whole thing as a dynamic ARC. The balance during a quiet verse is not the balance at the peak of a full-choir vamp; you ride the faders to keep the lead vocal intelligible at every dynamic while letting the choir swell at the peaks without washing out the words. The biblical picture is the standard to aim at: in 2 Chronicles 5:13 the trumpeters and singers were “as one, to make one sound” in praise, and the glory of the LORD filled the house — blending many voices into one clear sound is literally the mixer’s calling. And Chenaniah was put in charge of the music because he was SKILLFUL (1 Chronicles 15:22): leading many voices into one worshipful sound has always been a skilled, God-honored work.',
    facilitator: {
      talkingPoints: [
        'A mix is a hierarchy, not a pile: lead vocal on top (HPF ~100–120 Hz, presence ~3–5 kHz, de-ess, gentle compression) — intelligibility is non-negotiable.',
        'Rhythm foundation in complementary pockets: kick (~60–80 Hz + beater ~2–4 kHz) and bass just above it, so they reinforce not mud.',
        'Carve keys vs guitars into complementary mid lanes and pan for width — clarity comes from lanes, not from turning everything up.',
        'The CHOIR is the COLG craft + hardest feedback case: few distant open mics → ring out, HPF, fewest mics, ride down when not singing.',
        'Choir aesthetic = blend, not spotlight: reinforce the section as one unified voice. More mics ≠ more choir.',
        'Mix as a dynamic arc — ride faders so the lead stays clear from quiet verse to full vamp. Standard: "as one... one sound" (2 Chr 5:13); skillful (1 Chr 15:22).',
      ],
      howToRun: 'Pray + read the anchor (3): read 2 Chronicles 5:13 — one sound, and the glory filled the house. | The big idea (10): build the hierarchy live — lead first, then foundation, then harmony, then choir. | Go deeper (15): kick/bass pockets, mid lanes, and the choir’s feedback + blend discipline. | Hands-on at the board (20): learner mixes a full set: lead on top, choir blended as one section, every word intelligible. | Check yourself + next service (7): ride a dynamic arc from a soft verse to a full-choir peak, keeping the lead clear.',
      discussionPrompts: [
        'Why is the lead vocal first, and what makes it stay intelligible?',
        'Why is a big choir on a few mics the hardest feedback case, and how do you handle it?',
        'What does mixing the choir “as one sound” (2 Chr 5:13) ask of you at the faders?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'snd7-before-during-after',
    title: 'Before, during, and after the service',
    bigIdea: 'Running sound is three jobs, not one. BEFORE: you prepare — line-check every input, gain-stage, build the monitor and house mixes, ring out feedback, and save a scene, so you start the service ready instead of scrambling. DURING: you serve in real time — ride the faders, mute open mics, follow the flow from song to sermon, watch levels for the room and for hearing safety, and stay calm. AFTER: you grow — listen back to the recording, note what was muddy or harsh or buried, and bring it to the next service better. The same three windows are exactly where the (future, assistive-only) A.I. helper will help.',
    inApp: 'Run all three windows once for real. BEFORE: do a full line check, gain-stage, build mixes, ring out, and SAVE the scene. DURING: run an actual song muting unused mics and riding the lead vocal. AFTER: record the service, listen back the next day, and write down three specific things to fix — then load your saved scene and make those changes for next time.',
    anchor: {
      ref: 'Colossians 3:23; Proverbs 21:5; 1 Corinthians 14:40',
      theme: 'Whatever you do, work heartily as for the Lord — the hidden, behind-the-scenes work of the operator is worship offered to Him. The plans of the diligent (preparation) lead to abundance; haste to want. And all things done decently and in order — the BEFORE/DURING/AFTER rhythm is that order across time.',
    },
    benefits: [
      'You start every service prepared and calm, not scrambling at the last minute.',
      'A recallable saved scene so you’re never rebuilding the whole mix from scratch.',
      'Steady, musical mixing in the moment — and the discipline to protect the congregation’s ears.',
      'You actually get better every week, because you review and carry the lessons forward.',
    ],
    levels: {
      teen: 'Running sound isn’t one job — it’s three, spread across time. BEFORE the service (soundcheck): you get ready. Check that every microphone and instrument is working (a “line check”), set the gain on each one, build the monitor mixes for the team and a starting house mix, ring out the feedback, and SAVE it as a “scene” so the board remembers your setup. If you prepare well, the service is calm. DURING the service: you’re mixing live. The biggest skill is “riding the faders” — when the soft singer takes a verse, you bring them up; when someone’s too loud, you ease them down; you mute mics nobody is using; and you follow the service as it moves from songs to the sermon (the preacher’s mic up, the music down). Stay calm, keep it musical, and don’t make it painfully loud — protect people’s ears. AFTER the service: you get better. Record the service, then listen back later and ask: what was muddy? what was too quiet? did the words come through? Write down a few things to fix, load your saved scene, and make those changes for next week. Prepare, serve, review — every week a little better.',
      senior: 'Operational excellence is a discipline across three time windows. BEFORE (preparation): systematic line check (verify every input is present and clean), gain-stage each channel at performance level, build monitor mixes per performer, build a static FOH starting mix, ring out monitors and mains for feedback margin, set HPFs and baseline EQ, set up any effects, and SAVE a recallable scene/snapshot — preparation is what converts a service from scrambling to serving (Proverbs 21:5, the plans of the diligent). DURING (real-time service): the craft is dynamic mixing — ride faders to maintain the intended balance as the music breathes, bring the soft vocalist up and ease the loud one down, mute/gate open mics the moment they’re idle (feedback + bleed control), and follow the service’s structure with intention (the seamless handoff between worship and the spoken Word — preacher’s mic and gating, music beds under prayer, the offering, etc.). Two non-negotiables: stay composed (problems get solved surgically, not in a panic), and steward LOUDNESS for the room and for hearing safety — “as loud as possible” is never the goal; serving the congregation’s ears and the worship is. AFTER (review and improvement): record the service (a board feed or room capture), listen back critically, and identify specific, actionable issues — a muddy low-mid buildup, a vocal that got buried in the big songs, a harsh cymbal, a monitor that was too hot — then fold those corrections into the saved scene and your habits. This after-review loop is the engine of perpetual improvement, and it is exactly where the assistive A.I. helper (specced separately, GPU-gated) adds value: a spectral/level review of the recording that SUGGESTS what to adjust next time — the operator still decides. The whole rhythm is "decently and in order" extended across time (1 Corinthians 14:40), and the hidden diligence of it is worship: whatever you do, work heartily, as for the Lord (Colossians 3:23).',
    },
    quiz: {
      questions: [
        {
          q: 'What belongs in the BEFORE (soundcheck) window?',
          options: [
            'Listening back to the recording',
            'Line-check, gain-stage, build monitor + house mixes, ring out feedback, and SAVE a scene',
            'Riding the faders during the sermon',
          ],
          answer: 1,
          explain: 'Before the service you prepare and save a recallable scene, so the service is calm instead of a scramble.',
        },
        {
          q: 'What is the core real-time skill DURING the service?',
          options: [
            'Setting it once and never touching it',
            'Riding the faders to keep balance as the music breathes, muting idle mics, and following the flow — calmly',
            'Turning everything as loud as possible',
          ],
          answer: 1,
          explain: 'Live mixing is dynamic: ride the soft vocal up and the loud one down, mute open mics, follow song-to-sermon — and never just chase maximum loudness.',
        },
        {
          q: 'What is the AFTER window for, and how will the assistive A.I. fit there?',
          options: [
            'Tearing down the gear and going home',
            'Listening back to the recording to find specific fixes for next time — where the A.I. SUGGESTS adjustments and the operator decides',
            'Nothing — the job ends when the service ends',
          ],
          answer: 1,
          explain: 'After-review is the improvement engine: find specific issues and fold them forward. The A.I. assists by suggesting from the recording; a human always decides.',
        },
      ],
    },
    lesson: 'Running sound for a service is really three jobs spread across time, and a faithful operator does all three. The first is BEFORE — preparation, what most people call soundcheck. You do a systematic line check to confirm every microphone and instrument input is present and clean; you gain-stage each channel with the source at real performance level; you build the monitor mixes for each performer and a solid starting house mix; you ring out the monitors and mains so you have feedback margin; you set your high-pass filters and baseline EQ and any effects; and then you SAVE it all as a recallable scene or snapshot so the board remembers your work. Preparation is the difference between serving the service and scrambling through it — “the plans of the diligent lead surely to abundance, but everyone who is hasty comes only to want” (Proverbs 21:5). The second job is DURING — serving in real time, and the core craft here is dynamic mixing, often called “riding the faders.” A mix is never set-and-forget, because the music breathes: when the soft vocalist takes a verse you bring them up; when someone gets too loud you ease them down; you mute or gate open mics the instant they go idle, both to fight feedback and to cut bleed; and you follow the structure of the service with intention — the seamless handoff from a worship song into the spoken Word, the preacher’s mic up and the music tucked under, a bed under prayer, the offering. Two things are non-negotiable in this window. Stay composed — problems get solved surgically and calmly, never by panicking and yanking the master. And steward LOUDNESS: “as loud as possible” is never the goal; you serve the room and you protect the congregation’s hearing, which is an act of care, not a technicality. The third job is AFTER — review and improvement, the part beginners skip and pros never do. You record the service, you listen back critically the next day, and you identify specific, actionable issues: a muddy low-mid buildup, a lead vocal that got buried under the big choir songs, a harsh cymbal, a monitor that ran too hot. Then you fold those corrections into your saved scene and into your habits, so next week is genuinely better. This after-review loop is the engine of getting better forever — and it is exactly where the church’s future A.I. helper fits in. That helper (specced separately, and gated on the GPU hardware we don’t have yet) is ASSISTIVE only: it can analyze the recorded mix and SUGGEST what to adjust next time, and during service it can flag a feedback risk or a buried vocal — but it never touches the live board, and the human operator always decides and acts. Across all three windows the same Scripture governs: do everything decently and in order (1 Corinthians 14:40), now extended across time — prepare in order, serve in order, review in order — and remember that this whole hidden, behind-the-scenes craft is worship: whatever you do, work heartily, as for the Lord and not for men (Colossians 3:23). The sound operator serves where almost no one sees, so that everyone can hear — and that is offered to Him.',
    facilitator: {
      talkingPoints: [
        'Three jobs across time: BEFORE (prepare), DURING (serve live), AFTER (review + improve). Beginners only do the middle one.',
        'BEFORE: line check → gain-stage → build monitor + house mixes → ring out → set HPF/EQ → SAVE a recallable scene. Diligence beats haste (Prov 21:5).',
        'DURING: ride the faders (soft vocal up, loud one down), mute idle mics, follow song↔sermon, stay composed, steward loudness for hearing safety.',
        'AFTER: record, listen back, find SPECIFIC fixes (muddy low-mid, buried lead, harsh cymbal, hot monitor), fold into the saved scene + habits.',
        'The assistive A.I. (separate spec, GPU-gated) lives in these three windows but is ASSISTIVE ONLY: it suggests; the operator decides; it never auto-changes the live mix.',
        'Decently and in order across time (1 Cor 14:40); hidden diligence is worship (Col 3:23) — serve where no one sees so everyone can hear.',
      ],
      howToRun: 'Pray + read the anchor (3): read Colossians 3:23 — work heartily as for the Lord. | The big idea (10): name the three windows; ask which one they’ve been skipping. | Go deeper (15): walk the BEFORE checklist, the DURING disciplines (riding faders, loudness stewardship), and the AFTER review loop. | Hands-on at the board (20): run all three — prep + save a scene, mix a live song, then plan the after-review. | Check yourself + next service (7): set the habit — record this Sunday, listen back, bring three fixes next time.',
      discussionPrompts: [
        'Which of the three windows do you tend to skip, and what does skipping it cost the service?',
        'Why is “as loud as possible” never the goal? Whose ears are you stewarding?',
        'How is the after-review loop like the way the whole platform is meant to get better forever — and why must the A.I. only ever suggest?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this self-paced track behaves identically to the other
// courses. Built WITHOUT dates (self-paced): rows carry lesson numbers, no dates.
// ---------------------------------------------------------------------------
import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const SOUND_BOARD_INTEREST_TAG = '[Sound Team interest]';
export const SOUND_BOARD_HELPER_TAG = '[Sound Team helper]';

export function resolveSoundBoardCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, SOUND_BOARD_CONFIRMED_COHORT, SOUND_BOARD_PROPOSED_COHORT_START);
}

// Self-paced: one row per lesson with its lesson number, but NO computed date.
export function buildSoundBoardSchedule() {
  return SOUND_BOARD_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function soundBoardProgressSummary(progress = {}) {
  return progressSummaryFor(SOUND_BOARD_MODULES, progress);
}

export function exportSoundBoardCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: SOUND_BOARD_META, sessionFlow: SOUND_BOARD_SESSION_FLOW, modules: SOUND_BOARD_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide introduces itself as a warm, skilled
// live-sound coach for worship: real technique + a servant heart, age/experience
// aware, citing Scripture by reference, and clear that the A.I. only ever SUGGESTS —
// the human runs the board.
export const SOUND_BOARD_TUTOR_META = {
  title: SOUND_BOARD_META.title,
  intro: 'You are a warm, encouraging, genuinely skilled live-sound coach for the church sound team, guiding one learner through "Running the Board: Live Sound for the House of God."',
  posture: 'Teach REAL, accurate live-sound craft — the signal chain, gain staging, the EQ frequency ranges, taming feedback, monitors vs the house, mixing the worship team and the CHOIR, and the before/during/after rhythm — matched to the learner\'s experience (a nervous first-timer vs a seasoned operator) and pitched plainly. Be relentlessly practical and encouraging; the board is intimidating, so reduce fear and build confidence step by step. Ground the heart of it in service: the operator mixes so the WORD is heard and the worship carries, skillfully (1 Chronicles 15:22; Psalm 33:3) and decently and in order (1 Corinthians 14:40), offered to the Lord (Colossians 3:23). Cite Scripture by reference (do not quote a translation you are unsure of; never invent or paraphrase a verse as if quoting it). Be HONEST and verifiable: rules-of-thumb (like a ~ -18 dBFS gain target) are guides, not laws — say so. BINDING SAFETY: any A.I. help with a live mix is ASSISTIVE — you SUGGEST and explain; a human operator always decides and acts. Never tell anyone to let an A.I. auto-change a live service mix. You run on the church\'s own sovereign, local A.I.; you can be wrong — tell them to verify what matters with their ears and their sound engineer.',
};
