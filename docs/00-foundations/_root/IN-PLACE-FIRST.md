# In-Place First — Keep everyone on their same page

> Founder framing (2026-05-18):
> *"Try to keep everyone on their same page unless this is an issue that wouldn't scale well."*

Binding UX rule for the SKOS / PoeTech Family OS. Upstream of every "open / edit / view details" affordance in the system.

---

## The rule

**When a user taps a row, a button, or a record, content comes to them by default — they do not get moved to it.** Expansion, inline drop-down, modal-on-current-view: yes. Navigation to a new tab, scroll-to-top, full-page replacement: only when keeping it in place would actively harm the experience.

---

## The exceptions (when navigation IS the right call)

Navigate only when at least one of these is true:

1. **Real-estate doesn't scale** — the expanded content would push so much off-screen on a mobile viewport that the user loses orientation worse than they would with a navigation. Threshold: if expanded content + the row's siblings still fit one screen of useful context, expand. If not, navigate.
2. **Context switch is the actual user intent** — they tapped *"Subscribe"*, *"See pricing"*, or *"Open in Projects tab"*. The button label promised navigation; deliver navigation.
3. **Performance** — rendering the full content inline would tank the page (e.g., a 200-row property table inside an Action Queue row). Even then, expand to a summary; offer the full view via an explicit affordance.
4. **Editing or task focus benefits from full screen** — e.g., a complex multi-step form, document preview, or focus-mode writing surface. The user gets a clean back/cancel path.

When navigating, the system **always**:

- Names the destination on the button (*"Open in Projects tab ↗"*, not *"Open ↗"*)
- Provides a clear path back
- Auto-scrolls / highlights the originating item on the destination, so the user does not have to re-find what they tapped (future enhancement; tracked as task)

---

## Concrete applications

| Affordance | Behavior |
|---|---|
| Action Queue row tap | **Expand inline** with details + history + jump-link (shipped r17) |
| Project Edit button | **Inline drop-down under the row** matching Real Estate pattern (shipping next) |
| Real Estate Edit button | **Inline drop-down under the row** (shipped r7) |
| Books > Accounts Edit | **Inline drop-down** (shipped) |
| Practice Inquiry Edit | **Inline drop-down** (audit) |
| Capex item Edit | **Inline drop-down** (audit) |
| Maintenance log entry | **Inline drop-down** (audit) |
| Tier switcher | **Dropdown on current view** (shipped) |
| Add new property | **Top-of-tab form** (legitimate context switch — user wants a clean entry surface) |
| Subscribe button | **Navigate to About / pricing** (button label promises navigation) |
| Open in [Tab] ↗ from Action Queue | **Navigate, with the tab name in the label** (user explicitly chose to navigate) |
| Legal tab entry | **Navigate to Legal tab + PIN gate** (security boundary; cannot expand inline) |

---

## What this rule forbids

- A row that says "Edit" but jumps the page to a form at the top. The eye loses the row; the user forgets what they tapped. This was the Projects bug.
- Auto-scroll-to-top on any save / cancel / status-change. Eyes stay where the user put them.
- "Open ↗" buttons without a destination name. Always tell the user where they're going.
- Hidden context shifts — e.g., a click that silently changes the tier preview without the user knowing. (Different rule — same family of "respect where the user thought they were.")

---

## Why this matters

Three reasons:

1. **Working memory.** The user is holding a question in their head ("did this tenant pay?"). Navigating breaks the question. Expanding holds it.
2. **Handoff.** The same UX principle that produces good handoffs in `LIFECYCLE-AND-HANDOFF.md` produces good single-user sessions: nothing is hidden behind a navigation.
3. **Trust.** Surprise navigation is the dominant source of "I don't trust this app" — users learn the interface punishes them for tapping. The opposite of `SITUATIONAL-PEACE.md`.

---

## Cross-references

- `SITUATIONAL-PEACE.md` — In-Place First is one of the peace mechanisms; surprise navigation is friction in a storm.
- `EXCELLENCE-STANDARD.md` — religion AND relationship; religion is the rigor of always-do-this, relationship is the care of always-keep-the-user-oriented.
- `CONNECTED-CONTEXT.md` — context surfaces inline by default; this rule says the *navigation* defaults match the *data-linking* defaults.
- `LIFECYCLE-AND-HANDOFF.md` — Pattern 1 (history rail) expands inline by design.
- `/docs/00-foundations/_root/UX-PATTERNS.md` — referenced from CLAUDE.md; this rule lives here for visibility.

---

**End of document.** Binding. Any new affordance that breaks this rule must justify the break in code comments and in PR review, citing one of the four exceptions explicitly.
