#!/usr/bin/env python3
"""Render a Bible Adventures episode: scenes in motion, narration, music, sound, captions.

  python3 render.py <episode.json> <narrationDir|--placeholder> <outDir> [--draft]
      [--shots=<shots.json> --clips=<dir of <clip>.slow.mp4>]

- With --shots, a scene listed there is cut from animated clips (each slowed by
  motion interpolation to fill its shot) with the approved stills between them;
  scenes not listed keep the still-picture camera.

- Every beat is timed to its narration (timings.json from narrate.py); with
  --placeholder the lines are timed from their word count and the voice is
  silent, so the whole pipeline can be checked before the voice exists.
- Pictures: the approved scenes from app/public/lovecorner/kids, moved with a
  slow camera (push, pull, pan), with weather and light where the story has it
  (rain and lightning in the storm, drifting light inside the fish, morning
  glow), vignette and fine grain; beats cross-fade.
- Sound: the narration on top; original synthesized ambience per beat and the
  original theme underneath, the music ducked under the voice (sound.py).
- Captions: WebVTT, one cue per sentence-sized chunk, timed by characters
  inside each recorded line; also muxed into the MP4 as a soft subtitle track.
Output: <out>/jonah.mp4 (1920x1080, H.264 + AAC), jonah.en.vtt, jonah-poster.jpg,
jonah.cut.json (what each beat is made from, how long, from which voice).
"""

import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
KIDS = os.path.join(ROOT, "app", "public", "lovecorner", "kids")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sound

FPS = 30
W, H = 1920, 1080
XF = 1.0  # crossfade seconds
LEAD, GAP, TAIL = 1.3, 0.55, 1.2
SR = 48000
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

SCENES = {
    "key-art": "bible-adventures-key-art.jpg",
    "jonah-2b": "jonah-2.jpg",
    "jonah-8b": "jonah-8.jpg",
}
# camera per beat: (zoom from, zoom to, focus x from, focus x to, focus y from, focus y to) in 0..1 of the picture
CAMERA = {
    "intro": (1.00, 1.12, 0.50, 0.50, 0.48, 0.45),
    "b1": (1.18, 1.02, 0.62, 0.45, 0.45, 0.48),
    "b2": (1.05, 1.22, 0.55, 0.62, 0.50, 0.42),
    "b3": (1.25, 1.08, 0.35, 0.50, 0.45, 0.50),
    "b4": (1.02, 1.20, 0.55, 0.70, 0.50, 0.50),
    "b5": (1.20, 1.04, 0.50, 0.50, 0.38, 0.48),
    "b6": (1.04, 1.18, 0.40, 0.30, 0.52, 0.55),
    "b7": (1.16, 1.02, 0.60, 0.50, 0.40, 0.48),
    "b8": (1.02, 1.16, 0.45, 0.55, 0.52, 0.50),
    "b9": (1.00, 1.14, 0.60, 0.62, 0.45, 0.42),
    # Jonah 4: Jonah alone, from behind, over the city (Jonah 4:5); tight enough to leave the guides out of frame
    "b10": (2.30, 2.45, 0.22, 0.20, 0.22, 0.20),
    "outro": (1.12, 1.00, 0.50, 0.50, 0.45, 0.48),
}


# the closing credits, rolled over the key art (title lines in gold)
CREDITS = [
    ("Jonah and the Great Fish", True),
    ("A Love Corner Bible Adventure", False),
    ("", False),
    ("Scripture", True),
    ("The Book of Jonah, King James Version", False),
    ("", False),
    ("Animation", True),
    ("Runway Gen-4.5, from The Love Corner\u2019s approved art", False),
    ("", False),
    ("Music and Sound", True),
    ("An original score and sound made for this episode", False),
    ("", False),
    ("Voices", True),
    ("Kokoro open voices (Apache-2.0)", False),
    ("", False),
    ("Produced by The Love Corner Kids Zone", True),
    ("", False),
    ("Salvation is of the LORD. Jonah 2:9", False),
    ("To the glory of Yahweh", True),
]
CHILD = {}  # speaker -> semitones up (the guides), from the episode's childVoice


def child(a, who):
    """The guides' voices: the cast voice raised (pitch and formants, length kept);
    'guides' (both together) is two raised copies a breath apart."""
    import tempfile

    def up(x, st):
        with tempfile.TemporaryDirectory() as d:
            i, o = os.path.join(d, "i.wav"), os.path.join(d, "o.wav")
            sf.write(i, x, SR)
            run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", i, "-af"]
                + [f"rubberband=pitch={2 ** (st / 12):.4f}:transients=smooth", o]
            )
            y, _ = sf.read(o, dtype="float32")
        return y[: len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))

    st = CHILD[who]
    if who != "guides":
        return up(a, st)
    k = int(0.03 * SR)
    b = np.pad(up(a, st + 2.5), (k, 0))[: len(a)]
    return 0.62 * up(a, st) + 0.62 * b


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])} ...")


def load_timings(ep, narr):
    if narr == "--placeholder":
        lines = []
        for b in ep["beats"]:
            for i, l in enumerate(b["lines"]):
                n = len(l["text"].split())
                lines.append(
                    {
                        "beat": b["id"],
                        "line": i,
                        "file": None,
                        "seconds": round(n / (2.2 if l["kind"] == "kjv" else 2.5), 2),
                        "kind": l["kind"],
                        "ref": l.get("ref"),
                        "text": l["text"],
                    }
                )
        return {"voice": "placeholder (silent)", "lines": lines}
    return json.load(open(os.path.join(narr, "timings.json")))


def plan(ep, tim):
    by = {}
    for l in tim["lines"]:
        by.setdefault(l["beat"], []).append(l)
    beats, t = [], 0.0
    for k, b in enumerate(ep["beats"]):
        ls = by.get(b["id"], [])
        dur = LEAD + sum(x["seconds"] for x in ls) + GAP * max(0, len(ls) - 1) + TAIL
        dur = max(dur, float(b.get("minDur", 5.0)))
        start = t
        cur = LEAD  # line times are relative to the beat's own start (mix and vtt add the start once)
        placed = []
        for x in ls:
            placed.append({**x, "at": round(cur, 3)})
            cur += x["seconds"] + GAP
        beats.append(
            {**b, "start": round(start, 3), "dur": round(dur, 3), "lines": placed}
        )
        t = start + dur - XF
    total = beats[-1]["start"] + beats[-1]["dur"]
    return beats, total


def thunder_times(dur, n=3):
    return [round(dur * f, 2) for f in (0.22, 0.55, 0.83)[:n]]


def beat_video(b, out, draft):
    scene = SCENES.get(b["scene"], f"{b['scene']}.jpg")
    src = os.path.join(KIDS, scene)
    z0, z1, x0, x1, y0, y1 = b.get("cam") or CAMERA.get(
        b["id"], (1.0, 1.12, 0.5, 0.5, 0.5, 0.5)
    )
    d = b["dur"]
    n = round(d * FPS)
    up = 2304 if draft else 2880
    # zoompan works on the upscaled still; p = progress 0..1 with an ease-in-out
    p = f"(0.5-0.5*cos(PI*on/{max(n - 1, 1)}))"
    z = f"({z0}+({z1}-{z0})*{p})"
    x = f"max(0,min(iw-iw/zoom,({x0}+({x1}-{x0})*{p})*iw-iw/zoom/2))"
    y = f"max(0,min(ih-ih/zoom,({y0}+({y1}-{y0})*{p})*ih-ih/zoom/2))"
    base = f"[0:v]scale={up}:-2,setsar=1,zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS},format=yuv420p"
    amb = b["ambience"]
    inputs = [
        "-i",
        src,
    ]  # ONE still frame: zoompan makes d frames from each input frame
    graph = base + "[bg]"
    last = "bg"
    if amb in ("storm", "storm-calm"):
        th = thunder_times(d)
        flash = "+".join(
            f"between(t,{a},{a + 0.09})*0.42+between(t,{a + 0.16},{a + 0.22})*0.25"
            for a in th
        )
        graph += f";[{last}]eq=brightness='{flash}':saturation=0.85:eval=frame[lit]"
        last = "lit"
        # rain: sparse bright noise, streaked by a directional blur, screened on top
        graph += (
            f";color=black:s={W}x{H}:r={FPS}:d={d},noise=alls=100:allf=t+u,format=gray,"
            f"lutyuv=y='if(gt(val,247),255,0)',dblur=angle=75:radius=28,eq=contrast=2.2:brightness=0.06,format=gbrp[rain]"
            f";[{last}]format=gbrp[base];[base][rain]blend=all_mode=screen:all_opacity={0.38 if amb == 'storm' else 0.22}[wet]"
        )
        last = "wet"
    elif amb == "underwater":
        graph += (
            f";[{last}]eq=brightness='0.035*sin(2*PI*t/5)':eval=frame[pulse]"
            f";color=black:s={W}x{H}:r={FPS}:d={d},noise=alls=100:allf=t+u,format=gray,lutyuv=y='if(gt(val,252),255,0)',"
            f"gblur=sigma=2.2,eq=contrast=3:brightness=0.05,format=gbrp[motes]"
            f";[pulse]format=gbrp[pb];[pb][motes]blend=all_mode=screen:all_opacity=0.35[sea]"
        )
        last = "sea"
    elif amb in ("morning", "theme"):
        graph += f";[{last}]format=gbrp,split[a][b];[b]gblur=sigma=18[glow];[a][glow]blend=all_mode=screen:all_opacity=0.22[bloom]"
        last = "bloom"
    elif amb == "evening":
        graph += (
            f";[{last}]colorbalance=rs=0.06:bs=-0.06:rm=0.04,eq=saturation=0.9[eve]"
        )
        last = "eve"
    elif amb in ("sea", "shore", "harbor"):
        graph += f";[{last}]eq=brightness='0.02*sin(2*PI*t/3.2)':eval=frame[shim]"
        last = "shim"
    # titles
    if b["id"] == "intro":
        graph += (
            f";[{last}]drawbox=x=0:y=ih*0.67:w=iw:h=ih*0.23:color=black@0.45:t=fill:enable='gte(t,0.8)'"
            f",drawtext=fontfile={FONT}:text='Jonah and the Great Fish':fontsize=96:fontcolor=white:"
            f"borderw=5:bordercolor=0x2A1440:x=(w-text_w)/2:y=h*0.70:alpha='min(1,max(0,(t-1.0)/1.2))*min(1,max(0,({d}-t-0.6)/1.0))'"
            f",drawtext=fontfile={FONT}:text='The Love Corner Bible Adventures':fontsize=46:fontcolor=0xFFD86B:borderw=4:bordercolor=0x2A1440:"
            f"x=(w-text_w)/2:y=h*0.70+110:alpha='min(1,max(0,(t-1.8)/1.2))*min(1,max(0,({d}-t-0.6)/1.0))'[ttl]"
        )
        last = "ttl"
    if b["id"] == "outro":
        graph += (
            f";[{last}]drawbox=x=0:y=ih*0.69:w=iw:h=ih*0.22:color=black@0.45:t=fill:enable='gte(t,1.6)'"
            f",drawtext=fontfile={FONT}:text='Salvation is of the LORD.':fontsize=84:fontcolor=white:borderw=5:bordercolor=0x2A1440:"
            f"x=(w-text_w)/2:y=h*0.72:alpha='min(1,max(0,(t-2.0)/1.2))'"
            f",drawtext=fontfile={FONT}:text='Jonah 2\\:9 (KJV)':fontsize=44:fontcolor=0xFFD86B:borderw=4:bordercolor=0x2A1440:x=(w-text_w)/2:y=h*0.72+100:"
            f"alpha='min(1,max(0,(t-2.6)/1.2))'[ttl]"
        )
        last = "ttl"
    if b["id"] == "credits":
        graph += f";[{last}]boxblur=12:2,eq=brightness=-0.32:saturation=0.7[dim]"
        last = "dim"
        roll = CREDITS
        gap = 74
        speed = (H + gap * len(roll)) / max(d - 1.0, 1.0)
        for i, (txt, big) in enumerate(roll):
            if not txt:
                continue
            esc = txt.replace("\\", "").replace(":", "\\:").replace("'", "\u2019")
            graph += (
                f";[{last}]drawtext=fontfile={FONT}:text='{esc}':fontsize={64 if big else 40}:"
                f"fontcolor={'0xFFD86B' if big else 'white'}:borderw=3:bordercolor=0x2A1440:"
                f"x=(w-text_w)/2:y=h+{i * gap}-t*{speed:.3f}[c{i}]"
            )
            last = f"c{i}"
    graph += f";[{last}]format=yuv420p,vignette=angle=PI/5,format=yuv420p[v]"
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            *inputs,
            "-filter_complex",
            graph,
            "-map",
            "[v]",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "20" if draft else "14",
            "-pix_fmt",
            "yuv420p",
            out,
        ]
    )


XS = 0.45  # dissolve between shots inside one scene


def clip_shot(sh, dur, clipdir, out, draft):
    """One shot cut from an animated clip: the source window, slowed by motion
    interpolation (<clip>.slow.mp4 is the clip at half speed, 30 fps) to fill the
    shot, with an optional slow camera push inside the frame."""
    t0, t1 = sh["src"]
    a, b = 2 * t0, 2 * t1
    f = dur / max(b - a, 0.1)
    n = round(dur * FPS)
    g = (
        f"[0:v]trim=start={a}:end={b},setpts=(PTS-STARTPTS)*{f:.5f},fps={FPS},"
        f"tpad=stop_mode=clone:stop_duration=1,trim=duration={dur},setpts=PTS-STARTPTS,"
    )
    if sh.get("crop"):
        z0, z1, cx, cy = sh["crop"]
        p = f"(0.5-0.5*cos(PI*on/{max(n - 1, 1)}))"
        z = f"({z0}+({z1}-{z0})*{p})"
        g += (
            f"scale=2560:1440:flags=lanczos,zoompan=z='{z}':d=1:s={W}x{H}:fps={FPS}"
            f":x='max(0,min(iw-iw/zoom,{cx}*iw-iw/zoom/2))':y='max(0,min(ih-ih/zoom,{cy}*ih-ih/zoom/2))',"
        )
    else:
        g += f"scale={W}:{H}:flags=lanczos,"
    g += "unsharp=5:5:0.5,eq=saturation=1.04,format=yuv420p,vignette=angle=PI/6,format=yuv420p[v]"
    src = os.path.join(clipdir, f"{sh['clip']}.slow.mp4")
    run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", g]
        + ["-map", "[v]", "-r", str(FPS), "-c:v", "libx264", "-preset", "ultrafast"]
        + ["-crf", "20" if draft else "14", "-pix_fmt", "yuv420p", out]
    )


def xfade_join(parts, durs, out, xs, trans="dissolve"):
    if len(parts) == 1:
        shutil.copyfile(parts[0], out)
        return
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    for s in parts:
        args += ["-i", s]
    g, last, off = [], "0:v", 0.0
    for k in range(1, len(parts)):
        off += durs[k - 1] - xs
        g.append(
            f"[{last}][{k}:v]xfade=transition={trans}:duration={xs}:offset={off:.3f}[x{k}]"
        )
        last = f"x{k}"
    args += ["-filter_complex", ";".join(g), "-map", f"[{last}]"]
    args += ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "14"]
    args += ["-pix_fmt", "yuv420p", out]
    run(args)


def shot_beat(b, shots, clipdir, out, draft):
    """A scene built from several shots (animated clips first, approved stills
    between), the shot lengths scaled to the narration-timed scene length."""
    k = len(shots)
    total_w = sum(s["w"] for s in shots)
    room = b["dur"] + XS * (k - 1)
    durs = [round(room * s["w"] / total_w, 3) for s in shots]
    parts = []
    for i, (sh, d) in enumerate(zip(shots, durs, strict=True)):
        p = f"{out}.s{i}.mp4"
        if "clip" in sh:
            clip_shot(sh, d, clipdir, p, draft)
        else:
            still = {
                "id": f"{b['id']}-s{i}",
                "scene": sh["still"],
                "ambience": sh.get("ambience", b["ambience"]),
                "dur": d,
                "cam": sh.get("cam"),
            }
            beat_video(still, p, draft)
        parts.append(p)
    xfade_join(parts, durs, out, XS)


def chain(segs, beats, out):
    if len(segs) == 1:  # one scene: nothing to cross-fade
        shutil.copyfile(segs[0], out)
        return
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    for s in segs:
        args += ["-i", s]
    g, last = [], "0:v"
    for k in range(1, len(segs)):
        off = beats[k]["start"]
        trans = "fade" if k in (1, len(segs) - 1) else "dissolve"
        g.append(
            f"[{last}][{k}:v]xfade=transition={trans}:duration={XF}:offset={off}[x{k}]"
        )
        last = f"x{k}"
    args += [
        "-filter_complex",
        ";".join(g),
        "-map",
        f"[{last}]",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        out,
    ]
    run(args)


def resample(a, sr_from):
    if sr_from == SR:
        return a
    n = int(len(a) * SR / sr_from)
    return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(
        np.float32
    )


def mix(beats, total, narr, out_wav):
    n = int(total * SR) + SR
    voice = np.zeros(n, np.float32)
    for b in beats:
        for l in b["lines"]:
            if not l.get("file"):
                continue
            a, sr = sf.read(os.path.join(narr, l["file"]), dtype="float32")
            if a.ndim > 1:
                a = a.mean(axis=1)
            a = resample(a, sr)
            if l.get("who") in CHILD:
                a = child(a, l["who"])
            i = int(l["at"] * SR) + int(b["start"] * SR)
            voice[i : i + len(a)] += a[: max(0, n - i)]
    # level the voice: speech RMS to about -19 dBFS whatever the voice model's own level
    speech = voice[np.abs(voice) > 0.01]
    if speech.size:
        rms = float(np.sqrt(np.mean(speech**2)))
        voice *= (10 ** (-19 / 20)) / max(rms, 1e-6)
    amb = np.zeros(n, np.float32)
    for b in beats:
        a = sound.ambience(
            b["ambience"],
            b["dur"],
            thunder_times(b["dur"]) if b["ambience"].startswith("storm") else (),
        ).astype(np.float32)
        i = int(b["start"] * SR)
        amb[i : i + len(a)] += a[: max(0, n - i)]
    # the score: one original orchestral cue per scene (score.py), laid at the scene's start;
    # scenes overlap by the crossfade, so each cue's fade-out meets the next one's fade-in
    mus = np.zeros(n, np.float32)
    import tempfile

    import score

    for b in beats:
        with tempfile.TemporaryDirectory() as d:
            w = os.path.join(d, "cue.wav")
            score.render(b.get("music") or b["ambience"], b["dur"], w)
            a, sr = sf.read(w, dtype="float32")
        a = resample(a.mean(axis=1) if a.ndim > 1 else a, sr)
        i = int(b["start"] * SR)
        mus[i : i + len(a)] += a[: max(0, n - i)]
    mus /= max(
        1e-6, float(np.sqrt(np.mean(mus[np.abs(mus) > 0.001] ** 2))) / 0.12
    )  # music bed near -18 dBFS before ducking
    # moments: sound effects placed on the story's own beats (sound.py, all synthesized)
    for b in beats:
        for fx, at in sound.moments(b):
            i = int((b["start"] + at) * SR)
            amb[i : i + len(fx)] += fx[: max(0, n - i)]
    # duck the music and ambience under the voice (smoothed envelope)
    env = np.abs(voice)
    k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    talk = np.clip(env / (env.max() or 1) * 8, 0, 1)
    duck = (
        1 - 0.72 * talk
    )  # the voice always leads: the music drops about 11 dB under speech
    m = voice * 1.0 + mus * 0.55 * duck + amb * 0.16 * (1 - 0.35 * talk)
    m = m / max(1.0, np.max(np.abs(m)) / 0.95)
    sf.write(out_wav, np.stack([m, m], axis=1), SR)


def chunks(text, maxc=84):
    parts = re.split(r"(?<=[,;:.!?])\s+", text.strip())
    out, cur = [], ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > maxc:
            out.append(cur)
            cur = p
        else:
            cur = f"{cur} {p}".strip()
    if cur:
        out.append(cur)
    return out


def ts(s):
    h, r = divmod(max(0, s), 3600)
    m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{r:06.3f}"


def vtt(beats, out):
    lines = ["WEBVTT", ""]
    k = 1
    for b in beats:
        for l in b["lines"]:
            cs = chunks(l["text"])
            total_chars = sum(len(c) for c in cs) or 1
            t = b["start"] + l["at"]
            for c in cs:
                dt = l["seconds"] * len(c) / total_chars
                lines += [str(k), f"{ts(t)} --> {ts(t + dt)}", c, ""]
                k += 1
                t += dt
    with open(out, "w") as fh:
        fh.write("\n".join(lines))


def main():
    ep_path, narr, outd = sys.argv[1], sys.argv[2], sys.argv[3]
    draft = "--draft" in sys.argv
    with open(ep_path) as fh:
        ep = json.load(fh)
    tim = load_timings(ep, narr)
    CHILD.update(ep.get("childVoice", {}))
    only = next(
        (a.split("=", 1)[1].split(",") for a in sys.argv if a.startswith("--beats=")),
        None,
    )
    if only:
        ep = {**ep, "beats": [b for b in ep["beats"] if b["id"] in only]}
    beats, total = plan(ep, tim)
    os.makedirs(outd, exist_ok=True)
    work = os.path.join(outd, ".work")
    os.makedirs(work, exist_ok=True)
    arg = {a.split("=", 1)[0]: a.split("=", 1)[1] for a in sys.argv if "=" in a}
    shots = {}
    if "--shots" in arg:
        with open(arg["--shots"]) as fh:
            shots = json.load(fh)["beats"]
    segs = []
    for b in beats:
        s = os.path.join(work, f"{b['id']}.mp4")
        if not ("--reuse" in sys.argv and os.path.exists(s)):
            if b["id"] in shots:
                shot_beat(b, shots[b["id"]], arg["--clips"], s, draft)
            else:
                beat_video(b, s, draft)
        segs.append(s)
        print(f"beat {b['id']:6s} {b['dur']:6.2f}s  scene={b['scene']}", flush=True)
    vid = os.path.join(work, "video.mp4")
    chain(segs, beats, vid)
    wav = os.path.join(work, "mix.wav")
    mix(beats, total, None if narr == "--placeholder" else narr, wav)
    cap = os.path.join(outd, f"{ep['id']}.en.vtt")
    vtt(beats, cap)
    mp4 = os.path.join(outd, f"{ep['id']}.mp4")
    # broadcast loudness for online video: -16 LUFS integrated, true peak -1.5 dB
    lw = os.path.join(work, "mix-loud.wav")
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            wav,
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar",
            str(SR),
            lw,
        ]
    )
    wav = lw
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            vid,
            "-i",
            wav,
            "-i",
            cap,
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-map",
            "2:s",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-c:s",
            "mov_text",
            "-metadata:s:s:0",
            "language=eng",
            "-t",
            f"{total:.3f}",  # not -shortest: the caption track ends before the credits
            "-movflags",
            "+faststart",
            mp4,
        ]
    )
    poster = os.path.join(outd, f"{ep['id']}-poster.jpg")
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-ss",
            f"{beats[min(4, len(beats) - 1)]['start'] + beats[min(4, len(beats) - 1)]['dur'] / 2}",
            "-i",
            vid,
            "-frames:v",
            "1",
            "-q:v",
            "3",
            poster,
        ]
    )
    with open(os.path.join(outd, f"{ep['id']}.cut.json"), "w") as fh:
        json.dump(
            {
                "voice": tim.get("voice"),
                "total": round(total, 2),
                "beats": [
                    {
                        "id": b["id"],
                        "scene": b["scene"],
                        "start": b["start"],
                        "dur": b["dur"],
                        "lines": len(b["lines"]),
                    }
                    for b in beats
                ],
            },
            fh,
            indent=1,
        )
    print(f"done {mp4} total {total:.1f}s ({total / 60:.1f} min)")


if __name__ == "__main__":
    main()
