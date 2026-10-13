// =============================================================================
// configs/_template — copy this to stand up a NEW office
// =============================================================================
// This is an EXAMPLE config, not a real business — it exists to (1) document the
// shape and (2) prove the module is genuinely reusable (the tests instantiate it
// alongside TLC and confirm the two offices are fully isolated). To add a real
// office: copy this file to configs/<your-office>.js, fill in real values, give
// it a UNIQUE storageKey, and register a surface that mounts <OfficeAssistant
// config={YOUR_CONFIG} /> (see README.md).
//
// Only id, brand, storageKey, referralCategories, and geoCircles are required;
// everything else falls back to sensible defaults in config.js.
// =============================================================================
import { defineOfficeConfig } from '../config.js';

export const TEMPLATE_CONFIG = defineOfficeConfig({
  id: 'example',
  brand: 'Example Wellness Office',
  brandTagline: 'referral network (example)',
  serviceArea: 'Your City, Your State',
  // MUST be unique — never reuse another office's key.
  storageKey: 'poetech-office-example-v1',

  // "Who regularly interacts with the people this office serves?"
  referralCategories: [
    { id: 'medical', label: 'Medical', types: ['Primary care', 'Specialists'], searches: ['primary care <city>'] },
    { id: 'community', label: 'Community', types: ['Churches', 'Community centers'], searches: ['churches <city>'] },
    { id: 'business', label: 'Business', types: ['HR departments', 'EAPs'], searches: ['large employers <city>'] },
  ],
  // Build the network in circles — inner ring first, then outward.
  geoCircles: ['Your City', 'Nearby Town', 'Rest of Region'],

  // One research focus per weekday (0=Sun..6=Sat). Optional — omit for none.
  dailyRotation: { 1: 'medical', 3: 'community', 5: 'business' },

  emailTemplate:
    'Subject: A local resource for the people you serve\n\n' +
    'Good afternoon [Name],\n\nMy name is [Your name] with Example Wellness Office. ' +
    'We partner with offices like yours so you have a trusted place to refer.\n\n' +
    'Warmly,\n[Your name]',
  callScript: 'Good afternoon! I’m calling from Example Wellness Office. Who handles referrals or provider information?',

  // A couple of clearly-sample rows so a fresh board shows real derived numbers.
  seedOrgs: [
    { id: 'seed-org-01', organization: 'Sample Clinic', categoryId: 'medical', circle: 'Your City', outcomeId: 'interested', clientsReferred: 1, addedIso: '2026-07-10T15:00:00.000Z' },
  ],
});
