#!/usr/bin/env python3
"""Original music and sound for a Bible Adventures episode, synthesized from code.

Every sound here is generated (no samples, no third-party recordings), so the
church owns it outright: a warm theme (soft pads, a gentle bell melody) and the
ambiences the storyboard names (harbor, storm with rain and thunder, sea,
underwater, shore, city murmur, hush, morning birds, evening).

  python3 sound.py music <seconds> <out.wav>
  python3 sound.py ambience <name> <seconds> <out.wav> [thunder_at=s1,s2]
"""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, hz, order=4):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=4):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def env_adsr(n, a=0.4, r=1.2):
    e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    e[:na] = np.linspace(0, 1, na)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def note(freq, sec, kind="pad"):
    t = t_axis(sec)
    if kind == "pad":
        # three slightly detuned soft triangles, a warm chorus
        x = sum(2 / np.pi * np.arcsin(np.sin(2 * np.pi * freq * (1 + d) * t)) for d in (-0.003, 0, 0.0035))
        return lp(x, 1800) * env_adsr(len(t), 1.2, 1.8)
    if kind == "bell":
        x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) + 0.18 * np.sin(2 * np.pi * freq * 5.4 * t)
        return x * np.exp(-t * 2.2)
    if kind == "bass":
        x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
        return x * env_adsr(len(t), 0.05, 0.8)
    raise ValueError(kind)


def hz(n):  # MIDI note number to Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def music(sec):
    """A gentle theme in D major: I - V - vi - IV, 4 s a chord, bells on top."""
    out = np.zeros(int(sec * SR) + SR * 8)
    chords = [(62, 66, 69), (57, 61, 64), (59, 62, 66), (55, 59, 62)]  # D A Bm G
    roots = [38, 33, 35, 31]
    melody = [(74, 0), (76, 1), (78, 2), (76, 3), (73, 4), (71, 6), (73, 7), (74, 8), (71, 10), (69, 12), (71, 13), (74, 14)]
    bar = 4.0
    pos = 0.0
    k = 0
    while pos < sec:
        c = chords[k % 4]
        i0 = int(pos * SR)
        for n in c:
            v = note(hz(n), bar + 1.5, "pad") * 0.16
            out[i0:i0 + len(v)] += v
        b = note(hz(roots[k % 4]), bar, "bass") * 0.22
        out[i0:i0 + len(b)] += b
        if (k // 4) % 2 == 1:  # the bell melody every other phrase
            for n, beat in melody:
                if beat // 4 == k % 4:
                    j = i0 + int((beat % 4) * SR)
                    v = note(hz(n), 2.5, "bell") * 0.12
                    out[j:j + len(v)] += v
        pos += bar
        k += 1
    out = out[: int(sec * SR)]
    # simple room: two short echoes
    for d, g in ((0.11, 0.25), (0.23, 0.15)):
        s = int(d * SR)
        out[s:] += out[:-s] * g
    fade = min(len(out), SR * 3)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return norm(out, 0.8)


def waves(t, depth=1.0, period=7.0):
    n = rng.standard_normal(len(t))
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / period + rng.uniform(0, 6)) ** 2
    return lp(n, 900) * swell * depth


def wind(t, strength=1.0):
    n = rng.standard_normal(len(t))
    gust = 0.5 + 0.5 * np.sin(2 * np.pi * t / 5.3) * np.sin(2 * np.pi * t / 2.1 + 1)
    return bp(n, 250, 1200) * (0.4 + 0.6 * gust) * strength


def rain(t):
    n = rng.standard_normal(len(t))
    return hp(n, 2500) * 0.5


def thunder(t, at):
    out = np.zeros(len(t))
    for s in at:
        i = int(s * SR)
        if i >= len(t):
            continue
        k = min(len(t) - i, int(4 * SR))
        tt = np.arange(k) / SR
        crack = rng.standard_normal(k) * np.exp(-tt * 9) * 0.9
        rumble = lp(rng.standard_normal(k), 140) * np.exp(-tt * 0.9) * 6
        out[i:i + k] += crack + rumble
    return out


def birds(t):
    out = np.zeros(len(t))
    for _ in range(int(len(t) / SR / 1.6)):
        i = rng.integers(0, max(1, len(t) - SR))
        k = int(rng.uniform(0.08, 0.16) * SR)
        tt = np.arange(k) / SR
        f0 = rng.uniform(2800, 4200)
        chirp = np.sin(2 * np.pi * (f0 * tt + rng.uniform(-6000, 6000) * tt ** 2)) * np.hanning(k)
        for rep in range(rng.integers(1, 4)):
            j = i + rep * int(0.13 * SR)
            if j + k < len(t):
                out[j:j + k] += chirp * 0.25
    return out


def murmur(t):
    out = np.zeros(len(t))
    for _ in range(14):  # many soft voices: formant-like noise bands that rise and fall
        lo = rng.uniform(250, 700)
        band = bp(rng.standard_normal(len(t)), lo, lo * 2.2, 2)
        am = 0.5 + 0.5 * np.sin(2 * np.pi * t * rng.uniform(1.5, 4) + rng.uniform(0, 6))
        out += band * am
    return lp(out, 2500)


def ambience(name, sec, thunder_at=()):
    t = t_axis(sec)
    if name == "harbor":
        x = waves(t, 0.7, 6) + wind(t, 0.25)
    elif name == "storm":
        x = waves(t, 1.4, 4) + wind(t, 1.1) + rain(t) + thunder(t, thunder_at)
    elif name == "storm-calm":
        calm = np.clip(1.2 - t / max(sec, 1) * 1.4, 0.15, 1)
        x = (waves(t, 1.2, 4) + wind(t, 0.9) + rain(t)) * calm + thunder(t, thunder_at)
    elif name == "sea":
        x = waves(t, 1.1, 8) + lp(rng.standard_normal(len(t)), 80) * 2.5
    elif name == "underwater":
        x = lp(rng.standard_normal(len(t)), 220) * 2.0 + 0.4 * np.sin(2 * np.pi * 55 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6))
    elif name == "shore":
        x = waves(t, 1.0, 5) + birds(t) * 0.6
    elif name == "city":
        x = murmur(t) * 0.5 + wind(t, 0.2)
    elif name == "hush":
        x = murmur(t) * 0.15 + wind(t, 0.25)
    elif name == "morning":
        x = birds(t) + wind(t, 0.2)
    elif name == "evening":
        x = wind(t, 0.35)
    else:  # theme / unknown: near silence
        x = wind(t, 0.05)
    f = min(len(x), int(SR * 1.5))
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return norm(x, 0.7)


def splash():
    t = t_axis(1.6)
    body = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 3.2)
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 9) * 1.5
    return norm(body + thump, 0.8).astype(np.float32)


def whale():
    # a gentle, deep call as the great fish rises: low, slow, never a roar
    t = t_axis(3.2)
    f = 110 - 35 * (t / t[-1]) + 6 * np.sin(2 * np.pi * 0.9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.35 * np.sin(2 * ph)) * np.hanning(len(t))
    return norm(lp(x, 900), 0.55).astype(np.float32)


def bubbles(sec=3.0):
    t = t_axis(sec)
    out = np.zeros(len(t))
    for _ in range(int(sec * 5)):
        i = rng.integers(0, len(t) - SR // 8)
        k = SR // 10
        tt = np.arange(k) / SR
        f0 = rng.uniform(500, 1100)
        out[i:i + k] += np.sin(2 * np.pi * (f0 * tt + 900 * tt ** 2)) * np.exp(-tt * 40)
    return norm(out, 0.35).astype(np.float32)


def whoosh(sec=1.4):
    t = t_axis(sec)
    n = rng.standard_normal(len(t))
    x = bp(n, 300, 3000) * np.sin(np.pi * t / sec) ** 2
    return norm(x, 0.5).astype(np.float32)


def moments(beat):
    """(sound, seconds into the beat) for the story's own moments."""
    out = []
    lines = beat.get("lines", [])
    if beat["id"] != "intro":
        out.append((whoosh(), max(0.0, beat["dur"] - 1.3)))  # carries into the next scene
    for l in lines:
        if l.get("ref") == "Jonah 1:15":
            out.append((splash(), l["at"] + 2.6))  # "cast him forth into the sea"
    if beat["ambience"] == "sea":
        out.append((whale(), 0.8))
    if beat["ambience"] == "underwater":
        out.append((bubbles(), 0.3))
    return out


if __name__ == "__main__":
    kind = sys.argv[1]
    if kind == "music":
        sf.write(sys.argv[3], music(float(sys.argv[2])).astype(np.float32), SR)
    else:
        at = ()
        for a in sys.argv[5:]:
            if a.startswith("thunder_at="):
                at = tuple(float(v) for v in a.split("=", 1)[1].split(",") if v)
        sf.write(sys.argv[4], ambience(sys.argv[2], float(sys.argv[3]), at).astype(np.float32), SR)
