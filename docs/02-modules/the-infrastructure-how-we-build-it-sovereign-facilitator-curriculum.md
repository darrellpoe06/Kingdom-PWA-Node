# The Infrastructure: How We Build It Sovereign

_Own the iron. Steward the house. Sovereignty is faithfulness._

**For:** the build & media team, and family learners at every age — Christian (10) included
**Format:** 10 weekly sessions · ~75 min each (paced to your age) · live time with Darrell plus hands-on with the real hardware
**Length:** 10 weekly sessions · ~75 min each

## Every session follows the same rhythm

- **5 min** — Prayer + the anchor
- **10 min** — Recap last week
- **15 min** — Teach the big idea
- **25 min** — Hands-on with the hardware
- **15 min** — Discussion
- **5 min** — Send-off + solo task

---

## Week 1 — Own the iron — what "sovereign infrastructure" means
*Saturday, 2026-07-18*

**Big idea.** Sovereign means we own the machines our data and our A.I. run on, instead of renting someone else’s. See the whole map: the home stack and the church stack. We own the iron so it serves the family and the community — never the other way around.

**Lesson.** Before any single box makes sense, you have to see what we’re building and WHY. "Sovereign infrastructure" means the machines that run our data, our automation, and our A.I. are machines we OWN and govern — sitting in our house and our church — instead of renting space on a giant company’s computers far away. That choice is the foundation of everything PoeTech stands for: when you own the iron, your family’s photos and your church’s sermons can’t be quietly sold, mined, or held hostage, and the service can’t be switched off by someone else. There’s an honest cost — we carry the responsibility a landlord would otherwise carry (backups, updates, keeping it running), which is exactly why this course exists: so that work is shared and written down, not trapped in one person’s head. The map has two halves that rhyme. The HOME stack — a NAS that stores and runs services, a gateway that walls and guards the network, local A.I., remote access — proves the pattern at family scale. The CHURCH (COLG) stack carries that same pattern to the first community we serve. Genesis 2:15 says we were put in the garden to work it and KEEP it; 1 Corinthians 4:2 says stewards must be found faithful. We own and tend the iron as stewards — so it lifts the family and the community, and never extracts from them.

**Hands-on with the hardware.** Stand in front of the real stack and point to each box: the NAS (the brain + the barn), the network gateway (the walls and the door), and the screens. Then open the in-app Infrastructure inventory and match each real box to its live card.

**Anchor — Genesis 2:15; 1 Corinthians 4:2.** Put in the garden to work it and keep it; it is required of stewards that they be found faithful. We own and tend the iron as stewards, not as owners who extract.

### Facilitator guide

**Talking points**
- Sovereign = we own the machines our data + A.I. run on. Owning the iron is what keeps the data ours.
- The honest trade: we carry the responsibility a vendor would (backups, updates, uptime) — so we share + document it.
- Two halves that mirror: the home stack proves the pattern; the church stack carries it to COLG, the first community.
- Genesis 2:15 / 1 Cor 4:2 — work it and keep it; stewards found faithful. We tend the iron; it serves people, never extracts.

**How to run the 75 minutes**
- Prayer + the anchor (5): open in prayer; read Genesis 2:15 — work it and keep it.
- Recap last week (10): first session — instead, go around: name, and one device you use every day.
- Teach the big idea (15): define sovereign; draw the two stacks; name the job of each box.
- Hands-on with the hardware (25): walk the real stack; each learner points to and names the NAS, the gateway, the screens; open the in-app Infrastructure inventory and match boxes to cards.
- Discussion (15): what could go wrong if a stranger owned our data instead of us?
- Send-off + solo task (5): solo task — teach one family member the word "sovereign" and point out one box we own.

**Discussion prompts**
- What’s one thing that stays safe because WE own the box, not a stranger?
- What’s the honest cost of owning it — and how do we carry that together?
- How is "work it and keep it" a job description for this whole stack?

---

## Week 2 — The brain and the barn — the Synology NAS
*Saturday, 2026-07-25*

**Big idea.** The NAS is one box that does two big jobs: it STORES the family’s data (the barn) and it RUNS our services and local A.I. (the brain). It’s a serious server — a Xeon CPU, error-correcting memory, many drive bays — but on purpose it has no graphics card.

**Lesson.** The Synology NAS is the single most important box in the home stack, and the clearest way to understand it is that it does two jobs at once. It is a BARN — it stores the family’s data safely across several hard drives held in slots called drive bays. And it is a BRAIN — it runs the services the whole system depends on: the automation engine (n8n), our own local A.I. (Ollama), file/chat/photo sharing, and the notifier that pushes alerts (ntfy). Under the hood it’s a real server: an Intel Xeon processor, error-correcting (ECC) memory that catches its own mistakes, multiple drive bays, fast NVMe cache, and two 10-gigabit network ports. But notice what it does NOT have on purpose: a graphics card. That makes it superb at storing and serving and running small helpers, and deliberately not built for heavy, fast A.I. — that’s a different machine we’ll meet in week 7. One more discipline that runs through this whole course: we don’t memorize the live numbers (how full the disks are, which model is loaded). We read them off the in-app Infrastructure inventory, which traces every value to a real probe — so the number is always true, never painted. Like Joseph filling the storehouses before the lean years (Genesis 41), the NAS is our storehouse: what we keep safe now protects us later.

**Hands-on with the hardware.** Find the NAS. Look at the front: the status light and the drive bays. Sign in to the dashboard and read the real System Health. Notice the services running on it (automation, the local A.I., file sharing).

**Anchor — Genesis 41:48–49; Proverbs 21:20.** Joseph stored up grain in the storehouses against the lean years; the wise store up choice provision. The NAS is our storehouse — what we save now protects us later.

### Facilitator guide

**Talking points**
- One box, two jobs: the barn (drive bays = storage) and the brain (CPU + RAM = services + local A.I.).
- Real, honest spec: Xeon D-1527, ECC memory, drive bays, NVMe cache, dual 10GbE — and CPU-only (no GPU) ON PURPOSE.
- It runs n8n (automation), Ollama (local A.I.), file/chat/photos, ntfy (push). The services spine of the home stack.
- We never memorize live numbers — we read them off the in-app Infrastructure inventory, which traces each to a real probe.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read Genesis 41:48–49 — Joseph’s storehouses.
- Recap last week (10): a learner names the boxes from week 1.
- Teach the big idea (15): the barn + the brain; the honest spec; why no GPU.
- Hands-on with the hardware (25): find the NAS; read the front light + bays; sign in and read real System Health; list the running services; open the in-app inventory and confirm the numbers match.
- Discussion (15): what makes a "healthy" NAS, and how would we know it’s sick?
- Send-off + solo task (5): solo task — check the inventory card once this week and note one number.

**Discussion prompts**
- Why is "no graphics card" the RIGHT choice for this particular box?
- What’s the difference between the barn job and the brain job?
- Why do we read live numbers off the inventory instead of trusting memory?

---

## Week 3 — Never lose the family’s data — disks, RAID, and backups
*Saturday, 2026-08-01*

**Big idea.** Hard drives WILL fail eventually — so we plan for it. RAID lets the NAS keep working when one drive dies. And a backup is a second copy somewhere else: 3 copies, 2 kinds of media, 1 offsite. We keep an encrypted copy at the church, sealed.

**Lesson.** Here is a truth that sounds scary but is just engineering: every hard drive will fail eventually. Wise builders don’t pretend otherwise — they plan for it, and that planning has two distinct halves people constantly mix up. The first is RAID — redundancy. The NAS writes the data across several drives in a way that lets it keep running even when ONE drive dies; you replace the dead drive and the array rebuilds itself. But RAID is NOT a backup: it protects against a drive dying, not against a file being deleted, a ransomware attack, a fire, or a theft. For those you need the second half — a BACKUP, a fully independent copy kept somewhere else. The rule of thumb is 3-2-1: three copies of the data, on two different kinds of media, with one of them offsite. Our offsite copy is an ENCRYPTED, sealed blob stored on the church NAS, with isolation walls so neither site can read the other’s plaintext. And the single most important habit: a backup you’ve never restored is only a hope — so the routine includes a real test restore. When a drive does fail, replacing it is the highest-stakes routine on the whole box: confirm the backup is current first, swap only the failed drive, and never power-cycle during a rebuild. Proverbs 27:23 says know well the state of your flocks — knowing what you have and protecting it is wisdom, not fear.

**Hands-on with the hardware.** At the NAS, count the drive bays. In the dashboard, see how the drives are grouped (the RAID) and find the backup job. Confirm the offsite copy exists. (A parent supervises any drive handling — never yank a drive.)

**Anchor — Proverbs 27:23; Luke 14:28.** Know well the state of your flocks; count the cost before you build. Knowing what you have, and protecting it, is wisdom — not fear.

### Facilitator guide

**Talking points**
- Every drive fails eventually — we PLAN for it, with two distinct protections.
- RAID = redundancy (survives a drive dying, keeps uptime). It is NOT a backup.
- Backup = a separate copy: 3-2-1 (3 copies, 2 media, 1 offsite). Ours is an encrypted sealed blob at the church.
- A backup you’ve never restored is a hope — test-restore. Drive swap: verify backup first, never power-cycle mid-rebuild.
- Proverbs 27:23 — know the state of your flocks. Protecting what you have is wisdom.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read Proverbs 27:23 and Luke 14:28.
- Recap last week (10): a learner names the NAS’s two jobs.
- Teach the big idea (15): RAID vs backup; the 3-2-1 rule; the encrypted offsite copy; test-restore.
- Hands-on with the hardware (25): count the bays; in the dashboard see the RAID grouping and the backup job; confirm the offsite copy; (supervised) feel a caddy — never pull one live.
- Discussion (15): what would RAID NOT save us from, and what backup would?
- Send-off + solo task (5): solo task — find out when our last successful backup ran.

**Discussion prompts**
- Name one disaster RAID survives and one it does NOT — and what covers the second.
- Why is a never-tested backup not really a backup?
- What does 3-2-1 look like exactly in our setup?

---

## Week 4 — Walls and gates — the UniFi gateway
*Saturday, 2026-08-08*

**Big idea.** The network gateway is the front door of the whole system AND the inside walls. It connects us to the internet, and it splits the network into separate rooms (VLANs) so the family, the church, the clinic, the rentals, and PoeTech each stay walled off from the others.

**Lesson.** If the NAS is the brain and the barn, the gateway is the front door and the interior walls — and it does both jobs at once. As the door, it connects the whole stack to the internet and stands as the perimeter: routing traffic and firewalling out what shouldn’t come in. As the walls, it splits one physical network into several separate "rooms" called VLANs. This matters enormously because the NAS serves very different groups off one box — the family, the church (COLG), the clinic (TLC, which has health-privacy rules), Poe Properties (the rentals), and eventually PoeTech’s own customers. Without segmentation they’d all share one open network; with per-purpose VLANs, each is walled off from the others, which is also how the clinical data stays isolated exactly as policy requires. Our gateway is a Ubiquiti UCG-Max, and it carries a few more sovereign powers: a built-in WireGuard VPN (a way to let a contractor or tenant in without putting them on the family’s private network), an internal reverse proxy and DNS so our services answer to friendly names instead of bare numbers, and a RADIUS server so each person gets one set of credentials matched to their role. Nehemiah rebuilt the wall AND set a guard day and night (Nehemiah 4:9) — walls and a watch are how a city, and a network, stays safe and whole. And a wall you can’t explain is a wall you can’t trust, so every segment gets documented.

**Hands-on with the hardware.** Find the gateway. Trace the one cable coming IN from the internet (WAN) and the cables going OUT to everything else (LAN). In the controller, see the separate VLAN "rooms" and which devices live in each.

**Anchor — Nehemiah 2:17; 4:9.** Come, let us rebuild the wall; they prayed and set a guard day and night. Walls and a watch are how a city — and a network — stays safe and whole.

### Facilitator guide

**Talking points**
- The gateway is the front door (internet + firewall) AND the inside walls (segmentation) — two jobs, one box.
- VLAN segmentation walls family / COLG / TLC / Properties / PoeTech off from each other — that’s how clinical data stays isolated.
- UCG-Max extras: built-in WireGuard (let contractors/tenants in safely), reverse proxy + friendly DNS, RADIUS (one credential per role).
- Nehemiah 4:9 — rebuild the wall AND set a guard. A wall you can’t explain is a wall you can’t trust: document each segment.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read Nehemiah 2:17 and 4:9.
- Recap last week (10): a learner explains RAID vs backup.
- Teach the big idea (15): door + walls; VLAN segmentation and why isolation matters; the UCG-Max extras.
- Hands-on with the hardware (25): find the gateway; trace WAN-in vs LAN-out cables; in the controller see the VLAN rooms and which devices are in each; confirm a device can’t reach a room it shouldn’t.
- Discussion (15): which group most NEEDS to stay walled off, and why?
- Send-off + solo task (5): solo task — list the five VLAN "rooms" from memory.

**Discussion prompts**
- Why must the clinic (TLC) data live in its own walled room?
- When would we use the gateway’s WireGuard instead of the family tailnet?
- What does "a wall you can’t explain is a wall you can’t trust" mean for documentation?

---

## Week 5 — Reaching it safely from anywhere — Tailscale & WireGuard
*Saturday, 2026-08-15*

**Big idea.** We need to use the stack from the road without leaving the front door wide open to the world. A private tunnel (VPN) like Tailscale or WireGuard lets the right people in over an encrypted path — and keeps everyone else out. The app reaches the NAS the same private way.

**Lesson.** Owning the iron is only useful if you can actually reach it — from the church, from the road, from a hotel — but you must do that WITHOUT leaving the front door open to the whole internet, because an exposed service is an open invitation to attackers. The answer is a VPN: a private, encrypted tunnel that only trusted devices can travel through. Today the family uses Tailscale, which is built on the WireGuard protocol and forms a private mesh between our devices and the NAS; a device shows up as an "online node" and can reach home over that encrypted path while the public sees nothing. The plan from here has two moves toward more sovereignty: add the gateway’s own built-in WireGuard for people who should get limited access but should NOT be on the family’s private network — contractors, clients, tenants — and eventually migrate fully off the outside Tailscale service to a self-hosted path. One important app detail lives here too: the PoeTech app reaches the automation webhooks through a same-origin "/n8n" rewrite rather than the absolute public URL, because the cross-origin path gets throttled — a small thing that keeps the whole app responsive. The principle underneath it all is least access: each person reaches exactly what their role needs and nothing more. As John 10 pictures it, the gatekeeper opens to the shepherd — the right door opens for the right one. That’s safety, not suspicion.

**Hands-on with the hardware.** On a phone or laptop, open the remote-access app and see your device listed as an online node. Confirm it can reach the NAS over the private path — and that a device that shouldn’t reach something, can’t.

**Anchor — John 10:1–3; Psalm 121:7–8.** The gatekeeper opens to the shepherd; the Lord keeps your going out and coming in. The right door opens only for the right ones — that is safety, not suspicion.

### Facilitator guide

**Talking points**
- Reach the stack from anywhere over an encrypted VPN tunnel — without exposing services to the public internet.
- Today: Tailscale (WireGuard-based mesh) for family admin. Roadmap: UCG-Max WireGuard for contractors/tenants; eventually off the Tailscale dependency.
- App detail: the PWA reaches n8n via the SAME-ORIGIN /n8n rewrite, never the absolute Funnel URL (cross-origin throttles).
- Least access: each identity reaches exactly what its role needs. John 10 — the door opens for the right one.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read John 10:1–3 and Psalm 121:7–8.
- Recap last week (10): a learner names the VLAN rooms.
- Teach the big idea (15): why not expose ports; what a VPN is; Tailscale now, WireGuard next; least access.
- Hands-on with the hardware (25): on a device, open the access app, see the online node, reach the NAS privately; show that a wrong-role device can’t reach more than it should.
- Discussion (15): what’s the danger of just opening a port to the internet?
- Send-off + solo task (5): solo task — name who in our world should get WireGuard, not the tailnet.

**Discussion prompts**
- Why is leaving a service open to the public internet dangerous?
- Who gets the family tailnet, and who gets a separate WireGuard path — and why?
- How is "the right door opens for the right one" the definition of least access?

---

## Week 6 — Our own A.I. — Ollama and the models on our hardware
*Saturday, 2026-08-22*

**Big idea.** We run A.I. on OUR machines, so the family’s and the church’s words never go to a stranger’s cloud. Ollama runs open models on the NAS. Because the NAS is CPU-only, it runs SMALL models — fine for many jobs, and the bigger ones wait for the GPU box (week 7).

**Lesson.** This is the week the sovereignty principle becomes real for A.I. specifically: we run language models on OUR own hardware, so the family’s and the church’s words are never shipped off to a vendor’s cloud to be processed. The tool that does this on the NAS is Ollama, and it serves open-weights models — Llama, Qwen, Mistral, and the like — that anyone can run. But we have to be honest about the ceiling. The NAS is CPU-only (no GPU, by design), so it comfortably runs SMALLER models — roughly up to the 13-billion-parameter range, larger only with heavy compression — and it runs them at CPU speed. That’s genuinely useful for classifiers, small helpers, and patient tasks, but it’s not built for fast, heavy reasoning. So heavier work either waits for the dedicated GPU box we’ll meet in week 7, or it escalates server-side to a vendor model within a strict budget and then falls back to local — the "tiered orchestrator" pattern. And there’s a hard safety rule that comes from real experience: anything autonomous that touches the A.I. — any timer or loop that can spawn more work — must carry three brakes: a budget ceiling that stops a runaway, a single-instance lock so a new run never stacks on a stuck one, and a kill-switch that pauses on overrun. An unbraked loop is exactly what once ran away and had to be shut down by hand. Through all of it, the posture from our A.I. class holds: the model is a tool to be tested, not trusted blindly — "test everything, hold fast what is good" (1 Thessalonians 5:21) — and real wisdom comes from God, not the machine (Proverbs 2:6).

**Hands-on with the hardware.** Open the in-app A.I. health card and see which local model is loaded right now (read live). Ask the local tutor a question and notice the reminder: test what it tells you. Confirm the answer came from OUR model, not a vendor.

**Anchor — 1 Thessalonians 5:21; Proverbs 2:6.** Test everything; hold fast what is good — for the Lord gives wisdom. Our A.I. is a tool to be tested, and true wisdom comes from God, not the machine.

### Facilitator guide

**Talking points**
- A.I. runs on OUR NAS (Ollama, open-weights models) — family/church content never goes to a vendor cloud.
- Honest ceiling: CPU-only → ~≤13B comfortably, at CPU speed. Great for small/patient jobs, not heavy real-time reasoning.
- Heavy work waits for the GPU farm (week 7) or escalates to a vendor within a budget, then falls back local (tiered orchestrator).
- THREE BRAKES are mandatory for any autonomous A.I. automation: a budget, a single-instance lock, a kill-switch.
- Same posture as the A.I. class: test the tool, don’t trust it blindly (1 Thess 5:21); wisdom is from God (Prov 2:6).

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read 1 Thessalonians 5:21 and Proverbs 2:6.
- Recap last week (10): a learner explains the VPN tunnel.
- Teach the big idea (15): local-first A.I.; Ollama + open models; the CPU-only ceiling; the three brakes.
- Hands-on with the hardware (25): open the in-app A.I. health card and read the live loaded model; ask the local tutor a question; verify the answer; confirm it ran locally.
- Discussion (15): which jobs fit a small local model, and which must wait for the GPU?
- Send-off + solo task (5): solo task — check the A.I. health card once and note which model was loaded.

**Discussion prompts**
- What does it protect to keep our words on our own A.I. instead of a vendor’s?
- Where’s the honest line between what the NAS can do and what needs a GPU?
- Why are the three brakes non-negotiable for anything that runs on a timer?

---

## Week 7 — Why we’re building a GPU farm — CPU vs GPU and VRAM
*Saturday, 2026-08-29*

**Big idea.** A GPU (a graphics card) has thousands of tiny workers doing the same math at once — exactly what big A.I. needs. The catch is VRAM (the GPU’s own memory): a 70-billion-parameter model needs about 48 GB of it. The NAS has none, so a dedicated GPU box is planned. The church’s video-wall machines (RTX 4070s) are our real GPUs today.

**Lesson.** To understand why we’d spend real money on more hardware, you have to understand the difference between two chips and the one number that gates everything. A CPU has a few powerful cores and is brilliant at doing one complicated job at a time — perfect for running the operating system and our services. A GPU (a graphics card, the kind in gaming PCs) has THOUSANDS of small cores all doing the same kind of math at the same instant — and that massive parallelism is exactly what running an A.I. model needs. But there’s a catch, and it’s the whole story: the model’s "weights" have to FIT inside the GPU’s own memory, called VRAM. A small model fits in a little; a 70-billion-parameter model at common compression needs roughly 48 GB of VRAM to hold. Now the honest picture of what we actually have today — and this is the kind of truth this course refuses to paint over: the mesh has effectively zero always-on GPU power right now. The NAS is CPU-only; the one capable graphics card we own is a creative-work machine that, by decision, always yields to creative production, so it can’t be a dependable shared A.I. host; and the dedicated GPU box is planned but not yet bought. The standing plan (DR-0014) is to build a PoeTech "farm" — two used RTX 3090s giving 48 GB of VRAM, in a chassis sized to add a third card for 72 GB — at around $5,000, plus a separate sovereign church node. We say plainly that this is justified by sovereignty, 70B-class capability, and data control — not by beating a small monthly API bill — so we count the cost soberly, exactly as Luke 14:28 instructs. The real GPUs we have at this moment are the two RTX 4070 machines at the church that drive the video wall; when that wall is idle, they’re our best candidate for local A.I. God filled Bezalel with skill to work every craft (Exodus 35) — knowing your tools, and sizing them honestly, is part of that calling.

**Hands-on with the hardware.** Look at the CPU-vs-GPU diagram and the VRAM ladder. Then at the church, look (don’t touch the running machines) at the left + right RTX 4070 machines that drive the wall — those are real GPUs that could also serve A.I. when the wall is idle.

**Anchor — Exodus 35:30–35; Luke 14:28.** God filled Bezalel with skill to work every craft; and count the cost before you build. Knowing the tools — and sizing them honestly — is a Spirit-given, sober calling.

### Facilitator guide

**Talking points**
- CPU = a few powerful cores (one hard job at a time). GPU = thousands of small cores doing the same math at once — what A.I. needs.
- VRAM is the binding constraint: a 70B-class model needs ~48 GB of the GPU’s own memory to fit.
- HONEST today: effectively zero always-on CUDA — NAS is CPU-only, the 4070 creative box is preempted, the farm is planned/unbought.
- The plan (DR-0014): dual RTX 3090 = 48 GB (→72 GB lane) ~$5k + a separate sovereign church node. Justified by sovereignty, not a small API bill.
- The church’s left + right RTX 4070 wall machines are our REAL GPUs today — a candidate for A.I. when the wall is idle. Exodus 35 / Luke 14:28.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read Exodus 35:30–35 and Luke 14:28.
- Recap last week (10): a learner explains why the NAS runs only small models.
- Teach the big idea (15): CPU vs GPU; VRAM as the constraint; the honest "zero CUDA today" picture; the farm plan.
- Hands-on with the hardware (25): study the CPU-vs-GPU + VRAM-ladder diagrams; at church, LOOK at the left/right 4070 machines driving the wall (don’t touch them live).
- Discussion (15): is the farm worth ~$5k — and on what grounds (not the API bill)?
- Send-off + solo task (5): solo task — explain VRAM to someone in one sentence.

**Discussion prompts**
- In one sentence: why does A.I. love GPUs and only tolerate CPUs?
- Why is VRAM — not raw speed — the thing that decides which models we can run?
- On what honest grounds is the farm justified, if not a cheaper API bill?

---

## Week 8 — The house of God — COLG’s sovereign stack
*Saturday, 2026-09-05*

**Big idea.** The Church of the Living God built a 44,000 sq ft house, serves the largest African American community in Champaign-Urbana, and couldn’t find tech support — so we build it ourselves. The church stack mirrors the home stack: a sovereign NAS, the LED video wall + 4070 machines, and the broadcast — all serving the first community.

**Lesson.** Everything in this course points here, because this is who it’s for. The Church of the Living God is a 44,000-square-foot house that the congregation pulled together to build; it serves the largest African American community in Champaign-Urbana; and its full-time support staff are largely elderly members for whom technology was never a first love. For years the church couldn’t get real technology support from the broader industry — and that gap is exactly why PoeTech exists and why COLG is the named first community we serve. The church stack is the home stack you’ve already learned, carried across the parking lot. It needs its own sovereign NAS — that build is in progress, part of the same hardware plan as the GPU farm, with an encrypted offsite backup relationship to the home box so each protects the other without reading the other’s data. It has the Sanctuary LED video wall, driven by the left and right RTX 4070 machines you met last week. It has the broadcast chain — camera to OBS to encode to stream — which is the whole subject of The Broadcast course, so the two courses meet here. And it will grow surveillance and business systems as they land, with member and financial data always staff-gated behind the isolation walls. The deepest reason we document all of it is that the Church module is meant to GENERALIZE: what we build for COLG becomes a repeatable gift for any church in the same situation. As David told Solomon, "be strong and do the work… God is with you until it is finished" (1 Chronicles 28:20) — and unless the Lord builds the house, the builders labor in vain (Psalm 127:1). We build the house for Him.

**Hands-on with the hardware.** At the church, walk the real stack: the NAS (or where it will live), the booth and the broadcast chain (ties to The Broadcast course), the LED video wall and its left/right machines, and the network. Match what you see to the home stack you already know.

**Anchor — 1 Chronicles 28:20; Psalm 127:1.** Be strong and do the work; do not be afraid — God is with you until it is finished. Unless the Lord builds the house, the builders labor in vain. We build the house for Him.

### Facilitator guide

**Talking points**
- COLG = the named FIRST community: 44,000 sq ft built by the congregation, largest African American community in C-U, elderly staff, no industry support — so we build it.
- The church stack mirrors the home stack: sovereign NAS (build in progress) + LED video wall + the 4070 machines + the broadcast chain.
- Encrypted ISO-2 backup relationship between church and home — each protects the other without reading the other’s data.
- It’s built to GENERALIZE: what we build for COLG becomes a repeatable gift for other churches in the same situation.
- 1 Chron 28:20 / Psalm 127:1 — be strong and do the work; unless the Lord builds the house, the builders labor in vain.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read 1 Chronicles 28:20 and Psalm 127:1.
- Recap last week (10): a learner explains CPU vs GPU + VRAM.
- Teach the big idea (15): COLG’s story + need; the church stack as the home pattern; how it generalizes.
- Hands-on with the hardware (25): walk the church — find the NAS spot, the booth + broadcast chain, the video wall + 4070 machines, the network; map each to its home-stack twin.
- Discussion (15): what does our church need most next, and which home-stack pattern covers it?
- Send-off + solo task (5): solo task — name one thing we can build for COLG that another church could reuse.

**Discussion prompts**
- Why is it right that COLG is the FIRST community we serve?
- Which part of the church stack maps to which part of the home stack?
- How does building it sovereign for COLG become a gift for other churches?

---

## Week 9 — Keeping it alive — health, alerts, and the three brakes
*Saturday, 2026-09-12*

**Big idea.** Owning the iron means keeping it healthy. The system watches itself: health checks on every workflow, push alerts (ntfy) so it tells YOU when something’s wrong, and the in-app health cards that read live. And any automation that runs on a timer carries three brakes so it can never run away.

**Lesson.** Owning the iron means you also own keeping it alive — and the mature way to do that is to make the system watch itself and TELL you, rather than relying on someone to go looking. That’s the perpetual-pipeline-health discipline, and it’s concrete: every workflow has a health check; every call out to something external is wrapped so a failure is caught, not silent; jobs are written to be safely re-runnable; backups run daily; and the whole thing is monitored. Crucially, the system pushes alerts to a phone through ntfy — our own notifier running on the NAS — so when something breaks (or even when a build moves), it surfaces immediately, and a failed alert is pushed at high priority so it can’t be missed. You can also just look: the in-app Infrastructure inventory and the A.I. health card read real probes off the live system — the NAS, the network controller, the VPN status, the local model — and they honestly say "not connected" or "stale" instead of inventing a comforting number. Finally, the hardest-won rule in this whole course, paid for by a real incident: any automation that runs on its own — on a timer, or anything that can spawn more work — must carry three brakes. A budget ceiling, so a runaway stops itself. A single-instance lock, so a new run never piles on top of a stuck one. And a kill-switch, so it pauses on overrun instead of charging ahead. And it ships turned OFF, switched on only with someone watching. We learned that because an unbraked fleet once ran away unattended and had to be shut down by hand. "Who then is the faithful and wise manager?" (Luke 12:42) — the one who keeps a watch day and night (Nehemiah 4:9).

**Hands-on with the hardware.** Open the in-app Infrastructure inventory and the A.I. health card — read the live state (storage, model, what’s stale). On a phone, see what an ntfy push looks like. Find one thing the system would flag and explain how you’d know.

**Anchor — Luke 12:42; Nehemiah 4:9.** Who then is the faithful and wise manager? They prayed and set a watch day and night. Watchfulness — a watch that never sleeps — is faithful stewardship.

### Facilitator guide

**Talking points**
- Keeping it alive is part of owning it: a health check per workflow, try-catch on external I/O, idempotent jobs, daily backups, monitoring.
- The system TELLS you: ntfy push alerts from the NAS (failed triggers go high-priority) so problems surface instead of hiding.
- Live + honest: the in-app Infrastructure inventory + A.I. health cards read real probes and say "not connected/stale" rather than paint a number.
- THE THREE BRAKES (paid for by a real runaway): a budget ceiling, a single-instance lock, a kill-switch — and ship it INACTIVE.
- Luke 12:42 / Nehemiah 4:9 — the faithful manager keeps a watch day and night.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read Luke 12:42 and Nehemiah 4:9.
- Recap last week (10): a learner maps a church part to its home twin.
- Teach the big idea (15): self-watching system; ntfy alerts; live health cards; the three brakes + the incident behind them.
- Hands-on with the hardware (25): open the Infrastructure inventory + A.I. health cards and read live state; see an ntfy push on a phone; name one thing the system would flag.
- Discussion (15): what should ALWAYS raise an alert, and who should it reach?
- Send-off + solo task (5): solo task — watch for one ntfy alert this week and note what it told you.

**Discussion prompts**
- Why is "the system tells you" better than "someone remembers to check"?
- Which live number, if it went red, would matter most — and why?
- Why does every timer-driven automation need all three brakes, not just one?

---

## Week 10 — Build it right — and raise the next builders
*Saturday, 2026-09-19*

**Big idea.** Sovereignty is stewardship: we build to a high standard because the family and the church depend on it, and we hand it on. You truly own a part of the stack when you can teach it. Founders raise founders — and the media team builds and runs BOTH infrastructures.

**Lesson.** This is the commissioning, and it ties the whole course together under one word: stewardship. We build the infrastructure to a high standard not to impress anyone, but because the family and the church genuinely depend on it — and a steward’s job is to be found faithful with what they’ve been given. Two marks separate a mature build from a lucky one. The first is reliability: excellence isn’t one good day, it’s a stack that works every single day, which is why we write down run-of-show and checklists and capture POV SOPs so nothing rides on one person’s memory — the very same SOP library the broadcast team uses. The second is multiplication: the proof that you truly own a part of the stack is that you can teach it. That’s why this course, like its sisters, ends by sending you to teach: pick the part you understand best, write its simple checklist or record your sequence, and explain it to one other person. This is also where the media team’s real, expanded role is named plainly: the same team that builds and runs the broadcast builds and runs BOTH infrastructures — the home stack and the church stack — capturing the sequences, teaching the next operators, and keeping the iron alive. Paul told Timothy to entrust what he’d learned "to faithful people who will be able to teach others also" (2 Timothy 2:2), and we do all of it heartily, as for the Lord and not for men (Colossians 3:23). Founders raise founders; the stack — and the calling under it — outlasts any one of us.

**Hands-on with the hardware.** Pick one part of the stack you now understand. Write its simple checklist (or record a POV SOP). Then explain it to one other person — your name goes on the helper list for the next cohort.

**Anchor — 2 Timothy 2:2; Colossians 3:23.** Entrust what you’ve learned to faithful people who can teach others; whatever you do, work heartily as for the Lord. The work is handed on, and it’s done for Him.

### Facilitator guide

**Talking points**
- Sovereignty is stewardship: we build to a high standard because the family + church depend on it, and we hand it on.
- Two marks of a mature build: reliability (works every day, documented) and multiplication (you can teach it).
- Write checklists + capture POV SOPs (the same library the broadcast team uses) so nothing rides on one person’s memory.
- Name the media team’s expanded role: the team that runs the broadcast builds + runs BOTH infrastructures, home and church.
- 2 Timothy 2:2 / Colossians 3:23 — entrust it to faithful people; work as for the Lord. Founders raise founders.

**How to run the 75 minutes**
- Prayer + the anchor (5): pray; read 2 Timothy 2:2 and Colossians 3:23.
- Recap last week (10): a learner explains the three brakes.
- Teach the big idea (15): stewardship; reliability + multiplication; the media team’s expanded role across both stacks.
- Hands-on with the hardware (25): each learner picks one part of the stack, writes its checklist or records a POV SOP, and teaches it to one other person.
- Discussion (15): which part will you own and teach, and who will you teach it to?
- Send-off + solo task (5): commission them — teach your part to one person and put your name on the next-cohort helper list.

**Discussion prompts**
- Which part of the stack do you understand well enough to teach simply?
- What’s the difference between a stack that works once and one that works every day?
- What does it mean that the broadcast team also builds and runs the infrastructure?

---

## Sequence / SOP Library — POV capture

Each station’s real procedure is captured first-person (POV) and paired with a written step-checklist. The clips are captured with the smart glasses; until then, the checklists below stand on their own.

**Sovereign pipeline.** (1) Capture first-person at the station with "Hey Meta" voice command — the team and the gear, never the congregation. (2) For a long procedure, chain several ~3-min clips in order (the ~3-min cap means long sequences are multi-clip). (3) Pull the raw media OFF the glasses into the family NAS / sovereign store (capture-only device; charge between sessions). (4) The LOCAL LLM (Ollama on the NAS) transcribes + captions + indexes it — never Meta’s cloud or A.I. for content. (5) Auto-draft a step-checklist from the transcript; a human corrects and approves it. (6) Index the clips + checklist into this Sequence / SOP Library for the next operator.

**Consent.** Captures the team and the procedures only. Never the congregation. A training tool, not surveillance.

### Powering up and health-checking the Synology NAS
*Home NAS · Darrell (with Christian)*

_The NAS is the brain and the barn of the home stack — services and the family’s data live on it. Capture the calm, correct power-up and health check so a newcomer (or Christian) can confirm it’s healthy without guessing._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Confirm power and network are connected before pressing the power button.
- Power on; watch the front status light come up healthy (not amber/red).
- Sign in to DSM and check System Health: storage, temperature, and that no drive shows a warning.
- Confirm the key services are running (n8n, Ollama, Drive/Chat/Photos).
- Note anything off for follow-up. Never pull a drive while it is running.

### Replacing a failed drive without losing data
*Storage / RAID · Darrell (with a parent supervising any child)*

_Disks fail; RAID is what lets the family NOT lose data when one does. Capture the exact, careful swap so a degraded array gets repaired right — the highest-stakes routine on the box._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- In DSM Storage Manager, confirm WHICH bay is degraded before touching anything.
- Verify a current backup exists (ISO-2 offsite) before starting — never rely on the array alone mid-repair.
- Remove ONLY the identified failed drive; insert the matching replacement firmly into that bay.
- Start the repair/rebuild and let it finish completely — do not power-cycle during a rebuild.
- Confirm the array returns to Healthy and the backup job still runs green.

### Bringing up the UniFi UCG-Max and its VLAN walls
*Network gateway · Darrell*

_The gateway is the front door AND the interior walls of the whole network. Capture how the VLAN segments (family, COLG, TLC, Poe Properties, PoeTech) are set so each stays walled off from the others._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Confirm the WAN (internet) cable in and the LAN cables out, and that the gateway is adopted in UniFi.
- Verify each VLAN exists and is mapped to its purpose (family / COLG / TLC / Properties / PoeTech).
- Confirm devices land on the RIGHT VLAN and cannot reach a VLAN they shouldn’t.
- Check the reverse-proxy / friendly DNS names resolve to the NAS services.
- Document any change; a wall you can’t explain is a wall you can’t trust.

### Onboarding a device to remote access (Tailscale / WireGuard)
*Remote access · Darrell (with Christian)*

_Reaching the stack from anywhere — safely — is what makes it usable on the road without exposing the front door to the world. Capture how a new device is added and verified._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Install the access client and sign in with the correct identity.
- Confirm the device appears as an online node and can reach the NAS over the private path.
- Verify it canNOT reach anything it shouldn’t (least access for the role).
- For a client/contractor/tenant, use the WireGuard path, NOT the family tailnet.
- Remove the device cleanly when access is no longer needed.

### Pulling and running a local model on the NAS (Ollama)
*Local A.I. · Darrell*

_The local A.I. is sovereign — the family’s and church’s content never goes to a vendor cloud. Capture how a model is pulled and served, and how to confirm it’s actually answering locally._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Confirm the box has the RAM headroom for the model size you’re pulling (CPU-only ceiling).
- Pull the open-weights model with Ollama and confirm it loaded.
- Send a test prompt and confirm the reply comes from the LOCAL model, not a vendor.
- Confirm any automation that uses it has its three brakes (budget, single-instance lock, kill-switch).
- Watch resource use; never leave a model pinned/looping unattended.

### Verifying the offsite (ISO-2) encrypted backup
*Backups · Darrell*

_A backup you’ve never restored is a hope, not a backup. Capture the routine that proves the encrypted offsite copy on the church NAS is real, current, and restorable._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Confirm the backup job ran on schedule and reported success (not just "configured").
- Confirm the offsite copy on the church NAS is the encrypted sealed blob (isolation walls hold both ways).
- Do a test restore of a small file and confirm it comes back intact.
- Confirm the 3-2-1 shape still holds (3 copies, 2 media, 1 offsite).
- Log the verification date so the next check knows the last good restore.

### The COLG sovereign NAS build
*Church (COLG) NAS · The build team · founding sequence*

_COLG is the first community we serve. Its sovereign box doesn’t fully exist yet — capturing the build as it happens turns a one-time effort into a repeatable SOP for the next church in the same situation._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Health-check the church NAS hardware and confirm it’s powered, networked, and reachable.
- Stand up the sovereign services the church needs (storage, the local services spine).
- Wire the encrypted backup relationship with the home stack (ISO-2, sealed blob only).
- Confirm member/financial data stays staff-gated and walled per the isolation rules.
- Document every step so another church’s build is a checklist, not a mystery.

### Bringing up the church’s RTX 4070 wall machines
*Church video wall machines · The build team*

_The left and right RTX 4070 machines drive the Sanctuary video wall and are the church’s real GPU capacity. Capture the power-up + verification order so the wall comes up correctly and the GPUs are doing the work._

**Clip:** not captured yet (pending POV capture)

**Checklist**
- Power up in order: displays, then the left and right machines, then the signal source.
- Confirm each machine outputs to its screen and the GPU (not just the CPU) carries the display.
- Confirm the broadcast feed reaches the wall and matches what the room sees (ties to The Broadcast course).
- Check network (Cat6) and storage (NVMe) are healthy before relying on the wall live.
- Note these GPUs as the church’s candidate for future local A.I. work when the wall is idle.


---

_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. We own the iron so the data serves the family and the community — never the other way around. Built to be handed on, at every age._
