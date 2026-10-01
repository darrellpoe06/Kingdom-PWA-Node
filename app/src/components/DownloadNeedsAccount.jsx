// =============================================================================
// DownloadNeedsAccount — where a download would be, for a signed-out reader
// =============================================================================
// Darrell 2026-09-30: "they can download it from the app however they would
// need an account no account needed for just reading it."
//
// A signed-out visitor who opened a shared lesson reads it and presses ▶ Play
// with no account (DR-0290). Taking the lesson's full text away (Copy lesson,
// Download .md, Copy markdown, Print) is the one thing that asks for a free
// account. This control stands where those were: it says so in one line and
// opens the same quiet sign-in / create-account dialog the rest of the app
// uses (AuthModal), over the page the reader is on, so they never lose their
// place. DR-0698.
// =============================================================================
import React, { useState } from 'react';
import AuthModal from './AuthModal.jsx';

export const DOWNLOAD_NEEDS_ACCOUNT = 'Downloading needs a free account. Reading and ▶ Play never do.';

export default function DownloadNeedsAccount({ label = 'Download', compact = false }) {
  const [open, setOpen] = useState(false);
  const button = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={DOWNLOAD_NEEDS_ACCOUNT}
      data-testid="download-needs-account"
      className="text-[0.625rem] uppercase tracking-wider px-2.5 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
    >
      {label}: sign in
    </button>
  );
  return (
    <>
      {compact ? button : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.75rem] text-[#1A1815] m-0" style={{ fontFamily: '"Fraunces", serif' }}>{DOWNLOAD_NEEDS_ACCOUNT}</p>
          {button}
        </div>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} onSignedIn={() => setOpen(false)} mode="signup" />
    </>
  );
}
