# DR-0996: What's nearby is on every door by default, measured from each property's own house; the app says what accessibility it holds itself to

**Date:** 2026-10-13
**Status:** accepted
**Area:**
- `place-on-map.js` (new)
- `area.js` (`nearbyAround`, `overpassQuery`, `nearbyFromOverpass`, `milesText`)
- `apartment.js` (`buildingKey`)
- `cloud.js` (`loadDoorAreas`)
- `PropertiesApp.jsx` (the placement effect)
- `AreaMap.jsx` (the editor's lookup, read-aloud and screen-reader names)
- `AccessibilityNote.jsx` (new), placed in `PropertiesDoor.jsx` and `About.jsx`
- `scripts/nearby-witness.mjs` and `.github/workflows/nearby-witness.yml` (new)
- `scripts/e2e/door-journeys.mjs` (E1)

**Amends:** DR-0935 and DR-0977 (where nearby lines come from, and that nothing is looked up until asked), DR-0995
**Principle:** DR-0076 (proven to catch; no claim past the evidence), DR-0315 (WCAG 2.2 AA), DR-0065 (build it in the app)

## Context

Darrell, 2026-10-13, all with screenshots of the live shelf on his Fold:

> "I love that it shows what's close!!! Shouldn't this be default?"
> "Make sure it's accurate for each property... makes sense?"
> "Not just 805..."
> "Remember the tts... WIG 2.0" / "Sorry the new assessibility website rule changes..."
> "Explain this somewhere in the app so people know... WCAG is the W3C's accessibility standard, with AA being the legally-required level—this app targets 2.2 AA to stay ahead of upcoming ADA deadlines."

## What was measured

- **The list he loved was not stored.** In the screenshot, "What's nearby" sat *under* the map. In `MapOnRequest` that position is the list worked out on the visitor's phone from a lookup made when the map was tapped. The stored list (`NearbyList`, above the buttons) was absent.
  - So Apt 2 had no saved area and no saved lines. The list vanished with the map, and it cost a lookup per visitor.
- **No door at 805 had an area.** DR-0995's building area therefore had nothing to lend, and the held bed in Apt 4 still had no map.
- **`PLACES` is the Champaign research** (`docs/99-session-notes/2026-10-10-805-north-prospect-whats-nearby.md`).
  - `nearbyFrom` keeps only places within 15 miles, so a door in Danville got an empty list.
  - Nothing measured what is near any property other than the ones in Champaign.
- **The read-aloud speaks the page's own text** (`TTSControl` `readablePageText`: `main.innerText`, with buttons and `[data-read-skip]` removed).
  - "about 0.7 mi" was spoken as "mi".
  - The Street view link and the map's OpenStreetMap credit were read in the middle of the listing.
- **No surface in the app said what accessibility standard it is built to.** DR-0315 holds the research; nothing a person can open said it.

## Impact

- **Visitors** saw what is close only if they tapped the map, and only on a door whose street was shown.
- **A held door, and every door outside Champaign,** showed nothing.
- **Someone listening** heard "mi" and control labels inside the listing.
- **People asking whether the app is accessible** had no answer in the app.

## Decision

1. **The family's app places its doors, by itself, once.**
   - When the family's session loads (role `owner`), each building is looked up once by address. A building is the same family and the same street with the unit folded out (`buildingKey`, the same rule as the database's `building_key`, 0283). Only buildings with a door that has no area are looked up.
   - Every such door is saved through the door edit path, so the trace lands in its notes: *"Placed on the map from its address (automatic): …"*. It gets the rounded area and the nearby lines.
   - It is bounded:
     - at most 8 lookups a session, 1.1 s apart (OpenStreetMap's one-a-second policy);
     - never a loop or a timer;
     - a door already on the map is never touched.
2. **Accurate for each property.**
   - **The lookup must be THIS house.** What was matched must carry the door's house number and town (`matchesAddress`). A street-centre or wrong-town match saves nothing, and the door stays "Not on the map yet" to pin by hand.
   - **What is nearby is measured from that house's own exact point,** which is used once and never saved. It comes from two sources:
     - the Champaign research where it applies;
     - the nearest of each kind OpenStreetMap's Overpass API knows around the point. Kinds: grocery, pharmacy, hospital, college, school, station, highway exit, park and airport, each within its own radius.

     They are merged nearest first, at most 12, and never duplicated.
   - **A Danville door gets Danville's places,** and none of Champaign's.
   - **An unreachable lookup is not "nothing near".** If Overpass cannot be asked, nothing is saved and the door is tried again next session.
3. **The public card shows what is near by default.** It is the stored list (DR-0995's building borrow covers held doors). The map tiles still wait for a tap.
4. **The editor's "Find it from the address" uses the same `nearbyAround`,** so a door placed by hand reads the same as one placed automatically.
5. **Heard as well as seen (WCAG 2.2 AA, DR-0315):**
   - Distances are spelled "about 0.7 miles".
   - The Street view link is named "Street view of …, opens Google Maps in a new tab" (2.5.3: the name starts with what the link says).
   - The link and the OpenStreetMap credit carry `data-read-skip`, so the read-aloud reads the listing, not the furniture.
6. **The app says what it holds itself to.**
   - **`AccessibilityNote`** is a closed `<details>` titled "Accessibility". It sits in the Properties footer (renters and guests) and on About.
   - **What it says:** what WCAG and the W3C are, that AA is the level the law points to (ADA Title II: WCAG 2.1 AA by April 2027 / April 2028; courts hold businesses to it), and that this app is built to **2.2 AA** to stay ahead of those deadlines.
   - **What it promises:** the minimums it keeps (36 px buttons against the standard's 24, text you can enlarge, every page read aloud) and that checks run on every change.
   - **What it never claims:** it says plainly that a check is not a person. It never says "certified" or "fully compliant".
7. **A live witness.** `nearby-witness.yml` (dispatch only, read-only, 5-minute budget, concurrency lock) looks a real address up from a GitHub runner, checks the match, and prints the rounded area and the real nearby list. The sandbox can reach none of those services.

## Verification

- **`every-door-is-on-the-map.test.js`** (12 tests), against recorded Census and Overpass answers, covers:
  - the Overpass query around the point, each kind in its own radius;
  - a Danville door getting County Market, Walgreens, Highway exit 220 and Lincoln Park, none of Champaign's, and nothing past its radius;
  - the 805 research kept;
  - unreachable is `ok:false`;
  - "about 0.7 miles";
  - `matchesAddress` refusing a street centre, `8050`, Peoria, an empty match, and an address with no number;
  - one lookup per building, never across families;
  - each door saved its own place's lines through the edit path, and never the exact point;
  - bounded to 8 lookups, ≥1 s apart;
  - never throws.
- **Proven to catch:**
  - With the address-match check removed, *"a lookup that is not THIS house saves nothing"* fails by name.
  - With an unreachable Overpass saved as empty, *"what is nearby unreachable saves nothing"* fails by name.
- **`the-family-places-its-doors.test.jsx`** covers the family's session reading the placed set once and placing through `updateRental` with the trace summary, and a session that owns no doors placing nothing.
- **`the-app-says-what-it-holds-itself-to.test.jsx`** covers:
  - the note naming WCAG, the W3C, AA, the ADA dates and 2.2 AA;
  - a native `<details>`, closed;
  - no "certif", "fully compliant", "100%" or "guarantee", and "A check is not a person" present;
  - placement in both surfaces.
- **`the-public-shelf-shows-the-area-on-a-map.test.jsx`** (25): the editor now asks Overpass after the address, and saves the merged lines.
- **Door journeys** in Chrome: **10/10**. E1 is rewritten. With nobody pressing anything, the family's app has placed the door:
  - area `40.12500,-88.26000`;
  - one address lookup and one Overpass ask (recorded);
  - `12|Garden Hills Park|I-74 at Exit 181`, nearest first, from the door's own point;
  - Schnucks not duplicated;
  - the trace in the notes;
  - the editor reads "This door is on the map".
- **`--break=area` is CAUGHT at E1.** The automatic save is refused and the area never arrives.
- **Not observed live:**
  - the family's next session placing all 12 doors on poetech.us;
  - the real Overpass list for 805 and for a door outside Champaign. That is `nearby-witness.yml` after merge.

  `re-review: 2026-10-27`.
