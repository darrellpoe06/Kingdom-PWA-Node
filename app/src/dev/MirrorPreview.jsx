// MirrorPreview — Phase 1 Session 1 demo
//
// Standalone preview of the <Mirror> + <Scripture> primitives, rendered when
// the URL has ?dev=mirror-preview. Production behavior (the full Financial
// OS) is unchanged.
//
// The demo uses real Debts-tab numbers and Proverbs 22:7 in four translations,
// verified against biblehub.com (ESV, KJV, NIV 2011, AMP). Strong's data is
// taken from the same source: H3867 lavah (borrower), H5650 ebed (slave).
//
// Session 2 replaces this preview by wiring <Mirror> into the actual Debts
// tab of app/src/poe-financial-mvp-v28.jsx.

import React from 'react';
import Mirror from '../components/Mirror.jsx';
import Scripture from '../components/Scripture.jsx';

const PROV_22_7 = {
  reference: 'Proverbs 22:7',
  primary: {
    translation: 'ESV',
    text:
      'The rich rules over the poor, and the borrower is the slave of the lender.',
  },
  alternates: [
    {
      translation: 'KJV',
      text:
        'The rich ruleth over the poor, and the borrower is servant to the lender.',
    },
    {
      translation: 'NIV',
      text:
        'The rich rule over the poor, and the borrower is slave to the lender.',
    },
    {
      translation: 'AMP',
      text:
        'The rich rules over the poor, And the borrower is servant to the lender.',
    },
  ],
  wordStudy: {
    word: 'borrower',
    lemma: 'lavah',
    strongs: 'H3867',
    gloss: 'to twine, to unite, to remain — to borrow or lend',
    note:
      'The Hebrew root is relational, not transactional. To borrow is to bind oneself together with another, not just to receive funds. The verse names what that binding actually is.',
  },
};

export default function MirrorPreview() {
  return (
    <main
      className="min-h-screen bg-[#FAF8F4] text-[#1A1815] px-4 py-8 sm:px-6 sm:py-12"
      style={{ fontFamily: '"Fraunces", serif' }}
    >
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">
            Phase 1 · Session 1 · Component Preview
          </div>
          <h1
            className="text-3xl sm:text-4xl mb-2"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Behavioral Mirror · Debts (preview)
          </h1>
          <p className="text-sm text-[#5A5751] leading-relaxed">
            Standalone preview of the &lt;Mirror&gt; and &lt;Scripture&gt;
            primitives before they are wired into the live Debts tab. The
            sequence is fixed: DATA → TRUTH → IDENTITY → INVITATION. The
            IDENTITY block is visually anchored and never collapsible per
            <code className="text-[11px] bg-white px-1 mx-1 border border-[#E8E4DC]">
              docs/00-foundations/_root/BEHAVIORAL-MIRROR.md
            </code>
            .
          </p>
        </header>

        <Mirror>
          <Mirror.Data>
            <div className="space-y-2">
              <p>
                Total consumer debt:{' '}
                <strong
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  $340,259
                </strong>
                . Monthly service:{' '}
                <strong
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  $8,155
                </strong>
                . Weighted rate:{' '}
                <strong
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  8.1%
                </strong>
                .
              </p>
              <p className="text-sm text-[#5A5751]">
                At current pressure setting, debt-free in 8.1 years. The
                highest-rate consumer account is UIECU at 22.3% APR on a
                $13,102 balance — the avalanche-method first target.
              </p>
            </div>
          </Mirror.Data>

          <Mirror.Truth>
            <Scripture {...PROV_22_7} />
            <p className="mt-3">
              The math is a fact, not a verdict. Debt at this scale binds
              future hours of labor to past spending. The Hebrew{' '}
              <em>lavah</em> names the binding plainly: a borrower is not
              merely a payer of interest — the borrower is{' '}
              <em>twined together with</em> the lender. Scripture does not
              moralize about whether the borrowing was reasonable; it
              describes what borrowing is.
            </p>
          </Mirror.Truth>

          <Mirror.Identity>
            <p>
              You are not your balance sheet. You are a steward, bought with
              a price, a representative of the King —{' '}
              <em>
                we are ambassadors for Christ, God making His appeal through
                us
              </em>{' '}
              (2 Cor 5:20). The data informs what changes; it does not
              redefine who you are. A person of The Way receives correction{' '}
              <em>from</em> a settled identity, not <em>as</em> a referendum
              on identity.
            </p>
          </Mirror.Identity>

          <Mirror.Invitation>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Today:</strong> Attack UIECU first ($13,102 at
                22.3%). Highest weighted-cost dollar in the household.
              </li>
              <li>
                <strong>When UIECU clears:</strong> $300/mo of payment
                capacity frees up. Roll into the next-highest-rate account
                without lifestyle change.
              </li>
              <li>
                <strong>Strategy choice (Religion / Relationship):</strong>{' '}
                avalanche (mathematically optimal) vs. snowball (smallest
                first, momentum-driven) — both are faithful stewardship.
                Pick the one that holds for this family this season.
              </li>
            </ul>
          </Mirror.Invitation>
        </Mirror>

        <footer className="mt-10 pt-6 border-t border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">
            Verification
          </div>
          <ul className="text-xs text-[#5A5751] space-y-1 list-disc pl-5">
            <li>
              Scripture text for Prov 22:7 (ESV, KJV, NIV, AMP) verified at
              biblehub.com — no fabricated translations.
            </li>
            <li>
              Strong's H3867 (lavah) and H5650 (ebed) from biblehub.com Hebrew
              lexicon.
            </li>
            <li>
              IDENTITY frame is visually anchored (inverted) and rendered in
              fixed sequence position by &lt;Mirror&gt;, regardless of child
              order.
            </li>
            <li>
              Per-content audio uses the browser Web Speech API behind a
              swappable provider (UX-PATTERNS.md Pattern 2).
            </li>
          </ul>
        </footer>
      </div>
    </main>
  );
}
