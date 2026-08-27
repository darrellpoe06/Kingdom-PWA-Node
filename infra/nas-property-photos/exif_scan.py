#!/usr/bin/env python3
# =============================================================================
# nas-property-photos — read the photos' own metadata on the NAS, so the app can
# file them (DR-0083 sovereign Python; no n8n webhook, no new /n8n route)
# =============================================================================
# THE FAKE BOUNDARY THIS REMOVES. exif.js was written to judge photo metadata
# "the NAS hands over" — and the NAS side did not exist. Under the DR-0108
# challenge (COMPREHENSIVE-REVIEW-STANDARD dimension 5) that is not a human
# step at all: the remote-hands channel (nas-bootstrap.yml) joins the tailnet
# and runs any idempotent command on the NAS as dpoe, so a NAS-side scanner is
# CHANNEL-DRIVABLE and therefore buildable now. Carrying it as "the NAS does
# it" was the miss.
#
# THE SPLIT, AND WHY IT IS HERE. This script READS metadata and nothing else.
# It does not decide which door a photo belongs to — proposeFiling() in
# exif.js does that, where the judgement is testable without a filesystem and
# reviewable without a binary. This half is deliberately dumb so the half that
# can be wrong about a family's records is the half under test.
#
# STDLIB ONLY. It parses the JPEG APP1/TIFF structure directly rather than
# importing Pillow, matching nas-finance-ingest: a NAS service that needs a
# pip install is a service that stops working after a DSM upgrade.
#
# READ-ONLY over the photo library. It opens files, seeks a few kilobytes, and
# writes only its own output and state files. It never moves, renames, deletes
# or uploads a photograph, and it makes no network calls.
#
# THREE BRAKES (the Autonomous Automation rule): a single-instance lock, a
# wall-clock budget, and a fail-after-N kill-switch that writes .paused and
# refuses to run while paused. Ships INACTIVE — nothing schedules it.
#
# PRIVACY. A photograph of somebody's home carries where they live. The output
# holds coordinates and timestamps, never image data, and is written under the
# same NAS-only tree the rest of the sovereign services use — no public route,
# no third-party service, nothing leaves the tailnet.
#
# Usage:
#   python3 exif_scan.py --photos /volume1/photo/properties --out /volume1/data/property-photos
#   python3 exif_scan.py --photos ... --out ... --selftest
# =============================================================================
import argparse
import json
import os
import struct
import sys
import time
from datetime import datetime, timezone

BUDGET_SECONDS = 600          # a scan that runs longer than this stops itself
FAIL_LIMIT = 3                # consecutive failed runs before it pauses
READ_BYTES = 512 * 1024       # EXIF lives near the top; never read a whole file
EXTS = ('.jpg', '.jpeg', '.tif', '.tiff')

# The only tags we read. Everything else in the file is ignored — a scanner
# that hoovers up every tag is collecting more about a household than the job
# needs (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
TAG_DATETIME_ORIGINAL = 0x9003
TAG_DATETIME = 0x0132
TAG_MAKE = 0x010F
TAG_MODEL = 0x0110
TAG_EXIF_IFD = 0x8769
TAG_GPS_IFD = 0x8825
GPS_LAT_REF, GPS_LAT = 0x0001, 0x0002
GPS_LNG_REF, GPS_LNG = 0x0003, 0x0004
GPS_HPOS_ERROR = 0x001F

TYPE_SIZES = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8}


def _find_tiff(buf):
    """The offset of the TIFF header, for a JPEG (APP1) or a raw TIFF."""
    if buf[:2] == b'\xff\xd8':                      # JPEG
        i = 2
        while i + 4 <= len(buf):
            if buf[i] != 0xFF:
                return None
            marker, size = buf[i + 1], struct.unpack('>H', buf[i + 2:i + 4])[0]
            if marker == 0xE1 and buf[i + 4:i + 10] == b'Exif\x00\x00':
                return i + 10
            if marker in (0xD8, 0xD9, 0xDA):        # start of scan: no EXIF above
                return None
            i += 2 + size
        return None
    if buf[:2] in (b'II', b'MM'):                   # bare TIFF
        return 0
    return None


def _read_ifd(buf, tiff, offset, endian, wanted):
    """One IFD's wanted tags, as {tag: raw value}. Bounds-checked throughout."""
    out = {}
    if offset is None or tiff + offset + 2 > len(buf):
        return out
    count = struct.unpack(endian + 'H', buf[tiff + offset:tiff + offset + 2])[0]
    if count > 512:            # a plausible IFD; anything larger is a bad read
        return out
    base = tiff + offset + 2
    for n in range(count):
        e = base + n * 12
        if e + 12 > len(buf):
            break
        tag, typ, num = struct.unpack(endian + 'HHI', buf[e:e + 8])
        if tag not in wanted:
            continue
        size = TYPE_SIZES.get(typ)
        if not size or num > 4096:
            continue
        total = size * num
        if total <= 4:
            data = buf[e + 8:e + 8 + total]
        else:
            ptr = struct.unpack(endian + 'I', buf[e + 8:e + 12])[0]
            if tiff + ptr + total > len(buf):
                continue
            data = buf[tiff + ptr:tiff + ptr + total]
        out[tag] = _decode(data, typ, num, endian)
    return out


def _decode(data, typ, num, endian):
    if typ == 2:                                            # ASCII
        return data.split(b'\x00')[0].decode('utf-8', 'replace')
    if typ in (3, 4):                                       # SHORT / LONG
        fmt = 'H' if typ == 3 else 'I'
        vals = struct.unpack(endian + fmt * num, data[:TYPE_SIZES[typ] * num])
        return vals[0] if num == 1 else list(vals)
    if typ in (5, 10):                                      # RATIONAL
        fmt = 'II' if typ == 5 else 'ii'
        vals = struct.unpack(endian + fmt * num, data[:8 * num])
        pairs = [[vals[i], vals[i + 1]] for i in range(0, len(vals), 2)]
        return pairs[0] if num == 1 else pairs
    return None


def read_exif(path):
    """The handful of tags exif.js judges — or None when the file carries none."""
    try:
        with open(path, 'rb') as fh:
            buf = fh.read(READ_BYTES)
    except OSError:
        return None
    tiff = _find_tiff(buf)
    if tiff is None or tiff + 8 > len(buf):
        return None
    endian = '<' if buf[tiff:tiff + 2] == b'II' else '>'
    try:
        ifd0_off = struct.unpack(endian + 'I', buf[tiff + 4:tiff + 8])[0]
    except struct.error:
        return None

    ifd0 = _read_ifd(buf, tiff, ifd0_off, endian,
                     {TAG_MAKE, TAG_MODEL, TAG_DATETIME, TAG_EXIF_IFD, TAG_GPS_IFD})
    exif_ifd = _read_ifd(buf, tiff, ifd0.get(TAG_EXIF_IFD), endian, {TAG_DATETIME_ORIGINAL})
    gps = _read_ifd(buf, tiff, ifd0.get(TAG_GPS_IFD), endian,
                    {GPS_LAT_REF, GPS_LAT, GPS_LNG_REF, GPS_LNG, GPS_HPOS_ERROR})

    out = {}
    # Names match what exif.js reads, so the contract is one vocabulary end to end.
    if TAG_DATETIME_ORIGINAL in exif_ifd:
        out['DateTimeOriginal'] = exif_ifd[TAG_DATETIME_ORIGINAL]
    elif TAG_DATETIME in ifd0:
        out['DateTime'] = ifd0[TAG_DATETIME]
    if TAG_MAKE in ifd0:
        out['Make'] = ifd0[TAG_MAKE]
    if TAG_MODEL in ifd0:
        out['Model'] = ifd0[TAG_MODEL]
    if GPS_LAT in gps and GPS_LNG in gps:
        out['GPSLatitude'] = gps[GPS_LAT]
        out['GPSLatitudeRef'] = gps.get(GPS_LAT_REF, 'N')
        out['GPSLongitude'] = gps[GPS_LNG]
        out['GPSLongitudeRef'] = gps.get(GPS_LNG_REF, 'E')
    if GPS_HPOS_ERROR in gps:
        v = gps[GPS_HPOS_ERROR]
        if isinstance(v, list) and len(v) == 2 and v[1]:
            out['GPSHPositioningError'] = v[0] / v[1]
    return out or None


def scan(photos_dir, budget_until):
    """Walk the library. A file that cannot be read is reported, never skipped silently."""
    items, unreadable, without = [], [], 0
    for root, _dirs, files in os.walk(photos_dir):
        for name in sorted(files):
            if time.time() > budget_until:
                return items, unreadable, without, True
            if not name.lower().endswith(EXTS):
                continue
            full = os.path.join(root, name)
            try:
                st = os.stat(full)
            except OSError as e:
                unreadable.append({'file': os.path.relpath(full, photos_dir), 'why': str(e)})
                continue
            try:
                exif = read_exif(full)
            except Exception as e:                          # a malformed file is data, not a crash
                unreadable.append({'file': os.path.relpath(full, photos_dir), 'why': f'{type(e).__name__}: {e}'})
                continue
            if exif is None:
                without += 1
            items.append({
                'file': os.path.relpath(full, photos_dir),
                'bytes': st.st_size,
                'modified': datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat(),
                'exif': exif or {},
            })
    return items, unreadable, without, False


def main(argv=None):
    ap = argparse.ArgumentParser(description='Read property-photo metadata on the NAS.')
    ap.add_argument('--photos', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--budget', type=int, default=BUDGET_SECONDS)
    ap.add_argument('--selftest', action='store_true',
                    help='parse a synthesized JPEG and assert the GPS round-trips')
    args = ap.parse_args(argv)

    if args.selftest:
        return _selftest()

    os.makedirs(args.out, exist_ok=True)
    lock = os.path.join(args.out, '.lock')
    paused = os.path.join(args.out, '.paused')
    state_path = os.path.join(args.out, '_state.json')

    # BRAKE 3 — kill-switch. A paused scanner does not run and does not argue.
    if os.path.exists(paused):
        print(f'PAUSED: {paused} exists. Remove it deliberately to resume.', file=sys.stderr)
        return 3

    # BRAKE 1 — single instance. A stale lock older than two budgets is broken.
    if os.path.exists(lock):
        if time.time() - os.path.getmtime(lock) < args.budget * 2:
            print('another scan is in progress; skipping (not stacking).', file=sys.stderr)
            return 0
        os.remove(lock)
    with open(lock, 'w') as fh:
        fh.write(str(os.getpid()))

    state = {}
    if os.path.exists(state_path):
        try:
            with open(state_path) as fh:
                state = json.load(fh)
        except (OSError, ValueError):
            state = {}

    started = time.time()
    try:
        if not os.path.isdir(args.photos):
            raise FileNotFoundError(f'no such photo directory: {args.photos}')
        # BRAKE 2 — wall-clock budget. A scan that reaches it stops and says so.
        items, unreadable, without, truncated = scan(args.photos, started + args.budget)
        payload = {
            'scanned_at': datetime.now(timezone.utc).isoformat(),
            'photos_dir': args.photos,
            'count': len(items),
            'with_gps': sum(1 for i in items if 'GPSLatitude' in i['exif']),
            'without_exif': without,
            'unreadable': unreadable,
            'truncated_by_budget': truncated,
            'items': items,
        }
        tmp = os.path.join(args.out, 'exif.json.tmp')
        with open(tmp, 'w') as fh:
            json.dump(payload, fh, indent=1)
        os.replace(tmp, os.path.join(args.out, 'exif.json'))   # atomic; no half file

        state = {'key': 'nas-property-photos', 'at': payload['scanned_at'], 'status': 'ok',
                 'processed': len(items), 'consecutive_failures': 0,
                 'detail': f"{payload['with_gps']} of {len(items)} carry GPS"
                           f"{'; stopped at the budget' if truncated else ''}"
                           f"{f'; {len(unreadable)} unreadable' if unreadable else ''}"}
        print(state['detail'])
        return 0
    except Exception as e:
        fails = int(state.get('consecutive_failures', 0)) + 1
        state = {'key': 'nas-property-photos', 'at': datetime.now(timezone.utc).isoformat(),
                 'status': 'failed', 'processed': 0, 'consecutive_failures': fails,
                 'detail': f'{type(e).__name__}: {e}'}
        if fails >= FAIL_LIMIT:
            with open(paused, 'w') as fh:
                fh.write(state['detail'])
            state['detail'] += f' — PAUSED after {fails} consecutive failures'
        print(state['detail'], file=sys.stderr)
        return 1
    finally:
        with open(state_path, 'w') as fh:
            json.dump(state, fh, indent=1)
        if os.path.exists(lock):
            os.remove(lock)


def _selftest():
    """Proven-to-catch: build a JPEG with known EXIF and require it back out."""
    import tempfile
    # 40deg 7' 30" N, 88deg 14' 42" W — the 805 North Prospect fixture.
    entries = [
        (GPS_LAT_REF, 2, 2, b'N\x00\x00\x00'),
        (GPS_LNG_REF, 2, 2, b'W\x00\x00\x00'),
    ]
    lat = struct.pack('<IIIIII', 40, 1, 7, 1, 30, 1)
    lng = struct.pack('<IIIIII', 88, 1, 14, 1, 42, 1)
    dto = b'2025:10:04 14:22:31\x00'

    # Lay out: TIFF header, IFD0 (2 entries + EXIF/GPS pointers), then the blobs.
    tiff = bytearray(b'II\x2a\x00\x08\x00\x00\x00')
    ifd0_entries, exif_entries, gps_entries = [], [], []
    blobs = bytearray()

    def put(data):
        off = 8 + 2 + 12 * 3 + 4 + 2 + 12 * 1 + 4 + 2 + 12 * 4 + 4 + len(blobs)
        blobs.extend(data)
        return off

    lat_off, lng_off, dto_off = put(lat), put(lng), put(dto)
    exif_ifd_off = 8 + 2 + 12 * 3 + 4
    gps_ifd_off = exif_ifd_off + 2 + 12 * 1 + 4

    # count 4, not 6: an ASCII value of 4 bytes or fewer lives INLINE in the
    # entry; declaring a longer count would make the parser follow it as an
    # offset, which is the bug this fixture existed to rule out.
    ifd0_entries.append(struct.pack('<HHI4s', TAG_MAKE, 2, 4, b'Poe\x00'))
    ifd0_entries.append(struct.pack('<HHII', TAG_EXIF_IFD, 4, 1, exif_ifd_off))
    ifd0_entries.append(struct.pack('<HHII', TAG_GPS_IFD, 4, 1, gps_ifd_off))
    exif_entries.append(struct.pack('<HHII', TAG_DATETIME_ORIGINAL, 2, len(dto), dto_off))
    gps_entries.append(struct.pack('<HHI4s', *entries[0]))
    gps_entries.append(struct.pack('<HHII', GPS_LAT, 5, 3, lat_off))
    gps_entries.append(struct.pack('<HHI4s', *entries[1]))
    gps_entries.append(struct.pack('<HHII', GPS_LNG, 5, 3, lng_off))

    tiff.extend(struct.pack('<H', len(ifd0_entries)) + b''.join(ifd0_entries) + b'\x00' * 4)
    tiff.extend(struct.pack('<H', len(exif_entries)) + b''.join(exif_entries) + b'\x00' * 4)
    tiff.extend(struct.pack('<H', len(gps_entries)) + b''.join(gps_entries) + b'\x00' * 4)
    tiff.extend(blobs)

    app1 = b'Exif\x00\x00' + bytes(tiff)
    jpeg = b'\xff\xd8\xff\xe1' + struct.pack('>H', len(app1) + 2) + app1 + b'\xff\xd9'

    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'fixture.jpg')
        with open(p, 'wb') as fh:
            fh.write(jpeg)
        got = read_exif(p)
        checks = [
            ('GPS latitude', got and got.get('GPSLatitude') == [[40, 1], [7, 1], [30, 1]]),
            ('GPS lat ref', got and got.get('GPSLatitudeRef') == 'N'),
            ('GPS longitude', got and got.get('GPSLongitude') == [[88, 1], [14, 1], [42, 1]]),
            ('GPS lng ref', got and got.get('GPSLongitudeRef') == 'W'),
            ('DateTimeOriginal', got and got.get('DateTimeOriginal') == '2025:10:04 14:22:31'),
            ('Make', got and got.get('Make') == 'Poe'),
        ]
        # A file with no EXIF must come back None, not an empty-but-truthy dict.
        bare = os.path.join(d, 'bare.jpg')
        with open(bare, 'wb') as fh:
            fh.write(b'\xff\xd8\xff\xd9')
        checks.append(('a photo with no EXIF reads as none', read_exif(bare) is None))
        checks.append(('a non-image reads as none', read_exif(os.path.join(d, 'nope.jpg')) is None))

        bad = [name for name, ok in checks if not ok]
        for name, ok in checks:
            print(f"  {'ok  ' if ok else 'FAIL'} {name}")
        if bad:
            print(f'SELFTEST FAILED: {", ".join(bad)}', file=sys.stderr)
            return 1
        print('selftest ok — the parser reads what the camera wrote.')
        return 0


if __name__ == '__main__':
    sys.exit(main())
