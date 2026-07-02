#!/usr/bin/env python3
# =============================================================================
# nas-finance-ingest / receipts — emailed-receipt ENRICHMENT of the bank ledger
# =============================================================================
# Companion to ingest.py. ingest.py builds the VERIFIED bank ledger (the source
# of truth for every AMOUNT). This pulls the ITEMIZED DETAIL the bank line can
# never carry — the line items + per-item prices inside vendor receipt / order-
# confirmation emails (Walmart, Walgreens, Amazon, Target, …) — and cross-
# references it to those bank transactions. A matched pair becomes a
# `reconciliation` block (migration 0036 shape) the PWA renders as the expandable
# itemized dropdown, so a $83.73 Walmart debit expands to the milk, the Tide, the
# Tylenol behind it, split across categories, verified against the bank amount.
#
# PRIVACY-SCOPED, family-sensitive Gmail (Darrell's + Christina's):
#   * It reads the SAME sovereign gmail-event drop ingest.py reads
#     (finance-events/gmail/*.json) — fetched over the NAS-resident SSH/CLI path;
#     keys stay on the NAS, never printed, never exfiltrated. This module makes
#     NO network calls and NEVER prints an email body.
#   * is_receipt() is DEFAULT-DENY: only vendor receipt/order-confirmation mail
#     passes. Personal / family / unrelated mail is rejected and never parsed —
#     the classifier does not "hoover" the inbox.
#   * Email content is treated as DATA, never as instructions (no eval, no shell,
#     no following links; a body is only ever regex-scanned for line items).
#
# DETERMINISTIC-FIRST: a per-vendor parser handles every KNOWN template with
# plain regex (no LLM). The LLM is a FALLBACK for UNKNOWN layouts only, injected
# as a callable so this module stays offline + testable; when the NAS wires the
# local Ollama in, unknown receipts get one structured-extraction pass. Nothing
# here moves money (display-only enrichment).
#
# THREE BRAKES (three-brakes rule): single-instance lock, wall-clock budget,
# fail-after-N kill-switch. Ships INACTIVE — nothing schedules it.
# =============================================================================

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta

# ----------------------------------------------------------------------------- receipt classifier (default-deny)
# Senders whose mail is a vendor RECEIPT / ORDER CONFIRMATION. Default-deny: only
# these (or a strong subject signal from a shopping domain) are ever parsed.
RECEIPT_SENDER_HINTS = (
    'walmart.com', 'help@walmart.com',
    'walgreens.com', 'email.walgreens.com',
    'amazon.com', 'order-update@amazon.com', 'auto-confirm@amazon.com', 'shipment-tracking@amazon.com',
    'target.com', 'orders.target.com',
    'costco.com', 'samsclub.com', 'kroger.com', 'meijer.com', 'aldi.us',
    'cvs.com', 'instacart.com', 'doordash.com', 'ubereats.com',
    'bestbuy.com', 'homedepot.com', 'lowes.com',
)
# Subject phrases that mark a receipt/order confirmation (paired with a shopping
# sender). "order", "receipt", "purchase" — never a marketing subject.
RECEIPT_SUBJECT_RE = re.compile(
    r'(your (order|receipt|purchase)|order (confirmation|#|number|is ready|placed)|'
    r'thanks for your order|receipt for|we received your order|'
    r'your .*order|shipped:|has shipped|proof of purchase)',
    re.I,
)
# Marketing/newsletter markers — reject even from a shopping sender (a Walmart
# "Rollback deals" blast is NOT a receipt).
NOT_RECEIPT_SUBJECT_RE = re.compile(
    r'(deal|rollback|% off|sale|save (now|big|\$)|coupon|weekly ad|clearance|'
    r'recommended for you|back in stock|price drop|newsletter|survey|rate your|'
    r'earn (points|rewards)|sign up|register your)',
    re.I,
)


def _body_text(ev):
    """Plain-text body from the event. Prefer body_text; else strip HTML tags
    from body_html. Never printed — only scanned. Returns ''."""
    txt = ev.get('body_text') or ev.get('text') or ''
    if txt:
        return txt
    html = ev.get('body_html') or ev.get('html') or ''
    if not html:
        return ''
    # crude tag strip (data, not rendering): drop scripts/styles then tags.
    html = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', html)
    html = re.sub(r'(?s)<[^>]+>', ' ', html)
    html = (html.replace('&nbsp;', ' ').replace('&amp;', '&')
                .replace('&lt;', '<').replace('&gt;', '>').replace('&#39;', "'"))
    return re.sub(r'[ \t]+', ' ', html)


def is_receipt(ev):
    """DEFAULT-DENY classifier. ('receipt'|'not-receipt', reason). Only vendor
    receipt/order-confirmation mail passes; everything else — including personal
    mail and vendor marketing — is rejected and never parsed."""
    sender = (ev.get('from') or '').lower()
    subject = (ev.get('subject') or '')
    if NOT_RECEIPT_SUBJECT_RE.search(subject):
        return 'not-receipt', 'marketing-subject'
    from_shop = any(h in sender for h in RECEIPT_SENDER_HINTS)
    subj_ok = bool(RECEIPT_SUBJECT_RE.search(subject))
    if from_shop and subj_ok:
        return 'receipt', 'sender+subject'
    if from_shop and re.search(r'\border\b|\breceipt\b', subject, re.I):
        return 'receipt', 'sender+order-word'
    return 'not-receipt', ('non-shopping-sender' if not from_shop else 'non-receipt-subject')


# ----------------------------------------------------------------------------- money helpers
def _cents(x):
    try:
        return int(round(float(x) * 100))
    except (TypeError, ValueError):
        return 0


def _money(s):
    """First dollar amount in a string -> float, else None."""
    m = re.search(r'-?\$?\s*([0-9][0-9,]*\.[0-9]{2})', str(s))
    return float(m.group(1).replace(',', '')) if m else None


def _vendor_of(sender):
    s = (sender or '').lower()
    if 'walmart' in s:
        return 'Walmart'
    if 'walgreens' in s:
        return 'Walgreens'
    if 'amazon' in s:
        return 'Amazon'
    if 'target' in s:
        return 'Target'
    if 'costco' in s:
        return 'Costco'
    if 'kroger' in s:
        return 'Kroger'
    if 'instacart' in s:
        return 'Instacart'
    return None


# ----------------------------------------------------------------------------- per-vendor deterministic parsers
# Each parser returns a receipt dict or None:
#   { merchant, order, date, total, tax, items:[{name, qty, price}] }
# `price` is the extended (line) total. Parsers are pattern-based and validated
# against representative fixtures (selftest); tune the patterns as real captured
# emails arrive. A parser returning None hands off to the generic parser, then
# the LLM fallback.

# A receipt line: "<item name> ... <qty?> ... $<extended price>". We anchor on the
# trailing price and take the leading text as the name. Quantity ("Qty 2",
# "2 @ $x", "x2") is optional and display-only.
# Trailing `[A-Z]?` absorbs the tax-class flag Walmart/grocery receipts print
# after the price ("... 1.62 F", "... 12.97 X"). Kept identical to the trailing
# `\s*[A-Z]?\s*$` in app/src/lib/receipt-ocr.js so the two structurers agree.
_LINE_PRICE = re.compile(r'^(?P<name>.+?)\s+(?:qty\s*(?P<qty>\d+)\s+)?\$?(?P<price>\d+\.\d{2})\s*[A-Z]?\s*$', re.I)
_QTY_INLINE = re.compile(r'(?:qty\s*(\d+)|(\d+)\s*@|x\s*(\d+)\b)', re.I)
# Kept in lock-step with the SKIP set in app/src/lib/receipt-ocr.js so the two
# structurers drop the SAME non-item rows (payment-tender lines like "VISA TEND
# 48.70", register ids like "ST# 05260", etc. are NOT items).
_SKIP_LINE = re.compile(
    r'(subtotal|sub-total|tax|total|savings|discount|order (total|summary)|'
    r'shipping|handling|tip|balance|payment|amount (charged|paid)|change|cash|'
    r'debit|credit|visa|mastercard|amex|account|member|tend|'
    r'items? in (this|your) order|thank you|track|view order|return|'
    r'st#|op#|te#|tr#|ref\b|auth)', re.I)


def _parse_lines_generic(body):
    """Pull (name, qty, price) tuples from body lines that look like item rows.
    Skips subtotal/tax/total/shipping rows. Used by every vendor parser + the
    generic fallback."""
    items = []
    for raw in body.splitlines():
        line = raw.strip()
        if not line or _SKIP_LINE.search(line):
            continue
        m = _LINE_PRICE.match(line)
        if not m:
            continue
        name = re.sub(r'\s{2,}', ' ', m.group('name')).strip(' .-')
        if len(name) < 2 or re.fullmatch(r'[\d\.\$,]+', name):
            continue
        price = float(m.group('price'))
        qty = None
        if m.group('qty'):
            qty = int(m.group('qty'))
        else:
            q = _QTY_INLINE.search(line)
            if q:
                qty = int(next(g for g in q.groups() if g))
        item = {'name': name[:80], 'price': round(price, 2)}
        if qty and qty != 1:
            item['qty'] = qty
        items.append(item)
    return items


def _totals(body):
    """Extract (total, tax) from the body's summary lines."""
    total = tax = None
    for raw in body.splitlines():
        line = raw.strip()
        low = line.lower()
        if tax is None and re.search(r'\btax\b', low) and not re.search(r'pre-?tax', low):
            tax = _money(line)
        if re.search(r'\b(order total|grand total|total)\b', low) and 'subtotal' not in low:
            t = _money(line)
            if t is not None:
                total = t  # last "total" wins (order total usually last)
    return total, tax


def _order_no(body, pattern=r'(?:order\s*#?|order number:?)\s*([A-Z0-9\-]{5,})'):
    m = re.search(pattern, body, re.I)
    return m.group(1) if m else None


def _build(merchant, body, order_pat=None):
    items = _parse_lines_generic(body)
    total, tax = _totals(body)
    if not items or total is None:
        return None
    order = _order_no(body, order_pat) if order_pat else _order_no(body)
    return {'merchant': merchant, 'order': order, 'total': round(total, 2),
            'tax': round(tax, 2) if tax is not None else 0.0, 'items': items}


def parse_walmart(body):
    return _build('Walmart', body, r'(?:order\s*#?)\s*(\d{15,})')


def parse_walgreens(body):
    return _build('Walgreens', body, r'(?:order\s*#?)\s*([A-Z]{2,4}-?\d{4,})')


def parse_amazon(body):
    return _build('Amazon', body, r'order\s*#?\s*(\d{3}-\d{7}-\d{7})')


def parse_target(body):
    return _build('Target', body)


PARSERS = {
    'Walmart': parse_walmart,
    'Walgreens': parse_walgreens,
    'Amazon': parse_amazon,
    'Target': parse_target,
}


# ----------------------------------------------------------------------------- OCR / photo path (shared structurer)
# The photo/OCR front door structures its text with the SAME line/total logic as
# the email path (this mirrors app/src/lib/receipt-ocr.js 1:1). On-device the app
# runs Tesseract in the browser; the NAS can run OCR (pytesseract / vision-LLM)
# as the heavier fallback for messy reads. The image->text ENGINE is the boundary
# (inject `ocr_engine(image_bytes)->text`); the structuring below is deterministic
# and identical wherever the text came from, so a receipt read on-device and one
# read on the NAS agree.
_TEXT_VENDORS = (
    (r'wal-?mart', 'Walmart'), (r'walgreens', 'Walgreens'), (r'\btarget\b', 'Target'),
    (r'\bcvs\b', 'CVS'), (r'costco', 'Costco'), (r"sam'?s club", "Sam's Club"),
    (r'\bkroger\b', 'Kroger'), (r'\bmeijer\b', 'Meijer'), (r'\baldi\b', 'Aldi'),
    (r'home depot', 'Home Depot'), (r"lowe'?s", "Lowe's"), (r'\bamazon\b', 'Amazon'),
    (r'\bshell\b', 'Shell'),
)


def _vendor_from_text(text):
    for pat, name in _TEXT_VENDORS:
        if re.search(pat, text, re.I):
            return name
    return None


def _date_from_text(text):
    m = re.search(r'\b(20\d{2})-(\d{2})-(\d{2})\b', text)
    if m:
        return '%s-%s-%s' % (m.group(1), m.group(2), m.group(3))
    m = re.search(r'\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|\d{2})\b', text)
    if m:
        mo, d, y = m.group(1), m.group(2), m.group(3)
        if len(y) == 2:
            y = '20' + y
        return '%s-%s-%s' % (y, mo.zfill(2), d.zfill(2))
    return None


def structure_ocr_text(text, exif_date=None):
    """OCR text -> normalized receipt + confidence (mirrors receipt-ocr.js).
    Returns { merchant, date, total, tax, items, confidence, reconciles }."""
    merchant = _vendor_from_text(text)
    items = _parse_lines_generic(text)
    total, tax = _totals(text)
    date = _date_from_text(text) or exif_date
    reasons, score, reconciles = [], 0.0, False
    if merchant:
        score += 0.25
    if total is not None:
        score += 0.25
    if items:
        score += 0.2
    if date:
        score += 0.1
    if total is not None and items:
        items_c = sum(_cents(i.get('price')) for i in items)
        if abs(items_c + _cents(tax) - _cents(total)) <= 2:
            score += 0.2
            reconciles = True
    return {
        'merchant': merchant, 'date': date, 'total': total,
        'tax': tax if tax is not None else 0.0, 'items': items,
        'confidence': round(min(1.0, score), 2), 'reconciles': reconciles,
        'source': 'photo',
    }


def parse_receipt(ev, llm=None):
    """Deterministic-first receipt parse. ('parsed', receipt, method) or
    ('unparsed', None, reason). Tries the per-vendor parser, then the generic
    parser, then the injected LLM fallback for unknown layouts (if provided)."""
    body = _body_text(ev)
    if not body:
        return 'unparsed', None, 'no-body'
    vendor = _vendor_of(ev.get('from') or '') or _vendor_of(ev.get('subject') or '')
    parser = PARSERS.get(vendor)
    if parser:
        r = parser(body)
        if r:
            return 'parsed', r, 'vendor:' + vendor
    # generic deterministic pass (unknown vendor, known-ish layout)
    g = _build(vendor or 'Receipt', body)
    if g and g['items']:
        return 'parsed', g, 'generic'
    # LLM fallback — UNKNOWN layout only, and only if a callable was injected.
    if callable(llm):
        try:
            r = llm(body, {'from': ev.get('from'), 'subject': ev.get('subject')})
        except Exception as exc:  # noqa: BLE001 — never let the model break the run
            return 'unparsed', None, 'llm-error:' + repr(exc)[:60]
        if r and r.get('items') and r.get('total') is not None:
            r.setdefault('merchant', vendor or 'Receipt')
            r.setdefault('tax', 0.0)
            return 'parsed', r, 'llm'
    return 'unparsed', None, 'no-parser-match'


# ----------------------------------------------------------------------------- cross-reference to bank
def verify_receipt(receipt, debit_amount, tol_cents=2):
    """The item-level gate (mirrors app lib/receipt-itemize.receiptVerification).
    Returns (ok, reason). items + tax +/- fees/disc == paid(total) == |debit|."""
    items_c = sum(_cents(i.get('price')) for i in receipt.get('items', []))
    tax_c = _cents(receipt.get('tax'))
    fees_c = _cents(receipt.get('fees')) + _cents(receipt.get('shipping'))
    disc_c = _cents(receipt.get('discount'))
    computed = items_c + tax_c + fees_c - disc_c
    total_c = _cents(receipt.get('total'))
    if abs(computed - total_c) > tol_cents:
        return False, 'items+tax %.2f != total %.2f' % (computed / 100.0, total_c / 100.0)
    if abs(total_c - abs(_cents(debit_amount))) > tol_cents:
        return False, 'total %.2f != bank debit %.2f' % (total_c / 100.0, abs(debit_amount))
    return True, 'ok'


def _to_reconciliation(receipt, ev, matched_ok):
    """Shape a parsed+matched receipt into the migration-0036 reconciliation dict
    the PWA renders (one order carrying items[]). matched_to records the evidence
    sources; the app re-verifies independently before painting the green badge."""
    return {
        'matched': True,
        'matched_to': ['bank', 'email'],
        'merchant': receipt.get('merchant'),
        'method': 'card',
        'total': round(receipt.get('total'), 2),
        'source_email': {
            'from': ev.get('from'),
            'subject': (ev.get('subject') or '')[:160],
            'received': (ev.get('internal_date') or ev.get('captured_at') or '')[:10],
        },
        'orders': [{
            'order': receipt.get('order'),
            'tax': round(receipt.get('tax', 0.0), 2),
            'paid': round(receipt.get('total'), 2),
            'items': receipt.get('items', []),
        }],
        'verify_ok': bool(matched_ok),
    }


def cross_reference(receipts, bank_txns, day_window=3, tol_cents=2):
    """Match each parsed receipt to a bank transaction by AMOUNT (exact cents) +
    DATE window (+/- day_window) + optional merchant hint. The BANK stays the
    source of truth for the amount; a match attaches the receipt itemization to
    that bank transaction's fitid. Returns:
      matches   : { fitid: reconciliation }   (verified pairs -> PWA dropdown)
      mismatches: [ {reason, ...} ]            (amount off / unverified -> Concerns)
      unmatched : [ receipt, ... ]             (no bank row found for this receipt)
    Greedy one-to-one: a bank row is consumed by at most one receipt."""
    used = set()
    matches, mismatches, unmatched = {}, [], []
    # index bank rows by amount-cents for O(1) candidate lookup
    by_amt = {}
    for t in bank_txns:
        by_amt.setdefault(abs(_cents(t.get('amount'))), []).append(t)
    for r in receipts:
        rc = r['receipt']
        want = abs(_cents(rc.get('total')))
        rdate = r['ev_date']
        cands = [t for t in by_amt.get(want, []) if t.get('fitid') not in used]
        # tolerance-widened candidates (vendor rounding)
        if not cands:
            for amt in (want - 1, want + 1, want - 2, want + 2):
                cands += [t for t in by_amt.get(amt, []) if t.get('fitid') not in used]
        # keep only those within the date window; prefer merchant-name agreement
        def _within(t):
            try:
                d1 = datetime.strptime((t.get('date') or '')[:10], '%Y-%m-%d')
                d2 = datetime.strptime((rdate or '')[:10], '%Y-%m-%d')
                return abs((d1 - d2).days) <= day_window
            except ValueError:
                return False
        cands = [t for t in cands if _within(t)]
        if not cands:
            unmatched.append(rc)
            continue
        merch = (rc.get('merchant') or '').lower()
        cands.sort(key=lambda t: (0 if merch and merch.split()[0] in (t.get('description') or '').lower() else 1))
        bank = cands[0]
        used.add(bank.get('fitid'))
        ok, reason = verify_receipt(rc, bank.get('amount'), tol_cents)
        recon = _to_reconciliation(rc, r['ev'], ok)
        if ok:
            matches[bank.get('fitid')] = recon
        else:
            mismatches.append({
                'fitid': bank.get('fitid'), 'merchant': rc.get('merchant'),
                'date': bank.get('date'), 'bank_amount': bank.get('amount'),
                'receipt_total': rc.get('total'), 'reason': reason,
            })
    return matches, mismatches, unmatched


# ----------------------------------------------------------------------------- brakes (single-instance / budget / kill-switch)
class Brakes:
    def __init__(self, state_dir, prefix, max_seconds, max_fails):
        self.lock = os.path.join(state_dir, '.%s.lock' % prefix)
        self.paused = os.path.join(state_dir, '.%s.paused' % prefix)
        self.fails = os.path.join(state_dir, '.%s.fails' % prefix)
        self.max_seconds, self.max_fails = max_seconds, max_fails
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
            return False, 'paused (kill-switch tripped; clear %s)' % os.path.basename(self.paused)
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


def _now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def _atomic_write(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w') as fh:
        json.dump(obj, fh, separators=(',', ':'))
    os.replace(tmp, path)


def emit_run(out_dir, status, processed, detail):
    rec = {'key': 'nas-finance-receipts', 'at': _now_iso(), 'status': status,
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
    _atomic_write(path, runs[-50:])
    return rec


# ----------------------------------------------------------------------------- read gmail receipts
def read_receipts(gmail_dir, llm=None):
    """Classify every gmail event; parse the receipts. Returns
    (receipts, stats) where receipts = [{receipt, ev, ev_date}]."""
    receipts, stats = [], {'total': 0, 'receipt': 0, 'parsed': 0, 'unparsed': 0, 'reasons': {}}
    if not os.path.isdir(gmail_dir):
        return receipts, stats
    for name in sorted(os.listdir(gmail_dir)):
        if not name.endswith('.json'):
            continue
        try:
            with open(os.path.join(gmail_dir, name)) as fh:
                ev = json.load(fh)
        except Exception:
            continue
        stats['total'] += 1
        verdict, why = is_receipt(ev)
        if verdict != 'receipt':
            stats['reasons'][why] = stats['reasons'].get(why, 0) + 1
            continue
        stats['receipt'] += 1
        pstatus, receipt, method = parse_receipt(ev, llm=llm)
        stats['reasons'][method] = stats['reasons'].get(method, 0) + 1
        if pstatus != 'parsed':
            stats['unparsed'] += 1
            continue
        stats['parsed'] += 1
        receipts.append({
            'receipt': receipt, 'ev': ev,
            'ev_date': (ev.get('internal_date') or ev.get('captured_at') or '')[:10],
        })
    return receipts, stats


# ----------------------------------------------------------------------------- main run
def run(root, out_dir, max_seconds, max_fails, llm=None):
    brakes = Brakes(out_dir, 'receipts', max_seconds, max_fails)
    ok, why = brakes.acquire()
    if not ok:
        print('SKIP:', why)
        return 2
    status, processed, detail = 'error', 0, ''
    try:
        # bank ledger = ingest.py's verified output (source of truth for amounts)
        bank = []
        vpath = os.path.join(out_dir, 'imported-transactions.json')
        try:
            bank = (json.load(open(vpath)) or {}).get('transactions', [])
        except Exception:
            bank = []
        receipts, stats = read_receipts(os.path.join(root, 'gmail'), llm=llm)
        if brakes.over_budget():
            raise RuntimeError('wall-clock budget exceeded during receipt parse')
        matches, mismatches, unmatched = cross_reference(receipts, bank)
        served = {
            'served_at': _now_iso(),
            'generator': 'nas-finance-receipts (deterministic-first, LLM fallback, no n8n)',
            'reconciliations': matches,          # { fitid: reconciliation } -> PWA
            'mismatches': mismatches,            # amount-off / unverified -> Concerns
            'unmatched_receipts': len(unmatched),
            'counts': {
                'gmail_total': stats['total'], 'receipts_detected': stats['receipt'],
                'receipts_parsed': stats['parsed'], 'receipts_unparsed': stats['unparsed'],
                'bank_txns': len(bank), 'matched': len(matches),
                'mismatched': len(mismatches), 'unmatched': len(unmatched),
                'parse_methods': stats['reasons'],
            },
        }
        _atomic_write(os.path.join(out_dir, 'receipt-reconciliations.json'), served)
        processed = len(matches) + len(mismatches)
        detail = ('receipts parsed=%d, matched=%d, mismatch=%d, unmatched=%d (of %d gmail, %d bank)'
                  % (stats['parsed'], len(matches), len(mismatches), len(unmatched), stats['total'], len(bank)))
        status = 'success'
        print('OK:', detail)
        return 0
    except Exception as exc:  # noqa: BLE001
        detail = 'receipts failed: ' + repr(exc)[:160]
        print('ERROR:', detail)
        return 1
    finally:
        emit_run(out_dir, status, processed, detail)
        brakes.release(status == 'success')


# ----------------------------------------------------------------------------- selftest (proven-to-catch)
_WALMART_EMAIL = {
    'from': 'help@walmart.com', 'subject': 'Your Walmart order #2000123456789',
    'internal_date': '2026-05-17T18:04:00Z',
    'body_text': (
        'Thanks for your order\n'
        'Order # 2000123456789\n'
        'Great Value Whole Milk 1 gal $3.98\n'
        'Bananas each Qty 6 $1.62\n'
        'Boneless Chicken Breast $9.44\n'
        'Large White Eggs 18ct $4.87\n'
        'Honey Nut Cereal x2 $5.96\n'
        'Tide PODS Laundry Detergent 42ct $12.97\n'
        'Bounty Paper Towels 6 rolls $14.94\n'
        'Charmin Toilet Paper 12 rolls $13.97\n'
        'Tylenol Extra Strength 100ct $12.87\n'
        'Subtotal $80.62\n'
        'Tax $3.11\n'
        'Order Total $83.73\n'
        'Track your order\n'
    ),
}
_WALGREENS_EMAIL = {
    'from': 'Walgreens@email.walgreens.com', 'subject': 'Your Walgreens order is ready',
    'internal_date': '2026-05-18T15:22:00Z',
    'body_text': (
        'Your receipt\n'
        'Order # WAG-88231\n'
        'Amoxicillin 500mg Rx $10.00\n'
        'Advil Ibuprofen 200mg 100ct $9.49\n'
        'Band-Aid Flexible Fabric 30ct $4.29\n'
        'Dawn Ultra Dish Soap $3.99\n'
        'Subtotal $27.77\n'
        'Tax $0.62\n'
        'Total $28.39\n'
    ),
}
_MARKETING_EMAIL = {  # from Walmart but a marketing blast — must be rejected
    'from': 'news@walmart.com', 'subject': 'Rollback deals: save big this week!',
    'body_text': 'Rollback TV $299.00\n', 'internal_date': '2026-05-17T00:00:00Z',
}
_PERSONAL_EMAIL = {  # family mail with a dollar amount — must be rejected
    'from': 'christina@gmail.com', 'subject': 'lunch plans', 'body_text': 'owe you $20.00',
}
_BANK = [
    {'fitid': 'F1', 'account': 'cc3344', 'date': '2026-05-17', 'amount': -83.73, 'description': 'WALMART SUPERCENTER'},
    {'fitid': 'F2', 'account': 'cc3344', 'date': '2026-05-18', 'amount': -28.39, 'description': 'WALGREENS #4821'},
    {'fitid': 'F3', 'account': 'cc3344', 'date': '2026-05-20', 'amount': -55.00, 'description': 'SHELL OIL'},
]


def selftest():
    fails = 0

    def check(label, cond):
        nonlocal fails
        fails += 0 if cond else 1
        print('  [%s] %s' % ('OK' if cond else 'XX', label))

    # 1. classifier: receipts pass, marketing + personal rejected (default-deny)
    check('walmart receipt classified as receipt', is_receipt(_WALMART_EMAIL)[0] == 'receipt')
    check('walgreens receipt classified as receipt', is_receipt(_WALGREENS_EMAIL)[0] == 'receipt')
    check('walmart MARKETING rejected', is_receipt(_MARKETING_EMAIL)[0] == 'not-receipt')
    check('personal family mail rejected (privacy-scoped)', is_receipt(_PERSONAL_EMAIL)[0] == 'not-receipt')

    # 2. deterministic parse: items + total + tax
    st, wm, method = parse_receipt(_WALMART_EMAIL)
    check('walmart parsed deterministically (vendor parser)', st == 'parsed' and method == 'vendor:Walmart')
    check('walmart 9 line items', wm and len(wm['items']) == 9)
    check('walmart total 83.73 / tax 3.11', wm and wm['total'] == 83.73 and wm['tax'] == 3.11)
    check('walmart qty parsed (bananas x6)', any(i.get('qty') == 6 for i in wm['items']))
    _, wg, _ = parse_receipt(_WALGREENS_EMAIL)
    check('walgreens 4 items, total 28.39', wg and len(wg['items']) == 4 and wg['total'] == 28.39)

    # 3. cross-reference: matched pairs verify against the bank amount
    receipts = [
        {'receipt': wm, 'ev': _WALMART_EMAIL, 'ev_date': '2026-05-17'},
        {'receipt': wg, 'ev': _WALGREENS_EMAIL, 'ev_date': '2026-05-18'},
    ]
    matches, mismatches, unmatched = cross_reference(receipts, _BANK)
    check('both receipts matched to a bank fitid', len(matches) == 2)
    check('walmart matched to F1', 'F1' in matches and matches['F1']['merchant'] == 'Walmart')
    check('matched reconciliation carries 9 items', len(matches['F1']['orders'][0]['items']) == 9)
    check('no false mismatches', len(mismatches) == 0)

    # 4. proven-to-catch: a tampered price must FAIL verification (not silently pass)
    bad = json.loads(json.dumps(wm))
    bad['items'][0]['price'] += 5.00  # milk +$5, items no longer sum to total
    ok, reason = verify_receipt(bad, -83.73)
    check('tampered receipt FAILS verification', ok is False)
    m2, mm2, _ = cross_reference([{'receipt': bad, 'ev': _WALMART_EMAIL, 'ev_date': '2026-05-17'}], _BANK)
    check('tampered receipt routed to mismatches, NOT matches', len(m2) == 0 and len(mm2) == 1)

    # 5. proven-to-catch: a receipt whose amount has no bank row is unmatched
    orphan = json.loads(json.dumps(wm))
    orphan['total'] = 999.99
    orphan['tax'] = 999.99 - sum(i['price'] for i in orphan['items'])
    _, _, un = cross_reference([{'receipt': orphan, 'ev': _WALMART_EMAIL, 'ev_date': '2026-05-17'}], _BANK)
    check('receipt with no bank match is unmatched', len(un) == 1)

    # 6. OCR path shares the structurer (mirrors receipt-ocr.js). A photographed
    #    Walmart receipt structures with the SAME line/total logic + confidence.
    ocr_text = (
        'Walmart\nSave money. Live better.\nST# 05260 OP# 009043\n'
        'GREAT VALUE MILK 3.98\nBANANAS 1.62 F\nTIDE PODS 42CT 12.97 X\n'
        'BOUNTY PAPER TOWELS 14.94\nTYLENOL 100CT 12.87\n'
        'SUBTOTAL 46.38\nTAX 1 2.32\nTOTAL 48.70\nVISA TEND 48.70\n05/17/2026\n'
    )
    o = structure_ocr_text(ocr_text)
    check('OCR: vendor+total+date structured', o['merchant'] == 'Walmart' and o['total'] == 48.70 and o['date'] == '2026-05-17')
    check('OCR: 5 items parsed, reconciles to total', len(o['items']) == 5 and o['reconciles'] is True)
    check('OCR: confidence high on a clean read', o['confidence'] >= 0.7)
    bad = structure_ocr_text(ocr_text.replace('TOTAL 48.70', 'TOTAL ?8.7O'))
    check('OCR: garbled total -> low confidence (routes to review)', bad['total'] is None and bad['confidence'] < 0.7)
    check('OCR: EXIF date used when text has none',
          structure_ocr_text(ocr_text.replace('05/17/2026', ''), exif_date='2026-05-17')['date'] == '2026-05-17')

    print('selftest: %d checks, %d failed' % (23, fails))
    return fails == 0


def main(argv=None):
    ap = argparse.ArgumentParser(description='Emailed-receipt enrichment of the bank ledger (deterministic-first)')
    ap.add_argument('--root', default='/volume1/PoeTech/finance-events')
    ap.add_argument('--out', default=None, help='output dir (default: <root>/_verified — same as ingest.py)')
    ap.add_argument('--max-seconds', type=int, default=120)
    ap.add_argument('--max-fails', type=int, default=5)
    ap.add_argument('--selftest', action='store_true')
    args = ap.parse_args(argv)
    if args.selftest:
        return 0 if selftest() else 1
    out_dir = args.out or os.path.join(args.root, '_verified')
    os.makedirs(out_dir, exist_ok=True)
    return run(args.root, out_dir, args.max_seconds, args.max_fails)


if __name__ == '__main__':
    sys.exit(main())
