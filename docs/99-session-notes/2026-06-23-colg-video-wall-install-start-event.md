# EVENT — COLG Sanctuary LED Video Wall: installation started

> Institutional EVENT record, logged per `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md`
> (interim home = a structured session note until the Events module ships; the
> fields below match the declared schema so this ingests wholesale later).

```
id:            evt-20260622-install-colg-video-wall
date:          2026-06-22
type:          church-work / milestone
title:         COLG Sanctuary LED video wall — installation started
status:        in-progress
```

## Description

The Church of the Living God — **The Love Corner** (Champaign, IL) sanctuary LED
video-wall installation began on **2026-06-22**. This is the **physical front end
of the sovereign media / broadcast buildout** — the wall the NDI/CUDA media
pipeline and the COLG media-team broadcast ultimately drive. Darrell was on site
2026-06-23 and took the photos this record is grounded in; install was already
underway.

## Component inventory observed on site (2026-06-22)

- Modular LED video-wall cabinet panels — laid out on the floor, staged for assembly.
- Black ground-support / box-truss towers — being erected to mount and stack the wall.
- Install crew of ~3 on site; stage sized with a tape measure.
- Road cases — panels and rigging transported and staged for the build.

## Existing AV environment it joins

- FOH production desk — digital mixing console, multiple monitors, and a laptop.
- Dual projector screens flanking the stage — the projection this fine-pitch wall augments and will replace.
- Stage lighting on truss; acoustic wall-treatment panels.
- Full band setup — drums, keys, percussion.

## Links / tags

- **Module:** church / facilities-capex
- **Sector:** community, church-infrastructure
- **Ties to:**
  - Sovereign media pipeline (NDI / CUDA) — this wall is its physical front end.
  - COLG NAS build initiative — church-owned storage + playback the wall reads from.
  - COLG media-team broadcast course — trainees learn the real signal chain that drives this wall.
  - The Word — Migdal — BG's study notes present from the app to the wall during service.
- **Capital-project record:** `church_capital_projects` slug `sanctuary-video-wall`
  (status advanced `staged` → `installing`).

## Gating note

This CapEx record **seeds the church-infrastructure accounting** that is the
gating prerequisite for the media-pipeline build: the budget/donation tracking on
the Video Wall surface is where the church-infrastructure spend is reconciled
before the NDI/CUDA pipeline work is greenlit.

## Provenance

- **who:** Darrell (on-site observation + photos)
- **when:** 2026-06-22 (install start); recorded 2026-06-23
- **source_surface:** on-site photos → in-app Video Wall capital-project page

## Privacy

Project / infrastructure FACTS only. **No identifiable congregant photos** entered
into any seed or community-visible data. The Video Wall surface is church-staff
gated; budget/donation figures remain owner/admin-only (RLS, migration 0030) and
live only in the gitignored seed — never in the public repo or bundle.

## Related artifacts

- `app/src/components/ChurchVideoWall.jsx` — TIMELINE install-started milestone, on-site install EVENT card, install-note + status defaults, NDI/CUDA + COLG-NAS linkage.
- `infra/supabase/migrations-auto/0030-church-capital-projects.sql` — schema (status enum already includes `installing`); already on main (#206).
- `infra/supabase/seeds/colg-video-wall.sql` — gitignored; advances the live row `staged` → `installing` (run once in Studio).

## Learnings

The institutional EVENT for a physical milestone rides the **existing** capital-project
surface (no new surface invented), per "find the right existing surface." Non-financial
physical facts are public-safe and live in code alongside SPEC/CONSTRAINTS; the
canonical status lives in the gated DB row. No new migration was needed because the
`0030` status CHECK already allowed `installing` — the change is data + copy, not DDL.
