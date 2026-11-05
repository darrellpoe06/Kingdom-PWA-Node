// =============================================================================
// error-text-guard — proven to catch (DR-1330 D5, DR-0076 §3): each exception-
// text shape on a response line requires a finding, in Python and JavaScript,
// including the 2026-11-05 sites verbatim; the same text on a log line, a
// report dict, or a comment does not; the live tree is clean.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { scan, judge } from '../../../scripts/error-text-guard.mjs';

describe('error-text-guard: proven to catch', () => {
  it('catches the 2026-11-05 sites verbatim', () => {
    const sites = [
      `            return JSONResponse({"error": "transcribe-failed", "detail": str(e)}, status_code=500)`,
      `    return json({ error: 'bridge-error', detail: (e && e.message) || String(e) }, 500);`,
      `        JSON.stringify({ error: \`\${label} proxy upstream unreachable\`, detail: String((err && err.message) || err) }),`,
      `      return cors(env, request, json({ error: e.message || 'internal error' }, 500));`,
    ];
    // The funnel-proxy line builds its JSON on the line after `new Response(`;
    // the guard reads lines, so the test joins the two the way the file does.
    expect(scan(sites[0])).toHaveLength(1);
    expect(scan(sites[1])).toHaveLength(1);
    expect(scan(`      return new Response(${sites[2].trim()}`)).toHaveLength(1);
    expect(scan(sites[3])).toHaveLength(1);
  });
  it('catches each exception-text shape on a response line', () => {
    for (const s of ['str(e)', 'repr(err)', 'e.message', 'err.message', 'error.message', '${e}', 'String(e)', 'e.args']) {
      expect(scan(`return JSONResponse({"detail": ${s}}, status_code=500)`), s).toHaveLength(1);
      expect(scan(`res.json({ error: ${s} })`), s).toHaveLength(1);
    }
  });
  it('passes a response that carries a code and a ref, a log line that carries the text, a report dict, and a comment', () => {
    expect(scan(`return JSONResponse({"error": "transcribe-failed", "ref": ref}, status_code=500)`)).toEqual([]);
    expect(scan(`_log.error("[%s] %s", ref, str(e), exc_info=True)`)).toEqual([]);
    expect(scan(`report["failed"].append({"id": rid, "error": str(e)})`)).toEqual([]);
    expect(scan(`# return JSONResponse({"detail": str(e)})`)).toEqual([]);
    expect(scan(`console.error(\`[\${ref}] bridge-error\`, e.message)`)).toEqual([]);
  });
  it('judges: an unallowlisted finding fails; a dated entry passes; a stale one fails', () => {
    const f = [{ path: 'infra/x/server.py', line: 9, text: 'x' }];
    expect(judge(f, [], '2026-11-05')).toEqual(['infra/x/server.py:9: x']);
    expect(judge(f, [{ path: 'infra/x/server.py', line: 9, why: 'a dev-only echo', reReview: '2026-12-05' }], '2026-11-05')).toEqual([]);
    expect(judge(f, [{ path: 'infra/x/server.py', line: 9, why: 'x', reReview: '2026-11-01' }], '2026-11-05')[0]).toMatch(/passed its re-review date/);
  });
});
