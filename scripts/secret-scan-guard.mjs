#!/usr/bin/env node
// =============================================================================
// secret-scan-guard — a credential in the tree is a red build
// =============================================================================
// DR-1330 D4 (2026-11-05). The Ways review measured no secret scanner anywhere
// and one real credential committed: a probe account's sign-in PIN for
// PRODUCTION auth, as a literal in a workflow (nas-health.yml). The grep that
// found it is this guard, made standing: a small set of HIGH-SIGNAL shapes,
// run over every tracked text file on every push, in well under a second,
// with no download. gitleaks runs beside it in CI as the independent second
// method (DR-0076 §7) with the breadth of its rule set; this one carries the
// house's own rules, which gitleaks cannot know:
//
//   workflow-real-password   a `"password":"<literal>"` in .github/ aimed at an
//                            identity that is NOT a self-declaring fake (an
//                            @example.* or .invalid address, or a value that
//                            says it is not real). The 2026-11-05 finding.
//   env-literal              PASSWORD= / SECRET= / TOKEN= / API_KEY= with a
//                            real-looking value in a tracked .env* or compose
//                            file that is not an .example (those hold
//                            placeholders by rule) — the compose files read
//                            `${VAR:-}` and must stay that way.
//
// The vendor shapes (a JWT, an AWS access key id, a GitHub token, a Stripe
// key, an Anthropic or OpenAI key, a Google API key, a Slack token, a
// Supabase secret key, a private-key block) are the ones the review already
// grepped for; each is a specific prefix or structure, never a generic word,
// so the guard stays quiet on the thousands of `token:` labels in app code.
//
// Allowlist: scripts/secret-scan-allowlist.json — path + rule + why + date;
// a fixture that LOOKS like a key (e2e JWTs minted with a throwaway secret)
// is recorded there, never silently skipped. Proven to catch: the unit test
// plants each shape and requires a finding; the fakes pass.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const RULES = [
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { id: 'aws-access-key', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'github-token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { id: 'stripe-key', re: /\b[sr]k_(live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'anthropic-or-openai-key', re: /\bsk-(ant|proj)-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'supabase-secret-key', re: /\bsb_secret_[A-Za-z0-9_-]{10,}\b/ },
  { id: 'private-key-block', re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/ },
  // Found by gitleaks on 2026-11-05 in a session-handoff note and an install
  // guide: a Pushover user key as a literal. Prefix-bound so it stays specific.
  { id: 'pushover-key', re: /PUSHOVER_(USER_KEY|APP_TOKEN|API_TOKEN|TOKEN)\s*[=:]\s*`?['"]?[a-z0-9]{30}\b/ },
];

const FAKE = /not-a-real|not-real|placeholder|change_me|changeme|example|dummy|<[a-z_-]+>|xxx+/i;

/** The house rule: a workflow signs in somewhere real with a literal password. */
export function workflowRealPassword(line) {
  const m = line.match(/"password"\s*:\s*"([^"]{3,})"/);
  if (!m) return null;
  if (FAKE.test(m[1])) return null;
  const email = line.match(/"email"\s*:\s*"([^"]+)"/);
  if (email && /@(example\.[a-z]+|[a-z0-9.-]+\.invalid)$/i.test(email[1])) return null;
  return 'workflow-real-password';
}

/** The house rule: a literal in a tracked env or compose file. */
export function envLiteral(line) {
  const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*[:=]\s*['"]?([^'"\s#]{8,})['"]?\s*$/);
  if (!m) return null;
  const key = m[1];
  const value = m[3];
  if (/^\$\{?[A-Z0-9_]+/.test(value)) return null; // ${VAR:-} or $VAR — read from the environment, as the compose files do
  if (FAKE.test(value)) return null;
  // A key that NAMES where a secret-ish thing lives is not the thing: a URI,
  // a path, a flag, a header name (GOTRUE_HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI
  // tripped this on 2026-11-05); and a value that is a locator, not a value.
  if (/_(URI|URL|PATH|FILE|ENABLED|HEADER|NAME|HOOK)$/.test(key) || /^[a-z][a-z0-9+.-]*:\/\//.test(value)) return null;
  return 'env-literal';
}

/**
 * Scan one file's text. Returns [{rule, line}].
 * @param {string} path repo-relative
 */
export function scan(path, text) {
  const out = [];
  const isWorkflow = path.startsWith('.github/');
  const isEnv = /(^|\/)\.env(\.[A-Za-z0-9_-]+)?$/.test(path) && !/\.example$/.test(path);
  const isCompose = /(^|\/)(docker-)?compose[^/]*\.ya?ml$/.test(path);
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const r of RULES) if (r.re.test(line)) out.push({ rule: r.id, line: i + 1 });
    if (isWorkflow) {
      const w = workflowRealPassword(line);
      if (w) out.push({ rule: w, line: i + 1 });
    }
    if (isEnv || isCompose) {
      const e = envLiteral(line);
      if (e) out.push({ rule: e, line: i + 1 });
    }
  }
  return out;
}

/** Files worth scanning: tracked, text, not a lockfile or a binary. */
export function scannable(path) {
  if (/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(path)) return false;
  if (/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp3|mp4|wav|m4a|pdf|zip|gz|tgz|heic|bin|wasm|apk|svg)$/i.test(path)) return false;
  return true;
}

export function judge(findings, allowlist, today) {
  const failures = [];
  for (const a of allowlist) {
    if (!a.path || !a.rule || !a.why || !a.reReview) failures.push(`allowlist entry ${JSON.stringify(a)} needs path, rule, why and reReview`);
    else if (a.reReview <= today) failures.push(`allowlist entry ${a.path} (${a.rule}) passed its re-review date ${a.reReview}`);
  }
  for (const f of findings) {
    const ok = allowlist.some((a) => a.path === f.path && a.rule === f.rule);
    if (!ok) failures.push(`${f.path}:${f.line} ${f.rule}`);
  }
  return failures;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const started = Date.now();
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean)
    .filter(scannable);
  const findings = [];
  let scanned = 0;
  for (const path of files) {
    const abs = join(ROOT, path);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isFile() || st.size > 4 * 1024 * 1024) continue;
    const buf = readFileSync(abs);
    if (buf.includes(0)) continue; // binary
    scanned += 1;
    for (const f of scan(path, buf.toString('utf8'))) findings.push({ path, ...f });
  }
  const allowlist = JSON.parse(readFileSync(join(ROOT, 'scripts/secret-scan-allowlist.json'), 'utf8')).entries;
  const failures = judge(findings, allowlist, new Date().toISOString().slice(0, 10));
  if (failures.length) {
    console.error(`secret-scan-guard: ${failures.length} finding(s) in ${scanned} files:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `secret-scan-guard: OK — ${scanned} tracked text files, ${RULES.length + 2} rules, ${findings.length} allowlisted fixture(s), ${Date.now() - started} ms.`
  );
}
