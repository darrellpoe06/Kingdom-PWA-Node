#!/usr/bin/env python3
# =============================================================================
# voice-clarity-witness -- does the reading voice say the words it was handed?
# =============================================================================
# Darrell, 2026-10-20: "Our app is still mumbling in sections of the tts....
# fix it so it can be fully functional without defective speaking parts of
# the lessons". Every earlier fix for the mumble (DR-0653, DR-0794, DR-0851)
# was proven on the TEXT the voice is handed. Nothing listened. This does:
#
#   for each pace, for each piece of the corpus
#     (infra/nas-voice-lite/fixtures/clarity-corpus.json, cut by the reader's
#     own pipeline and pinned by a test):
#       1. POST the spoken text to /voice-lite/speak exactly as the app does
#          (the same bearer, voice, pace), keep the WAV;
#       2. transcribe the WAV with speech recognition (faster-whisper on the
#          runner's CPU; no GPU, no NAS whisper);
#       3. score the transcript against the text as WORD ERROR RATE: the
#          share of words a listener who writes down what they hear gets
#          wrong. 0.0 = every word came back; 0.5 = half did not.
#
# The result is a table per piece and per pace, the worst clips kept so a
# person can listen to exactly what the number says, and a verdict: at the
# reading's default pace, no piece may exceed --fail-wer. The witness FAILS
# on a mumble it can measure, and it says which piece and what was heard.
#
# Honest limits, stated: a transcriber mishears proper names ("Yahweh",
# "asketh") whether or not the voice slurred them, so a few words of error on
# every piece is the floor, not a fault; the number that matters is a piece
# far above its neighbours, and the same piece across paces. Numbers are
# compared as words on both sides ("19" and "nineteen" are the same word).
#
# Runs on a GitHub runner (voice-clarity-witness.yml). Stdlib apart from
# faster_whisper, which is imported only when transcribing, so --selftest is
# offline and runs in CI with no model.
#
#   python3 scripts/voice-clarity-witness.py --corpus F --out DIR [--paces 1,1.5,2]
#       [--base https://poetech.us] [--voice male] [--model small.en] [--fail-wer 0.5]
#   python3 scripts/voice-clarity-witness.py --selftest
# The bearer is read from the environment (TOK) and never printed.
# =============================================================================
import argparse
import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
import wave

ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
        'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']


def number_words(n):
    """0..9999 as the words a transcriber writes. Pure."""
    n = int(n)
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + number_words(n % 100))
    if n < 10000:
        # one spelling for both sides: the text and the transcript pass through
        # the same function, so "2026" matches "2026" however the voice said it
        return ONES[n // 1000] + ' thousand' + ('' if n % 1000 == 0 else ' ' + number_words(n % 1000))
    return str(n)


def normalize(text):
    """Lower-case words only; digits as words; a hyphen is a space. Pure."""
    s = str(text or '').lower()
    s = re.sub(r'(\d),(\d{3})\b', r'\1\2', s)              # 2,450 -> 2450
    s = re.sub(r'\d+', lambda m: number_words(m.group(0)) if len(m.group(0)) <= 4 else m.group(0), s)
    s = s.replace('-', ' ').replace('’', "'")
    s = re.sub(r"[^a-z' ]+", ' ', s)
    s = re.sub(r"(?<![a-z])'|'(?![a-z])", ' ', s)          # a quote mark is not a word
    return ' '.join(s.split())


def wer(reference, hypothesis):
    """Word error rate: (substitutions + deletions + insertions) / reference words. Pure."""
    r = normalize(reference).split()
    h = normalize(hypothesis).split()
    if not r:
        return 0.0 if not h else 1.0
    prev = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        cur = [i] + [0] * len(h)
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
        prev = cur
    return round(prev[len(h)] / len(r), 4)


def speak(base, tok, text, voice, pace, out_path, attempts=5):
    """The app's own call. Returns the HTTP status; 200 wrote the WAV."""
    body = {'text': text, 'voice': voice, 'format': 'wav'}
    if abs(float(pace) - 1.0) > 1e-9:
        body['speed'] = float(pace)
    data = json.dumps(body).encode('utf-8')
    for attempt in range(attempts):
        req = urllib.request.Request(base.rstrip('/') + '/voice-lite/speak', data=data, method='POST',
                                     headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok})
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                ctype = res.headers.get('Content-Type', '')
                blob = res.read()
                if not ctype.startswith('audio/') or blob[:4] != b'RIFF':
                    return 'not-audio'
                with open(out_path, 'wb') as fh:
                    fh.write(blob)
                return 200
        except urllib.error.HTTPError as e:
            if e.code == 503 and attempt + 1 < attempts:
                time.sleep(2 * (attempt + 1))
                continue
            return e.code
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if attempt + 1 < attempts:
                time.sleep(2 * (attempt + 1))
                continue
            return 'unreachable: %s' % str(e)[:80]
    return 503


def wav_seconds(path):
    with wave.open(path) as w:
        return round(w.getnframes() / float(w.getframerate()), 2)


def transcribe_all(paths, model_name):
    """path -> transcript. The model is loaded once; faster_whisper is imported here only."""
    from faster_whisper import WhisperModel  # noqa: WPS433 (deliberately late)
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    out = {}
    for p in paths:
        segments, _info = model.transcribe(p, language='en', beam_size=5, vad_filter=False, condition_on_previous_text=False)
        out[p] = ' '.join(s.text.strip() for s in segments).strip()
    return out


def render(results, paces, fail_wer):
    """The step summary: a table a person reads, worst first per pace."""
    lines = ['## Voice clarity witness', '', 'Word error rate per piece: 0 = every word came back; the number is the share of words a listener writing down what they heard got wrong.', '']
    for pace in paces:
        rows = [r for r in results if r['pace'] == pace and r['wer'] is not None]
        if not rows:
            lines.append(f'### pace {pace}: no clips'); lines.append(''); continue
        wers = [r['wer'] for r in rows]
        by_group = {}
        for r in rows:
            by_group.setdefault(r['group'], []).append(r['wer'])
        lines.append(f'### pace {pace}: median {statistics.median(wers):.2f}, worst {max(wers):.2f}, {sum(1 for w in wers if w > fail_wer)} of {len(rows)} over {fail_wer}')
        lines.append('')
        lines.append('| group | pieces | median WER | worst |')
        lines.append('|---|---|---|---|')
        for g, ws in by_group.items():
            lines.append(f'| {g} | {len(ws)} | {statistics.median(ws):.2f} | {max(ws):.2f} |')
        lines.append('')
        lines.append('| piece | words | WER | seconds | heard |')
        lines.append('|---|---|---|---|---|')
        for r in sorted(rows, key=lambda x: -x['wer'])[:25]:
            heard = r['transcript'].replace('|', '/')
            lines.append(f"| {r['id']} | {r['longestSentenceWords']} | {r['wer']:.2f} | {r['seconds']} | {heard[:160]} |")
        lines.append('')
    return '\n'.join(lines)


def run(args):
    tok = os.environ.get('TOK', '').strip()
    if not tok:
        print('no bearer in TOK', file=sys.stderr)
        return 2
    corpus = json.load(open(args.corpus, encoding='utf-8'))
    paces = [float(p) for p in args.paces.split(',') if p.strip()]
    os.makedirs(args.out, exist_ok=True)
    results = []
    for pace in paces:
        d = os.path.join(args.out, 'clips', str(pace))
        os.makedirs(d, exist_ok=True)
        for piece in corpus['pieces']:
            out = os.path.join(d, piece['id'] + '.wav')
            code = speak(args.base, tok, piece['spoken'], args.voice, pace, out)
            results.append({'id': piece['id'], 'group': piece['group'], 'pace': pace, 'longestSentenceWords': piece['longestSentenceWords'],
                            'spoken': piece['spoken'], 'http': code, 'path': out if code == 200 else None,
                            'seconds': wav_seconds(out) if code == 200 else None, 'transcript': '', 'wer': None})
            print(f"speak pace {pace} {piece['id']}: {code}", flush=True)
    paths = [r['path'] for r in results if r['path']]
    if paths:
        heard = transcribe_all(paths, args.model)
        for r in results:
            if r['path']:
                r['transcript'] = heard.get(r['path'], '')
                r['wer'] = wer(r['spoken'], r['transcript'])
    with open(os.path.join(args.out, 'results.json'), 'w', encoding='utf-8') as fh:
        json.dump({'base': args.base, 'voice': args.voice, 'model': args.model, 'paces': paces, 'results': results}, fh, indent=2)
    summary = render(results, paces, args.fail_wer)
    with open(os.path.join(args.out, 'summary.md'), 'w', encoding='utf-8') as fh:
        fh.write(summary)
    print(summary)
    step = os.environ.get('GITHUB_STEP_SUMMARY')
    if step:
        with open(step, 'a', encoding='utf-8') as fh:
            fh.write(summary)
    failed_http = [r for r in results if r['http'] != 200]
    if len(failed_http) == len(results):
        print('::error::no clip came back from /voice-lite at all', file=sys.stderr)
        return 3
    bad = [r for r in results if r['pace'] == 1.0 and r['wer'] is not None and r['wer'] > args.fail_wer]
    if bad:
        for r in bad:
            print(f"::error::{r['id']} at pace 1: WER {r['wer']:.2f} -- handed \"{r['spoken'][:120]}\" heard \"{r['transcript'][:120]}\"", file=sys.stderr)
        return 1
    return 0


def selftest():
    checks = []

    def check(ok, what):
        checks.append((bool(ok), what))
        print(('ok   ' if ok else 'FAIL ') + what)
    check(number_words(0) == 'zero' and number_words(19) == 'nineteen' and number_words(20) == 'twenty', 'small numbers')
    check(number_words(34) == 'thirty four' and number_words(119) == 'one hundred nineteen', 'tens and hundreds')
    check(number_words(2026) == 'two thousand twenty six' and number_words(1000) == 'one thousand', 'thousands')
    check(normalize('chapter 19, verse 34.') == 'chapter nineteen verse thirty four', 'a reference normalizes to words')
    check(normalize('"Love ye" (Psalm 34:8) -- so-called') == 'love ye psalm thirty four eight so called', 'quotes, parens and dashes are not words')
    check(normalize("the Lord's words") == "the lord's words", 'an apostrophe inside a word stays')
    check(wer('a b c', 'a b c') == 0.0, 'identical is 0')
    check(wer('a b c', 'a x c') == 0.3333, 'one wrong word of three')
    check(wer('a b c d', 'a b') == 0.5, 'two words dropped of four')
    check(wer('one two', 'one two three four') == 1.0, 'insertions count')
    check(wer('Chapter 19 verse 34', 'chapter nineteen, verse thirty-four') == 0.0, 'digits and words are the same words')
    check(wer('', '') == 0.0 and wer('', 'x') == 1.0, 'empty reference')
    rows = [{'id': 'a', 'group': 'g', 'pace': 1.0, 'longestSentenceWords': 9, 'wer': 0.1, 'seconds': 3.2, 'transcript': 'x'},
            {'id': 'b', 'group': 'g', 'pace': 1.0, 'longestSentenceWords': 30, 'wer': 0.6, 'seconds': 8.1, 'transcript': 'y | z'}]
    md = render(rows, [1.0], 0.5)
    check('| b | 30 | 0.60 |' in md and '1 of 2 over 0.5' in md and 'y / z' in md, 'the summary names the worst piece first and escapes the table')
    failed = [w for ok, w in checks if not ok]
    print(f'{len(checks) - len(failed)} of {len(checks)} checks passed')
    return 0 if not failed else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--selftest', action='store_true')
    ap.add_argument('--corpus')
    ap.add_argument('--out', default='clarity')
    ap.add_argument('--base', default='https://poetech.us')
    ap.add_argument('--voice', default='male')
    ap.add_argument('--paces', default='1,1.5,2')
    ap.add_argument('--model', default='small.en')
    ap.add_argument('--fail-wer', type=float, default=0.5)
    args = ap.parse_args()
    if args.selftest:
        sys.exit(selftest())
    if not args.corpus:
        ap.error('--corpus is required')
    sys.exit(run(args))


if __name__ == '__main__':
    main()
