// =============================================================================
// tlc-agreements — TLC's two signed agreements, as data, inside the app
// =============================================================================
// Darrell, 2026-09-10, on seeing "Drive" links on the Team section: "I want
// this built into the App!" / "why would you use Google?! fix it build the
// whole process workflows!" The Independent Contractor Agreement and the
// Confidentiality Agreement (NDA) are TLC's own documents (Christina Poe,
// LCSW; effective 9/15/2025). Their text is carried here verbatim so a
// colleague reads and signs them INSIDE the intake, and the Team section shows
// them in place. No link leaves the app. Pure data; no PHI.
export const TLC_CONTRACTOR_AGREEMENT = Object.freeze({
  key: 'contractorAgreement',
  title: 'TLC Therapy Solutions — Independent Contractor Agreement',
  effective: '2025-09-15',
  preamble: 'This Independent Contractor Agreement (“Agreement”) is made and entered into as of 9/15/25, by and between TLC Therapy Solutions, with a principal place of business at 805 N Prospect Ave. Suite A, Champaign, IL 61820 (“Company”), and [Contractor Name], an independent contractor (“Contractor”).',
  sections: [
    { n: 1, title: 'Engagement and Services', text: 'Company hereby engages Contractor, and Contractor agrees to provide professional therapy services including but not limited to:', items: ['Individual therapy sessions (in-person, telehealth, or phone-based)', 'Group therapy sessions', 'Completing client documentation, progress notes, and billing', 'Participating in team meetings as reasonably requested'], after: 'Contractor shall perform services in accordance with professional standards and applicable laws, including HIPAA compliance.' },
    { n: 2, title: 'Independent Contractor Status', text: 'Contractor is engaged as an independent contractor, not an employee. Contractor shall:', items: ['Control the means and methods of performing services', 'Be responsible for all taxes, insurance, and benefits', 'Not be entitled to Company benefits, including health insurance, retirement, or paid leave'] },
    { n: 3, title: 'Compensation', text: 'Company shall pay Contractor between 40 - 60%, payable [weekly/bi-weekly/monthly]. Contractor shall submit invoices with detailed service records.' },
    { n: 4, title: 'Schedule', text: 'Contractor may set their own schedule in consultation with Company to ensure client coverage.' },
    { n: 5, title: 'Term and Termination', items: ['Term: This Agreement is effective as of the date above and shall continue until terminated by either party.', 'Minimum Commitment: Contractor agrees to provide services for a minimum of one (1) year from the start date to ensure continuity of care for clients. Early termination may be allowed with written approval from TLC Therapy Solutions.', 'Termination: Either party may terminate with written notice, or immediately for cause, including breach of professional ethics, HIPAA violations, or criminal activity.'] },
    { n: 6, title: 'Confidentiality and HIPAA Compliance', text: 'Contractor agrees to:', items: ['Maintain the confidentiality of all client information', 'Comply with HIPAA and other applicable privacy laws', 'Not disclose any Company trade secrets, client lists, or proprietary information'], after: 'This obligation continues after termination of this Agreement.' },
    { n: 7, title: 'Non-Compete and Client Protection', text: 'Contractor acknowledges that TLC Therapy Solutions invests significant time and resources in building relationships with clients. Accordingly, Contractor agrees that, for a period of two (2) years following termination of this Agreement, Contractor will not provide therapy services to any clients who received services from TLC Therapy Solutions during the term of this Agreement, whether directly or indirectly, without prior written consent from TLC Therapy Solutions.', after: 'This restriction applies regardless of the geographic location of the Contractor or the client. Contractor further agrees that this clause is necessary to protect the stability, continuity of care, and well-being of clients.' },
    { n: 8, title: 'Non-Solicitation', text: 'Contractor agrees that, during the term of this Agreement and for two (2) year following termination, they will not:', items: ['Solicit or attempt to solicit any Company clients for therapy services outside the Company', 'Recruit or attempt to recruit any employees or contractors of the Company'] },
    { n: 9, title: 'Insurance and Licenses', text: 'Contractor shall maintain all professional licenses and provide malpractice insurance as required by law. However TLC Therapy Solutions will provide malpractice insurance for the Contractor.' },
    { n: 10, title: 'Governing Law', text: 'This Agreement shall be governed by and construed under the laws of the State of Illinois.' },
    { n: 11, title: 'Entire Agreement', text: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements, whether written or oral. Amendments must be in writing and signed by both parties.' },
  ],
});

export const TLC_CONFIDENTIALITY_AGREEMENT = Object.freeze({
  key: 'confidentiality',
  title: 'TLC Therapy Solutions — Confidentiality Agreement (NDA)',
  effective: '2025-09-15',
  preamble: 'This Confidentiality Agreement (“Agreement”) is entered into as of 9/15/2025, by and between TLC Therapy Solutions, with a principal place of business at 805 N Prospect Ave. Suite A, Champaign, IL 61820 (“Company”), and [Recipient/Contractor Name] (“Recipient”).',
  sections: [
    { n: 1, title: 'Purpose', text: 'Recipient agrees to receive and maintain confidential information to perform services for TLC Therapy Solutions. The purpose of this Agreement is to protect the Company’s confidential information and ensure the privacy and safety of clients.' },
    { n: 2, title: 'Definition of Confidential Information', text: '“Confidential Information” includes, but is not limited to:', items: ['Client information, records, and personal data', 'Treatment plans, progress notes, and billing information', 'Company policies, procedures, and business strategies', 'Any proprietary, technical, or financial information of the Company'], after: 'Confidential Information does not include information that: is publicly known through no fault of the Recipient; was independently developed by the Recipient without reference to Company information; was lawfully received from a third party.' },
    { n: 3, title: 'Obligations of Recipient', text: 'Recipient agrees to:', items: ['Keep all Confidential Information strictly confidential', 'Use Confidential Information solely to perform duties for TLC Therapy Solutions', 'Not disclose, share, or publish any Confidential Information without prior written consent from the Company', 'Comply with all applicable privacy laws, including HIPAA, in handling client information', 'Return or destroy all Confidential Information upon request or termination of services'] },
    { n: 4, title: 'Duration', text: 'This Agreement shall remain in effect during the term of Recipient’s engagement with the Company and shall survive termination of such engagement for 2 years.' },
    { n: 5, title: 'Exceptions', text: 'Recipient may disclose Confidential Information only when required by law, regulation, or court order, provided that Recipient gives Company prompt written notice of such requirement so that Company may seek protective measures.' },
    { n: 6, title: 'Remedies', text: 'Recipient acknowledges that unauthorized disclosure or misuse of Confidential Information may cause irreparable harm to Company and its clients. Company may seek injunctive relief, in addition to other remedies available under law, to enforce this Agreement.' },
    { n: 7, title: 'Governing Law', text: 'This Agreement shall be governed by and construed under the laws of the State of Illinois.' },
    { n: 8, title: 'Entire Agreement', text: 'This Agreement constitutes the entire agreement regarding confidentiality and supersedes all prior agreements, whether written or oral. Amendments must be in writing and signed by both parties.' },
  ],
});

export const TLC_AGREEMENTS = Object.freeze({ contractorAgreement: TLC_CONTRACTOR_AGREEMENT, confidentiality: TLC_CONFIDENTIALITY_AGREEMENT });
export function agreementByKey(key) { return TLC_AGREEMENTS[key] || null; }
