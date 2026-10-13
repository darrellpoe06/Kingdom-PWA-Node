// =============================================================================
// properties — the Poe Properties module (public API)
// =============================================================================
// ONE library, TWO doors (Darrell, 2026-08-26). The PoeTech shell mounts
// <PropertiesApp surface="poetech" books={…}/> at ?view=properties; the Poe
// Properties door mounts <PropertiesApp surface="door"/> at /properties/app/.
// Same rows, same RLS, same logic — there is no second copy to fall out of sync.
//
// See README.md for the layout and the honest status.
// =============================================================================
export { default as PropertiesApp } from './PropertiesApp.jsx';
export {
  PROPERTY_ROLES, ROLE_CEILING, ALL_CAPABILITIES, CAPABILITY_LABELS, FACE_LABELS,
  DOC_OUTCOMES, DOC_FOLLOWUPS, FOLLOWUP_LABELS,
  capabilitiesFor, resolveFace, buildJobDoc, buildTenancyNote,
  buildHistory, newestFirst, rentRecordToBookEntry, unpostedRent, canPostToBooks,
} from './model.js';
export { POE_PROPERTIES, LAUNCH_PLAN, OPPORTUNITIES, CONSTRAINTS, validateLaunchPlan } from './config.js';
