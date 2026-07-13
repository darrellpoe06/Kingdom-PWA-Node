// =============================================================================
// use-referral-ops — TLC's binding to the reusable office-assistant store
// =============================================================================
// Thin backward-compat binding: the store engine lives in the standalone module
// (app/src/modules/office-assistant/store.js); this instantiates it for TLC using
// the TLC config, so the SAME storage key ('poetech-referral-ops-v1') is used and
// no existing device-local data is orphaned. Every existing importer keeps
// working; the module powers other offices via their own createOfficeStore call.
// =============================================================================
import { createOfficeModel } from '../modules/office-assistant/model.js';
import { createOfficeStore } from '../modules/office-assistant/store.js';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';

const model = createOfficeModel(TLC_CONFIG);
const store = createOfficeStore(TLC_CONFIG, model);

export const useReferralOps = store.useStore;
export const addOrg = store.addOrg;
export const updateOrg = store.updateOrg;
export const setOrgOutcome = store.setOrgOutcome;
export const markFlyerSent = store.markFlyerSent;
export const recordEmail = store.recordEmail;
export const recordCall = store.recordCall;
export const setFollowUp = store.setFollowUp;
export const addPost = store.addPost;
export const updatePost = store.updatePost;
export const addIdea = store.addIdea;
