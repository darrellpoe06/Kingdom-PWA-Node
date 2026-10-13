---
id: DR-0290
title: The link IS the door — the lessons open instantly for anyone, the brand follows how you arrived, and the explanation waits until after the reading
status: accepted
date: 2026-08-10
tier: A
declared_by: Darrell ("why would anyone need to login to see the lessons?" / "no fight!!!!????!!!!")
builds_on: [DR-0174 (the church's own door), DR-0286 (links to the exact lesson), DR-0076, DR-0121]
principles: [COMMUNITY-FIRST, WORD-FIRST, DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE]
---

## The directives

Darrell, 2026-08-10, opening a shared lesson link on the live site:

- *"why would anyone need to login to see the lessons?"* — with the URL.
- *"This should be an advantage for PoeTech App... easy for promotion to
  potential students users and businesses."*
- *"whenever I'm in learn... from PoeTech App... I end up in the Love Corner
  App... still an issue."*
- *"When I send a link... it should be almost like a newsletter... explains why
  it exist... then looks for subscriptions"*, *"then the real account happens
  when they sign up... however... the fruit is obviously good"*, *"let potential
  users have the clarity to understand what they are using."*
- *"Explains at the end... the information is the draw!?? Short and sweet
  then... explain at the end."*
- *"Most people will love the content... not a fight to enter a space... make
  sure it's just a link that anyone can see instantly... no fight!!!!????!!!!"*

## 1. The church opens to anyone; the private app does not

The shell's own comment already declared the intent — *"The Love Corner church
door is a PUBLIC community: signed-out visitors SEE the church (no private
family/financial data lives here)"* — but the only thing that opened that door
was `isChurchDoorContext()`, which requires the `?lovecorner=1` param **or an
INSTALLED (standalone) PWA**. So the church was public exactly for people who
already had the app, and every shared link opened in an ordinary browser tab hit
the create-a-profile wall. **A link you cannot hand to someone who doesn't have
the app yet is not a link.** It is also the cheapest promotion the platform has,
spent on nothing.

`isPublicChurchRoute()` (lib/access-gate.js) now lets a signed-out visitor pass
on any church route — `?view=church`, any sub-tab, the legacy `?view=learn`
deep-links, and `?lovecorner=1`. **The private app is untouched:** every PoeTech
route (`overview`, `books`, `crm`, `projects`, `admin`, `markets`, `center`)
still meets the wall, pinned by test. Church surfaces holding staff or member
data keep self-gating on the account, as they always did.

## 2. No fight, one layer past the wall

Opening the gate was not enough. The shell holds two **full-screen modals** for
a visitor with no profile — the scenario picker and *"Who's using this
device?"* — and either one would have slammed into a stranger's face the moment
they tapped a texted link. Both are now suppressed for a public visitor, pinned
in the source so a later edit cannot quietly re-introduce the fight.

## 3. The brand follows the DOOR, not the tab

DR-0174 made the header wear the church on ANY `?view=church`. Right for a
member who came through the church door; wrong for a steward inside PoeTech who
simply opened the Church tab — *tapping a tab must never feel like leaving for
another app*. `wearsChurchBrand()` decides by arrival:

| Who | Wears |
|---|---|
| launched via the church door (installed app, `?lovecorner=1`) | The Love Corner (DR-0174, unchanged) |
| signed-out visitor on a public church link | The Love Corner — that is what they came for |
| signed in, inside PoeTech | PoeTech, on every tab including Church |

## 4. The information is the draw — so the explanation comes last

`components/PublicWelcome.jsx` renders in two placements, and neither one gets
between a reader and what they came for:

- **top** — ONE line: whose house this is, and that it is free to read. No ask.
- **end** — after the reading, where the person who just got something good is
  the only one who has earned the invitation: why this exists, that everything
  is free with no account and nothing is sold, what an account actually keeps
  (their place, their progress, their reading voice, their prayer requests), and
  one **Create your free account** button.

**Every number is counted, never claimed (DR-0121):** the "N courses · N
lessons" line is counted from the mounted catalog at render, and an empty
catalog prints no boast at all rather than a zero.

## Verification (DR-0076)

- `public-church-brand.test.js` (13): the exact link Darrell sent opens with no
  login; it opens in an ordinary tab, not only an installed app; **no PoeTech
  route is opened** by the rule; the brand table above, including a
  proven-to-catch that the old any-`view=church` rule fails the steward case;
  and the two modal conditions pinned in the shell source.
- `access-gate.test.js` (+7): the public-route predicate, including the
  malformed-query fallback and the untouched private-app wall.
- `public-welcome.test.jsx` (10): the top asks for nothing; the end explains and
  then invites; the counts match the live catalog; a hostile catalog entry
  counts as zero rather than crashing; an empty catalog prints no boast.
- Full suite **7,346 passing (653 files)**; lint clean; build green; the shell
  stayed at its frozen 5,325-line budget (comments folded into the lib).
- **Not claimed:** what a stranger's phone actually shows on the deployed build
  is Darrell's live pass (DR-0104).

## Pairs with

DR-0174 (the church's own door — narrowed, not undone), DR-0286 (the links this
makes usable), COMMUNITY-FIRST-MISSION (the Word going out is the point; a login
in front of it is the opposite).
