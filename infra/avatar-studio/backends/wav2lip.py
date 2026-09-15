# Wav2Lip backend -- the smallest honest lip-sync: a still portrait + audio ->
# a talking portrait. Needs a Wav2Lip checkout (WAV2LIP_DIR) and its checkpoint
# (WAV2LIP_CHECKPOINT); both are placed on the GPU box, never fetched by this
# process. Absent either, ready() says so and render() refuses -- the app then
# shows the still portrait with the real voice and says it is a stand-in.
import os
import subprocess


def _paths():
    d = os.environ.get("WAV2LIP_DIR", "").strip()
    c = os.environ.get("WAV2LIP_CHECKPOINT", "").strip()
    return d, c


def ready():
    d, c = _paths()
    if not d or not os.path.isfile(os.path.join(d, "inference.py")):
        return (False, "WAV2LIP_DIR is not a Wav2Lip checkout (inference.py missing)")
    if not c or not os.path.isfile(c):
        return (False, "WAV2LIP_CHECKPOINT missing")
    return (True, "")


def render(audio_path, portrait_path, out_path):
    ok, why = ready()
    if not ok:
        from server import NotReady  # local import: server owns the type
        raise NotReady(why)
    d, c = _paths()
    subprocess.run(
        ["python", os.path.join(d, "inference.py"), "--checkpoint_path", c,
         "--face", portrait_path, "--audio", audio_path, "--outfile", out_path],
        check=True, cwd=d, timeout=float(os.environ.get("AVATAR_RENDER_TIMEOUT", "1800")),
    )
