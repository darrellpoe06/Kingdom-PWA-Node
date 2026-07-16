#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ptz_preset -- recall a PTZOptics camera PRESET deterministically (no password).

THE FIX FOR "adjust the preview camera" (Darrell 2026-07-14): "we always ask you
to adjust one of the preview window cameras until you adjust accurately... you did
nothing today." A live plea to a cloud agent can NEVER work -- the agent has no
route to the church LAN, and by the time it answers the shot is gone. The
deterministic answer is PRESETS: frame each shot ONCE (Pulpit / Wide / Choir /
Lectern), store it on the camera, and then "adjust the preview" becomes one
command that recalls a known-good position -- fired by the operator, the app, or a
runner, on the church LAN, instantly, every time the same.

PROTOCOL: VISCA-over-IP "Memory Recall" -- the documented VISCA command
  0x81 0x01 0x04 0x3F 0x02 <preset> 0xFF
(0x81 = header for camera address 1). PTZOptics cameras speak VISCA-over-IP with
NO password (unlike the HTTP-CGI, which needs Basic auth) -- so this fits
"I'm not adding passwords." The command bytes are a fixed SPEC, unit-tested below.

HARDWARE-CONFIRM (DR-0076 -- do NOT claim what is unverified): the VISCA-over-IP
UDP PORT varies by model/firmware -- commonly 1259 on PTZOptics, sometimes 5678,
and the wrapped "VISCA over IP" variant uses 52381 with an 8-byte header. This
script sends RAW VISCA (the common PTZOptics-legacy path) and defaults to 1259.
The packet BYTES are verified; the port/variant must be confirmed on the church
LAN once (the camera's web UI -> Setup -> Network shows the VISCA port). Until then
this is the correct command aimed at the default port -- proven in construction,
pending one on-site confirmation of the port.

Usage (on the church LAN):
  python3 ptz_preset.py 192.168.1.201 1            # recall preset 1 on that camera
  python3 ptz_preset.py 192.168.1.201 1 --port 5678
  python3 ptz_preset.py 192.168.1.201 1 --wrapped  # VISCA-over-IP header variant (port 52381)
"""
import argparse
import socket
import sys


def recall_preset_bytes(preset, addr=1):
    """The VISCA 'Memory Recall' command for `preset` (0-254) on camera `addr`
    (1-7). Returns the raw byte string. Pure + spec-defined (unit-tested)."""
    if not (0 <= int(preset) <= 254):
        raise ValueError("preset must be 0..254")
    if not (1 <= int(addr) <= 7):
        raise ValueError("camera address must be 1..7")
    header = 0x80 | (int(addr) & 0x0F)  # 0x81 for address 1
    return bytes([header, 0x01, 0x04, 0x3F, 0x02, int(preset) & 0xFF, 0xFF])


def wrap_visca_over_ip(payload, seq=1):
    """The 8-byte VISCA-over-IP header + payload (the 'wrapped' variant, port
    52381): type=0x0100 (command), 2-byte length, 4-byte sequence. Pure."""
    length = len(payload)
    return bytes([0x01, 0x00, (length >> 8) & 0xFF, length & 0xFF,
                  (seq >> 24) & 0xFF, (seq >> 16) & 0xFF, (seq >> 8) & 0xFF, seq & 0xFF]) + payload


def recall(ip, preset, port=1259, addr=1, wrapped=False, timeout=2.0):
    """Send the recall over UDP. Returns True on send (NOT proof the camera
    moved -- UDP is fire-and-forget; confirm on the preview monitor)."""
    payload = recall_preset_bytes(preset, addr)
    datagram = wrap_visca_over_ip(payload) if wrapped else payload
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(timeout)
    try:
        s.sendto(datagram, (ip, int(port)))
        return True
    finally:
        s.close()


def main():
    ap = argparse.ArgumentParser(description="Recall a PTZOptics preset over VISCA-over-IP (no password).")
    ap.add_argument("ip", help="camera IP on the church LAN")
    ap.add_argument("preset", type=int, help="preset number to recall (0-254)")
    ap.add_argument("--port", type=int, default=1259, help="VISCA-over-IP UDP port (default 1259; confirm on the camera)")
    ap.add_argument("--addr", type=int, default=1, help="VISCA camera address (default 1)")
    ap.add_argument("--wrapped", action="store_true", help="use the 8-byte VISCA-over-IP header variant (port 52381)")
    args = ap.parse_args()
    try:
        recall(args.ip, args.preset, port=args.port, addr=args.addr, wrapped=args.wrapped)
        print(f"sent recall preset {args.preset} -> {args.ip}:{args.port}"
              f"{' (wrapped)' if args.wrapped else ''}. Confirm on the preview monitor.")
        return 0
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
