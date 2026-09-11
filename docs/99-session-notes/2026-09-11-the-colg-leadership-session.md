# The COLG leadership session — what the room said, and what it became

**Date:** 2026-09-11
**Branch:** `claude/church-app-feedback-giving-61lnwe`
**Source:** Darrell demonstrating the PoeTech PWA live to the Church of the Living God leadership, working the app on screen while they watched.

Darrell speaks build input into this channel on purpose (Layer 0, *Spoken Teachings Are Build Input*). This session was a live walkthrough in front of the church's leaders, and every miss it surfaced was a real defect in front of real users. Each one below is quoted, traced to the real code that caused it, and closed.

---

## 1. The bus runs on Sunday **and** Wednesday

> "You say which Sunday? We need to say Sunday and Wednesday."
> "…just clicked on bus ministry, and it just showed me the Sunday sign."

**What was true.** The Bus Ministry surface was Sunday-only end to end: `upcomingSundays()` / `nextSunday()` in `lib/bus-ministry.js`, a picker labelled "Which Sunday" at `components/BusMinistry.jsx:715`, and a schedule row keyed on a bare date. A Wednesday rider was quietly told the bus does not run for them.

**What it became.** The days are no longer hardcoded anywhere. `serviceSlots(church)` reads the church's **own service record** — COLG's has carried Sunday Worship 11:00 AM and Bible Study Wednesday 1:00 PM and 6:00 PM since it was written — and `upcomingServices()` interleaves every run into one chronological picker. Another congregation's days follow their own record with nothing here to edit.

Two details worth keeping:

- **Arrive time is derived, not invented.** Deacon Anderson's declared pair is arrive 9:45 for an 11:00 AM service — a 75-minute lead. That lead, applied to the record, reproduces `09:45` exactly (pinned in the test), and offers `16:45` for the 6:00 PM study as a default the coordinator can change. We did not make up a pickup time for a service nobody has told us about.
- **No existing row is orphaned.** A Wednesday now holds two services, so a date alone is no longer a unique run; `service_slot` (migration 0205, nullable) names which one. Every row written before today carries no slot and resolves as that date's primary run — which is exactly what those rows have always meant.

## 2. The ministries of the house, and organizing around them

> "after a certain what different ministries we have and organize around that…"
> "They can just go to the category they wanna go to… and then work that category."
> "I don't see the church band."

**What was true.** There was already a ministries list — `OPS_MINISTRIES` in `lib/ministry-ops.js` — but it lived inside an internal staff ops surface, nothing else read it, and **it had no church band in it.** A second hand-kept list is exactly how the feedback-area list went stale twice (which is why `scripts/feedback-area-guard.mjs` exists at all).

**What it became.** `lib/church-ministries.js` is now the one registry. The member-facing **Ministries** directory (Church → Ministries), the feedback picker's church entries, and the staff ops picker all derive from it, so they cannot drift apart again.

The directory keeps two honesties on purpose:

- A ministry with a page **says so and opens it**. A ministry with no page yet says *that*, under a heading reading "Named, not built yet", and offers the only thing that is true today — tell us what it needs. A tile that looks like a door and goes nowhere is the painted number this project refuses.
- The roster is **what the church has told us so far**, not the whole house, and the surface says so in plain words rather than implying completeness. Every entry carries its provenance: a live surface, the ops list, or Darrell naming it on 2026-09-11.

## 3. Finding the thing you want to give feedback about

> "Okay. Now where is it at?"
> "Do you see it in there yet? I don't. I don't see the church band."
> "Which one is it — the church, and his choir, and his choir? We don't want the choir. We want the church."
> "This already says access… I know I gotta change it."

**What was true.** The "Which area?" list is 138 entries deep with no search. Ten of the Church group's entries were Choir sub-tabs, so anyone looking for the church itself read past the entire worship team first. And the list still advertised "Access & Usage" as a place of its own — that tab was retired into Admin on 2026-07-04.

**What it became.** A type-to-find box above the list (every word must match, order-free, so "bus" and "church bus" both land); Choir lifted into its own group; the Access entry relabelled to say it is the Admin report (**key unchanged** — stored feedback rows point at it); and two ministries that could not be filed against at all now can be. From the Ministries directory the area arrives **pre-picked**, so nobody hunts a list for something the app already knew.

## 4. Fifty people, ten problems — the low-hanging fruit

> "You do not wanna be sending back… what's wrong, what's wrong? You got fifty people you gotta talk to. I don't want that. We got fifty feedback things, we can look through a list and go, oh, that's what they talking about… There's twenty people that has the same issue. We gotta fix that first."
> "Or two people, but guess what? That's gonna make a bigger problem. That's a higher priority even though they'll has two issues."

**What was true.** Every feedback row became its own card on the Concerns board. Nothing counted how many people said the same thing.

**What it became.** `lib/feedback-clusters.js` collapses the same complaint however it was worded, counts the **people** behind it (two notes from one person is one voice), and ranks by severity × head-count. Both halves of Darrell's rule are arithmetic now, not vibes: twenty normals (100) outrank two normals (10), and two criticals (200) outrank twenty normals. The **Most reported** strip above the Concerns board shows only what actually repeats — a list where every row says "1" is the pile the strip exists to replace — plus the repeat rate, which is the number that says what answering everyone individually was costing.

## 5. The link back that never came

> "I put my email in there as close to get a link back. I'm not getting the link in my email… Can you screenshot and send it to text it to me?"
> "Once it's a known issue, then you can tell them: hey, this is a known issue. We know about it. We are in the process of working on it."

**What was true.** There is **no mail transport in this app.** The form never asked for an email and nothing ever sent one, so his address went into a free-text box and sat there.

**What it became.** Not a pretend mail path — the honest alternative. On submit the sender gets a **reference code** (stable, derived from the row's own id, no server, offline; no `0/O/1/I/L` so it survives being read off a photo) and a "Your feedback" list showing each of their notes with a true status. The known-issue sentence Darrell described giving people by hand is now something the app says — and says truthfully, because the "N other people have reported this" it quotes comes from the real clustering of real rows. The form's own copy now states that no email is coming, instead of leaving it to be discovered mid-demo.

## 6. Give — the button that landed short

> "And, actually, this should go straight to the pay page… is this the pay page? Mm-mm. No. That's not the pay page. So we wanted to go to the actual Menu, and then Tithes and Offering guest page. This is the link we need."

**What was true.** `links.give` is the church's **site root**. The button said "More ways to give — church website" and dropped the visitor on a homepage to hunt a menu.

**What it became.** The exact URL is not in this repo — Darrell had it on his screen, not in the transcript — and this project's binding rule is that a giving URL is **never invented** (`lib/giving.js`). So what shipped is the part that is verified: his own words for the two taps. The button now reads "Church website — giving page is one step in", names **Menu → Tithes and Offering**, and says plainly that this is not the giving page itself. The directions **retire themselves** the moment a real deep-link is set — a deep-link *is* the giving page, so telling someone to go find a menu would be wrong, not merely noisy.

**Open, and the one thing needed from the office:** the direct URL to the Tithes and Offering page. It goes in `links.give` and nothing else changes.

## 7. Conference vs Event Center vs Venues

> "conference center vs event center for the church"

Three things wore overlapping names and only two of them were tabs. Traced to what the code actually does:

| Name | What it really is | Where it lives |
|---|---|---|
| **Conference** | The **event** — the 77th National Assembly. Identity, open registration, schedule, meals. | Church → Conference |
| **Event Center** | The **building** — South Campus, 1109 N 4th St (`lib/venue-rental.js`). Its room/session/capacity operations are a **staff panel inside Conference**, never a tab of its own. | inside Church → Conference |
| **Venues** | The **community renting either campus** — North (the church) and South (the Event Center). Requests, calendar, responsibilities, revenue. | Church → Venues |

There is no "conference center." The collision was real and it is now settled: **"Event Center" means exactly one thing in this app — the building.** Everything else was renamed to say what it is.

| Was | Is now | Why |
|---|---|---|
| `🏛 Event Center` (panel inside Conference) | **Rooms & Sessions** | It is the rooms, capacity and registration roll for the conference. It was never a tab, so a label echoing the building's name pointed at a place you could not navigate to. |
| `Venues` (church sub-tab) | **Campus Rentals** | It is the community renting either campus. "Venues" was a noun that told you nothing. |
| `Events` (surfaces.js label) | **Campus Rentals** | Same surface, same name everywhere. |

Conference keeps its name — it *is* the event. The building keeps "South Campus Event Center" in the venue data, which is its real name. Feedback keys are unchanged (stored rows point at them); the labels follow the new names. The settlement is pinned in `church-ministries.test.jsx` with a proven-to-catch: any heading that re-uses the building's name outside the venue data fails the build. The module file name stays `EventCenterModule.jsx` on purpose — renaming a file is churn with no reader benefit and every import already resolves.

---

## The gates

Everything above rode the normal lane and was proven, not asserted:

- **917 test files, 13,465 tests green**, lint clean at `--max-warnings 0`, production build clean.
- **~100 new tests** across six files, each carrying a proven-to-catch block (DR-0076 §3): a Sunday-only picker, a clusterer that merged everything or nothing, a ministry tile claiming a page the app lacks, a feedback button filing into a non-existent area, and an invented giving URL all fail there.
- **Four repo guards caught real defects in this work and were fixed, not silenced**: `ui-standards-guard` (a receipt button with no focus ring — a keyboard user could not see where they were), `consistency-guard` (a width cap on a tab wrapper, DR-0246), `monolith-budget-guard` (the shell footprint, first written at +19, trimmed to the irreducible +2 by moving comments into the modules and letting `feedbackOpen` carry the pre-picked area instead of adding a second state), and `shell-church-deep-link` (the new Ministries tab was not deep-linkable).
- `feedback-area-guard`, `module-boundary-guard`, `contrast-guard`, `tab-overflow-guard`, `migration-replay-order-guard` all green.

## What is NOT claimed

- **The giving deep-link is not verified.** `thechurchofthelivinggod.com` is blocked by this session's network egress, so the Tithes and Offering URL could not be fetched and was not guessed. The menu path ships; the URL is pending the office.
- **The ministry roster is not complete.** It is what the app knows so far, from live surfaces, the ops list, and what Darrell named on 2026-09-11. The surface says so.
- **Nothing here was observed running against production.** The evidence is the test suite, the guards, and a clean build — not a live pass on poetech.us.
