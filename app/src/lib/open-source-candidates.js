// =============================================================================
// open-source-candidates — ten open-source tools, weighed against our own stack
// =============================================================================
// Darrell, 2026-10-18: "Go get all these repos and integrate them into our
// technology stacks so we can see how we can gain more control and visibility
// into our projects and productivity... opportunities and constraints..."
// The record is DR-1099. Three more rows were added on 2026-10-19 (DR-1119),
// from the home-server video Darrell sent with "Fix our processes and create
// a way": Jellyfin, Immich and Audiobookshelf, read the same way at their
// latest releases; the fourth job it names, cameras, is already home (DR-0756).
//
// WHAT THIS IS. Each tool is a CANDIDATE for a capability, never a habit: it
// carries the exact release it was read at, its code and weight licences, what
// it sends off our network, whether it can run code, which of our machines it
// would live on, a verdict, the opportunities and constraints that decided it,
// the next step, and a re-review date. It sits beside sovereignty-gaps.js (the
// capabilities we still need a vendor for) and points at the gap it would help
// close, so the two ledgers read as one.
//
// HOW IT WAS MEASURED. Every repo was shallow-cloned at the pin below and READ,
// never run (2026-10-18). Five claims that decide verdicts were re-checked
// against the source by hand: Upscayl's launch event fires before its opt-out
// check; FreeLLMAPI rotates keys per platform; OpenManus runs Python exec() on
// the host with its sandbox off by default; Vane's single image grants a user
// passwordless sudo; VoiceStudio's default weights are CC-BY-NC.
//
// WHAT IT IS NOT. Nothing here is installed or running. A "pilot" verdict means
// "bring it home next, on this machine, under these limits", and its next step
// says how. A tool that can execute code must carry the three brakes before it
// can be piloted (CLAUDE.md, Autonomous Automation Requires Three Brakes).
//
// PURE (no React, no network). validateCandidates() is the gate, proven to
// catch in open-source-candidates.test.js.
// =============================================================================
import { SOVEREIGNTY_GAPS } from './sovereignty-gaps.js';

export const CANDIDATES_RECORDED = '2026-10-18';
export const CANDIDATES_DR = 'DR-1099';

export const VERDICTS = Object.freeze({
  pilot: 'Bring home next',
  hold: 'Hold',
  decline: 'Decline',
});

/** Where a tool would run. The device slugs are the register's (llm-providers.js). */
export const PLACES = Object.freeze({
  nas: 'The NAS (always on, no GPU)',
  'dev-gpu-node-1': 'Left RTX 4070 tower, 12 GB (tlcmediadpt)',
  'dev-gpu-node-2': 'Right RTX 4070 tower, 12 GB (live work wins it)',
  none: 'Not placed',
});

export const COMMERCIAL_USE = Object.freeze({
  clear: 'Cleared for any use',
  review: 'Family and church use; public or paid use waits on a licence check',
  blocked: 'Non-commercial weights; never used for COLG, TLC or paid work',
});

const DECLINE_REVIEW = '2027-04-18';

export const OPEN_SOURCE_CANDIDATES = [
  {
    id: 'vane',
    name: 'Vane',
    repo: 'ItzCrazyKns/Vane',
    pin: { ref: 'v1.12.2', sha: '9e8d883768c43520464345fefe58654f5cee451b' },
    replaces: 'Perplexity',
    capability: 'Research that searches the web and returns its sources with the answer',
    codeLicense: 'MIT',
    weightsLicense: 'None shipped; uses the LLM we point it at',
    commercialUse: 'clear',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Web searches through SearxNG’s upstream engines, and a weather widget (open-meteo, OpenStreetMap). No telemetry found.',
    auth: 'None. Login is listed as a future feature.',
    hardware: 'No GPU of its own; the LLM does the work. Next.js server on port 3000.',
    placement: 'nas',
    frontedBy: 'A loopback-only forwarder behind the family key, the shape the cameras use (DR-0756), with our own SearxNG container',
    verdict: 'pilot',
    why: 'It is the one tool here that serves the research lessons directly: POST /api/search returns the answer and every source URL, and it runs on our own qwen model with no vendor key.',
    opportunities: [
      'Research lessons get their sources from a search we own (DR-0601, DR-0734).',
      'Answers run on qwen2.5:14b on the right tower; nothing paid, nothing private leaves.',
      'The API returns sources as data, so our own checks can read them.',
    ],
    constraints: [
      'No login of any kind, so it must never be reachable except through our forwarder.',
      'The [n] citation marks are the model following a prompt; nothing checks that a source supports its sentence, so its output enters a lesson only through the verification gates (DR-0076).',
      'The single image adds passwordless sudo for its search user; use the slim image with a separate SearxNG instead.',
      'No test suite in the repo.',
    ],
    nextStep: 'Built (DR-1101): Vane slim plus our own SearxNG on loopback, the /research forwarder behind the family key, and research-health.yml, which asks one question and checks a source URL comes back. It starts on the NAS when services-sync runs it and the tower’s qwen and nomic-embed-text models answer; try it below.',
    builtRef: 'DR-1101',
    reReview: '2026-10-25',
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'invokeai',
    name: 'InvokeAI',
    repo: 'invoke-ai/InvokeAI',
    pin: { ref: 'v6.14.2', sha: '438246b846391385b074eae82bdbc82df2938007' },
    replaces: 'Midjourney',
    capability: 'Image creation and editing on our own GPU',
    codeLicense: 'Apache-2.0',
    weightsLicense: 'Per model: SDXL OpenRAIL++-M; FLUX.1 schnell and FLUX.2 Klein 4B Apache-2.0; FLUX.1 dev and several newer families non-commercial',
    commercialUse: 'review',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Model downloads from Hugging Face; optional hosted image APIs. No telemetry found in the backend.',
    auth: 'Single user by default; a multi-user login can be turned on.',
    hardware: 'SDXL needs 8 GB VRAM, FLUX.1 10 GB, FLUX.2 Klein 12 GB: all fit one 4070. FLUX.1 downloads are 12 to 33 GB.',
    placement: 'dev-gpu-node-1',
    frontedBy: 'Bound to loopback on the tower (the image defaults to 0.0.0.0), reached only through the GPU scheduler',
    verdict: 'pilot',
    why: 'The left tower is already standing up FLUX.1 schnell; InvokeAI is a tested, Apache-licensed studio and API for exactly that work, with a queue we can drive.',
    opportunities: [
      'Lesson, property and church images made on hardware we own.',
      'A real job queue (/api/v1/queue) the app can submit to and read back.',
      'Windows 10 and later are supported, which is what the towers run.',
    ],
    constraints: [
      'Pin the v6.14.2 release: main is a 7.0 alpha.',
      'Only SDXL, FLUX.1 schnell and FLUX.2 Klein 4B for anything public; FLUX.1 dev and the other non-commercial weights are blocked for COLG and TLC work.',
      'One GPU job at a time through the scheduler; the presenter tower is never used during services (DR-0001).',
    ],
    nextStep: 'Install v6.14.2 on the left tower with SDXL and FLUX.1 schnell only, loopback-bound, and add it to the GPU scheduler as an image job type.',
    reReview: '2026-11-01',
    gapRef: 'gap-video-gen',
    drRef: 'DR-1099',
  },
  {
    id: 'ace-step',
    name: 'ACE-Step 1.5',
    repo: 'ace-step/ACE-Step-1.5',
    pin: { ref: 'v0.1.8', sha: 'dce621408bee8c31b4fcf4811682eb9359e1bc94' },
    replaces: 'Suno',
    capability: 'Whole songs with vocals and lyrics, made locally',
    codeLicense: 'MIT',
    weightsLicense: 'Not stated in the repository; the Hugging Face model cards must be read before any public use',
    commercialUse: 'review',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Model downloads from Hugging Face or ModelScope, after a probe to Google to choose between them. No telemetry found.',
    auth: 'An optional API key, off unless set.',
    hardware: 'A 12 GB card is its Tier 5: the 2B models with the 1.7B planner fit with offload. The 4B XL models want 20 GB.',
    placement: 'dev-gpu-node-1',
    frontedBy: 'The API key set, bound to loopback, run through the GPU scheduler outside service hours',
    verdict: 'pilot',
    why: 'It is the only local tool that makes a full song, it fits our card at its documented tier, and the code is MIT.',
    opportunities: [
      'Songs for lessons and the family, made at home.',
      'An HTTP API (release_task and query_result) the lesson pipeline could call.',
      'About 185 tests in the repository.',
    ],
    constraints: [
      'The shipped compose loads the 4B planner, which is over our tier; set the 1.7B planner.',
      'The weight licence is not in the repository, so nothing it makes is published until the model card is read and recorded.',
      'Any lyric that quotes the Word is checked word for word against the translation, like every quotation in the app (DR-0076).',
    ],
    nextStep: 'Read and record the model-card licence, then install on the left tower with the 1.7B planner and the API key set.',
    reReview: '2026-11-08',
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'openshorts',
    name: 'OpenShorts',
    repo: 'mutonby/openshorts',
    pin: { ref: 'main', sha: '97ad88f396431ab4a96a967dc341ca992bcb9d41' },
    replaces: 'Opus Clip',
    capability: 'Long videos into captioned vertical clips',
    codeLicense: 'MIT for the core; the cloud/ folder is under its own commercial licence',
    weightsLicense: 'Whisper and YOLOv8 via Ultralytics; Ultralytics publishes YOLOv8 under AGPL-3.0',
    commercialUse: 'review',
    copyleftNetwork: true,
    canExecuteCode: false,
    egress: 'Gemini by default for choosing moments; optional S3, fal.ai, ElevenLabs, and social posting through Upload-Post. All off without their keys.',
    auth: 'None when self-hosted.',
    hardware: '8 GB RAM; on GPU, 8 GB VRAM is enough for Whisper large-v3-turbo. The default image is CPU-only.',
    placement: 'dev-gpu-node-2',
    frontedBy: 'Behind our forwarder with no Gemini, S3, fal.ai, ElevenLabs or Upload-Post key set',
    verdict: 'pilot',
    why: 'Sermon and lesson clips are real, recurring media work, and it can choose moments with our own model through LLM_BASE_URL.',
    opportunities: [
      'Captioned clips of each sermon for the church channels.',
      'Moments chosen by qwen on our own tower instead of Gemini.',
      'A job API (POST /api/process, GET /api/status) and 97 test files.',
    ],
    constraints: [
      'No login, and port 8000 is open in its compose file.',
      'Without Gemini, the features that look at the video frames are off.',
      'Posting to TikTok, Instagram or YouTube is a public act and stays off; clips are reviewed before anything is published.',
      'YOLOv8 is AGPL-3.0 through Ultralytics.',
      'No release tags: pinned to a commit, not a version.',
    ],
    nextStep: 'Run it after services on the right tower, through the GPU scheduler, with LLM_BASE_URL pointed at qwen and every cloud key unset, on one recorded sermon.',
    reReview: '2026-11-08',
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'upscayl',
    name: 'Upscayl (its engine only)',
    repo: 'upscayl/upscayl',
    pin: { ref: 'v2.15.1', sha: '5100d8df6a15068c6fd3607d010046c5c9a5ac2b' },
    enginePin: { repo: 'upscayl/upscayl-ncnn', ref: '20251207-174704', sha: 'd02fa88e078e7109fd689932453362430144014d' },
    replaces: 'Topaz Gigapixel',
    capability: 'Batch photo upscaling on our own GPU',
    codeLicense: 'AGPL-3.0 for the app and its upscayl-ncnn engine',
    weightsLicense: 'Real-ESRGAN models BSD-3; Remacri, UltraSharp and UltraMix have no licence stated in the repo',
    commercialUse: 'review',
    copyleftNetwork: true,
    canExecuteCode: false,
    egress: 'The desktop app sends a PostHog launch event with system details before it checks the opt-out setting. The engine binary itself sends nothing.',
    auth: 'Not applicable; a desktop app and a command-line binary.',
    hardware: 'A Vulkan GPU is required, so the NAS cannot run it; the 4070 can.',
    placement: 'dev-gpu-node-1',
    frontedBy: 'The upscayl-bin engine called from our own batch script; the Electron app is never installed',
    verdict: 'pilot',
    why: 'Property listing photos and lesson images need upscaling in bulk, and the engine is a plain command-line binary that takes a folder.',
    opportunities: [
      'Listing photos of every door sharpened in one batch.',
      'A folder in, a folder out: easy to drive from the NAS photo archive.',
      'Windows builds of the engine exist for the towers.',
    ],
    constraints: [
      'Do not install the desktop app: its telemetry fires before the opt-out is read.',
      'Real-ESRGAN models only; the models with no stated licence are not used.',
      'The engine is AGPL-3.0; we run it unmodified as a separate program and do not distribute it.',
      'No commits since March 2026, and no tests.',
    ],
    nextStep: 'Place upscayl-bin and the Real-ESRGAN x4plus model on the left tower and write the batch job for the property photo folders.',
    reReview: '2026-11-15',
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'voicestudio',
    name: 'VoiceStudio',
    repo: 'debpalash/VoiceStudio',
    pin: { ref: 'v0.5.6', sha: 'e99127fbc759760311932cd465ae751c0370cbe9' },
    replaces: 'ElevenLabs',
    capability: 'Voice cloning, text to speech, dubbing and transcription',
    codeLicense: 'AGPL-3.0-only, with a paid closed licence offered',
    weightsLicense: 'Default OmniVoice weights CC-BY-NC; the NLLB translator CC-BY-NC-4.0; the repo marks every model commercial_use false pending review',
    commercialUse: 'blocked',
    copyleftNetwork: true,
    canExecuteCode: true,
    egress: 'Model downloads; optional OpenAI, OpenRouter, Gemini, Google Translate and others; YouTube voice search. PostHog analytics off by default.',
    auth: 'Loopback by default; server mode needs an admin API key.',
    hardware: 'GPU optional; about 4 GB of models on first run.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'hold',
    why: 'Our own XTTS voice studio is already written for the 4070 and has never been armed; that, not a second studio, is the step that brings cloned voices home.',
    opportunities: [
      'Apache and MIT engines it lists (CosyVoice 3, VoxCPM2, KittenTTS) could sit behind our own /speak contract.',
      'An OpenAI-shaped /v1/audio/speech route is a clean contract to copy.',
      'Its WhisperX path is a second option beside our Whisper ladder.',
    ],
    constraints: [
      'The default voice model is non-commercial, and so is the translator.',
      'AGPL, a large dependency surface, and an MCP server and agent runner that can drive command-line agents.',
      'It has no XTTS engine, so it would not reuse the enrolled voices our studio expects.',
    ],
    nextStep: 'Arm infra/voice-studio on the left tower first (the voice gap is past its re-review); then try one Apache engine behind the same contract.',
    reReview: '2026-11-01',
    gapRef: 'gap-voice-clone',
    drRef: 'DR-1099',
  },
  {
    id: 'odysseus',
    name: 'Odysseus',
    repo: 'odysseus-dev/odysseus',
    pin: { ref: 'main', sha: '9712a5400175f8beacb215cefed1dad6935627df' },
    replaces: 'ChatGPT',
    capability: 'A private assistant with chat, memory, research, mail, calendar and agents',
    codeLicense: 'AGPL-3.0-or-later',
    weightsLicense: 'None shipped',
    commercialUse: 'review',
    copyleftNetwork: true,
    canExecuteCode: true,
    egress: 'SearxNG and optional Brave, Google, Tavily or Serper; any cloud LLM you add. No telemetry found.',
    auth: 'Multi-user passwords, sessions, admin role and 2FA, on by default.',
    hardware: 'Light by itself; the models it serves need the GPU.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'decline',
    why: 'It is a second PoeTech: chat, notes, mail, calendar and agents in another app. The PoeTech app is the primary artifact (DR-0065), and its agent can run shell commands and send email.',
    opportunities: [
      'Its bubblewrap containment layer and its 20-round agent cap are patterns worth copying.',
      'Its research mode is the same job Vane does with less surface.',
    ],
    constraints: [
      'An admin route runs arbitrary shell commands, and the agent can edit files and send mail.',
      'Scheduled agent tasks run inside the app.',
      'AGPL and no release tags.',
    ],
    nextStep: 'None. Take the containment and round-cap ideas into our own agent rules when one is built.',
    reReview: DECLINE_REVIEW,
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'freellmapi',
    name: 'FreeLLMAPI',
    repo: 'tashfeenahmed/freellmapi',
    pin: { ref: 'v0.16.0', sha: '9fe28f967932a6ac3182713c3a9391ce9602e701' },
    replaces: 'Claude Pro and other paid model plans',
    capability: 'One OpenAI-shaped API over free tiers of many hosted model providers',
    codeLicense: 'MIT',
    weightsLicense: 'None; it runs no models',
    commercialUse: 'blocked',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Every prompt goes to a third-party provider, including hosts in China and small unvetted proxies; a catalog is pulled from freellmapi.co twice a day.',
    auth: 'Email and password on a server install; single user.',
    hardware: 'None; about 40 MB of memory.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'decline',
    why: 'It is the opposite of sovereign: it spreads our prompts across dozens of providers, rotates keys to stay under free tiers, and its own authors say it is not for production.',
    opportunities: [
      'Its per-key budget and failover ideas are already met by our own router and provider register (DR-0132).',
    ],
    constraints: [
      'Private work routes local-only in our register; this would send it to unknown hosts.',
      'Rotating keys across free tiers risks provider terms; its own guide says one account per provider and flags several providers to avoid.',
      'It depends on a catalog feed and a premium tier run by its authors.',
    ],
    nextStep: 'None. Paid or free vendor models stay in the provider register with their keys and the honesty gate.',
    reReview: DECLINE_REVIEW,
    gapRef: 'gap-big-llm',
    drRef: 'DR-1099',
  },
  {
    id: 'dyad',
    name: 'Dyad',
    repo: 'dyad-sh/dyad',
    pin: { ref: 'v1.19.0', sha: '99ddc4756a91d7717aa90499496c180b1f83f293' },
    replaces: 'Lovable',
    capability: 'Apps built from plain English on the desktop',
    codeLicense: 'Apache-2.0, except the agent under src/pro, which is FSL-1.1 (fair source, not open source)',
    weightsLicense: 'None; it calls the model you choose',
    commercialUse: 'review',
    copyleftNetwork: false,
    canExecuteCode: true,
    egress: 'PostHog analytics only if you opt in; it also calls api.dyad.sh for its config, model catalog, templates and updates.',
    auth: 'Not applicable; a single-user desktop app.',
    hardware: 'Not stated.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'decline',
    why: 'We already build the app in plain English through Claude Code and a gated lane that tests, guards and merges every change; Dyad has no gates, runs only on a desktop, and its shell tool runs on the host after a review by its own cloud.',
    opportunities: [
      'Its per-agent step caps (100, 50, 12) are a clear way to write a budget.',
    ],
    constraints: [
      'Desktop only: no server mode and no API.',
      'The agent is FSL-licensed, and shell access is a Pro feature.',
      'It reaches api.dyad.sh for its catalog and updates.',
    ],
    nextStep: 'None.',
    reReview: DECLINE_REVIEW,
    gapRef: null,
    drRef: 'DR-1099',
  },
  {
    id: 'openmanus',
    name: 'OpenManus',
    repo: 'FoundationAgents/OpenManus',
    pin: { ref: 'v0.3.0', sha: 'f616c5d43d02d93ccc6e55f11666726d6645fdc2' },
    replaces: 'Manus',
    capability: 'A general agent that browses, codes and writes files',
    codeLicense: 'MIT',
    weightsLicense: 'None; it calls the model you configure',
    commercialUse: 'clear',
    copyleftNetwork: false,
    canExecuteCode: true,
    egress: 'Whatever model you configure, plus Google, DuckDuckGo, Baidu and Bing searches. No telemetry found.',
    auth: 'None.',
    hardware: 'Not stated.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'decline',
    why: 'It runs Python exec() and shell commands on the host with its sandbox off by default and no token budget, so it fails the three-brakes rule as shipped.',
    opportunities: [
      'Its Docker sandbox settings (memory, CPU, timeout) show the shape our own agent sandbox should take.',
    ],
    constraints: [
      'use_sandbox is false by default; the Python tool runs exec() with full builtins on the host.',
      'No token budget by default; only a step count of 20.',
      'No HTTP API, few tests, and an early version.',
    ],
    nextStep: 'None. Re-read it if it ships a sandbox and a budget on by default.',
    reReview: '2027-01-18',
    gapRef: null,
    drRef: 'DR-1099',
  },
  // ---- 2026-10-19: the home-server video (DR-1119) ------------------------
  // Each read at its latest release the same way: shallow-cloned at the pin,
  // licence and egress read from the source, never run. The bills: the inbox
  // holds ONE subscription in this class, Google AI Plus (2 TB) (Google One),
  // $9.99 a month, charged on the 14th; no Netflix, Hulu, Disney, Spotify,
  // Audible, Plex or Prime Video receipt in the last year.
  {
    id: 'immich',
    name: 'Immich',
    repo: 'immich-app/immich',
    pin: { ref: 'v3.3.3', sha: 'd2dac658fe1c67e8bbd08aa18200a32e5d45b9e4' },
    replaces: 'Google One (the storage half of the household’s Google AI Plus 2 TB plan, $9.99 a month)',
    capability: 'Phones back up their photos and videos to our own disk, searchable by face, place and date',
    codeLicense: 'AGPL-3.0',
    weightsLicense: 'CLIP and face models downloaded from Hugging Face on first use; per-model licences, read before any public use',
    commercialUse: 'review',
    copyleftNetwork: true,
    canExecuteCode: false,
    egress: 'Map tiles from tiles.immich.cloud, the machine-learning models from Hugging Face on first use, and a release check against GitHub; each can be turned off. Metrics only if IMMICH_TELEMETRY_INCLUDE is set.',
    auth: 'Its own multi-user login with an admin; OAuth optional.',
    hardware: 'No GPU needed: the machine-learning image defaults to CPU, so faces and scenes index slowly on the NAS’s Xeon, once, as a backlog. Needs its pinned Postgres (vectorchord) and Valkey containers.',
    placement: 'nas',
    frontedBy: 'Loopback only, behind a family-key forwarder on the Funnel like the cameras (DR-0756); its own login stays on as the second lock',
    verdict: 'pilot',
    why: 'It does the one job in the video that the inbox actually pays for: the 2 TB plan exists because the phones back up to Google. Immich backs them up to our pool instead, and the files stay ours as plain folders if Immich is ever removed. Our property-photos server keeps serving the app’s albums; this is the phone-backup job beside it.',
    opportunities: [
      'The phones’ photos and videos land on our own pool, in folders that outlive the app.',
      'Faces, places and dates searchable at home, with no account outside the house.',
      'The storage half of the one subscription in this class can be cancelled once the backup is proven.',
    ],
    constraints: [
      'AGPL-3.0: run unmodified and never offered outside the household; a change triggers the source-offer duty.',
      'Pool space is measured before the first backup; 2 TB of phone media must fit beside what the pool already holds.',
      'The CPU-only index of a large library takes days on the NAS; it runs under the services-sync clock and never during the property-photos server’s work.',
      'The mobile app needs the Funnel path to upload from outside the house, so the forwarder passes the upload routes under the family key.',
    ],
    nextStep: 'Bring it home by the Way (THE-WAY-A-SERVICE-COMES-HOME): measure the pool, register it in services.json with an installer that owns its data folder, a forwarder that says why, a witness and a surface; then prove one phone’s backup landed before anything is cancelled.',
    reReview: '2026-11-08',
    gapRef: null,
    drRef: 'DR-1119',
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    repo: 'jellyfin/jellyfin',
    pin: { ref: 'v12.2', sha: 'ca0f16eb7c195f720a1493ed469a27c4657db0c6' },
    replaces: 'Netflix and the other video subscriptions, none of which the inbox holds a receipt for',
    capability: 'Our own films, shows and recordings served to every screen in the house',
    codeLicense: 'GPL-2.0',
    weightsLicense: 'None; it runs no models',
    commercialUse: 'clear',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Artwork and metadata from TMDb and the other providers that are switched on; nothing when they are off. No telemetry found.',
    auth: 'Its own multi-user login with sessions.',
    hardware: 'Direct play is light; transcoding wants a GPU the NAS does not have, so files are kept in formats the screens play as they are.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'hold',
    why: 'The inbox shows no video subscription to replace and no library of our own films has been named; the sermon archive is served another way (church-media-golive). It is read again when a library exists.',
    opportunities: [
      'The sermon and worship recordings as one browseable library on the family’s screens.',
      'Discs the household owns, ripped to the pool, served without a subscription.',
      'A real test suite in the repository, and releases tagged.',
    ],
    constraints: [
      'No library yet: a server with nothing to serve is a container running for its own sake.',
      'Transcoding on the NAS CPU would starve the other services; only direct play is on the table.',
      'Metadata providers send film titles off the network; they stay off until that is weighed.',
    ],
    nextStep: 'Name the first library (the sermon and worship recordings, or the household’s own discs ripped to the pool); then bring it home by the Way.',
    reReview: '2026-12-01',
    gapRef: null,
    drRef: 'DR-1119',
  },
  {
    id: 'audiobookshelf',
    name: 'Audiobookshelf',
    repo: 'advplyr/audiobookshelf',
    pin: { ref: 'v2.37.1', sha: '3563d49424d50170324de9236a24c591b6d965e9' },
    replaces: 'Audible, for which the inbox holds no receipt',
    capability: 'Our own audiobooks and podcasts shelved and streamed to the phone, with progress kept',
    codeLicense: 'GPL-3.0',
    weightsLicense: 'None; it runs no models',
    commercialUse: 'clear',
    copyleftNetwork: false,
    canExecuteCode: false,
    egress: 'Cover art and metadata from Audible (through audnex), Google Books, Open Library, iTunes and FantLab only when a match is asked for. No telemetry found.',
    auth: 'Its own multi-user login.',
    hardware: 'Light; one Node process on port 13378 in its compose file, with the library as a plain folder.',
    placement: 'none',
    frontedBy: 'Not placed',
    verdict: 'hold',
    why: 'No Audible receipt and no shelf of audiobooks has been named. The sermon audio already has a road. It is read again when a shelf exists.',
    opportunities: [
      'The household’s own audiobooks and the sermon audio in one shelf, with progress kept across phones.',
      'A plain folder of files is the library; the app only reads it.',
    ],
    constraints: [
      'No shelf yet: nothing to serve.',
      'Metadata lookups send titles to Audible and Google; they stay off until weighed.',
    ],
    nextStep: 'Name the first shelf; then bring it home by the Way.',
    reReview: '2026-12-01',
    gapRef: null,
    drRef: 'DR-1119',
  },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const TEXT_FIELDS = ['name', 'replaces', 'capability', 'codeLicense', 'weightsLicense', 'egress', 'auth', 'hardware', 'frontedBy', 'why', 'nextStep'];

/**
 * The gate. A candidate without its record is not a candidate. Proven to catch
 * in open-source-candidates.test.js: each rule is broken there on purpose.
 */
export function validateCandidates(list = OPEN_SOURCE_CANDIDATES, { gaps = SOVEREIGNTY_GAPS, recorded = CANDIDATES_RECORDED } = {}) {
  const errors = [];
  const ids = new Set();
  const gapIds = new Set(gaps.map((g) => g.id));
  for (const c of list) {
    const at = c && c.id ? c.id : '(no id)';
    if (!c || !c.id) { errors.push(`${at}: missing id`); continue; }
    if (ids.has(c.id)) errors.push(`${at}: duplicate id`);
    ids.add(c.id);
    if (!REPO.test(String(c.repo || ''))) errors.push(`${at}: repo must be owner/name`);
    if (!c.pin || !SHA.test(String(c.pin.sha || '')) || !String(c.pin.ref || '').trim()) errors.push(`${at}: pin needs a ref and a 40-character commit, or it is not the code that was read`);
    if (c.enginePin && (!REPO.test(String(c.enginePin.repo || '')) || !SHA.test(String(c.enginePin.sha || '')))) errors.push(`${at}: enginePin needs a repo and a 40-character commit`);
    for (const k of TEXT_FIELDS) if (!String(c[k] || '').trim()) errors.push(`${at}: missing ${k}`);
    if (!Object.prototype.hasOwnProperty.call(VERDICTS, c.verdict)) errors.push(`${at}: unknown verdict "${c.verdict}"`);
    if (!Object.prototype.hasOwnProperty.call(PLACES, c.placement)) errors.push(`${at}: unknown placement "${c.placement}"`);
    if (!Object.prototype.hasOwnProperty.call(COMMERCIAL_USE, c.commercialUse)) errors.push(`${at}: unknown commercialUse "${c.commercialUse}"`);
    if (!Array.isArray(c.opportunities) || !c.opportunities.length) errors.push(`${at}: needs at least one opportunity`);
    if (!Array.isArray(c.constraints) || !c.constraints.length) errors.push(`${at}: needs at least one constraint`);
    if (!ISO.test(String(c.reReview || ''))) errors.push(`${at}: missing re-review date (DR-0075)`);
    else if (c.reReview < recorded) errors.push(`${at}: re-review ${c.reReview} is before the record itself`);
    if (!/^DR-\d{4}$/.test(String(c.drRef || ''))) errors.push(`${at}: missing DR ref`);
    if (c.gapRef != null && !gapIds.has(c.gapRef)) errors.push(`${at}: gapRef "${c.gapRef}" is not a recorded sovereignty gap`);
    if (typeof c.copyleftNetwork !== 'boolean') errors.push(`${at}: copyleftNetwork must be true or false`);
    if (typeof c.canExecuteCode !== 'boolean') errors.push(`${at}: canExecuteCode must be true or false`);
    if (c.copyleftNetwork && !(c.constraints || []).some((s) => /AGPL/.test(s)) && !/AGPL/.test(c.codeLicense || '')) {
      errors.push(`${at}: an AGPL tool must say so among its constraints`);
    }
    if (c.verdict === 'pilot') {
      if (c.placement === 'none') errors.push(`${at}: a pilot must name the machine it runs on`);
      if (/^Not placed$/i.test(String(c.frontedBy || ''))) errors.push(`${at}: a pilot must say what stands in front of it`);
      if (c.canExecuteCode) {
        const b = c.brakes || {};
        for (const k of ['budget', 'lock', 'killSwitch']) {
          if (!String(b[k] || '').trim()) errors.push(`${at}: a tool that can run code cannot be piloted without its ${k} (three brakes)`);
        }
      }
      if (c.commercialUse === 'blocked' && !(c.constraints || []).some((s) => /non-commercial|blocked/i.test(s))) {
        errors.push(`${at}: blocked weights must be named among the constraints`);
      }
    }
    if (c.verdict !== 'pilot' && c.placement !== 'none') errors.push(`${at}: only a pilot is placed on a machine`);
  }
  return { ok: errors.length === 0, errors };
}

/** Counts for the header, and how many pilots each machine would carry. */
export function summarizeCandidates(list = OPEN_SOURCE_CANDIDATES) {
  const byVerdict = { pilot: 0, hold: 0, decline: 0 };
  const byPlace = {};
  for (const c of list) {
    byVerdict[c.verdict] = (byVerdict[c.verdict] || 0) + 1;
    if (c.verdict === 'pilot') byPlace[c.placement] = (byPlace[c.placement] || 0) + 1;
  }
  return { total: list.length, byVerdict, byPlace };
}

/** The sovereignty gaps these candidates touch, with whether each re-review has passed. */
export function touchedGaps(today, list = OPEN_SOURCE_CANDIDATES, gaps = SOVEREIGNTY_GAPS) {
  const refs = new Set(list.map((c) => c.gapRef).filter(Boolean));
  return gaps.filter((g) => refs.has(g.id)).map((g) => ({
    id: g.id, capability: g.capability, reReview: g.reReview,
    overdue: ISO.test(String(today || '')) && g.reReview < today,
    candidates: list.filter((c) => c.gapRef === g.id).map((c) => c.name),
  }));
}

/** The exact code that was read: the repo at its pinned commit. */
export const pinnedUrl = (c) => `https://github.com/${c.repo}/tree/${c.pin.sha}`;
