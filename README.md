# SKOS — Sovereign Kingdom Operating System / Kingdom-PWA-Node

Private repository of PoeTech LLC.

SKOS is a sovereign-mesh human controls system grounded in biblical truth, scientific rigor, and historical accuracy. Its architectural metaphor is drawn from Siemens building automation systems — sensors → controllers → control loops → actuators → continuous tuning — applied to human flourishing.

## Layout

- [`app/`](app/) — the SKOS PWA. Vite + React + Tailwind. `cd app && npm install && npm run dev` for the local dev server at <http://localhost:5173/>. Source of truth: [`app/src/poe-financial-mvp-v28.jsx`](app/src/poe-financial-mvp-v28.jsx).
- [`docs/`](docs/) — architectural foundation.
  - [`docs/00-foundations/`](docs/00-foundations/) — the fifteen numbered foundation documents.
  - [`docs/00-foundations/_root/`](docs/00-foundations/_root/) — Root-tier foundations (`THE-WAY.md`, `MIND-OF-CHRIST.md`, `BEHAVIORAL-MIRROR.md`, `EXCELLENCE-STANDARD.md`, `SCRIPTURE-REFERENCE-STANDARD.md`, `UX-PATTERNS.md`, others). Authoritative — every SKOS-generated artifact must conform.
  - [`docs/05-financial-os/`](docs/05-financial-os/) — Financial OS module documentation, including [`MVP-1-TIMELINE.md`](docs/05-financial-os/MVP-1-TIMELINE.md) and [`MVP-1-HARDENING-PLAN.md`](docs/05-financial-os/MVP-1-HARDENING-PLAN.md).
- [`CLAUDE.md`](CLAUDE.md) — binding rules for Claude Code sessions in this repository. Read first.

## Build target

Current scope: single-family Financial OS for the Poe household. Architectural intent (not in current scope): per-family instantiation so any family can stand up their own SKOS keyed to their history, skills, businesses, and IoT systems. Design decisions in the current build must not foreclose that path.
