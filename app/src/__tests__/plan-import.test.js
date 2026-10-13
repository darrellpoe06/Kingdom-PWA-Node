// The plan becomes rows — the dated bills import into the ledger
// (DR-0364, migration 0206).
//
// MEASURED AGAINST THE LIVE DATABASE 2026-09-11, and the measurement is why
// this exists: family_plans holds ONE row carrying 36 debt-tracker entries, 61
// dated monthly bills and 13 cash-plan rows; transactions holds 2,949 rows;
// and debts, obligations and family_documents hold ZERO. The household's real
// financial picture lived as JSON in one row while every structured table the
// accounting module reads was empty.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');
const M206 = read('../../../infra/supabase/migrations-auto/0206-the-plan-becomes-rows-the-dated-bills-import-into-the-ledger.sql');
const S206 = read('../../../infra/supabase/tests/0206-plan-import-smoke.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

describe('migration 0206 — the import writes nothing until it is told to', () => {
  it('previews by default: dry_run is TRUE unless the caller says otherwise', () => {
    expect(M206).toMatch(/dry_run_in boolean DEFAULT true/);
    // Every write is behind the flag.
    expect(M206).toMatch(/IF NOT dry_run_in THEN\s*\n\s*INSERT INTO public\.obligations/);
  });

  it('only the owner or an admin may import into the books', () => {
    expect(M206).toMatch(/coalesce\(v_role, ''\) NOT IN \('owner','admin'\)/);
    expect(M206).toMatch(/only the owner or an admin keeps the books/);
  });
});

describe('the dedupe key carries the occurrence — the $184.99 bug', () => {
  // Measured: three of the 61 dated bills share a payee AND a day with another
  // bill. A key of payee+day collapsed them, so a first run created 56 rows
  // instead of 59 and silently dropped $184.99 of real bills. Caught by running
  // the import against the real plan before shipping it.
  it('keys on ordinal + day + payee, never on day + payee alone', () => {
    expect(M206).toMatch(/v_ref := 'plan-bill:' \|\| v_ord \|\| ':' \|\| v_day \|\| ':' \|\| v_payee;/);
    expect(M206).toMatch(/WITH ORDINALITY/);
  });

  it('says in the file WHY the ordinal is there, with the measured cost', () => {
    expect(M206).toMatch(/\$184\.99/);
    expect(M206).toMatch(/56 rows instead of/);
  });

  it('is idempotent: an already-imported bill is skipped, not duplicated', () => {
    expect(M206).toMatch(/WHERE instance_id = v_instance AND external_ref = v_ref AND period_month = v_month/);
    expect(M206).toMatch(/v_skipped := v_skipped \+ 1;/);
  });
});

describe('what it refuses to bring across, and says so', () => {
  it('imports no debt, because a debt in the plan has no day it is due', () => {
    // The DR-0358 hole, named rather than papered over with an invented date.
    expect(M206).toMatch(/debtsNotImported/);
    expect(M206).toMatch(/no day it is due/);
    expect(M206).not.toMatch(/INSERT INTO public\.debts/);
  });

  it('refuses an incomplete bill instead of guessing a payee, day or amount', () => {
    expect(M206).toMatch(/IF v_payee = '' OR v_day IS NULL OR v_day < 1 OR v_day > 31 OR v_cents <= 0 THEN/);
    expect(M206).toMatch(/v_refused := v_refused \+ 1;/);
    expect(M206).toMatch(/refusedIncomplete/);
  });

  it('a day past the end of a short month lands on the last day, never next month', () => {
    expect(M206).toMatch(/least\(/);
    expect(M206).toMatch(/interval '1 month - 1 day'/);
  });

  it('money is integer cents, rounded once from the plan’s number', () => {
    expect(M206).toMatch(/round\(coalesce\(\(v_bill->>'amount'\)::numeric, 0\) \* 100\)/);
  });
});

describe('the smoke proves it on the leg', () => {
  it('covers preview, apply, re-apply and the role wall', () => {
    for (const must of [
      'a dry run wrote rows',
      'a member imported into the books',
      'a second import duplicated the bills',
      'the ordinal kept both bills that share a payee and a day',
    ]) {
      expect(S206, must).toContain(must);
    }
  });

  it('rides the product-forms isolation leg', () => {
    expect(LEG).toMatch(/migrations: "[^"\n]*0206-the-plan-becomes-rows-the-dated-bills-import-into-the-ledger\.sql/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0206-plan-import-smoke\.sql/);
  });
});
