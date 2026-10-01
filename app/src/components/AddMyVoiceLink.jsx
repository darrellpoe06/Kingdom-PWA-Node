// =============================================================================
// AddMyVoiceLink — the way to "Add my voice" from where a class is recorded
// (the lesson recorder) and read back (Your lessons) (DR-0720)
// =============================================================================
// One line and one button; the button opens AddMyVoice (its home is My
// profile) in the quiet Modal, so a person can add their voice right where
// they see S1, S2 in a transcript.
// =============================================================================
import React, { useState } from 'react';
import Modal from './Modal.jsx';
import AddMyVoice from './AddMyVoice.jsx';

export default function AddMyVoiceLink({ line = 'Recorded in a class? Add your voice so your name shows beside your words.' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="add-my-voice-link">
      <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{line}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        Add my voice
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label="Add my voice" maxWidthClass="max-w-md">
        <div className="p-4 bg-white text-[#1A1815]">
          {open && <AddMyVoice />}
        </div>
      </Modal>
    </div>
  );
}
