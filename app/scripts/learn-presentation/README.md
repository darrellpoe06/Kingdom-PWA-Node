# Learn presentation pipeline

Generates the **promotional doorway** for each Learn lesson: display title, thumbnail headline, promotional description, cinematic image prompt, alt text, and one unique thumbnail image. Each result is tied to the lesson's existing `(courseKey, lessonId)`.

It **never writes to a lesson**. It reads lessons through `src/lib/learn-presentation/integrity.js` (`learnInventory()`, the same 13 departments / 51 courses / 994 lessons Learn mounts), and it writes only presentation records. Every record comes out with status **`review`**. Approval is a person's act in the admin review, never the pipeline's.

## Run it

All commands run from `app/`:

```bash
npx vite-node scripts/learn-presentation/cli.mjs <command> [flags]
```

| Command | What it does |
|---|---|
| `estimate` | Counts lessons in scope and prints the projected cost per provider. Makes no calls. |
| `text` | Stage A: one LLM call per lesson. Produces strict JSON, validated against the live catalog. |
| `images` | Stage B: one image per lesson that has passed copy, saved as `<out>/<courseKey>/<lessonId>.<ext>`. |
| `status` | Shows the ledger summary: done, needs review, failed, and spend. |
| `export` | Writes records in the `presentation-seed.json` shape (status `review`) for the review dashboard. |
| `retry-failed` | Re-runs failed jobs. Add `--kind text` or `--kind image` to limit it to one stage. |

| Flag | Default | Meaning |
|---|---|---|
| `--only seed` or `--only id,id` | all | `seed` = the 20 prototype lessons in `presentation-seed.json` |
| `--limit N` | — | First N lessons in scope |
| `--provider` | `anthropic` (text) / `bfl` (images) | text: `anthropic`, `local` · images: `bfl`, `openai`, `gemini`, `local` |
| `--model` | provider default | Text model override |
| `--budget-cents N` | none | Hard cap for **this run**. A call that would cross it is never sent; the remaining lessons stay `queued`. |
| `--concurrency N` | 4 | Parallel jobs |
| `--per-minute N` | 30 | Image requests per minute (token bucket) |
| `--max-attempts N` | 3 | Per-job attempts across runs |
| `--batch ID` | `library-v1` | Batch name (part of the idempotency key) |
| `--state DIR` / `--out DIR` | `.learn-presentation/state` / `.learn-presentation/images` | Gitignored |
| `--prices file.json` | built-in table | Override the price table (same shape as `lib/prices.mjs`) |

## Environment (keys are read only from env; no key means the provider refuses)

| Variable | Used by |
|---|---|
| `ANTHROPIC_API_KEY`, `LEARN_TEXT_MODEL` | text `anthropic` |
| `LEARN_LOCAL_TEXT_URL` (e.g. `http://nas:11434/v1`), `LEARN_LOCAL_TEXT_MODEL`, `LEARN_LOCAL_TEXT_KEY` | text `local` (Ollama, LM Studio, vLLM) |
| `BFL_API_KEY`, `LEARN_BFL_RAW=1` (raw/realism mode) | images `bfl` (FLUX 1.1 [pro] Ultra) |
| `OPENAI_API_KEY`, `LEARN_OPENAI_IMAGE_MODEL`, `LEARN_OPENAI_QUALITY` | images `openai` |
| `GEMINI_API_KEY`, `LEARN_GEMINI_IMAGE_MODEL` | images `gemini` |
| `LEARN_COMFY_URL`, `LEARN_COMFY_WORKFLOW` (API-format JSON containing `"%PROMPT%"` and `"%SEED%"`) | images `local` (ComfyUI) |

## The 20-lesson pilot (after the cost is approved)

```bash
npx vite-node scripts/learn-presentation/cli.mjs estimate --only seed
npx vite-node scripts/learn-presentation/cli.mjs text   --only seed --budget-cents 100
npx vite-node scripts/learn-presentation/cli.mjs images --only seed --provider bfl --budget-cents 300
npx vite-node scripts/learn-presentation/cli.mjs export --to .learn-presentation/pilot.json
```

## The whole library (after the pilot is approved)

```bash
npx vite-node scripts/learn-presentation/cli.mjs text   --budget-cents 1500 --concurrency 6
npx vite-node scripts/learn-presentation/cli.mjs images --provider bfl --budget-cents 9000 --concurrency 6 --per-minute 30
npx vite-node scripts/learn-presentation/cli.mjs status
npx vite-node scripts/learn-presentation/cli.mjs export
```

**Resume:** run the same command again.
- Succeeded jobs are skipped.
- A job left `running` by a crash is retried once its lease (10 minutes) lapses.
- Failed jobs retry until `--max-attempts` is reached.
- A lesson whose content changed since its copy was made (a different `contentSha`) is re-queued and its old copy is not reused.

The ledger is append-only (`jobs.jsonl`), so a kill mid-run loses nothing already written.

## Permanent storage and publishing (2026-11-25)

- `originals-backup` (free): every paid original in the ledger is copied to the
  private repo `darrellpoe06/poetech-learn-originals` at
  `originals/<courseKey>/<lessonId>/<sha256>.<ext>`, listed in `manifest.json`, then
  checked byte-for-byte on a FRESH clone; `verdict.json` records the result. Nothing
  is overwritten or deleted. Needs `LEARN_ORIGINALS_TOKEN`; `--fallback-artifact ID`
  restores missing pictures from a run artifact first (exit 5 = not all verified).
- The storage gate opens on the NAS verdict OR this verdict (every paid sha verified
  and in the manifest, under 72h old). The workflow backs up after every part of 50.
- `publish-covers` (free): new passing covers (own composed image, no needsReview)
  become a tree the workflow's publish job commits to `claude/learn-covers-<run>`;
  an existing cover or record with a cover is never replaced.
- `ledger-check` (free; exit 6 = stale): run after every cache restore and before
  every paid step (text, images, art-v2) and every originals verdict. A ledger that
  knows fewer paid pictures than the originals manifest or the NAS verdict's
  `expected`, or whose spend is negative, stops (incident run 45625192907: a pilot
  ledger restored over the library's 176 pictures, total -$8.22).
- `ledger-restore --artifact ID` (free; exit 7 = refused; workflow `only=ledger-restore`):
  replaces `state/`, `images/` and `composed/` with a run artifact's, only when its
  ledger keeps every current job key (adjustment rows aside: they re-apply once from
  git), has at least as many succeeded picture jobs, and every paid picture it names
  is present with the paid bytes (lib/ledger-restore.mjs).

## What it checks automatically

- **The app's own validator** (`validateRecords`) runs on every result. It checks:
  - the lesson exists and its original title matches exactly
  - the display title is not just the original title
  - the headline is not the original title
  - house style: "Yahweh", not generic "God", in our authored voice
  - no over-promising
  - alt text is present
- **Duplicate display titles** are rejected across the whole library.
- **Retry on failure.** A failing result is retried once with the reason fed back to the model. If it fails again, the job goes to `needs-review` as a `draft`.
- **Duplicate images.** Identical image bytes (sha256) are flagged for review. Near-duplicates (dHash within 6 bits) are flagged when a perceptual-hash hook is supplied: `runImages({ perceptualHash })`. That hook is meant to come from the thumbnail compositor's derivative step, which already decodes every master. No image-decoding dependency is added here.
- **Provider errors.** 429 and 5xx responses, and timeouts, are retried with exponential backoff and jitter. Every call has a hard timeout: text 120 s, image 240 s.
- **One image per unique lesson.** The age versions are readings of one lesson, not separate thumbnails.

## What is NOT automatic

- **Approval.** Every record exports as `review`. A person approves, edits or rejects it in the admin review dashboard before learners see it.
- **Typography.** The headline is not baked into the image. The prompt asks for clean negative space on the left, and the headline is set over the image by the app or compositor. That keeps it sharp, on brand, and editable.
- **Database sync.** `export` writes JSON in the seed shape. The ledger fields mirror `learn_presentation` and `learn_presentation_jobs` in migration 0343, which is written but not applied. Upserting into Supabase is a later, approved step.
- **Spending.** Nothing runs without a provider key in the environment, and `--budget-cents` caps each run.

## Costs (list prices, 2026-11-23 — confirm before a paid run)

994 lessons, with 30% allowed for regeneration (1,293 images):

| Provider | Images | Notes |
|---|---|---|
| FLUX 1.1 [pro] Ultra | ≈ $77.58 | $0.06/img, up to 4 MP, raw mode for realism |
| Google image (Imagen-class) | ≈ $64.65 | Imagen 4 endpoints are being retired; use the current Gemini image model |
| OpenAI GPT Image 1.5 medium | ≈ $64.65 | |
| OpenAI GPT Image 1 mini high | ≈ $67.24 | |
| Ideogram 3.0 Quality | ≈ $116.37 | |
| OpenAI GPT Image 1.5 high | ≈ $258.60 | |
| Local ComfyUI | $0 + electricity | Needs a GPU, and the model's license must allow commercial use |

Text costs about $11 for the whole library (≈1¢ per lesson), or $0 on a local LLM.
