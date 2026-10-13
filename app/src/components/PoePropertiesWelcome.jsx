// =============================================================================
// THE POE PROPERTIES FRONT PAGE (2026-10-13, from Darrell's mock-up)
// =============================================================================
// Darrell, 2026-10-13, with the picture: "redesign the front welcome page of my
// existing Poe Properties property management application to look as close as
// possible to the attached image... This is a visual redesign only."
//
// So this file is PRESENTATION ONLY. It owns the look of the door's welcome
// page -- the logo lock-up, the welcome heading, the six portal cards, the
// signed-out notice, the footer band -- and nothing else. Who the six portals
// are, which one needs no account, where each one goes: that is still
// WHO_OPTIONS in modules/properties/model.js, read by PropertiesDoor.jsx, and
// nothing here changes a route, a permission or a session.
//
// WHY A SCOPED STYLESHEET AND NOT INLINE HEX. The door honors the platform's
// five themes (data-theme on its root, lib/theme-css.js), and the legibility
// guard refuses an inline dark text color that would vanish on midnight. The
// palette below is a set of custom properties on `.pp-door`, remapped once for
// midnight, so every red, black and gold here follows the person's theme and
// the guard has nothing un-themeable to find.
//
// WHY THE HEADLINE FONT IS SELF-HOSTED. The site's CSP allows fonts from
// 'self' only (app/public/_headers), so a Google Fonts <link> would be blocked
// at the browser. Playfair Display (SIL OFL, license beside the files) ships
// as two latin woff2 files under /properties/fonts/, loaded by this page only.
//
// THE PHOTOGRAPH is the entryway from Darrell's own mock-up ("This is the
// front page photo"), cropped to the clean region below the mock-up's
// notification card. Swap /properties/welcome-entry.jpg for a full-size photo
// at any time; nothing else needs to change.
//
// Text size (UX-PATTERNS 2b): everything a person reads here is in rem and
// grows with the platform control; the card grid is auto-fit, so at Big Print
// it falls to two columns, then one, instead of overflowing. The header
// lock-up stays inside the door's existing .ts-chrome-region cap.
import React from 'react';

/** The hero photograph, under the door's own scope (app/public/properties/). */
export const WELCOME_PHOTO_SRC = '/properties/welcome-entry.jpg';

/**
 * The words on the six cards, exactly as Darrell wrote them for the front
 * page. Keyed by WHO_OPTIONS id; the model's own label/blurb is the fallback
 * so a portal added to the model is never silently left off the page.
 */
export const CARD_COPY = Object.freeze({
  applicant: Object.freeze({ title: 'Looking for a Place', blurb: 'View available properties and apply.' }),
  tenant: Object.freeze({ title: 'I Live Here', blurb: 'Your unit, work orders, messages, and payment history.' }),
  household: Object.freeze({ title: 'I Live Here with My Family', blurb: 'The same door as the person on the lease.' }),
  field_worker: Object.freeze({ title: 'I Do the Work (1099)', blurb: 'Your jobs, property history, and two-step documentation.' }),
  manager: Object.freeze({ title: 'I Manage Properties', blurb: 'The work board, dispatch, rent, and the whole record.' }),
  landlord: Object.freeze({ title: 'I Own Properties', blurb: 'Run your doors here, or bring your own portfolio.' }),
});

/** The exact footer wording Darrell asked for; never a different slogan. */
export const FOOTER_WORDING = 'POE PROPERTIES · POWERED BY POETECH';

/** Display copy for one portal: Darrell's words first, the model's as fallback. */
export function cardCopy(option) {
  const c = CARD_COPY[option?.id] || {};
  return { title: c.title || option?.label || '', blurb: c.blurb || option?.blurb || '' };
}

// Red disc + red icon on the first, third and fifth card; gray disc + black
// icon on the rest -- the alternation in the mock-up.
const RED_DISC = new Set(['applicant', 'household', 'manager']);

// The focus ring every styled button on the platform carries (UX-PATTERNS
// 2g.1); the color is the brand red, readable on midnight's black as well.
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#C8102E]';

export const WELCOME_CSS = `
@font-face{font-family:"Playfair Display";font-style:normal;font-weight:700;font-display:swap;src:url(/properties/fonts/playfair-display-700-latin.woff2) format("woff2")}
@font-face{font-family:"Playfair Display";font-style:normal;font-weight:800;font-display:swap;src:url(/properties/fonts/playfair-display-800-latin.woff2) format("woff2")}
.pp-door{
  --pp-paper:#F4F4F6;--pp-card:#FFFFFF;--pp-line:#E4E4E9;--pp-ink:#111111;--pp-muted:#55555C;
  --pp-red:#C8102E;--pp-red-deep:#A30D25;--pp-red-tint:#FBE7EA;--pp-gray-disc:#EEEFF2;
  --pp-gold:#C9A24D;--pp-black:#111111;--pp-footer-ink:#FFFFFF;--pp-shadow:0 1px 2px rgba(17,17,17,.04),0 8px 24px rgba(17,17,17,.06);
  --pp-serif:"Playfair Display","Fraunces",Georgia,"Times New Roman",serif;
  --pp-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  background-color:var(--pp-paper);color:var(--pp-ink);font-family:var(--pp-sans);
}
[data-theme="midnight"].pp-door{
  --pp-paper:#000000;--pp-card:#141414;--pp-line:#2A2A2A;--pp-ink:#E5E5E5;--pp-muted:#A3A3A3;
  --pp-red:#F0506A;--pp-red-deep:#F97A8E;--pp-red-tint:#3A1218;--pp-gray-disc:#232323;--pp-black:#1F1F1F;
  --pp-shadow:0 1px 2px rgba(0,0,0,.6),0 8px 24px rgba(0,0,0,.5);
}
.pp-serif{font-family:var(--pp-serif)}
.pp-red{color:var(--pp-red)}
.pp-header{background-color:var(--pp-card);border-bottom:1px solid var(--pp-line);box-shadow:0 1px 0 rgba(17,17,17,.03)}
.pp-lockup{display:flex;align-items:center;gap:.6rem;min-width:0}
.pp-mark{width:2.6rem;height:auto;flex:none}
.pp-wordmark{font-family:var(--pp-serif);font-weight:800;letter-spacing:-.02em;line-height:1;color:var(--pp-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pp-strap{display:flex;align-items:center;gap:.45rem;margin-top:.3rem;font-size:.5625rem;letter-spacing:.32em;text-transform:uppercase;color:var(--pp-muted);white-space:nowrap}
.pp-strap::before,.pp-strap::after{content:"";height:1px;width:1.1rem;background:var(--pp-gold);flex:none}
.pp-welcome{max-width:76rem;margin:0 auto;padding:1.25rem 0 2rem}
.pp-hero{display:grid;grid-template-columns:1fr;gap:1.25rem;align-items:center}
@media (min-width:64rem){.pp-hero{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:2.5rem}}
.pp-hero-copy{min-width:0}
.pp-hero-side{display:flex;flex-direction:column;gap:1rem;min-width:0}
.pp-h{font-family:var(--pp-serif);font-weight:800;letter-spacing:-.025em;line-height:1.02;color:var(--pp-ink);font-size:clamp(2.25rem,6vw,4rem);margin:0}
.pp-rule{width:5.5rem;height:3px;background:var(--pp-gold);margin:1rem 0 1rem;border-radius:2px}
.pp-lead{font-size:clamp(1rem,1.3vw,1.2rem);line-height:1.55;color:var(--pp-muted);max-width:34em;margin:0}
.pp-lead+.pp-lead{margin-top:.25rem}
.pp-photo{position:relative;border-radius:1.125rem;overflow:hidden;box-shadow:var(--pp-shadow);aspect-ratio:16/9;background:var(--pp-gray-disc)}
@media (min-width:64rem){.pp-photo{aspect-ratio:530/298}}
.pp-photo img{display:block;width:100%;height:100%;object-fit:cover}
.pp-photo::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,0) 28%)}
[data-theme="midnight"] .pp-photo::after{background:linear-gradient(105deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 28%)}
.pp-photo-band{position:absolute;top:0;right:0;width:46%;height:.5rem;background:linear-gradient(90deg,var(--pp-red) 0 55%,var(--pp-black) 55% 78%,var(--pp-gold) 78%);pointer-events:none}
.pp-notice{display:flex;gap:.9rem;align-items:flex-start;background:var(--pp-card);border:1px solid var(--pp-line);border-radius:1rem;padding:1rem 1.1rem;box-shadow:var(--pp-shadow)}
.pp-notice-disc{flex:none;width:3.25rem;height:3.25rem;border-radius:999px;background:var(--pp-red);color:#FFFFFF;display:flex;align-items:center;justify-content:center}
.pp-notice-disc svg{width:1.6rem;height:1.6rem}
.pp-notice-title{font-family:var(--pp-serif);font-weight:700;font-size:1.0625rem;line-height:1.25;color:var(--pp-ink);margin:0}
.pp-notice-body{font-size:.9375rem;line-height:1.45;color:var(--pp-muted);margin:.3rem 0 0}
.pp-notice-cta{display:inline-flex;align-items:center;gap:.35rem;margin-top:.7rem;padding:0 .25rem;font-weight:700;font-size:.8125rem;letter-spacing:.1em;text-transform:uppercase;text-decoration:underline;text-underline-offset:.25em;color:var(--pp-red);background:none;border:0;cursor:pointer;border-radius:.4rem}
.pp-notice-cta svg{width:1rem;height:1rem}
.pp-notice-cta:hover{color:var(--pp-red-deep)}
.pp-eyebrow{display:flex;align-items:center;gap:.6rem;margin:1.75rem 0 .9rem;font-size:.6875rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--pp-muted)}
.pp-eyebrow::after{content:"";height:1px;flex:1;background:var(--pp-line)}
.pp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr));gap:1rem;list-style:none;margin:0;padding:0}
.pp-card{display:flex;align-items:center;gap:1rem;width:100%;height:100%;text-align:left;background:var(--pp-card);border:1px solid var(--pp-line);border-radius:1rem;padding:1.1rem 1.1rem 1.1rem 1.25rem;box-shadow:var(--pp-shadow);color:var(--pp-ink);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.pp-card:hover{border-color:var(--pp-red);box-shadow:0 2px 4px rgba(17,17,17,.05),0 14px 32px rgba(17,17,17,.1);transform:translateY(-2px)}
@media (prefers-reduced-motion:reduce){.pp-card,.pp-card:hover{transition:none;transform:none}}
.pp-disc{flex:none;width:4.25rem;height:4.25rem;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--pp-gray-disc);color:var(--pp-ink)}
.pp-disc svg{width:2rem;height:2rem}
.pp-disc.is-red{background:var(--pp-red-tint);color:var(--pp-red)}
.pp-card-text{flex:1;min-width:0}
.pp-card-title{display:block;font-family:var(--pp-serif);font-weight:700;font-size:1.25rem;line-height:1.15;letter-spacing:-.01em;color:var(--pp-ink);margin:0}
.pp-card-blurb{display:block;font-size:.9375rem;line-height:1.4;color:var(--pp-muted);margin:.35rem 0 0}
.pp-pill{display:inline-block;margin-top:.5rem;font-size:.625rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--pp-red);border:1px solid currentColor;border-radius:999px;padding:.2rem .55rem}
.pp-card-go{flex:none;display:flex;align-items:center;gap:1rem;align-self:stretch}
.pp-card-go::before{content:"";width:1px;align-self:stretch;background:var(--pp-line)}
.pp-arrow{width:2.75rem;height:2.75rem;border-radius:999px;background:var(--pp-red);color:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(200,16,46,.28)}
.pp-arrow svg{width:1.25rem;height:1.25rem}
.pp-card:hover .pp-arrow{background:var(--pp-red-deep)}
.pp-footer{background:var(--pp-black);color:var(--pp-footer-ink);border-top:2px solid var(--pp-gold);padding:1.6rem 1rem calc(1.6rem + env(safe-area-inset-bottom,0px));text-align:center}
.pp-footer-line{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.5rem 1rem;max-width:40rem;margin:0 auto;font-size:.75rem;font-weight:600;letter-spacing:.3em;text-transform:uppercase;line-height:1.5}
.pp-footer-line>span{white-space:nowrap}
.pp-footer-line::before,.pp-footer-line::after{content:"";height:1px;flex:1;max-width:6rem;background:var(--pp-gold)}
/* Phones and tablets: the platform's floating controls (text-size escape
   hatch, read aloud) rest at the bottom-right corner, so the wording sits
   ABOVE them and the gold rules give way to the words. */
@media (max-width:56rem){
  .pp-footer{padding-bottom:calc(5.25rem + env(safe-area-inset-bottom,0px))}
  .pp-footer-line{font-size:.6875rem;letter-spacing:.22em;gap:.35rem .75rem}
  .pp-footer-line::before,.pp-footer-line::after{display:none}
}
.pp-footer-gold{color:var(--pp-gold)}
`;

/**
 * The roof-and-house mark from the mock-up: a black left slope, a red right
 * slope with a black cap, and a gold four-pane window under the ridge.
 * Decorative; the wordmark beside it carries the name.
 */
export function PoePropertiesMark({ className = 'pp-mark' } = {}) {
  return (
    <svg className={className} viewBox="0 0 120 64" aria-hidden="true" focusable="false">
      <polygon points="2,58 56,6 64,14 16,58" fill="var(--pp-black)" />
      <polygon points="56,6 112,48 104,58 56,22" fill="var(--pp-red)" />
      <polygon points="96,30 112,48 104,58 96,46" fill="var(--pp-black)" />
      <g fill="var(--pp-gold)">
        <rect x="50" y="34" width="7" height="7" rx="1" />
        <rect x="59" y="34" width="7" height="7" rx="1" />
        <rect x="50" y="43" width="7" height="7" rx="1" />
        <rect x="59" y="43" width="7" height="7" rx="1" />
      </g>
    </svg>
  );
}

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ICONS = {
  applicant: (
    <g {...STROKE}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </g>
  ),
  tenant: (
    <g {...STROKE}>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.2 11.2 20 20" />
      <path d="M16 16l2.2-2.2M18.4 18.4l2-2" />
    </g>
  ),
  household: (
    <g {...STROKE}>
      <circle cx="12" cy="7" r="2.6" />
      <circle cx="5.5" cy="9.5" r="2" />
      <circle cx="18.5" cy="9.5" r="2" />
      <path d="M7.5 19v-2.2a4.5 4.5 0 0 1 9 0V19" />
      <path d="M2.5 18v-1.5a3 3 0 0 1 3.6-2.9M21.5 18v-1.5a3 3 0 0 0-3.6-2.9" />
    </g>
  ),
  field_worker: (
    <g {...STROKE}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2" />
      <path d="M3 12.5h18M12 11v3" />
    </g>
  ),
  manager: (
    <g {...STROKE}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
    </g>
  ),
  landlord: (
    <g {...STROKE}>
      <path d="M3 12 12 4l9 8" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M10 20v-4.5a2 2 0 0 1 4 0V20" />
    </g>
  ),
};

/** The line icon for a portal; a plain house when the id is unknown. */
export function PortalIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[id] || ICONS.applicant}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="4" fill="currentColor" />
      <path d="M4 20.5a8 8 0 0 1 16 0z" fill="currentColor" />
    </svg>
  );
}

/**
 * "You're signed out on this device." The person LEFT this door; their
 * PoeTech sign-in is untouched. Rendered only when `left` is true, so a
 * signed-in person never sees it.
 */
export function SignedOutNotice({ onReturn }) {
  return (
    <div className="pp-notice" role="status" data-testid="properties-signed-out-notice">
      <div className="pp-notice-disc"><PersonIcon /></div>
      <div>
        <p className="pp-notice-title">You&rsquo;re signed out on this device.</p>
        <p className="pp-notice-body">
          Your PoeTech sign-in is still active &mdash; this door only forgot you.
        </p>
        <button type="button" className={`pp-notice-cta min-h-[44px] ${FOCUS}`} onClick={() => onReturn?.()}>
          <span>Come back in</span>
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

/** The welcome heading, its two lines, and the photograph beside them. */
export function WelcomeHero({ left = false, onReturn } = {}) {
  return (
    <section className="pp-hero" aria-labelledby="pp-welcome-heading">
      <div className="pp-hero-copy">
        <h2 id="pp-welcome-heading" className="pp-h">
          Welcome to{' '}<br />
          <span className="pp-red">Poe</span> Properties
        </h2>
        <div className="pp-rule" aria-hidden="true" />
        <p className="pp-lead">Manage your home, payments, and requests all in one place.</p>
        <p className="pp-lead">Please select the option that best describes you.</p>
      </div>
      <div className="pp-hero-side">
        {left && <SignedOutNotice onReturn={onReturn} />}
        <div className="pp-photo">
          <img
            src={WELCOME_PHOTO_SRC}
            width="530"
            height="298"
            alt="The lit front entry of a Poe Properties home at dusk"
            decoding="async"
          />
          <span className="pp-photo-band" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/**
 * The six portal cards. `options` is WHO_OPTIONS from the model (the same six
 * the door always offered); `onPick(id)` is the door's own handler, unchanged.
 */
export function PortalCards({ options = [], onPick }) {
  return (
    <>
      <p className="pp-eyebrow">Who are you?</p>
      <ul className="pp-cards" data-testid="properties-portal-cards">
        {options.map((w) => {
          const { title, blurb } = cardCopy(w);
          return (
            <li key={w.id}>
              <button type="button" className={`pp-card min-h-[44px] ${FOCUS}`} onClick={() => onPick?.(w.id)} data-portal={w.id}>
                <span className={`pp-disc${RED_DISC.has(w.id) ? ' is-red' : ''}`}><PortalIcon id={w.id} /></span>
                <span className="pp-card-text">
                  <span className="pp-card-title">{title}</span>
                  <span className="pp-card-blurb">{blurb}</span>
                  {!w.needsAccount && <span className="pp-pill">No account needed</span>}
                </span>
                <span className="pp-card-go" aria-hidden="true"><span className="pp-arrow"><ArrowIcon /></span></span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** The black footer band with the one wording it must always carry. */
export function DoorFooter() {
  return (
    <footer className="pp-footer" data-testid="properties-door-footer">
      <p className="pp-footer-line">
        <span>Poe Properties</span>
        <span className="pp-footer-gold" aria-hidden="true">&middot;</span>
        <span>Powered by PoeTech</span>
      </p>
    </footer>
  );
}
