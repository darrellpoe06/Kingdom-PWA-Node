// =============================================================================
// door-economics — a mortgage in its parts, and what a door earns or costs
// (DR-0359, migration 0203)
// =============================================================================
// Darrell 2026-09-11: "Mortgage payments for should be line items calculated to
// the total... taxes... insurance... etc... then the tenants payments each
// month need to show the difference in the two for gap/profit analytics etc..."
//
// Two rules carry the whole file:
//
//   1. THE PARTS ADD UP TO THE TOTAL. Not approximately — exactly, in integer
//      cents, checked here before the write and refused by the database after
//      it. A payment whose parts do not sum to it is not a smaller problem than
//      a wrong total; it is the same problem wearing a breakdown.
//
//   2. NOT ENTERED IS NOT ZERO. A door nobody has filled in reports that it is
//      empty. It never reports a $0 cost, a $0 rent, or a 0% margin, because
//      every one of those would read as a fact about the property instead of a
//      fact about our records (DR-0076). Today 11 of the 12 doors are exactly
//      this case, so it is the common path, not the edge.
//
// Money is integer cents everywhere. A ledger that rounds is a ledger that
// argues.
// =============================================================================

// The parts a real mortgage statement names. Each carries the phrase a lender
// uses, the same thing in the household's words, and the one sentence a child
// gets — the DR-0358 teaching pattern, continued, so the children learn the
// process from the family's own bills (Darrell: "We want our children to learn
// the process and a system helps them to learn how we work").
export const LINE_KINDS = [
  {
    key: 'principal-interest',
    business: 'Principal & interest',
    plain: 'Paying the loan down, plus the charge for borrowing',
    childExplains: 'Part of this pays back what we borrowed. Part is the cost of borrowing it.',
  },
  {
    key: 'taxes',
    business: 'Property taxes',
    plain: 'The county’s tax on the property',
    childExplains: 'Every house owes the county money each year. This is our share of it, saved up monthly.',
  },
  {
    key: 'insurance',
    business: 'Hazard insurance',
    plain: 'Insurance in case the house is damaged',
    childExplains: 'If something bad happened to the house, this is what helps fix it.',
  },
  {
    key: 'hoa',
    business: 'HOA dues',
    plain: 'What the neighborhood association charges',
    childExplains: 'Some neighborhoods share the cost of taking care of shared things.',
  },
  {
    key: 'pmi',
    business: 'Mortgage insurance (PMI)',
    plain: 'An extra charge until enough of the loan is paid off',
    childExplains: 'When you borrow most of a house’s price, the lender charges extra until you own more of it.',
  },
  {
    key: 'escrow',
    business: 'Escrow adjustment',
    plain: 'A correction to the amount held for taxes and insurance',
    childExplains: 'Sometimes we saved too much or too little. This fixes it.',
  },
  {
    key: 'other',
    business: 'Other',
    plain: 'Anything the statement names that is none of the above',
    childExplains: 'Something else on the bill. It has to say what it is.',
  },
];

export const LINE_KIND_KEYS = LINE_KINDS.map((k) => k.key);
export const KIND_BY_KEY = Object.fromEntries(LINE_KINDS.map((k) => [k.key, k]));

/** Money in, cents out. Accepts "1,234.56", "$1234.56", 1234.56, 123456n-style. */
export function toCents(value) {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return Math.round(value * 100);
  const cleaned = String(value).replace(/[$,\s]/g, '');
  if (!/^-?\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '-') return NaN;
  return Math.round(parseFloat(cleaned) * 100);
}

/** Cents in, the way a person writes money out. */
export function money(cents) {
  if (cents == null || !Number.isFinite(cents)) return '—';
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const s = `$${(abs / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return negative ? `-${s}` : s;
}

/** The first of the month a date falls in — the only shape a period is stored as. */
export function monthOf(date) {
  const d = date instanceof Date ? date : new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/** What the parts come to. Integer cents, never a float sum. */
export function linesSum(lines) {
  return (lines || []).reduce((total, line) => {
    const cents = Number(line.amountCents);
    return total + (Number.isFinite(cents) ? Math.round(cents) : 0);
  }, 0);
}

/**
 * Refuse a set of line items before it reaches the database. The database
 * refuses it too (0203's deferred constraint trigger) — this is the same rule
 * said early so a person gets a sentence instead of a Postgres error.
 */
export function validateLines(lines, totalCents) {
  const errors = [];
  const list = lines || [];
  if (!list.length) return errors;             // no lines is a legitimate bill

  list.forEach((line, i) => {
    const where = `Line ${i + 1}`;
    if (!LINE_KIND_KEYS.includes(line.kind)) {
      errors.push(`${where}: say what kind of charge this is.`);
    }
    if (line.kind === 'other' && !String(line.label || '').trim()) {
      errors.push(`${where}: an "other" line has to say what it is.`);
    }
    const cents = Number(line.amountCents);
    if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
      errors.push(`${where}: the amount is not a number.`);
    } else if (cents === 0) {
      errors.push(`${where}: a line for nothing is not a line. Remove it.`);
    }
  });

  const total = Math.round(Number(totalCents));
  if (Number.isFinite(total)) {
    const sum = linesSum(list);
    if (sum !== total) {
      const over = sum > total;
      errors.push(
        `The line items come to ${money(sum)} but the payment is ${money(total)} — ` +
        `${money(Math.abs(sum - total))} ${over ? 'too much' : 'is missing'}. They have to add up.`
      );
    }
  }
  return errors;
}

/**
 * One door, one month. Takes the rows and returns what they say — including,
 * loudly, when they say nothing.
 *
 * cost      — what the door owes this month (the payables against it)
 * billed    — what the tenant was asked for (the receivable)
 * collected — what actually arrived (settlements; never the expectation)
 * gap       — collected minus cost. The number that says whether the month
 *             funded itself out of real money.
 * shortfall — billed minus collected. What the tenant still owes.
 */
export function doorMonth({ rentalId = null, month = '', payables = [], receivables = [], settlements = [], lines = [] } = {}) {
  const costCents = payables.reduce((t, o) => t + (Math.round(Number(o.amountCents)) || 0), 0);
  const billedCents = receivables.reduce((t, o) => t + (Math.round(Number(o.amountCents)) || 0), 0);
  const collectedCents = settlements.reduce((t, s) => t + (Math.round(Number(s.amountCents)) || 0), 0);

  const entered = payables.length > 0 || receivables.length > 0 || settlements.length > 0;

  const costByKind = {};
  for (const line of lines || []) {
    const cents = Math.round(Number(line.amountCents)) || 0;
    costByKind[line.kind] = (costByKind[line.kind] || 0) + cents;
  }

  return {
    rentalId,
    month,
    entered,
    costCents: entered ? costCents : null,
    billedCents: entered ? billedCents : null,
    collectedCents: entered ? collectedCents : null,
    gapCents: entered ? collectedCents - costCents : null,
    shortfallCents: entered ? billedCents - collectedCents : null,
    costByKind,
  };
}

/**
 * What a month's gap MEANS, said the way a person would say it. Never a bare
 * signed number on a surface — "-$412.00" tells you nothing about whether that
 * is a crisis or a Tuesday.
 */
export function gapReading(doorMonthResult) {
  const d = doorMonthResult || {};
  if (!d.entered) {
    return {
      state: 'not-entered',
      business: 'No data',
      plain: 'Nothing has been entered for this door this month.',
      childExplains: 'We have not written down what this house cost or collected yet.',
    };
  }
  const gap = d.gapCents;
  if (gap > 0) {
    return {
      state: 'profit',
      business: 'Positive cash flow',
      plain: `The rent covered the costs and ${money(gap)} was left over.`,
      childExplains: 'More money came in than went out. That extra is what makes a rental worth owning.',
    };
  }
  if (gap === 0) {
    return {
      state: 'break-even',
      business: 'Break-even',
      plain: 'The rent covered the costs exactly, with nothing left over.',
      childExplains: 'Exactly enough came in to pay what was owed. Nothing extra.',
    };
  }
  return {
    state: 'shortfall',
    business: 'Negative cash flow',
    plain: `The costs were ${money(Math.abs(gap))} more than what came in.`,
    childExplains: 'This house cost more than it collected, so the difference came from somewhere else.',
  };
}

/**
 * Every door for a month, and the portfolio underneath it. Doors with nothing
 * entered are COUNTED and NAMED rather than quietly averaged into the totals —
 * a portfolio number computed over 1 of 12 doors that does not say so is a lie
 * by omission.
 */
export function portfolioMonth(doorResults = []) {
  const entered = doorResults.filter((d) => d.entered);
  const missing = doorResults.filter((d) => !d.entered);
  const sum = (key) => entered.reduce((t, d) => t + (Number(d[key]) || 0), 0);

  return {
    doors: doorResults.length,
    doorsEntered: entered.length,
    doorsNotEntered: missing.length,
    notEnteredIds: missing.map((d) => d.rentalId),
    costCents: sum('costCents'),
    billedCents: sum('billedCents'),
    collectedCents: sum('collectedCents'),
    gapCents: sum('collectedCents') - sum('costCents'),
    shortfallCents: sum('billedCents') - sum('collectedCents'),
    // The honesty flag a surface must render beside any total above.
    complete: missing.length === 0,
    basis: missing.length === 0
      ? `All ${doorResults.length} doors entered.`
      : `${entered.length} of ${doorResults.length} doors entered — these totals cover only those.`,
  };
}

// The words, so a surface and a lesson use the same ones.
export const DOOR_TERMS = [
  {
    business: 'Cash flow',
    household: 'What was left after the house paid for itself',
    childExplains: 'Money in, minus money out. If it is positive you kept some.',
    where: 'door_month.gapCents',
  },
  {
    business: 'PITI',
    household: 'The whole house payment: loan, taxes, insurance',
    childExplains: 'The house payment is really several bills stuck together.',
    where: 'obligation_lines',
  },
  {
    business: 'Escrow',
    household: 'Money held back monthly for the taxes and insurance bills',
    childExplains: 'Saving a little each month so the big yearly bill is not a surprise.',
    where: 'obligation_lines.kind = escrow',
  },
  {
    business: 'Accounts receivable',
    household: 'Rent the tenant owes us but has not paid yet',
    childExplains: 'Someone promised to pay us and has not yet.',
    where: 'obligations.direction = receivable',
  },
  {
    business: 'Delinquency',
    household: 'Rent that is late',
    childExplains: 'The money was due and it did not come.',
    where: 'door_month.shortfallCents',
  },
];
