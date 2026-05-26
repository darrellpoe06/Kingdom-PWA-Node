# =============================================================================
# commit-n8n-rollout-2026-05-26-followup.ps1  (ASCII-only)
# =============================================================================
# Follow-up to commit-n8n-rollout-2026-05-26.ps1 (Phase 1 batch).
#
# Decision 2026-05-26: dual-model Ollama architecture.
#   PRIMARY:   qwen2.5:3b-instruct-q4_K_M     (fast/general)
#   SECONDARY: deepseek-r1:8b-llama-distill-q4_K_M    (reasoning-focused)
# Both loaded in parallel. Workflows pick via $env, never hardcoded.
#
# Touched files (relative to repo root):
#   infra/n8n/.env.example                    (added OLLAMA_BASE_URL + 2 model vars)
#   infra/n8n/docker-compose.yml              (pass-through env + cap to 12g + MAX_LOADED_MODELS=2)
#   infra/n8n/INSTALL.md                      (Step 5 dual-pull, "when to use which" section, dual smoke tests)
#   docs/00-foundations/n8n-workflows/README.md  (dual-model table + env pattern + DeepSeek <think>-tag note)
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26-followup.ps1
#
# Idempotent: if you happened to fold these into the Phase 1 commit, git add
# will be a no-op and git commit will exit non-zero (caught and reported).
# ASCII-only on purpose. See memory/feedback_powershell-ascii-only.md.
# =============================================================================

$repo = 'C:\Users\dpoe\Kingdom-PWA-Node'
$ErrorActionPreference = 'Stop'

function Clear-AllGitLocks {
    $locks = Get-ChildItem -Path (Join-Path $repo '.git') -Recurse -Filter '*.lock' -Force -ErrorAction SilentlyContinue
    if ($locks) {
        foreach ($l in $locks) {
            try { Remove-Item $l.FullName -Force -ErrorAction Stop; Write-Host ("  cleared: " + $l.FullName.Substring($repo.Length+1)) -ForegroundColor Yellow }
            catch { Write-Host ("  COULD NOT CLEAR: " + $l.FullName) -ForegroundColor Red }
        }
    }
}

function Invoke-GitRetry {
    param([string]$Label, [scriptblock]$Action)
    Clear-AllGitLocks
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Clear-AllGitLocks; Start-Sleep -Milliseconds 400
        & $Action
        if ($LASTEXITCODE -ne 0) { throw "$Label failed" }
    }
}

# Resolve current branch -----------------------------------------------------
$branch = (& git -C $repo rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq 'HEAD') {
    throw "Cannot resolve current branch. Check 'git -C $repo status'."
}
Write-Host ""
Write-Host ("=== Committing dual-model follow-up to branch: " + $branch + " ===") -ForegroundColor Cyan
Write-Host ""

# Stage the dual-model changes (plus this script itself) ----------------------
Invoke-GitRetry -Label 'add' -Action {
    & git -C $repo add `
        infra/n8n/.env.example `
        infra/n8n/docker-compose.yml `
        infra/n8n/INSTALL.md `
        docs/00-foundations/n8n-workflows/README.md `
        commit-n8n-rollout-2026-05-26-followup.ps1
}

# Show what's staged ---------------------------------------------------------
Write-Host "Staged changes:" -ForegroundColor Cyan
& git -C $repo diff --cached --stat
Write-Host ""

# Commit ---------------------------------------------------------------------
Invoke-GitRetry -Label 'commit' -Action {
    & git -C $repo commit `
        -m 'feat(n8n): dual-model Ollama - Qwen 3B (fast) + DeepSeek-R1-Distill Llama 8B (reasoning)' `
        -m 'Follow-up to Phase 1 (n8n Stack B rollout). Adds a secondary Ollama model alongside the primary - both local, both $0/mo perpetual, both loaded in parallel. Decision green-lit by Darrell 2026-05-26.' `
        -m 'Architecture: PRIMARY qwen2.5:3b-instruct-q4_K_M (~2 GB resident, 10-15 tok/sec CPU) for fast/general (summary, classification, latency-sensitive routing); SECONDARY deepseek-r1:8b-llama-distill-q4_K_M (~5 GB resident, 3-5 tok/sec CPU) for reasoning (chain-of-thought analysis of change_requests, trade-off weighing in projects, multi-step reasoning over Scripture-grounded prompts).' `
        -m 'Container changes (infra/n8n/docker-compose.yml): OLLAMA_MAX_LOADED_MODELS bumped 1 -> 2 so both stay resident with no cold-load penalty between calls; memory cap bumped 8g -> 12g to fit both models plus Ollama runtime with a 3 GB cushion (Supabase Postgres is cloud-hosted, so the previously-reserved 4 GB Postgres budget freed up); n8n service now pass-through OLLAMA_BASE_URL + OLLAMA_PRIMARY_MODEL + OLLAMA_SECONDARY_MODEL so workflows read model selection from $env instead of hardcoding the tag.' `
        -m 'Workflows current state: none of 01-05 call Ollama yet (they are notification/cron/webhook plumbing). The dual-model scaffolding is in place so the next LLM-calling workflow (POE change_request reasoner, Scripture companion, summary-augmented daily report, etc.) uses $env.OLLAMA_PRIMARY_MODEL or $env.OLLAMA_SECONDARY_MODEL via the documented pattern in docs/00-foundations/n8n-workflows/README.md. When a workflow does call Ollama, that file gets a Calls-LLM column update.' `
        -m 'DeepSeek-R1 chain-of-thought handling: model emits visible reasoning between <think>...</think> tags. Workflows surfacing output to users must strip the think block first - one-liner Code node pattern documented in README.md.' `
        -m 'INSTALL.md Step 5 now pulls both models in parallel SSH terminals (max-forward-motion principle), with When-to-use-which guidance using POE invitation-not-command tone (Help me understand quickly / Help me reason carefully), and dual smoke-test curl examples plus `ollama ps` verification that both are resident.' `
        -m 'Memory budget at full load (Synology DS1621xs): Ollama 12 GB cap + n8n 1-2 GB + ntfy 0.5 GB + DSM ~4 GB = ~18-20 GB. Fits 32 GB target with headroom. Tight on 16 GB - INSTALL.md notes this risk.'
}

# Push -----------------------------------------------------------------------
Invoke-GitRetry -Label 'push' -Action {
    & git -C $repo push origin $branch
}

# Show the new SHA -----------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ("Dual-model follow-up committed and pushed to " + $branch + ".") -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
& git -C $repo log --oneline -3
