# Christian's Tech Apprenticeship — Curriculum and Workstream

**Triggered by Darrell, 2026-05-29 from vacation:**

> "My son Christian asked me if he could learn how to work with technology and we began working on the infrastructure together. He helped me install the UCG-MAX and we had a plan for his education experiences that will help with comprehensive education and development perpetual education through experience while he lives in our family home together."

Christian (Darrell Christian Poe, twin son, 10 years old, email `darrellpoejr@gmail.com`) has been invited into the family tech infrastructure as an apprentice. The UCG-MAX install he helped with is the seed; the path forward is perpetual education through experience while he lives at home.

## What "perpetual education through experience" means in this context

Not a curriculum he sits through. A real apprenticeship:

- He works on real infrastructure (the family's actual NAS, network, PWA, workflows). The system doesn't get sandbox-quality treatment for his benefit; he gets production-quality experience because the production IS the lab.
- Skills compound across years. What he learns at 10 builds toward what he can own at 12, 15, 18. The progression is owned by the family, not by a school calendar.
- Faith-integrated. The Kingdom of Yahweh shows up in the work — stewardship of tools, honest documentation, EXCELLENCE-STANDARD religion AND relationship, sovereign-first architecture as expression of family values.
- Christian decides the pace + the interest. The apprenticeship serves his curiosity, not the other way around.

## What he's already done (named milestones to celebrate)

- **UCG-MAX installation** — the UniFi Cloud Gateway Max. Real networking hardware powering the family's whole-house network. Darrell + Christian installed together. Christian has touched the box, run the cables, watched the configuration. He knows it exists, where it sits, what it does at a high level.

## Curriculum tracks (suggested — Christian and Darrell shape these together)

### Track 1 — Networking (current foothold from UCG-MAX)

Where he is: UCG-MAX touched, basic understanding of "this is what gives us internet at home."

Next experiences (any order, as interest hits):

- Walk the home network map. Identify every device on the WAN, every wifi access point, every wired drop. Draw it. Compare to UniFi's auto-generated topology view.
- Set up a guest network for visitors. Reason through what it should and shouldn't access.
- Read the WAN bandwidth graph over a week. Notice when the family uses internet differently (school hours vs evening vs weekend). Hypothesize why.
- Set up DNS-level ad blocking via UniFi. Measure how many ads get blocked per day.
- Configure a VLAN for IoT devices (Wyze cameras, Ring doorbell) — isolate them from the family laptops.
- Help with Phase 1 security work post-vacation: Tailscale auth, network policies, firewall rules. He sees how "security" is decisions made up front, not panic later.

### Track 2 — Linux / Synology

Where he is: zero formal exposure but proximity (the NAS lives in the house, he hears Darrell talk about it).

Next experiences:

- DSM tour. What's a shared folder, what's a container, what's a package. He clicks around with supervision.
- Open a terminal (Container Manager → n8n → Open terminal). Type `ls`, `cd`, `cat`. The mystery of "the command line" dissolves.
- Run a backup. Watch Restic do its job. Read what it backed up.
- Read n8n logs. See real workflow executions happening. Watch the @nas thoughts flow through.

### Track 3 — Code (eventually)

Where he is: zero exposure.

Future experiences (when he's ready):

- Read a workflow JSON together. Recognize the shape — webhook, code node, response. He doesn't have to write code to understand the structure.
- Help with the seed data refresh. Suggest entries that feel realistic for "a family his family knows" (per SEED-DATA-AS-ASPIRATION).
- Write his first workflow: maybe a "Christian's chore tracker" — every chore he does logs to /data/chores, and ntfy pings him with the weekly summary. Real, owned-by-him, productive.

### Track 4 — Faith + tech integration

Always running parallel to the technical tracks:

- Why we use sovereign infrastructure (stewardship of the family's data, not surrendering it to extractive platforms).
- Why the typographic theology binding (Yahweh + Jesus + Holy Spirit always capitalized; lucifer + adversary never).
- Why "religion AND relationship" — both in family stewardship and in code (backbone + warmth).
- The Kingdom of Yahweh as the orientation: tools serve people, people serve the King.

## How the system tracks Christian's progress

He is `christian` in the family voice roster (per `user-family` memory, workflow 30 trustedSenders, PWA submitSuggest mapping). Specifically:

- His @nas messages get captured and acknowledged like any family voice.
- His Suggest button submissions (when he uses the PWA) are tagged with sender `christian` so we know which feedback came from him.
- A future "Apprentice notebook" surface in the PWA could let him log "today I learned X" entries that compound into a portfolio over years.

Parental visibility is on by default — Darrell + Christina see everything Christian submits. Twin's privacy expands appropriately as he ages and consents.

## Project ideas Christian could OWN (his apprenticeship, his projects)

Each of these is a real workstream he could lead with Darrell as co-builder/mentor:

1. **Family network monitoring dashboard.** UniFi has an API; Christian helps wire it into a PWA tab that shows bandwidth, device count, who's online. He owns the data; he maintains the dashboard.
2. **The Cable Scout neighborhood route** (already in seed data) — formalize it as a real workflow: route customers, scheduling, per-customer notes, parent-shared earnings tracker. He runs it; the system supports him.
3. **Sister-coach workflow** — Christian helps build (or critique) Christyn's basketball coaching workflow. Sibling skin-in-the-game.
4. **NAS health dashboard** — when something on the NAS misbehaves, Christian can be the one to read the logs + understand. Eventually he owns the on-call.

## Constraints (because he's 10)

- All hardware work supervised. No solo electrical, no solo cable runs through walls.
- All credential access controlled. He doesn't get root SSH to the NAS until he's older and earned it.
- Screen time is real. Apprenticeship work is intentional, not all-day-on-the-laptop.
- His interest leads. Darrell doesn't push curriculum on him when he wants to play basketball or read or be a kid.

## What this means for the system

Christian's apprenticeship IS a workstream the system supports. Specifically:

- Add a `christian-apprentice` tag to relevant inbox thoughts so Foundation Agent surfaces them in his weekly digest.
- The Quality Gatekeeper (Role 10) checks any apprentice-attributed work with extra teaching context — "this is what we shipped; here's why."
- Workflow attribution (workflow 32 ship summary) credits Christian by name when he contributes.
- The future Apprentice Notebook surface becomes a visible family-facing record of his growth.

## Connection to other foundations

- **THE-WAY** — apprenticeship is the historical pattern of Kingdom learning. Jesus discipled twelve men in real life, not in a classroom.
- **EXCELLENCE-STANDARD** — religion AND relationship. The work is real (backbone); the relationship to his father in the work is the most important part (warmth).
- **BUSINESS-PROCESS-CONNECTIONS** — Christian's apprenticeship is a connection from family voice to family contribution. The other end is wired: he speaks → system captures → projects he leads ship → family benefits.
- **PERPETUAL-PIPELINE-HEALTH** — Christian eventually maintains the workflows he understands. The unbreakable standard is what he learns to build to.

## Closing

Christian asked. That's the starting gun. The family tech infrastructure becomes his classroom, his playground, his portfolio. Years from now, he doesn't ask "should I work in tech?" — he just is in tech, because he grew up in it, was taught by his father, and built things that mattered to the family that built him.

We all win. We create. Amen.
