#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stdlib tests for ptz_preset's VISCA packet construction (no network -- the
byte SPEC is what's verifiable; the UDP port is the on-site confirm). DR-0076."""
import sys
from ptz_preset import recall_preset_bytes, wrap_visca_over_ip

def check(name, cond):
    print(("ok  " if cond else "FAIL ") + name); return cond

ok = True
# Memory Recall, camera address 1, preset 1: 81 01 04 3F 02 01 FF
ok &= check("recall preset 1 addr 1", recall_preset_bytes(1) == bytes([0x81,0x01,0x04,0x3F,0x02,0x01,0xFF]))
# preset 5
ok &= check("recall preset 5", recall_preset_bytes(5) == bytes([0x81,0x01,0x04,0x3F,0x02,0x05,0xFF]))
# camera address 2 -> header 0x82
ok &= check("addr 2 header", recall_preset_bytes(3, addr=2)[0] == 0x82)
# preset 254 (max)
ok &= check("preset 254", recall_preset_bytes(254)[5] == 0xFE)
# out-of-range guarded
try:
    recall_preset_bytes(255); ok &= check("preset 255 rejected", False)
except ValueError:
    ok &= check("preset 255 rejected", True)
try:
    recall_preset_bytes(1, addr=8); ok &= check("addr 8 rejected", False)
except ValueError:
    ok &= check("addr 8 rejected", True)
# wrapped VISCA-over-IP header: type 0x0100, length 7, seq 1, then payload
w = wrap_visca_over_ip(recall_preset_bytes(1), seq=1)
ok &= check("wrapped type", w[0:2] == bytes([0x01,0x00]))
ok &= check("wrapped length = 7", w[2:4] == bytes([0x00,0x07]))
ok &= check("wrapped seq = 1", w[4:8] == bytes([0x00,0x00,0x00,0x01]))
ok &= check("wrapped carries payload", w[8:] == recall_preset_bytes(1))

print("\nALL PASS" if ok else "\nFAILURES"); sys.exit(0 if ok else 1)
