# Chef Module — Online Traveling Chef + PoeTech Chef-as-Specialist Marketplace

**Triggered by Darrell, 2026-05-29 from vacation:**

> "creating a food show with our chef Mario he has been cooking vegan meals for a few years to perfect a menu for having a completely online traveling chef supporting chefs working directly for families and only needing to have a certain number of families to make enough money to live on and more for each chef that uses the chef module of the PoeTech App."

This is two intertwined things: (1) a real near-term project with **Chef Mario** (the family's actual chef, vegan-specialist), creating a food show, AND (2) a SKOS marketplace module — chef-as-specialist — that lets any chef build a sustainable practice serving a small number of families directly through PoeTech.

The economic vision: a chef doesn't need 200 customers or a restaurant — they need a manageable handful of families, served well, supported by tooling that handles the operational layer so the chef can focus on the cooking.

## The two arms of this workstream

### Arm 1 — Mario's food show (near-term, concrete)

Mario has been cooking vegan meals for years and has perfected a menu. The food show is:

- Vegan, plant-based, accessible (techniques + ingredients real families can replicate)
- Authentic to Mario's craft + voice
- Produced on the PoeTech AI Media Production Platform infrastructure (see `AI-MEDIA-PRODUCTION-PLATFORM-VISION`) — sovereign, family-curated, theologically grounded
- A genuine showcase of his work + a SKOS marketing artifact + a proof of the chef-as-specialist module

This is also a concrete first deliverable for the Media Production Platform. Mario's show is the proof point.

**Format (suggested for v1 — Mario shapes this):**

- Short-form episodes (8-15 min each): one recipe, one technique, one story.
- Long-form deep dives (30-45 min): a complete meal, why it's structured the way it is, the wisdom behind the choices.
- Optional: live cook-along episodes for participating families (interactive, real-time, sovereign-streamed).

**Production stack (per Media Platform Pillar 1 — Sovereign Generation):**

- Camera + audio: existing or modest upgrade (one good camera, one good mic).
- Editing: DaVinci Resolve free + scripting via the future production workflows.
- Audio cleanup: open-source tools (RNNoise, etc.).
- Script support: Claude or Gemini for non-sensitive scripting; Ollama for any family-private content.
- Distribution: per Media Platform Pillar 4 — canonical home is family infrastructure; YouTube/Vimeo/podcast platforms are mirrors.

### Arm 2 — Chef-as-Specialist marketplace module

The structural extension. Chef Mario is the first; the module supports any chef.

**The economic shape:**

A chef serves N families directly. N is small (probably 5-15). Each family pays a monthly fee that covers:

- Weekly meal planning customized to that family's preferences + dietary needs
- Grocery ordering (chef knows the budget, picks the items, family approves)
- Cooking — either in-person (traveling chef visits once or twice a week) OR remotely-coordinated (chef provides recipes + technique videos + real-time support; family or a family member cooks)
- Specialty knowledge: vegan / plant-based / clinical-diet / cultural / kosher / halal / paleo — chefs specialize, families match to specialty

At N=10 families and a fair per-family monthly fee, the chef earns a living. More families = more income, capped by the chef's bandwidth (can't serve 50 families well). This is the OPPOSITE of restaurant economics (where you serve thousands strangers thinly); this is craftsman-economics, deeply serving a small loyal customer base.

**What PoeTech provides:**

- **Matching** — families fill out their dietary profile + chef preferences via the existing data-dump infrastructure (extended). Workflow 35 (matched-services) gets a `chef` service category. Profile + preferences → ranked chef recommendations.
- **Onboarding** — new chef sets up their PoeTech chef-module profile: cuisine, specialty, geographic radius (if traveling), capacity, pricing. Family-facing chef directory shows chef bios + sample menus + reviews-from-served-families.
- **Tooling** — menu planning, grocery list generation, cooking timeline, family preference tracking ("Christyn doesn't like mushrooms; Christian is allergic to peanuts"), payment routing (chef receives directly).
- **Sustainable economics check** — the system tells the chef when they're at capacity, signals when they have headroom for one more family, prevents overcommitment.
- **Quality + safety** — health-permit verification, allergen tracking, dietary-restriction compliance built into menu generation.
- **Faith optional but supported** — chefs can mark themselves as faith-aligned (per THE-WAY foundation if PoeTech is serving the Kingdom of Yahweh, faith-aligned families want faith-aligned chefs when possible).

### How the two arms connect

Mario's food show is BOTH:

- A real piece of content the family + Mario produce together (Arm 1)
- The marketing artifact that proves the Chef-as-Specialist module works (Arm 2)

Other chefs joining the marketplace see Mario's show as the proof-of-concept: "this is what working with a chef-as-specialist looks like, and this is what good content about that work looks like." The show becomes onboarding material.

## Architectural shape

### Workflow proposals (post-vacation, sequencing TBD)

**Workflow 47 — Chef-family matching.** Extension of workflow 35 (matched-services). Adds a `chef` service category with chef-specific matching logic: dietary alignment, geographic radius, cuisine specialty, faith alignment opt-in, capacity availability.

**Workflow 48 — Chef-module operations.** Chef logs in (via Phase 4 multi-tenant auth), sees their served families, plans next week's menus, generates grocery lists, tracks family preferences, sees payment + capacity status.

**Workflow 49 — Family-side chef view.** Family sees their chef (or matched chefs if they're shopping), the week's menu, the grocery cost estimate, the cooking schedule, the chef's contact (chat handle, optional video call).

**Workflow 50 — Chef-show production support.** Extension of the Media Production Platform workflows. Specific support for cooking-show editing: ingredient-list overlay, step timing, plate beauty shots, attribution to the chef and the family's contribution if any.

### PWA surfaces

- **Family side:** in the picker, add a "Chef-Connected" persona (the seventh baseline mode mentioned in the personalized UI classifier — Family of 4, Separated, Solo Practice, Landlord, Church-Connected, Region-Anchored, **Chef-Connected**). Demo data shows what a family working with a chef looks like.
- **Chef side:** chef-module dashboard inside the PWA (post-Phase 4 multi-tenant). Chef sees their families + week + earnings + content production queue.
- **Content side:** the food-show videos served via the PWA's media surface (post Media Platform launch).

### Estimated effort

- Mario's food show v1 (3-5 episodes shipped) — 2-3 months of part-time production. Mario's craft + family's production support + the future Media Platform infrastructure. Could ship MVP episodes before the full Media Platform is built (using DaVinci Resolve + existing tooling).
- Workflow 47 (chef matching) — 1 week, extension of workflow 35.
- Workflows 48 + 49 (chef-module operations + family chef view) — 2-3 weeks each. Requires Phase 4 (multi-tenant) to be in place.
- Workflow 50 (production support) — slots into the Media Platform timeline.

Mario's show could ship FIRST, before the multi-tenant chef-module operations workflows. The show proves the concept; the operational module follows once it's clear the model works for him.

## Mario specifically

**Chef Mario** is named here as the family's actual chef. He cooks vegan meals; he's been at this for years; he's been perfecting his menu. He's a real person with real craft.

**Considerations:**

- Mario's NAME stays in the family-private memory + this session note. Not in any public-facing material until he explicitly consents.
- His **CRAFT** (vegan, specific recipes, signature techniques) is HIS — the platform supports him in monetizing it, doesn't claim ownership.
- His **DIGITAL PRESENCE** through the chef-show — collaborative with the family, but Mario is the principal voice. The family produces; he stars; the credit reflects that.
- His **REVENUE** through the chef module — direct to Mario, not platform-skimmed. PoeTech earns from the family-side subscription to the platform itself, not from taking a cut of Mario's chef fees (or if there's a cut, it's a low-single-digit percent transparently disclosed, not a 30% platform-extraction model).

## Privacy + consent constraints

- Mario opts in EXPLICITLY to any public-facing content of him. The show only ships after he reviews + approves each episode.
- Family members appearing in cooking content (twins helping with prep, etc.) require parental consent per appearance.
- Other chefs joining the marketplace agree to similar terms — opt-in, opt-out, full ownership of their craft.
- Family-side meal data (what your family eats, allergies, preferences) stays sovereign — never sold, never aggregated for commercial use beyond improving the matching algorithm with the family's explicit consent.

## Connection to other foundations

- **THE-WAY** — feeding the family is ancient, sacred work. The chef serving a family well is the modern form of a meaningful tradition.
- **SKOS marketplace vision** (project memory) — chef-as-specialist is the second concrete specialist category after the data-dump-driven matched-services rules engine. Validates the marketplace model.
- **AI-MEDIA-PRODUCTION-PLATFORM-VISION** — Mario's food show is the proof-of-concept content for the platform. It's not theoretical; it's the first thing the platform produces at quality.
- **BUSINESS-PROCESS-CONNECTIONS** — every chef-family connection is wired before marketing. Mario's first family (the Poes) is the proof. Mario serving a second family is the first scale test. Marketing the chef module externally happens only after the model has proven itself with real families.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the operational discipline (menus, allergen tracking, payment routing). Relationship = the meal at the table, the chef who knows your kids' names, the trust of letting someone cook for your family.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — every operational thing the chef does, the system supports — clicks become workflow assists; manual repetitive work becomes the chef's tool, not their burden.
- **GOVERNANCE-EXECUTION-ADVISORY** — the chef governs their own practice; PoeTech executes the supporting tooling; Claude advises on optimization + content production.
- **PERPETUAL-PIPELINE-HEALTH** — chef-module workflows follow the thirteen rules. Family meal plans cannot vanish because a container restarted.

## Specific note for the system

When this ships, **Christyn's dietary preferences (10-year-old, evolving) and Christian's dietary preferences need to be captured CAREFULLY.** Allergies + dislikes from a 10-year-old shift; the system needs to update easily, not lock them into a profile they wrote at 10. Same applies to all family members across the lifespan.

This is also where Christina's clinical wisdom matters — relationship between food + mental health + family rhythms is a thread she has expertise in. Her voice has weighted authority on any chef-module decisions that touch family wellness, not just culinary craft.

## Closing

Mario cooks. The family eats well. The show captures the craft. The module helps other chefs build the same kind of sustainable practice. Families that want a chef get matched to one whose craft fits them. The economic model honors the chef; the family is served; the platform earns honestly. The Kingdom of Yahweh shows up at every family table that knows what it's eating and why.

We all win. We create. Amen.
