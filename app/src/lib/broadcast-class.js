// =============================================================================
// broadcast-class — "The Broadcast: How It All Works"
// =============================================================================
// The SECOND COLG Learn course (sister to "Learning A.I. The Way"). This one is
// for Darrell's REAL broadcast/media team at The Church of the Living God: it
// teaches how the live broadcast actually works end to end — the signal chain,
// the cameras and light, OBS switching, the machines (CPU / GPU / CUDA / NVENC),
// 4K bandwidth and the network, and how LLMs work + serve the broadcast — so each
// operator understands the craft at their own station, not just the buttons.
//
// SAME SHAPE as church-classes.js on purpose (Darrell: mirror the existing course
// exactly): a MODULES array of { id, title, bigIdea, inApp ("at your station"),
// anchor, lesson, facilitator{talkingPoints,howToRun,discussionPrompts}, launch? },
// an 8-week cadence, the same 75-minute SESSION_FLOW, the same computed-not-painted
// timeline (buildScheduleFor), the same progress + markdown export, and the same
// cohort-propagation machinery (resolveBroadcastCohort). It reuses the GENERIC
// helpers in church-classes.js so both courses behave identically and stay tested.
//
// THE TEAM (woven in by name — this course is for THEM):
//   • Clifton    — opens in prayer; the start of the broadcast.
//   • Bradley    — OBS: scenes, camera switches, the overall look.
//   • Chris      — the main Sanctuary 4K Blackmagic camera (feeds the room + BG).
//   • Isaiah + Coreyon — lighting controls.
//   • Deacon Wright — senior founding member; he started the video cameras for the
//     TV broadcast with the Bishop. Honored as the founder of this work (no age
//     stated, per Darrell).
//   • Pancho     — Darrell's brother-in-love, on the team.
//   • Darrell    — holds the team to a high standard "based on Yahweh's guidance."
// The "two RTX 4070" machines (the LEFT and RIGHT machines that feed the main
// Sanctuary monitors) are GPUs, not "cpus" — teaching that distinction respectfully
// is a core learning goal (Week 5). Network is NVMe and/or Cat6 (Week 6).
//
// TECHNICAL ACCURACY (verified 2026-06-16 against NVIDIA's own spec page, SMPTE/
// 12G-SDI, YouTube live-encoder docs, IEEE 802.3an, OpenAI Whisper): RTX 4070 =
// Ada Lovelace, 5,888 CUDA cores, ONE 8th-gen NVENC encoder with AV1; uncompressed
// 4K60 over 12G-SDI ~= 11.88 Gbps vs ~35 Mbps compressed 4K60 live (~300x); Cat6
// carries 1GbE and 10GbE to ~55 m (Cat6a to 100 m); NVMe is local PCIe STORAGE
// (~7 GB/s), NOT a network. These are taught as real distinctions, not hand-waved.
//
// Grounds: COMMUNITY-FIRST-MISSION (COLG is the named first community; serving its
// media team is the mission), EXCELLENCE-STANDARD + Col 3:23 (excellence as worship
// is the through-line), AI-MEDIA-PRODUCTION-PLATFORM-VISION (the broadcast feeds
// sermon-to-content + the clip archive = The Word — Migdal), DR-0076 Verification
// Doctrine (Week 7 teaches the team to TEST the A.I., same posture as the sister
// course). Scripture anchors are cited by REFERENCE with a plain-language theme
// gloss — never a quoted translation — per the SCRIPTURE-REFERENCE-STANDARD.
// =============================================================================

// Proposed start for the broadcast-team Cohort 1. Governor-editable in-app
// (data.broadcastCohort.startDate). Labeled "proposed" until Darrell confirms.
// A Saturday morning (the team's own practice/run-of-show rhythm); the UI shows
// the true weekday so a non-Saturday is caught honestly.
export const BROADCAST_PROPOSED_COHORT_START = '2026-07-11';

// PUBLISHED cohort — what every learner on every deployed build sees (same model
// as the youth class: authored content, committed, deployed to all). Until Darrell
// locks the date this stays { confirmed:false } and the UI honestly reads
// "proposed." When he confirms, set confirmed:true here (and startDate if it moved)
// and the next deploy propagates it to the whole team. A Governor's live in-app
// confirm still overrides locally for his own preview (resolveBroadcastCohort).
export const BROADCAST_CONFIRMED_COHORT = {
  startDate: '2026-07-11',
  confirmed: false,
};

export const BROADCAST_META = {
  key: 'broadcast',
  title: 'The Broadcast: How It All Works',
  audience: 'the COLG broadcast & media team — and anyone serving the broadcast',
  tagline: 'Know the craft. Serve the King. Excellence is worship.',
  format: '9 weekly sessions · ~75 min each · live time with Darrell plus hands-on right at your station',
  cadenceDays: 7,
  weeks: 9,
  // The per-week hands-on for THIS course happens at the real broadcast booth /
  // the operator's station, not on an app screen — so the label reads honestly.
  handsOnLabel: 'At your station',
  footer: '_Taught by Darrell Poe, to the standard Yahweh sets · The Church of the Living God broadcast team · built on PoeTech. Founded on the cameras Deacon Wright started with the Bishop._',
};

// The session rhythm every week follows — mirrors the youth class exactly (75 min)
// so a facilitator teaches both with one muscle memory. The only word that changes
// is the hands-on segment: "at your station" instead of "in the app."
export const BROADCAST_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 25, name: 'Hands-on at your station' },
  { minutes: 15, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const BROADCAST_SESSION_MINUTES = BROADCAST_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

// Each module mirrors the youth-class shape: bigIdea (plain-language learner copy),
// a deeper `lesson` for the one teaching it, the real `inApp` hands-on (here:
// at-your-station), an optional `launch` to a REAL app surface (most weeks happen
// at the booth and carry none), a `facilitator` guide, and a Scripture anchor
// (reference + theme gloss, never a quoted verse — SCRIPTURE-REFERENCE-STANDARD).
export const BROADCAST_MODULES = [
  {
    id: 'bc1-the-whole-chain',
    title: 'The whole chain — sanctuary to the world',
    bigIdea: 'The broadcast is one chain: camera → capture → OBS → encode → stream → screens. Every person here is one link. A chain is only as strong as its weakest link — and only as strong as the team praying it on.',
    inApp: 'Walk the real signal chain in the booth together. Each person finds their own link and traces where their signal goes next. Start with Clifton: the broadcast opens in prayer.',
    anchor: { ref: '1 Corinthians 12:12–27', theme: 'One body, many members. The eye can’t say to the hand "I don’t need you." Every station matters; the broadcast is a body, not a stack of gear.' },
    media: [
      { type: 'diagram', key: 'signal-chain', title: 'The signal chain', caption: 'Camera → capture → OBS → encode → stream → screens. Each box is a station someone owns.' },
      { type: 'clip', title: 'POV: the service open (Clifton + BG)', sopId: 'sop-service-open', caption: 'First-person walk of the go-live moment — captured with the team’s glasses (pending).' },
    ],
    levels: {
      teen: 'The broadcast is one chain of steps that hands the picture from person to person: a camera makes the image, a capture card lets the computer see it, OBS picks which camera and slide to show, the encoder shrinks it, and the stream carries it to screens at church and at home. You are one link in that chain. If your link is weak, the whole thing is weak — so your part matters, even if it feels small. And it all starts with prayer: Clifton opens, because this is ministry first.',
      senior: 'The point of week one is shared situational awareness: every operator should be able to draw the whole path and name who hands what to whom. Camera (the image is born) → capture card (cable signal becomes a readable device) → OBS (compositing + live switching) → encoder (NVENC compression) → transport (RTMP/SRT) → outputs (Sanctuary screens + the Bishop’s monitor + the home stream). Deacon Wright founded this by pointing the first cameras at the pulpit with the Bishop; the calling is unchanged. The discipline to instill: find the link with no clear backup owner, because that is where the chain breaks first.',
    },
    quiz: {
      questions: [
        { q: 'A broadcast is "only as strong as its weakest link." What does that mean for the team?', options: ['Only the camera matters', 'Every station matters; one weak link weakens the whole', 'The encoder can fix any problem'], answer: 1, explain: 'Each person hands their work to the next; the weakest link sets the strength of the whole chain.' },
        { q: 'What is the correct order of the core signal chain?', options: ['OBS → camera → encode → stream', 'Camera → capture → OBS → encode → stream → screens', 'Stream → encode → camera → screens'], answer: 1, explain: 'The image is born at the camera and travels through capture, OBS, the encoder, the stream, to the screens.' },
      ],
    },
    lesson: 'Before any one station makes sense, the team has to see the whole path the picture and sound travel — because each person is handing their work to the next person down the line. A camera makes an image; a capture card turns that cable signal into something the computer can read; OBS arranges the cameras and slides into scenes and switches between them live; the encoder squeezes that into a stream small enough to send; the stream protocol carries it out; and screens — in the Sanctuary and at home — show the result. Deacon Wright started this work years ago with the Bishop, pointing the first cameras at the pulpit so the Word could reach people who couldn’t be in the room. That same calling runs through the whole chain today. And it opens the way everything in this house opens: Clifton prays. We are one body with many parts (1 Corinthians 12), and a broadcast is exactly that — no link is unimportant, and the weakest link sets the strength of the whole.',
    facilitator: {
      talkingPoints: [
        'Draw the whole chain on the board: camera → capture → OBS → encode → stream → screens. Name who owns each link.',
        'A chain is only as strong as its weakest link — that’s why every station, even the "small" ones, matters.',
        'Honor Deacon Wright: he founded this work, starting the cameras with the Bishop so the Word could leave the room.',
        'It opens in prayer (Clifton). The broadcast is ministry first and technology second — the gear serves the Word.',
      ],
      howToRun: 'Prayer + the anchor (5): Clifton opens; read 1 Corinthians 12:12–27 — one body, many members. | Recap last week (10): first session — instead, go around the room: name, station, how long you’ve served. Honor Deacon Wright’s founding story. | Teach the big idea (15): draw the full signal chain; for each link ask "who owns this, and what do they hand to the next person?" | Hands-on at your station (25): physically walk the booth — each person stands at their link and traces their signal to the next one; find any link with no clear owner. | Discussion (15): where is our weakest link right now, and who can strengthen it? | Send-off + solo task (5): solo task — this week, watch the broadcast as a viewer at home and write down one thing the chain did well and one thing to fix.',
      discussionPrompts: [
        'Which link in our chain is the weakest right now — and is that about gear, or about a person who needs backup?',
        'If your station went down mid-service, who could step in — and do they know it?',
        'How does seeing the broadcast as "one body" change how you treat the station next to yours?',
      ],
    },
  },
  {
    id: 'bc2-camera-and-image',
    title: 'The camera and the image — Chris’s 4K eye',
    bigIdea: 'The camera is where the picture is born — get it wrong here and nothing downstream can fix it. Chris runs the main 4K Blackmagic on the Sanctuary; that one feed is what the room AND the Bishop see, so everyone is looking at the same thing.',
    inApp: 'At Chris’s station: frame the pulpit on the main camera, check focus and exposure, and confirm the same feed reaches the Sanctuary screens and the Bishop’s monitor. Trace the cable: is it SDI? How far does it run?',
    anchor: { ref: 'Matthew 6:22; Proverbs 4:25', theme: 'The eye is the lamp of the body — when it’s clear, the whole body is full of light. Let your eyes look straight ahead. A clean, well-aimed image serves everyone watching.' },
    media: [
      { type: 'clip', title: 'POV: framing the main 4K (Chris)', sopId: 'sop-blackmagic-framing', caption: 'First-person: set and hold the pulpit frame, focus, exposure (pending capture).' },
    ],
    quiz: {
      questions: [
        { q: 'Why is the camera the most important place to get the image right?', options: ['Because it is the most expensive gear', 'Because a soft or blown-out shot can’t be fixed downstream', 'Because OBS can sharpen any image later'], answer: 1, explain: 'The image is born at the camera; focus and exposure set here can’t be repaired by OBS, the encoder, or the screens.' },
        { q: 'Why do broadcast cameras use SDI over HDMI for the main run?', options: ['SDI is cheaper', 'SDI has a locking connector and runs long distances', 'HDMI can’t carry color'], answer: 1, explain: 'SDI’s locking BNC won’t pop out mid-service and runs far past HDMI’s short reach — why churches standardize on it.' },
      ],
    },
    lesson: 'Everything downstream is limited by what the camera captures — a soft focus or a blown-out exposure can’t be repaired by OBS, the encoder, or the screens. So the image is "born" at the camera, and Chris guards the most important one: the main 4K Blackmagic aimed at the pulpit. "4K" means roughly 3840×2160 pixels — about four times the detail of 1080p HD — which is why it looks so clean on the big Sanctuary screens and why it needs a serious cable and serious machines behind it. That one main feed is deliberately shared: it goes to the parishioners’ screens AND to the Bishop’s monitor, so the whole room is seeing the same thing at the same time. Most pro cameras like the Blackmagic send their picture over SDI — a broadcast cable with a locking BNC connector that won’t pop out mid-service and can run long distances (well past what HDMI handles) — which is exactly why houses of worship use it. The eye is the lamp of the body (Matthew 6:22); a clear, steady, well-aimed image fills the room with light.',
    facilitator: {
      talkingPoints: [
        'The image is born at the camera — focus and exposure set here can’t be fixed downstream. Guard the source.',
        '"4K" ≈ 3840×2160, about 4× the detail of 1080p; that’s why it’s crisp on the big screens and demands real cable + machines.',
        'Chris’s main feed is shared on purpose: the Sanctuary screens AND the Bishop see the same picture — one source of truth for the room.',
        'SDI vs HDMI: SDI has a locking connector and runs long distances; that’s why broadcast and churches standardize on it over HDMI.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Matthew 6:22 — the eye is the lamp of the body. | Recap last week (10): a learner names the chain’s links from memory. | Teach the big idea (15): teach "the image is born here," what 4K means, and SDI vs HDMI (locking connector, long runs). | Hands-on at your station (25): at the main camera — frame the pulpit, nail focus + exposure, then confirm the SAME feed shows on the Sanctuary screens and the Bishop’s monitor; trace the SDI cable and note its length. | Discussion (15): what makes a "good shot" of the pulpit, and how do we keep it steady all service? | Send-off + solo task (5): solo task — study one past broadcast and note three moments the framing or focus could be stronger.',
      discussionPrompts: [
        'Why can’t a great encoder or great screens rescue a soft or badly-lit shot?',
        'What does it protect for the Bishop and the room to be seeing the exact same feed?',
        'When would we ever choose HDMI over SDI, and what do we give up if we do?',
      ],
    },
  },
  {
    id: 'bc3-light',
    title: 'Light — Isaiah and Coreyon make it seeable',
    bigIdea: 'The camera can only capture the light you give it. Light is not decoration — it is the raw material of the whole image. Isaiah and Coreyon control whether the room reads as warm and clear, or flat and dim, on every screen.',
    inApp: 'At the lighting controls: set the pulpit light, then watch the main camera’s picture change in real time. Find the level where the Bishop’s face is clear and evenly lit — not too dark, not blown out. Teach the camera op and the light op to talk to each other.',
    anchor: { ref: 'Genesis 1:3; Matthew 5:14–16', theme: 'The first thing God made was light. Let your light shine before others so they see good works and glorify the Father. Light is where creation — and the image — begins.' },
    media: [
      { type: 'clip', title: 'POV: setting the lighting scenes (Isaiah & Coreyon)', sopId: 'sop-lighting-scenes', caption: 'First-person: bring up the pulpit wash and read the face on camera (pending capture).' },
    ],
    quiz: {
      questions: [
        { q: 'Why does a too-dark room make the picture look worse, not just dimmer?', options: ['The camera adds noise/grain when it strains for light', 'Dark rooms break the cable', 'It doesn’t — dark is always fine'], answer: 0, explain: 'With too little light the camera amplifies the signal and adds grain/noise — the image gets dark AND noisy.' },
        { q: 'What should the light op and camera op do before service?', options: ['Work separately and not talk', 'Do a verbal check that the face reads clean on camera', 'Turn all lights to maximum'], answer: 1, explain: 'A board change shows instantly in the viewfinder — they’re one team, so they verify the face together first.' },
      ],
    },
    lesson: 'A camera does not "see" a room; it records the light bouncing off it — so whoever controls the light controls the picture more than almost anyone realizes. The first creative act in all of Scripture is "let there be light" (Genesis 1:3), and on the broadcast it is just as foundational: too little light and the image goes dark and noisy (the camera "strains" and adds grain); too much and faces blow out to featureless white; uneven light and half the Bishop’s face falls into shadow. Isaiah and Coreyon are aiming for clean, even light on the pulpit so the camera has good raw material to work with — which is why the light op and the camera op have to talk: a change at the board shows up instantly in Chris’s viewfinder. Color matters too (warm vs cool light changes the whole mood). Jesus calls us the light of the world and tells us to let it shine so people see and glorify the Father (Matthew 5:14–16) — and quite literally here, good light is what lets the world see the Word being preached.',
    facilitator: {
      talkingPoints: [
        'The camera records light, not rooms — control the light and you control the image more than any setting.',
        'Name the failure modes: too dark = noisy/grainy; too bright = blown-out faces; uneven = half the face in shadow.',
        'Light op and camera op must talk — a board change shows instantly in the viewfinder; they’re one team.',
        'Genesis 1:3: light is the first created thing; Matthew 5 — let it shine so people see. Good light lets the world see the Word.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Genesis 1:3 and Matthew 5:14–16. | Recap last week (10): the camera op shares one framing improvement from last week’s solo task. | Teach the big idea (15): teach light as raw material; show the three failure modes (dark/noisy, blown-out, uneven). | Hands-on at your station (25): at the board — change the pulpit light while watching the main camera live; together find the clean, even level; practice one verbal call-and-response between light op and camera op. | Discussion (15): what does our room get wrong most — too dark, too hot, or uneven? | Send-off + solo task (5): solo task — watch one service and grade the lighting on the Bishop’s face from start to end.',
      discussionPrompts: [
        'Why does a dark room actually make the picture look WORSE (noisier), not just dimmer?',
        'What’s the one sentence the light op and camera op should say to each other before service starts?',
        'How is "let your light shine" both a spiritual calling and a literal job description here?',
      ],
    },
  },
  {
    id: 'bc4-obs-switching',
    title: 'OBS and the switch — Bradley runs the look',
    bigIdea: 'OBS is the control room in software. A "scene" is a saved arrangement of cameras, slides, and lower-thirds; "switching" is cutting between scenes live. Bradley owns the look of the broadcast — calm, intentional cuts, never frantic.',
    inApp: 'At the OBS station with Bradley: build two scenes (wide shot, and pulpit close-up + lower-third), then practice switching between them cleanly on cue. Notice the difference between a hard cut and a smooth transition.',
    anchor: { ref: '1 Corinthians 14:40', theme: 'Let all things be done decently and in order. The switch is where order either shows or breaks — a calm, intentional cut serves the worshipper; a frantic one distracts them.' },
    media: [
      { type: 'clip', title: 'POV: running OBS — scenes & switching (Bradley)', sopId: 'sop-obs-switching', caption: 'First-person: pre-build the next scene, cut on the beat (pending capture).' },
    ],
    quiz: {
      questions: [
        { q: 'In OBS, what is a "scene"?', options: ['A single camera', 'A saved arrangement of sources (cameras, slides, lower-thirds, audio)', 'The act of cutting between cameras'], answer: 1, explain: 'A scene is a saved layout of sources; switching is cutting/transitioning between scenes live.' },
        { q: 'What does good switching feel like to the congregation?', options: ['Frequent, flashy cuts', 'Carried, not jostled — calm and intentional', 'Random and surprising'], answer: 1, explain: 'Good switching is invisible: anticipate the service, cut on natural beats, and resist over-cutting.' },
      ],
    },
    lesson: 'OBS (Open Broadcaster Software) is the software version of a TV control room, and Bradley sits in the director’s chair. The two words that unlock it: a scene is a saved arrangement of sources — this camera, that slide, the lower-third name graphic, the audio — laid out exactly how you want it; switching is cutting or transitioning from one scene to the next, live, as the service moves. Good switching is invisible: the congregation should feel carried, not jostled. That means anticipating the service (the Bishop is about to read Scripture — be ready on the slide scene), cutting on natural beats, and resisting the urge to cut too often. The whole craft here is Paul’s instruction to the Corinthian church about worship: "let all things be done decently and in order" (1 Corinthians 14:40). The switch is literally where the order of the service either shows up clean on screen or turns chaotic — Bradley’s calm hand is a ministry of order.',
    launch: { view: 'church', churchView: 'home' },
    facilitator: {
      talkingPoints: [
        'OBS = a software control room. Two words: SCENE (a saved arrangement of sources) and SWITCH (cut/transition between scenes, live).',
        'Good switching is invisible — the congregation feels carried, not jostled. Anticipate the service; cut on natural beats.',
        'Resist over-cutting. Stillness is a choice; a frantic broadcast distracts from the Word.',
        '1 Corinthians 14:40 — decently and in order. The switch is where the order of worship shows on screen.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Corinthians 14:40 — decently and in order. | Recap last week (10): the lighting team shares their grade of last week’s service. | Teach the big idea (15): define scene vs switch; show a clean cut vs an over-cut; talk about anticipating the run of service. | Hands-on at your station (25): in OBS — build a "wide" scene and a "pulpit + lower-third" scene; practice switching between them on a caller’s cue; try a hard cut and a transition and feel the difference. | Discussion (15): when does a cut help the worshipper, and when does it distract? | Send-off + solo task (5): solo task — sketch the scene list our service actually needs from open to close.',
      discussionPrompts: [
        'What’s the difference between switching that serves the worship and switching that shows off?',
        'How early should the director know the next scene is coming — and who tells them?',
        'What does "decently and in order" look like on a chaotic Sunday?',
      ],
    },
  },
  {
    id: 'bc5-cpu-gpu-cuda',
    title: 'The machines — CPU, GPU, CUDA, and the two 4070s',
    bigIdea: 'The left and right machines that drive the Sanctuary screens run on RTX 4070 GPUs — graphics cards, not "cpus." A CPU is a few powerful workers doing one hard job at a time; a GPU is thousands of small workers doing the same math all at once. That difference is why 4K and A.I. are even possible.',
    inApp: 'At the left and right machines: open the system info and find the RTX 4070. Then in OBS, look at the encoder setting — is it set to NVENC (the GPU’s hardware encoder)? Watch the CPU load with NVENC on vs off, and see the GPU take the weight.',
    anchor: { ref: 'Exodus 35:30–35', theme: 'God filled Bezalel with skill and ability to work in every craft and to teach others. Mastering the tools of the trade — and understanding them — is a Spirit-given calling, not just a technical one.' },
    media: [
      { type: 'diagram', key: 'cpu-vs-gpu', title: 'CPU vs GPU', caption: 'A CPU = a few powerful workers (one hard job at a time). A GPU = thousands of small workers doing the same math at once. NVENC is a separate encoder chip on the GPU.' },
    ],
    levels: {
      teen: 'The two machines that run the big screens (the left and right ones) have a powerful graphics card inside called an RTX 4070 — a GPU, not a "cpu." Picture it like this: a CPU is a few really smart workers who can do anything, but mostly one hard thing at a time. A GPU is thousands of simpler workers who all do the same kind of math at the exact same time — and the 4070 has 5,888 of them. That’s why it can draw millions of 4K pixels and run A.I. There’s also a special little chip on the GPU called NVENC whose only job is to shrink the video so it can be streamed — turn it on in OBS and the graphics card does the heavy lifting.',
      senior: 'The teaching goal is precision with the three terms the team mixes up. The 4070 machines are GPUs, not CPUs — both chips live in the same box and split the work. CPU: few powerful cores, serial, latency-sensitive — it carries the OS, audio, and OBS’s own application logic. GPU: thousands of parallel cores (the 4070 has 5,888 "CUDA cores") for same-operation-across-much-data work — pixels and tensor math. Keep three words distinct: CUDA is NVIDIA’s platform/API for putting general work on those cores (the platform, not the chip); "CUDA cores" are the cores; NVENC is a dedicated fixed-function video-encoder block ON the die, independent of the CUDA cores, that encodes H.264/HEVC/AV1 in hardware. The 4070 has one 8th-gen NVENC with AV1. Operationally: set OBS to NVENC so encoding leaves the CPU free; the same parallel silicon is why this box also runs the local A.I.',
    },
    quiz: {
      questions: [
        { q: 'Are the two RTX 4070s "cpus"?', options: ['Yes, 4070 is a type of CPU', 'No — they are GPUs (graphics cards); the CPU is a different chip in the same machine', 'They are neither'], answer: 1, explain: 'The 4070 is a GPU. The CPU is a separate chip; both live in the machine and do different jobs.' },
        { q: 'What is NVENC?', options: ['NVIDIA’s platform for general GPU computing', 'A dedicated hardware video-encoder chip on the GPU, separate from the CUDA cores', 'The name of the CPU'], answer: 1, explain: 'NVENC is a fixed-function encoder block on the GPU; CUDA is the platform; CUDA cores are the parallel cores.' },
        { q: 'Why does the same GPU help BOTH 4K video and A.I.?', options: ['They both need a CPU only', 'Both are massively parallel math — pixels and A.I. tensor math', 'A.I. doesn’t use the GPU'], answer: 1, explain: 'A GPU’s thousands of cores do the same math across huge data — exactly what 4K pixels and A.I. inference both need.' },
      ],
    },
    lesson: 'This week clears up the most common confusion on the team: the two 4070 machines (the LEFT and RIGHT machines feeding the main Sanctuary monitors) are not "cpus" — they’re computers with a powerful GPU inside, an NVIDIA RTX 4070. The honest distinction, said plainly: a CPU (central processing unit) is like a few very smart workers who can do almost any task, but mostly one hard thing at a time — great for the operating system, the audio, and OBS’s own logic. A GPU (graphics processing unit) is like thousands of simpler workers who all do the same kind of math at the same time — the RTX 4070 has 5,888 of these "CUDA cores." That massive parallelism is exactly what pushing millions of 4K pixels needs, and it’s the same reason GPUs run A.I. So three terms, kept straight: CUDA is NVIDIA’s system for putting general work onto all those GPU cores (it’s the platform, not the chip); the cores are called "CUDA cores"; and NVENC is a separate dedicated chip ON the GPU whose only job is to encode video — it squeezes the stream in hardware so the CPU stays free. The 4070 has one 8th-generation NVENC encoder and can even use the newer AV1 format. The takeaway for the team: turn on NVENC in OBS and the GPU carries the heavy encoding so the rest of the machine breathes. Scripture honors exactly this — God "filled Bezalel with skill... to work in every craft and to teach others" (Exodus 35); knowing your tools deeply is a calling.',
    facilitator: {
      talkingPoints: [
        'Respectfully clear it up: the 4070s are GPUs (graphics cards), not "cpus." Both live in the same machine; they do different jobs.',
        'CPU = a few powerful general workers (OS, audio, OBS logic). GPU = thousands of small workers doing the same math at once (the 4070 has 5,888 CUDA cores).',
        'Keep three words straight: CUDA = NVIDIA’s platform for using the GPU cores; "CUDA cores" = the cores; NVENC = a SEPARATE hardware video-encoder chip on the GPU.',
        'NVENC offloads encoding from the CPU — turn it on in OBS and the GPU carries the weight. The 4070 has one 8th-gen NVENC with AV1.',
        'Same parallel power runs 4K AND A.I. — that’s why the GPU matters for both. Exodus 35: God-given skill to work the craft and teach it.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Exodus 35:30–35 — Bezalel filled with skill to work and to teach. | Recap last week (10): Bradley shares the scene list from the solo task. | Teach the big idea (15): CPU vs GPU with the "few smart workers vs thousands of simple workers" picture; then CUDA vs CUDA-cores vs NVENC; name the 4070’s real numbers. | Hands-on at your station (25): on the left + right machines — open system info, find the RTX 4070; in OBS check the encoder is set to NVENC; toggle NVENC and watch CPU load drop as the GPU takes over. | Discussion (15): what does the CPU still do even when the GPU encodes? | Send-off + solo task (5): solo task — in your own words, write the one-sentence difference between a CPU and a GPU to teach the next person.',
      discussionPrompts: [
        'In your own words: what’s the difference between a CPU and a GPU — and why isn’t a 4070 a "cpu"?',
        'If NVENC encodes the video, what work is LEFT for the CPU during a live service?',
        'Why does the same GPU that draws 4K also run A.I. — what do those two jobs have in common?',
      ],
    },
  },
  {
    id: 'bc6-bandwidth-network',
    title: 'The pipes — 4K bandwidth and the network',
    bigIdea: 'Raw 4K video is enormous — about 12 billion bits every second, uncompressed. No normal internet can send that. The network and the cables are the pipes; if a pipe is too small, the picture stutters. Knowing NVMe vs Cat6 vs 10-gig keeps the broadcast flowing.',
    inApp: 'At the machines and the rack: identify what’s storage and what’s network. Find the NVMe drive (fast local storage) and the Ethernet cable (the network). Check the cable — is it Cat6? Where does it run, and how long is it? Note where 4K video lives vs where the stream goes out.',
    anchor: { ref: 'Luke 14:28', theme: 'Which of you, wanting to build a tower, doesn’t first sit down and count the cost — whether you have enough to finish? Plan the capacity before you build the broadcast on it.' },
    media: [
      { type: 'diagram', key: 'bandwidth-pipes', title: 'The pipes', caption: 'Uncompressed 4K60 ≈ 12 Gbps (SDI). Compressed for streaming ≈ 35 Mbps (NVENC, ~300× smaller). NVMe = fast local storage (~7 GB/s), not a network; Cat6 = the network cable.' },
    ],
    quiz: {
      questions: [
        { q: 'Why can’t raw 4K be sent over normal internet?', options: ['It can, easily', 'Uncompressed 4K60 is ~12 Gbps — far more than internet upload; compression (NVENC) shrinks it to ~35 Mbps', 'The camera blocks it'], answer: 1, explain: 'Uncompressed ~12 Gbps → compressed ~35 Mbps is roughly a 300× reduction; NVENC compression is what makes streaming possible.' },
        { q: 'What is NVMe?', options: ['A type of network cable', 'Fast LOCAL storage (a drive, ~7 GB/s) inside the machine — not a network', 'The internet connection'], answer: 1, explain: 'NVMe is local PCIe storage for files. Cat6 / 10-gig is the network that moves data between machines. Don’t confuse them.' },
      ],
    },
    lesson: 'Numbers make this real: uncompressed 4K at 60 frames a second is roughly 12 billion bits per second (about 12 Gbps — that’s what a pro 12G-SDI cable is built to carry). Ordinary home internet uploads at a tiny fraction of that, so sending raw 4K out to the world is impossible — which is the whole reason NVENC compression exists: it squeezes that ~12 Gbps down to around 35 Mbps for a clean 4K live stream, a roughly 300-times reduction, small enough to actually send. Now the pipes inside the building, where the two most-confused words get untangled: NVMe is local storage — a very fast drive inside the machine (around 7 gigabytes per second) where recordings and assets live; it is NOT a network. Cat6 is the Ethernet cable that connects machines to each other and to the internet — it carries 1-gigabit easily and can do 10-gigabit over shorter runs (about 55 meters; Cat6a goes the full 100). So the rule of thumb: storage (NVMe) holds the big files; the network (Cat6 / 10-gig) moves data between machines; SDI cable moves the live camera picture; and the encoder is what makes the outgoing stream small enough for the public internet. If any pipe is undersized for what flows through it, you get stutter, dropped frames, or a stalled stream — so, like the tower-builder in Luke 14:28, you count the cost and size the pipes before you trust the broadcast to them.',
    facilitator: {
      talkingPoints: [
        'Uncompressed 4K60 ≈ 12 Gbps (what 12G-SDI carries). Compressed for streaming ≈ 35 Mbps — about a 300× reduction. NVENC compression is what makes sending 4K possible.',
        'Untangle the confusion: NVMe = fast LOCAL storage (~7 GB/s), a drive — NOT a network. Cat6 = the Ethernet cable that moves data between machines.',
        'Cat6 carries 1-gig easily and 10-gig over shorter runs (~55 m; Cat6a to 100 m). Pick the cable for the speed AND the distance.',
        'Rule of thumb: storage holds files, the network moves data between machines, SDI moves the live picture, the encoder shrinks the public stream.',
        'Luke 14:28 — count the cost. Undersized pipe = stutter and dropped frames. Size the pipes before you build on them.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 14:28 — count the cost before you build. | Recap last week (10): a learner gives their one-sentence CPU-vs-GPU definition. | Teach the big idea (15): the big-number story (12 Gbps raw → ~35 Mbps compressed); then NVMe (storage) vs Cat6/10-gig (network) vs SDI (live picture). | Hands-on at your station (25): at the rack/machines — point to the NVMe drive (storage) and the Ethernet cable (network); identify the Cat6 cable, where it runs, and roughly how long; map where 4K is stored vs where the stream exits. | Discussion (15): where in our setup is a pipe most likely too small, and how would we know? | Send-off + solo task (5): solo task — find out our actual upload speed to the internet and whether it’s enough for our stream bitrate.',
      discussionPrompts: [
        'Why can a great camera and great machines still give a stuttering stream — where’s the bottleneck?',
        'In one sentence: how is NVMe different from the network, and why does mixing them up cause bad decisions?',
        'What would "counting the cost" look like before we upgrade to a higher-quality stream?',
      ],
    },
  },
  {
    id: 'bc7-llms-for-broadcast',
    title: 'A.I. that serves the broadcast — and how it really works',
    bigIdea: 'An A.I. like an LLM is a very well-read helper that guesses the next word — it can sound sure and be wrong, so we test it. Used wisely, it serves the broadcast: live captions, turning the Bishop’s sermon into clips and notes, and searching the whole sermon archive (The Word — Migdal) by meaning.',
    inApp: 'In the app’s Council Chamber, ask the A.I. to draft a short title and three social captions for a recent sermon — then VERIFY every Scripture reference and quote it gives against the actual message before anyone would post it. Catch it being confidently wrong once.',
    anchor: { ref: '1 Thessalonians 5:21; Colossians 3:16', theme: 'Test everything; hold fast what is good. Let the word of Christ dwell in you richly. A.I. is a tool to spread the Word further — never a source of truth to trust unchecked.' },
    launch: { view: 'church', churchView: 'home' },
    media: [
      { type: 'video', title: 'Walk-through: sermon → captions, clips & archive search', status: 'pending', caption: 'A recorded broadcast walk-through of the A.I. tools — to be captured and added.' },
    ],
    quiz: {
      questions: [
        { q: 'What is an LLM actually doing when it answers?', options: ['Looking up verified facts in a database', 'Predicting the next word from patterns — it can be confidently wrong', 'Reading your mind'], answer: 1, explain: 'It is a next-word predictor with no ground truth; it can "hallucinate." Test and verify everything it says.' },
        { q: 'What is the rule for A.I. on the broadcast?', options: ['Auto-post whatever it writes', 'A.I. drafts and finds; a person verifies and decides — especially Scripture, names, quotes', 'Never use A.I. at all'], answer: 1, explain: 'Anything published carries the church’s name and the Bishop’s words — a person verifies before it goes out.' },
      ],
    },
    lesson: 'Same honest framing the youth class teaches, now aimed at the broadcast: a large language model (LLM) has read an enormous amount of writing and learned which word tends to come next — a brilliant pattern-guesser, not a knower. It has no eyes, no conscience, and no memory of your service; it can produce a confident, well-worded paragraph that is simply made up (a "hallucination"). So the team’s posture is the same as 1 Thessalonians 5:21 — test everything, hold fast what is good — which matters doubly here, because anything the broadcast publishes carries the church’s name and the Bishop’s words. Used with that discipline, A.I. genuinely serves the broadcast in three real ways. First, live captions: speech-to-text tools (like Whisper) can transcribe the sermon so it’s accessible to the hard-of-hearing and to viewers in noisy rooms — near-live, not perfect, and worth a human eye. Second, sermon-to-content: after service, A.I. can draft a title, a summary, social captions, and short-clip suggestions from the recording — a first draft a person then checks and approves. Third, clip search over the archive: the Bishop’s whole body of sermons (The Word — Migdal) can be searched by meaning, so finding "the message on forgiveness from last spring" takes seconds instead of an afternoon. In every case the rule holds: A.I. drafts and finds; a person verifies and decides — especially every Scripture reference, name, and quote. Let the word of Christ dwell richly (Colossians 3:16); the tool exists to carry that Word further, accurately.',
    facilitator: {
      talkingPoints: [
        'An LLM predicts the next word — it does not look things up and can be confidently wrong. Same tool, same caution as the youth class.',
        'Three real broadcast uses: (1) live captions / transcription, (2) sermon → title, summary, social captions, clips, (3) meaning-search over the sermon archive (The Word — Migdal).',
        'The rule: A.I. DRAFTS and FINDS; a person VERIFIES and DECIDES. Anything published carries the church’s name and the Bishop’s words.',
        'Always verify every Scripture reference, name, and quote it produces — it will invent plausible ones. 1 Thess 5:21: test everything.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Thessalonians 5:21 and Colossians 3:16. | Recap last week (10): a learner reports our real upload speed vs our stream bitrate. | Teach the big idea (15): next-word prediction + hallucination in plain words; then the three real broadcast uses; then the draft-vs-decide rule. | Hands-on at your station (25): in the Council Chamber, ask the A.I. for a title + three captions for a recent sermon, then verify every reference and quote against the actual message; deliberately catch one wrong/invented detail. | Discussion (15): what could A.I. save us the most time on — and where must a person always stay in the loop? | Send-off + solo task (5): solo task — pick one recent sermon and draft (with A.I.’s help, fully verified) a title and three captions to show the team.',
      discussionPrompts: [
        'Where would A.I. help our broadcast most — captions, clips, or archive search — and why?',
        'What’s the danger of letting an unverified A.I. caption or Scripture reference go public under the church’s name?',
        'How is "test everything" the exact same rule for A.I. as it is for any teaching we receive?',
      ],
    },
  },
  {
    id: 'bc8-pov-sops',
    title: 'Capturing the Work: POV SOPs',
    bigIdea: 'We record each station’s real procedure first-person with the Ray-Ban Meta glasses, and the church’s own A.I. turns it into a written checklist. Tacit "you just have to know" skill becomes a transferable SOP — so the next person can run with it. We capture the team and the gear, never the congregation.',
    inApp: 'At your station: wear the glasses and capture your real procedure first-person — say "Hey Meta" to start. For a long sequence, chain several ~3-minute clips. Then pull the clips into the church’s store, let the local A.I. draft a step-checklist from your narration, and correct it. Priority capture: sit with Deacon Wright and record a founding sequence.',
    anchor: { ref: 'Habakkuk 2:2; Psalm 78:4–6', theme: 'Write the vision; make it plain on tablets, so the one who reads it may run. Tell the next generation the works of the Lord. Plain, recorded instruction is how the work is handed on.' },
    media: [
      { type: 'clip', title: 'POV: Deacon Wright — founding sequence', sopId: 'sop-founding-cameras', caption: 'The priority capture: the originating know-how, recorded so it outlasts any one of us (pending capture).' },
      { type: 'clip', title: 'POV: video-wall power-up & install', sopId: 'sop-videowall-powerup', caption: 'First-person power-up/install order for the left & right machines (pending capture).' },
    ],
    levels: {
      teen: 'You wear the glasses and record yourself doing your job at your station — first person, like the camera is your own eyes. Just say "Hey Meta" to start recording. The clips are short (about 3 minutes), so for a long job you record a few in a row. Then we pull the videos onto the church’s own computer (the NAS — not Meta’s cloud), and the church’s A.I. listens to what you said and writes out the steps as a checklist. You fix anything it got wrong. Now the next person can learn your station from your own video. We only film the team and the equipment — never the people in the congregation.',
      senior: 'This is the multiplication mechanism: convert tacit, in-the-head expertise into recorded, transferable SOPs — your founding sequences first. Workflow on the Ray-Ban Meta (Gen 2): hands-free "Hey Meta" capture, up to 3K, ~3-minute clips (so a long procedure is several chained clips), open-ear mic narration, ~8-hour battery (charge between sessions). The pipeline is deliberately sovereign and capture-only: raw media comes OFF the glasses into the family NAS / sovereign store, and the LOCAL LLM (Ollama) transcribes, captions, indexes, and auto-drafts the step-checklist — never Meta’s cloud or A.I. for our content. A human then corrects the draft. The device can livestream to IG/FB, but that is not our content path. Consent is a bright line: the lens records the team and the procedures, never the congregation.',
    },
    quiz: {
      questions: [
        { q: 'Where does the raw POV footage get processed?', options: ['Meta’s cloud A.I.', 'The church’s own NAS, by the LOCAL A.I. (sovereign, capture-only glasses)', 'Posted publicly first'], answer: 1, explain: 'The glasses are capture-only; media goes to the family NAS and the local LLM transcribes/indexes it — never Meta’s cloud for content.' },
        { q: 'A procedure takes 10 minutes. How do you capture it on Gen 2?', options: ['One 10-minute clip', 'Chain several ~3-minute clips in order', 'You can’t capture it at all'], answer: 1, explain: 'Gen 2 clips cap around 3 minutes, so long sequences are recorded as multiple chained clips, stitched on ingest.' },
        { q: 'Who and what do we capture?', options: ['Everyone, including the congregation', 'The team and the gear — never the congregation', 'Only the pastor'], answer: 1, explain: 'It is a training-capture tool, not surveillance: the team and procedures only, never the congregation.' },
      ],
    },
    lesson: 'This is the week the team stops losing knowledge. Most of what makes a station run well lives in one person’s head — how Bradley knows when to cut, the exact order Deacon Wright brings the cameras up — and when that person isn’t there, the broadcast suffers. The Ray-Ban Meta (Gen 2) glasses fix that by letting each operator record their real procedure first-person, hands-free ("Hey Meta"), right while they do it. The clips are short — about three minutes each — so a long procedure becomes a few clips chained in order; the glasses shoot up to 3K, capture open-ear narration, and run most of a day on a charge (top them up between sessions). Then comes the part that makes it sovereign and safe: the glasses are capture-only. The raw video is pulled OFF the device into the church’s own NAS — never Meta’s cloud or Meta’s A.I. for our content — and the church’s LOCAL A.I. transcribes what was said, captions it, indexes it for search, and drafts a step-by-step checklist from the narration. A person then corrects that draft, and the clip plus checklist drop into the Sequence / SOP Library for the next operator. The most important capture is Deacon Wright’s founding sequences — turning the originating wisdom into something a newcomer can run with. One bright line holds throughout: we record the team and the gear, never the congregation. This is "write the vision and make it plain, so the one who reads it may run" (Habakkuk 2:2), and "tell the next generation the works of the Lord" (Psalm 78) — recorded, plainly, so the work is handed on.',
    facilitator: {
      talkingPoints: [
        'The problem this solves: station knowledge lives in one head; when they’re out, the broadcast suffers. Recorded SOPs fix that.',
        'Gen 2 workflow: hands-free "Hey Meta" capture, up to 3K, ~3-min clips (chain several for a long sequence), ~8-hr battery (charge between sessions).',
        'SOVEREIGN + capture-only: raw media → the church NAS → the LOCAL A.I. transcribes/captions/indexes + drafts the checklist. Never Meta’s cloud/A.I. for our content.',
        'A human corrects the auto-drafted checklist; clip + checklist land in the Sequence / SOP Library for the next operator.',
        'Priority capture = Deacon Wright’s founding sequences (multiplication). Consent bright line: the team and gear, NEVER the congregation.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Habakkuk 2:2 and Psalm 78:4–6. | Recap last week (10): a learner shows the verified A.I.-drafted captions from week 7. | Teach the big idea (15): why we capture (stop losing knowledge); the Gen 2 workflow; the sovereign capture-only pipeline; the consent bright line. | Hands-on at your station (25): each operator captures one real ~3-min POV clip of their procedure ("Hey Meta"), then walks the ingest: pull to the NAS, let the local A.I. draft the checklist, correct one step. | Discussion (15): whose knowledge would hurt us most to lose — and which sequence do we capture first? | Send-off + solo task (5): solo task — schedule and capture one founding sequence with Deacon Wright.',
      discussionPrompts: [
        'Which station’s knowledge would hurt the broadcast most if that person were suddenly unavailable?',
        'Why does it matter that the footage is processed on our own NAS by our own A.I., not Meta’s cloud?',
        'What’s the difference between capturing to teach the team and capturing that would feel like surveillance?',
      ],
    },
  },
  {
    id: 'bc9-excellence-as-worship',
    title: 'Excellence as worship — and raising the next operators',
    bigIdea: 'We hold a high standard because the broadcast is worship and it carries the Word — not to impress anyone, but because it’s for the King. The mark of mastery is that you make it reliable, and that you can teach the next person. Founders raise founders.',
    inApp: 'As a team: write the broadcast’s run-of-show and a simple pre-service checklist (power, camera, light, audio, OBS scenes, encoder/NVENC, network, stream live). Then each person names the one part of the chain they could teach to someone new.',
    anchor: { ref: 'Colossians 3:23–24; 2 Timothy 2:2', theme: 'Whatever you do, work heartily as for the Lord and not for men. What you have heard, entrust to faithful people who can teach others. Excellence is worship; the work is handed on.' },
    levels: {
      teen: 'We hold a high standard not to show off, but because the broadcast is worship — it carries the Word to people who need it. "Whatever you do, do it with all your heart, as for the Lord" (Colossians 3:23). Excellence isn’t one great Sunday; it’s a broadcast that works EVERY Sunday — which is why we write down the run-of-show and a checklist so nothing depends on one person remembering. And you really own your station when you can teach it to someone else. So pick your station and get ready to teach the next person. Founders raise founders.',
      senior: 'The commissioning names why the standard is high: the broadcast is an act of worship that carries the Word — Colossians 3:23, work as for the Lord, not for men. Two marks of a mature team: reliability (a documented run-of-show + pre-service checklist so excellence is repeatable, not a lucky Sunday) and multiplication (you own a station when you can teach it). The SOP library from last week is the instrument of the second mark — your recorded sequences are how you hand your station on. Deacon Wright founded this work and taught others to carry it; 2 Timothy 2:2 — entrust what you’ve learned to faithful people who can teach others also. Each operator takes a link to own and to teach. The broadcast outlasts any one of us.',
    },
    quiz: {
      questions: [
        { q: 'Why do we hold a high standard for the broadcast?', options: ['To impress other churches', 'Because it’s worship and it carries the Word — work as for the Lord', 'Because the gear was expensive'], answer: 1, explain: 'Colossians 3:23 — whatever you do, work heartily as for the Lord. Excellence here is worship, not performance.' },
        { q: 'What does it mean to truly "own" your station?', options: ['To be the only one who can do it', 'To be able to teach it to the next person', 'To never let anyone else touch it'], answer: 1, explain: 'Mastery shows in teaching it — 2 Timothy 2:2. Founders raise founders; the SOP library is how you hand it on.' },
      ],
    },
    lesson: 'This is the commissioning, and it names why the standard is high in the first place: not perfectionism, not showing off, but because the broadcast is an act of worship and it carries the Word of God out to people who are counting on it. Darrell holds the team to that standard based on Yahweh’s guidance, and the anchor is Colossians 3:23 — "whatever you do, work heartily, as for the Lord and not for men." Two marks separate a skilled team from a lucky one. The first is reliability: excellence isn’t a great Sunday, it’s a broadcast that works every Sunday — which is why a team writes down its run-of-show and a pre-service checklist (power, camera, light, audio, OBS scenes, encoder/NVENC, network, stream confirmed live) and runs it the same way every time, so nothing rides on one person’s memory. The second is multiplication: the proof you truly own your station is that you can teach it. Deacon Wright founded this work by starting the cameras with the Bishop and teaching others to carry it; that same handing-on is the assignment now. Paul tells Timothy to entrust what he’s learned "to faithful people who will be able to teach others also" (2 Timothy 2:2). So each operator — Clifton, Bradley, Chris, Isaiah, Coreyon, Pancho, and the rest — prepares to teach their one link to the next person. Founders raise founders; that’s how a broadcast outlasts any one of us and keeps serving the King.',
    facilitator: {
      talkingPoints: [
        'Name WHY the standard is high: the broadcast is worship and it carries the Word — Colossians 3:23, work as for the Lord, not to impress people.',
        'Excellence = reliability. Not one great Sunday — a broadcast that works EVERY Sunday. That’s what a run-of-show and a checklist protect.',
        'Write it down so nothing rides on one person’s memory: power, camera, light, audio, OBS scenes, encoder/NVENC, network, stream live.',
        'Multiplication is mastery: you own your station when you can teach it. Honor Deacon Wright’s founding; 2 Timothy 2:2 — entrust it to faithful people.',
        'Founders raise founders — Clifton, Bradley, Chris, Isaiah, Coreyon, Pancho each take a link to teach. The broadcast outlasts any one of us.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Colossians 3:23–24 and 2 Timothy 2:2. | Recap last week (10): a learner shows the verified title + captions they drafted with A.I. | Teach the big idea (15): why the standard is high (worship + the Word); reliability via run-of-show + checklist; mastery as the ability to teach. | Hands-on at your station (25): as a team, write the run-of-show and the pre-service checklist together; then each person names the one link they’ll prepare to teach a newcomer. | Discussion (15): what’s the one thing that, if we got it right every single week, would lift the whole broadcast? | Send-off + solo task (5): commission them — solo task: teach your station’s one key thing to one other team member before next service.',
      discussionPrompts: [
        'What does "work as for the Lord and not for men" change about how we run the booth on a hard Sunday?',
        'If you couldn’t serve next Sunday, who have you taught well enough to take your station — and if no one, who will you start teaching?',
        'What’s the difference between a broadcast that’s impressive once and one that’s excellent every week?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this course behaves identically to the youth class.
// ---------------------------------------------------------------------------
import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';
import { SOP_SEQUENCES, SOP_CAPTURE_PIPELINE, sopLibraryMarkdown } from './broadcast-sops.js';

// The interest + graduate-helper tags for THIS course (distinct from the youth
// class tag) so the Governor's roster can tell broadcast sign-ups apart.
export const BROADCAST_INTEREST_TAG = '[Broadcast class interest]';
export const BROADCAST_HELPER_TAG = '[Broadcast class helper]';

// Re-export the SOP library so the host wires ONE import for the whole course.
export { SOP_SEQUENCES, SOP_CAPTURE_PIPELINE };

export function resolveBroadcastCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, BROADCAST_CONFIRMED_COHORT, BROADCAST_PROPOSED_COHORT_START);
}

export function buildBroadcastSchedule(startISO) {
  return buildScheduleFor(BROADCAST_MODULES, startISO, BROADCAST_META.cadenceDays);
}

export function broadcastProgressSummary(progress = {}) {
  return progressSummaryFor(BROADCAST_MODULES, progress);
}

export function exportBroadcastCurriculumMarkdown(startISO = null) {
  const curriculum = exportCurriculumMarkdownFor(
    { meta: BROADCAST_META, sessionFlow: BROADCAST_SESSION_FLOW, modules: BROADCAST_MODULES },
    startISO,
  );
  // The paper export carries the Sequence / SOP Library too (pipeline + consent +
  // every sequence's real checklist), inserted before the footer line.
  const footer = BROADCAST_META.footer;
  const sop = sopLibraryMarkdown(SOP_SEQUENCES, SOP_CAPTURE_PIPELINE);
  if (curriculum.includes(footer)) {
    return curriculum.replace(footer, `${sop}\n\n---\n\n${footer}`);
  }
  return `${curriculum}\n${sop}\n`;
}

// The tutor course-meta this class passes to askTutor (lib/class-tutor.js) so the
// per-week solo guide introduces itself as the broadcast course, with the
// excellence-as-worship posture, while keeping the test-and-verify discipline.
export const BROADCAST_TUTOR_META = {
  title: BROADCAST_META.title,
  intro: 'You are a patient, encouraging tutor for a church broadcast-team training called "The Broadcast: How It All Works."',
  posture: 'Guide ONE operator, on their own, to understand the gear and the craft at their station — cameras, light, OBS, the GPU/CPU machines, the network, and how A.I. serves the broadcast. Excellence is worship: hold a high, gracious standard. Explain real distinctions plainly (a GPU is not a "cpu"); never hand-wave.',
};
