// =============================================================================
// sovereign-ai-class — "Sovereign A.I.: Why We Build Local"
// =============================================================================
// The FOURTH PoeTech / COLG Learn course (sister to "Learning A.I. The Way",
// "The Broadcast: How It All Works", and "The Infrastructure: How We Build It
// Sovereign"). Where the Infrastructure course teaches the IRON, this course
// teaches the WHY and the STRATEGY of running A.I. on iron we own: local-first
// as resilience + data sovereignty, the honest model-tier landscape, how SKOS
// actually routes work between local models and vendor LLMs behind the Cage, and
// the market/strategy framing (the five local-A.I. opportunities).
//
// SAME SHARED FRAMEWORK as the other three courses (NOT a one-off): the generic
// helpers in church-classes.js (computed schedule, real progress, markdown
// export, cohort propagation), the self-driving tutor (class-tutor.js → askTutor),
// and the multi-modal lesson schema + skill-level branching + quiz/assessment +
// graduate→helper from learn-framework.js. It is AGE-ADAPTIVE: every module
// carries `levels.teen` (plainer) and `levels.senior` (deeper, edge-aware) so the
// SAME truth renders age-right (learn-framework AGE_BANDS), and every module runs
// the shared Research → Plan → Execute primitive (`rpe`).
//
// VERIFICATION / NO-FABRICATION (DR-0076 — the whole point of this course is to
// model honesty about A.I.):
//   • Model facts are VERIFIED against the live Ollama library / public model
//     cards as of mid-2026 (Qwen2.5, Qwen3, Gemma 3, DeepSeek-R1, Devstral, Llama
//     3.x). Names + sizes move fast, so the lesson SAYS SO and tells the learner
//     to check `ollama list` / ollama.com/library before relying on a number —
//     the fact is framed as current-as-of, never timeless.
//   • The hardware truth matches the Infrastructure course exactly: the Synology
//     DS1621xs is a Xeon D-1527, ECC, CPU-ONLY (no GPU); it runs small quantized
//     models at CPU speed and is honestly slow/weaker on long, complex personas.
//     The GPU farm (dual RTX 3090 ≈ 48 GB, DR-0014) is PLANNED / unbought; the
//     church RTX 4070 wall machines are the only real GPUs today. A 70B-class
//     model at Q4 needs ~48 GB of VRAM.
//   • The "a provider could ban a model" scenario from the source video is used
//     ONLY as an ILLUSTRATIVE scenario ("imagine…"), never asserted as an event.
//   • Live numbers (which model is hot, RAM/VRAM in use) are NOT hardcoded here —
//     they live on the in-app LLM-health + Infrastructure cards that read the real
//     feed. Scripture anchors are cited by REFERENCE + a plain-language theme
//     gloss, never a quoted translation (SCRIPTURE-REFERENCE-STANDARD).
//
// Grounds: AI-FOUNDATION-INTERNAL-OPERATIONS (the NAS runs the system),
// DATA-AS-EMPOWERMENT-NOT-EXTRACTION ("we don't sell data" — the sovereign moat),
// the three-brakes rule + the Cage, the tiered-LLM orchestrator (DR-0056) + the
// vendor-routing strategy (which mind gets which work), COMMUNITY-FIRST-MISSION
// (regulated/under-served communities are the named opportunity), and the
// app-is-primary default (the course's hands-on tie to real in-app A.I. surfaces).
// =============================================================================

// Proposed start for Cohort 1 — a Saturday (the build/teach rhythm), the week
// after the Infrastructure course's proposed start. Governor-editable in-app
// (data.sovereignAiCohort.startDate); the UI shows the true weekday so a
// non-Saturday is caught honestly. Stays "proposed" until Darrell confirms.
export const SOVEREIGN_AI_PROPOSED_COHORT_START = '2026-08-01';

// PUBLISHED cohort — what every learner on every deployed build sees. Until
// Darrell locks the date this stays { confirmed:false } and the UI reads
// "proposed." Set confirmed:true (and startDate if it moved) and the next deploy
// propagates it (same publish model as the other three courses).
export const SOVEREIGN_AI_CONFIRMED_COHORT = {
  startDate: '2026-08-01',
  confirmed: false,
};

export const SOVEREIGN_AI_META = {
  key: 'sovereign-ai',
  title: 'Sovereign A.I.: Why We Build Local',
  audience: 'builders, leaders, and family — anyone deciding where our A.I. should run',
  tagline: 'A generator in the garage. The grid can flicker; our lights stay on.',
  format: '9 weekly sessions · ~75 min each (paced to your age) · live time with Darrell plus hands-on with the real A.I. surfaces',
  cadenceDays: 7,
  weeks: 9,
  handsOnLabel: 'Hands-on in the app',
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. We run our A.I. on machines we own so the data serves the family and the community — and is never sold. Built to be handed on, at every age._',
};

// The 75-minute session shape — the SAME muscle memory as every other course.
export const SOVEREIGN_AI_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 25, name: 'Hands-on in the app' },
  { minutes: 15, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const SOVEREIGN_AI_SESSION_MINUTES = SOVEREIGN_AI_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

// Each module mirrors the other courses' shape: a learner-plain `bigIdea`, a deep
// `lesson`, age `levels` (teen/senior depth of the same truth), the shared `rpe`
// (Research → Plan → Execute), multi-modal `media`, a real `inApp` activity (with
// a `launch` deep link where a real surface exists), a `quiz`, and a Scripture
// `anchor` (reference + theme gloss, never a quoted verse).
export const SOVEREIGN_AI_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'sov1-generator-in-the-garage',
    title: 'The generator in the garage — why local-first',
    bigIdea: 'A company that hosts your A.I. can change its policy, raise its price, go down, or cut you off — and if your family’s and church’s tools live only on its servers, they go dark with it. Local-first A.I. is a generator in the garage: when the grid flickers, our lights stay on. We build sovereign by default, and we never sell your data.',
    inApp: 'Open the in-app A.I. health card and see that a model is running on OUR own machine. Then open your privacy & settings and read the promise in your own words: we process your data, we do not sell it.',
    anchor: { ref: 'Matthew 7:24–27; Proverbs 22:3', theme: 'The wise build on rock that holds when the storm comes; the prudent see danger and take refuge. Owning the foundation our tools run on is that kind of wisdom — not fear.' },
    launch: { view: 'about' },
    rpe: {
      research: 'List every tool the family or church now depends on that lives on someone else’s servers.',
      plan: 'For each, ask: what happens to us if that provider changes its price, its policy, or goes down?',
      execute: 'Name the one that would hurt most — that is the first candidate to make sovereign.',
    },
    media: [
      { type: 'diagram', key: 'sovereign-resilience', title: 'The generator in the garage', caption: 'A vendor outage / policy change / price spike can switch off a rented tool. A tool on iron we own keeps running.' },
    ],
    levels: {
      teen: 'Most apps you use run on a giant company’s computers far away. That’s fine — until the company changes the rules, raises the price, has an outage, or shuts the app down. Then it’s just… gone, and your stuff with it. "Local-first" means we run our most important A.I. on OUR OWN computer, right here. It’s like having a generator in the garage: when the power flickers, our lights stay on. And because it’s our machine, nobody can sell what you type into it. That’s the whole idea of this class.',
      senior: 'The thesis is continuity-of-capability, not anti-vendor sentiment. When a critical capability is rented, four independent failure modes can revoke it overnight: a policy/terms change, a price increase past your budget, an outage, or an account/region cutoff — none of which you control, all of which can land at the worst moment. Local-first is the resilience hedge: the capability runs on hardware you own and govern, so it survives all four. The second, inseparable claim is data sovereignty — when inference runs on your box, your family’s and church’s content is never shipped to a vendor to be logged, mined, or trained on. PoeTech’s binding direction is sovereign-by-default + "we don’t sell data," and that structural difference from extractive mainstream tech is the competitive moat, not a feature. The honest cost — you carry the responsibility a vendor would (hardware, updates, uptime) — is exactly why a course exists to share it.',
    },
    quiz: {
      questions: [
        { q: 'What is the core reason to run A.I. locally?', options: ['It is always the cheapest', 'Resilience + data sovereignty — a vendor’s outage, policy change, or price spike can’t switch off a tool that runs on iron we own, and our content never leaves', 'It is always the smartest'], answer: 1, explain: 'Local-first is the generator in the garage: continuity of capability plus the data never leaving — not a claim of being cheapest or smartest.' },
        { q: 'Which of these can a provider do to a tool you only rent?', options: ['Nothing, once you pay', 'Change its policy, raise the price, go down, or cut you off — any of which can take the tool away', 'Only improve it'], answer: 1, explain: 'All four are real, vendor-controlled failure modes; owning the machine is the hedge against them.' },
      ],
    },
    lesson: 'Start with the question this whole course answers: where should our most important A.I. actually run? The easy default is "on whoever’s cloud is popular" — and for a lot of work that is genuinely fine. But a capability you only rent can be taken from you in four ways you do not control: the provider changes its policy or terms, it raises the price past what you can pay, it has an outage, or it cuts off your account or your region. Any one of those can land at the worst possible moment, and your data walks out the door with the tool. Local-first A.I. is the hedge. We run the capabilities the family and the church most depend on on hardware WE own and govern — a generator in the garage, so that when the grid flickers, our lights stay on. Inseparable from resilience is sovereignty: when the model runs on our box, what we type into it is never shipped off to be logged, mined, or used to train someone else’s product. That is why PoeTech is sovereign by default and why "we don’t sell data" is a binding promise, not marketing — the structural difference from extractive tech IS the moat. There is an honest cost: we carry the responsibility a landlord would otherwise carry — the hardware, the updates, keeping it running — which is the very reason this course exists, so that work is shared and written down rather than trapped in one head. Jesus said the wise build on rock that holds when the storm comes (Matthew 7), and the prudent take refuge before the danger arrives (Proverbs 22:3). Building on a foundation we own is that kind of wisdom — sober, not fearful.',
    facilitator: {
      talkingPoints: [
        'Local-first = resilience + data sovereignty. The generator-in-the-garage image: the grid can flicker; our lights stay on.',
        'Four vendor-controlled ways a rented capability is revoked: policy change, price spike, outage, account/region cutoff.',
        'Sovereignty is inseparable: when inference runs on our box, our content never leaves to be logged, mined, or trained on.',
        'PoeTech is sovereign-by-default + "we don’t sell data" — the structural moat, not a feature. Honest cost: we carry uptime ourselves.',
        'Matthew 7 / Proverbs 22:3 — build on rock; take refuge before the storm. Wisdom, not fear.',
      ],
      howToRun: 'Prayer + the anchor (5): open in prayer; read Matthew 7:24–27 — the house on the rock. | Recap last week (10): first session — instead, go around: name one app you’d miss most if it vanished tomorrow. | Teach the big idea (15): the four failure modes of a rented capability; the generator image; sovereignty + "we don’t sell data." | Hands-on in the app (25): open the A.I. health card (a model runs on our box); open privacy & settings and read the promise aloud. | Discussion (15): which capability would hurt most if a vendor cut it off — and why? | Send-off + solo task (5): solo task — list three tools you rely on that live on someone else’s servers.',
      discussionPrompts: [
        'Which of the four failure modes feels most real to you — a price spike, an outage, a policy change, or a cutoff?',
        'What does "we don’t sell data" change about how you’d use a tool?',
        'Where is the honest cost of owning it, and how do we carry that together?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov2-what-a-model-costs-to-run',
    title: 'What a model costs to run — size, capability, hardware',
    bigIdea: 'A model’s SIZE (its parameter count) drives what it can do AND what hardware it needs. Bigger is generally more capable but needs more memory and is slower. "Quantization" shrinks a model to fit smaller hardware, trading a little quality for a lot of reach. The honest chain is: size → capability → hardware → what to expect.',
    inApp: 'Open the A.I. health card and read the live loaded model and its size. Then look at the VRAM ladder diagram and place that model on it: would it run on our CPU NAS, or would it need a GPU?',
    anchor: { ref: 'Luke 14:28; Proverbs 24:3–4', theme: 'Count the cost before you build; by wisdom a house is built and by knowledge its rooms are filled. Sizing a tool honestly to the job is stewardship.' },
    rpe: {
      research: 'What does "7B" or "70B" actually mean, and how much memory does each need?',
      plan: 'Decide which size class fits the job in front of you before you reach for the biggest one.',
      execute: 'Map one real task to the smallest model that can do it well — that is the frugal, sovereign choice.',
    },
    media: [
      { type: 'diagram', key: 'vram-ladder', title: 'The size → hardware ladder', caption: 'Small models run on the CPU NAS; a 70B-class model needs ~48 GB of GPU VRAM — why a GPU box is planned.' },
    ],
    levels: {
      teen: 'A model’s "size" is how many little dials it has inside — billions of them, called parameters. A "7B" model has 7 billion; a "70B" has seventy billion. More dials usually means smarter, but it also means it needs a lot more memory and runs slower. There’s a clever trick called "quantization" that squishes a model down so it fits on smaller computers — you lose a tiny bit of sharpness but it runs in way less memory. The rule to remember: pick the SMALLEST model that does your job well. Bigger isn’t free.',
      senior: 'Three numbers govern feasibility. Parameter count (e.g., 7B/14B/32B/70B) is the rough capability + memory proxy. Quantization (Q8 → Q4 → lower) trades precision for footprint: a 7B model at full FP16 wants ~14 GB, but at 4-bit (Q4) it fits in roughly 4–5 GB with modest quality loss — which is what makes small local models practical at all. Memory bandwidth, not just capacity, sets token-rate: this is why a CPU box with plenty of RAM still runs a mid-size model slowly, while a GPU with high-bandwidth VRAM runs it fast. The working heuristic for our stack: ≤4B is fast even on the CPU NAS; 7–14B at Q4 runs on the CPU NAS but at CPU speed (patient tasks only); ~30B is the heavily-quantized ceiling of the CPU box; 70B-class at Q4 needs ~48 GB of VRAM and therefore the GPU tier. The discipline is right-sizing — the smallest model that clears the task’s bar is the frugal AND the sovereign choice, because it’s the one most likely to run on hardware we own.',
    },
    quiz: {
      questions: [
        { q: 'What does a model’s "size" (parameter count) most directly affect?', options: ['Only its name', 'Its capability AND the hardware it needs (memory + speed)', 'Only its color'], answer: 1, explain: 'Size drives both what it can do and what it takes to run — the size → capability → hardware chain.' },
        { q: 'What does quantization do?', options: ['Makes a model bigger', 'Shrinks a model to fit smaller hardware, trading a little quality for a lot of reach', 'Deletes the model'], answer: 1, explain: 'Q4 lets a 7B model run in ~4–5 GB instead of ~14 GB — the trick that makes small local models practical.' },
        { q: 'What is the right-sizing rule?', options: ['Always pick the biggest model', 'Pick the smallest model that does the job well', 'Size doesn’t matter'], answer: 1, explain: 'The smallest capable model is the frugal and the sovereign choice — most likely to run on iron we own.' },
      ],
    },
    lesson: 'Before you can decide WHERE a model runs, you have to understand what a model COSTS to run, and that comes down to a short, honest chain: size → capability → hardware → what to expect. A model’s size is its parameter count — the billions of internal "dials" it learned. A 7B model has seven billion; a 70B has seventy billion. More parameters generally means more capability, but it also means more memory to hold the model and slower generation. That is the trade nobody can wish away. There is one essential trick that makes small local A.I. practical at all: quantization. Storing each parameter at lower precision — going from full 16-bit down to 4-bit (Q4) — shrinks the model dramatically (a 7B model drops from roughly 14 GB to about 4–5 GB) while losing only a little quality. That is why a modest box can run a useful model at all. One subtlety worth knowing: it is memory BANDWIDTH, not just capacity, that sets speed — which is exactly why our CPU NAS, even with plenty of RAM, runs a mid-size model slowly, while a GPU with high-bandwidth VRAM runs the same model fast. Put it together into a working heuristic for our stack: tiny models (≤4B) are quick even on the CPU NAS; 7–14B at Q4 will run on the CPU NAS but at CPU speed, so only for patient tasks; around 30B is the heavily-quantized ceiling of that box; and a 70B-class model at Q4 needs roughly 48 GB of VRAM, which means the GPU tier. The skill this builds is right-sizing: choosing the SMALLEST model that clears the bar for the task. That is both the frugal choice and the sovereign one, because the smaller it is, the more likely it runs on hardware we already own. Count the cost before you build (Luke 14:28); by knowledge the rooms are filled (Proverbs 24).',
    facilitator: {
      talkingPoints: [
        'The honest chain: size (parameters) → capability → hardware needed → what to expect.',
        'Quantization (Q4) shrinks a 7B model from ~14 GB to ~4–5 GB with small quality loss — what makes small local models practical.',
        'Memory BANDWIDTH sets token-rate: a CPU box with RAM still runs mid models slowly; a GPU’s VRAM runs them fast.',
        'Heuristic: ≤4B fast on CPU NAS; 7–14B@Q4 runs on CPU NAS but slow; ~30B is the CPU ceiling; 70B@Q4 ≈ 48 GB VRAM → GPU tier.',
        'Right-size: the smallest capable model is the frugal AND sovereign choice. Luke 14:28 — count the cost.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 14:28 — count the cost. | Recap last week (10): a learner explains the generator-in-the-garage idea. | Teach the big idea (15): parameters; quantization; bandwidth vs capacity; the size→hardware heuristic. | Hands-on in the app (25): open the A.I. health card, read the live model + size; place it on the VRAM ladder — CPU NAS or GPU? | Discussion (15): why is "always pick the biggest model" a mistake? | Send-off + solo task (5): solo task — find one task you’d give A.I. and name the smallest model that could do it.',
      discussionPrompts: [
        'Why does a bigger model cost more than just money?',
        'What does quantization give up, and what does it buy?',
        'When is the smallest capable model the RIGHT choice, not a compromise?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov3-model-tier-landscape',
    title: 'The model-tier landscape — what runs where',
    bigIdea: 'There isn’t one "A.I." — there’s a landscape of models at different sizes, and a matching landscape of hardware tiers to run them. Three tiers: the AI Forge tier (a GPU / Mac Studio node — deep logic, RAG, agentic work), the Synology-CPU tier (the DS1621xs now — small quantized models), and the deep-reasoning tier (frontier reasoning models, vendor or a serious multi-GPU node). Match the model to the tier honestly.',
    inApp: 'Study the model-tier ladder diagram. Then open the Infrastructure inventory + A.I. health cards and identify which tier we actually have running today (the CPU NAS) and which tiers are planned.',
    anchor: { ref: 'Exodus 35:30–35; 1 Corinthians 12:4–6', theme: 'God gave Bezalel skill for every craft; there are varieties of gifts, but the same Spirit. Different tools for different work, each honored for what it does.' },
    rpe: {
      research: 'Which models exist at which sizes right now (check the live Ollama library), and which hardware tier does each need?',
      plan: 'Sort a handful of real tasks into the tier that fits each.',
      execute: 'Confirm against the live A.I. health card which tier is actually online for us today.',
    },
    media: [
      { type: 'diagram', key: 'model-tier-ladder', title: 'The three tiers', caption: 'Synology-CPU (small models, today) · AI Forge GPU/Mac Studio (deep logic / RAG / agentic, planned) · deep-reasoning (frontier MoE, vendor or multi-GPU).' },
    ],
    levels: {
      teen: 'Think of A.I. models like vehicles. A scooter (a tiny model) is quick and cheap and runs anywhere — great for short errands. A truck (a mid-size model) carries more but needs a real engine — a GPU. And a freight train (a frontier model) hauls huge loads but needs serious track — big multi-GPU machines or a vendor’s cloud. We have three "tiers" of hardware to match: the Synology box we own now (runs the scooters), a planned GPU/Mac Studio "Forge" (the trucks — deep thinking, searching our own library, doing multi-step jobs), and the deep-reasoning tier for the freight-train problems. Pick the right vehicle for the trip.',
      senior: 'The landscape, mapped honestly to our hardware. (1) The Synology-CPU tier — the DS1621xs (Xeon D-1527, ECC, CPU-only) — runs small quantized open models today: think Gemma 3 1B/4B, Qwen2.5 7B, Llama 3.x 8B, Phi-class. Fast on the small end, patient on 7–14B, weak on long complex personas. This is what is actually online for us now. (2) The AI Forge tier — a dedicated GPU node (the planned dual-RTX-3090 ≈ 48 GB farm, DR-0014) or an Apple Mac Studio with large unified memory — is the home for deep logic, RAG over our own corpus, and agentic multi-step / tool-use work, running 14–70B-class models at usable speed. PLANNED, unbought; the church RTX 4070 (12 GB) wall machines are the only real GPUs today. (3) The deep-reasoning tier — frontier reasoning models (e.g., DeepSeek-R1’s 671B-MoE / 37B-active class, or a vendor’s frontier model) for the hardest problems — needs a serious multi-GPU node or, pragmatically, a vendor within budget (next week). The skill is matching the model to the tier without pretending the box can do more than it can.',
    },
    quiz: {
      questions: [
        { q: 'Which tier is actually ONLINE for us today?', options: ['A huge GPU farm', 'The Synology-CPU tier (the DS1621xs) running small quantized models', 'The deep-reasoning frontier tier'], answer: 1, explain: 'Honest state: the CPU NAS is what runs today; the AI Forge GPU tier is planned/unbought, the church 4070s are the only real GPUs.' },
        { q: 'What is the AI Forge tier FOR?', options: ['Only storage', 'Deep logic, RAG over our own corpus, and agentic / multi-step work on a GPU or Mac Studio node', 'Nothing yet'], answer: 1, explain: 'The Forge (GPU / Mac Studio) is the home for the heavier 14–70B-class reasoning, RAG, and tool-use work — planned hardware.' },
        { q: 'Where do frontier reasoning models (e.g., the 671B-MoE class) belong?', options: ['On the CPU NAS', 'The deep-reasoning tier — a serious multi-GPU node or a vendor within budget', 'In a phone'], answer: 1, explain: 'A 671B-class MoE far exceeds the CPU box and even a single GPU; it’s the deep-reasoning tier — multi-GPU or vendor.' },
      ],
    },
    lesson: 'A common mistake is to talk about "A.I." as if it were one thing. It isn’t — it is a whole landscape of models at very different sizes, and to run them you need a matching landscape of hardware tiers. Naming the tiers honestly is most of the skill. First, the Synology-CPU tier: the box we own today, a Xeon D-1527 with ECC memory and no GPU. It runs small quantized open models — a Gemma 3 1B or 4B, a Qwen2.5 7B, a Llama 3.x 8B — quickly on the small end and patiently on 7–14B, and it is genuinely weak and slow on long, complex personas. This is what is actually online for us right now, and we say so plainly. Second, the AI Forge tier: a dedicated GPU node — the planned dual-RTX-3090 farm giving about 48 GB of VRAM (DR-0014), or an Apple Mac Studio with large unified memory — which is the proper home for deep logic, retrieval over our OWN library (RAG), and agentic multi-step, tool-using work, at 14–70B-class sizes and usable speed. That tier is planned and unbought; the only real GPUs we have today are the church’s two RTX 4070 (12 GB) machines that drive the video wall. Third, the deep-reasoning tier: frontier reasoning models — the DeepSeek-R1 class of 671B-parameter mixture-of-experts (with about 37B active per token), or a vendor’s frontier model — for the hardest problems, which needs a serious multi-GPU node or, pragmatically, a vendor within budget (next week’s topic). One honest caveat runs through all of it: model names and sizes move fast, so before you rely on a specific number, check the live Ollama library or run `ollama list` — the facts here are accurate as of mid-2026, not forever. Different tools for different work (1 Corinthians 12), each made well (Exodus 35) and honored for what it does.',
    facilitator: {
      talkingPoints: [
        'Three tiers: Synology-CPU (small models, ONLINE today) · AI Forge GPU/Mac Studio (deep logic / RAG / agentic, PLANNED) · deep-reasoning (frontier MoE, vendor or multi-GPU).',
        'Honest today: the CPU NAS is what runs; the Forge is unbought; the church RTX 4070s (12 GB) are the only real GPUs.',
        'Verified examples (mid-2026): Gemma 3 1B/4B, Qwen2.5 7B, Llama 3.x 8B fit the CPU tier; 14–70B want the Forge; DeepSeek-R1 671B-MoE is deep-reasoning.',
        'Names + sizes move fast — check `ollama list` / ollama.com/library before relying on a number. State facts as current-as-of.',
        '1 Cor 12 / Exodus 35 — varieties of gifts, the same Spirit; each tool made well and honored for its work.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Corinthians 12:4–6. | Recap last week (10): a learner explains size → hardware. | Teach the big idea (15): the three tiers; what runs where; the honest "what we have today" picture; the verify-the-live-tag rule. | Hands-on in the app (25): study the model-tier ladder; open the Infrastructure + A.I. health cards; identify which tier is online vs planned. | Discussion (15): which tier would unlock the most for us next, and why? | Send-off + solo task (5): solo task — check the live Ollama library and note one model at each tier’s size.',
      discussionPrompts: [
        'Which tier is online for us today, and what does that honestly limit?',
        'What kind of work most needs the AI Forge tier we don’t have yet?',
        'Why do we say model facts are "current as of mid-2026" instead of stating them as timeless?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov4-honest-ceiling',
    title: 'The honest ceiling — what small CPU models can and can’t do',
    bigIdea: 'Running A.I. on a CPU-only box is real and useful — but it has an honest ceiling. Small quantized models are slow on the CPU NAS and weaker on long, complex personas and deep multi-step reasoning. Knowing the ceiling is what keeps us honest: we use small models for what they’re good at, and route the rest up.',
    inApp: 'Ask the local tutor a short question and a long, complex one. Notice the difference: the short job is fine; the long, persona-heavy job is slower and thinner. That gap IS the ceiling — and the reason for tiered routing (next week).',
    anchor: { ref: '1 Thessalonians 5:21; Proverbs 14:15', theme: 'Test everything; the prudent give thought to their steps. We test the tool against the task instead of trusting a label.' },
    rpe: {
      research: 'On the CPU NAS, what kinds of tasks run well, and where does it visibly struggle?',
      plan: 'Sort tasks into "small-model-good" vs "needs more" before assigning them.',
      execute: 'Run a small and a large task locally and feel the ceiling for yourself.',
    },
    levels: {
      teen: 'Our home A.I. is real, but it’s not magic. On the CPU box, small models do simple jobs just fine — sorting things, short answers, quick helpers. But ask for a long, in-character story, or a tricky multi-step reasoning job, and a small model gets slow and kind of thin — it loses the thread. That’s not a failure; it’s just the ceiling of a small model on a CPU. The smart move is to KNOW the ceiling: give small models the jobs they’re good at, and send the hard jobs somewhere stronger.',
      senior: 'Honesty about limits is the verification doctrine applied to our own tools. The CPU-only ceiling shows up in three ways. Latency: token-rate on the Xeon D-1527 is a fraction of GPU speed, so anything long is slow enough to feel it. Reasoning depth: small models (≤14B) degrade on long-horizon, multi-step reasoning and on holding a complex persona consistently across a long output — they drift, simplify, and contradict earlier turns. Context pressure: even when a model advertises a large context window, filling it on a CPU is slow and the small model’s effective use of long context is weaker than a frontier model’s. None of that makes local worthless — it makes local RIGHT-SIZED: excellent for classification, tagging, short drafting, retrieval-augmented answers over a small corpus, and patient batch work; poor for real-time heavy reasoning or a long, demanding persona. The mature posture is to characterize the real behavior (measure it, don’t assume it), publish the ceiling, and route accordingly — which is precisely the tiered orchestrator of next week. A small model used inside its competence beats a frontier model you can’t reach when the vendor is down.',
    },
    quiz: {
      questions: [
        { q: 'Where do small CPU models honestly struggle?', options: ['Everywhere equally', 'Long, complex personas and deep multi-step reasoning — and they’re slow on the CPU', 'Only on short tasks'], answer: 1, explain: 'The ceiling is latency + reasoning depth + weak long-context use; short, well-scoped jobs are fine.' },
        { q: 'What’s the mature response to the ceiling?', options: ['Pretend it isn’t there', 'Characterize the real behavior, publish the ceiling, and route hard jobs to a stronger tier', 'Stop using local A.I.'], answer: 1, explain: 'Know the ceiling, use small models inside their competence, and route the rest up — the tiered approach.' },
      ],
    },
    lesson: 'It would be easy to oversell local A.I., and overselling is exactly the kind of confident-but-wrong our verification doctrine exists to catch — so we tell the truth about the ceiling. Running small quantized models on a CPU-only box is genuinely useful, but it is bounded in three concrete ways. First, latency: the Xeon D-1527 generates tokens at a fraction of GPU speed, so any long output is slow enough to feel. Second, reasoning depth: small models (roughly 14B and under) degrade on long-horizon, multi-step reasoning, and they struggle to hold a complex persona consistently across a long answer — they drift, oversimplify, and sometimes contradict what they said a few paragraphs earlier. Third, context pressure: even a model that advertises a big context window is slow to fill it on a CPU, and a small model makes weaker use of long context than a frontier model would. Say all of that plainly, because knowing the ceiling is what makes local A.I. trustworthy rather than disappointing. Inside its competence the small local model is excellent: classifying and tagging, short drafting, answering from a small retrieved set of our own documents, and patient batch work it can grind through overnight. Outside its competence — real-time heavy reasoning, a long demanding persona — it is the wrong tool, and the honest move is to route that work to a stronger tier, which is the whole subject of next week. The discipline is the platform’s discipline: characterize the real behavior by measuring it rather than assuming, publish the limit, and design around it. And remember the throughline of every A.I. class we teach — test everything and hold fast what is good (1 Thessalonians 5:21); the prudent give thought to their steps (Proverbs 14:15). A small model used well, that you can always reach, beats a frontier model you can’t reach when the vendor is down.',
    facilitator: {
      talkingPoints: [
        'The CPU-only ceiling is real and three-fold: latency (slow), reasoning depth (weak on long multi-step + complex personas), and weak long-context use.',
        'Inside competence small models shine: classification, tagging, short drafting, RAG over a small corpus, patient batch work.',
        'Outside competence (real-time heavy reasoning, long demanding persona) is the wrong tool — route it up.',
        'Mature posture (DR-0076): CHARACTERIZE by measuring, publish the ceiling, design around it — don’t oversell.',
        '1 Thess 5:21 / Proverbs 14:15 — test everything; the prudent weigh their steps. A reachable small model beats an unreachable frontier one.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Thessalonians 5:21. | Recap last week (10): a learner names the three tiers. | Teach the big idea (15): the three-fold ceiling; inside-vs-outside competence; characterize-don’t-assume. | Hands-on in the app (25): ask the local tutor a short question and a long, complex one; feel the gap; name where the ceiling appeared. | Discussion (15): what job would you trust the CPU model with — and what would you never? | Send-off + solo task (5): solo task — try one small and one hard prompt locally and write down where it thinned out.',
      discussionPrompts: [
        'Where exactly did the small model start to struggle for you?',
        'What jobs are genuinely a great fit for the CPU tier?',
        'Why is admitting the ceiling more trustworthy than hiding it?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov5-how-skos-runs-it',
    title: 'How SKOS runs it — Ollama, routing, and the Cage',
    bigIdea: 'SKOS runs local models with Ollama, routes each task to the right tier (small local first; a vendor only for heavy lifting), grounds answers in our own corpus with a RAG pipeline, and keeps every autonomous step behind the Cage — the brakes. Sovereign-walled work (private/family/clinical) is local-only, always.',
    inApp: 'Open the A.I. health card and confirm the local model is served by Ollama on our box. Notice the reminder on every tutor reply: it runs on our own A.I., and you should still verify what matters.',
    anchor: { ref: 'Proverbs 25:28; Luke 12:42', theme: 'A person without self-control is like a city with broken walls; who then is the faithful manager? Brakes and walls are what make power safe to wield.' },
    launch: { view: 'church', churchView: 'home', churchSection: 'speak' },
    rpe: {
      research: 'How does a task get from the app to a model today, and what decides which model?',
      plan: 'Decide the routing rule: what stays local, what may escalate, what may NEVER leave.',
      execute: 'Trace one real task through: classify → route → (local or vendor) → check against the brakes.',
    },
    levels: {
      teen: 'Here’s how it actually works. A program called Ollama runs our open models on our own computer. When a job comes in, a "router" decides: easy and private? keep it local. Really hard and not private? it can borrow a stronger vendor A.I. for that one job — then come right back to local. Big questions about Scripture or our own writing get answered using OUR library (that’s RAG — the A.I. reads our real documents before answering). And anything that runs by itself stays behind "the Cage" — a set of brakes so it can never run wild. The rule above all: private and family stuff NEVER leaves our box.',
      senior: 'The runtime is Ollama serving open-weights models on the owned hardware. On top of it sits the tiered orchestrator (DR-0056): a router classifies each task and emits local-only / try-local-then-escalate / escalate-direct, using a sensitivity tag, the local model’s confidence, and an outcome-judge score. The standing rule is local-first, vendor only for heavy lifting, then fall back to local — so the loop never fully stalls (the "perpetual fix"). Grounding is RAG: rather than trust a model’s memory, the system retrieves from our OWN corpus — the church Word-first scriptural corpus (the 81-book grounding) plus our documents — and answers from the retrieved text, which is how a small local model gives trustworthy, citeable answers on our material. Every autonomous step runs behind the Cage: an allowlist (only approved task types/vendors escalate), an append-only audit ledger (every escalation logged with tokens + cost), and an egress guard (a sovereignty-walled task physically cannot reach a vendor endpoint). And the three brakes are mandatory on anything timer-driven — a budget ceiling, a single-instance concurrency lock, and a kill-switch — because an unbraked fleet once ran away and had to be killed by hand. The hard line: any task tagged private/family/clinical (PHI) is local-only, no exceptions; the tag is the decision, the egress guard is the enforcement, and a mis-tag defaults to the stricter side.',
    },
    quiz: {
      questions: [
        { q: 'What is SKOS’s standing routing rule?', options: ['Vendor first, always', 'Local-first; a vendor only for heavy lifting; then fall back to local so the loop never stalls', 'Random'], answer: 1, explain: 'Local-first with vendor escalation only for heavy work, and a local floor — the "perpetual fix."' },
        { q: 'What does the RAG pipeline do?', options: ['Makes the model bigger', 'Grounds answers in our OWN corpus (the Word-first scriptural corpus + our documents) instead of the model’s memory', 'Sells our data'], answer: 1, explain: 'RAG retrieves from our real library and answers from it — how a small local model gives trustworthy, citeable answers.' },
        { q: 'What happens to a task tagged private/family/clinical?', options: ['It may go to a vendor if busy', 'It is local-only, always — the egress guard makes it physically unable to reach a vendor', 'It is deleted'], answer: 1, explain: 'Sovereignty overrides everything: PHI/family-private never leaves the premises. The tag decides; the guard enforces.' },
      ],
    },
    lesson: 'Now we put the pieces together into how SKOS actually runs A.I. The runtime is Ollama, which serves open-weights models on the hardware we own. Above it sits the tiered orchestrator: when a task arrives, a router classifies it and decides one of three paths — keep it local-only, try local and escalate if needed, or escalate directly — using a sensitivity tag, the local model’s confidence, and an outcome-judge that scores whether a result is good enough. The standing rule is local-first, with a vendor reached only for genuine heavy lifting, and then a fall back to local so the loop never completely stalls; Darrell calls that the perpetual fix. To make a small local model trustworthy on our own material, the system uses RAG — retrieval-augmented generation — which means that instead of trusting the model’s fuzzy memory, it first retrieves the relevant passages from OUR corpus (the church’s Word-first scriptural corpus — the 81-book grounding — plus our own documents) and answers from that retrieved text, so the answer is grounded and can be cited. Every step that runs on its own stays behind the Cage: an allowlist so only approved task types and vendors can ever escalate, an append-only audit ledger that logs every escalation with its token and dollar cost, and an egress guard so a sovereignty-walled task physically cannot reach a vendor endpoint. On top of that, anything timer-driven carries the three brakes — a budget ceiling, a single-instance lock, and a kill-switch — because an unbraked fleet once ran away and had to be shut down by hand. And the brightest line of all: any task tagged private, family, or clinical is local-only with no exceptions; the tag is the decision and the egress guard is the enforcement, and if a tag is ever ambiguous it defaults to the stricter, local-only side. A city with broken walls cannot keep itself (Proverbs 25:28); the faithful manager is the one who keeps the watch (Luke 12:42). The walls and the brakes are not the opposite of power — they are what make it safe to wield.',
    facilitator: {
      talkingPoints: [
        'Ollama serves open models on our box; the tiered orchestrator (DR-0056) routes: local-only / try-local-then-escalate / escalate-direct.',
        'Standing rule: local-first, vendor only for heavy lifting, fall back to local — the "perpetual fix" (the loop never fully stalls).',
        'RAG grounds answers in OUR corpus (the Word-first 81-book scriptural grounding + our documents) — how a small model answers trustworthily + citeably.',
        'The Cage on every autonomous step: allowlist + append-only audit ledger + egress guard. Plus the three brakes on anything timer-driven.',
        'Brightest line: private/family/clinical is LOCAL-ONLY, no exceptions — tag decides, egress guard enforces, ambiguity defaults stricter. Prov 25:28 / Luke 12:42.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 25:28 and Luke 12:42. | Recap last week (10): a learner explains the CPU ceiling. | Teach the big idea (15): Ollama; the router + the three paths; RAG grounding; the Cage + three brakes; the local-only line. | Hands-on in the app (25): open the A.I. health card (Ollama on our box); send a tutor message; note the "runs on our own A.I., verify what matters" reminder. | Discussion (15): what kind of task SHOULD escalate to a vendor — and what must never? | Send-off + solo task (5): solo task — name one task that must stay local-only and say why.',
      discussionPrompts: [
        'Why is local-first-with-a-vendor-floor safer than vendor-only or local-only?',
        'How does RAG make a small model trustworthy on our own material?',
        'What makes the Cage + three brakes non-negotiable for anything autonomous?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov6-vendor-vs-local-tradeoffs',
    title: 'Vendor vs local — the honest trade-offs',
    bigIdea: 'Local isn’t always right and vendor isn’t always wrong. Vendors win on frontier reasoning, very-long context, and multimodal (image / video / audio — e.g., a vendor for video understanding). Local wins on privacy, resilience, always-on cost, and sovereignty. The skill is matching the work to the right mind — and never sending sovereign-walled work to a vendor.',
    inApp: 'Read the local-vs-vendor diagram. For three real tasks (a private family note, a long video to summarize, a quick classification), decide out loud which side each belongs on — and check that the private one stays local.',
    anchor: { ref: 'Proverbs 20:18; Ecclesiastes 3:1', theme: 'Plans are established by counsel; there is a time for everything. Wisdom is matching the work to the right tool at the right time.' },
    rpe: {
      research: 'For each work type, which mind is actually strongest — and at what cost?',
      plan: 'Draft an affinity map: which work goes local, which goes to a vendor, which can go either way.',
      execute: 'Route three real tasks by the map — and confirm the private one never leaves.',
    },
    media: [
      { type: 'diagram', key: 'local-vs-vendor', title: 'Vendor vs local — who wins what', caption: 'Vendor: frontier reasoning, very-long context, multimodal (image/video/audio). Local: privacy, resilience, always-on cost, sovereignty.' },
    ],
    levels: {
      teen: 'This isn’t "local good, vendor bad." Each is better at different things. Big vendor A.I. is great at the hardest thinking, reading really long documents, and understanding pictures, video, and audio — for example, you’d reach for a vendor to make sense of a long video. Our local A.I. is better when it has to be private, always available, cheap to run all day, and ours. So the smart move is to match the job to the right one — and the one rule that never bends: anything private or about our family stays local, no matter what.',
      senior: 'The honest trade-off table. Vendors lead on: frontier reasoning + long-horizon agentic depth; very-long-context ingestion (huge documents/transcripts); and native multimodality — image, video, and audio understanding (a vendor with a strong video model is the right call for video, and ties to our vision-fairness, coaching-vision, and visitor-recognition surfaces). Local leads on: privacy (content never leaves), resilience (no dependency on a provider’s uptime/policy/price), always-on cost (no per-call meter for high-volume routine work), latency-for-small-jobs once warm, and sovereignty. Our routing strategy encodes this as a strength-aware affinity map that the system TUNES from real outcomes — code + constraint-strict writing lean one way, long-context + multimodal + web-grounded research lean to a vendor, bulk lightweight classification stays local — and it optimizes cost-per-ACCEPTED-outcome, not cost-per-call (a cheap model that fails the judge and forces a re-run is expensive). Two rails bound the whole thing: sovereignty overrides every affinity (private/family/clinical is local-only, full stop), and idle paid capacity may backfill lightweight work only when the heavyweight lane is empty, a window is open, budget remains, and the work isn’t walled. Match the work to the mind; never let convenience cross the sovereignty line.',
    },
    quiz: {
      questions: [
        { q: 'What do vendor models typically win on?', options: ['Privacy and resilience', 'Frontier reasoning, very-long context, and multimodal (image/video/audio)', 'Nothing'], answer: 1, explain: 'Vendors lead on the hardest reasoning, huge context, and native multimodality — e.g., a vendor for video understanding.' },
        { q: 'What does local win on?', options: ['Frontier reasoning', 'Privacy, resilience, always-on cost, and sovereignty', 'Multimodal video'], answer: 1, explain: 'Local’s edge is privacy + resilience + cheap always-on + sovereignty — match the work accordingly.' },
        { q: 'What rule overrides every affinity?', options: ['Whatever is cheapest', 'Sovereignty — private/family/clinical work is local-only, no matter what', 'Whatever is fastest'], answer: 1, explain: 'Convenience never crosses the sovereignty line; walled work stays local, full stop.' },
      ],
    },
    lesson: 'A sovereign builder is not anti-vendor — that would be its own kind of dishonesty. The truth is that local and vendor each win at different things, and maturity is matching the work to the right mind. Vendors lead where scale shows: frontier reasoning and long-horizon agentic depth, ingesting very long documents and transcripts in one go, and native multimodality — understanding images, video, and audio. If you need to make sense of a long video, a vendor with a strong video model is simply the right call, and that ties directly into our vision-fairness, coaching-vision, and visitor-recognition work. Local leads where ownership shows: privacy, because the content never leaves; resilience, because nothing depends on a provider’s uptime, policy, or price; always-on cost, because high-volume routine work has no per-call meter; quick response on small jobs once the model is warm; and sovereignty itself. Our routing strategy writes this down as a strength-aware affinity map — code and constraint-strict writing lean one way, long-context and multimodal and web-grounded research lean toward a vendor, and bulk lightweight classification stays local — and crucially the map TUNES itself from real outcomes, optimizing cost per ACCEPTED outcome rather than cost per call, because a cheap model that fails the quality bar and forces a re-run is the expensive one. Two rails bound all of it. The first is absolute: sovereignty overrides every affinity, so anything private, family, or clinical is local-only no matter how convenient a vendor would be. The second keeps paid capacity from being wasted: idle vendor budget may clear lightweight work, but only as the lowest priority — when the heavyweight lane is empty, a window is open, budget remains, and the work isn’t walled. Plans are established by counsel (Proverbs 20:18), and there is a time and a tool for everything (Ecclesiastes 3:1). Match the work to the mind — and never let convenience cross the sovereignty line.',
    facilitator: {
      talkingPoints: [
        'Not "local good, vendor bad." Vendors win: frontier reasoning, very-long context, multimodal (image/video/audio — a vendor for video).',
        'Local wins: privacy, resilience, always-on cost, fast small jobs once warm, sovereignty.',
        'The affinity map TUNES itself from real outcomes and optimizes cost-per-ACCEPTED-outcome, not cost-per-call.',
        'Rail 1 (absolute): sovereignty overrides every affinity — private/family/clinical is local-only, full stop.',
        'Rail 2: idle vendor budget may backfill lightweight work — lowest priority, only when heavyweight is empty + window open + budget left + not walled. Prov 20:18.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 20:18 and Ecclesiastes 3:1. | Recap last week (10): a learner explains the Cage + three brakes. | Teach the big idea (15): the trade-off table; multimodal note; the self-tuning affinity map; the two rails. | Hands-on in the app (25): read the local-vs-vendor diagram; route three real tasks out loud; confirm the private one stays local. | Discussion (15): what work would you give a vendor, and what would you never? | Send-off + solo task (5): solo task — sort five tasks you do into local / vendor / either.',
      discussionPrompts: [
        'Which of your real tasks clearly belongs to a vendor — and which clearly to local?',
        'Why optimize cost-per-accepted-outcome instead of cost-per-call?',
        'Where is the sovereignty line for you, and what makes it non-negotiable?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov7-five-opportunities',
    title: 'The five local-A.I. opportunities — the strategy',
    bigIdea: 'Sovereign A.I. isn’t just safer for us — it’s a market the extractive giants can’t serve. Five opportunities: (1) regulated industries, (2) data-never-leaves tools, (3) air-gapped agents, (4) zero-internet environments, and (5) resilience-as-a-service. Each is a place where "your data never leaves and your tool can’t be switched off" is the whole value.',
    inApp: 'Read the five-opportunities diagram. Pick the ONE that fits a real community you know (a clinic, a church, a rural area) and name what a sovereign tool would do for them.',
    anchor: { ref: 'Matthew 25:40; Luke 4:18', theme: 'What you did for the least of these, you did for Me; good news to the poor, freedom for the captive. Serving the overlooked is the mission, and here it is also the market.' },
    rpe: {
      research: 'Which communities are poorly served because their data can’t safely go to a cloud?',
      plan: 'Match each of the five opportunities to a real community we could serve.',
      execute: 'Draft the one-line promise a sovereign tool makes to that community.',
    },
    media: [
      { type: 'diagram', key: 'five-opportunities', title: 'The five local-A.I. opportunities', caption: 'Regulated industries · data-never-leaves tools · air-gapped agents · zero-internet environments · resilience-as-a-service.' },
    ],
    levels: {
      teen: 'Building A.I. that runs on your own machines isn’t just good for us — it’s a job the big tech companies CAN’T do, because their whole business is taking your data to the cloud. Five places need exactly what we build: (1) doctors and clinics where the law says data can’t leave; (2) anyone who wants tools where their info simply never goes anywhere; (3) agents that work with no internet at all; (4) places with bad or no internet, like rural areas; and (5) people who need their tools to keep working even when a company has an outage. Each one is a real community we can serve.',
      senior: 'The strategy framing turns the sovereign architecture into a market position the extractive incumbents structurally cannot occupy. (1) Regulated industries — healthcare (HIPAA, our TLC clinical context), finance, legal — where moving data to a third-party cloud is a compliance liability; local inference keeps the data in-bounds by construction. (2) Data-never-leaves tools — any individual or organization for whom the value proposition is simply "your content is processed and never transmitted," which is also the answer to the accessibility-law / privacy-law compliance market. (3) Air-gapped agents — autonomous agents that operate inside a network with no outbound internet, for security-sensitive or proprietary environments where an egress path is itself the risk. (4) Zero-internet environments — rural, remote, maritime, disaster-response, and intermittent-connectivity settings where a cloud dependency means no tool at all; a local model is the only one that works. (5) Resilience-as-a-service — selling continuity itself: a deployment that keeps functioning through a provider outage, policy change, or price shock, because the capability lives on owned iron. The throughline is COMMUNITY-FIRST: each opportunity is a community the mainstream overlooked or actively failed (COLG, with its elderly tech-novice staff and historically no support, is the named first one), and the sovereign moat — your data never leaves, your tool can’t be switched off — is simultaneously the ethic and the differentiator. Serving the least of these (Matthew 25:40) is the mission; here it is also the business.',
    },
    quiz: {
      questions: [
        { q: 'Why can’t the extractive tech giants easily serve these five opportunities?', options: ['They’re too small', 'Their whole model is moving your data to the cloud — but these communities need the data to never leave', 'They don’t have A.I.'], answer: 1, explain: 'The sovereign value ("data never leaves, can’t be switched off") is the opposite of an extractive cloud model — that’s the moat.' },
        { q: 'Which is one of the five opportunities?', options: ['Selling ads', 'Regulated industries where the law says data can’t leave (e.g., clinical/HIPAA)', 'Mining user data'], answer: 1, explain: 'The five: regulated industries, data-never-leaves tools, air-gapped agents, zero-internet environments, resilience-as-a-service.' },
        { q: 'What is "resilience-as-a-service"?', options: ['A faster model', 'Selling continuity — a deployment that keeps working through a provider outage, policy change, or price shock', 'A backup drive'], answer: 1, explain: 'It packages the generator-in-the-garage promise itself: the tool keeps running because it lives on owned iron.' },
      ],
    },
    lesson: 'Everything in this course points to a strategic truth: the sovereign architecture we build for ourselves is also a market the extractive giants structurally cannot serve, because their whole business is moving your data to their cloud — and these five opportunities all need exactly the opposite. First, regulated industries: healthcare (HIPAA — our own TLC clinical context), finance, and law, where shipping data to a third-party cloud is a compliance liability and local inference keeps the data in-bounds by construction. Second, data-never-leaves tools: any person or organization whose entire reason to choose you is "my content is processed and never transmitted" — which is also the answer to the growing accessibility- and privacy-law compliance market. Third, air-gapped agents: autonomous agents that work inside a network with no outbound internet at all, for security-sensitive or proprietary settings where an egress path is itself the danger. Fourth, zero-internet environments: rural, remote, maritime, disaster-response, and intermittent-connectivity places where a cloud dependency means no tool at all, so a local model is the only one that works. Fifth, resilience-as-a-service: selling continuity itself — a deployment that keeps functioning straight through a provider outage, a policy change, or a price shock, because the capability lives on iron the customer owns. The throughline is community-first: every one of these is a community the mainstream overlooked or actively failed — and the Church of the Living God, with elderly tech-novice staff and historically no industry support, is the named first one. The sovereign moat — your data never leaves, your tool can’t be switched off — is at the same time the ethic and the differentiator. What you do for the least of these, you do for Him (Matthew 25:40); this is good news brought to the overlooked (Luke 4:18). Here the mission and the market are the same thing.',
    facilitator: {
      talkingPoints: [
        'Five local-A.I. opportunities: (1) regulated industries, (2) data-never-leaves tools, (3) air-gapped agents, (4) zero-internet environments, (5) resilience-as-a-service.',
        'Each is a place the extractive giants can’t serve — their model is moving data to the cloud; these need the opposite.',
        'Regulated = HIPAA/finance/legal (our TLC clinical context); data-never-leaves = the privacy/accessibility-law compliance market.',
        'Air-gapped = no egress path by design; zero-internet = rural/remote/disaster; resilience-as-a-service = sell continuity itself.',
        'Throughline COMMUNITY-FIRST: the overlooked community IS the market (COLG named first). Matthew 25:40 — mission and market are one.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Matthew 25:40 and Luke 4:18. | Recap last week (10): a learner explains a vendor-vs-local trade-off. | Teach the big idea (15): the five opportunities; why incumbents can’t serve them; community-first as both ethic and moat. | Hands-on in the app (25): read the five-opportunities diagram; pick one and name a real community + the promise a sovereign tool makes them. | Discussion (15): which opportunity is most real for the people WE already serve? | Send-off + solo task (5): solo task — name one community for one opportunity and the one-line promise.',
      discussionPrompts: [
        'Which of the five opportunities fits a community you personally know?',
        'Why is "your data never leaves" a moat and not just a feature?',
        'How are the mission (serve the overlooked) and the market the same here?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'sov8-build-sovereign-hand-it-on',
    title: 'Build it sovereign — and hand it on',
    bigIdea: 'Sovereignty is stewardship: we build A.I. on iron we own because the family and the community depend on it, we tell the truth about what it can and can’t do today, and we hand the understanding on. You own this when you can teach it. The roadmap is honest — the GPU tier is planned, not pretended — and the work outlasts any one of us.',
    inApp: 'Pick the one idea from this course that changed how you think — the generator in the garage, the tiers, the ceiling, the routing, the trade-offs, or the five opportunities. Write its one-paragraph plain version, and put your name forward to help teach the next cohort.',
    anchor: { ref: '2 Timothy 2:2; Colossians 3:23', theme: 'Entrust what you’ve learned to faithful people who can teach others; whatever you do, work heartily as for the Lord. The understanding is handed on, and it’s done for Him.' },
    rpe: {
      research: 'Which idea from this course do you understand well enough to teach simply?',
      plan: 'Outline the plain, one-paragraph version a newcomer would need.',
      execute: 'Teach it to one person; put your name on the next-cohort helper list.',
    },
    levels: {
      teen: 'You’ve learned the whole picture: WHY we run A.I. on our own machines, how model size and hardware fit together, the three tiers, the honest ceiling of a small CPU model, how SKOS routes and brakes everything, when a vendor is actually the right call, and the five real opportunities. Here’s the secret to truly owning it: you own an idea when you can TEACH it. So pick the one that clicked most, learn to say it simply, and teach it to one person. That’s how a family and a church get strong — builders raise more builders.',
      senior: 'The commissioning. Sovereignty is stewardship, and a mature understanding shows two marks. Honesty: we say plainly what is real today (a CPU-only NAS running small models) and what is planned (the AI Forge GPU tier, the dual-3090 farm — DR-0014, unbought), and we frame fast-moving model facts as current-as-of, not timeless — because a confident-but-wrong claim about A.I. is exactly what this whole course teaches us to refuse (DR-0076). Multiplication: you own this material when you can teach it — 2 Timothy 2:2, entrust what you’ve learned to faithful people who can teach others — so the strategy doesn’t live in one head where a memory purge or a missing person could lose it. The forward arc is concrete: as the GPU tier comes online, the same understanding scales from "small models we can run today" to "the deep-logic / RAG / agentic tier," and the routing, the Cage, the three brakes, and the sovereignty line carry over unchanged. We do all of it as for the Lord and not for men (Colossians 3:23). Founders raise founders; the iron, the understanding, and the calling under them outlast any one of us.',
    },
    quiz: {
      questions: [
        { q: 'How do you prove you truly own this material?', options: ['By keeping it to yourself', 'By being able to teach it simply to someone else', 'By finishing fastest'], answer: 1, explain: 'Mastery shows in teaching it plainly — 2 Timothy 2:2. Builders raise builders.' },
        { q: 'What are the two marks of a mature, sovereign understanding?', options: ['Speed and secrecy', 'Honesty (what’s real today vs planned, facts as current-as-of) and multiplication (you can teach it)', 'Cost and size'], answer: 1, explain: 'Tell the truth about the ceiling and the roadmap, and hand the understanding on so it isn’t trapped in one head.' },
      ],
    },
    lesson: 'This is the commissioning, and it gathers the whole course under one word: stewardship. We build A.I. on iron we own not to be impressive, but because the family and the community genuinely depend on it — and a steward’s job is to be found faithful with what they’ve been given. Two marks separate a mature understanding from a shallow one. The first is honesty. We say plainly what is real today — a CPU-only NAS running small quantized models, slow and limited on the hard stuff — and what is only planned — the AI Forge GPU tier, the dual-RTX-3090 farm of DR-0014, which is sized and costed but not yet bought. And we frame fast-moving model facts as accurate-as-of-now rather than timeless, because a confident claim that turns out wrong is precisely what this whole course trains us to refuse. The second mark is multiplication. You own this material the moment you can teach it simply, so the proof of the class is that you can hand one idea to someone who wasn’t here — the generator in the garage, the size-to-hardware chain, the three tiers, the honest ceiling, the routing and the Cage, the vendor-vs-local trade-offs, or the five opportunities — in plain words they can carry. That is how the strategy stops living in one fragile head and becomes something the family and the church hold together. The forward arc is real and unbroken: as the GPU tier comes online, the very same understanding scales up from "the small models we can run today" to "the deep-logic, RAG, and agentic tier," while the routing, the brakes, and the sovereignty line carry over without change. Paul told Timothy to entrust what he’d learned to faithful people who could teach others also (2 Timothy 2:2), and we do all of it heartily, as for the Lord and not for men (Colossians 3:23). Founders raise founders; the iron, the understanding, and the calling under them outlast any one of us.',
    facilitator: {
      talkingPoints: [
        'Sovereignty is stewardship: we build on owned iron because the family + community depend on it, and we hand the understanding on.',
        'Two marks of mature understanding: HONESTY (real-today vs planned; model facts as current-as-of) and MULTIPLICATION (you can teach it).',
        'Honest roadmap: CPU-only NAS today; the AI Forge GPU tier (dual-3090 farm, DR-0014) planned/unbought — never pretended.',
        'The forward arc carries: as the GPU tier lands, the same routing / Cage / brakes / sovereignty line scale up unchanged.',
        '2 Timothy 2:2 / Colossians 3:23 — entrust it to faithful people; work as for the Lord. Founders raise founders.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 2 Timothy 2:2 and Colossians 3:23. | Recap last week (10): a learner names the five opportunities. | Teach the big idea (15): stewardship; honesty (today vs planned) + multiplication; the forward arc to the GPU tier. | Hands-on in the app (25): each learner picks the idea that changed them, writes its plain one-paragraph version, and teaches it to one person. | Discussion (15): which idea will you own and teach, and to whom? | Send-off + solo task (5): commission them — teach your idea to one person and put your name on the next-cohort helper list.',
      discussionPrompts: [
        'Which idea from this course do you understand well enough to teach simply?',
        'What’s the difference between honest "this is planned" and dishonest "this works"?',
        'What does "founders raise founders" mean for how you’ll use what you learned?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Week 9 — captured 2026-08-24 from an article Darrell forwarded into the
  // platform as build input: ByteByteGo's "Why Code Verification Matters More
  // Than Ever in the Age of AI" (featuring Andrea Malagodi, CTO of Sonar).
  // Distilled faithfully FROM that source and taught THROUGH our Ways — the
  // platform's own Verification Doctrine (DR-0076, declared by Darrell
  // 2026-06-15) said the same thing before the industry article arrived:
  // trust nothing unverified; a green check must mean something.
  {
    id: 'sov9-verification-earns-trust',
    title: 'Why verification matters in the age of A.I. — trust is earned, never claimed',
    bigIdea: 'A.I. made WRITING code fast and cheap — so VERIFYING code is now the hard, precious work. Code that runs is not code you can trust: trust is earned in degrees, one check at a time, through a stack of filters — type checks, tests, independent review, live monitoring. Our house learned this before the industry said it: DR-0076, "the A.I.\'s job is not to sound right — it is to be verifiably right." Prove all things.',
    inApp: 'Open Admin → the OpsBoard and watch the delivery lane live: every change to this very app passes 8,000+ tests and deterministic gates before it can ship, and a red gate stops it no matter how confident the author was. That screen IS this lesson running.',
    anchor: { ref: '1 Thessalonians 5:21; Proverbs 14:15', theme: 'KJV: "Prove all things; hold fast that which is good." And: "The simple believeth every word: but the prudent man looketh well to his going." Verification is not distrust of people — it is the prudence the Word commands.' },
    rpe: {
      research: 'Find one claim this week — from an A.I., an ad, or a person — that arrived with confidence but no evidence.',
      plan: 'Name the cheapest check that would actually test it (a source, a measurement, a second independent witness).',
      execute: 'Run the check before repeating the claim. Keep what proves good; drop what doesn\'t.',
    },
    media: [
      { type: 'diagram', key: 'verification-filter-stack', title: 'The filter stack', caption: 'Cheap and early to costly and late: type checks + linters → unit tests → independent review → production monitoring. Each layer catches what the one above it cannot; the later a flaw is caught, the more it costs.' },
    ],
    levels: {
      teen: 'A.I. can now write working code in seconds — so is the job done? No, and here\'s the surprise: WRITING was never the whole job. The real question is "can we TRUST this?" — and trust has to be EARNED, like a contract isn\'t real until it\'s reviewed and signed. Software teams earn it with a stack of filters: quick automatic checks, then tests that run the code against known answers, then a real person reading it, then watching it live. A.I. writing MORE code means MORE to verify — studies even show A.I. code carries a known security flaw almost half the time, and that developers who FELT faster with A.I. actually measured slower, because checking the output took the time. Our app lives this: over 8,000 tests and hard gates run on every single change, and a red gate blocks it — no matter who wrote it or how sure they sounded. The Word said it first: "Prove all things; hold fast that which is good."',
      senior: 'The industry data (per ByteByteGo\'s synthesis): DORA finds delivery stability dips as A.I. adoption rises with over a third of developers reporting low trust in A.I. output; a METR controlled trial measured experienced developers ~19% SLOWER with A.I. on their own mature projects while believing they were faster; a study across 100+ models found A.I.-generated code introduced a known security flaw in roughly 45% of cases, with security performance flat even as run-cleanly performance improved. The verification economics inverted: generation is cheap, so verification is the bottleneck and the value. The mechanics: trust is earned in degrees through layered filters (static analysis — fast, broad, blind to runtime; dynamic analysis — real behavior, limited to exercised paths), each tuned against the false-positive/false-negative tension — alarm fatigue kills a noisy tool\'s authority (Sonar\'s Andrea Malagodi frames it as a CAP-like trade among speed, accuracy, coverage). Shift-left holds: the same defect costs more at every later stage. And the deepest risk of A.I. reviewing A.I.: a reviewer sharing the writer\'s training shares its blind spots — one opinion stated twice is not two independent checks. Our house codified all of this as DR-0076 on 2026-06-15, before this article: no claim without evidence, deterministic gates that fail the build, gates proven-to-catch (a gate that always passes is itself a lie), measure-don\'t-claim, and independent adversarial verification for high stakes — the live RLS proofs that attack our own child-wall are exactly the "independent check" the article says A.I. review lacks.',
    },
    quiz: {
      questions: [
        { q: 'A.I. writes a function and it runs without errors. What has been proven?', options: ['That it is safe to ship', 'Only that it executes — trust still has to be EARNED through the filter stack: checks, tests, independent review, monitoring', 'That it is secure'], answer: 1, explain: 'Running is the weakest claim. The article\'s center and DR-0076\'s: verification is the work of earning trust in degrees; execution proves almost nothing by itself.' },
        { q: 'Why is an A.I. reviewing another A.I.\'s code not automatically enough?', options: ['A.I. reviewers are always wrong', 'A reviewer built like the writer shares its blind spots — one opinion stated twice, not two independent checks', 'Human review is obsolete'], answer: 1, explain: 'Independence is what makes a second check a real check. That is why our high-stakes proofs are adversarial and run against the live system, not just a re-read of the code.' },
        { q: 'A checking tool cries wolf constantly. What does the false-alarm research say happens?', options: ['Developers get more careful', 'Developers start ignoring it — and real warnings get waved away with the noise, so signal quality matters as much as coverage', 'Nothing changes'], answer: 1, explain: 'Alarm fatigue erodes a tool\'s authority until it is switched off or tuned out — reopening the door to the very bugs it existed to stop.' },
      ],
    },
    lesson: 'This week\'s lesson arrived by email — an industry article Darrell forwarded into the platform (ByteByteGo, "Why Code Verification Matters More Than Ever in the Age of AI," with Andrea Malagodi, CTO of Sonar) — and the reason it belongs in this course is that it is the world catching up to a Way this house already wrote down. The article\'s claim: for decades, WRITING code was the slow, expensive step. A.I. flipped that — a working function in seconds, a feature in minutes — so the scarce, precious work is now VERIFICATION: earning enough trust to put a change in front of real people. The evidence is sobering. Google\'s DORA research finds delivery stability DIPPING as teams adopt more A.I., with over a third of developers reporting little confidence in what the tools produce. A controlled trial (METR) found experienced developers who expected A.I. to make them ~25% faster actually measured ~19% SLOWER on their own projects — the time went into prompting, reading, and correcting the output — while still FEELING faster. And across 100+ models, A.I.-generated code introduced a known security flaw in roughly 45% of cases: the models got much better at making code RUN and barely better at making it SAFE. How is trust actually earned? In degrees, through a stack of filters, cheapest first: type checkers and linters that read the code without running it; unit tests that run it against known answers (a function can be perfectly typed and still multiply where it should add — only a test catches that); a human review that judges what machines cannot (does this FIT, is it the RIGHT solution); and live monitoring underneath everything, watching real traffic for what every earlier layer missed. Two families: static analysis (fast, broad, blind to runtime) and dynamic analysis (real behavior, but only on the paths you exercise). Every filter faces the same tension — flag too eagerly and the false alarms train people to ignore it until real warnings drown with the noise; stay too quiet and real defects slip through. Andrea frames it as a CAP-like trade among speed, accuracy, and coverage — no tool wins all three, so a finding is worth raising when a developer can ACT on it. And position matters: the same flaw costs a moment in the editor and an incident in production — push the checks left, where mistakes are cheap. Now the A.I.-specific warning, and it is the deepest one: when an A.I. reviews code an A.I. wrote, and both were built from the same kind of training, the reviewer tends to share the writer\'s assumptions — and therefore its blind spots. That is one opinion stated twice, not two independent checks. Here is why this course teaches it: our house encoded this BEFORE the article arrived. DR-0076 — the Verification Doctrine, declared 2026-06-15 — says the A.I.\'s job is not to sound right but to be VERIFIABLY right or clearly marked unverified; no claim without evidence; deterministic gates that fail the build; every gate proven-to-catch (a gate that always passes is itself a lie); measure, don\'t claim; independent adversarial verification for the high-stakes paths — and this very app lives it: 8,000+ tests and hard gates run on every change, the OpsBoard shows the lane live, and our security walls are proven by ATTACKING them on the live system, not by re-reading the code and nodding. The Word said it before any of us: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21, KJV) — and "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15, KJV). Verification is not cynicism. It is the prudence the Word commands, applied to a world where words — and now code — are cheap. POSTSCRIPT — THE LESSON PRACTICED ON ITSELF (added 2026-08-24, at Darrell\'s direction: "research the same outside sources for comprehensive understanding"). The house went past the article to its PRIMARY sources, per DR-0076 — never cite unread — and here is what they actually say. DORA (2024 report, read): a 25% increase in A.I. adoption was associated with a 7.2% DECREASE in delivery stability and a 1.5% throughput dip, and 39.2% of respondents reported little or no trust in A.I.-generated code — the article held up, and DORA\'s 2025 follow-up (~5,000 respondents) adds the fuller truth: throughput has since flipped POSITIVE while instability persists — faster AND less stable, both at once. METR (the trial itself, read): 16 experienced open-source developers, 246 real issues in their own mature repos, randomized; A.I.-allowed tasks ran 19% LONGER against a 24% forecast speedup — and afterward the developers still believed they had been 20% faster. Feeling faster while measuring slower is the whole warning. METR\'s own 2026 follow-up treats the figure as an early-2025 snapshot, not a law — honest uncertainty, carried forward. Veracode\'s 2025 GenAI Code Security Report (figures corroborated across multiple independent accounts; the primary PDF was unreachable from this session and this note says so): 80 curated tasks across 100+ models — 45% of completions introduced an OWASP Top-10 vulnerability; cross-site scripting failed in 86% of cases and log injection in 88%; and while syntax pass rates climbed from ~50% to ~95% since 2023, security pass rates stayed flat between 45% and 55%. Better at RUNNING, barely better at SAFE — measured. GitClear (the primary research PDF, read): 211 million changed lines, 2020–2024 — commits containing a duplicated block rose from 0.45% (2022) to 6.66% (2024), roughly ten times in two years; MOVED lines (real reuse) fell from 24.8% to 9.5%; and 2024 was the first measured year copy/pasted lines outnumbered moved lines. The code is getting more duplicated and less refactored, exactly as the article said. And one claim FELL: the famous "a bug costs 100x more in production" chart traces to an IBM internal training unit\'s course notes — no documented empirical study behind the numbers (the investigation the article itself linked, read directly). The DIRECTION — later is costlier — stands on separate, weaker, context-dependent evidence; the precise multipliers are folklore. So the postscript\'s verdict: four claims confirmed with their real numbers now pinned, one popular multiplier exposed as unproven — and that finding is the lesson: even an article ABOUT verification carries a claim that dissolves when you prove all things.',
    facilitator: {
      talkingPoints: [
        'The inversion: A.I. made writing cheap, so verifying is now the scarce, valuable work. More code written = more code to verify.',
        'The numbers, VERIFIED against the primary sources (2026-08-24): DORA 2024 — 25% more A.I. adoption ↔ 7.2% less delivery stability, 39.2% report little/no trust (2025 nuance: throughput now up, instability persists); METR — 16 devs, 246 real issues, 19% slower vs a 24% forecast, still FELT 20% faster; Veracode — 45% of completions across 100+ models carried an OWASP Top-10 flaw, syntax up to ~95% while security flat 45–55%; GitClear — duplicate-block commits 0.45%→6.66% in two years, moved-line reuse 24.8%→9.5%. And the "bugs cost 100x in production" chart traces to IBM training notes, not a documented study — a folklore multiplier the postscript names.',
        'Trust is EARNED in degrees: the filter stack — type checks/linters → tests → human review → live monitoring; static vs dynamic; false alarms erode a tool\'s authority.',
        'Shift left: the same flaw costs a moment in the editor and an incident in production.',
        'A.I. reviewing A.I. built alike = one opinion stated twice. Independence makes a second check real — our adversarial live RLS proofs are that independence.',
        'The house said it first: DR-0076 (2026-06-15) — no claim without evidence; proven-to-catch gates; measure don\'t claim. 1 Thessalonians 5:21; Proverbs 14:15.',
      ],
      howToRun: 'Prayer + the anchor (5): open in prayer; read 1 Thessalonians 5:21 and Proverbs 14:15 aloud (KJV). | Recap last week (10): the capstone — who taught their one idea, and to whom? | Teach the big idea (15): the inversion (writing cheap → verifying precious), the filter stack, the same-blind-spots warning, and DR-0076 as the house\'s prior encoding. | Hands-on in the app (25): open Admin → OpsBoard; watch a real change ride the lane — tests, gates, auto-merge on green; find where a red gate would stop it. | Discussion (15): where in OUR lives do we accept confident claims unproven — and what is the cheapest honest check? | Send-off + solo task (5): the R→P→E — catch one confident, evidence-free claim this week and check it before repeating it.',
      discussionPrompts: [
        'Where do you personally accept "it sounds right" instead of "it proved right" — and what would earning trust look like there?',
        'Why is a second opinion from someone (or something) trained exactly like the first not really a second opinion?',
        'The developers FELT faster and measured slower. Where might that gap between feeling and measurement live in your own work?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this course behaves identically to the other three.
// ---------------------------------------------------------------------------
import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

// Distinct interest + helper tags so the Governor's roster tells these sign-ups apart.
export const SOVEREIGN_AI_INTEREST_TAG = '[Sovereign A.I. class interest]';
export const SOVEREIGN_AI_HELPER_TAG = '[Sovereign A.I. class helper]';

export function resolveSovereignAiCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, SOVEREIGN_AI_CONFIRMED_COHORT, SOVEREIGN_AI_PROPOSED_COHORT_START);
}

export function buildSovereignAiSchedule(startISO) {
  return buildScheduleFor(SOVEREIGN_AI_MODULES, startISO, SOVEREIGN_AI_META.cadenceDays);
}

export function sovereignAiProgressSummary(progress = {}) {
  return progressSummaryFor(SOVEREIGN_AI_MODULES, progress);
}

export function exportSovereignAiCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor(
    { meta: SOVEREIGN_AI_META, sessionFlow: SOVEREIGN_AI_SESSION_FLOW, modules: SOVEREIGN_AI_MODULES },
    startISO,
  );
}

// The tutor course-meta this class passes to askTutor so the per-week solo guide
// introduces itself as the sovereign-A.I. course — keeping the test-and-verify
// discipline and the steward's posture, age-aware in tone.
export const SOVEREIGN_AI_TUTOR_META = {
  title: SOVEREIGN_AI_META.title,
  intro: 'You are a patient, encouraging tutor for a family + church course called "Sovereign A.I.: Why We Build Local."',
  posture: 'Guide ONE learner — who may be a teen, an adult, or a senior founding member — to understand WHY we run A.I. on hardware we own (resilience + data sovereignty), the honest model-tier landscape (small models on the CPU NAS today; a planned GPU "AI Forge" tier; the deep-reasoning tier), how SKOS routes work between local models and vendor LLMs behind the Cage, and the five local-A.I. opportunities. Match your pace and words to their age. Be HONEST about limits: small CPU models are slow and weaker on long, complex tasks; the GPU farm is planned, not bought; and model names/sizes move fast, so tell them to verify a specific number against the live Ollama library rather than trusting it. Never present an illustrative scenario as a real event. Always remind them to TEST what any A.I. tells them.',
};
