// =============================================================================
// tlc-ui — the TLC Therapy Solutions design system, as class strings (DR-1152)
// =============================================================================
// Darrell, 2026-10-21, with the reference on screen: "a consistent, premium
// appearance... warm ivory and cream backgrounds, deep forest green for primary
// buttons and navigation, soft sage accents... rounded cards, soft shadows,
// elegant typography, generous spacing" — on EVERY TLC screen, client, staff
// and office alike, "as though every page was designed by the same team".
//
// ONE VOCABULARY, EVERY TLC SURFACE. Four files carried their own copy of the
// same INPUT and BTN strings (hiring, onboarding, the packet, the team
// resources), and the door, the practice workspace and the Learn space each
// drew their cards by hand. They now draw from here, so the shape is one
// decision made once. The COLORS are deliberately the house literals the
// themes remap (#1A1815 ink, #B85838 accent, #E8E4DC line, #5A5751 muted) —
// the TLC theme (theme-css.js, `tlc`) turns them ivory, forest and sage, and
// every other palette the reader may pick (Midnight at night, Big Print)
// keeps working, because nothing here introduces a literal the guards do not
// already measure. Pure strings: no React, no I/O.
// =============================================================================

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** A quiet card: paper, hairline, rounded, roomy. The default surface. */
export const TLC_CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5';
/** A card with a stronger edge — a form, a report, a panel that holds controls. */
export const TLC_CARD_STRONG = 'bg-white border border-[#1A1815] rounded-2xl p-4 sm:p-5';
/** A tinted band — the welcome strip, a note that sits on the field. */
export const TLC_BAND = 'bg-[#E8E4DC] rounded-3xl p-5 sm:p-6';

/** The primary action: a forest pill (ink here; the theme paints it forest). */
export const TLC_BTN_PRIMARY = `inline-flex items-center justify-center gap-1.5 min-h-[2.75rem] px-5 py-2.5 rounded-full bg-[#1A1815] text-white text-sm font-semibold hover:bg-[#B85838] transition-colors disabled:opacity-50 ${FOCUS}`;
/** The secondary action: an outlined pill that fills on hover. */
export const TLC_BTN_SECONDARY = `inline-flex items-center justify-center gap-1.5 min-h-[2.75rem] px-5 py-2.5 rounded-full border border-[#1A1815] text-[#1A1815] text-sm font-semibold hover:bg-[#1A1815] hover:text-white transition-colors disabled:opacity-50 ${FOCUS}`;
/** The compact form button the office screens use (same shape, smaller). */
export const TLC_BTN = `inline-flex items-center justify-center gap-1 min-h-[2.5rem] px-3.5 py-2 rounded-full border border-[#1A1815] text-[#1A1815] text-sm font-semibold hover:bg-[#1A1815] hover:text-white transition-colors disabled:opacity-50 ${FOCUS}`;
/** A small inline pill (Copy, a tag action). */
export const TLC_BTN_SMALL = `inline-flex items-center justify-center min-h-[2.25rem] px-3 rounded-full border border-[#1A1815] text-xs font-semibold whitespace-nowrap hover:bg-[#1A1815] hover:text-white transition-colors ${FOCUS}`;
/** A text field: rounded, roomy, the theme paints its surface and line. */
export const TLC_INPUT = `w-full min-h-[2.75rem] px-3.5 py-2.5 rounded-xl border border-[#1A1815] text-sm bg-white ${FOCUS}`;

/** The small uppercase label above a heading. */
export const TLC_EYEBROW = 'text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1';
/** The display heading (Fraunces is set inline by the caller; this is the measure). */
export const TLC_H2 = 'text-2xl mb-4 text-[#1A1815]';
/** A chip: a role, a status, a specialty. */
export const TLC_CHIP = 'inline-flex items-center rounded-full bg-[#E8E4DC] px-2.5 py-1 text-[0.625rem] uppercase tracking-wider text-[#5A5751]';
/** A round icon well — the mark beside a card title. */
export const TLC_ICON_WELL = 'inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E8E4DC] text-[#1A1815] shrink-0';
/** A circular portrait (a clinician, a member). */
export const TLC_PORTRAIT = 'rounded-full object-cover bg-[#E8E4DC] shrink-0';
