# Commit procedures (fast, lean, race-safe)

One script encodes the whole commit -> PR -> merge flow for this repo:
**`scripts/ship.sh`**. It exists because doing this by hand repeatedly exposed
the same pitfalls; the script bakes the fixes in so commits stay fast and clean.

## The procedures

| Tier | Command | What it does | When |
|------|---------|--------------|------|
| **A** (default) | `scripts/ship.sh <branch> "<title>" [files...]` | commit -> push -> PR -> wait CI -> **squash-merge** | bug fixes, copy, docs, low-risk additive changes |
| **B** | `... --tier b` | commit -> push -> **PR only** (soak on the Vercel preview) | new features, visual changes |
| **C** | `... --tier c` | commit -> push -> **PR only** (review + sign-off) | front-door / mission / money / COLG-facing / tenancy |

Add `--no-test` for docs/scripts-only changes. Tiers map to
[`RELEASE-TIERS.md`](../00-foundations/_root/RELEASE-TIERS.md).

## Why each step (the hard-won part)

1. **Branch off FRESH `origin/main`.** `main` advances mid-session (the other
   session merges). The script `git fetch`es first, every time.
2. **Lint + vitest BEFORE pushing.** Cheap local gate beats a red CI cycle.
3. **Push the commit OBJECT** (`git push origin <sha>:refs/heads/<branch>`), not
   a branch checkout. This **survives the two-session git race**: if a
   concurrent session switches the working-tree branch between your `add` and
   `commit`, the commit is still captured by sha and pushes to the right branch.
   (See the Two-Session Git Race Rule in `CLAUDE.md`.)
4. **Wait for the `lint + vitest` check to PASS** before merging. Branch
   protection rejects an early merge with "base branch policy prohibits the
   merge" - the script polls `gh pr checks` until green.
5. **Squash-merge + delete branch.** Keeps `main` a clean one-commit-per-change
   history (matches the existing `feat(...)(#NN)` style).
6. **Plain commit subjects, no co-author trailer** - repo convention.

## Example

```bash
scripts/ship.sh fix/blank-tiles "fix(photos): hide thumbless tiles" \
  app/src/components/LifeGallery.jsx
```

Stages the file, gates on lint+tests, ships it to `main` through a green PR -
hands-off once it's green.
