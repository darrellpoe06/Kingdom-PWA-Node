# DR-0958 — The front door shows the homes, not a PIN pad

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `app/src/components/PublicFrontDoor.jsx`, `app/src/poe-financial-mvp-v28.jsx`
**Gates:** `app/src/__tests__/the-front-door-shows-the-homes.test.jsx`

## Context

Darrell, 2026-10-11, photographing his own phone on poetech.us:

> "Why are you asking new users to create an account before seeing the
> listings?!!!!!!!!!!!!"
> "It's advertising!!!!!!!!!!!!"

The screen on the phone: **"Create your profile — No email needed, just your
phone number and a 6-digit PIN."** Name, cell phone, PIN, confirm PIN.

## What was measured

`poe-financial-mvp-v28.jsx:3533`, the signed-out gate, rendered exactly one
thing:

```jsx
{__gate === 'gate' ? <PasswordAuth brand={…} /> : null}
```

So every person who typed poetech.us, scanned a printed code, or followed a
link from an advert met a PIN form **first**, with no way past it and nothing
else on the page. A stranger looking for somewhere to live was asked to invent
a 6-digit PIN before being shown a single room.

**The precedent was already in this file, three lines above the defect.** The
comment on that same gate reads: *"The Love Corner church door is a PUBLIC
community (Darrell 2026-07-14): signed-out visitors SEE the church … the 'no
profile, no access' wall is only for the private PoeTech app. Sign-in stays one
tap away."* The church got this treatment fifteen months ago. The listings —
the surface whose entire job is to reach strangers — never did.

## Impact

Advertising that demands an account before it will show the thing being
advertised is not advertising; it is a door with the merchandise behind it.
Every QR code already printed, every link already shared, and the domain itself
all landed here. The cost is not a lost click — it is a vacancy that stays
vacant while the person who would have rented it closes the tab.

## Decision

1. **The homes come first.** A signed-out visitor meets `PublicFrontDoor`: the
   count, the cards, "No account needed to look."
2. **Sign-in is one tap away and never the first thing** — and a person who
   taps it by mistake has a way back to the homes.
3. **Nothing private is on it.** It draws `public_vacancies()`, the same RPC
   the public Poe Properties shelf already serves anonymously: no street, no
   tenant, no contact (DR-0935).
4. **A failed read never reads as "nothing available."** On the page that sells
   the homes, telling someone we have nothing when the truth is we could not
   look is the costliest version of DR-0946's invented absence.
5. **The shell did not grow.** `PublicFrontDoor` is its own component and the
   monolith holds its frozen 5302 lines exactly; it no longer imports
   `PasswordAuth` at all, reaching it through the front door instead.

## Verification

**7 green**, mounted — the page is rendered and the assertions are about what a
person sees, not what the source says. Lint clean at the repo's settings;
legibility, monolith-budget, interconnect and business-systems guards green on
their real exit codes; **77 green across the 7 existing suites that touch the
gate or `PasswordAuth`**, so the family's way in is unchanged.

**No new legibility debt**: the page is among the 319 of 332 that pass, and
`scripts/legibility-baseline.json` is untouched. (`--generate` would have frozen
four fresh entries as tracked debt; that ratchets the wrong way, so it was
reverted and only the health snapshot regenerated.)

**Proven to catch:**

| break | caught by |
|---|---|
| open on the PIN form again (`useState('auth')`) | 5 cases, starting with *"is the homes, and NOT the create-a-profile form"* |
| a failed read collapsed into an empty shelf | *"a FAILED read never reads as 'nothing available'"* |

**Not proven from this sandbox:** his phone on the live build. The measurement
that matters is opening poetech.us signed out and seeing the two places.
**re-review: 2026-10-18.**
