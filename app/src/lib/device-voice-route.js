// =============================================================================
// device-voice-route — WHICH settings screen changes the phone's reading voice
// =============================================================================
// Darrell, 2026-09-23, three screenshots of Samsung Settings searched for
// "voice" and finding TalkBack, Voice Access, Voice Recorder, Voice Typing and
// nothing that changes the reading voice: "How do we know which settings to
// change?!!!!" And before that: "Make those options inside the app that opens
// that space... for the user... deduce the device?!!!!!!" / "Intuitive!!!!!!!!"
//
// The app had been telling him to "choose a male voice in Settings → Text-to-
// speech" — a sentence that assumes the person knows Samsung files that screen
// under General management, calls it "Text-to-speech" (so searching "voice"
// finds nothing), and that a Pixel files it under Accessibility instead. That
// is a hunt handed to the person, which Drive-Don't-Delegate forbids for the
// product as much as for the agent.
//
// So this module DEDUCES the device and answers with:
//   * a DOOR — on Android in a browser, an intent link that opens the exact
//     Text-to-speech screen in one tap (com.android.settings.TTS_SETTINGS);
//   * the WORD to search for when the door is not available, because the
//     Samsung search for "voice" is proven empty by his screenshots;
//   * the STEPS, per maker, in the phone's own menu words.
//
// WHY THE PHONE'S SETTING DECIDES AT ALL. On Android, Chrome hands a web page
// one voice per LANGUAGE ("English United States (en_US)") — not one per
// voice. Which actual voice speaks for that language is the phone's own
// Text-to-speech setting (engine → language → voice). That is why the in-app
// list cannot change how it sounds, and why the phone screen is the real
// control. (voice-assignment.js describeDeviceVoices measures this.)
//
// Pure. No DOM; the caller passes the user agent and the shell flag.
// =============================================================================

/**
 * The Android intent that opens the system Text-to-speech screen directly.
 * Chrome for Android launches `intent:` links from a user tap. The native
 * shell's WebView does NOT (Capacitor hands an unknown scheme to ACTION_VIEW,
 * which has no handler for it) — so the route carries no door there and the
 * steps stand alone until the shell gains a settings plugin (DR-0570 queue).
 */
export const TTS_SETTINGS_INTENT = 'intent:#Intent;action=com.android.settings.TTS_SETTINGS;end';

/**
 * Deduce the device from the user agent string alone.
 * @returns {{ platform:'android'|'ios'|'desktop'|'other', maker:'samsung'|'other',
 *             os:'windows'|'mac'|'other' }}
 */
export function detectVoiceDevice(ua) {
  const s = String(ua || '');
  if (/iPad|iPhone|iPod/i.test(s)) return { platform: 'ios', maker: 'other', os: 'other' };
  if (/Android/i.test(s)) {
    // Samsung phones carry their model number (SM-F956U, SM-S928B, ...) in the
    // user agent; One UI files Text-to-speech under General management.
    return { platform: 'android', maker: /\bSM-[A-Z]\d{3}/i.test(s) || /Samsung/i.test(s) ? 'samsung' : 'other', os: 'other' };
  }
  if (/Windows/i.test(s)) return { platform: 'desktop', maker: 'other', os: 'windows' };
  if (/Macintosh/i.test(s)) return { platform: 'desktop', maker: 'other', os: 'mac' };
  if (/Linux|CrOS/i.test(s)) return { platform: 'desktop', maker: 'other', os: 'other' };
  return { platform: 'other', maker: 'other', os: 'other' };
}

/**
 * The route to the screen that changes the reading voice, for this device.
 *
 * @param {ReturnType<typeof detectVoiceDevice>} device
 * @param {{ nativeShell?: boolean }} [opts]
 * @returns {{ title:string, searchWord:string, steps:string[], href:string|null,
 *             hrefLabel:string, after:string }}
 */
export function deviceVoiceRoute(device, opts = {}) {
  const d = device || { platform: 'other', maker: 'other', os: 'other' };
  const nativeShell = !!(opts && opts.nativeShell);
  const after = 'Then come back here and keep “Phone’s default voice” selected — the app reads in whatever voice the phone now uses.';

  if (d.platform === 'android') {
    const samsung = d.maker === 'samsung';
    return {
      title: samsung ? 'On this Samsung, the reading voice is set in the phone, not in this list' : 'On this Android phone, the reading voice is set in the phone, not in this list',
      // His screenshots: searching Settings for "voice" finds TalkBack, Voice
      // Access, Voice Recorder and Voice Typing — and not this screen. The
      // screen is named Text-to-speech, so that is the word to search.
      searchWord: 'Text-to-speech',
      steps: samsung
        ? [
          'Open Settings and search for “Text-to-speech” (searching “voice” does not find it).',
          'Or go by hand: Settings → General management → Text-to-speech.',
          'Tap the gear beside the Preferred engine, then Language (or Voice), and pick the voice you want — play each one to hear it.',
        ]
        : [
          'Open Settings and search for “Text-to-speech”.',
          'Or go by hand: Settings → Accessibility → Text-to-speech output (older phones: Settings → System → Languages & input → Text-to-speech output).',
          'Tap the gear beside the Preferred engine, then Language (or Voice), and pick the voice you want — play each one to hear it.',
        ],
      // The door: one tap from a browser. None from inside the local app yet.
      href: nativeShell ? null : TTS_SETTINGS_INTENT,
      hrefLabel: 'Open the phone’s Text-to-speech settings',
      after,
    };
  }
  if (d.platform === 'ios') {
    return {
      title: 'On iPhone and iPad, the voices carry names — pick one in the list above, or add more in Settings',
      searchWord: 'Spoken Content',
      steps: [
        'Settings → Accessibility → Spoken Content → Voices.',
        'Choose English, then a voice; tap the play button beside each to hear it before you pick.',
      ],
      href: null,
      hrefLabel: '',
      after: 'Then come back here — the new voice appears in the list above by name.',
    };
  }
  if (d.platform === 'desktop' && d.os === 'windows') {
    return {
      title: 'On Windows, the voices carry names — pick one in the list above, or add more in Settings',
      searchWord: 'Speech',
      steps: ['Settings → Time & Language → Speech → Voices, and add or choose a voice.'],
      href: null,
      hrefLabel: '',
      after: 'Then come back here — the new voice appears in the list above by name.',
    };
  }
  if (d.platform === 'desktop' && d.os === 'mac') {
    return {
      title: 'On a Mac, the voices carry names — pick one in the list above, or add more in System Settings',
      searchWord: 'Spoken Content',
      steps: ['System Settings → Accessibility → Spoken Content → System voice, and choose or download a voice.'],
      href: null,
      hrefLabel: '',
      after: 'Then come back here — the new voice appears in the list above by name.',
    };
  }
  return {
    title: 'The reading voice is set by this device',
    searchWord: 'Text-to-speech',
    steps: ['Open this device’s Settings and search for “Text-to-speech” or “Spoken Content”; choose a voice there.'],
    href: null,
    hrefLabel: '',
    after,
  };
}
