# Love Corner Dev/Ops team — recruitment (on rails that already exist)

**Recorded:** 2026-07-12 · **Source:** DP — "Recruitment for the Love Corner Dev/Ops
team etc." Paired with the standing value he restated: **"No stress for the staff
when possible... easy systems to eliminate human failures whenever possible."**
**Status:** plan; rides DR-0161 (gifts-and-placement) — mostly config, little new
plumbing. Outward placement is Tier C (DATA-EMPOWERMENT consent-gated).

## Reality-trace — the recruitment engine already exists

- **DR-0161 — Ari runs the gifts-and-placement process** (`?view=opportunities`,
  "Skills Analysis"): a guided, conversational assessment across four dimensions —
  **skills & experience · working style · the gifts the Word names (Rom 12 / 1 Cor
  12 / Eph 4 / 1 Pet 4) · availability & burden** — that fills real rows and
  **matches people to community-role registries.** Tier B in-app; **Tier C for
  anything outward** (sharing a profile with a serve-team lead), consent-gated.
- **CommandServeCenter** — the "Serve" faculty of the cockpit (command in order to
  SERVE and steward).
- **interest-sync / ministry_signups / skill profiles** — real capture + join rails.

So recruitment for the Dev/Ops team is **not a new system** — it's (a) a **role
registry** for the team and (b) an **intake path** that routes an interested person
into the DR-0161 assessment, then a **steward view** of matched candidates.

## The design (config on the existing rails)

1. **Define the Love Corner Dev/Ops role registry** — the real roles the church tech
   ministry needs, each with the gifts/skills it draws on, so DR-0161's matcher can
   place people. From the church's actual work (broadcast-class, led-wall, devices,
   the app, giving-count): **Broadcast / livestream operator · Sound / audio ·
   LED-wall & booth · Camera · App & data steward · Giving-count steward (two-person
   rule) · Slides / media · Network / NAS caretaker.** Each names the gift it leans on
   (helps, administration, teaching…) and its stress-lowering "easy system" (so a role
   is paired with the tool that removes its drudgery — the giving-count steward gets
   the Record Giving tab + the self-computing report).
2. **A "Serve on the Dev/Ops team" entry** (on the church door + CommandServeCenter)
   → routes into Ari's gifts-and-placement conversation (DR-0161), pre-tagged to the
   Dev/Ops registry. No homework — spoken or typed, Ari hears first.
3. **A steward view** of interested people matched to open roles (Tier C, consent-
   gated: a candidate's profile is shared with a team lead only with their consent).
   Rides `ministry_signups` for the actual join.
4. **Ties to the stress value (DP):** every role is recruited *with* its easy-system
   attached — you don't recruit a counter into hand-tallying, you recruit them into a
   tab that computes the total and prints the report. Recruitment and
   failure-elimination are the same move.

## Governance

Placement outward (profile → team lead, aggregated views) is **Tier C**, consent-
gated per DATA-EMPOWERMENT; the in-app assessment is Tier B (soaks on preview). The
gifts dimension is senior to any secular instrument for church placement (DR-0161);
personality style is held honestly, never claimed clinically (DR-0100).

## First slice (next build)

The **Dev/Ops role registry** (`lib/` config: roles + gifts + the easy-system each
carries) + the "Serve on the Dev/Ops team" entry routing into DR-0161. Proven-to-
catch: every role names a real gift and a real in-app system. The steward matched-
candidates view + consent-gated sharing follow (Tier C).

## Pairs with

DR-0161 (gifts-and-placement), DR-0157 (Ari's duties), CommandServeCenter (Serve),
COMMUNITY-FIRST (placement serves the overlooked first), and the giving builds
(the count-steward role's easy system is already shipped).
