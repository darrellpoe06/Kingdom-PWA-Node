#!/usr/bin/env node
// =============================================================================
// endpoint-register — every door and every store, read from the code, kept
// honest by the build (DR-1337, DR-1330 D7)
// =============================================================================
// The Ways review (DR-1330) measured that the system's flow is declared and
// checked (scripts/system-flow-registry.mjs, ~245 nodes) and that no page
// anyone can read lists the endpoints with what each one requires, nor the
// data stores with whether a wall stands on them. The slide asked for both.
//
// This is not a document somebody keeps. It is READ from the code every time:
//   • Pages Functions (app/functions/**): the route from the file path, the
//     methods from the exports, the auth CLASS from what the code checks
//     (a user JWT, a machine token, an HMAC signature, a proxy that hands the
//     caller's own headers upstream, or open), and the secrets it names.
//   • NAS services (infra/*/server.py and the FastAPI riders): each route and
//     whether the file gates with a bearer check.
//   • Data stores: every table the schema and migrations create, the file that
//     first creates it, whether ROW LEVEL SECURITY is enabled on it anywhere,
//     and how many policies name it. A table with no wall is listed first on
//     the page; that is the point of the page.
//
// `--write` regenerates app/src/lib/endpoint-register.json; `--check` (the
// guards leg) fails when the committed file differs from the code, so the
// page can never go stale. The app renders the JSON under Admin → Endpoints
// & stores (components/EndpointRegister.jsx). Pure functions exported for
// vitest, proven to catch on fixtures and on a stale file.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = 'app/src/lib/endpoint-register.json';

/** A Pages Function file path → its served route. */
export function routeOf(path) {
  let r = path.replace(/^app\/functions\//, '').replace(/\.js$/, '');
  r = r.replace(/\/?\[\[[^\]]+\]\]$/, '/*').replace(/\[([^\]]+)\]/g, ':$1');
  if (r.endsWith('/index')) r = r.slice(0, -'/index'.length) || '/';
  return '/' + r.replace(/^\/+/, '');
}

export function methodsOf(source) {
  const m = new Set();
  for (const x of source.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+onRequest([A-Za-z]*)/g)) m.add(x[1] ? x[1].toUpperCase() : 'ANY');
  return [...m].sort();
}

/** The auth class, from what the code checks; the strongest named wins. */
export function authClassOf(source) {
  const classes = [];
  if (/stripe-signature|timingSafeEqual|hmac/i.test(source)) classes.push('hmac-signature');
  if (/x-push-token|PUSH_SEND_TOKEN|MACHINE_TOKEN|machineToken/.test(source)) classes.push('machine-token');
  if (/getUser\(|auth\/v1\/user|verifyJwt|jwt\.verify|Bearer\\s|\/\^Bearer/i.test(source) || (/authorization/i.test(source) && /bearer/i.test(source)))
    classes.push('user-jwt');
  if (/funnel-proxy|funnelProxy\(/.test(source)) classes.push('proxy-passthrough');
  if (!classes.length) classes.push('open');
  return classes;
}

export function secretsOf(source) {
  return [...new Set([...source.matchAll(/\benv\.([A-Z][A-Z0-9_]{3,})\b/g)].map((m) => m[1]))].sort();
}

export function functionsRegister(files) {
  return Object.entries(files)
    .filter(([p]) => !/\/_lib\//.test(p))
    .map(([path, source]) => ({ path, route: routeOf(path), methods: methodsOf(source), auth: authClassOf(source), secrets: secretsOf(source) }))
    .sort((a, b) => a.route.localeCompare(b.route));
}

/** FastAPI routes per service file. */
export function nasRegister(files) {
  const out = [];
  for (const [path, source] of Object.entries(files)) {
    const routes = [...source.matchAll(/@app\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g)].map((m) => ({ method: m[1].toUpperCase(), route: m[2] }));
    if (!routes.length) continue;
    const gated = /bearer_ok\(|_authorized\(|require_bearer\(|HTTPBearer|Authorization/.test(source);
    out.push({ path, service: basename(dirname(path)), auth: gated ? 'bearer' : 'open', routes });
  }
  return out.sort((a, b) => a.service.localeCompare(b.service));
}

/** Tables from CREATE TABLE statements, with their wall. */
/** SQL with its comments removed, so prose never reads as a statement. */
export function stripSqlComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

export function tablesRegister(sqlFiles) {
  const tables = new Map();
  const entries = Object.entries(sqlFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, s]) => [p, stripSqlComments(s)]);
  for (const [path, source] of entries) {
    for (const m of source.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) {
      const name = m[1].toLowerCase();
      if (name.startsWith('_smoke') || name.startsWith('pg_temp')) continue; // a smoke's scratch table
      if (!tables.has(name)) tables.set(name, { table: name, definedIn: path, rls: false, policies: 0 });
    }
  }
  for (const [, source] of entries) {
    for (const m of source.matchAll(/ALTER TABLE (?:IF EXISTS )?(?:public\.)?([a-z_][a-z0-9_]*)\s+ENABLE ROW LEVEL SECURITY/gi)) {
      const t = tables.get(m[1].toLowerCase());
      if (t) t.rls = true;
    }
    for (const m of source.matchAll(/CREATE POLICY\s+(?:IF NOT EXISTS\s+)?"?[A-Za-z0-9_]+"?\s+ON\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)) {
      const t = tables.get(m[1].toLowerCase());
      if (t) t.policies += 1;
    }
  }
  return [...tables.values()].sort((a, b) => (a.rls === b.rls ? a.table.localeCompare(b.table) : a.rls ? 1 : -1));
}

export function build({ functions, nas, sql }) {
  const f = functionsRegister(functions);
  const n = nasRegister(nas);
  const t = tablesRegister(sql);
  return {
    _comment:
      'GENERATED by scripts/endpoint-register.mjs from the code (DR-1337). Do not edit; run `node scripts/endpoint-register.mjs --write`. The guards leg fails when this file is stale.',
    counts: {
      functions: f.length,
      nasServices: n.length,
      nasRoutes: n.reduce((s, x) => s + x.routes.length, 0),
      tables: t.length,
      tablesWithoutRls: t.filter((x) => !x.rls).length,
    },
    functions: f,
    nas: n,
    tables: t,
  };
}

function ls(patterns) {
  return execFileSync('git', ['ls-files', '-z', '--', ...patterns], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
}
function readAll(paths) {
  return Object.fromEntries(paths.map((p) => [p, readFileSync(join(ROOT, p), 'utf8')]));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const functions = readAll(ls(['app/functions/**/*.js']).filter((p) => !/__tests__|\.test\./.test(p)));
  const nas = readAll(ls(['infra/**/*.py']).filter((p) => !/vendor|site-packages|\/tests?\//.test(p) && /server\.py$|_server\.py$|forwarder\.py$/.test(p)));
  const sql = readAll(ls(['infra/supabase/*.sql', 'infra/supabase/migrations-auto/*.sql']));
  const next = JSON.stringify(build({ functions, nas, sql }), null, 2) + '\n';
  const outPath = join(ROOT, OUT);
  if (process.argv.includes('--write')) {
    writeFileSync(outPath, next);
    const j = JSON.parse(next);
    console.log(
      `endpoint-register: wrote ${OUT} — ${j.counts.functions} functions, ${j.counts.nasServices} NAS services (${j.counts.nasRoutes} routes), ${j.counts.tables} tables (${j.counts.tablesWithoutRls} without RLS).`
    );
    process.exit(0);
  }
  const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
  if (current !== next) {
    console.error(`endpoint-register: ${OUT} is STALE against the code — run \`node scripts/endpoint-register.mjs --write\` and commit it.`);
    process.exit(1);
  }
  const j = JSON.parse(current);
  console.log(
    `endpoint-register: OK — ${OUT} matches the code (${j.counts.functions} functions, ${j.counts.nasRoutes} NAS routes, ${j.counts.tables} tables, ${j.counts.tablesWithoutRls} without RLS).`
  );
}
