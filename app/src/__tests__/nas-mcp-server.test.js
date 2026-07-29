// @vitest-environment node
//
// nas-mcp — source pins on the sovereign MCP server (DR-0244; DR-0236 built-now).
// The live round-trip was proven by hand in the build sandbox (discover, list,
// all four tools, 401/400/mismatch refusals — transcript in PR #1101); these
// pins keep the INVARIANTS from drifting: the 2026-07-28 stateless shape, the
// bearer refusal, header-body agreement, cache-hinted lists, and — the bright
// line — v1 stays READ-ONLY (no write path to any state file from this server).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(here, '../../../infra/nas-mcp/mcp_server.py'), 'utf8');

describe('nas-mcp server source pins (DR-0244)', () => {
  it('speaks the 2026-07-28 stateless shape — no sessions, no handshake', () => {
    expect(src).toMatch(/PROTOCOL_VERSION = "2026-07-28"/);
    expect(src).toMatch(/server\/discover/);
    // The docstring may NAME the retired session header; the code must never
    // read it, and no initialize handler may exist.
    expect(src).not.toMatch(/headers\.get\(["']mcp-session-id/i);
    expect(src).not.toMatch(/method == "initialize"/);
  });
  it('refuses an unset or wrong bearer token before anything else', () => {
    expect(src).toMatch(/if not TOKEN or auth != "Bearer " \+ TOKEN/);
    expect(src).toMatch(/status=401/);
  });
  it('enforces header-body agreement (Mcp-Method and Mcp-Name — SEP-2243)', () => {
    expect(src).toMatch(/mcp-method/);
    expect(src).toMatch(/Mcp-Method header must match body method/);
    expect(src).toMatch(/Mcp-Name header must match tool name/);
  });
  it('tools/list carries cache hints with a deterministic tool order (SEP-2549)', () => {
    expect(src).toMatch(/ttlMs/);
    expect(src).toMatch(/cacheScope/);
  });
  it('v1 is READ-ONLY: every file access opens for reading, never writing', () => {
    const opens = src.match(/open\([^)]*\)/g) || [];
    expect(opens.length).toBeGreaterThan(0);
    for (const call of opens) {
      expect(call, `write-mode open found: ${call}`).not.toMatch(/"[wax]"|'[wax]'/);
    }
    expect(src).toMatch(/observation only/);
  });
  it('degrades honestly — missing state reads as not-ok, never invented (DR-0076)', () => {
    expect(src).toMatch(/"ok": False/);
    expect(src).toMatch(/never a fabricated payload|never an invented event/);
  });
});
