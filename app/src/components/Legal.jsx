// Legal Matters — Books → Legal sub-tab placeholder (r23).
// Full implementation per /docs/00-foundations/_root/LEGAL-PRIVACY-BOUNDARY.md
// requires PIN gate + Web Crypto at-rest encryption + privileged Y/N CRUD +
// export tool. Those are queued as tasks #94–#99. This file ships the visible
// commitment now — tier-gated, with the four-scope structure named so users
// see what's coming.
import React from 'react';

export function LegalPlaceholder({ tier = 'foundation', setView }) {
  const unlockedTiers = new Set(['family', 'premium', 'business', 'loved-ones']);
  const unlocked = unlockedTiers.has(tier);
  return (
    <section className="space-y-4">
      <div className="bg-white border-2 border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">🔒 Legal Matters · Confidential</div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Track legal work the right way</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Sits inside Books because most legal work has a financial dimension — fees, settlements, insurance, tax exposure. Cross-links to your properties, entities, transactions, and calendar so nothing is hand-tracked twice. Confidentiality is built in: separate PIN, at-rest encryption (AES-GCM 256), auto-lock, and mandatory <strong>privileged / not</strong> on every note so the export tool can mechanically strip privileged content before you share with non-counsel.
        </p>
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Not legal advice. Have your attorney review the deployed module before storing live matter information.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Personal / family</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>· Wills, trusts, estate plans</li>
            <li>· Powers of attorney (financial + healthcare)</li>
            <li>· Healthcare directives, beneficiary designations</li>
            <li>· Family law — custody, divorce, adoption, guardianship</li>
            <li>· Immigration matters</li>
          </ul>
        </div>
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Real estate</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>· Title issues — chain, encumbrances, easements, liens</li>
            <li>· Tenant disputes, evictions</li>
            <li>· Property-tax appeals</li>
            <li>· Code-enforcement actions, HOA disputes</li>
            <li>· Insurance and contractor disputes</li>
          </ul>
        </div>
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Business</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>· LLC compliance — formation, annual report, registered agent</li>
            <li>· Contracts — vendor, contractor, employment, NDA, lease</li>
            <li>· 1099 / W-2 disputes</li>
            <li>· IP — trademark, copyright, trade secrets, infringement</li>
            <li>· Commercial litigation, bankruptcy, M&amp;A</li>
          </ul>
        </div>
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Tax &amp; regulatory</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>· IRS notices (CP2000, CP14, audits)</li>
            <li>· State tax appeals</li>
            <li>· Professional licensing — MSW, contractor, real estate</li>
            <li>· HUD / fair-housing, OSHA / safety</li>
            <li>· Government contracting, regulator actions</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-[#5A6E3D] p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] mb-2 font-semibold">How Legal connects to the rest of the system</div>
        <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
          <li>· <strong>Properties</strong> — Real Estate row shows "🔒 Legal note exists" without leaking the matter title; click to open Legal tab (PIN-gated)</li>
          <li>· <strong>Entities</strong> — Each LLC's matters live under its umbrella; filter by entity</li>
          <li>· <strong>Transactions</strong> — Legal fees paid auto-link to the matter; YTD totals roll up in Books</li>
          <li>· <strong>Calendar</strong> — Court dates appear in Books → Calendar with the label "🔒 Legal matter" only; no title leakage</li>
          <li>· <strong>Practice inquiries</strong> — TLC compliance items can cross-reference (with caveats; TLC stays isolated from Voice Ops)</li>
          <li>· <strong>1099 contractors</strong> — Worker disputes link back to the contractor record</li>
          <li>· <strong>Action Queue</strong> — Excluded by default; user can opt-in to surface a non-privileged summary</li>
          <li>· <strong>Audit log</strong> — Every view, edit, export logged with timestamp + acting user (per IDENTITY-ROLES-AUDIT)</li>
        </ul>
      </div>

      {!unlocked && (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">Unlocks at Family ($89) and above</div>
          <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            The encryption layer is real engineering — PIN gate, Web Crypto AES-GCM, auto-lock, privileged-stripped export. Ships at Family tier so the work is paid for. Confidentiality is the feature, not an add-on.
          </p>
          <button type="button" onClick={() => setView('about')} className="text-xs uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">See pricing tiers →</button>
        </div>
      )}

      {unlocked && (
        <div className="bg-white border-2 border-dashed border-[#5A6E3D] p-5 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] mb-2 font-semibold">🔧 Coming next</div>
          <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            PIN setup → AES-GCM 256 at-rest encryption → matter CRUD across all four scopes → journal + documents with mandatory privileged Y/N → key dates auto-mirroring to Calendar with privileged labels → privileged-stripped export tool. Tracked as tasks #94–#99 in the build queue.
          </p>
        </div>
      )}
    </section>
  );
}

export default LegalPlaceholder;
