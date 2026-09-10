// =============================================================================
// tlc-handbook — the TLC Independent Contractor Handbook, as data (DR-0344)
// =============================================================================
// Darrell, 2026-09-10: "comb our drive for documentation of systems we need or
// should add here inside the TLC Therapy Solutions App." The Drive document
// "TLC Therapy Solutions – Independent Contractor Handbook" (Policies &
// Procedures Handbook for 1099 Therapists / Independent Contractors, owned by
// tlctherapysolutions@gmail.com, 2025-09) is the office's own policy record.
// Every colleague signs an acknowledgment of it in the intake packet; here it
// is readable inside the app, offline, section for section, in TLC's own
// words — the source of truth stays the Drive document (linked), this is its
// in-app copy. Pure data; no PHI, no client information.
export const TLC_HANDBOOK = Object.freeze({
  title: 'TLC Therapy Solutions – Independent Contractor Handbook',
  subtitle: 'Policies & Procedures Handbook (For 1099 Therapists / Independent Contractors)',
  sourceUrl: 'https://docs.google.com/document/d/1V2UHQUAws0nLYfMW1VeBsCCI-GBq3BcjI-zLDXeWJk4/edit',
  welcome: 'Welcome to TLC Therapy Solutions. We are thrilled to have you join our network of compassionate and professional therapists. Our mission is to create a supportive environment where therapists and clients can thrive, providing flexible, high-quality, and client-centered care.',
  mission: 'To provide private, convenient, and faith-informed therapy that empowers individuals and families to heal, thrive, and live with greater peace, balance, and confidence.',
  vision: 'To be a leading therapy practice that transforms lives by combining clinical excellence with compassion, cultural awareness, and innovative approaches, creating healthier individuals, families, and communities.',
  services: [
    'Individual therapy',
    'Couples and family therapy',
    'Online and phone-based therapy sessions',
    'Group therapy and support groups',
    'Clinical supervision for pre-licensed therapists',
    'Psychoeducation, self-care resources, and wellness programs',
  ],
  contractorStatus: 'All therapists working with TLC Therapy Solutions are independent contractors. You are responsible for maintaining your licensure, ethical practice, and client care. TLC Therapy Solutions provides administrative support and resources but contractors are not employees and manage their own schedules and caseloads.',
  sections: [
    { id: 'standards', title: '2. Professional Standards', items: [
      { label: 'Licensing Requirements', text: 'Therapists must maintain an active license in their state and provide proof to TLC Therapy Solutions. Licenses must be renewed before expiration. Failure to maintain a license may result in suspension from the practice.' },
      { label: 'Continuing Education Expectations', text: 'Therapists are expected to complete all CEUs required by their licensing board and submit proof annually. TLC Therapy Solutions may provide resources or recommendations for continuing education.' },
      { label: 'Ethical Standards', text: 'Therapists must adhere to the NASW, APA, or applicable licensing board codes of ethics. Examples of boundary violations include social media connections with clients, accepting gifts, or dual relationships that impair professional judgment.' },
      { label: 'Dress Code / Professional Presentation', text: 'Therapists must maintain a professional appearance at all times, including during telehealth sessions. This includes appropriate clothing, grooming, and a neutral background for virtual sessions.' },
    ] },
    { id: 'clinical', title: '3. Client Care & Clinical Policies', items: [
      { label: 'Confidentiality & HIPAA Compliance', text: 'All client information must remain confidential. Use approved platforms for electronic communication. Do not discuss clients in public areas or post identifying information online.' },
      { label: 'Mandated Reporting', text: 'Therapists must report suspected child abuse, elder abuse, or situations triggering a duty to warn. Contact the appropriate state hotline immediately and notify the TLC administrative team.' },
      { label: 'Client Intake & Informed Consent', text: 'Therapists must follow proper intake procedures, including completing consent forms, reviewing telehealth policies, and explaining confidentiality and limits to clients.' },
      { label: 'Documentation Requirements', text: 'Progress notes must be completed within 24 hours of a session. Treatment plans and discharge summaries must follow TLC documentation templates. All documentation must be securely stored.' },
      { label: 'Session Structure', text: 'Sessions must start and end on time and follow the scheduled length unless clinically necessary to adjust. Notify administration of any deviations.' },
      { label: 'Emergency & Crisis Protocol', text: 'Therapists must follow procedures for suicide risk, self-harm, domestic violence, or other crises, including contacting emergency services and notifying TLC administration.' },
    ] },
    { id: 'scheduling', title: '4. Scheduling & Attendance', items: [
      { label: 'Use of Approved Scheduling Platform', text: 'All sessions must be scheduled through approved platforms (e.g., SimplePractice, Glide).' },
      { label: 'No-Show & Late Cancellation Policy', text: 'Therapists must adhere to TLC’s no-show and late cancellation policies, including documentation and reporting procedures.' },
      { label: 'Therapist Responsibility', text: 'Notify administration promptly of any schedule changes, vacations, or illness.' },
      { label: 'Coverage Plan', text: 'Therapists are responsible for arranging coverage if unavailable, including notifying clients and TLC administration.' },
    ] },
    { id: 'billing', title: '5. Billing & Payment', items: [
      { label: 'Documentation Submission Deadlines', text: 'Submit all notes and billing information promptly to ensure timely reimbursement.' },
      { label: 'Payment Schedule', text: 'Payments are issued according to the agreed schedule (bi-weekly or monthly).' },
      { label: 'Payment Method', text: 'Payments will be made via direct deposit or check.' },
      { label: 'Late Documentation Fees', text: 'Fees may be applied for late or incomplete documentation that impacts billing.' },
      { label: 'Self-Employment Taxes', text: 'Contractors are responsible for all self-employment taxes and maintaining accurate financial records.' },
    ] },
    { id: 'communication', title: '6. Communication & Technology', items: [
      { label: 'Secure Messaging', text: 'Use only approved secure platforms for all client communication.' },
      { label: 'Telehealth Platform & Standards', text: 'Conduct sessions using TLC-approved telehealth platforms. Ensure privacy, appropriate lighting, and professional background.' },
      { label: 'Email, Phone, and Response Expectations', text: 'Respond to client or administrative messages within 24 hours unless otherwise noted.' },
      { label: 'Social Media & Branding Guidelines', text: 'Maintain professional conduct online. Only use official branding materials and avoid sharing client information.' },
    ] },
    { id: 'compliance', title: '7. Compliance & Liability', items: [
      { label: 'Malpractice Insurance', text: 'Therapists must maintain active malpractice insurance with minimum coverage as specified by TLC. Provide proof annually.' },
      { label: 'Reporting Changes', text: 'Notify TLC immediately of changes to licensure, legal status, or malpractice coverage.' },
      { label: 'Legal Compliance', text: 'Follow all state and federal laws regarding therapy practice.' },
      { label: 'Non-Compete / Conflict of Interest', text: 'Avoid conflicts of interest and adhere to TLC’s non-compete policies.' },
    ] },
    { id: 'termination', title: '8. Termination of Agreement', items: [
      { label: 'Conditions', text: 'Either party may terminate the agreement with proper cause. Examples include ethical violations, failure to maintain licensure, or non-compliance with TLC policies.' },
      { label: 'Notice', text: 'Provide at least 30 days’ notice for voluntary termination.' },
      { label: 'Client Transfers', text: 'Follow TLC procedures for transitioning clients, including sharing records and notifying clients appropriately.' },
    ] },
  ],
  acknowledgment: 'I acknowledge that I have received, read, and understand the Therapy Practice Policies of TLC Therapy Solutions. I agree to comply with these policies as a condition of my independent contractor relationship.',
});

// The office's other systems documents found in Drive on 2026-09-10 — what
// the app links today, and what it carries inside (DR-0344 §Drive sweep).
export const TLC_OFFICE_DOCUMENTS = Object.freeze([
  { id: 'handbook', title: 'Independent Contractor Handbook', kind: 'policy', url: TLC_HANDBOOK.sourceUrl, inApp: 'readable here, section for section' },
  { id: 'contractor-agreement', title: 'Independent Contractor Agreement', kind: 'agreement', url: 'https://docs.google.com/document/d/1EhwsODMEpUxnCRHmFScz4VIdTWorAcYTI-OZeL8PaM8/edit', inApp: 'signed in the intake packet' },
  { id: 'confidentiality', title: 'Confidentiality Agreement (NDA)', kind: 'agreement', url: 'https://docs.google.com/document/d/1kt2L5cd_SJVF_G8Ca3s8eLx3DxavJ_wUdT_q2oOzr8k/edit', inApp: 'signed in the intake packet' },
  { id: 'training-notes', title: 'Training Notes for Therapists-in-Training', kind: 'training', url: 'https://docs.google.com/document/d/1GmBgxJbwxmAkBjdDksnhSUWmJjNuIXMCVQcEHfI4xQ8/edit', inApp: 'six session-script courses in Training' },
  { id: 'intake-form', title: 'Therapist Onboarding | Hiring Form', kind: 'intake', url: 'https://docs.google.com/forms/d/1WROLqw2XTnjTAktf-FHat-L4uZxgPT9s0PMsaz9TmsE/edit', inApp: 'the Onboarding intake packet' },
  { id: 'launch', title: 'TLCTS LAUNCH (launch task tracker)', kind: 'operations', url: 'https://docs.google.com/spreadsheets/d/12A3XdwTI_zbslWl_R1CObvCrJk5uYvAzsPzYYefhWPY/edit', inApp: 'linked; the Assistant workspace holds the working schedule' },
  { id: 'finding-peace', title: 'Finding Peace: Biblical Wisdom for Life’s Stressors (manuscript)', kind: 'psychoeducation', url: 'https://docs.google.com/document/d/14Y685eWbSp_xXYjhvOu0mr2A_-n7LgcrFWQv3R5BeMM/edit', inApp: 'linked; a client-facing lesson track is the next capture' },
]);
