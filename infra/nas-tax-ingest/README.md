# nas-tax-ingest — the sovereign tax-document archive

Reuses the finance-ingest pattern (DR-0083) for tax returns. Christina drops
PDFs on the NAS; a deterministic Python job publishes a light JSON snapshot the
PWA reads same-origin, and Caddy serves the original PDFs so they stay printable.
No n8n, no third party, no cloud storage bill — the heavy bytes live on your disk.

## How it works

```
/volume1/PoeTech/tax-documents/<entityId>/<year>/<name>.pdf          # you drop these
/volume1/PoeTech/tax-documents/<entityId>/<year>/<name>.figures.json # optional verified figures
        │
        ▼  python3 tax_ingest.py   (deterministic, stdlib-only, idempotent)
        │
/volume1/PoeTech/caddy/site/poetech-app/taxes/files/<entity>/<year>/<name>.pdf   # served + printable
/volume1/PoeTech/caddy/site/poetech-app/taxes/archive.json                       # light data the app reads
        │
        ▼  the PWA reads SAME-ORIGIN
GET /taxes/archive.json  →  app/src/lib/tax-archive.js  →  tax-documents.js (groupByYear + buildTaxHistory)
GET /taxes/files/…/*.pdf →  Print / open the original return
```

- **Light + reusable:** the app carries only the per-year records + verified
  figures (`grossIncome`, `agi`, `totalTax`, `refund`) — the DATA the behavioral-
  strategy layer computes on (`buildTaxHistory`, year-over-year deltas).
- **Still printable:** the original PDF is copied into the Caddy site and served
  same-origin; the app links to it, never regenerates it.
- **Figures are verified, never guessed:** a figure only appears if you put it in
  the `.figures.json` sidecar (hand-entered + checked). A wrong extracted number
  is worse than none (DR-0076); LLM/OCR extraction is a later, independently-
  verified step, not this job.

## Run it (SSH / ConnectBot)

Copy `tax_ingest.py` to the NAS once (e.g. into `/volume1/PoeTech/tax-documents/`),
then run:

```
python3 /volume1/PoeTech/tax-documents/tax_ingest.py
```

It prints how many documents it published and rewrites `archive.json` atomically.
Re-run any time you add PDFs — it is idempotent. Ships as a manual one-shot; a
scheduled refresh must be armed deliberately per the three-brakes rule.

## Next (Tier C, Governor-reviewed)

- The **Books → Taxes** surface (upload + per-year archive + the strategy history).
- **Sovereign embeddings** over the document text on the GPU node (`infra/church-gpu-node`)
  for natural-language recall — a search aid beside the figures, never the source
  of a number.

## In-app upload (Christina never touches Synology)

`tax_upload_server.py` is the sovereign backend for the Books → Taxes screen.
It serves **all three** calls the app makes, from one process:

```
POST /taxes/upload                            multipart: file, entityId, year, kind
GET  /taxes/archive.json                      the published snapshot the screen reads
GET  /taxes/files/<entity>/<year>/<name>.pdf  the original return, printable
```

### It deploys itself — do not run it by hand

`install.sh` is registered in `infra/nas-loops/services.json`, so **merging is
the deploy** (DR-0236): the NAS mirror pulls, `services-sync` runs the installer
on its own clock, and the service is installed, enabled, started, mounted on the
Funnel at `/taxes`, and health-probed. It is idempotent — safe every cycle.

The `funnel-watchdog` loop keeps the `/taxes` mount alive across reboots and
Funnel resets, so the route stays correct rather than merely starting correct.

### Why the reads come from this service and not Caddy

They used to be intended to come from Caddy. That intent was never actuated and
nothing noticed for seven weeks — see the history note below. Nothing in this
repository can verify what the NAS Caddyfile contains or that it has an import
directory, and DR-0076 forbids editing a config we cannot verify, so the reads
are served here: one backend, one Funnel mount, provable by the installer's own
health probe. The reads are a pure passthrough of what `tax_ingest.py` already
published into `SITE`, so this adds no second source of truth.

### History — the 2026-09-06 defect (DR-0330)

Darrell, on the Taxes screen with a 2024 return selected: *"I am also unable to
upload my taxes."* The screen showed **"Could not reach the NAS upload service"**
and **"NO RETURNS INDEXED YET"** at the same time. One cause, three missing
pieces, none of them in the app: this service had no installer and was in no
manifest so nothing had ever started it; the Funnel had no `/taxes` mount
(`infra/nas-transport/RECORDED-STATE.md` listed only `/`, `/mcp`, `/nas-photos`);
and the Caddy route below existed only in a docstring. The upload POST reached a
backend that did not exist, and the archive GET fell through the Funnel root to
n8n. Exactly the `/nas-photos` failure class (DR-0268): built, correct, never
actuated, invisible because every layer the repo could see was green.
`scripts/funnel-actuation-guard.mjs` is the witness that now fails the build on
a route that reaches nothing.

If the NAS Caddyfile is ever confirmed to have an import directory, this route
may additionally be served there — the two do not conflict:

```
handle /taxes/upload {
    reverse_proxy 127.0.0.1:8790
}
```

The app posts multipart (`file`, `entityId`, `year`, `kind`) with the bearer;
the endpoint is PDF-only, path-guarded (no traversal), size-capped (25 MB), and
bearer-gated. Uploaded returns land at
`/volume1/PoeTech/tax-documents/<entity>/<year>/<name>.pdf` — the same place the
manual drop uses, so the two paths converge.
