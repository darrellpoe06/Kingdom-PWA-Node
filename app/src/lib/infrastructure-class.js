// =============================================================================
// infrastructure-class — "The Infrastructure: How We Build It Sovereign"
// =============================================================================
// The THIRD COLG / PoeTech Learn course (sister to "Learning A.I. The Way" and
// "The Broadcast: How It All Works"). It teaches BOTH real infrastructure efforts
// end to end:
//   • the HOME sovereign stack — the Synology NAS (DS1621xs), storage/RAID, the
//     UniFi UCG-Max gateway, Tailscale/WireGuard remote access, Ollama + local
//     models, the orchestrator/Charter, ntfy; and
//   • the CHURCH (COLG) stack — the sovereign NAS build, the Sanctuary LED video
//     wall + the RTX 4070 wall machines, the broadcast stack (ties to The Broadcast
//     course), and the forthcoming GPU hardware for perpetual local A.I.
//
// SAME SHARED FRAMEWORK as the other two courses (NOT a one-off): the generic
// helpers in church-classes.js (schedule, progress, markdown export, cohort
// propagation), the self-driving tutor (class-tutor.js → askTutor), the multi-modal
// lesson schema + skill-level branching + quiz/assessment + graduate→helper from
// learn-framework.js, and the POV SOP library (infrastructure-sops.js, reusing the
// broadcast capture pipeline). On top of all that it is AGE-ADAPTIVE: every module
// carries `levels.child` / `levels.teen` / `levels.senior` so the SAME truth renders
// short/visual/playful for a child and deeper for an adult (learn-framework AGE_BANDS).
//
// CHRISTIAN'S HOME PATH (Darrell's son, 10): every module carries a `hardware`
// pairing — the REAL device to find, look at, and (safely) touch — because that is
// how a 10-year-old learns best: short interactive segments tied to the iron in
// front of him. The home-stack weeks (1–6, 9, 10) are his core path; the church
// weeks (7–8) he visits.
//
// THE RESEARCH → PLAN → EXECUTE SHAPE: every module carries `rpe` so each lesson
// runs the same primitive the rest of the platform uses — find out what's real,
// decide the smallest safe step, then do it with the SOP.
//
// REALITY / NO-FABRICATION (DR-0076): the course teaches the VERIFIED architecture
// (Xeon D-1527 CPU-only NAS, ECC RAM, dual 10GbE, NVMe cache; UCG-Max VLAN
// segmentation; CPU-only local-LLM ceiling; the GPU farm is PLANNED/unbought per
// DR-0014). Live numbers (RAM %, storage %, which model is hot) are NOT hardcoded
// here — they live on the in-app Infrastructure inventory + LLM-health cards that
// read the real feed. Scripture anchors are cited by REFERENCE with a plain-language
// theme gloss — never a quoted translation (SCRIPTURE-REFERENCE-STANDARD).
//
// Grounds: AI-FOUNDATION-INTERNAL-OPERATIONS (the NAS runs the system), COMMUNITY-
// FIRST-MISSION (COLG first), DATA-AS-EMPOWERMENT-NOT-EXTRACTION + photo sovereignty
// (own the iron so the data can't be extracted), the three-brakes rule, and the
// app-is-primary default (the course's hands-on tie to real in-app surfaces).
// =============================================================================

// Proposed start for Cohort 1 — a Saturday (the build team's rhythm). Governor-
// editable in-app (data.infraCohort.startDate); the UI shows the true weekday so a
// non-Saturday is caught honestly. Stays "proposed" until Darrell confirms.
export const INFRA_PROPOSED_COHORT_START = '2026-07-18';

// PUBLISHED cohort — what every learner on every deployed build sees. Until Darrell
// locks the date this stays { confirmed:false } and the UI reads "proposed." Set
// confirmed:true (and startDate if it moved) and the next deploy propagates it.
export const INFRA_CONFIRMED_COHORT = {
  startDate: '2026-07-18',
  confirmed: false,
};

export const INFRA_META = {
  key: 'infrastructure',
  title: 'The Infrastructure: How We Build It Sovereign',
  audience: 'the build & media team, and family learners at every age — Christian (10) included',
  tagline: 'Own the iron. Steward the house. Sovereignty is faithfulness.',
  format: '10 weekly sessions · ~75 min each (paced to your age) · live time with Darrell plus hands-on with the real hardware',
  cadenceDays: 7,
  weeks: 10,
  handsOnLabel: 'Hands-on with the hardware',
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. We own the iron so the data serves the family and the community — never the other way around. Built to be handed on, at every age._',
};

// The session rhythm — the SAME 75-minute shape as the other courses (one muscle
// memory), with the hands-on segment named for the real hardware. The age band a
// learner picks then PACES this within each segment (shorter sub-steps + breaks for
// a child) via the framework's lessonPlanForAge — the rhythm is shared, the pacing
// is age-right.
export const INFRA_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 25, name: 'Hands-on with the hardware' },
  { minutes: 15, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const INFRA_SESSION_MINUTES = INFRA_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

// Each module mirrors the other courses' shape and adds three things: `rpe`
// (Research → Plan → Execute), `hardware` (Christian's real-device home path), and
// age `levels` (child/teen/senior depth of the same lesson). Anchors are reference
// + theme gloss, never a quoted verse.
export const INFRA_MODULES = [
  {
    id: 'inf1-what-is-sovereign',
    title: 'Own the iron — what "sovereign infrastructure" means',
    bigIdea: 'Sovereign means we own the machines our data and our A.I. run on, instead of renting someone else’s. See the whole map: the home stack and the church stack. We own the iron so it serves the family and the community — never the other way around.',
    inApp: 'Stand in front of the real stack and point to each box: the NAS (the brain + the barn), the network gateway (the walls and the door), and the screens. Then open the in-app Infrastructure inventory and match each real box to its live card.',
    anchor: { ref: 'Genesis 2:15; 1 Corinthians 4:2', theme: 'Put in the garden to work it and keep it; it is required of stewards that they be found faithful. We own and tend the iron as stewards, not as owners who extract.' },
    rpe: {
      research: 'Walk the stack and name every box you can see. Which is the NAS? Which is the gateway? What are the screens?',
      plan: 'Decide the one-sentence job of each box before you touch anything.',
      execute: 'Match each real box to its live card in the in-app Infrastructure inventory.',
    },
    hardware: [
      { device: 'The whole shelf / rack', look: 'Count the boxes and the blinking lights.', touch: 'Touch the outside of the cool, quiet boxes.', safe: 'Look first; don’t unplug anything or pull a cable.' },
    ],
    media: [
      { type: 'diagram', key: 'sovereign-stack-map', title: 'The two stacks', caption: 'Home stack (NAS · gateway · A.I.) and church stack (NAS · video wall · broadcast) — the iron we own.' },
      { type: 'clip', title: 'POV: a tour of the whole stack', sopId: 'inf-sop-nas-powerup', caption: 'First-person walk of the real boxes (pending capture).' },
    ],
    levels: {
      child: 'Sovereign is a big word that means "we own it." These boxes are OUR computers. The family’s pictures and the church’s words live on machines WE own, in OUR house and OUR church — not on a stranger’s computer far away. That’s safer, and it means nobody can take our stuff or sell it. Your job this week: find the boxes, point to each one, and learn its name. We look first and touch gently — these are special.',
      senior: 'Sovereignty here is the architecture decision that everything else rests on: compute, storage, network, and A.I. all run on hardware the family and the church OWN and govern, so the data can’t be extracted, the service can’t be revoked, and the bill can’t be turned into a lever. The trade is real — we carry the responsibility a vendor would otherwise carry (backups, updates, uptime) — and the course exists so that responsibility is shared and documented, not held in one head. The map has two halves that mirror each other: the home stack proves the pattern; the church stack carries it to the first community we serve.',
    },
    quiz: {
      questions: [
        { q: 'What does "sovereign infrastructure" mean here?', options: ['Renting the biggest cloud', 'We own the machines our data + A.I. run on, so it serves us and can’t be extracted', 'Using only free apps'], answer: 1, explain: 'Owning the iron is what keeps the data ours and the service un-revocable — the whole point.' },
        { q: 'Why own it instead of renting?', options: ['It’s always cheaper', 'So the data can’t be sold or held hostage, and the service can’t be revoked', 'So we never need backups'], answer: 1, explain: 'Sovereignty is about control + stewardship, not always about being cheapest.' },
      ],
    },
    lesson: 'Before any single box makes sense, you have to see what we’re building and WHY. "Sovereign infrastructure" means the machines that run our data, our automation, and our A.I. are machines we OWN and govern — sitting in our house and our church — instead of renting space on a giant company’s computers far away. That choice is the foundation of everything PoeTech stands for: when you own the iron, your family’s photos and your church’s sermons can’t be quietly sold, mined, or held hostage, and the service can’t be switched off by someone else. There’s an honest cost — we carry the responsibility a landlord would otherwise carry (backups, updates, keeping it running), which is exactly why this course exists: so that work is shared and written down, not trapped in one person’s head. The map has two halves that rhyme. The HOME stack — a NAS that stores and runs services, a gateway that walls and guards the network, local A.I., remote access — proves the pattern at family scale. The CHURCH (COLG) stack carries that same pattern to the first community we serve. Genesis 2:15 says we were put in the garden to work it and KEEP it; 1 Corinthians 4:2 says stewards must be found faithful. We own and tend the iron as stewards — so it lifts the family and the community, and never extracts from them.',
    facilitator: {
      talkingPoints: [
        'Sovereign = we own the machines our data + A.I. run on. Owning the iron is what keeps the data ours.',
        'The honest trade: we carry the responsibility a vendor would (backups, updates, uptime) — so we share + document it.',
        'Two halves that mirror: the home stack proves the pattern; the church stack carries it to COLG, the first community.',
        'Genesis 2:15 / 1 Cor 4:2 — work it and keep it; stewards found faithful. We tend the iron; it serves people, never extracts.',
      ],
      howToRun: 'Prayer + the anchor (5): open in prayer; read Genesis 2:15 — work it and keep it. | Recap last week (10): first session — instead, go around: name, and one device you use every day. | Teach the big idea (15): define sovereign; draw the two stacks; name the job of each box. | Hands-on with the hardware (25): walk the real stack; each learner points to and names the NAS, the gateway, the screens; open the in-app Infrastructure inventory and match boxes to cards. | Discussion (15): what could go wrong if a stranger owned our data instead of us? | Send-off + solo task (5): solo task — teach one family member the word "sovereign" and point out one box we own.',
      discussionPrompts: [
        'What’s one thing that stays safe because WE own the box, not a stranger?',
        'What’s the honest cost of owning it — and how do we carry that together?',
        'How is "work it and keep it" a job description for this whole stack?',
      ],
    },
  },
  {
    id: 'inf2-the-nas',
    title: 'The brain and the barn — the Synology NAS',
    bigIdea: 'The NAS is one box that does two big jobs: it STORES the family’s data (the barn) and it RUNS our services and local A.I. (the brain). It’s a serious server — a Xeon CPU, error-correcting memory, many drive bays — but on purpose it has no graphics card.',
    inApp: 'Find the NAS. Look at the front: the status light and the drive bays. Sign in to the dashboard and read the real System Health. Notice the services running on it (automation, the local A.I., file sharing).',
    anchor: { ref: 'Genesis 41:48–49; Proverbs 21:20', theme: 'Joseph stored up grain in the storehouses against the lean years; the wise store up choice provision. The NAS is our storehouse — what we save now protects us later.' },
    rpe: {
      research: 'What is a NAS? What runs on ours, and what does it hold?',
      plan: 'Decide what you’ll check to know it’s healthy BEFORE touching it.',
      execute: 'Power-up + health-check with the SOP; confirm the services are running.',
    },
    hardware: [
      { device: 'The Synology NAS', look: 'Find the front status light and count the drive bays.', touch: 'Touch the cool metal case; feel the quiet hum.', safe: 'Never pull a drive out — that can hurt the data. Just look.' },
    ],
    media: [
      { type: 'diagram', key: 'nas-anatomy', title: 'Inside the NAS', caption: 'One box, two jobs: the barn (drive bays = storage) and the brain (CPU + RAM = services + local A.I.).' },
      { type: 'clip', title: 'POV: NAS power-up & health check', sopId: 'inf-sop-nas-powerup', caption: 'First-person power-up and System Health read (pending capture).' },
    ],
    levels: {
      child: 'The NAS is one special box that does two jobs. Job one: it’s a BARN — it keeps the family’s pictures and files safe inside little drawers called drive bays. Job two: it’s a BRAIN — it runs the helpers and our own A.I. It has a strong chip called a CPU and special careful memory, but no fancy game graphics card, because its job is keeping things safe, not playing games. Go find it, count the little drawers in front, and watch the light. Touch the cool case — but never pull a drawer out.',
      senior: 'The NAS is the always-on services spine and the data home. Real specs to know it honestly: an Intel Xeon D-1527 — server-grade, ECC-capable, but only 4 cores / 8 threads and several generations old — with ECC memory, multiple drive bays, NVMe cache slots, and dual 10-gigabit networking. It is intentionally CPU-only (no discrete GPU), which makes it an excellent orchestrator and file server and a serviceable host for small local models, but NOT a fast inference rig — a distinction week 7 builds on. It runs the automation (n8n), the local A.I. (Ollama), file/chat/photo services, and the push notifier (ntfy). The live numbers — RAM and storage in use, which model is hot — aren’t memorized; they’re read off the in-app Infrastructure inventory, which traces every value to a real probe.',
    },
    quiz: {
      questions: [
        { q: 'What two jobs does the NAS do?', options: ['Only stores files', 'Stores the data (the barn) AND runs services + local A.I. (the brain)', 'Only runs games'], answer: 1, explain: 'One box, two jobs: storage and services. That’s why it’s the heart of the home stack.' },
        { q: 'Why does the NAS have no graphics card?', options: ['They forgot one', 'It’s built to store + serve reliably, not to do fast graphics/A.I. — that’s a different machine', 'Graphics cards are illegal'], answer: 1, explain: 'CPU-only is fine for storage, services, and small models; heavy A.I. needs a GPU (week 7).' },
      ],
    },
    lesson: 'The Synology NAS is the single most important box in the home stack, and the clearest way to understand it is that it does two jobs at once. It is a BARN — it stores the family’s data safely across several hard drives held in slots called drive bays. And it is a BRAIN — it runs the services the whole system depends on: the automation engine (n8n), our own local A.I. (Ollama), file/chat/photo sharing, and the notifier that pushes alerts (ntfy). Under the hood it’s a real server: an Intel Xeon processor, error-correcting (ECC) memory that catches its own mistakes, multiple drive bays, fast NVMe cache, and two 10-gigabit network ports. But notice what it does NOT have on purpose: a graphics card. That makes it superb at storing and serving and running small helpers, and deliberately not built for heavy, fast A.I. — that’s a different machine we’ll meet in week 7. One more discipline that runs through this whole course: we don’t memorize the live numbers (how full the disks are, which model is loaded). We read them off the in-app Infrastructure inventory, which traces every value to a real probe — so the number is always true, never painted. Like Joseph filling the storehouses before the lean years (Genesis 41), the NAS is our storehouse: what we keep safe now protects us later.',
    facilitator: {
      talkingPoints: [
        'One box, two jobs: the barn (drive bays = storage) and the brain (CPU + RAM = services + local A.I.).',
        'Real, honest spec: Xeon D-1527, ECC memory, drive bays, NVMe cache, dual 10GbE — and CPU-only (no GPU) ON PURPOSE.',
        'It runs n8n (automation), Ollama (local A.I.), file/chat/photos, ntfy (push). The services spine of the home stack.',
        'We never memorize live numbers — we read them off the in-app Infrastructure inventory, which traces each to a real probe.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Genesis 41:48–49 — Joseph’s storehouses. | Recap last week (10): a learner names the boxes from week 1. | Teach the big idea (15): the barn + the brain; the honest spec; why no GPU. | Hands-on with the hardware (25): find the NAS; read the front light + bays; sign in and read real System Health; list the running services; open the in-app inventory and confirm the numbers match. | Discussion (15): what makes a "healthy" NAS, and how would we know it’s sick? | Send-off + solo task (5): solo task — check the inventory card once this week and note one number.',
      discussionPrompts: [
        'Why is "no graphics card" the RIGHT choice for this particular box?',
        'What’s the difference between the barn job and the brain job?',
        'Why do we read live numbers off the inventory instead of trusting memory?',
      ],
    },
  },
  {
    id: 'inf3-storage-raid',
    title: 'Never lose the family’s data — disks, RAID, and backups',
    bigIdea: 'Hard drives WILL fail eventually — so we plan for it. RAID lets the NAS keep working when one drive dies. And a backup is a second copy somewhere else: 3 copies, 2 kinds of media, 1 offsite. We keep an encrypted copy at the church, sealed.',
    inApp: 'At the NAS, count the drive bays. In the dashboard, see how the drives are grouped (the RAID) and find the backup job. Confirm the offsite copy exists. (A parent supervises any drive handling — never yank a drive.)',
    anchor: { ref: 'Proverbs 27:23; Luke 14:28', theme: 'Know well the state of your flocks; count the cost before you build. Knowing what you have, and protecting it, is wisdom — not fear.' },
    rpe: {
      research: 'How many drives are there, and how are they grouped? Where is the backup?',
      plan: 'Decide what "protected" means: redundancy here + a copy elsewhere.',
      execute: 'Confirm the array is Healthy and the offsite backup ran — verify a small restore.',
    },
    hardware: [
      { device: 'The NAS drive bays', look: 'Count the bays and find which ones have drives.', touch: 'With a parent, feel a drive caddy’s handle.', safe: 'NEVER pull a drive while it’s running — that can lose data.' },
    ],
    media: [
      { type: 'diagram', key: 'raid-redundancy', title: 'RAID + 3-2-1 backup', caption: 'RAID = the array survives one drive dying. Backup = 3 copies, 2 media, 1 offsite (encrypted, at the church).' },
      { type: 'clip', title: 'POV: replacing a failed drive', sopId: 'inf-sop-raid-drive-swap', caption: 'First-person careful drive swap + rebuild (pending capture).' },
    ],
    levels: {
      child: 'Hard drives are like notebooks that hold the family’s pictures — and one day a notebook can rip. So we’re clever: RAID means we write things across several notebooks so that if ONE rips, nothing is lost and the box keeps working. And a backup is a whole second copy kept somewhere else — we keep a locked, secret copy at the church. The rule to remember: 3 copies, in 2 different places, 1 of them far away. Count the little drawers on the NAS. And the big rule: NEVER pull a drawer out — only a grown-up does that, carefully.',
      senior: 'Two different protections that people constantly confuse, kept distinct: RAID is REDUNDANCY (uptime/fault-tolerance), not a backup — it lets the array survive a drive failure so service continues, but it does nothing against deletion, ransomware, fire, or theft. A BACKUP is an independent copy, ideally following 3-2-1: three copies, on two media types, one offsite. Our offsite leg is an ENCRYPTED, sealed blob on the church NAS — the isolation walls hold both directions, so neither site can read the other’s plaintext. The discipline that matters most: a backup you have never restored is a hope, not a backup — so the routine includes a periodic test restore (the SOP captures it). When a drive does fail, the swap-and-rebuild is the highest-stakes routine on the box; verify the backup is current BEFORE starting, and never power-cycle mid-rebuild.',
    },
    quiz: {
      questions: [
        { q: 'Is RAID the same as a backup?', options: ['Yes, identical', 'No — RAID survives a drive dying (uptime); a backup is a separate copy against deletion/fire/theft', 'RAID replaces backups'], answer: 1, explain: 'RAID = redundancy, not a backup. You need BOTH. RAID won’t save you from a deleted file or a fire.' },
        { q: 'What is the 3-2-1 backup rule?', options: ['3 passwords, 2 logins, 1 phone', '3 copies, on 2 kinds of media, 1 of them offsite', '3 drives in one box'], answer: 1, explain: '3 copies, 2 media, 1 offsite — ours is an encrypted sealed copy at the church.' },
      ],
    },
    lesson: 'Here is a truth that sounds scary but is just engineering: every hard drive will fail eventually. Wise builders don’t pretend otherwise — they plan for it, and that planning has two distinct halves people constantly mix up. The first is RAID — redundancy. The NAS writes the data across several drives in a way that lets it keep running even when ONE drive dies; you replace the dead drive and the array rebuilds itself. But RAID is NOT a backup: it protects against a drive dying, not against a file being deleted, a ransomware attack, a fire, or a theft. For those you need the second half — a BACKUP, a fully independent copy kept somewhere else. The rule of thumb is 3-2-1: three copies of the data, on two different kinds of media, with one of them offsite. Our offsite copy is an ENCRYPTED, sealed blob stored on the church NAS, with isolation walls so neither site can read the other’s plaintext. And the single most important habit: a backup you’ve never restored is only a hope — so the routine includes a real test restore. When a drive does fail, replacing it is the highest-stakes routine on the whole box: confirm the backup is current first, swap only the failed drive, and never power-cycle during a rebuild. Proverbs 27:23 says know well the state of your flocks — knowing what you have and protecting it is wisdom, not fear.',
    facilitator: {
      talkingPoints: [
        'Every drive fails eventually — we PLAN for it, with two distinct protections.',
        'RAID = redundancy (survives a drive dying, keeps uptime). It is NOT a backup.',
        'Backup = a separate copy: 3-2-1 (3 copies, 2 media, 1 offsite). Ours is an encrypted sealed blob at the church.',
        'A backup you’ve never restored is a hope — test-restore. Drive swap: verify backup first, never power-cycle mid-rebuild.',
        'Proverbs 27:23 — know the state of your flocks. Protecting what you have is wisdom.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 27:23 and Luke 14:28. | Recap last week (10): a learner names the NAS’s two jobs. | Teach the big idea (15): RAID vs backup; the 3-2-1 rule; the encrypted offsite copy; test-restore. | Hands-on with the hardware (25): count the bays; in the dashboard see the RAID grouping and the backup job; confirm the offsite copy; (supervised) feel a caddy — never pull one live. | Discussion (15): what would RAID NOT save us from, and what backup would? | Send-off + solo task (5): solo task — find out when our last successful backup ran.',
      discussionPrompts: [
        'Name one disaster RAID survives and one it does NOT — and what covers the second.',
        'Why is a never-tested backup not really a backup?',
        'What does 3-2-1 look like exactly in our setup?',
      ],
    },
  },
  {
    id: 'inf4-network-gateway',
    title: 'Walls and gates — the UniFi gateway',
    bigIdea: 'The network gateway is the front door of the whole system AND the inside walls. It connects us to the internet, and it splits the network into separate rooms (VLANs) so the family, the church, the clinic, the rentals, and PoeTech each stay walled off from the others.',
    inApp: 'Find the gateway. Trace the one cable coming IN from the internet (WAN) and the cables going OUT to everything else (LAN). In the controller, see the separate VLAN "rooms" and which devices live in each.',
    anchor: { ref: 'Nehemiah 2:17; 4:9', theme: 'Come, let us rebuild the wall; they prayed and set a guard day and night. Walls and a watch are how a city — and a network — stays safe and whole.' },
    rpe: {
      research: 'Which cable is the internet coming in? Which go out? What rooms (VLANs) exist?',
      plan: 'Decide which devices belong in which walled room.',
      execute: 'Confirm devices land on the right VLAN and can’t reach a room they shouldn’t.',
    },
    hardware: [
      { device: 'The UniFi UCG-Max gateway', look: 'Find the status light; spot the WAN port (internet in) vs LAN ports (out).', touch: 'Trace a cable with your finger from the gateway to where it goes.', safe: 'Don’t unplug a cable — tracing with your finger is enough.' },
    ],
    media: [
      { type: 'diagram', key: 'network-vlans', title: 'The gateway + VLAN walls', caption: 'One door to the internet; inside, separate walled rooms (VLANs): family · COLG · TLC · Properties · PoeTech.' },
      { type: 'clip', title: 'POV: the gateway + its VLAN walls', sopId: 'inf-sop-gateway-vlan', caption: 'First-person tour of the gateway and the segments (pending capture).' },
    ],
    levels: {
      child: 'A gateway is like the front door of a big house — and also the walls between the rooms inside. One door connects us to the whole internet. And inside, the gateway builds invisible walls so the family’s computers, the church’s computers, and the work computers each have their OWN room and can’t wander into each other’s. That keeps everything safe and tidy. Go find the gateway. One cable brings the internet IN; the others carry it OUT to all the rooms. Trace a cable with your finger — but don’t unplug it!',
      senior: 'The gateway (a Ubiquiti UCG-Max) is two roles in one device: the perimeter (the WAN edge — routing, firewall, the way in and out) and the interior segmentation. Its most important contribution is VLAN segmentation: the NAS serves several stakeholder groups — family, COLG (church), TLC (clinical, HIPAA-adjacent), Poe Properties (rentals), and future PoeTech customers — and without segmentation they’d all share one broadcast domain. With per-purpose VLANs each is walled off at layer 2, which is also how the clinical data stays isolated as policy requires. The UCG-Max also carries built-in WireGuard (an alternative/supplement to Tailscale for clients and contractors who shouldn’t be on the family tailnet), an internal reverse proxy + DNS (so services answer to friendly names, not bare IPs), and a RADIUS server for unified per-role credentials. A wall you can’t explain is a wall you can’t trust — document each segment.',
    },
    quiz: {
      questions: [
        { q: 'What two jobs does the network gateway do?', options: ['Only connects to the internet', 'Connects us to the internet (the door) AND walls the network into separate rooms (VLANs)', 'Only stores files'], answer: 1, explain: 'It’s the front door AND the inside walls — perimeter plus segmentation.' },
        { q: 'Why split the network into VLAN "rooms"?', options: ['To slow it down', 'So family, church, clinic, rentals, and PoeTech stay walled off from each other (safety + isolation)', 'For decoration'], answer: 1, explain: 'Segmentation keeps each group isolated — especially the clinical data that policy requires walled off.' },
      ],
    },
    lesson: 'If the NAS is the brain and the barn, the gateway is the front door and the interior walls — and it does both jobs at once. As the door, it connects the whole stack to the internet and stands as the perimeter: routing traffic and firewalling out what shouldn’t come in. As the walls, it splits one physical network into several separate "rooms" called VLANs. This matters enormously because the NAS serves very different groups off one box — the family, the church (COLG), the clinic (TLC, which has health-privacy rules), Poe Properties (the rentals), and eventually PoeTech’s own customers. Without segmentation they’d all share one open network; with per-purpose VLANs, each is walled off from the others, which is also how the clinical data stays isolated exactly as policy requires. Our gateway is a Ubiquiti UCG-Max, and it carries a few more sovereign powers: a built-in WireGuard VPN (a way to let a contractor or tenant in without putting them on the family’s private network), an internal reverse proxy and DNS so our services answer to friendly names instead of bare numbers, and a RADIUS server so each person gets one set of credentials matched to their role. Nehemiah rebuilt the wall AND set a guard day and night (Nehemiah 4:9) — walls and a watch are how a city, and a network, stays safe and whole. And a wall you can’t explain is a wall you can’t trust, so every segment gets documented.',
    facilitator: {
      talkingPoints: [
        'The gateway is the front door (internet + firewall) AND the inside walls (segmentation) — two jobs, one box.',
        'VLAN segmentation walls family / COLG / TLC / Properties / PoeTech off from each other — that’s how clinical data stays isolated.',
        'UCG-Max extras: built-in WireGuard (let contractors/tenants in safely), reverse proxy + friendly DNS, RADIUS (one credential per role).',
        'Nehemiah 4:9 — rebuild the wall AND set a guard. A wall you can’t explain is a wall you can’t trust: document each segment.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Nehemiah 2:17 and 4:9. | Recap last week (10): a learner explains RAID vs backup. | Teach the big idea (15): door + walls; VLAN segmentation and why isolation matters; the UCG-Max extras. | Hands-on with the hardware (25): find the gateway; trace WAN-in vs LAN-out cables; in the controller see the VLAN rooms and which devices are in each; confirm a device can’t reach a room it shouldn’t. | Discussion (15): which group most NEEDS to stay walled off, and why? | Send-off + solo task (5): solo task — list the five VLAN "rooms" from memory.',
      discussionPrompts: [
        'Why must the clinic (TLC) data live in its own walled room?',
        'When would we use the gateway’s WireGuard instead of the family tailnet?',
        'What does "a wall you can’t explain is a wall you can’t trust" mean for documentation?',
      ],
    },
  },
  {
    id: 'inf5-remote-access',
    title: 'Reaching it safely from anywhere — Tailscale & WireGuard',
    bigIdea: 'We need to use the stack from the road without leaving the front door wide open to the world. A private tunnel (VPN) like Tailscale or WireGuard lets the right people in over an encrypted path — and keeps everyone else out. The app reaches the NAS the same private way.',
    inApp: 'On a phone or laptop, open the remote-access app and see your device listed as an online node. Confirm it can reach the NAS over the private path — and that a device that shouldn’t reach something, can’t.',
    anchor: { ref: 'John 10:1–3; Psalm 121:7–8', theme: 'The gatekeeper opens to the shepherd; the Lord keeps your going out and coming in. The right door opens only for the right ones — that is safety, not suspicion.' },
    rpe: {
      research: 'How does a device reach the NAS from outside the house today?',
      plan: 'Decide who should get in by which path (family tailnet vs contractor WireGuard).',
      execute: 'Add a device, confirm it reaches the NAS privately, and that it can’t reach more than its role allows.',
    },
    hardware: [
      { device: 'A phone or laptop running Tailscale', look: 'Open the app; find your device’s green "online" node.', touch: 'Tap to see the private address it uses to reach home.', safe: 'No hardware risk — just don’t share a login.' },
    ],
    media: [
      { type: 'diagram', key: 'remote-access', title: 'The private tunnel', caption: 'A device → an encrypted VPN tunnel → the NAS at home. The front door stays closed to the public internet.' },
      { type: 'clip', title: 'POV: onboarding a device to remote access', sopId: 'inf-sop-remote-access', caption: 'First-person add-a-device + verify (pending capture).' },
    ],
    levels: {
      child: 'Sometimes we’re not at home but we still need to reach our computers there — safely. A VPN is like a secret tunnel only WE can walk through: it scrambles everything inside so no one outside can peek, and the door at home only opens for people we trust. So we don’t have to leave the front door wide open to the whole world. The app on your phone uses that same secret tunnel to talk to the NAS at home. The rule: the right door opens for the right person — and that keeps us safe.',
      senior: 'The problem this solves: you need to reach the services from outside the LAN without exposing them to the public internet (an open port is an attack surface). The answer is an encrypted overlay — a VPN. Today the family uses Tailscale (a WireGuard-based mesh) for admin convenience; the roadmap is to add the UCG-Max’s built-in WireGuard for clients, 1099 contractors, and tenants who should NOT be on the family tailnet, and eventually to migrate fully off the Tailscale dependency (native WireGuard or Headscale) for full sovereignty. A key app-level detail: the PWA reaches the n8n webhooks through a SAME-ORIGIN /n8n rewrite, never the absolute Funnel URL, because cross-origin gets throttled. The governing principle is least access: each identity reaches exactly what its role needs and no more — the door opens for the right one, which is safety, not suspicion.',
    },
    quiz: {
      questions: [
        { q: 'What does a VPN (Tailscale/WireGuard) let us do?', options: ['Leave the front door open to everyone', 'Reach the stack from anywhere over an encrypted private tunnel, while keeping the public out', 'Delete the network'], answer: 1, explain: 'A VPN is a private encrypted path in for the right people — without exposing services to the open internet.' },
        { q: 'Who should use the gateway’s WireGuard instead of the family tailnet?', options: ['Everyone in the family', 'Contractors, clients, and tenants who shouldn’t be on the family’s private network', 'Nobody'], answer: 1, explain: 'Least access: outsiders get a separate WireGuard path, not the family tailnet.' },
      ],
    },
    lesson: 'Owning the iron is only useful if you can actually reach it — from the church, from the road, from a hotel — but you must do that WITHOUT leaving the front door open to the whole internet, because an exposed service is an open invitation to attackers. The answer is a VPN: a private, encrypted tunnel that only trusted devices can travel through. Today the family uses Tailscale, which is built on the WireGuard protocol and forms a private mesh between our devices and the NAS; a device shows up as an "online node" and can reach home over that encrypted path while the public sees nothing. The plan from here has two moves toward more sovereignty: add the gateway’s own built-in WireGuard for people who should get limited access but should NOT be on the family’s private network — contractors, clients, tenants — and eventually migrate fully off the outside Tailscale service to a self-hosted path. One important app detail lives here too: the PoeTech app reaches the automation webhooks through a same-origin "/n8n" rewrite rather than the absolute public URL, because the cross-origin path gets throttled — a small thing that keeps the whole app responsive. The principle underneath it all is least access: each person reaches exactly what their role needs and nothing more. As John 10 pictures it, the gatekeeper opens to the shepherd — the right door opens for the right one. That’s safety, not suspicion.',
    facilitator: {
      talkingPoints: [
        'Reach the stack from anywhere over an encrypted VPN tunnel — without exposing services to the public internet.',
        'Today: Tailscale (WireGuard-based mesh) for family admin. Roadmap: UCG-Max WireGuard for contractors/tenants; eventually off the Tailscale dependency.',
        'App detail: the PWA reaches n8n via the SAME-ORIGIN /n8n rewrite, never the absolute Funnel URL (cross-origin throttles).',
        'Least access: each identity reaches exactly what its role needs. John 10 — the door opens for the right one.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read John 10:1–3 and Psalm 121:7–8. | Recap last week (10): a learner names the VLAN rooms. | Teach the big idea (15): why not expose ports; what a VPN is; Tailscale now, WireGuard next; least access. | Hands-on with the hardware (25): on a device, open the access app, see the online node, reach the NAS privately; show that a wrong-role device can’t reach more than it should. | Discussion (15): what’s the danger of just opening a port to the internet? | Send-off + solo task (5): solo task — name who in our world should get WireGuard, not the tailnet.',
      discussionPrompts: [
        'Why is leaving a service open to the public internet dangerous?',
        'Who gets the family tailnet, and who gets a separate WireGuard path — and why?',
        'How is "the right door opens for the right one" the definition of least access?',
      ],
    },
  },
  {
    id: 'inf6-local-ai',
    title: 'Our own A.I. — Ollama and the models on our hardware',
    bigIdea: 'We run A.I. on OUR machines, so the family’s and the church’s words never go to a stranger’s cloud. Ollama runs open models on the NAS. Because the NAS is CPU-only, it runs SMALL models — fine for many jobs, and the bigger ones wait for the GPU box (week 7).',
    inApp: 'Open the in-app A.I. health card and see which local model is loaded right now (read live). Ask the local tutor a question and notice the reminder: test what it tells you. Confirm the answer came from OUR model, not a vendor.',
    anchor: { ref: '1 Thessalonians 5:21; Proverbs 2:6', theme: 'Test everything; hold fast what is good — for the Lord gives wisdom. Our A.I. is a tool to be tested, and true wisdom comes from God, not the machine.' },
    rpe: {
      research: 'Which model is running locally right now, and what size can this box handle?',
      plan: 'Decide what jobs are right for a small local model vs what needs the GPU.',
      execute: 'Ask the local tutor; verify the answer; confirm it ran locally + within the three brakes.',
    },
    hardware: [
      { device: 'The NAS (it’s also the A.I.)', look: 'On a screen, open the in-app A.I. health card and read the live model.', touch: 'It’s the same NAS box you already met — point to it.', safe: 'Never leave a model pinned/looping unattended.' },
    ],
    media: [
      { type: 'clip', title: 'POV: pulling & running a local model', sopId: 'inf-sop-local-model', caption: 'First-person Ollama pull + local test prompt (pending capture).' },
    ],
    levels: {
      child: 'Our A.I. lives on OUR own computer at home — not a stranger’s. That means when you ask it something, your words don’t fly off to some giant company; they stay with us. The helper that runs it is called Ollama. Our NAS is strong, but it’s built for keeping things safe, not for the very biggest A.I. brains — so it runs the small, quick helpers, and the really big brains will live on a special game-card computer we’ll meet soon. And remember the most important rule from our other class: A.I. can be wrong, so always TEST what it tells you.',
      senior: 'The sovereignty claim made concrete: Ollama serves open-weights models (Llama 3.x, Qwen 2.5, Mistral, Phi, Gemma class) on our own box, so no family or church content is sent to a vendor for inference. The honest ceiling: the NAS is CPU-only, so it runs models in roughly the ≤13B range comfortably (up to ~30B with heavy quantization), and at CPU token-rates — fine for classifiers, small helpers, and patient tasks, not for real-time heavy reasoning. That’s exactly why heavier work either waits for the GPU farm (week 7) or escalates server-side to a vendor within a strict budget, then falls back to local — the tiered-orchestrator pattern. Anything autonomous that touches the A.I. must carry the three brakes (a budget ceiling, a single-instance lock, and a kill-switch), because an unbraked timer-driven loop is exactly what once ran away. The class’s own posture holds: the A.I. is a tested tool, not a source of truth (1 Thess 5:21); wisdom is from God (Prov 2:6).',
    },
    quiz: {
      questions: [
        { q: 'Why run A.I. on our own NAS instead of a vendor cloud?', options: ['It’s the fastest possible', 'So the family’s + church’s words/content stay sovereign and aren’t sent to a stranger', 'So we never have to test it'], answer: 1, explain: 'Local-first means our content never leaves for a vendor — the sovereignty principle, applied to A.I.' },
        { q: 'Why does the NAS run only smaller models?', options: ['It’s broken', 'It’s CPU-only — fine for small models; big ones need a GPU (week 7) or escalate within a budget', 'Small models are always better'], answer: 1, explain: 'CPU-only caps it around ≤13B; heavy work waits for the GPU farm or escalates server-side, then falls back local.' },
        { q: 'What must any autonomous A.I. automation carry?', options: ['Nothing', 'The three brakes: a budget, a single-instance lock, and a kill-switch', 'Just a nice name'], answer: 1, explain: 'An unbraked timer-driven loop is what once ran away — three brakes are mandatory.' },
      ],
    },
    lesson: 'This is the week the sovereignty principle becomes real for A.I. specifically: we run language models on OUR own hardware, so the family’s and the church’s words are never shipped off to a vendor’s cloud to be processed. The tool that does this on the NAS is Ollama, and it serves open-weights models — Llama, Qwen, Mistral, and the like — that anyone can run. But we have to be honest about the ceiling. The NAS is CPU-only (no GPU, by design), so it comfortably runs SMALLER models — roughly up to the 13-billion-parameter range, larger only with heavy compression — and it runs them at CPU speed. That’s genuinely useful for classifiers, small helpers, and patient tasks, but it’s not built for fast, heavy reasoning. So heavier work either waits for the dedicated GPU box we’ll meet in week 7, or it escalates server-side to a vendor model within a strict budget and then falls back to local — the "tiered orchestrator" pattern. And there’s a hard safety rule that comes from real experience: anything autonomous that touches the A.I. — any timer or loop that can spawn more work — must carry three brakes: a budget ceiling that stops a runaway, a single-instance lock so a new run never stacks on a stuck one, and a kill-switch that pauses on overrun. An unbraked loop is exactly what once ran away and had to be shut down by hand. Through all of it, the posture from our A.I. class holds: the model is a tool to be tested, not trusted blindly — "test everything, hold fast what is good" (1 Thessalonians 5:21) — and real wisdom comes from God, not the machine (Proverbs 2:6).',
    facilitator: {
      talkingPoints: [
        'A.I. runs on OUR NAS (Ollama, open-weights models) — family/church content never goes to a vendor cloud.',
        'Honest ceiling: CPU-only → ~≤13B comfortably, at CPU speed. Great for small/patient jobs, not heavy real-time reasoning.',
        'Heavy work waits for the GPU farm (week 7) or escalates to a vendor within a budget, then falls back local (tiered orchestrator).',
        'THREE BRAKES are mandatory for any autonomous A.I. automation: a budget, a single-instance lock, a kill-switch.',
        'Same posture as the A.I. class: test the tool, don’t trust it blindly (1 Thess 5:21); wisdom is from God (Prov 2:6).',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Thessalonians 5:21 and Proverbs 2:6. | Recap last week (10): a learner explains the VPN tunnel. | Teach the big idea (15): local-first A.I.; Ollama + open models; the CPU-only ceiling; the three brakes. | Hands-on with the hardware (25): open the in-app A.I. health card and read the live loaded model; ask the local tutor a question; verify the answer; confirm it ran locally. | Discussion (15): which jobs fit a small local model, and which must wait for the GPU? | Send-off + solo task (5): solo task — check the A.I. health card once and note which model was loaded.',
      discussionPrompts: [
        'What does it protect to keep our words on our own A.I. instead of a vendor’s?',
        'Where’s the honest line between what the NAS can do and what needs a GPU?',
        'Why are the three brakes non-negotiable for anything that runs on a timer?',
      ],
    },
  },
  {
    id: 'inf7-gpu-vram-farm',
    title: 'Why we’re building a GPU farm — CPU vs GPU and VRAM',
    bigIdea: 'A GPU (a graphics card) has thousands of tiny workers doing the same math at once — exactly what big A.I. needs. The catch is VRAM (the GPU’s own memory): a 70-billion-parameter model needs about 48 GB of it. The NAS has none, so a dedicated GPU box is planned. The church’s video-wall machines (RTX 4070s) are our real GPUs today.',
    inApp: 'Look at the CPU-vs-GPU diagram and the VRAM ladder. Then at the church, look (don’t touch the running machines) at the left + right RTX 4070 machines that drive the wall — those are real GPUs that could also serve A.I. when the wall is idle.',
    anchor: { ref: 'Exodus 35:30–35; Luke 14:28', theme: 'God filled Bezalel with skill to work every craft; and count the cost before you build. Knowing the tools — and sizing them honestly — is a Spirit-given, sober calling.' },
    rpe: {
      research: 'What does a GPU do that a CPU can’t, and how much VRAM does a big model need?',
      plan: 'Decide what hardware would actually hold a 70B model (the farm plan).',
      execute: 'Match the need to the plan: the planned GPU box, and the church’s 4070 wall machines today.',
    },
    hardware: [
      { device: 'The church’s left + right RTX 4070 machines', look: 'See the two machines that drive the video wall — those hold real GPUs.', touch: 'Look only — do not touch a machine that’s running the wall live.', safe: 'These are the church’s only real GPUs today; treat them with care.' },
    ],
    media: [
      { type: 'diagram', key: 'cpu-vs-gpu', title: 'CPU vs GPU', caption: 'A CPU = a few powerful workers. A GPU = thousands of small workers doing the same math at once — what A.I. needs.' },
      { type: 'diagram', key: 'vram-ladder', title: 'The VRAM ladder', caption: 'Small model ≈ runs on the CPU NAS. 70B-class ≈ needs ~48 GB VRAM — why a GPU box is planned (and unbought today).' },
    ],
    levels: {
      child: 'A CPU is like a few really smart workers who do one big job at a time. A GPU — a graphics card, the kind in game computers — is like THOUSANDS of little workers all doing the same small math at the same time. Big A.I. needs thousands of workers, so it loves GPUs! But a GPU needs its own special memory called VRAM, and the really big A.I. brains need a LOT of it — more than we have today. So we’re planning to get a special GPU computer. At church, the two machines that run the giant screen already have game cards inside — those are our real GPUs right now.',
      senior: 'The binding constraint is VRAM. A GPU’s thousands of parallel cores are exactly what model inference needs, but the model’s weights have to FIT in the card’s memory: a 70B-class model at Q4 needs roughly 48 GB of VRAM, and the frontier MoE wave wants the 72–96 GB lane. The honest state of the mesh today: effectively zero always-on CUDA. The NAS is CPU-only; the one documented 4070 (12 GB) is a creative box that is absolutely preempted by creative work by decision, so it can’t be a reliable concurrent business host; the church node and the dedicated farm are planned but unbought. The standing plan (DR-0014) is a PoeTech farm — dual used RTX 3090 = 48 GB, chassis sized for a third card → 72 GB — at roughly $5k, plus a separate ≥$5k sovereign church node. The cost is justified by sovereignty + 70B capability + data control + the multi-purpose farm role, NOT by beating a small API bill — stated plainly so we build soberly (Luke 14:28). The church’s left + right RTX 4070 machines that drive the video wall are the real GPUs we have today, and a candidate for local A.I. when the wall is idle.',
    },
    quiz: {
      questions: [
        { q: 'Why is a GPU good for A.I. when a CPU struggles?', options: ['It’s just newer', 'A GPU has thousands of cores doing the same math at once — exactly what A.I. inference needs', 'CPUs can’t do math'], answer: 1, explain: 'Massive parallelism (thousands of cores) is what model math wants; the CPU has only a few cores.' },
        { q: 'What is the binding constraint for running a big model?', options: ['The color of the box', 'VRAM — the GPU’s own memory; a 70B model needs ~48 GB to fit', 'The number of cables'], answer: 1, explain: 'The weights must fit in VRAM; ~48 GB for 70B-class is why a multi-GPU box is planned.' },
        { q: 'What is the honest state of our GPU power TODAY?', options: ['We have a huge farm running', 'Effectively zero always-on CUDA — the farm is planned/unbought; the church 4070s are our real GPUs', 'The NAS has a great GPU'], answer: 1, explain: 'No fabrication: the farm is planned (DR-0014); the church wall machines are the real GPUs we have now.' },
      ],
    },
    lesson: 'To understand why we’d spend real money on more hardware, you have to understand the difference between two chips and the one number that gates everything. A CPU has a few powerful cores and is brilliant at doing one complicated job at a time — perfect for running the operating system and our services. A GPU (a graphics card, the kind in gaming PCs) has THOUSANDS of small cores all doing the same kind of math at the same instant — and that massive parallelism is exactly what running an A.I. model needs. But there’s a catch, and it’s the whole story: the model’s "weights" have to FIT inside the GPU’s own memory, called VRAM. A small model fits in a little; a 70-billion-parameter model at common compression needs roughly 48 GB of VRAM to hold. Now the honest picture of what we actually have today — and this is the kind of truth this course refuses to paint over: the mesh has effectively zero always-on GPU power right now. The NAS is CPU-only; the one capable graphics card we own is a creative-work machine that, by decision, always yields to creative production, so it can’t be a dependable shared A.I. host; and the dedicated GPU box is planned but not yet bought. The standing plan (DR-0014) is to build a PoeTech "farm" — two used RTX 3090s giving 48 GB of VRAM, in a chassis sized to add a third card for 72 GB — at around $5,000, plus a separate sovereign church node. We say plainly that this is justified by sovereignty, 70B-class capability, and data control — not by beating a small monthly API bill — so we count the cost soberly, exactly as Luke 14:28 instructs. The real GPUs we have at this moment are the two RTX 4070 machines at the church that drive the video wall; when that wall is idle, they’re our best candidate for local A.I. God filled Bezalel with skill to work every craft (Exodus 35) — knowing your tools, and sizing them honestly, is part of that calling.',
    facilitator: {
      talkingPoints: [
        'CPU = a few powerful cores (one hard job at a time). GPU = thousands of small cores doing the same math at once — what A.I. needs.',
        'VRAM is the binding constraint: a 70B-class model needs ~48 GB of the GPU’s own memory to fit.',
        'HONEST today: effectively zero always-on CUDA — NAS is CPU-only, the 4070 creative box is preempted, the farm is planned/unbought.',
        'The plan (DR-0014): dual RTX 3090 = 48 GB (→72 GB lane) ~$5k + a separate sovereign church node. Justified by sovereignty, not a small API bill.',
        'The church’s left + right RTX 4070 wall machines are our REAL GPUs today — a candidate for A.I. when the wall is idle. Exodus 35 / Luke 14:28.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Exodus 35:30–35 and Luke 14:28. | Recap last week (10): a learner explains why the NAS runs only small models. | Teach the big idea (15): CPU vs GPU; VRAM as the constraint; the honest "zero CUDA today" picture; the farm plan. | Hands-on with the hardware (25): study the CPU-vs-GPU + VRAM-ladder diagrams; at church, LOOK at the left/right 4070 machines driving the wall (don’t touch them live). | Discussion (15): is the farm worth ~$5k — and on what grounds (not the API bill)? | Send-off + solo task (5): solo task — explain VRAM to someone in one sentence.',
      discussionPrompts: [
        'In one sentence: why does A.I. love GPUs and only tolerate CPUs?',
        'Why is VRAM — not raw speed — the thing that decides which models we can run?',
        'On what honest grounds is the farm justified, if not a cheaper API bill?',
      ],
    },
  },
  {
    id: 'inf8-church-stack',
    title: 'The house of God — COLG’s sovereign stack',
    bigIdea: 'The Church of the Living God built a 44,000 sq ft house, serves the largest African American community in Champaign-Urbana, and couldn’t find tech support — so we build it ourselves. The church stack mirrors the home stack: a sovereign NAS, the LED video wall + 4070 machines, and the broadcast — all serving the first community.',
    inApp: 'At the church, walk the real stack: the NAS (or where it will live), the booth and the broadcast chain (ties to The Broadcast course), the LED video wall and its left/right machines, and the network. Match what you see to the home stack you already know.',
    anchor: { ref: '1 Chronicles 28:20; Psalm 127:1', theme: 'Be strong and do the work; do not be afraid — God is with you until it is finished. Unless the Lord builds the house, the builders labor in vain. We build the house for Him.' },
    rpe: {
      research: 'What does the church already have, and what does it still need to be sovereign?',
      plan: 'Decide which home-stack pattern each church need maps to.',
      execute: 'Walk the church stack; note what exists vs what the build team still has to stand up.',
    },
    hardware: [
      { device: 'The church NAS / booth / video wall', look: 'Walk the building: find the NAS spot, the booth, the wall, the cameras.', touch: 'Look and learn; only touch what a leader says is safe.', safe: 'The church gear serves live worship — treat it with extra care.' },
    ],
    media: [
      { type: 'clip', title: 'POV: the COLG NAS build (founding)', sopId: 'inf-sop-church-nas-build', caption: 'First-person of the sovereign church-NAS build (pending capture).' },
      { type: 'clip', title: 'POV: the video-wall machines', sopId: 'inf-sop-videowall-machines', caption: 'First-person bring-up of the left/right 4070 wall machines (pending capture).' },
    ],
    levels: {
      child: 'Our church is HUGE — 44,000 square feet — and the people built it together. But they couldn’t find anyone to help with the computers, so WE help. The church gets the same kind of stack as home: its own NAS to keep things safe, a giant LED screen run by two game-card computers, and the broadcast that sends the service to people at home. It’s the same ideas you already learned — just at the church. When you visit, walk around and find each part. This is how we serve our church family.',
      senior: 'COLG is the named FIRST community (COMMUNITY-FIRST-MISSION): a 44,000 sq ft house the congregation built, the largest African American community in Champaign-Urbana, staffed largely by elderly members for whom technology isn’t a first language — and historically unable to get support from the broader tech industry. The church stack is the home pattern carried over: a sovereign NAS (the build is in progress; the church node is part of the DR-0014 envelope, with an encrypted ISO-2 backup relationship to the home stack), the Sanctuary LED video wall driven by the left + right RTX 4070 machines, the broadcast chain (the subject of The Broadcast course — camera → OBS → encode → stream), and surveillance/business systems as they land. Member and financial data stays staff-gated behind the isolation walls. The whole point is that the Church module generalizes from COLG’s real needs to any church in a similar situation — so what we build here becomes a repeatable gift, not a one-off.',
    },
    quiz: {
      questions: [
        { q: 'Why does PoeTech build the church’s stack itself?', options: ['For fun', 'COLG is the first community we serve and couldn’t get tech support — so we build it sovereign for them', 'To sell their data'], answer: 1, explain: 'COMMUNITY-FIRST: COLG is the named first community; we fill the support gap the industry left.' },
        { q: 'How does the church stack relate to the home stack?', options: ['Totally different', 'It mirrors it — a sovereign NAS, the video wall + 4070 machines, the broadcast — same patterns at the church', 'It has no NAS'], answer: 1, explain: 'Same patterns, carried to COLG — which is how the build becomes repeatable for other churches.' },
      ],
    },
    lesson: 'Everything in this course points here, because this is who it’s for. The Church of the Living God is a 44,000-square-foot house that the congregation pulled together to build; it serves the largest African American community in Champaign-Urbana; and its full-time support staff are largely elderly members for whom technology was never a first love. For years the church couldn’t get real technology support from the broader industry — and that gap is exactly why PoeTech exists and why COLG is the named first community we serve. The church stack is the home stack you’ve already learned, carried across the parking lot. It needs its own sovereign NAS — that build is in progress, part of the same hardware plan as the GPU farm, with an encrypted offsite backup relationship to the home box so each protects the other without reading the other’s data. It has the Sanctuary LED video wall, driven by the left and right RTX 4070 machines you met last week. It has the broadcast chain — camera to OBS to encode to stream — which is the whole subject of The Broadcast course, so the two courses meet here. And it will grow surveillance and business systems as they land, with member and financial data always staff-gated behind the isolation walls. The deepest reason we document all of it is that the Church module is meant to GENERALIZE: what we build for COLG becomes a repeatable gift for any church in the same situation. As David told Solomon, "be strong and do the work… God is with you until it is finished" (1 Chronicles 28:20) — and unless the Lord builds the house, the builders labor in vain (Psalm 127:1). We build the house for Him.',
    facilitator: {
      talkingPoints: [
        'COLG = the named FIRST community: 44,000 sq ft built by the congregation, largest African American community in C-U, elderly staff, no industry support — so we build it.',
        'The church stack mirrors the home stack: sovereign NAS (build in progress) + LED video wall + the 4070 machines + the broadcast chain.',
        'Encrypted ISO-2 backup relationship between church and home — each protects the other without reading the other’s data.',
        'It’s built to GENERALIZE: what we build for COLG becomes a repeatable gift for other churches in the same situation.',
        '1 Chron 28:20 / Psalm 127:1 — be strong and do the work; unless the Lord builds the house, the builders labor in vain.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Chronicles 28:20 and Psalm 127:1. | Recap last week (10): a learner explains CPU vs GPU + VRAM. | Teach the big idea (15): COLG’s story + need; the church stack as the home pattern; how it generalizes. | Hands-on with the hardware (25): walk the church — find the NAS spot, the booth + broadcast chain, the video wall + 4070 machines, the network; map each to its home-stack twin. | Discussion (15): what does our church need most next, and which home-stack pattern covers it? | Send-off + solo task (5): solo task — name one thing we can build for COLG that another church could reuse.',
      discussionPrompts: [
        'Why is it right that COLG is the FIRST community we serve?',
        'Which part of the church stack maps to which part of the home stack?',
        'How does building it sovereign for COLG become a gift for other churches?',
      ],
    },
  },
  {
    id: 'inf9-keeping-it-alive',
    title: 'Keeping it alive — health, alerts, and the three brakes',
    bigIdea: 'Owning the iron means keeping it healthy. The system watches itself: health checks on every workflow, push alerts (ntfy) so it tells YOU when something’s wrong, and the in-app health cards that read live. And any automation that runs on a timer carries three brakes so it can never run away.',
    inApp: 'Open the in-app Infrastructure inventory and the A.I. health card — read the live state (storage, model, what’s stale). On a phone, see what an ntfy push looks like. Find one thing the system would flag and explain how you’d know.',
    anchor: { ref: 'Luke 12:42; Nehemiah 4:9', theme: 'Who then is the faithful and wise manager? They prayed and set a watch day and night. Watchfulness — a watch that never sleeps — is faithful stewardship.' },
    rpe: {
      research: 'How does the system tell us it’s healthy or sick today?',
      plan: 'Decide what "healthy" looks like and what should raise an alert.',
      execute: 'Read the live health cards; trace how an alert reaches a phone; confirm the brakes are in place.',
    },
    hardware: [
      { device: 'A phone with ntfy + the in-app health cards', look: 'See the live Infrastructure + A.I. health cards; see an ntfy push.', touch: 'Tap a card to read the live numbers; tap a push to open it.', safe: 'No risk — this is reading, not changing.' },
    ],
    media: [
      { type: 'clip', title: 'POV: reading the health cards + an alert', sopId: 'inf-sop-backup-verify', caption: 'First-person of the live health read + a push alert (pending capture).' },
    ],
    levels: {
      child: 'When you own something, you take care of it — so our system checks on ITSELF. It has little health checks, like a nurse taking its temperature, and when something’s wrong it sends a message to a phone (that’s ntfy) so we KNOW right away. We can also open cards in the app that show how the boxes are doing, live. And here’s a big safety rule: anything that runs by itself on a timer has three "brakes" so it can NEVER go wild — a budget, a lock so it only runs once at a time, and an off-switch.',
      senior: 'This is the perpetual-pipeline-health discipline. Resilience isn’t a feeling; it’s built: a health check per workflow, try-catch around every external I/O, idempotent design, a standard error envelope, daily backups, and monitoring. The system is built to TELL you — every meaningful transition pushes to the self-hosted ntfy server on the NAS (a failed trigger pushes at high priority), so a problem surfaces instead of hiding. And the live state is observable in-app: the Infrastructure inventory and LLM-health cards read real probes (DSM, the UniFi controller, tailscale status, Ollama /api/ps) and honestly show "not connected" or "stale" rather than painting a number. The hard-won safety law: ANY autonomous, timer-driven, or self-triggering automation ships with all three brakes — a budget ceiling per run, a single-instance concurrency lock, and a dead-man’s-switch/kill-switch — and ships INACTIVE, turned on only with someone watching. That law exists because an unbraked fleet once ran away unattended and had to be killed by hand.',
    },
    quiz: {
      questions: [
        { q: 'How does the system tell us something is wrong?', options: ['It hides it', 'It pushes an alert (ntfy) to a phone and shows live health cards in the app', 'We just hope'], answer: 1, explain: 'The system is built to TELL you — push alerts + live, honest health cards.' },
        { q: 'What are the three brakes every timer-driven automation must have?', options: ['Red, yellow, green', 'A budget ceiling, a single-instance lock, and a kill-switch', 'Three backups'], answer: 1, explain: 'Budget + lock + kill-switch — because an unbraked loop once ran away and had to be killed by hand.' },
      ],
    },
    lesson: 'Owning the iron means you also own keeping it alive — and the mature way to do that is to make the system watch itself and TELL you, rather than relying on someone to go looking. That’s the perpetual-pipeline-health discipline, and it’s concrete: every workflow has a health check; every call out to something external is wrapped so a failure is caught, not silent; jobs are written to be safely re-runnable; backups run daily; and the whole thing is monitored. Crucially, the system pushes alerts to a phone through ntfy — our own notifier running on the NAS — so when something breaks (or even when a build moves), it surfaces immediately, and a failed alert is pushed at high priority so it can’t be missed. You can also just look: the in-app Infrastructure inventory and the A.I. health card read real probes off the live system — the NAS, the network controller, the VPN status, the local model — and they honestly say "not connected" or "stale" instead of inventing a comforting number. Finally, the hardest-won rule in this whole course, paid for by a real incident: any automation that runs on its own — on a timer, or anything that can spawn more work — must carry three brakes. A budget ceiling, so a runaway stops itself. A single-instance lock, so a new run never piles on top of a stuck one. And a kill-switch, so it pauses on overrun instead of charging ahead. And it ships turned OFF, switched on only with someone watching. We learned that because an unbraked fleet once ran away unattended and had to be shut down by hand. "Who then is the faithful and wise manager?" (Luke 12:42) — the one who keeps a watch day and night (Nehemiah 4:9).',
    facilitator: {
      talkingPoints: [
        'Keeping it alive is part of owning it: a health check per workflow, try-catch on external I/O, idempotent jobs, daily backups, monitoring.',
        'The system TELLS you: ntfy push alerts from the NAS (failed triggers go high-priority) so problems surface instead of hiding.',
        'Live + honest: the in-app Infrastructure inventory + A.I. health cards read real probes and say "not connected/stale" rather than paint a number.',
        'THE THREE BRAKES (paid for by a real runaway): a budget ceiling, a single-instance lock, a kill-switch — and ship it INACTIVE.',
        'Luke 12:42 / Nehemiah 4:9 — the faithful manager keeps a watch day and night.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 12:42 and Nehemiah 4:9. | Recap last week (10): a learner maps a church part to its home twin. | Teach the big idea (15): self-watching system; ntfy alerts; live health cards; the three brakes + the incident behind them. | Hands-on with the hardware (25): open the Infrastructure inventory + A.I. health cards and read live state; see an ntfy push on a phone; name one thing the system would flag. | Discussion (15): what should ALWAYS raise an alert, and who should it reach? | Send-off + solo task (5): solo task — watch for one ntfy alert this week and note what it told you.',
      discussionPrompts: [
        'Why is "the system tells you" better than "someone remembers to check"?',
        'Which live number, if it went red, would matter most — and why?',
        'Why does every timer-driven automation need all three brakes, not just one?',
      ],
    },
  },
  {
    id: 'inf10-build-right-raise-builders',
    title: 'Build it right — and raise the next builders',
    bigIdea: 'Sovereignty is stewardship: we build to a high standard because the family and the church depend on it, and we hand it on. You truly own a part of the stack when you can teach it. Founders raise founders — and the media team builds and runs BOTH infrastructures.',
    inApp: 'Pick one part of the stack you now understand. Write its simple checklist (or record a POV SOP). Then explain it to one other person — your name goes on the helper list for the next cohort.',
    anchor: { ref: '2 Timothy 2:2; Colossians 3:23', theme: 'Entrust what you’ve learned to faithful people who can teach others; whatever you do, work heartily as for the Lord. The work is handed on, and it’s done for Him.' },
    rpe: {
      research: 'Which part of the stack do you understand well enough to teach?',
      plan: 'Outline its simple checklist — the steps a newcomer would need.',
      execute: 'Teach it to one person (or record a POV SOP); put your name forward to help the next cohort.',
    },
    hardware: [
      { device: 'Any device you’ve learned', look: 'Choose the box you understand best.', touch: 'Show someone else where things are on it.', safe: 'Teach the safety rules you learned, too.' },
    ],
    media: [
      { type: 'clip', title: 'POV: capture your own build sequence', sopId: 'inf-sop-nas-powerup', caption: 'Record your station’s real procedure first-person for the next builder (pending capture).' },
    ],
    levels: {
      child: 'You’ve learned so much — the NAS, the storage, the gateway, the tunnel, the A.I.! Here’s the secret to really owning it: you OWN something when you can TEACH it to someone else. So pick the part you like best, learn to explain it simply, and teach it to one person — a friend, a cousin, a grandparent. That’s how the family and the church get strong: builders raise more builders. You started as someone learning the boxes; now you can help someone else learn them too.',
      senior: 'The commissioning. Sovereignty is stewardship, and a mature build shows two marks. Reliability: excellence isn’t a lucky day, it’s a stack that works every day — which is why we write run-of-show + checklists and capture POV SOPs, so nothing rides on one person’s memory (the same SOP library the broadcast team uses). Multiplication: you own a part of the stack when you can TEACH it — 2 Timothy 2:2, entrust what you’ve learned to faithful people who can teach others. This is also where the media team’s role is named honestly: the same team that builds and runs the broadcast builds and runs BOTH infrastructures, home and church — capturing sequences, teaching the next operators, keeping the iron alive. We do it as for the Lord, not for men (Colossians 3:23). Founders raise founders; the stack outlasts any one of us.',
    },
    quiz: {
      questions: [
        { q: 'How do you prove you truly own a part of the stack?', options: ['By being the only one who can touch it', 'By being able to teach it simply to someone else', 'By finishing fastest'], answer: 1, explain: 'Mastery shows in teaching it — 2 Timothy 2:2. Founders raise founders.' },
        { q: 'What are the two marks of a mature build?', options: ['Speed and noise', 'Reliability (works every day, documented) and multiplication (you can teach it)', 'Cost and color'], answer: 1, explain: 'Reliability + multiplication — write it down so nothing rides on one memory, and teach it forward.' },
      ],
    },
    lesson: 'This is the commissioning, and it ties the whole course together under one word: stewardship. We build the infrastructure to a high standard not to impress anyone, but because the family and the church genuinely depend on it — and a steward’s job is to be found faithful with what they’ve been given. Two marks separate a mature build from a lucky one. The first is reliability: excellence isn’t one good day, it’s a stack that works every single day, which is why we write down run-of-show and checklists and capture POV SOPs so nothing rides on one person’s memory — the very same SOP library the broadcast team uses. The second is multiplication: the proof that you truly own a part of the stack is that you can teach it. That’s why this course, like its sisters, ends by sending you to teach: pick the part you understand best, write its simple checklist or record your sequence, and explain it to one other person. This is also where the media team’s real, expanded role is named plainly: the same team that builds and runs the broadcast builds and runs BOTH infrastructures — the home stack and the church stack — capturing the sequences, teaching the next operators, and keeping the iron alive. Paul told Timothy to entrust what he’d learned "to faithful people who will be able to teach others also" (2 Timothy 2:2), and we do all of it heartily, as for the Lord and not for men (Colossians 3:23). Founders raise founders; the stack — and the calling under it — outlasts any one of us.',
    facilitator: {
      talkingPoints: [
        'Sovereignty is stewardship: we build to a high standard because the family + church depend on it, and we hand it on.',
        'Two marks of a mature build: reliability (works every day, documented) and multiplication (you can teach it).',
        'Write checklists + capture POV SOPs (the same library the broadcast team uses) so nothing rides on one person’s memory.',
        'Name the media team’s expanded role: the team that runs the broadcast builds + runs BOTH infrastructures, home and church.',
        '2 Timothy 2:2 / Colossians 3:23 — entrust it to faithful people; work as for the Lord. Founders raise founders.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 2 Timothy 2:2 and Colossians 3:23. | Recap last week (10): a learner explains the three brakes. | Teach the big idea (15): stewardship; reliability + multiplication; the media team’s expanded role across both stacks. | Hands-on with the hardware (25): each learner picks one part of the stack, writes its checklist or records a POV SOP, and teaches it to one other person. | Discussion (15): which part will you own and teach, and who will you teach it to? | Send-off + solo task (5): commission them — teach your part to one person and put your name on the next-cohort helper list.',
      discussionPrompts: [
        'Which part of the stack do you understand well enough to teach simply?',
        'What’s the difference between a stack that works once and one that works every day?',
        'What does it mean that the broadcast team also builds and runs the infrastructure?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this course behaves identically to the other two.
// ---------------------------------------------------------------------------
import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';
import { INFRA_SOP_SEQUENCES, SOP_CAPTURE_PIPELINE, sopLibraryMarkdown } from './infrastructure-sops.js';

// Distinct interest + helper tags so the Governor's roster tells infra sign-ups apart.
export const INFRA_INTEREST_TAG = '[Infrastructure class interest]';
export const INFRA_HELPER_TAG = '[Infrastructure class helper]';

// Re-export the SOP library so the host wires ONE import for the whole course.
export { INFRA_SOP_SEQUENCES, SOP_CAPTURE_PIPELINE };

export function resolveInfraCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, INFRA_CONFIRMED_COHORT, INFRA_PROPOSED_COHORT_START);
}

export function buildInfraSchedule(startISO) {
  return buildScheduleFor(INFRA_MODULES, startISO, INFRA_META.cadenceDays);
}

export function infraProgressSummary(progress = {}) {
  return progressSummaryFor(INFRA_MODULES, progress);
}

export function exportInfraCurriculumMarkdown(startISO = null) {
  const curriculum = exportCurriculumMarkdownFor(
    { meta: INFRA_META, sessionFlow: INFRA_SESSION_FLOW, modules: INFRA_MODULES },
    startISO,
  );
  const footer = INFRA_META.footer;
  const sop = sopLibraryMarkdown(INFRA_SOP_SEQUENCES, SOP_CAPTURE_PIPELINE);
  if (curriculum.includes(footer)) {
    return curriculum.replace(footer, `${sop}\n\n---\n\n${footer}`);
  }
  return `${curriculum}\n${sop}\n`;
}

// The tutor course-meta this class passes to askTutor so the per-week solo guide
// introduces itself as the infrastructure course — keeping the test-and-verify
// discipline and the steward's posture, age-aware in tone.
export const INFRA_TUTOR_META = {
  title: INFRA_META.title,
  intro: 'You are a patient, encouraging tutor for a church + family infrastructure course called "The Infrastructure: How We Build It Sovereign."',
  posture: 'Guide ONE learner — who may be a child (like Christian, 10), a teen, an adult, or a senior founding member — to understand the REAL hardware in front of them: the NAS, storage/RAID, the network gateway, remote access, the local A.I., GPUs/VRAM, and the church stack. Match your pace and words to their age: short, vivid, and hands-on for a child; deeper and edge-case-aware for an adult or senior. Explain real distinctions plainly (a NAS is not a GPU; RAID is not a backup); never hand-wave, and remind them to TEST what any A.I. tells them.',
};
