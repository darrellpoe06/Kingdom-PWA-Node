#!/usr/bin/env node
// =============================================================================
// gpu-preemption-guard — a GPU-reserving Ollama must yield VRAM in ~1 second
// =============================================================================
// Darrell 2026-08-14: "we have cuda cpu's in our pipeline... already connected
// to the process... comprehensive process evaluation and reports"
//
// The evaluation found a divergence between what a file CITES and what the
// decision it cites REQUIRES — the DR-0219 SHOULD/ARE class, and invisible in
// review precisely because the comment reads correct.
//
// SHOULD — DR-0012 §3 (read 2026-08-14, docs/decisions/DR-0012-*.md:20):
//   "Creative apps / ANY non-Ollama CUDA process are a first-class,
//    absolute-priority preemption trigger... the reasoner yields GPU the moment
//    creative apps are active — not only on session/PWA activity — frees VRAM
//    (`OLLAMA_KEEP_ALIVE=0`) within ~1 s."
//   The trigger is ANY non-Ollama CUDA process — a Premiere export, a Cinema 4D
//   render, OBS encoding a service. Not just a livestream.
//
// ARE — measured 2026-08-14, before the fix:
//   infra/church-gpu-node/docker-compose.yml:66      OLLAMA_KEEP_ALIVE=5m
//   infra/ai-orchestrator/node1/docker-compose.yml:43 OLLAMA_KEEP_ALIVE=15m
//   Both reserve `driver: nvidia`. Both sat on a 12 GB 4070. The church-gpu-node
//   line even carried the comment "DR-0012 absolute-priority preemption" while
//   holding VRAM 300x longer than DR-0012 allows.
//
// WHY THIS IS NOT COSMETIC: `livestream-main-pc` doubles as the Presenter box
// feeding the NovaStar -> wall. A 14B model squatting on 12 GB of VRAM for five
// minutes after its last call is five minutes where a person opening Premiere,
// or a service starting, contends with a background reasoner for the same card.
// DR-0012's constraint from Darrell was explicit: "decide based on how we use it
// currently; do NOT undermine work on days the CUDA is being used."
//
// SCOPE — deliberately narrow, because a noisy gate gets disabled and a disabled
// gate protects nothing:
//   * only compose services whose image is ollama/ollama
//   * only those that ALSO reserve an NVIDIA device (`driver: nvidia`)
//   * a CPU/RAM-bound Ollama is NOT in scope and is never flagged. The NAS stack
//     (infra/n8n/docker-compose.yml) holds 15m with a 24g memory limit and no GPU
//     reservation — that is RAM, not VRAM, and contends with nothing creative.
//     DR-0012 is a GPU-contention rule; applying it to a CPU box would be the
//     false-positive that gets the guard turned off.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const INFRA_DIR = join(ROOT, 'infra');

// A GPU-reserving Ollama excluded here must say WHY. No silent carve-outs
// (the rule the sibling guards already enforce on themselves).
export const EXCLUSIONS = {
  // 'some/docker-compose.yml#service': 'why this GPU ollama may hold VRAM',
};

// DR-0012 §3: the only conforming value. "0" frees VRAM immediately; Ollama also
// accepts "0s"/"0m" as the same instruction, so those pass too.
const CONFORMING = /^0(s|m|h)?$/;

/**
 * Find GPU-reserving Ollama services that hold VRAM, in one compose file.
 * Pure: takes YAML text, returns findings. No I/O, so tests drive it directly.
 *
 * Hand-rolled indentation walk rather than a YAML dependency: compose files here
 * are plain 2-space maps, and a guard that needs an install step is a guard that
 * silently stops running.
 */
export function scanComposeForPreemption(src) {
  const out = { services: 0, gpuOllama: 0, conforming: 0, violations: [] };
  const text = String(src || '');
  if (!/ollama\/ollama/.test(text)) return out;

  const lines = text.split('\n');

  // Locate the `services:` map, then each service block at its child indent.
  let servicesIndent = -1;
  let blockIndent = -1;
  const blocks = []; // { name, start, end }
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const indent = line.length - line.replace(/^\s*/, '').length;

    if (servicesIndent < 0) {
      if (/^services\s*:/.test(line)) servicesIndent = indent;
      continue;
    }
    if (indent <= servicesIndent) { // left the services map entirely
      if (blocks.length) blocks[blocks.length - 1].end = i;
      servicesIndent = -1; blockIndent = -1;
      continue;
    }
    if (blockIndent < 0) blockIndent = indent;
    if (indent === blockIndent && /^\s*[A-Za-z0-9_.-]+\s*:\s*$/.test(line)) {
      if (blocks.length) blocks[blocks.length - 1].end = i;
      blocks.push({ name: line.trim().replace(/:\s*$/, ''), start: i, end: lines.length });
    }
  }

  for (const b of blocks) {
    out.services += 1;
    const body = lines.slice(b.start, b.end);
    const bodyText = body.join('\n');
    // Comments never count — a `driver: nvidia` in prose is not a reservation.
    const code = body.filter((l) => !/^\s*#/.test(l)).join('\n');

    const isOllama = /image\s*:\s*ollama\/ollama/.test(code);
    const reservesGpu = /driver\s*:\s*nvidia/.test(code);
    if (!isOllama || !reservesGpu) continue;
    out.gpuOllama += 1;

    const m = /OLLAMA_KEEP_ALIVE\s*=\s*([^\s#]+)/.exec(code);
    const value = m ? m[1].trim() : null;

    if (value !== null && CONFORMING.test(value)) { out.conforming += 1; continue; }

    // Report the line the reader must edit, not the top of the block.
    const rel = m
      ? body.findIndex((l) => !/^\s*#/.test(l) && /OLLAMA_KEEP_ALIVE/.test(l))
      : body.findIndex((l) => !/^\s*#/.test(l) && /image\s*:\s*ollama\/ollama/.test(l));

    out.violations.push({
      service: b.name,
      line: b.start + (rel >= 0 ? rel : 0) + 1,
      kind: value === null ? 'gpu-ollama-without-keep-alive' : 'gpu-ollama-holds-vram',
      value,
      detail: value === null
        ? `service "${b.name}" reserves an NVIDIA GPU with no OLLAMA_KEEP_ALIVE — Ollama's 5m default holds VRAM against creative/live work (DR-0012 §3 requires 0)`
        : `service "${b.name}" reserves an NVIDIA GPU and holds VRAM for ${value} — DR-0012 §3 requires OLLAMA_KEEP_ALIVE=0 (free within ~1 s)`,
      // Kept so a reader can see the claim-vs-rule gap that produced this guard.
      citesDr0012: /DR-0012/.test(bodyText),
    });
  }
  return out;
}

/** Every compose file under infra/, minus excluded ones. */
export function listComposeFiles(dir = INFRA_DIR) {
  const found = [];
  const walk = (d) => {
    let entries = [];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries) {
      const full = join(d, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(full);
        continue;
      }
      if (!/^docker-compose.*\.ya?ml$/.test(name)) continue;
      found.push(relative(ROOT, full).split('\\').join('/'));
    }
  };
  walk(dir);
  return found.sort();
}

/** Scan every compose file. Returns violations attributed to their file. */
export function scanGpuPreemption(dir = INFRA_DIR) {
  const violations = [];
  const totals = { files: 0, gpuOllama: 0, conforming: 0 };
  const badExclusions = Object.entries(EXCLUSIONS)
    .filter(([, reason]) => typeof reason !== 'string' || reason.trim().length < 10)
    .map(([k]) => k);

  for (const rel of listComposeFiles(dir)) {
    let src = '';
    try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    const r = scanComposeForPreemption(src);
    if (!r.gpuOllama) continue;
    totals.files += 1;
    totals.gpuOllama += r.gpuOllama;
    totals.conforming += r.conforming;
    for (const v of r.violations) {
      if (Object.prototype.hasOwnProperty.call(EXCLUSIONS, `${rel}#${v.service}`)) continue;
      violations.push({ file: rel, ...v });
    }
  }
  return { violations, totals, badExclusions };
}

// ----------------------------------------------------------------------------- CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { violations, totals } = scanGpuPreemption();
  console.log('# GPU PREEMPTION GUARD (DR-0012 §3 — a GPU Ollama yields VRAM in ~1s)\n');
  console.log(`Compose files with a GPU-reserving Ollama: ${totals.files} | services ${totals.gpuOllama} | conforming ${totals.conforming}\n`);
  if (!violations.length) {
    console.log(`gpu-preemption-guard: OK — all ${totals.gpuOllama} GPU-reserving Ollama service(s) set OLLAMA_KEEP_ALIVE=0.`);
    process.exit(0);
  }
  for (const v of violations) {
    console.log(`${v.file}:${v.line} — ${v.kind}`);
    console.log(`  ${v.detail}`);
    if (v.citesDr0012) {
      console.log('  NOTE: this service CITES DR-0012 while diverging from it — the comment reads correct, which is why review missed it.');
    }
  }
  console.log(`\ngpu-preemption-guard: ${violations.length} violation(s). Set OLLAMA_KEEP_ALIVE=0 (DR-0012 §3).`);
  process.exit(1);
}
