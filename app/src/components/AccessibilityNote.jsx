// =============================================================================
// AccessibilityNote — what the app holds itself to, said where people are (DR-0997)
// =============================================================================
// Darrell, 2026-10-13: "Explain this somewhere in the app so people know...
// WCAG is the W3C's accessibility standard, with AA being the legally-required
// level—this app targets 2.2 AA to stay ahead of upcoming ADA deadlines."
//
// The law and the levels are DR-0315's research (2026-08-29), not memory:
// ADA Title II (28 CFR Part 35) requires WCAG 2.1 AA, with compliance dates of
// April 26, 2027 and April 26, 2028 after the April 2026 interim rule; courts
// and settlements use 2.1/2.2 AA for businesses under Title III. The house
// minimums are DR-0315's too: 24 px is the 2.2 AA target size, 36 px the app's.
//
// It says "built to" and "checked", never "certified" or "fully compliant":
// the gates measure contrast, target size and labels on every change, and a
// gate is not an audit by a person (DR-0076: no claim past the evidence).
// A <details> disclosure: native keyboard and screen-reader support, closed by
// default so it costs nothing on the page until someone opens it.
// =============================================================================
import React from 'react';

export default function AccessibilityNote({ className = '' }) {
  return (
    <details className={`text-left text-[0.75rem] leading-snug text-[#5A5751] ${className}`} data-testid="accessibility-note">
      <summary className="cursor-pointer inline-block py-2 min-h-[36px] text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] underline underline-offset-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50]">
        Accessibility
      </summary>
      <div className="mt-2 space-y-2">
        <p>
          <strong className="text-[#1A1815]">WCAG</strong> (the Web Content Accessibility Guidelines) is the accessibility
          standard from the W3C, the body that sets the web&rsquo;s standards. Its <strong className="text-[#1A1815]">AA</strong> level
          is the one the law points to: the U.S. Justice Department&rsquo;s ADA rule requires WCAG 2.1 AA for government
          websites and apps by April 2027 and April 2028, and courts hold businesses to the same level.
        </p>
        <p>
          This app is built to the newer <strong className="text-[#1A1815]">WCAG 2.2 AA</strong>, to stay ahead of those
          deadlines: text that stands out from its background, buttons at least 36 pixels tall (the standard asks for 24),
          controls named for screen readers and reachable by keyboard, text you can make larger (A+), and any page read
          aloud to you (the speaker button).
        </p>
        <p>
          How we hold to it: checks for contrast, button size and labels run on every change before it reaches you. A check
          is not a person, so if anything is hard to see, hear or tap, tell us and we will fix it.
        </p>
      </div>
    </details>
  );
}
