// @vitest-environment node
//
// context-hygiene guard (DR-0244 / P36) — proven-to-catch (DR-0076 §3): the
// guard BLOCKS the exact wound from the source incident (a raw subagent
// transcript imported for a status check) and stays out of the way of every
// ordinary read — including the house's own legitimate .jsonl data files.
import { describe, it, expect } from 'vitest';
import { classifyTranscriptImport } from '../../../scripts/context-hygiene-pretool-hook.mjs';

describe('classifyTranscriptImport — blocks the transcript import', () => {
  it('blocks a Read of a harness task output file', () => {
    const v = classifyTranscriptImport({
      toolName: 'Read',
      toolInput: { file_path: '/tmp/claude-0/x/tasks/ac7554389c6eb9163.output' },
    });
    expect(v.block).toBe(true);
    expect(v.reason).toMatch(/DR-0244/);
    expect(v.reason).toMatch(/never the raw transcript/i);
  });
  it('blocks a Bash tail of an agent transcript JSONL', () => {
    const v = classifyTranscriptImport({
      toolName: 'Bash',
      toolInput: { command: 'tail -200 /root/.claude/projects/p/agent-abc123.jsonl' },
    });
    expect(v.block).toBe(true);
  });
  it('blocks cat of a task output through a pipe', () => {
    const v = classifyTranscriptImport({
      toolName: 'Bash',
      toolInput: { command: 'cat /x/tasks/deadbeef.output | grep result' },
    });
    expect(v.block).toBe(true);
  });
});

describe('classifyTranscriptImport — never touches ordinary work', () => {
  it('allows ordinary source reads', () => {
    expect(classifyTranscriptImport({
      toolName: 'Read',
      toolInput: { file_path: '/home/user/Kingdom-PWA-Node/app/src/lib/research-intake.js' },
    }).block).toBe(false);
  });
  it('allows the house data JSONL files (the reel, conflict events)', () => {
    expect(classifyTranscriptImport({
      toolName: 'Bash',
      toolInput: { command: 'tail -50 docs/orchestration/conflict-events.jsonl' },
    }).block).toBe(false);
    expect(classifyTranscriptImport({
      toolName: 'Read',
      toolInput: { file_path: '/data/poetech-briefing/_reel.jsonl' },
    }).block).toBe(false);
  });
  it('allows a Bash command that mentions a tasks dir without reading a transcript', () => {
    expect(classifyTranscriptImport({
      toolName: 'Bash',
      toolInput: { command: 'ls /tmp/claude-0/x/tasks/' },
    }).block).toBe(false);
  });
  it('fail-open on unknown shapes', () => {
    expect(classifyTranscriptImport({}).block).toBe(false);
    expect(classifyTranscriptImport({ toolName: 'Edit', toolInput: {} }).block).toBe(false);
  });
});

describe('small own-output carve-out (2026-07-30): bounded task-output reads allowed, transcripts stay blocked', () => {
  const small = () => 900;          // bytes — a vitest tail / probe verdict
  const large = () => 500 * 1024;   // bytes — a raw transcript dump
  it('allows a small tasks .output read (Read and Bash); the FULL absolute path reaches sizeOf', () => {
    let seen = '';
    const sizeOf = (p) => { seen = p; return small(); };
    const out = '/tmp/x/tasks/abc.output';
    expect(classifyTranscriptImport({ toolName: 'Read', toolInput: { file_path: out }, sizeOf }).block).toBe(false);
    expect(seen).toBe(out);
    expect(classifyTranscriptImport({ toolName: 'Bash', toolInput: { command: `tail -5 ${out}` }, sizeOf }).block).toBe(false);
    expect(seen).toBe(out);
  });
  it('still blocks a LARGE task output, an unknown size, and agent JSONL at any size', () => {
    const out = '/tmp/x/tasks/abc.output';
    expect(classifyTranscriptImport({ toolName: 'Read', toolInput: { file_path: out }, sizeOf: large }).block).toBe(true);
    expect(classifyTranscriptImport({ toolName: 'Read', toolInput: { file_path: out }, sizeOf: () => null }).block).toBe(true);
    expect(classifyTranscriptImport({ toolName: 'Read', toolInput: { file_path: '/tmp/x/subagents/agent-a1.jsonl' }, sizeOf: small }).block).toBe(true);
  });
});
