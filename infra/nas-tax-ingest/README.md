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

`tax_upload_server.py` is the sovereign receiver for the Books → Taxes upload
form (`app/src/lib/tax-upload.js`). It writes the PDF onto the bind mount,
re-runs the ingest, and returns the fresh archive.

Run it on the NAS:

```
cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-tax-ingest
pip3 install --user fastapi "uvicorn[standard]" python-multipart   # once
TAX_UPLOAD_TOKEN="<same bridge token the app uses>" \
  uvicorn tax_upload_server:app --host 127.0.0.1 --port 8790
```

Route it same-origin in the Caddy site block so the app reaches it at
`/taxes/upload` (beside the static `/taxes/*` it already serves):

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
