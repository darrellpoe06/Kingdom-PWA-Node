// @vitest-environment node
// =============================================================================
// A BUILD VAR NEVER REFERENCES ITSELF — the gate for the 2026-10-09 silent empty
// =============================================================================
// WHAT HAPPENED. Every Cloudflare Pages Function stopped being invoked, so the
// Cameras tab lost its transport. The repair pointed the build at the Funnel
// with a value written to $GITHUB_ENV and read back in the build step's env:
//
//     echo "VITE_CAMS_BASE=https://…/cams"        # written to $GITHUB_ENV
//     VITE_CAMS_BASE: ${{ env.VITE_CAMS_BASE }}   # read in the build step
//
// A step's own env: key SHADOWS the env context, so that read resolves EMPTY.
// The deploy went green, the lesson-grade unit tests went green, the PR merged
// — and the served bundle carried no Funnel camera URL at all. Darrell was
// looking at ROAD UNREACHABLE on the exact build that was supposed to fix it,
// and asked the question that found it: "Why didn't you test it afterwards...
// testing our fixes is a Way, correct?" He was right. Nothing in CI could see
// this, because the defect lived in the workflow's own variable plumbing.
//
// The sign-in unlock survived only by luck of naming: SOVEREIGN_SB_URL feeding
// VITE_SUPABASE_URL has two different names, so nothing shadowed anything.
//
// THE RULE THIS PINS: a value carried from $GITHUB_ENV into a build variable
// must be written under a DIFFERENT name than the variable it feeds. Same name
// on both sides is always the silent-empty bug, never a working config.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS = join(HERE, '..', '..', '..', '.github', 'workflows');

/** Every `KEY: ${{ env.KEY }}` pair in a workflow, which is always the bug. */
function selfReferences(text) {
  const out = [];
  // KEY: ${{ env.KEY }}  — optionally with a `||` fallback after it.
  const re = /^\s*([A-Z_][A-Z0-9_]*)\s*:\s*\$\{\{\s*env\.([A-Z_][A-Z0-9_]*)\s*(?:\}\}|\|\|)/gm;
  for (const m of text.matchAll(re)) {
    if (m[1] === m[2]) out.push(m[1]);
  }
  return out;
}

const files = readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

describe('no workflow feeds a build variable from itself', () => {
  it('finds the workflow directory', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files).toContain('deploy-cloudflare-pages.yml');
  });

  it('no `KEY: ${{ env.KEY }}` anywhere — that always resolves empty', () => {
    const bad = [];
    for (const f of files) {
      for (const key of selfReferences(readFileSync(join(WORKFLOWS, f), 'utf8'))) {
        bad.push(`${f}: ${key} is fed from env.${key} — the step's own key shadows the context, so this ships EMPTY`);
      }
    }
    expect(bad, `self-referencing build variables:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the deploy still carries both 2026-10-09 unlocks, under non-shadowing names', () => {
    const t = readFileSync(join(WORKFLOWS, 'deploy-cloudflare-pages.yml'), 'utf8');
    // If an unlock is present at all, it must be wired through a distinct name.
    if (t.includes('VITE_CAMS_BASE:')) {
      expect(t).toMatch(/VITE_CAMS_BASE:\s*\$\{\{\s*env\.UNLOCK_CAMS_BASE\s*\}\}/);
      expect(t).toMatch(/UNLOCK_CAMS_BASE=/);
    }
    if (t.includes('VITE_VOICE_LITE_BASE:')) {
      expect(t).toMatch(/VITE_VOICE_LITE_BASE:\s*\$\{\{\s*env\.UNLOCK_VOICE_LITE_BASE\s*\}\}/);
      expect(t).toMatch(/UNLOCK_VOICE_LITE_BASE=/);
    }
  });
});

// PROVEN-TO-CATCH (DR-0076 section 3): a gate that cannot fail is itself a lie.
describe('PROVEN-TO-CATCH', () => {
  it('catches the exact line that shipped empty on 2026-10-09', () => {
    expect(selfReferences('          VITE_CAMS_BASE: ${{ env.VITE_CAMS_BASE }}')).toEqual(['VITE_CAMS_BASE']);
  });

  it('catches it with a `||` fallback too, which hides it even better', () => {
    expect(selfReferences('  FOO: ${{ env.FOO || secrets.FOO }}')).toEqual(['FOO']);
  });

  it('allows the correct shape: two different names', () => {
    expect(selfReferences('          VITE_SUPABASE_URL: ${{ env.SOVEREIGN_SB_URL || secrets.VITE_SUPABASE_URL }}')).toEqual([]);
    expect(selfReferences('          VITE_CAMS_BASE: ${{ env.UNLOCK_CAMS_BASE }}')).toEqual([]);
  });

  it('does not fire on an ordinary secret or literal', () => {
    expect(selfReferences('          TOKEN: ${{ secrets.TOKEN }}')).toEqual([]);
    expect(selfReferences('          LEVEL: debug')).toEqual([]);
  });
});
