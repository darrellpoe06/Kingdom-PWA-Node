#!/usr/bin/env python3
"""Render a Bible Adventures episode: scenes in motion, narration, music, sound, captions.

  python3 render.py <episode.json> <narrationDir|--placeholder> <outDir> [--draft]

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
import json, os, re, subprocess, sys, shutil
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
KIDS = os.path.join(ROOT, "app", "public", "lovecorner", "kids")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sound  # noqa: E402

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
    "b10": (1.15, 1.35, 0.30, 0.22, 0.42, 0.40),
    "outro": (1.12, 1.00, 0.50, 0.50, 0.45, 0.48),
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f"ffmpeg failed: {' '.join(cmd[:6])} ...")


def load_timings(ep, narr):
    if narr == "--placeholder":
        lines = []
        for b in ep["beats"]:
            for i, l in enumerate(b["lines"]):
                n = len(l["text"].split())
                lines.append({"beat": b["id"], "line": i, "file": None, "seconds": round(n / (2.2 if l["kind"] == "kjv" else 2.5), 2), "kind": l["kind"], "ref": l.get("ref"), "text": l["text"]})
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
        dur = max(dur, 5.0)
        start = t
        cur = start + LEAD
        placed = []
        for x in ls:
            placed.append({**x, "at": round(cur, 3)})
            cur += x["seconds"] + GAP
        beats.append({**b, "start": round(start, 3), "dur": round(dur, 3), "lines": placed})
        t = start + dur - XF
    total = beats[-1]["start"] + beats[-1]["dur"]
    return beats, total


def thunder_times(dur, n=3):
    return [round(dur * f, 2) for f in (0.22, 0.55, 0.83)[:n]]


def beat_video(b, out, draft):
    scene = SCENES.get(b["scene"], f"{b['scene']}.jpg")
    src = os.path.join(KIDS, scene)
    z0, z1, x0, x1, y0, y1 = CAMERA.get(b["id"], (1.0, 1.12, 0.5, 0.5, 0.5, 0.5))
    d = b["dur"]
    n = int(round(d * FPS))
    up = 2880 if draft else 3840
    # zoompan works on the upscaled still; p = progress 0..1 with an ease-in-out
    p = f"(0.5-0.5*cos(PI*on/{max(n-1,1)}))"
    z = f"({z0}+({z1}-{z0})*{p})"
    x = f"max(0,min(iw-iw/zoom,({x0}+({x1}-{x0})*{p})*iw-iw/zoom/2))"
    y = f"max(0,min(ih-ih/zoom,({y0}+({y1}-{y0})*{p})*ih-ih/zoom/2))"
    base = f"[0:v]scale={up}:-2,setsar=1,zoompan=z='{z}':x='{x}':y='{y}':d={n}:s={W}x{H}:fps={FPS},format=yuv420p"
    amb = b["ambience"]
    fx = []
    inputs = ["-loop", "1", "-framerate", str(FPS), "-t", f"{d}", "-i", src]
    graph = base + "[bg]"
    last = "bg"
    if amb in ("storm", "storm-calm"):
        th = thunder_times(d)
        flash = "+".join(f"between(t,{a},{a+0.09})*0.42+between(t,{a+0.16},{a+0.22})*0.25" for a in th)
        graph += f";[{last}]eq=brightness='{flash}':saturation=0.85:eval=frame[lit]"
        last = "lit"
        # rain: sparse bright noise, streaked by a directional blur, screened on top
        op = "0.42" if amb == "storm" else f"'max(0.05,0.42-0.40*t/{d})'"
        graph += (f";color=black:s={W}x{H}:r={FPS}:d={d},noise=alls=100:allf=t+u,format=gray,"
                  f"lutyuv=y='if(gt(val,247),255,0)',dblur=angle=75:radius=28,eq=contrast=2.2:brightness=0.06,format=yuv420p[rain]"
                  f";[{last}][rain]blend=all_mode=screen:all_opacity={0.38 if amb == 'storm' else 0.22}[wet]")
        last = "wet"
    elif amb == "underwater":
        graph += (f";[{last}]eq=brightness='0.035*sin(2*PI*t/5)':eval=frame[pulse]"
                  f";color=black:s={W}x{H}:r={FPS}:d={d},noise=alls=100:allf=t+u,format=gray,lutyuv=y='if(gt(val,252),255,0)',"
                  f"gblur=sigma=2.2,eq=contrast=3:brightness=0.05,format=yuv420p[motes]"
                  f";[pulse][motes]blend=all_mode=screen:all_opacity=0.35[sea]")
        last = "sea"
    elif amb in ("morning", "theme"):
        graph += f";[{last}]split[a][b];[b]gblur=sigma=18,eq=brightness=0.04[glow];[a][glow]blend=all_mode=screen:all_opacity=0.22[bloom]"
        last = "bloom"
    elif amb == "evening":
        graph += f";[{last}]colorbalance=rs=0.06:bs=-0.06:rm=0.04,eq=saturation=0.9[eve]"
        last = "eve"
    elif amb in ("sea", "shore", "harbor"):
        graph += f";[{last}]eq=brightness='0.02*sin(2*PI*t/3.2)':eval=frame[shim]"
        last = "shim"
    # titles
    if b["id"] == "intro":
        graph += (f";[{last}]drawtext=fontfile={FONT}:text='Jonah and the Great Fish':fontsize=96:fontcolor=white:"
                  f"borderw=5:bordercolor=0x2A1440:x=(w-text_w)/2:y=h*0.70:alpha='min(1,max(0,(t-1.0)/1.2))*min(1,max(0,({d}-t-0.6)/1.0))'"
                  f",drawtext=fontfile={FONT}:text='The Love Corner Bible Adventures':fontsize=46:fontcolor=0xFFD86B:borderw=4:bordercolor=0x2A1440:"
                  f"x=(w-text_w)/2:y=h*0.70+110:alpha='min(1,max(0,(t-1.8)/1.2))*min(1,max(0,({d}-t-0.6)/1.0))'[ttl]")
        last = "ttl"
    if b["id"] == "outro":
        graph += (f";[{last}]drawtext=fontfile={FONT}:text='Salvation is of the LORD.':fontsize=84:fontcolor=white:borderw=5:bordercolor=0x2A1440:"
                  f"x=(w-text_w)/2:y=h*0.72:alpha='min(1,max(0,(t-2.0)/1.2))'"
                  f",drawtext=fontfile={FONT}:text='Jonah 2\\:9 (KJV)':fontsize=44:fontcolor=0xFFD86B:borderw=4:bordercolor=0x2A1440:x=(w-text_w)/2:y=h*0.72+100:"
                  f"alpha='min(1,max(0,(t-2.6)/1.2))'[ttl]")
        last = "ttl"
    graph += f";[{last}]vignette=angle=PI/5,noise=alls=3:allf=t,format=yuv420p[v]"
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-map", "[v]", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "veryfast" if draft else "medium", "-crf", "24" if draft else "18", "-pix_fmt", "yuv420p", out])


def chain(segs, beats, out):
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    for s in segs:
        args += ["-i", s]
    g, last = [], "0:v"
    for k in range(1, len(segs)):
        off = beats[k]["start"]
        trans = "fade" if k in (1, len(segs) - 1) else ("dissolve" if k % 2 else "smoothleft")
        g.append(f"[{last}][{k}:v]xfade=transition={trans}:duration={XF}:offset={off}[x{k}]")
        last = f"x{k}"
    args += ["-filter_complex", ";".join(g), "-map", f"[{last}]", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", out]
    run(args)


def resample(a, sr_from):
    if sr_from == SR:
        return a
    n = int(len(a) * SR / sr_from)
    return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)


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
            i = int(l["at"] * SR) + int(b["start"] * SR)
            voice[i:i + len(a)] += a[: max(0, n - i)]
    amb = np.zeros(n, np.float32)
    for b in beats:
        a = sound.ambience(b["ambience"], b["dur"], thunder_times(b["dur"]) if b["ambience"].startswith("storm") else ()).astype(np.float32)
        i = int(b["start"] * SR)
        amb[i:i + len(a)] += a[: max(0, n - i)]
    mus = sound.music(total + 1).astype(np.float32)[:n]
    mus = np.pad(mus, (0, n - len(mus)))
    # duck the music and ambience under the voice (smoothed envelope)
    env = np.abs(voice)
    k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    talk = np.clip(env / (env.max() or 1) * 8, 0, 1)
    duck = 1 - 0.6 * talk
    m = voice * 1.0 + mus * 0.18 * duck + amb * 0.16 * (1 - 0.35 * talk)
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
    open(out, "w").write("\n".join(lines))


def main():
    ep_path, narr, outd = sys.argv[1], sys.argv[2], sys.argv[3]
    draft = "--draft" in sys.argv
    ep = json.load(open(ep_path))
    tim = load_timings(ep, narr)
    beats, total = plan(ep, tim)
    os.makedirs(outd, exist_ok=True)
    work = os.path.join(outd, ".work")
    os.makedirs(work, exist_ok=True)
    segs = []
    for b in beats:
        s = os.path.join(work, f"{b['id']}.mp4")
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
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", vid, "-i", wav, "-i", cap, "-map", "0:v", "-map", "1:a", "-map", "2:s",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
         "-shortest", "-movflags", "+faststart", mp4])
    poster = os.path.join(outd, f"{ep['id']}-poster.jpg")
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{beats[4]['start'] + beats[4]['dur'] / 2}", "-i", vid, "-frames:v", "1", "-q:v", "3", poster])
    json.dump({"voice": tim.get("voice"), "total": round(total, 2),
               "beats": [{"id": b["id"], "scene": b["scene"], "start": b["start"], "dur": b["dur"], "lines": len(b["lines"])} for b in beats]},
              open(os.path.join(outd, f"{ep['id']}.cut.json"), "w"), indent=1)
    print(f"done {mp4} total {total:.1f}s ({total/60:.1f} min)")


if __name__ == "__main__":
    main()
