// =============================================================================
// referral-ops — TLC's binding to the reusable office-assistant module
// =============================================================================
// This file USED to hold the TLC referral system hardcoded. It is now a thin
// backward-compat binding: the engine lives in the standalone, reusable module
// (app/src/modules/office-assistant/), and TLC is just its first config
// (configs/tlc.js). This keeps every existing importer (TlcAssistant.jsx, the
// referral-ops tests) working byte-for-byte while the module powers other offices
// too — one implementation, reused, never forked (Darrell's standalone-App-Module
// request). PURE + DETERMINISTIC + NO PHI are enforced in the module.
// =============================================================================
import { createOfficeModel } from '../modules/office-assistant/model.js';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';

const model = createOfficeModel(TLC_CONFIG);

// Office-specific constants (now sourced from the TLC config).
export const REFERRAL_CATEGORIES = TLC_CONFIG.referralCategories;
export const GEO_CIRCLES = TLC_CONFIG.geoCircles;
export const OUTCOMES = TLC_CONFIG.outcomes;
export const DAILY_ROTATION = TLC_CONFIG.dailyRotation;
export const DAILY_TARGET_CONTACTS = TLC_CONFIG.dailyTargetContacts;
export const WEEKLY_TARGETS = TLC_CONFIG.weeklyTargets;
export const NETWORK_GOAL = TLC_CONFIG.networkGoal;
export const DAY_BLOCKS = TLC_CONFIG.dayBlocks;
export const WEEKLY_PLAN = TLC_CONFIG.weeklyPlan;
export const CONTENT_THEMES = TLC_CONFIG.contentThemes;
export const SOCIAL_PLATFORMS = TLC_CONFIG.socialPlatforms;
export const POST_STATUSES = TLC_CONFIG.postStatuses;
export const EMAIL_TEMPLATE = TLC_CONFIG.emailTemplate;
export const CALL_SCRIPT = TLC_CONFIG.callScript;
export const ARI_AUTOMATION_PATH = TLC_CONFIG.ariAutomationPath;
export const ARI_AUTOMATION_NOTE = TLC_CONFIG.ariAutomationNote;
export const OUTBOUND_CONSTRAINTS = TLC_CONFIG.outboundConstraints;
export const NO_PHI_NOTE = TLC_CONFIG.noPhiNote;

// Config-bound helpers, factories, and derivations (identical behavior).
export const referralCategory = model.referralCategory;
export const outcome = model.outcome;
export const geoCircle = model.geoCircle;
export const makeOrg = model.makeOrg;
export const makePost = model.makePost;
export const makeIdea = model.makeIdea;
export const validateOrg = model.validateOrg;
export const categoryForDay = model.categoryForDay;
export const orgStats = model.orgStats;
export const followUpsDue = model.followUpsDue;
export const dailyReport = model.dailyReport;
export const weeklyProgress = model.weeklyProgress;
export const topConvertingSources = model.topConvertingSources;
export const networkGoal = model.networkGoal;
export const mergeSeed = model.mergeSeed;
export const isSeedId = model.isSeedId;

// Seed rows (normalized through the TLC config's factories).
export const SEED_ORGS = model.seedOrgs;
export const SEED_POSTS = model.seedPosts;
