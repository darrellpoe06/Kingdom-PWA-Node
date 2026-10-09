#!/usr/bin/env python3
# =============================================================================
# nas-openers — the ONLY code that touches an opener relay
# =============================================================================
# Darrell 2026-10-08: "Let's add the garage door opener and any system opener to
# the header in PoeTech App... so if your listening to you lesson as you drive
# when you get home the garage door opener button is there for easy access."
#
# The app presses /openers/press on poetech.us. Cloudflare forwards it to the
# Tailscale Funnel; Caddy on the NAS routes /openers to this service. The cloud
# never learns a device address, a GPIO pin, an MQTT topic or a vendor URL:
# those live in devices.json NEXT TO THIS FILE, on the NAS, and nowhere else.
#
# SOVEREIGN PYTHON, not an n8n webhook (DR-0132). Plain FastAPI + Caddy, the
# shape every new pipeline here uses.
#
# THE BRAKES, AND WHY EACH ONE (this class is a physical actuator on a family's
# house, so it is Tier C by definition):
#   * BUDGET: MAX_PRESSES_PER_HOUR per opener. A loop that finds this endpoint
#     cannot cycle a garage door all night.
#   * LOCK: single-flight per opener. A second press while one is in the air is
#     REFUSED, not queued, because a door that gets two presses stops halfway.
#   * ARMED BY RECORD: an opener absent from devices.json, or present with
#     "enabled": false, is refused with a reason. The file is the arming, and
#     it ships without one, so installing this service opens nothing.
# It also NEVER reports a door as moved unless the device itself said so.
import json
import os
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEVICES = Path(os.environ.get("OPENERS_DEVICES", HERE / "devices.json"))
MAX_PRESSES_PER_HOUR = int(os.environ.get("OPENERS_MAX_PER_HOUR", "12"))
PULSE_SECONDS = float(os.environ.get("OPENERS_PULSE_SECONDS", "0.5"))

_lock = threading.Lock()
_in_flight: set[str] = set()
_history: dict[str, list[float]] = {}


def load_devices() -> dict:
    """The device map, read fresh each press so an edit needs no restart.
    A missing or unreadable file means NOTHING is armed, which is the safe
    direction: it refuses rather than guessing."""
    try:
        with DEVICES.open("r", encoding="utf-8") as fh:
            raw = json.load(fh)
    except Exception:
        return {}
    if not isinstance(raw, dict):
        return {}
    out = {}
    for key, cfg in raw.items():
        if isinstance(cfg, dict) and cfg.get("enabled") is True:
            out[str(key)] = cfg
    return out


def within_budget(opener_id: str, now: float) -> bool:
    hour_ago = now - 3600.0
    seen = [t for t in _history.get(opener_id, []) if t >= hour_ago]
    _history[opener_id] = seen
    return len(seen) < MAX_PRESSES_PER_HOUR


def press_device(cfg: dict) -> tuple[bool, bool, str]:
    """Drive the device. Returns (pressed, confirmed, reason).

    `confirmed` is True ONLY when the device itself reported that it moved.
    Every adapter below returns confirmed=False unless it has a real reading,
    because the app turns confirmed into "the door reported that it moved" and
    that sentence has to be earned."""
    kind = str(cfg.get("kind") or "")
    if kind == "relay-http":
        import urllib.request
        url = cfg.get("url")
        if not url:
            return (False, False, "This opener has no relay address on the NAS.")
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                ok = 200 <= r.status < 300
            return (ok, False, "" if ok else "The relay answered with an error.")
        except Exception as exc:
            return (False, False, f"The relay did not answer on the house network ({exc.__class__.__name__}).")
    if kind == "relay-gpio":
        pin = cfg.get("pin")
        if pin is None:
            return (False, False, "This opener has no GPIO pin set on the NAS.")
        try:
            import RPi.GPIO as GPIO  # noqa: N814  (only present where a relay is wired)
        except Exception:
            return (False, False, "No GPIO on this machine, so the wired relay cannot be driven from here.")
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(int(pin), GPIO.OUT)
        GPIO.output(int(pin), GPIO.HIGH)
        time.sleep(PULSE_SECONDS)
        GPIO.output(int(pin), GPIO.LOW)
        return (True, False, "")
    if kind == "mqtt":
        topic, payload, broker = cfg.get("topic"), cfg.get("payload", "PRESS"), cfg.get("broker")
        if not (topic and broker):
            return (False, False, "This opener has no MQTT broker or topic set on the NAS.")
        try:
            import paho.mqtt.publish as publish
        except Exception:
            return (False, False, "The MQTT client is not installed on the NAS yet.")
        try:
            publish.single(topic, payload, hostname=broker)
            return (True, False, "")
        except Exception as exc:
            return (False, False, f"The broker did not accept the press ({exc.__class__.__name__}).")
    if kind == "webhook":
        import urllib.request
        url = cfg.get("url")
        if not url:
            return (False, False, "This opener has no webhook URL on the NAS.")
        try:
            req = urllib.request.Request(url, method=cfg.get("method", "POST"))
            with urllib.request.urlopen(req, timeout=8) as r:
                ok = 200 <= r.status < 300
            return (ok, False, "" if ok else "The vendor answered with an error.")
        except Exception as exc:
            return (False, False, f"The vendor did not answer ({exc.__class__.__name__}).")
    return (False, False, f"This NAS has no adapter for a {kind or 'nameless'} opener.")


def handle_press(opener_id: str) -> dict:
    devices = load_devices()
    cfg = devices.get(opener_id)
    if not cfg:
        # ARMED BY RECORD. No entry, no press, and the reason says so plainly
        # rather than pretending something was attempted.
        return {"ok": False, "pressed": False, "reason": "This opener is not armed on the NAS, so nothing was pressed."}
    now = time.time()
    with _lock:
        if opener_id in _in_flight:
            return {"ok": False, "pressed": False, "reason": "A press is already on its way to this opener."}
        if not within_budget(opener_id, now):
            return {"ok": False, "pressed": False, "reason": f"This opener has had {MAX_PRESSES_PER_HOUR} presses in the last hour, which is its limit."}
        _in_flight.add(opener_id)
        _history.setdefault(opener_id, []).append(now)
    try:
        pressed, confirmed, reason = press_device(cfg)
    finally:
        with _lock:
            _in_flight.discard(opener_id)
    if not pressed:
        return {"ok": False, "pressed": False, "reason": reason or "The press did not go through."}
    return {"ok": True, "pressed": True, "confirmed": bool(confirmed)}


try:
    from fastapi import FastAPI
    from pydantic import BaseModel

    app = FastAPI(title="nas-openers")

    class Press(BaseModel):
        opener: str
        kind: str | None = None
        at: str | None = None

    @app.get("/openers/health")
    def health() -> dict:
        armed = sorted(load_devices().keys())
        # Honest: it reports how many are ARMED, and says nothing about whether
        # any door is open, because this service cannot see a door.
        return {"ok": True, "armed": len(armed), "openers": armed, "max_per_hour": MAX_PRESSES_PER_HOUR}

    @app.post("/openers/press")
    def press(body: Press) -> dict:
        return handle_press(str(body.opener or ""))
except Exception:  # pragma: no cover - FastAPI absent on a dev box
    app = None
