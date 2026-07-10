# DR-0150 — The Learn catalog is findable, and one bad row never kills the tab

- **Status:** accepted
- **Tier:** A — a picker reorganization on an existing surface + a render-crash class fix; no schema, no money, no new external face
- **Scope:** `lib/learn-organize.js` (grouping + sorts, derived), `components/ChurchLearn.jsx` (grouped native dropdown + sort control replacing the 18-button wall; the Governor roster panel hardened), `__tests__/learn-organize.test.js`, `__tests__/church-learn-hostile-data.test.jsx` (the fuzz gate that CAUGHT the live crash), the catalog render gate now driving the dropdown
- **Date:** 2026-07-10
- **Principles:** NO-STATIC-DATA (DR-0121), VERIFICATION-DOCTRINE (DR-0076), ANXIETY-CLARITY, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT

## Directive

Darrell, 2026-07-10, with a Learn screenshot: *"Can we better organize the learn lessons with sorts and dropdowns etc."* Hours after: *"learn tab is dead…"* — the error boundary on his device while every gate was green.

## The verified trace

1. **18 courses · 206 lessons had one affordance:** a wall of eighteen stacked full-width buttons the reader scrolls past before any lesson content — the screenshot shows the whole first screen consumed by the picker.
2. **The dead tab was a Governor-only crash.** The new hostile-data fuzz gate (built to hunt exactly this report) caught it deterministically: the "Who wants in" roster panel — mounted ONLY for the Governor — read `.id` off a roster row without guarding, so ONE malformed cross-instance interest row (a null, a non-object, a numeric timestamp) killed the entire Learn tab. That is why only Darrell's device ever saw it: members never mount the panel, and every clean-props CI gate stayed green. The truth-chain from tonight held: the boundary caught it, the journal recorded it, and the fuzz gate reproduced it in CI.

## Decision

1. **The picker is a grouped native dropdown + sort.** One tap opens the phone's own picker UI; the Deep-Processing family (detected structurally from its own `eternal-` key family, never a hand-kept list) sits in its own labeled group; options carry live lesson counts; a sort control offers course order / A-to-Z / most lessons / shortest first. All derived (lib/learn-organize.js, pure, tested); 44px targets; proper labels.
2. **One bad row never kills the tab.** The Governor roster panel filters non-object rows and coerces field types before rendering; the count derives from the same filtered set.
3. **The hostile-data fuzz gate is permanent:** it mounts the full host prop surface with the shapes a real device's history can hold (boolean quiz entries, dead module ids, junk dates/levels, malformed roster rows) and clicks every section — this class now fails the build, not a phone. Proven-to-catch: it found this very crash on its first armed run.
4. **The catalog render gate drives the dropdown** (selects each course by option + change event), so "every course renders" holds through the new picker.

## Opportunities and constraints

- **Opportunity:** per-course progress in the option labels ("· 3 of 8 done") once per-course progress is cheaply available to the picker; and a search box if the catalog passes ~30 courses. `re-review: 2026-07-24`.
- **Opportunity:** sweep the OTHER `.map` panels over live rows (roster-shaped renders elsewhere) with the same hostile-row fuzz — the class is bigger than one panel. `re-review: 2026-07-17`.
- **Constraint (held):** grouping stays structurally derived; if a future course family cannot be detected from its own data, the field is added to the ONE registry, never a display-side list.

## Supersedes / pairs

Pairs with DR-0129 (the one-registry catalog this organizes), DR-0121 (derived counts/groups), DR-0139/DR-0092 (the boundary + journal that told the truth on the device), REV-0031's UI/UX classes. Supersedes the flat course-button wall.
