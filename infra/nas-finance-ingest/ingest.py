#!/usr/bin/env python3
# =============================================================================
# nas-finance-ingest — the sovereign, deterministic finance ingest (replaces n8n
# wf18 / wf14b). DR-0083: plain scheduled Python on the NAS, no n8n, headless.
# =============================================================================
# WHAT IT DOES (deterministic, stdlib-only, idempotent):
#   1. BANK (the verified source of truth) — reads the QFX-exploded per-account
#      JSON under finance-events/bank/<acct>.qfx/*.json, normalizes, dedupes by
#      FITID, sorts by date, and builds a VERIFIED LEDGER with a running balance
#      per account + consolidated, plus a per-month clean view over the full span.
#   2. GMAIL (the filtered supplement, UNVERIFIED preview) — classifies each
#      finance-events/gmail/*.json as a REAL transaction notification or NOISE
#      using a sender + pattern classifier (NOT "has a $"): newsletters /
#      marketing / credit-monitoring are REJECTED even when they contain a dollar
#      figure (the Epoch Times "$13" is the canonical reject). Deduped.
#   3. Writes the served contract (transactions / gmail_events / bank_balances /
#      counts) wf18 used to serve, PLUS verified_ledger + monthly, to the output
#      dir — a plain file the app reads (no webhook, no login).
#   4. Emits a run-state record (the loop-runs contract the in-app 🩺 Loops
#      surface reads: key/at/status/processed/detail) so the loop is observable.
#
# THREE BRAKES (DR-0083 / three-brakes rule): single-instance lock, a wall-clock
# budget, and a fail-after-N kill-switch that PAUSES (writes .paused) on repeated
# failure and refuses to run while paused. Ships INACTIVE — nothing schedules it;
# a human installs the cron/systemd timer only when armed + watching.
#
# It is READ-ONLY over the source data (bank/, gmail/); it only WRITES under the
# output dir. It never moves money and makes no network calls.
# =============================================================================

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

# ----------------------------------------------------------------------------- classifier
# Senders whose transaction notifications are REAL (kept as unverified preview).
REAL_SENDER_HINTS = (
    'alerts@chase.com', 'no.reply.alerts@chase.com', '@chase.com',
    'discover@services.discover.com', '@discover.com',
    'cash@square.com', '@squareup.com', 'service@paypal.com', '@paypal.com',
    'affirm-confirmation@affirm.com', '@affirm.com', 'noreply-us@klarna.com', '@klarna.com',
)
# Senders/domains that are NOISE — rejected even if they contain a dollar amount.
NOISE_SENDER_HINTS = (
    'theepochtimes.com', 'creditkarma.com', 'notifications.creditkarma.com',
    'offer.capitalone.com', 'email.capitalone.com', 'credit-card-offers',
    'experian.com', 'sofi.com', 'noreply@medium.com', 'news', 'newsletter',
    'marketing', 'promotions', 'offers@', 'deals@',
)
# Subject phrases that mark NOISE (newsletters, marketing, setup/statement notices
# that carry no posted amount), rejected regardless of sender.
NOISE_SUBJECT_RE = re.compile(
    r'(newsletter|set ?up confirmation|statement (is )?ready|pre-?approved|'
    r'credit score|your weekly|prediction|advances|sweepstakes|% ?apr|'
    r'offer|save \$|coupon|webinar|unsubscribe|new social security)',
    re.I,
)
# Subject phrases that mark a REAL posted transaction (paired with a real sender + amount).
REAL_SUBJECT_RE = re.compile(
    r'(payment|posted|charged|debit|credit|transaction|you sent|you received|'
    r'purchase|receipt|deposit|withdrawal|transfer|zelle|external transfer)',
    re.I,
)


def _amount_of(ev):
    """Numeric amount from the gmail event's extracted block, else None."""
    ex = ev.get('extracted') or {}
    a = ex.get('amount')
    if isinstance(a, (int, float)):
        return float(a)
    if isinstance(a, str):
        m = re.search(r'-?\d+(?:\.\d+)?', a.replace(',', ''))
        if m:
            return float(m.group(0))
    return None


def classify_gmail(ev):
    """Deterministic real-transaction classifier for a gmail finance event.

    Returns ('real'|'noise', reason). A REAL event is a genuine transaction
    notification: a financial sender + a real amount + a transaction-shaped
    subject, with no marketing/newsletter markers. Default-deny: anything not
    clearly a transaction is NOISE (so the preview never shows newsletter junk).
    """
    sender = (ev.get('from') or '').lower()
    subject = (ev.get('subject') or '')
    amount = _amount_of(ev)

    # 1. Hard noise senders/domains — reject even with a dollar amount.
    for hint in NOISE_SENDER_HINTS:
        if hint in sender:
            return 'noise', 'noise-sender:' + hint
    # 2. Newsletter/marketing subject — reject (the Epoch Times "$13" path).
    if NOISE_SUBJECT_RE.search(subject):
        return 'noise', 'noise-subject'
    # 3. No real amount -> not a transaction.
    if amount is None or amount == 0:
        return 'noise', 'no-amount'
    # 4. Must come from a known financial sender.
    if not any(h in sender for h in REAL_SENDER_HINTS):
        return 'noise', 'non-financial-sender'
    # 5. Must look like a transaction notification.
    if not REAL_SUBJECT_RE.search(subject):
        return 'noise', 'non-transaction-subject'
    return 'real', 'ok'


# ----------------------------------------------------------------------------- bank ledger
def _acct_label(dirname):
    """'chase7206_activity_20260527.qfx' -> 'chase7206' (stable per-account key)."""
    base = dirname.split('_', 1)[0]
    return base.replace('.qfx', '') or dirname


def read_bank(bank_dir):
    """All bank transactions, normalized + deduped by (account, fitid)."""
    txns = {}
    if not os.path.isdir(bank_dir):
        return []
    for acct_dir in sorted(os.listdir(bank_dir)):
        full = os.path.join(bank_dir, acct_dir)
        if not os.path.isdir(full):
            continue
        acct = _acct_label(acct_dir)
        for name in os.listdir(full):
            if not name.endswith('.json'):
                continue
            try:
                with open(os.path.join(full, name), 'r') as fh:
                    rec = json.load(fh)
            except Exception:
                continue
            t = rec.get('transaction') or {}
            fitid = t.get('fitid') or name[:-5]
            posted = t.get('posted') or ''
            try:
                amount = round(float(t.get('amount') or 0), 2)
            except (TypeError, ValueError):
                amount = 0.0
            key = acct + ':' + str(fitid)
            txns[key] = {  # dict keyed by fitid -> idempotent dedupe
                'id': key,
                'account': acct,
                'date': posted,
                'amount': amount,
                'description': (t.get('name') or t.get('memo') or '').strip()[:200],
                'memo': (t.get('memo') or '')[:300],
                'type': t.get('type') or ('CREDIT' if amount >= 0 else 'DEBIT'),
                'source': 'bank',
                'fitid': str(fitid),
                'verified': True,
            }
    out = [t for t in txns.values() if re.match(r'^\d{4}-\d{2}-\d{2}$', t['date'])]
    out.sort(key=lambda r: (r['date'], r['account'], r['fitid']))
    return out


def running_ledger(txns, openings=None):
    """Attach a running balance per account (opening + cumulative cleared).

    `openings` maps account -> opening balance; absent accounts open at 0 so the
    running balance is a correct RELATIVE cumulative (the app anchors the real
    opening). This is the derived balance — initial + every verified transaction.
    """
    openings = openings or {}
    bal = {}
    for t in txns:
        a = t['account']
        bal[a] = round(bal.get(a, float(openings.get(a, 0.0))) + t['amount'], 2)
        t['running_balance'] = bal[a]
    return txns, bal


def monthly_view(txns):
    """Per-month clean summary: count / inflow / outflow / net / end-of-month."""
    months = {}
    for t in txns:
        ym = t['date'][:7]
        m = months.setdefault(ym, {'month': ym, 'count': 0, 'inflow': 0.0,
                                    'outflow': 0.0, 'net': 0.0})
        m['count'] += 1
        if t['amount'] >= 0:
            m['inflow'] = round(m['inflow'] + t['amount'], 2)
        else:
            m['outflow'] = round(m['outflow'] + t['amount'], 2)
        m['net'] = round(m['net'] + t['amount'], 2)
    return [months[k] for k in sorted(months)]


def bank_balances(txns, bal):
    """Per-account summary in the wf18 'bank_balances' shape (ledger_balance)."""
    out = {}
    counts = {}
    for t in txns:
        counts[t['account']] = counts.get(t['account'], 0) + 1
    for acct, b in bal.items():
        out[acct] = {'ledger_balance': b, 'tx_count': counts.get(acct, 0),
                     'inst': acct}
    return out


# ----------------------------------------------------------------------------- gmail supplement
def read_gmail(gmail_dir):
    """Classify every gmail event; return (real_events, noise_count, reasons)."""
    real, noise, reasons = [], 0, {}
    if not os.path.isdir(gmail_dir):
        return real, noise, reasons
    seen = set()
    for name in sorted(os.listdir(gmail_dir)):
        if not name.endswith('.json'):
            continue
        try:
            with open(os.path.join(gmail_dir, name), 'r') as fh:
                ev = json.load(fh)
        except Exception:
            continue
        verdict, reason = classify_gmail(ev)
        reasons[reason] = reasons.get(reason, 0) + 1
        if verdict != 'real':
            noise += 1
            continue
        gid = ev.get('gmail_id') or name[:-5]
        if gid in seen:  # dedupe by gmail id
            continue
        seen.add(gid)
        real.append({
            'id': 'gm:' + str(gid),
            'date': (ev.get('internal_date') or ev.get('captured_at') or '')[:10],
            'amount': _amount_of(ev),
            'description': (ev.get('subject') or '').strip()[:200],
            'from': ev.get('from') or '',
            'source': 'gmail',
            'verified': False,  # preview tier — never drives the official balance
        })
    real.sort(key=lambda r: r['date'])
    return real, noise, reasons


# ----------------------------------------------------------------------------- brakes
class Brakes:
    """Single-instance lock + wall-clock budget + fail-after-N kill-switch."""

    def __init__(self, state_dir, max_seconds, max_fails):
        self.lock = os.path.join(state_dir, '.ingest.lock')
        self.paused = os.path.join(state_dir, '.ingest.paused')
        self.fails = os.path.join(state_dir, '.ingest.fails')
        self.max_seconds = max_seconds
        self.max_fails = max_fails
        self.t0 = time.time()
        os.makedirs(state_dir, exist_ok=True)

    def _alive(self, pid):
        try:
            os.kill(pid, 0)
            return True
        except (OSError, ValueError):
            return False

    def acquire(self):
        if os.path.exists(self.paused):
            return False, 'paused (kill-switch tripped; clear .ingest.paused to re-arm)'
        if os.path.exists(self.lock):
            try:
                pid = int(open(self.lock).read().strip() or '0')
            except Exception:
                pid = 0
            if pid and self._alive(pid):
                return False, 'another run in progress (pid %d)' % pid
        with open(self.lock, 'w') as fh:
            fh.write(str(os.getpid()))
        return True, 'acquired'

    def over_budget(self):
        return (time.time() - self.t0) > self.max_seconds

    def release(self, ok):
        try:
            if os.path.exists(self.lock):
                os.remove(self.lock)
        except OSError:
            pass
        n = 0
        try:
            n = int(open(self.fails).read().strip() or '0')
        except Exception:
            n = 0
        if ok:
            try:
                open(self.fails, 'w').write('0')
            except OSError:
                pass
        else:
            n += 1
            try:
                open(self.fails, 'w').write(str(n))
            except OSError:
                pass
            if n >= self.max_fails:
                open(self.paused, 'w').write(_now_iso() + ' fails=' + str(n))


# ----------------------------------------------------------------------------- run-state
def _now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def emit_run(out_dir, status, processed, detail):
    """Append the loop-runs contract record the in-app 🩺 Loops surface reads."""
    rec = {'key': 'nas-finance-ingest', 'at': _now_iso(), 'status': status,
           'processed': processed, 'detail': detail[:200]}
    path = os.path.join(out_dir, '_loop_runs.json')
    runs = []
    try:
        runs = json.load(open(path))
        if not isinstance(runs, list):
            runs = []
    except Exception:
        runs = []
    runs.append(rec)
    runs = runs[-50:]
    _atomic_write(path, runs)
    return rec


def _atomic_write(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w') as fh:
        json.dump(obj, fh, separators=(',', ':'))
    os.replace(tmp, path)


def _csv_cell(s):
    """Minimal RFC-4180 cell quoting for the importer's CSV."""
    s = str(s if s is not None else '')
    if any(c in s for c in (',', '"', '\n', '\r')):
        return '"' + s.replace('"', '""') + '"'
    return s


def write_account_csvs(out_dir, txns):
    """Write one importer-ready CSV per account (Date,Description,Amount) so the
    verified ledger imports straight through the proven in-app CSV importer
    (PR #439) into the durable, cloud-synced ledger that drives the balance —
    no live NAS fetch, no fragility (DR-0083). Returns the list of files."""
    by_acct = {}
    for t in txns:
        by_acct.setdefault(t['account'], []).append(t)
    written = []
    for acct, rows in sorted(by_acct.items()):
        rows = sorted(rows, key=lambda r: (r['date'], r['fitid']))
        lines = ['Date,Description,Amount']
        for r in rows:
            lines.append('%s,%s,%s' % (
                _csv_cell(r['date']), _csv_cell(r['description']), _csv_cell(r['amount'])))
        path = os.path.join(out_dir, 'ledger-%s.csv' % acct)
        tmp = path + '.tmp'
        with open(tmp, 'w') as fh:
            fh.write('\n'.join(lines) + '\n')
        os.replace(tmp, path)
        written.append(os.path.basename(path) + ' (%d)' % len(rows))
    return written


# ----------------------------------------------------------------------------- selftest
def selftest():
    cases = [
        ({'from': 'newsletter@theepochtimes.com', 'subject': 'New Social Security Prediction; Senate Advances Bill', 'extracted': {'amount': 13}}, 'noise'),
        ({'from': 'notifications@notifications.creditkarma.com', 'subject': 'Your credit score changed', 'extracted': {'amount': 720}}, 'noise'),
        ({'from': 'credit-card-offers@offer.capitalone.com', 'subject': 'You are pre-approved for $5000', 'extracted': {'amount': 5000}}, 'noise'),
        ({'from': 'no.reply.alerts@chase.com', 'subject': 'You made a transaction', 'extracted': {'amount': -80}}, 'real'),
        ({'from': 'no.reply.alerts@chase.com', 'subject': 'Your statement is ready', 'extracted': {'amount': None}}, 'noise'),
        ({'from': 'cash@square.com', 'subject': 'You received a payment', 'extracted': {'amount': 50}}, 'real'),
        ({'from': 'affirm-confirmation@affirm.com', 'subject': 'Your purchase was charged', 'extracted': {'amount': 42.5}}, 'real'),
        ({'from': 'dpoe@illinois.edu', 'subject': 'Fw: lunch', 'extracted': {'amount': 12}}, 'noise'),
    ]
    fails = 0
    for ev, expect in cases:
        got, reason = classify_gmail(ev)
        ok = got == expect
        fails += 0 if ok else 1
        print('  [%s] %-7s expected=%-5s got=%-5s (%s) :: %s' % (
            'OK' if ok else 'XX', '', expect, got, reason, (ev.get('subject') or '')[:40]))
    print('selftest: %d/%d passed' % (len(cases) - fails, len(cases)))
    return fails == 0


# ----------------------------------------------------------------------------- main
def run(root, out_dir, max_seconds, max_fails):
    state_dir = out_dir
    brakes = Brakes(state_dir, max_seconds, max_fails)
    ok, why = brakes.acquire()
    if not ok:
        print('SKIP:', why)
        return 2
    status, processed, detail = 'error', 0, ''
    try:
        bank = read_bank(os.path.join(root, 'bank'))
        bank, bal = running_ledger(bank)
        if brakes.over_budget():
            raise RuntimeError('wall-clock budget exceeded during bank parse')
        months = monthly_view(bank)
        gmail_real, gmail_noise, reasons = read_gmail(os.path.join(root, 'gmail'))
        dates = [t['date'] for t in bank]
        served = {
            'served_at': _now_iso(),
            'generator': 'nas-finance-ingest (DR-0083, deterministic, no n8n)',
            'transactions': bank,                       # verified bank ledger
            'gmail_events': gmail_real,                 # unverified preview
            'bank_balances': bank_balances(bank, bal),
            'verified_ledger': {
                'count': len(bank),
                'date_range': [dates[0], dates[-1]] if dates else [None, None],
                'consolidated_net': round(sum(t['amount'] for t in bank), 2),
                'per_account_running_balance': bal,
                'monthly': months,
            },
            'counts': {
                'total_bank': len(bank),
                'total_gmail_real': len(gmail_real),
                'total_gmail_noise': gmail_noise,
                'gmail_noise_reasons': reasons,
                'institutions': sorted(bal.keys()),
            },
        }
        _atomic_write(os.path.join(out_dir, 'imported-transactions.json'), served)
        _atomic_write(os.path.join(out_dir, 'verified-ledger.json'), served['verified_ledger'])
        csvs = write_account_csvs(out_dir, bank)  # importer-ready, per account
        processed = len(bank) + len(gmail_real)
        detail = 'bank=%d verified, gmail=%d real / %d noise, months=%d, csvs=%d' % (
            len(bank), len(gmail_real), gmail_noise, len(months), len(csvs))
        status = 'success'
        print('OK:', detail)
        print('   range:', served['verified_ledger']['date_range'],
              'net:', served['verified_ledger']['consolidated_net'])
        print('   csvs:', ', '.join(csvs))
        return 0
    except Exception as exc:  # noqa: BLE001 — record + re-raise via brakes
        detail = 'ingest failed: ' + repr(exc)[:160]
        print('ERROR:', detail)
        return 1
    finally:
        emit_run(out_dir, status, processed, detail)
        brakes.release(status == 'success')


def main(argv=None):
    ap = argparse.ArgumentParser(description='Sovereign deterministic finance ingest (DR-0083)')
    ap.add_argument('--root', default='/volume1/PoeTech/finance-events')
    ap.add_argument('--out', default=None, help='output dir (default: <root>/_verified)')
    ap.add_argument('--max-seconds', type=int, default=120, help='wall-clock budget brake')
    ap.add_argument('--max-fails', type=int, default=5, help='fail-after-N kill-switch')
    ap.add_argument('--selftest', action='store_true')
    args = ap.parse_args(argv)
    if args.selftest:
        return 0 if selftest() else 1
    out_dir = args.out or os.path.join(args.root, '_verified')
    os.makedirs(out_dir, exist_ok=True)
    return run(args.root, out_dir, args.max_seconds, args.max_fails)


if __name__ == '__main__':
    sys.exit(main())
