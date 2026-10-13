# Lip-sync backends for avatar-studio. Each module exposes
#   ready() -> (bool, why)     can this backend serve right now?
#   render(audio_path, portrait_path, out_path) -> None   write an mp4
# and raises server.NotReady (or any exception) rather than faking a clip.
