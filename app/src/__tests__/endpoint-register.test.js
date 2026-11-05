// =============================================================================
// endpoint-register — the door and store register is read from the code and
// kept honest by the build (DR-1337, DR-1330 D7). The parsers are pinned on
// fixtures; the committed JSON must equal what the code generates today
// (proven to catch: a stale copy differs); the real register's counts are
// sane and the live file carries the walls it claims.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  routeOf,
  methodsOf,
  authClassOf,
  secretsOf,
  functionsRegister,
  nasRegister,
  tablesRegister,
  stripSqlComments,
  build,
  OUT,
} from '../../../scripts/endpoint-register.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LIVE = JSON.parse(readFileSync(join(ROOT, OUT), 'utf8'));

describe('endpoint-register: the parsers', () => {
  it('derives the served route from the file path', () => {
    expect(routeOf('app/functions/api/push-send.js')).toBe('/api/push-send');
    expect(routeOf('app/functions/sb/[[path]].js')).toBe('/sb/*');
    expect(routeOf('app/functions/store/apk/[brand].js')).toBe('/store/apk/:brand');
    expect(routeOf('app/functions/poetech-app/assets/[[path]].js')).toBe('/poetech-app/assets/*');
  });
  it('reads the methods from the exports', () => {
    expect(methodsOf('export async function onRequestPost(c) {}\nexport async function onRequestGet(c) {}')).toEqual(['GET', 'POST']);
    expect(methodsOf('export const onRequest = async (c) => {}')).toEqual(['ANY']);
  });
  it('classifies the auth from what the code checks, strongest first', () => {
    expect(authClassOf("const sig = request.headers.get('stripe-signature'); timingSafeEqual(a,b)")).toContain('hmac-signature');
    expect(authClassOf("const machineToken = request.headers.get('x-push-token'); env.PUSH_SEND_TOKEN")).toContain('machine-token');
    expect(authClassOf("const authz = request.headers.get('authorization'); /^Bearer\\s+(.+)$/i.exec(authz); getUser(jwt)")).toContain('user-jwt');
    expect(authClassOf("import { funnelProxy } from '../_lib/funnel-proxy.js'")).toEqual(['proxy-passthrough']);
    expect(authClassOf('export const onRequest = () => new Response("ok")')).toEqual(['open']);
  });
  it('lists the secrets a function names', () => {
    expect(secretsOf('env.STRIPE_SECRET_KEY, env.PUSH_SEND_TOKEN, env.x, env.AB')).toEqual(['PUSH_SEND_TOKEN', 'STRIPE_SECRET_KEY']);
  });
  it('skips the shared _lib and sorts by route', () => {
    const r = functionsRegister({
      'app/functions/_lib/x.js': 'export const onRequest = 1',
      'app/functions/b.js': 'export const onRequest = 1',
      'app/functions/a.js': 'export const onRequest = 1',
    });
    expect(r.map((x) => x.route)).toEqual(['/a', '/b']);
  });
  it('reads FastAPI routes and whether the file gates with a bearer', () => {
    const r = nasRegister({
      'infra/svc/server.py': '@app.get("/health")\n@app.post("/run")\nif not bearer_ok(h, t):',
      'infra/open/server.py': '@app.get("/x")',
      'infra/none/server.py': 'print(1)',
    });
    expect(r).toEqual([
      { path: 'infra/open/server.py', service: 'open', auth: 'open', routes: [{ method: 'GET', route: '/x' }] },
      {
        path: 'infra/svc/server.py',
        service: 'svc',
        auth: 'bearer',
        routes: [
          { method: 'GET', route: '/health' },
          { method: 'POST', route: '/run' },
        ],
      },
    ]);
  });
  it("reads tables with their wall, ignores prose in comments and a smoke's scratch table, and lists the unwalled first", () => {
    const sql = {
      'infra/supabase/a.sql':
        'CREATE TABLE IF NOT EXISTS public.rentals (id uuid);\n-- CREATE TABLE if the reader wonders: no\nALTER TABLE rentals ENABLE ROW LEVEL SECURITY;\nCREATE POLICY rentals_read ON rentals FOR SELECT USING (true);',
      'infra/supabase/b.sql': 'CREATE TABLE role_capabilities (role text);\nCREATE TABLE _smoke_0245_unpublished (x int);',
    };
    expect(stripSqlComments('a -- b\nc /* d */ e')).toBe('a \nc  e');
    expect(tablesRegister(sql)).toEqual([
      { table: 'role_capabilities', definedIn: 'infra/supabase/b.sql', rls: false, policies: 0 },
      { table: 'rentals', definedIn: 'infra/supabase/a.sql', rls: true, policies: 1 },
    ]);
  });
});

describe('endpoint-register: the live file', () => {
  it('equals what the code generates today (a stale copy is a red build)', () => {
    const fresh = build({
      functions: Object.fromEntries(LIVE.functions.map((f) => [f.path, readFileSync(join(ROOT, f.path), 'utf8')])),
      nas: Object.fromEntries(LIVE.nas.map((n) => [n.path, readFileSync(join(ROOT, n.path), 'utf8')])),
      sql: {},
    });
    expect(fresh.functions).toEqual(LIVE.functions);
    expect(fresh.nas).toEqual(LIVE.nas);
    const stale = JSON.parse(JSON.stringify(LIVE));
    stale.functions[0].auth = ['open'];
    expect(stale.functions).not.toEqual(fresh.functions);
  });
  it('carries sane counts and names no prose as a table', () => {
    expect(LIVE.counts.functions).toBeGreaterThan(20);
    expect(LIVE.counts.tables).toBeGreaterThan(300);
    for (const t of LIVE.tables) expect(['if', 'is', 'no', 'the', 'a']).not.toContain(t.table);
    expect(LIVE.tables.filter((t) => !t.rls).length).toBe(LIVE.counts.tablesWithoutRls);
  });
});
