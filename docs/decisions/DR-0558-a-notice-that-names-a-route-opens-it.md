# DR-0558 — A notice that names a route opens it

- **Status:** accepted
- **Tier:** B
- **Type:** product
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/nav-history.js` (new exported `hrefForView`); `app/src/lib/use-read-aloud.js` (a notice may carry `{ href, label }`; the raw setter is wrapped so a door never outlives its message); `app/src/components/TTSControl.jsx` (the notice draws the door as a button); `app/src/__tests__/a-notice-that-names-a-route-opens-it.test.js` (13 checks, new); `app/src/__tests__/nothing-hovers-over-the-word.test.js` (two cases superseded, with the reason in place)
- **Principles:** DRIVE-DONT-DELEGATE (applied to the product, not only to the agent), VERIFICATION-DOCTRINE (DR-0076 §3 — proven to catch), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** Darrell 2026-09-22 ("I can't find how to do that add a voice?!!!!!!"); DR-0246 (the consistency guard that shaped the panel); the same day's first pass, which this supersedes

---

## What he said

> "also how can it do what it is claims to be able to do? **I can't find how to do that add a voice?!!!!!!**"

The read-aloud panel had told him: *"Record a voice sample first."* He went looking and could not find where.

## The first fix, and why it was not enough

Earlier today the notice was changed to name the tab and warn that it might be behind the nav overflow on a narrow screen. Every word of that was **true**: the Voice tab is real (`surfaces.js`, id `voice`), the top nav is a horizontally scrolling strip, and on his phone it renders as "Voi" plus a chevron.

It was still the wrong answer. It handed the finding back to him — an accurate description of a hunt is a hunt. **Drive-Don't-Delegate is a rule about the product too, not only about the agent:** a surface that tells someone to go and do a thing somewhere else should take them there.

## What shipped

A notice may now carry a **door** — `{ href, label }` — and the panel draws it as a button beside the message. The voice notice carries `Open the Voice tab`.

**An `href`, not a `setView` call, on purpose.** `TTSControl` is mounted on four surfaces and three of them — `FollowAlong`, `PracticeLearn`, `TlcPublicDoor` — have no nav shell to call into. A prop would be `undefined` exactly where a stranded reader is most likely to be standing. The shell already reads `?view=` on boot (`parseNav`), so one real address works from all four.

**The door params ride along.** `hrefForView` carries every `PRESERVED_PARAMS` entry from the current URL, so a Love Corner visitor who taps it stays in the church face of the app instead of landing in the plain PoeTech app — the exact defect that list was written for. Params that are *not* preserved are dropped, so a `join` token never rides along into a new address.

**A door never outlives its message.** The raw state setter is wrapped rather than exported: `setNotice(msg)` with no action clears the action, and `setNotice('')` clears both. A stale door under a new message would send someone somewhere the new message never meant, and that is now impossible rather than merely avoided.

## Verification

- **13 new checks**, plus the two superseded cases in `nothing-hovers-over-the-word.test.js` rewritten with the reason in place rather than deleted — the description of the overflow going away is the fix, not a regression, and the file says so.
- **Proven to catch (DR-0076 §3):** `hrefForView` was broken deliberately, dropping the preserved-param loop, and the suite went red **2 of 13** on exactly the two cases that exist to hold it — the church-face case and the all-params case. Restored, 13 of 13.
- One test I had written the same morning was itself at fault and is fixed here: it pinned `setNotice` as the **last** line of the destructure, so it went red the moment `noticeAction` was destructured after it. A test holding formatting rather than behaviour is a test that will cost someone an hour later; it now matches the destructure containing it.

## Limits, stated

1. **The door reloads the app.** A plain anchor re-boots the shell at the Voice tab rather than switching views in place. On the surfaces that have a shell, an in-place switch would be smoother. It is not what a stranded reader needs first — arriving beats arriving smoothly — and the universal address is what makes it work on the three surfaces that have no shell at all. `re-review: 2026-10-22` — if an in-place path is added, it should be an enhancement layered *over* this href, never a replacement that breaks the three shell-less surfaces.
2. **Only one notice carries a door today.** The others are news, not instructions, so they need none. Any future notice that tells a reader to go and do something elsewhere should carry one, and nothing yet enforces that. It is a judgement, not a gate. `re-review: 2026-11-22`.
3. **The nav overflow itself is untouched.** The Voice tab still sits past the right edge on a phone, and anyone who does not receive this notice still has to scroll for it. That is the standing `re-review: 2026-09-29` item and this change does not close it — it routes around it for the one reader who was actually stuck.
