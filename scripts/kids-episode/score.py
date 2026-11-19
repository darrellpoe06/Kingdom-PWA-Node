#!/usr/bin/env python3
"""An original orchestral score for a Bible Adventures episode, one cue per mood.

Every note is composed here (no samples, no borrowed melodies) and played by
the FluidR3 General MIDI soundfont (MIT licence), so the church owns the music.
A cue is written as MIDI and rendered with fluidsynth to exactly the length of
its scene, ending on a swell into the next.

Moods: playful, storm, storm-calm, wonder, prayer, shore, city, hush, mercy,
evening, theme. Children are the audience: the storm builds and drives but
never turns to horror; the fish is mysterious and full of wonder.

  python3 score.py <mood> <seconds> <out.wav>
"""
import os, subprocess, sys, tempfile
import mido

SF2 = os.environ.get("SOUNDFONT", "/usr/share/sounds/sf2/FluidR3_GM.sf2")
TPB = 480
# General MIDI programs (0-based)
PIZZ, STRINGS, TREM, HARP, TIMP = 45, 48, 44, 46, 47
CHOIR, BRASS, HORN, TRUMPET, FLUTE, OBOE = 52, 61, 60, 56, 73, 68
CELLO, CELESTA, GLOCK, CLARINET, STRINGS2 = 42, 8, 9, 71, 49
DRUMS = 9  # channel 10


class Cue:
    def __init__(self, bpm):
        self.bpm = bpm
        self.ev = []  # (tick, msg)
        self.ch = {}

    def prog(self, ch, p, vol=100, pan=64, rev=60):
        self.ch[ch] = p
        self.ev += [(0, mido.Message("program_change", channel=ch, program=p)),
                    (0, mido.Message("control_change", channel=ch, control=7, value=vol)),
                    (0, mido.Message("control_change", channel=ch, control=10, value=pan)),
                    (0, mido.Message("control_change", channel=ch, control=91, value=rev))]

    def note(self, ch, n, beat, dur, vel=80):
        t0, t1 = int(beat * TPB), int((beat + dur) * TPB) - 1
        vel = max(1, min(127, int(vel)))
        self.ev += [(t0, mido.Message("note_on", channel=ch, note=n, velocity=vel)),
                    (t1, mido.Message("note_off", channel=ch, note=n, velocity=0))]

    def chord(self, ch, notes, beat, dur, vel=70):
        for n in notes:
            self.note(ch, n, beat, dur, vel)

    def expr(self, ch, beat, value):
        self.ev.append((int(beat * TPB), mido.Message("control_change", channel=ch, control=11, value=max(0, min(127, int(value))))))

    def save(self, path):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm), time=0))
        last = 0
        for t, m in sorted(self.ev, key=lambda x: (x[0], x[1].type == "note_on")):
            tr.append(m.copy(time=t - last))
            last = t
        mid.save(path)


def beats_for(sec, bpm):
    return sec * bpm / 60.0


def swell(c, ch, start, end, lo=40, hi=118, steps=24):
    for i in range(steps + 1):
        c.expr(ch, start + (end - start) * i / steps, lo + (hi - lo) * i / steps)


def cymbal_swell(c, at, length=4):
    # a soft suspended-cymbal roll rising into the next scene
    for i in range(int(length * 4)):
        c.note(DRUMS, 51, at + i * 0.25, 0.25, 30 + i * 5)
    c.note(DRUMS, 49, at + length, 2, 92)


# ---- the cues ----------------------------------------------------------------

def playful(sec, bright=1.0):
    bpm = 116
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, PIZZ, 100, 50); c.prog(1, FLUTE, 96, 78); c.prog(2, GLOCK, 70, 90); c.prog(3, STRINGS, 72, 64)
    prog = [(62, 66, 69), (55, 59, 62), (57, 61, 64), (62, 66, 69)]  # D G A D
    tune = [74, 76, 78, 81, 78, 76, 74, 76, 78, 76, 74, 73, 74]
    b = 0.0; k = 0
    while b < n - 4:
        ch_ = prog[k % 4]
        for i in range(8):  # bouncing pizzicato eighths
            c.note(0, ch_[i % 3] - 12 + (12 if i % 4 == 2 else 0), b + i * 0.5, 0.4, 76 if i % 2 == 0 else 60)
        c.chord(3, ch_, b, 4, 46)
        if k % 2 == 1:
            for i, t in enumerate(tune[:8]):
                c.note(1, t, b + i * 0.5, 0.5, 82 * bright)
            c.note(2, tune[k % len(tune)] + 12, b + 3, 1, 70)
        b += 4; k += 1
    cymbal_swell(c, max(0, n - 4), 3)
    return c


def storm(sec, calm_at=None):
    bpm = 132
    c = Cue(bpm); n = beats_for(sec, bpm)
    calm_b = beats_for(calm_at, bpm) if calm_at else n + 99
    c.prog(0, TREM, 110, 40); c.prog(1, STRINGS, 100, 88); c.prog(2, BRASS, 96, 64); c.prog(3, TIMP, 120, 64); c.prog(4, CHOIR, 70, 64)
    # D minor ostinato: driving low strings, timpani pulses, brass stabs; builds in waves
    ost = [38, 38, 41, 38, 43, 38, 41, 40]
    b = 0.0; bar = 0
    while b < min(n, calm_b):
        lvl = min(1.0, 0.55 + 0.45 * (b / max(1, min(n, calm_b))))
        for i, p in enumerate(ost):
            c.note(0, p, b + i * 0.5, 0.45, 70 + 40 * lvl)
        c.note(3, 38, b, 0.5, 90 * lvl + 20); c.note(3, 38, b + 2, 0.5, 70 * lvl + 20)
        if bar % 2 == 1:
            c.chord(2, [50, 53, 57], b + 3, 0.75, 85 * lvl + 20)  # brass stab
            c.chord(1, [62, 65, 69], b, 4, 60 * lvl + 20)
        if bar % 4 == 3:
            for r in range(8):  # timpani roll into the next wave
                c.note(3, 38, b + 2 + r * 0.25, 0.25, 60 + r * 8)
            c.note(DRUMS, 49, b + 4, 2, 100)
        b += 4; bar += 1
    if calm_at:
        # the sea ceases: a held, warm resolution (D major), strings and soft choir
        c.note(DRUMS, 52, calm_b, 3, 70)
        c.chord(1, [62, 66, 69, 74], calm_b, max(2, n - calm_b), 64)
        c.chord(4, [62, 66, 69], calm_b + 1, max(2, n - calm_b - 1), 50)
        swell(c, 1, calm_b, n, 100, 50)
    else:
        swell(c, 1, max(0, n - 6), n, 70, 120)
        cymbal_swell(c, max(0, n - 4), 3)
    return c


def wonder(sec):
    bpm = 72
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, HARP, 96, 50); c.prog(1, CHOIR, 84, 78); c.prog(2, CELESTA, 70, 90); c.prog(3, STRINGS, 78, 64); c.prog(4, HORN, 84, 40)
    chords = [(50, 57, 62, 66, 69), (48, 55, 60, 64, 67), (50, 57, 62, 66, 71), (52, 59, 64, 68, 71)]  # D, C, D(add6), E (lydian lift)
    b = 0.0; k = 0
    while b < n:
        ch_ = chords[k % 4]
        for i in range(8):  # rippling harp arpeggio
            c.note(0, ch_[i % 5] + (12 if i >= 5 else 0), b + i * 0.5, 0.9, 70 + (i % 3) * 6)
        c.chord(3, [ch_[0] - 12, ch_[0]], b, 4, 60)
        c.chord(1, ch_[2:], b, 4, 58)
        if k % 2 == 0:
            c.note(2, ch_[4] + 12, b + 1, 1.5, 64); c.note(2, ch_[3] + 12, b + 2.5, 1.5, 58)
        if k == 1:
            c.note(4, ch_[2], b, 3, 78)  # the horn call as the great fish appears
        b += 4; k += 1
    swell(c, 3, 0, n, 50, 105)
    return c


def prayer(sec):
    bpm = 64
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, CELLO, 100, 54); c.prog(1, STRINGS2, 70, 74); c.prog(2, HARP, 60, 64)
    line = [62, 64, 66, 69, 67, 66, 64, 62, 61, 62]
    chords = [(50, 57, 62), (47, 54, 59), (43, 50, 55), (45, 52, 57)]  # D Bm G A
    b = 0.0; k = 0
    while b < n:
        c.chord(1, chords[k % 4], b, 4, 52)
        c.note(2, chords[k % 4][0] + 12, b, 2, 44)
        if k % 2 == 1:
            for i, t in enumerate(line[:4] if k % 4 == 1 else line[4:8]):
                c.note(0, t - 12, b + i, 1, 72)
        b += 4; k += 1
    return c


def city(sec):
    bpm = 112
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, STRINGS, 96, 54); c.prog(1, TRUMPET, 92, 74); c.prog(2, HORN, 84, 40); c.prog(3, PIZZ, 90, 64)
    prog = [(57, 62, 66), (55, 59, 62), (57, 61, 64), (57, 62, 66)]
    fan = [69, 74, 76, 78, 76, 74]
    b = 0.0; k = 0
    while b < n - 2:
        ch_ = prog[k % 4]
        for i in range(4):  # march: snare, kick, low pizz
            c.note(DRUMS, 38, b + i, 0.25, 70 if i % 2 else 84)
            c.note(DRUMS, 38, b + i + 0.5, 0.25, 46)
            c.note(DRUMS, 36, b + i, 0.25, 70 if i % 2 == 0 else 0)
            c.note(3, ch_[0] - 12, b + i, 0.5, 70)
        c.chord(0, ch_, b, 4, 62)
        if k % 2 == 0:
            for i, t in enumerate(fan):
                c.note(1, t, b + i * 0.5, 0.5, 84)
        else:
            c.chord(2, [ch_[0], ch_[2]], b, 3, 70)
        b += 4; k += 1
    cymbal_swell(c, max(0, n - 4), 3)
    return c


def hush(sec):
    bpm = 60
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, STRINGS, 74, 54); c.prog(1, OBOE, 70, 74)
    chords = [(50, 57, 62), (48, 55, 60), (46, 53, 58), (45, 52, 57)]  # Dm C Bb A
    b = 0.0; k = 0
    while b < n:
        c.chord(0, chords[k % 4], b, 4, 48)
        if k % 2 == 1:
            c.note(1, chords[k % 4][2] + 12, b + 1, 2, 56)
        b += 4; k += 1
    return c


def mercy(sec, grand=False):
    bpm = 84
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, STRINGS, 100, 50); c.prog(1, HORN, 92, 74); c.prog(2, HARP, 76, 64); c.prog(3, GLOCK, 64, 90); c.prog(4, CHOIR, 70, 64)
    prog = [(62, 66, 69), (57, 61, 64), (59, 62, 66), (55, 59, 62)]  # D A Bm G
    hymn = [74, 76, 78, 76, 74, 71, 73, 74]
    b = 0.0; k = 0
    while b < n:
        ch_ = prog[k % 4]
        c.chord(0, [ch_[0] - 12] + list(ch_), b, 4, 64 + (10 if grand else 0))
        for i in range(4):
            c.note(2, ch_[i % 3] + 12, b + i, 1, 56)
        c.note(1, hymn[(k * 2) % 8], b, 2, 82); c.note(1, hymn[(k * 2 + 1) % 8], b + 2, 2, 80)
        if grand:
            c.chord(4, ch_, b, 4, 52)
            c.note(3, hymn[(k * 2) % 8] + 12, b, 1, 66)
        b += 4; k += 1
    swell(c, 0, 0, min(n, 8), 50, 110)
    return c


def evening(sec):
    # Jonah 4: reflective at first, then warm as Yahweh answers (the second half)
    bpm = 66
    c = Cue(bpm); n = beats_for(sec, bpm)
    c.prog(0, STRINGS, 84, 54); c.prog(1, CLARINET, 76, 74); c.prog(2, HORN, 80, 50)
    first = [(50, 57, 62), (46, 53, 58), (48, 55, 60), (45, 52, 57)]
    second = [(50, 57, 62, 66), (55, 59, 62, 67), (57, 61, 64, 69), (50, 57, 62, 66)]
    b = 0.0; k = 0
    while b < n:
        warm = b > n * 0.55
        ch_ = (second if warm else first)[k % 4]
        c.chord(0, ch_, b, 4, 56 if not warm else 66)
        if k % 2 == 1:
            c.note(1 if not warm else 2, ch_[2] + 12, b + 1, 2.5, 66)
        b += 4; k += 1
    return c


MOODS = {
    "harbor": lambda s: playful(s), "theme": lambda s: mercy(s, grand=True), "playful": playful,
    "storm": storm, "storm-calm": lambda s: storm(s, calm_at=s * 0.62),
    "sea": wonder, "wonder": wonder, "underwater": prayer, "prayer": prayer,
    "shore": lambda s: playful(s, 1.1), "city": city, "hush": hush, "morning": mercy, "evening": evening,
}


def render(mood, sec, out_wav):
    cue = MOODS.get(mood, playful)(sec)
    with tempfile.TemporaryDirectory() as d:
        mid = os.path.join(d, "cue.mid")
        cue.save(mid)
        raw = os.path.join(d, "raw.wav")
        subprocess.run(["fluidsynth", "-ni", "-g", "0.8", "-r", "48000", "-F", raw, SF2, mid], check=True, capture_output=True)
        # exact length, gentle fades, a hall reverb tail already comes from the soundfont's chorus/reverb
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
                        f"apad,atrim=0:{sec},afade=t=in:d=0.6,afade=t=out:st={max(0, sec - 1.2)}:d=1.2", "-ac", "2", "-ar", "48000", out_wav], check=True)


if __name__ == "__main__":
    render(sys.argv[1], float(sys.argv[2]), sys.argv[3])
