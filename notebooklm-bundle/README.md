# NotebookLM bundle

A **non-sensitive, redacted "spine"** of this project — doctrine, methodology, and
decision records — packaged for upload to an external comprehension lens like
[NotebookLM](https://notebooklm.google.com). It exists so a person can *query* the
project's foundations (onboarding, teaching, contradiction-finding, audio overviews)
without hand-reading the tree.

## Build it

```
node scripts/build-notebooklm-bundle.mjs
```

Writes 5 combined Markdown sources + `MANIFEST.md` into this folder (git-ignored;
regenerate any time the spine changes). What lands in the bundle:

| Source | Contents |
| --- | --- |
| `01-layer0-identity.md` | `CLAUDE.md` — the Layer 0 binding rules |
| `02-foundations.md` | every `docs/00-foundations/_root/*` foundation |
| `03-decision-records.md` | every `docs/decisions/*` decision record |
| `04-reviews.md` | the `docs/reviews/REVIEWS.md` ledger |
| `05-icm-methodology.md` | the ICM one-page explainer (`ICM-METHODOLOGY.md`) |

## Upload

1. **notebooklm.google.com** → **New notebook** → **Add source** → drag the `.md` files.
2. Try an **Audio Overview** of the foundations; ask *"where do the decision records
   conflict or leave something unresolved?"*; generate a **briefing doc** of the ICM.

## The sovereignty line (why this is a *curated* bundle, not the whole repo)

NotebookLM is **Google's cloud** — uploading is publishing off the NAS, in tension
with `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` and the sovereign-infrastructure commitment.
So the bundle carries **design/doctrine spine only**, and the generator runs a
**redaction pass** (internal IPs, Tailscale hostnames, emails, token/secret-shaped
strings → `[REDACTED-…]`) with a transparent count in `MANIFEST.md`.

**Never in this bundle:** the app's family/financial data, real PII, seed-as-real
content, `.env`, or any credential. It is a lens over a copy — the repository stays
the source of truth, and NotebookLM's output is a draft to verify, never canonical.
