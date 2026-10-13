// =============================================================================
// poetech-gate -- the OpenClaw plugin that puts gate.mjs in front of every tool
// =============================================================================
// DR-0670. A standalone plugin file, loaded through `plugins.load.paths`
// (docs: gateway/config-extensions.md, OpenClaw 2026.9.6: "Put standalone plugin
// files in plugins.load.paths"). It registers ONE typed hook, `before_tool_call`
// (docs: plugins/hooks/tool-policy.md), with the highest priority so it speaks
// first: a `block: true` is terminal, and the first `requireApproval` wins.
//
// Role: POETECH_OPENCLAW_ROLE=report (set by run.mjs on the embedded pilot run)
// makes the report-only rules apply; the long-running gateway is role 'act'.
// Budget: POETECH_OPENCLAW_MAX_TOOL_CALLS (default 12) per run, then every call
// in that run is blocked.
// =============================================================================
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { makeHandler } from '../gate.mjs';

export default definePluginEntry({
  id: 'poetech-gate',
  name: 'PoeTech approval gate',
  description: 'Bright lines denied, state changes approved by a human, reads allowed, everything else denied (DR-0670).',
  register(api) {
    const role = process.env.POETECH_OPENCLAW_ROLE === 'report' ? 'report' : 'act';
    const max = Number(process.env.POETECH_OPENCLAW_MAX_TOOL_CALLS || 12);
    api.on('before_tool_call', makeHandler({ role, maxToolCallsPerRun: Number.isFinite(max) && max > 0 ? max : 12 }), {
      priority: 1000,
    });
  },
});
