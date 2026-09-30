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
      child: "Own the iron. That is what sovereign infrastructure means. Sovereign is a big word. Here it means we own it. The iron is the machines. These boxes are OUR computers. They sit in our house and in our church. They are not on a stranger's computer far away.\n\nWhy does that matter? Our family's pictures live on these boxes. Our church's sermons live here too. Since we own the boxes, no one can sell our things. No one can lock them up or turn them off on us.\n\nOwning comes with a job. We have to take care of the boxes. We make copies. We keep them fixed. We keep them running. That is why we learn it together and write it down.\n\nThe Bible says Yahweh put the man in the garden \"to dress it and to keep it\" (Genesis 2:15). We keep our machines the same way. Your job this week: find the boxes, point to each one, and learn its name. Look first. Touch gently.",
      youth: "Own the iron: that is what \"sovereign infrastructure\" means. The machines that hold our data, run our automation and run our A.I. are machines we OWN and govern. They sit in our house and in our church, instead of in rented space on a giant company's computers far away.\n\nThat choice is the base of everything PoeTech stands for. When you own the iron, your family's photos and your church's sermons cannot be quietly sold, mined or held hostage. Nobody else can switch the service off.\n\nThere is an honest cost. We carry the work a landlord would carry: backups, updates, keeping it running. That is why this course exists, so the work is shared and written down, not trapped in one person's head.\n\nThe map has two halves that match. The HOME stack has a NAS that stores and runs services, a gateway that guards the network, our own A.I., and a safe way in from the road. The CHURCH stack carries the same pattern to the first community we serve. The Word says \"it is required in stewards, that a man be found faithful\" (1 Corinthians 4:2). We own the iron as stewards, so it lifts the family and the church and never takes from them.",
      teen: "Own the iron: this is what \"sovereign infrastructure\" means. The machines that run our data, our automation and our A.I. are machines we own and govern, sitting in our house and our church, rather than space rented on a large company's servers somewhere else.\n\nEverything PoeTech stands for rests on that choice. Owned hardware means the family's photos and the church's sermons cannot be quietly sold, mined for data, or held hostage, and no outside company can switch the service off.\n\nThe trade-off is real, and we say it plainly. We take on the responsibility a landlord would otherwise carry: backups, updates and keeping things running. This course exists so that responsibility is shared and documented instead of living in one person's memory.\n\nThe map has two halves that mirror each other. The home stack, with a NAS that stores and serves, a gateway that walls and guards the network, local A.I. and remote access, proves the pattern at family scale. The church (COLG) stack carries the same pattern to the first community we serve. Yahweh placed the man in the garden \"to dress it and to keep it\" (Genesis 2:15), and \"it is required in stewards, that a man be found faithful\" (1 Corinthians 4:2). We tend the iron as stewards, so it serves people instead of extracting from them.",
      senior: "Own the iron — what sovereign infrastructure means. Sovereignty here is the architecture decision that everything else rests on: compute, storage, network, and A.I. all run on hardware the family and the church OWN and govern, so the data can’t be extracted, the service can’t be revoked, and the bill can’t be turned into a lever. The trade is real — we carry the responsibility a vendor would otherwise carry (backups, updates, uptime) — and the course exists so that responsibility is shared and documented, not held in one head. The map has two halves that mirror each other: the home stack proves the pattern; the church stack carries it to the first community we serve. The anchor texts set the posture: the man was placed in the garden to dress it and to keep it (Genesis 2:15), and stewards are required to be found faithful (1 Corinthians 4:2). Ownership here is stewardship, not extraction.",
    },
    quiz: {
      questions: [
        { q: 'What does "sovereign infrastructure" mean here?', options: ['Renting the biggest cloud', 'We own the machines our data + A.I. run on, so it serves us and can’t be extracted', 'Using only free apps'], answer: 1, explain: 'Owning the iron is what keeps the data ours and the service un-revocable — the whole point.' },
        { q: 'Why own it instead of renting?', options: ['It’s always cheaper', 'So the data can’t be sold or held hostage, and the service can’t be revoked', 'So we never need backups'], answer: 1, explain: 'Sovereignty is about control + stewardship, not always about being cheapest.' },
      ],
    },
    benefits: [
      'You leave able to define the word without hand-waving: the machines running our data, our automation and our A.I. are machines we own and govern, sitting in our house and our church, instead of rented space on a stranger’s computers.',
      'You know what owning the iron actually buys — the family’s photos and the church’s sermons cannot be quietly sold, mined or held hostage, and nobody else can switch the service off.',
      'You can state the honest cost in the same breath, which is what makes the claim trustworthy: we carry the backups, the updates and the keeping-it-running that a landlord would otherwise carry. That is precisely why the work gets written down instead of trapped in one head.',
      'You see the two halves rhyme — the HOME stack proving the pattern at family scale, and the CHURCH stack carrying the same pattern to the first community we serve.',
      'You hold the posture the whole course rests on: Yahweh "put him into the garden of Eden to dress it and to keep it" (Genesis 2:15), and "it is required in stewards, that a man be found faithful" (1 Corinthians 4:2). We tend the iron as stewards, so it lifts the family and the community and never extracts from them.',
      'Carry it out this session: stand in front of the real stack, point to the NAS, the gateway and the screens, then match each real box to its live card in the in-app inventory.',
    ],
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
      child: "The brain and the barn: that is the Synology NAS. The NAS is one special box, and it does two jobs.\n\nJob one: it is a BARN. A barn keeps things safe. The NAS keeps the family's pictures and files safe. It keeps them on hard drives that sit in little drawers called drive bays.\n\nJob two: it is a BRAIN. It runs the helpers the whole house needs. It runs our own A.I. It sends alerts to a phone when something needs care.\n\nInside is a strong chip. It has careful memory that can catch its own mistakes. But it has no game card on purpose. Its job is to keep things safe, not to run the biggest A.I. That job goes to a different box later.\n\nWe do not guess how full it is. We read the real numbers in the app.\n\nJoseph \"laid up the food in the cities\" before the hard years came (Genesis 41:48). The NAS is our storehouse. Go find it. Count the drawers. Watch the light. Never pull a drawer out.",
      youth: "The brain and the barn: the Synology NAS is the most important box in the home stack, and it does two jobs at once. It is a BARN. It stores the family's data safely across several hard drives held in slots called drive bays. And it is a BRAIN. It runs the services everything else depends on: the automation engine (n8n), our own local A.I. (Ollama), file, chat and photo sharing, and the notifier that sends alerts to a phone (ntfy).\n\nUnder the hood it is a real server. It has an Intel Xeon processor, memory that catches its own errors, several drive bays, a fast cache, and fast network ports. But notice what it does NOT have, on purpose: a graphics card. That makes it great at storing and serving and running small helpers. It is not built for heavy, fast A.I. That is a different machine you will meet in week 7.\n\nOne habit runs through this whole course. We do not memorize the live numbers, like how full the disks are. We read them from the in-app Infrastructure inventory, which traces each number to a real check. Joseph \"laid up the food in the cities\" before the lean years (Genesis 41:48). The NAS is our storehouse.",
      teen: "The brain and the barn: the Synology NAS is the single most important box in the home stack, and the clearest way to understand it is that it does two jobs at once. As the barn, it stores the family's data across several hard drives in drive bays. As the brain, it runs the services the system depends on: the n8n automation engine, our local A.I. through Ollama, file, chat and photo sharing, and the ntfy notifier that pushes alerts.\n\nIt is a genuine server. It has an Intel Xeon processor, error-correcting (ECC) memory that catches its own mistakes, multiple drive bays, an NVMe cache, and two 10-gigabit network ports. What it deliberately lacks is a graphics card. That makes it excellent for storage, serving and small helpers, and intentionally not a machine for fast, heavy A.I., which is the subject of week 7.\n\nThe discipline that runs through the course starts here. The live numbers, such as disk usage and which model is loaded, are never memorized. They are read from the in-app Infrastructure inventory, which traces every value to a real probe, so the number is true rather than painted. Joseph \"laid up the food in the cities\" ahead of the lean years (Genesis 41:48); the NAS is our storehouse, and what we keep safe now protects us later.",
      senior: "The brain and the barn — the Synology NAS. The NAS is the always-on services spine and the data home. Real specs to know it honestly: an Intel Xeon D-1527 — server-grade, ECC-capable, but only 4 cores / 8 threads and several generations old — with ECC memory, multiple drive bays, NVMe cache slots, and dual 10-gigabit networking. It is intentionally CPU-only (no discrete GPU), which makes it an excellent orchestrator and file server and a serviceable host for small local models, but NOT a fast inference rig — a distinction week 7 builds on. It runs the automation (n8n), the local A.I. (Ollama), file/chat/photo services, and the push notifier (ntfy). The live numbers — RAM and storage in use, which model is hot — aren’t memorized; they’re read off the in-app Infrastructure inventory, which traces every value to a real probe. Joseph's storehouses are the frame (Genesis 41:48): what is laid up in good years is what the house lives on in lean ones.",
    },
    quiz: {
      questions: [
        { q: 'What two jobs does the NAS do?', options: ['Only stores files', 'Stores the data (the barn) AND runs services + local A.I. (the brain)', 'Only runs games'], answer: 1, explain: 'One box, two jobs: storage and services. That’s why it’s the heart of the home stack.' },
        { q: 'Why does the NAS have no graphics card?', options: ['They forgot one', 'It’s built to store + serve reliably, not to do fast graphics/A.I. — that’s a different machine', 'Graphics cards are illegal'], answer: 1, explain: 'CPU-only is fine for storage, services, and small models; heavy A.I. needs a GPU (week 7).' },
      ],
    },
    benefits: [
      'You leave able to say the two jobs in one breath: the NAS is a BARN that stores the family’s data across several drive bays, and a BRAIN that runs the services everything depends on — the automation engine, the local A.I., file and photo sharing, the notifier.',
      'You know it is a real server rather than a big external drive: an Intel Xeon processor, error-correcting memory that catches its own mistakes, NVMe cache, two 10-gigabit ports.',
      'You know what it deliberately lacks and why that is a decision, not an oversight. No graphics card means superb at storing, serving and small helpers — and not built for heavy, fast A.I., which is a different machine entirely.',
      'You pick up the discipline that runs through the whole course: we do not memorise live numbers. We read them off the in-app inventory, where every value traces to a real probe, so the number is true rather than painted.',
      'You carry the storehouse picture the box is built on. Joseph "gathered corn as the sand of the sea, very much, until he left numbering" (Genesis 41:49) before the lean years came, and "There is treasure to be desired and oil in the dwelling of the wise" (Proverbs 21:20). What we keep safe now protects us later.',
      'Carry it out this session: find the box, read the status light and the bays, sign in to the dashboard, and read the real System Health rather than anyone’s memory of it.',
    ],
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
      child: "Never lose the family's data. This lesson is about disks, RAID, and backups.\n\nHere is a true thing. Every hard drive will stop working some day. That is not scary. We just plan for it. Our plan has two parts.\n\nPart one is RAID. The NAS writes our data across a few drives at once. If ONE drive breaks, the box keeps working. We put in a new drive, and the box fills it back up.\n\nBut RAID is not a backup. RAID does not help if a file gets deleted. It does not help in a fire.\n\nPart two is a backup. A backup is a whole second copy kept in a different place. We keep a locked copy at the church. No one there can read it.\n\nHere is the rule to remember: 3 copies, on 2 kinds of storage, and 1 far away. And a backup only counts if we test it. We try to get the files back to see that it works.\n\nThe Bible says, \"Be thou diligent to know the state of thy flocks\" (Proverbs 27:23). Count the drawers on the NAS. Never pull one out. Only a grown-up swaps a drive, and carefully.",
      youth: "Never lose the family's data: disks, RAID, and backups. Here is a truth that sounds scary but is just engineering. Every hard drive will fail some day. Wise builders do not pretend it will not. They plan for it, and the plan has two halves that people often mix up.\n\nThe first half is RAID, which means redundancy. The NAS spreads the data across several drives so it keeps running even when ONE drive dies. You replace the dead drive and the set rebuilds itself.\n\nBut RAID is not a backup. It protects against a drive dying. It does not protect against a deleted file, a ransomware attack, a fire or a theft. For those you need the second half: a BACKUP, a separate copy kept somewhere else. The rule is 3-2-1: three copies, on two kinds of storage, with one of them offsite. Our offsite copy is locked (encrypted) and sealed on the church NAS, so neither place can read the other's files.\n\nThe most important habit: a backup you have never restored is only a hope. So we test by really restoring. When a drive fails, check that the backup is current first, swap only the failed drive, and never turn the box off during a rebuild. \"Be thou diligent to know the state of thy flocks\" (Proverbs 27:23).",
      teen: "Never lose the family's data: disks, RAID, and backups are the subject, and the starting truth is simply engineering. Every hard drive eventually fails. Wise builders plan for that, and the plan has two separate halves that people constantly confuse.\n\nThe first half is RAID, which is redundancy. The NAS writes data across several drives in a way that keeps it running when one drive dies; you replace the failed drive and the array rebuilds. RAID keeps the service up. It is not a backup, because it does nothing against a deleted file, ransomware, fire or theft.\n\nThe second half is the backup: a fully independent copy stored somewhere else. The rule of thumb is 3-2-1, meaning three copies, on two kinds of media, with one offsite. Our offsite copy is an encrypted, sealed blob on the church NAS, with isolation walls so neither site can read the other's plain data.\n\nThe single most important habit is testing. A backup that has never been restored is only a hope, so the routine includes a real test restore. And when a drive does fail, the swap is the highest-stakes routine on the box: confirm the backup is current, replace only the failed drive, and never power-cycle during a rebuild. \"Be thou diligent to know the state of thy flocks\" (Proverbs 27:23). Knowing what you hold and protecting it is wisdom, not fear.",
      senior: "Never lose the family's data — disks, RAID, and backups. Two different protections that people constantly confuse, kept distinct: RAID is REDUNDANCY (uptime/fault-tolerance), not a backup — it lets the array survive a drive failure so service continues, but it does nothing against deletion, ransomware, fire, or theft. A BACKUP is an independent copy, ideally following 3-2-1: three copies, on two media types, one offsite. Our offsite leg is an ENCRYPTED, sealed blob on the church NAS — the isolation walls hold both directions, so neither site can read the other’s plaintext. The discipline that matters most: a backup you have never restored is a hope, not a backup — so the routine includes a periodic test restore (the SOP captures it). When a drive does fail, the swap-and-rebuild is the highest-stakes routine on the box; verify the backup is current BEFORE starting, and never power-cycle mid-rebuild. Proverbs 27:23 names the posture and Luke 14:28 the method: be diligent to know the state of what you hold, and count the cost before it is needed, not after.",
    },
    quiz: {
      questions: [
        { q: 'Is RAID the same as a backup?', options: ['Yes, identical', 'No — RAID survives a drive dying (uptime); a backup is a separate copy against deletion/fire/theft', 'RAID replaces backups'], answer: 1, explain: 'RAID = redundancy, not a backup. You need BOTH. RAID won’t save you from a deleted file or a fire.' },
        { q: 'What is the 3-2-1 backup rule?', options: ['3 passwords, 2 logins, 1 phone', '3 copies, on 2 kinds of media, 1 of them offsite', '3 drives in one box'], answer: 1, explain: '3 copies, 2 media, 1 offsite — ours is an encrypted sealed copy at the church.' },
      ],
    },
    benefits: [
      'You leave with a fact stated plainly instead of avoided: every hard drive will fail eventually. Wise builders plan for it rather than hoping around it.',
      'You stop mixing up the two halves everyone mixes up. RAID is redundancy — the array keeps running when one drive dies and rebuilds when you replace it. A BACKUP is an independent copy somewhere else.',
      'You know exactly what RAID does NOT protect you from, which is most of what actually happens: a deleted file, ransomware, a fire, a theft.',
      'You carry 3-2-1 as a rule you can check tonight — three copies, two kinds of media, one offsite — and you know where ours is: an encrypted, sealed blob on the church NAS, with isolation walls so neither site can read the other’s plaintext.',
      'You hold the habit that separates a real backup from a hope: a backup you have never restored is only a hope, so the routine includes a real test restore.',
      'Carry it out this session: count the bays, find how the drives are grouped, locate the backup job, and confirm the offsite copy exists. "Be thou diligent to know the state of thy flocks, and look well to thy herds" (Proverbs 27:23) — and when a drive does fail, confirm the backup is current first, swap only the failed drive, and never power-cycle during a rebuild.',
    ],
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
      child: "Walls and gates: this lesson is about the UniFi gateway. If the NAS is the brain and the barn, the gateway is the front door. It is also the walls between the rooms.\n\nAs the door, it joins our home to the internet. It lets good things in. It keeps bad things out.\n\nAs the walls, it splits our network into rooms. The family has a room. The church has a room. The clinic has a room, and its health papers must stay private. The rentals have a room. PoeTech has a room. Each one is walled off from the others. No one can wander into a room that is not theirs.\n\nOur gateway can do more. It can let a helper in through a safe tunnel, without letting him into the family's room. It gives our helpers easy names. It gives each person one login that fits their job.\n\nNehemiah built the wall and \"set a watch against them day and night\" (Nehemiah 4:9). Walls and a watch keep a city safe. Go find the gateway. Trace a cable with your finger. Do not unplug it!",
      youth: "Walls and gates: the UniFi gateway is the front door and the inside walls, both at once. As the door, it connects the whole stack to the internet and stands guard. It routes traffic and blocks what should not come in. That blocking is called a firewall.\n\nAs the walls, it splits one network into separate rooms called VLANs. This matters a lot, because the NAS serves very different groups from one box: the family, the church (COLG), the clinic (TLC, which has health-privacy rules), Poe Properties (the rentals), and one day PoeTech's own customers. Without walls they would all share one open network. With a VLAN for each purpose, each group is walled off from the rest. That is also how the clinic's data stays private, just as policy requires.\n\nOur gateway is a Ubiquiti UCG-Max, and it has more tools. It has a built-in WireGuard VPN, a way to let a contractor or tenant in without putting them on the family's network. It gives our services friendly names instead of bare numbers. And it gives each person one login matched to their role.\n\nNehemiah rebuilt the wall and \"set a watch against them day and night\" (Nehemiah 4:9). And a wall you cannot explain is a wall you cannot trust, so every room gets written down.",
      teen: "Walls and gates: the UniFi gateway does two jobs at once. If the NAS is the brain and the barn, the gateway is the front door and the interior walls. As the door, it connects the stack to the internet and forms the perimeter, routing traffic and firewalling out what should not come in.\n\nAs the walls, it divides one physical network into several separate rooms called VLANs. That matters because the NAS serves very different groups from a single box: the family, the church (COLG), the clinic (TLC, which carries health-privacy rules), Poe Properties, and eventually PoeTech's own customers. Without segmentation they would share one open network. With a VLAN per purpose, each is walled off from the others, which is also how clinical data stays isolated exactly as policy requires.\n\nOur gateway is a Ubiquiti UCG-Max, and it carries a few more sovereign tools. A built-in WireGuard VPN lets a contractor or tenant in without placing them on the family's private network. An internal reverse proxy and DNS let our services answer to friendly names instead of bare numbers. A RADIUS server gives each person one set of credentials matched to their role.\n\nNehemiah called the people to \"build up the wall\" (Nehemiah 2:17) and then \"set a watch against them day and night\" (Nehemiah 4:9). Walls and a watch keep a city safe. A wall you cannot explain is a wall you cannot trust, so every segment is documented.",
      senior: "Walls and gates — the UniFi gateway. The gateway (a Ubiquiti UCG-Max) is two roles in one device: the perimeter (the WAN edge — routing, firewall, the way in and out) and the interior segmentation. Its most important contribution is VLAN segmentation: the NAS serves several stakeholder groups — family, COLG (church), TLC (clinical, HIPAA-adjacent), Poe Properties (rentals), and future PoeTech customers — and without segmentation they’d all share one broadcast domain. With per-purpose VLANs each is walled off at layer 2, which is also how the clinical data stays isolated as policy requires. The UCG-Max also carries built-in WireGuard (an alternative/supplement to Tailscale for clients and contractors who shouldn’t be on the family tailnet), an internal reverse proxy + DNS (so services answer to friendly names, not bare IPs), and a RADIUS server for unified per-role credentials. A wall you can’t explain is a wall you can’t trust — document each segment. Nehemiah 2:17 and 4:9 give the pairing the design follows: build the wall, then set a watch day and night.",
    },
    quiz: {
      questions: [
        { q: 'What two jobs does the network gateway do?', options: ['Only connects to the internet', 'Connects us to the internet (the door) AND walls the network into separate rooms (VLANs)', 'Only stores files'], answer: 1, explain: 'It’s the front door AND the inside walls — perimeter plus segmentation.' },
        { q: 'Why split the network into VLAN "rooms"?', options: ['To slow it down', 'So family, church, clinic, rentals, and PoeTech stay walled off from each other (safety + isolation)', 'For decoration'], answer: 1, explain: 'Segmentation keeps each group isolated — especially the clinical data that policy requires walled off.' },
      ],
    },
    benefits: [
      'You leave able to name both of the gateway’s jobs, which it does at the same time: it is the front DOOR connecting the stack to the internet and firewalling out what should not come in, and it is the interior WALLS splitting one physical network into separate rooms.',
      'You know why the walls exist here specifically. One box serves the family, the church, the clinic with health-privacy rules, the rentals, and eventually outside customers — without segmentation they would all share one open network.',
      'You can name the gateway’s sovereign powers rather than just its brand: a built-in WireGuard VPN for letting a contractor or tenant in without putting them on the family’s private network, an internal reverse proxy and DNS so services answer to friendly names, and RADIUS so each person gets one set of credentials matched to their role.',
      'You carry Nehemiah’s pattern, which is both halves and not one: "come, and let us build up the wall of Jerusalem" (Nehemiah 2:17), and then "we made our prayer unto our God, and set a watch against them day and night" (Nehemiah 4:9). A wall plus a watch.',
      'You hold the documentation rule that keeps it honest: a wall you cannot explain is a wall you cannot trust, so every segment gets written down.',
      'Carry it out this session: trace the one cable coming IN from the internet and the cables going OUT, then open the controller and see which devices actually live in which room.',
    ],
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
      child: "Reaching it safely from anywhere: this lesson is about Tailscale and WireGuard. Sometimes we are not at home. We are at church, or on a trip. But we still need our computers at home. How do we reach them safely?\n\nWe must not leave the front door wide open. An open door lets bad people try to get in.\n\nSo we use a VPN. A VPN is like a secret tunnel. Only our own phones and computers can use it. Everything inside the tunnel is scrambled, so no one outside can peek. The door at home opens only for people we trust.\n\nToday the family uses a tunnel called Tailscale. Later we will add our own tunnel, called WireGuard, for helpers who need only a little bit. They will not get into the family's room.\n\nThe app on your phone talks to the NAS in a safe way too.\n\nThe big rule is this: each person gets only what their job needs. The Bible says of the good shepherd, \"To him the porter openeth\" (John 10:3). The right door opens for the right one. That is safety, not being mean.",
      youth: "Reaching it safely from anywhere: Tailscale and WireGuard. Owning the iron only helps if you can reach it, from church, from the road or from a hotel. But you must do that WITHOUT leaving the front door open to the whole internet. An exposed service is an open invitation to attackers.\n\nThe answer is a VPN, a private tunnel that is scrambled (encrypted) so only trusted devices can travel through it. Today the family uses Tailscale. It is built on WireGuard and links our devices and the NAS in a private mesh. A device shows up as an online node and can reach home through the tunnel, while the public sees nothing.\n\nThe plan has two moves toward more ownership. First, add the gateway's own WireGuard for people who need a little access but should NOT be on the family's network, like contractors, clients and tenants. Second, one day move fully off the outside Tailscale service to a path we host ourselves.\n\nOne app detail lives here too. The PoeTech app reaches the automation through its own address (the same origin) instead of the public link, because the outside path gets slowed down.\n\nThe rule underneath is least access: each person reaches exactly what their role needs. \"To him the porter openeth\" (John 10:3), and \"The LORD shall preserve thy going out and thy coming in\" (Psalm 121:8).",
      teen: "Reaching it safely from anywhere: Tailscale and WireGuard answer a real problem. Owning the iron is only useful if you can reach it from the church, the road or a hotel, and you have to do that without leaving the front door open to the internet, because an exposed service is an open invitation to attackers.\n\nThe answer is a VPN, a private, encrypted tunnel that only trusted devices can travel through. The family uses Tailscale today. It is built on the WireGuard protocol and forms a private mesh between our devices and the NAS; a device appears as an online node and reaches home over the encrypted path while the public sees nothing at all.\n\nThe roadmap has two steps toward fuller sovereignty. The first is to add the gateway's built-in WireGuard for people who should get limited access but must not be on the family's private network, such as contractors, clients and tenants. The second is to migrate off the outside Tailscale service entirely to a self-hosted path.\n\nAn app detail belongs here as well. The PoeTech app reaches the automation webhooks through a same-origin route rather than the absolute public URL, because the cross-origin path gets throttled; that small choice keeps the app responsive.\n\nThe principle underneath is least access: each person reaches what their role needs and nothing more. \"To him the porter openeth\" (John 10:3). The right door opens for the right one, which is safety rather than suspicion.",
      senior: "Reaching it safely from anywhere — Tailscale and WireGuard. The problem this solves: you need to reach the services from outside the LAN without exposing them to the public internet (an open port is an attack surface). The answer is an encrypted overlay — a VPN. Today the family uses Tailscale (a WireGuard-based mesh) for admin convenience; the roadmap is to add the UCG-Max’s built-in WireGuard for clients, 1099 contractors, and tenants who should NOT be on the family tailnet, and eventually to migrate fully off the Tailscale dependency (native WireGuard or Headscale) for full sovereignty. A key app-level detail: the PWA reaches the n8n webhooks through a SAME-ORIGIN /n8n rewrite, never the absolute Funnel URL, because cross-origin gets throttled. The governing principle is least access: each identity reaches exactly what its role needs and no more — the door opens for the right one, which is safety, not suspicion. John 10:3 frames it: the porter opens to the shepherd, and the door is kept for the one it belongs to.",
    },
    quiz: {
      questions: [
        { q: 'What does a VPN (Tailscale/WireGuard) let us do?', options: ['Leave the front door open to everyone', 'Reach the stack from anywhere over an encrypted private tunnel, while keeping the public out', 'Delete the network'], answer: 1, explain: 'A VPN is a private encrypted path in for the right people — without exposing services to the open internet.' },
        { q: 'Who should use the gateway’s WireGuard instead of the family tailnet?', options: ['Everyone in the family', 'Contractors, clients, and tenants who shouldn’t be on the family’s private network', 'Nobody'], answer: 1, explain: 'Least access: outsiders get a separate WireGuard path, not the family tailnet.' },
      ],
    },
    benefits: [
      'You leave holding both halves of the requirement at once: reach the stack from the church, the road or a hotel, and do it WITHOUT leaving the front door open to the whole internet — because an exposed service is an open invitation.',
      'You know what a VPN actually is — a private, encrypted tunnel only trusted devices travel through — and what our mesh does: a device appears as an online node and reaches home over that path while the public sees nothing.',
      'You know the two moves planned from here, so the present state is not mistaken for the destination: the gateway’s own WireGuard for people who should have limited access and never the family network, and eventually a fully self-hosted path off the outside service.',
      'You carry the principle that governs every one of those decisions: least access. Each person reaches exactly what their role needs, and nothing more.',
      'You have the picture the Word draws of a right door: "he that entereth in by the door is the shepherd of the sheep. To him the porter openeth" (John 10:2-3). The door opening for the right one is safety, not suspicion — and Yahweh "shall preserve thy going out and thy coming in" (Psalms 121:8).',
      'Carry it out this session: open the remote-access app, see your own device listed as a node, confirm it reaches the NAS over the private path, and then confirm a device that should NOT reach something genuinely cannot.',
    ],
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
      child: "Our own A.I.: this lesson is about Ollama and the models on our hardware. Our A.I. lives on OUR own computer at home. When you ask it something, your words do not fly off to a big company. They stay with us. That is safer for the family and for the church.\n\nThe helper that runs our A.I. is called Ollama. It runs open models. Those are A.I. brains that anyone is allowed to run.\n\nBut we must be honest. Our NAS has no game card. So it can only run small A.I. brains, and it runs them slowly. Small brains are still good for many jobs. The really big brains will wait for a special game-card computer. We will meet it next week.\n\nThere is also a big safety rule. Anything that runs by itself on a timer needs three brakes. It needs a limit, so it stops. It needs a lock, so it only runs once at a time. And it needs an off switch. We learned this the hard way, when one ran wild.\n\nA.I. can be wrong. So test what it tells you. \"Prove all things; hold fast that which is good\" (1 Thessalonians 5:21). And \"the LORD giveth wisdom\" (Proverbs 2:6), not the machine.",
      youth: "Our own A.I.: Ollama and the models on our hardware. This is the week the ownership idea becomes real for A.I. We run language models on OUR own hardware, so the family's and the church's words are never shipped off to a company's cloud to be processed.\n\nThe tool that does this on the NAS is Ollama. It serves open models, like Llama, Qwen and Mistral, that anyone can run. But we have to be honest about the limit. The NAS has no graphics card, by design. So it runs SMALLER models well, about up to the 13-billion-parameter size, and it runs them at the slower speed of a regular chip. That is useful for sorting, small helpers and patient jobs. It is not built for fast, heavy thinking. Heavier work either waits for the GPU box in week 7, or it goes to an outside model under a strict budget and then falls back to local.\n\nThere is a hard safety rule from real experience. Anything that runs by itself on a timer and can start more work must carry three brakes: a budget limit that stops a runaway, a lock so a new run never piles onto a stuck one, and a kill-switch that pauses it. An unbraked loop once ran away and had to be shut down by hand.\n\nThe model is a tool to test, not to trust blindly. \"Prove all things; hold fast that which is good\" (1 Thessalonians 5:21). \"For the LORD giveth wisdom\" (Proverbs 2:6).",
      teen: "Our own A.I.: Ollama and the models on our hardware is the week sovereignty becomes concrete for A.I. We run language models on our own machines, so the family's and the church's words are never sent to a vendor's cloud to be processed.\n\nOn the NAS that work is done by Ollama, which serves open-weights models such as Llama, Qwen and Mistral. The ceiling needs to be stated honestly. The NAS is CPU-only by design, so it comfortably runs smaller models, roughly up to the 13-billion-parameter range and larger only with heavy compression, and it runs them at CPU speed. That suits classifiers, small helpers and patient tasks, not fast, heavy reasoning. Heavier work either waits for the dedicated GPU box in week 7 or escalates to a vendor model under a strict budget and then falls back to local, which is the tiered orchestrator pattern.\n\nA hard safety rule came from real experience. Any autonomous work that touches the A.I., any timer or loop that can spawn more work, carries three brakes: a budget ceiling that stops a runaway, a single-instance lock so a new run never stacks on a stuck one, and a kill-switch that pauses on overrun. An unbraked loop once ran away and had to be stopped by hand.\n\nThe posture from the A.I. class still holds. The model is a tool to be tested: \"Prove all things; hold fast that which is good\" (1 Thessalonians 5:21). Real wisdom comes from Yahweh, \"For the LORD giveth wisdom\" (Proverbs 2:6), not from the machine.",
      senior: "Our own A.I. — Ollama and the models on our hardware. The sovereignty claim made concrete: Ollama serves open-weights models (Llama 3.x, Qwen 2.5, Mistral, Phi, Gemma class) on our own box, so no family or church content is sent to a vendor for inference. The honest ceiling: the NAS is CPU-only, so it runs models in roughly the ≤13B range comfortably (up to ~30B with heavy quantization), and at CPU token-rates — fine for classifiers, small helpers, and patient tasks, not for real-time heavy reasoning. That’s exactly why heavier work either waits for the GPU farm (week 7) or escalates server-side to a vendor within a strict budget, then falls back to local — the tiered-orchestrator pattern. Anything autonomous that touches the A.I. must carry the three brakes (a budget ceiling, a single-instance lock, and a kill-switch), because an unbraked timer-driven loop is exactly what once ran away. The class’s own posture holds: the A.I. is a tested tool, not a source of truth (1 Thess 5:21); wisdom is from Yahweh (Prov 2:6).",
    },
    quiz: {
      questions: [
        { q: 'Why run A.I. on our own NAS instead of a vendor cloud?', options: ['It’s the fastest possible', 'So the family’s + church’s words/content stay sovereign and aren’t sent to a stranger', 'So we never have to test it'], answer: 1, explain: 'Local-first means our content never leaves for a vendor — the sovereignty principle, applied to A.I.' },
        { q: 'Why does the NAS run only smaller models?', options: ['It’s broken', 'It’s CPU-only — fine for small models; big ones need a GPU (week 7) or escalate within a budget', 'Small models are always better'], answer: 1, explain: 'CPU-only caps it around ≤13B; heavy work waits for the GPU farm or escalates server-side, then falls back local.' },
        { q: 'What must any autonomous A.I. automation carry?', options: ['Nothing', 'The three brakes: a budget, a single-instance lock, and a kill-switch', 'Just a nice name'], answer: 1, explain: 'An unbraked timer-driven loop is what once ran away — three brakes are mandatory.' },
      ],
    },
    benefits: [
      'You leave with sovereignty made specific for A.I.: models run on OUR hardware, so the family’s and the church’s words are never shipped to a vendor’s cloud to be processed.',
      'You know the honest ceiling rather than a sales pitch. The NAS is CPU-only by design, so it comfortably runs smaller models and runs them at CPU speed — genuinely useful for classifiers, small helpers and patient tasks, and not built for fast, heavy reasoning.',
      'You know where the heavier work goes: to the dedicated GPU box, or escalated server-side to a vendor model within a strict budget and then falling back to local — the tiered pattern, named rather than hidden.',
      'You carry the three brakes as a build requirement, paid for by a real runaway that had to be shut down by hand: a budget ceiling that stops itself, a single-instance lock so a new run never stacks on a stuck one, and a kill-switch that pauses on overrun.',
      'You keep the posture the A.I. class teaches, because owning the model does not make it truthful: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21) — and real wisdom is not in the machine, "For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding" (Proverbs 2:6).',
      'Carry it out this session: open the A.I. health card, read which model is loaded live, ask the local tutor something, and confirm the answer came from OUR model and not a vendor.',
    ],
    lesson: 'This is the week the sovereignty principle becomes real for A.I. specifically: we run language models on OUR own hardware, so the family’s and the church’s words are never shipped off to a vendor’s cloud to be processed. The tool that does this on the NAS is Ollama, and it serves open-weights models — Llama, Qwen, Mistral, and the like — that anyone can run. But we have to be honest about the ceiling. The NAS is CPU-only (no GPU, by design), so it comfortably runs SMALLER models — roughly up to the 13-billion-parameter range, larger only with heavy compression — and it runs them at CPU speed. That’s genuinely useful for classifiers, small helpers, and patient tasks, but it’s not built for fast, heavy reasoning. So heavier work either waits for the dedicated GPU box we’ll meet in week 7, or it escalates server-side to a vendor model within a strict budget and then falls back to local — the "tiered orchestrator" pattern. And there’s a hard safety rule that comes from real experience: anything autonomous that touches the A.I. — any timer or loop that can spawn more work — must carry three brakes: a budget ceiling that stops a runaway, a single-instance lock so a new run never stacks on a stuck one, and a kill-switch that pauses on overrun. An unbraked loop is exactly what once ran away and had to be shut down by hand. Through all of it, the posture from our A.I. class holds: the model is a tool to be tested, not trusted blindly — "test everything, hold fast what is good" (1 Thessalonians 5:21) — and real wisdom comes from God, not the machine (Proverbs 2:6).',
    facilitator: {
      talkingPoints: [
        'A.I. runs on OUR NAS (Ollama, open-weights models) — family/church content never goes to a vendor cloud.',
        'Honest ceiling: CPU-only → ~≤13B comfortably, at CPU speed. Great for small/patient jobs, not heavy real-time reasoning.',
        'Heavy work waits for the GPU farm (week 7) or escalates to a vendor within a budget, then falls back local (tiered orchestrator).',
        'THREE BRAKES are mandatory for any autonomous A.I. automation: a budget, a single-instance lock, a kill-switch.',
        'Same posture as the A.I. class: test the tool, don’t trust it blindly (1 Thess 5:21); wisdom is from Yahweh (Prov 2:6).',
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
      child: "Why we are building a GPU farm: this lesson is about the CPU, the GPU, and VRAM. A computer has chips that do the work. Two kinds matter here.\n\nA CPU is like a few very smart workers. They do one big job at a time. That is great for running the computer and our helpers.\n\nA GPU is a graphics card, the kind in game computers. It is like THOUSANDS of small workers. They all do the same small math at the same time. Big A.I. needs lots of that math, so it loves a GPU.\n\nBut there is a catch. The A.I. brain has to fit inside the GPU's own memory. That memory is called VRAM. A very big A.I. brain needs about 48 of the units we call GB. That is a lot.\n\nHere is the honest truth. Today we have no GPU that is always ready for A.I. The NAS has none. The one good card we own is kept for art and video work first.\n\nSo the plan is to build a GPU farm. It would have two used cards with 48 GB, and room for a third. It would cost about $5,000. We say why plainly: it is so we can own our A.I. and keep our data safe. Jesus asked, \"For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?\" (Luke 14:28). So we count the cost first. At church, the two computers that run the big screen have real game cards right now.",
      youth: "Why we are building a GPU farm: CPU versus GPU, and VRAM. To see why we would spend real money on more hardware, you have to know two kinds of chips and the one number that decides everything.\n\nA CPU has a few strong cores. It is brilliant at doing one hard job at a time, which is perfect for the operating system and our services. A GPU, a graphics card like the ones in gaming PCs, has THOUSANDS of small cores all doing the same kind of math at once. That is exactly what running an A.I. model needs.\n\nHere is the catch, and it is the whole story. The model's \"weights\" have to FIT inside the GPU's own memory, called VRAM. A small model needs a little. A 70-billion-parameter model, compressed the usual way, needs about 48 GB of VRAM.\n\nNow the honest picture of today. We have almost no GPU power that is always on. The NAS has no GPU. The one good card we own is on a creative machine that, by decision, always gives way to creative work, so it cannot be a dependable A.I. host. And the dedicated GPU box is planned but not bought yet.\n\nThe standing plan is a PoeTech \"farm\": two used RTX 3090 cards for 48 GB, in a case with room for a third card to reach 72 GB, for about $5,000, plus a separate church machine. We say plainly that the reason is ownership, big-model ability and control of our data, not saving on a small monthly bill. So we count the cost, as Luke 14:28 says, before we build. Right now the real GPUs we have are the two RTX 4070 machines that drive the church's video wall. Yahweh filled Bezalel \"in wisdom, in understanding, and in knowledge, and in all manner of workmanship\" (Exodus 35:31). Knowing your tools is part of that calling.",
      teen: "Why we're building a GPU farm comes down to the difference between two chips, CPU and GPU, and the one number that gates everything, VRAM. Before spending real money on hardware, that difference has to be clear.\n\nA CPU has a few powerful cores and excels at one complicated job at a time, which suits the operating system and our services. A GPU, the graphics card in a gaming PC, has thousands of small cores performing the same kind of math at the same instant, and that massive parallelism is exactly what running an A.I. model requires.\n\nThe catch is the whole story. A model's weights must fit inside the GPU's own memory, its VRAM. A small model needs a little; a 70-billion-parameter model at common compression needs roughly 48 GB of VRAM just to be held.\n\nThe honest picture of today, which this course refuses to paint over: the mesh has effectively no always-on GPU power. The NAS is CPU-only. The one capable card we own sits in a creative-work machine that, by decision, always yields to creative production, so it cannot be a dependable shared A.I. host. The dedicated GPU box is planned but not yet bought.\n\nThe standing plan is a PoeTech farm: two used RTX 3090s giving 48 GB of VRAM, in a chassis sized for a third card and 72 GB, at around $5,000, plus a separate sovereign church node. It is justified by sovereignty, 70B-class capability and data control, not by beating a small monthly API bill, so we count the cost soberly as Luke 14:28 instructs. The real GPUs available right now are the two RTX 4070 machines driving the church's video wall, our best candidate for local A.I. when the wall is idle. Yahweh filled Bezalel \"in wisdom, in understanding, and in knowledge, and in all manner of workmanship\" (Exodus 35:31); knowing your tools and sizing them honestly belongs to that calling.",
      senior: "Why we're building a GPU farm — CPU versus GPU, and VRAM. The binding constraint is VRAM. A GPU’s thousands of parallel cores are exactly what model inference needs, but the model’s weights have to FIT in the card’s memory: a 70B-class model at Q4 needs roughly 48 GB of VRAM, and the frontier MoE wave wants the 72–96 GB lane. The honest state of the mesh today: effectively zero always-on CUDA. The NAS is CPU-only; the one documented 4070 (12 GB) is a creative box that is absolutely preempted by creative work by decision, so it can’t be a reliable concurrent business host; the church node and the dedicated farm are planned but unbought. The standing plan (DR-0014) is a PoeTech farm — dual used RTX 3090 = 48 GB, chassis sized for a third card → 72 GB — at roughly $5k, plus a separate ≥$5k sovereign church node. The cost is justified by sovereignty + 70B capability + data control + the multi-purpose farm role, NOT by beating a small API bill — stated plainly so we build soberly (Luke 14:28). The church’s left + right RTX 4070 machines that drive the video wall are the real GPUs we have today, and a candidate for local A.I. when the wall is idle. Luke 14:28 is the discipline: count the cost first, and say plainly what the cost is for.",
    },
    quiz: {
      questions: [
        { q: 'Why is a GPU good for A.I. when a CPU struggles?', options: ['It’s just newer', 'A GPU has thousands of cores doing the same math at once — exactly what A.I. inference needs', 'CPUs can’t do math'], answer: 1, explain: 'Massive parallelism (thousands of cores) is what model math wants; the CPU has only a few cores.' },
        { q: 'What is the binding constraint for running a big model?', options: ['The color of the box', 'VRAM — the GPU’s own memory; a 70B model needs ~48 GB to fit', 'The number of cables'], answer: 1, explain: 'The weights must fit in VRAM; ~48 GB for 70B-class is why a multi-GPU box is planned.' },
        { q: 'What is the honest state of our GPU power TODAY?', options: ['We have a huge farm running', 'Effectively zero always-on CUDA — the farm is planned/unbought; the church 4070s are our real GPUs', 'The NAS has a great GPU'], answer: 1, explain: 'No fabrication: the farm is planned (DR-0014); the church wall machines are the real GPUs we have now.' },
      ],
    },
    benefits: [
      'You leave able to explain the spend rather than just approve it. A CPU has a few powerful cores for one complicated job at a time; a GPU has thousands of small cores doing the same math at the same instant, which is exactly the shape of running a model.',
      'You know the one number that gates everything: the weights have to FIT in the card’s own memory. A 70-billion-parameter model at common compression needs roughly 48 GB of VRAM to hold.',
      'You get the honest inventory this course refuses to paint over: effectively zero always-on GPU power today. The NAS is CPU-only, the one capable card is a creative-work machine that by decision always yields to production, and the dedicated box is planned and not yet bought.',
      'You can state the plan and its real justification: two used RTX 3090s for 48 GB in a chassis sized for a third card, around five thousand dollars, plus a separate sovereign church node — justified by sovereignty, 70B-class capability and data control, and NOT by beating a small monthly bill.',
      'You carry the sobriety the Lord asks for before any build: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28) — and the craft-calling that covers knowing the tools this well, "he hath filled him with the spirit of God, in wisdom, in understanding, and in knowledge, and in all manner of workmanship" (Exodus 35:31).',
      'Carry it out this session: read the VRAM ladder, then look — without touching the running machines — at the left and right RTX 4070 machines driving the wall. Those are the real GPUs we have, and when the wall is idle they are the best candidate we own.',
    ],
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
      child: "The house we build for Yahweh: this lesson is about COLG's sovereign stack. COLG is our church, the Church of the Living God.\n\nOur church is HUGE. It is 44,000 square feet. The people built it together. It serves the biggest African American community in Champaign-Urbana. Many of the helpers there are older, and computers are not their first love. For years the church could not find anyone to help with its tech. So WE help. That is why PoeTech exists.\n\nThe church gets the same kind of stack as home. It is the home stack carried across the parking lot. It will have its own NAS to keep things safe. That NAS is being built now. It will keep a locked copy for home, and home keeps one for it. Neither one can read the other's files.\n\nIt has a giant LED screen, run by two game-card computers. It has the broadcast that sends the service out to people at home. Later it will get cameras and business systems. Private papers stay locked up.\n\nWhat we build here can help other churches too. David told Solomon, \"Be strong and of good courage, and do it\" (1 Chronicles 28:20). And \"Except the LORD build the house, they labour in vain that build it\" (Psalm 127:1). We build the house for Him.",
      youth: "The house we build for Yahweh is COLG's sovereign stack is where this whole course has been pointing, because this is who it is for. The Church of the Living God is a 44,000-square-foot house the congregation pulled together to build. It serves the largest African American community in Champaign-Urbana. Many of its full-time helpers are older members for whom technology was never a first love. For years the church could not get real tech support from the wider industry. That gap is exactly why PoeTech exists, and why COLG is the first community we serve.\n\nThe church stack is the home stack carried across the parking lot. It needs its own NAS. That build is in progress. It is part of the same plan as the GPU farm. It will keep a locked copy of the home box's data, and the home box will keep one of its data. Each protects the other. Neither can read the other's files. It has the big LED wall, run by the left and right RTX 4070 machines from last week. It has the broadcast chain, from camera to OBS to the stream. That is the whole subject of The Broadcast course. Cameras and business systems will come as they land. Member and money data stay locked behind staff-only walls.\n\nWe write it all down so the Church module can help any church in the same place. \"Be strong and of good courage, and do it\" (1 Chronicles 28:20). \"Except the LORD build the house, they labour in vain that build it\" (Psalm 127:1).",
      teen: "The house we build for Yahweh, COLG's sovereign stack, is the reason this course exists. Picture the building first. The congregation raised a 44,000-square-foot house with their own hands and money. It serves the largest African American community in Champaign-Urbana. Much of the daily work there is carried by older members, and technology was never something they chose to love. For years, nobody in the tech world stepped up to help them. PoeTech exists to close that gap, and COLG is the first community it serves.\n\nEverything you learned about the home stack now walks across the parking lot. The church is getting its own sovereign NAS, planned together with the GPU farm. The two boxes will each hold a locked backup of the other, and neither can read what it is holding. The giant LED wall in the Sanctuary runs on the left and right RTX 4070 machines. The broadcast chain, from camera through OBS and the encoder out to the stream, is where this course and The Broadcast course meet. Cameras for security and business systems come later, and member records and money records stay behind staff-only walls.\n\nWhy write all of it down? Because the goal is bigger than one church. What works for COLG can become a gift to any church stuck in the same place. David charged Solomon, \"Be strong and of good courage, and do it: fear not, nor be dismayed\" (1 Chronicles 28:20). And the psalm keeps the builders humble: \"Except the LORD build the house, they labour in vain that build it\" (Psalm 127:1).",
      senior: "The house we build for Yahweh — COLG's sovereign stack. COLG is the named FIRST community (COMMUNITY-FIRST-MISSION): a 44,000 sq ft house the congregation built, the largest African American community in Champaign-Urbana, staffed largely by elderly members for whom technology isn’t a first language — and historically unable to get support from the broader tech industry. The church stack is the home pattern carried over: a sovereign NAS (the build is in progress; the church node is part of the DR-0014 envelope, with an encrypted ISO-2 backup relationship to the home stack), the Sanctuary LED video wall driven by the left + right RTX 4070 machines, the broadcast chain (the subject of The Broadcast course — camera → OBS → encode → stream), and surveillance/business systems as they land. Member and financial data stays staff-gated behind the isolation walls. The whole point is that the Church module generalizes from COLG’s real needs to any church in a similar situation — so what we build here becomes a repeatable gift, not a one-off. Psalm 127:1 governs the whole of it: except the LORD build the house, the builders labour in vain.",
    },
    quiz: {
      questions: [
        { q: 'Why does PoeTech build the church’s stack itself?', options: ['For fun', 'COLG is the first community we serve and couldn’t get tech support — so we build it sovereign for them', 'To sell their data'], answer: 1, explain: 'COMMUNITY-FIRST: COLG is the named first community; we fill the support gap the industry left.' },
        { q: 'How does the church stack relate to the home stack?', options: ['Totally different', 'It mirrors it — a sovereign NAS, the video wall + 4070 machines, the broadcast — same patterns at the church', 'It has no NAS'], answer: 1, explain: 'Same patterns, carried to COLG — which is how the build becomes repeatable for other churches.' },
      ],
    },
    benefits: [
      'You leave knowing who this course is for and why it exists: a 44,000-square-foot house the congregation pulled together to build, serving the largest African American community in Champaign-Urbana, whose support staff are largely elderly members for whom technology was never a first love.',
      'You know the gap plainly. For years the church could not get real technology support from the broader industry — and that gap is the reason this work exists and why COLG is the named first community we serve.',
      'You recognise the church stack as the home stack carried across the parking lot: its own sovereign NAS with an encrypted offsite relationship to the home box, the Sanctuary LED wall driven by the two 4070 machines, and the broadcast chain where this course meets The Broadcast course.',
      'You know the data discipline that never moves: member and financial data stays staff-gated behind the isolation walls, whatever else grows on the stack.',
      'You carry the deepest reason it is all documented — the Church module is meant to GENERALIZE, so what we build for COLG becomes a repeatable gift for any church in the same situation.',
      'You stand on what David told Solomon about exactly this kind of build: "Be strong and of good courage, and do it: fear not, nor be dismayed" (1 Chronicles 28:20), and on the sentence that keeps it from becoming ours: "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1).',
    ],
    lesson: 'Everything in this course points here, because this is who it’s for. The Church of the Living God is a 44,000-square-foot house that the congregation pulled together to build; it serves the largest African American community in Champaign-Urbana; and its full-time support staff are largely elderly members for whom technology was never a first love. For years the church couldn’t get real technology support from the broader industry — and that gap is exactly why PoeTech exists and why COLG is the named first community we serve. The church stack is the home stack you’ve already learned, carried across the parking lot. It needs its own sovereign NAS — that build is in progress, part of the same hardware plan as the GPU farm, with an encrypted offsite backup relationship to the home box so each protects the other without reading the other’s data. It has the Sanctuary LED video wall, driven by the left and right RTX 4070 machines you met last week. It has the broadcast chain — camera to OBS to encode to stream — which is the whole subject of The Broadcast course, so the two courses meet here. And it will grow surveillance and business systems as they land, with member and financial data always staff-gated behind the isolation walls. The deepest reason we document all of it is that the Church module is meant to GENERALIZE: what we build for COLG becomes a repeatable gift for any church in the same situation. As David told Solomon, "Be strong and of good courage, and do it: fear not, nor be dismayed" (1 Chronicles 28:20) — and unless the Lord builds the house, the builders labor in vain (Psalm 127:1). We build the house for Him.',
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
      child: "Keeping it alive: this lesson is about health, alerts, and the three brakes. When you own something, you take care of it. The best way is to have the system check on ITSELF and TELL us when something is wrong.\n\nIt has health checks, like a nurse who takes your temperature. Every job has one. When a job reaches out to something outside, we watch for trouble so a problem is never hidden. Jobs are made so they can run again safely. Copies are made every day.\n\nWhen something breaks, the system sends a message to a phone. The tool that sends it is called ntfy, and it runs on our own NAS. A really bad problem gets sent as loud as it can go.\n\nWe can also look for ourselves. Cards in the app show how each box is doing right now. If a card cannot see a box, it says so. It never makes up a happy number.\n\nHere is the big rule, learned the hard way. Anything that runs by itself on a timer needs three brakes. A limit, so it stops. A lock, so it runs just once at a time. And an off switch. It starts turned off, until someone is watching.\n\nJesus asked, \"Who then is that faithful and wise steward\" (Luke 12:42)? It is the one who keeps watch, the way Nehemiah \"set a watch against them day and night\" (Nehemiah 4:9).",
      youth: "Keeping it alive: health, alerts, and the three brakes. Owning the iron means you also own keeping it alive. The grown-up way to do that is to make the system watch itself and TELL you, instead of hoping someone goes looking.\n\nIt is concrete. Every workflow has a health check. Every call out to something outside is wrapped so a failure is caught, not silent. Jobs are built so they can safely run again. Backups run daily, and everything is watched. The system sends alerts to a phone through ntfy, our own notifier on the NAS. When something breaks, it shows up right away, and a failed alert is sent at high priority so it cannot be missed.\n\nYou can also just look. The in-app Infrastructure inventory and the A.I. health card read real checks from the live system: the NAS, the network controller, the VPN and the local model. They honestly say \"not connected\" or \"stale\" instead of inventing a nice number.\n\nThen the hardest-won rule in the course, paid for by a real incident. Any automation that runs on its own, on a timer, or that can start more work, needs three brakes. A budget limit, so a runaway stops itself. A lock, so a new run never piles on a stuck one. And a kill-switch, so it pauses on overrun. It ships turned OFF and is switched on only with someone watching, because an unbraked fleet once ran wild and had to be shut down by hand. \"Who then is that faithful and wise steward\" (Luke 12:42)? The one who can say, \"we made our prayer unto our God, and set a watch against them day and night\" (Nehemiah 4:9).",
      teen: "Keeping it alive means health, alerts, and the three brakes, and the idea behind all three is simple: a system you own should speak up for itself. Nobody has time to check every box by hand every day, so the machines are built to report on their own condition.\n\nHere is how that looks in practice. Each workflow carries its own health check. Any step that talks to an outside service is wrapped, so if that service fails, the failure gets caught and written down instead of vanishing. Jobs are designed so that running one twice does no harm. A backup runs every day, and monitoring sits over all of it.\n\nWhen something goes wrong, your phone hears about it. Our own notifier, ntfy, lives on the NAS and pushes a message the moment a problem appears, and a failure is marked high priority so it cannot slide by. You can also check for yourself. The Infrastructure inventory and the A.I. health card in the app read live probes from the NAS, the network controller, the VPN and the local model. If a probe cannot reach something, the card says \"not connected\" or \"stale.\" It never fakes a good number.\n\nThe last rule cost us something to learn. Automation that runs itself, on a timer or by creating more work, must have three brakes: a spending ceiling so a runaway ends itself, a lock so only one copy runs at a time, and a kill-switch that pauses it on overrun. It starts switched off and is turned on only while someone watches. We know why, because an unbraked fleet once ran wild while no one was there and had to be stopped by hand. Jesus asked, \"Who then is that faithful and wise steward\" (Luke 12:42)? Nehemiah showed the answer: \"we made our prayer unto our God, and set a watch against them day and night\" (Nehemiah 4:9).",
      senior: "Keeping it alive — health, alerts, and the three brakes. This is the perpetual-pipeline-health discipline. Resilience isn’t a feeling; it’s built: a health check per workflow, try-catch around every external I/O, idempotent design, a standard error envelope, daily backups, and monitoring. The system is built to TELL you — every meaningful transition pushes to the self-hosted ntfy server on the NAS (a failed trigger pushes at high priority), so a problem surfaces instead of hiding. And the live state is observable in-app: the Infrastructure inventory and LLM-health cards read real probes (DSM, the UniFi controller, tailscale status, Ollama /api/ps) and honestly show \"not connected\" or \"stale\" rather than painting a number. The hard-won safety law: ANY autonomous, timer-driven, or self-triggering automation ships with all three brakes — a budget ceiling per run, a single-instance concurrency lock, and a dead-man’s-switch/kill-switch — and ships INACTIVE, turned on only with someone watching. That law exists because an unbraked fleet once ran away unattended and had to be killed by hand. Luke 12:42 asks who the faithful and wise steward is, and Nehemiah 4:9 answers with the practice: a watch set day and night, which is what the probes, the alerts and the brakes are.",
    },
    quiz: {
      questions: [
        { q: 'How does the system tell us something is wrong?', options: ['It hides it', 'It pushes an alert (ntfy) to a phone and shows live health cards in the app', 'We just hope'], answer: 1, explain: 'The system is built to TELL you — push alerts + live, honest health cards.' },
        { q: 'What are the three brakes every timer-driven automation must have?', options: ['Red, yellow, green', 'A budget ceiling, a single-instance lock, and a kill-switch', 'Three backups'], answer: 1, explain: 'Budget + lock + kill-switch — because an unbraked loop once ran away and had to be killed by hand.' },
      ],
    },
    benefits: [
      'You leave with the mature posture named: make the system watch itself and TELL you, instead of relying on somebody to go looking.',
      'You can list what that means concretely — a health check on every workflow, every external call wrapped so a failure is caught rather than silent, jobs written to be safely re-runnable, daily backups, and the whole thing monitored.',
      'You know the alert path and why it is ours: pushes go to a phone through our own notifier running on the NAS, and a failed alert is pushed at high priority so it cannot be missed.',
      'You trust the health cards for the right reason — they read real probes and honestly say not connected or stale instead of inventing a comforting number. Unknown never reads as fine.',
      'You carry the hardest-won rule in the course, paid for by an unbraked fleet that ran away unattended: anything on a timer carries a budget ceiling, a single-instance lock and a kill-switch, and it ships turned OFF, switched on only with someone watching.',
      'Carry it out this session: read the live inventory and the A.I. health card, see what an alert actually looks like on a phone, and name one thing the system would flag and how you would know. "Who then is that faithful and wise steward" (Luke 12:42) is the question; a watch kept "day and night" (Nehemiah 4:9) is the answer.',
    ],
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
      child: "Build it right, and raise the next builders. This is the last lesson. You have learned so much: the NAS, the drives, the gateway, the tunnel, and our own A.I.\n\nWe build it all with care. Not to show off. We build it well because the family and the church need it every day. A good builder is faithful with what he is given.\n\nTwo things show a build is good. First, it works every day, not just once. So we write down checklists. We record the steps, so no job lives in only one person's head.\n\nSecond, you really own a part when you can TEACH it. So here is your job. Pick the part you know best. Write a short checklist, or record your steps. Then teach it to one person, like a friend, a cousin, or a grandparent.\n\nThe same team that runs the broadcast also builds and runs both stacks, at home and at church. They keep the iron alive and teach the next helpers.\n\nPaul said to pass it on to \"faithful men, who shall be able to teach others also\" (2 Timothy 2:2). And \"whatsoever ye do, do it heartily, as to the Lord\" (Colossians 3:23). Builders raise builders. The work goes on after us.",
      youth: "Build it right, and raise the next builders. This is the sending-out lesson, and it ties the course together with one word: stewardship. We build the infrastructure to a high standard, not to impress anyone, but because the family and the church truly depend on it. A steward's job is to be found faithful with what he is given.\n\nTwo marks separate a mature build from a lucky one. The first is reliability. Excellence is not one good day. It is a stack that works every single day. That is why we write down run-of-show notes and checklists, and record step-by-step videos (POV SOPs), so nothing rides on one person's memory. It is the same SOP library the broadcast team uses.\n\nThe second mark is multiplication. The proof that you own a part of the stack is that you can teach it. So this course ends by sending you to teach. Pick the part you understand best, write its simple checklist or record your steps, and explain it to one other person.\n\nThe media team's real role is named here too. The same team that builds and runs the broadcast builds and runs BOTH infrastructures, home and church. They capture the steps, teach the next operators and keep the iron alive. Paul told Timothy to commit what he learned \"to faithful men, who shall be able to teach others also\" (2 Timothy 2:2). \"And whatsoever ye do, do it heartily, as to the Lord, and not unto men\" (Colossians 3:23). Founders raise founders, and the calling outlasts any one of us.",
      teen: "Build it right and raise the next builders: this final lesson sends you out, and one word holds the whole course together, stewardship. We do careful work on this infrastructure for a plain reason. Real people need it. The family's memories and the church's ministry run on these machines, and a steward is someone found faithful with what he was trusted to keep.\n\nHow can you tell a mature build from one that just got lucky? Look for two things. The first is that it keeps working. A single good day proves little; excellence means the stack runs every day. So we keep written run-of-show notes and checklists, and we film first-person step videos, the POV SOPs, so no job lives only in one head. The broadcast team draws from that same library.\n\nThe second is that the knowledge multiplies. If you can teach a part of the stack, you own it. If you cannot, you are still borrowing it. That is why the course ends with an assignment rather than a test: choose the piece you know best, write its short checklist or record your steps, and walk one other person through it.\n\nIt also names the media team's real job. The team that runs the broadcast also builds and keeps both infrastructures, at home and at the church. They record the sequences, train the next operators and keep the machines alive. Paul told Timothy to commit what he had heard \"to faithful men, who shall be able to teach others also\" (2 Timothy 2:2). And we do the work \"heartily, as to the Lord, and not unto men\" (Colossians 3:23). Founders raise founders, and the calling will outlast every one of us.",
      senior: "Build it right — and raise the next builders. The commissioning. Sovereignty is stewardship, and a mature build shows two marks. Reliability: excellence isn’t a lucky day, it’s a stack that works every day — which is why we write run-of-show + checklists and capture POV SOPs, so nothing rides on one person’s memory (the same SOP library the broadcast team uses). Multiplication: you own a part of the stack when you can TEACH it — 2 Timothy 2:2, entrust what you’ve learned to faithful people who can teach others. This is also where the media team’s role is named honestly: the same team that builds and runs the broadcast builds and runs BOTH infrastructures, home and church — capturing sequences, teaching the next operators, keeping the iron alive. We do it as for the Lord, not for men (Colossians 3:23). Founders raise founders; the stack outlasts any one of us. The criterion in 2 Timothy 2:2 is worth noticing: faithful men who shall be able to teach others also, which makes teachability, not mere operation, the test of a completed handover.",
    },
    quiz: {
      questions: [
        { q: 'How do you prove you truly own a part of the stack?', options: ['By being the only one who can touch it', 'By being able to teach it simply to someone else', 'By finishing fastest'], answer: 1, explain: 'Mastery shows in teaching it — 2 Timothy 2:2. Founders raise founders.' },
        { q: 'What are the two marks of a mature build?', options: ['Speed and noise', 'Reliability (works every day, documented) and multiplication (you can teach it)', 'Cost and color'], answer: 1, explain: 'Reliability + multiplication — write it down so nothing rides on one memory, and teach it forward.' },
      ],
    },
    benefits: [
      'You leave with the whole course under one word — stewardship. The standard is high not to impress anyone but because the family and the church genuinely depend on it.',
      'You know the first mark of a mature build: reliability. Excellence is not one good day; it is a stack that works every day, which is why checklists and recorded sequences exist so nothing rides on one person’s memory.',
      'You know the second and harder mark: multiplication. The proof you own a part of the stack is that you can teach it.',
      'You see the media team’s real role named plainly — the same team that builds and runs the broadcast builds and runs BOTH infrastructures, captures the sequences and teaches the next operators.',
      'You carry the two verses that hold the ends together: "the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2), and "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23).',
      'Carry it out this session: pick the one part you understand best, write its checklist or record your sequence, and explain it to one other person. Then put your name on the helper list. Founders raise founders.',
    ],
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
