// =============================================================================
// AppShareQR — a QR + copy-link card for handing out access to the PoeTech app
// =============================================================================
// The show-in-person half of the invite flow. Darrell (or any steward) pulls
// this up on a screen; a church member points their phone camera at it and
// lands on the platform-aware install page (?join=1) — no typing a long URL,
// which is the exact friction install-help.js was built to fight for the
// tech-novice COLG congregation (COMMUNITY-FIRST-MISSION).
//
// It encodes the CANONICAL public URL (poetech.us/poetech-app/?join=1) from
// app-share.js so the code is scannable from any phone regardless of where this
// admin surface is being viewed (preview, LAN/NAS, or production).
//
// This SHOWS a way in; it never grants access. Granting/adjusting/revoking is
// still a deliberate human steward action elsewhere (prohibited-actions rule,
// same posture as AccessUsageMetrics).
//
// Accessibility (WCAG 2.1 AA on white): #1A1815 body, #5A5751 secondary,
// #B85838 focus ring, >=44px copy target, aria-live on the copied confirmation,
// QR rendered on white with quiet-zone margin so cameras lock on reliably.
import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { appJoinUrl, appJoinUrlDisplay } from '../lib/app-share.js';

export default function AppShareQR({ size = 176, compact = false }) {
  const url = appJoinUrl();
  const shown = appJoinUrlDisplay();
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older/locked-down browsers.
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  }, [url]);

  return (
    <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
        Share the app
      </div>
      <p className="text-[0.8125rem] text-[#1A1815] mt-1 mb-3 leading-relaxed">
        Have someone point their phone camera at this code. It opens the install
        page for their exact device — no long address to type.
      </p>

      <div className={`flex ${compact ? 'flex-row items-center' : 'flex-col sm:flex-row sm:items-center'} gap-4`}>
        {/* Quiet-zone padding + white bg = reliable camera lock. */}
        <div className="shrink-0 bg-white p-3 border border-[#E8E4DC]" aria-hidden="false">
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            includeMargin={false}
            role="img"
            aria-label="QR code to install the PoeTech app"
          />
        </div>

        <div className="min-w-0">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Or share this link</div>
          <div className="font-mono text-[0.75rem] text-[#1A1815] break-all mt-0.5">{shown}</div>
          <button
            type="button"
            onClick={copy}
            className="mt-2 inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] transition-colors"
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <span className="sr-only" aria-live="polite">{copied ? 'Link copied to clipboard' : ''}</span>
        </div>
      </div>

      <p className="text-[0.625rem] text-[#5A5751] italic mt-3 leading-relaxed">
        Showing this code doesn't grant access — it only shares the way in.
        Granting, adjusting, or revoking access stays a deliberate steward action.
      </p>
    </div>
  );
}
