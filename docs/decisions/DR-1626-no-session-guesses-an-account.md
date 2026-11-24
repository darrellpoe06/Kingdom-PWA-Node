# DR-1626: No session guesses an account — the tailnets, their logins, and a machine at another site is shared in, never moved

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (records and a standing rule; no code, no schema, no money)
**Type:** decision + incident lessons
**Area:** `infra/nas-transport/RECORDED-STATE.md`, `memory/MEMORY.md`, the Tailscale admin consoles
**Sent in by:** Darrell, 2026-11-24: "Through github was the correct login!!!!?!!!! DRs should have shown that!!!!", "The other zfold7 one is inside darrellpoe06@gmail.com... because of you!!!!!", "TLC is at the church... not here at my home like the PoeTech nas is", "Document all of this in the DRs so it never happens again!!!!"
**Pairs with:** DR-1624 (the outage and its cause), DR-1622, DR-1360, DR-1526, DR-0076 §8 (honest uncertainty), `feedback_use_central_time`

## Context

On 2026-11-23 at about 5:30 PM CST the NAS's Tailscale key expired, and sign-in went dark for the whole family (DR-1624). During the repair I gave Darrell three wrong instructions. Each came from guessing where the records were silent.

## What was measured

- **Two tailnets exist.** Read from his admin consoles:
  - `darrellpoe06.github` is the family's. Its sign-in is **GitHub**. It holds `poetech` (the home NAS, with the Funnel), `kingdom-home`, `livestream-main-pc`, `tlcmediadpt`, `tlc-tech-team`, his phone, and a stale `tlcrackstation` entry.
  - `darrellpoe06@gmail.com` signs in with **Google**. It holds his phone and `tlcrackstation`, both online.
- **No record named either login.** A search of `docs/`, `memory/` and `infra/` found none.
- **My three wrong instructions:**
  1. "Sign in with Google." That was a guess from his phone app's account line. The NAS belongs to the GitHub tailnet.
  2. `tailscale up --reset` and "it will ask for your password." DR-1526 already recorded that LAN SSH needs no password, and no record holds the NAS's up-flags, so a reset could have erased settings (corrected in DR-1622).
  3. "tlcrackstation is the therapy practice's." TLC here is The Love Corner; the machine is the **church's** NAS, at the church.
- **What fixed the outage.** He signed `poetech` back in with GitHub ("Login successful … darrellpoe06.github"), then disabled key expiry on `poetech`, `kingdom-home` and his phone. site-health read UP at 7:38 AM CST on 2026-11-24.
- **Moving `tlcrackstation` remotely would cut it off.** The only road to it from his home is the Gmail tailnet it would be logging out of.

## Impact

A wrong login sends a person into an empty network. A wrong command can wipe settings. A wrong guess about whose machine it is misdirects a privacy decision. Each one cost him time during a lockout.

## Decision

1. **No session guesses an account, a login, an owner or a place.** If the records do not say, the answer is "not on record: read it from the console", with the place to look. Then it is written down the same session.
2. **The tailnets are on the record** (RECORDED-STATE): which is the family's, each one's sign-in, and where each machine is.
3. **Key expiry is disabled on every always-on machine,** and the NAS warns 21 days before its own key can lapse (DR-1624).
4. **A machine at another site is shared in, never moved.** `tlcrackstation` stays on its own tailnet and is shared into the family's by a share link. Shared machines cannot start connections into the family's network, which keeps the church and the home separate. It is never logged out from a distance.
5. **A command handed to him is checked against the records first** (DR-1526, the install notes), and never carries a flag whose effect on unrecorded settings is unknown.
6. **Times given to him are Central** (`feedback_use_central_time`). This session gave UTC throughout; that is corrected from here.

## Verification

- **Read from his own screens:** the two tailnets and their machines; the `poetech` login success; "Expiry disabled" on three machines.
- **Measured by site-health at 7:38 and 7:43 AM CST, 2026-11-24:** sign-in, cameras, photos and the phone alert relay answered 200. `/property-history` and `/automation-status` answered 502, the same as before the outage.
- **Not verified:** that the `tlcrackstation` share was accepted; key expiry on `livestream-main-pc`, `tlcmediadpt`, `tlc-tech-team` and `tlcrackstation`; his phone switched to the GitHub account.

`re-review: 2026-11-26`
