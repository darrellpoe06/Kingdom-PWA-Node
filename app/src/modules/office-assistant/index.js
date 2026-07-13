// =============================================================================
// office-assistant — the standalone, reusable office referral + assistant module
// =============================================================================
// Public API. One engine, many offices via config (Darrell's standalone-App-
// Module request). TLC is the first config; a new office is a new config file.
//
//   import { createOfficeModel, createOfficeStore, defineOfficeConfig } from
//     '../modules/office-assistant/index.js';
//   import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';
//
// See README.md to add an office; configs/_template.js is a copy-paste start.
// =============================================================================
export { defineOfficeConfig, validateOfficeConfig } from './config.js';
export { createOfficeModel, mergeSeed, isSeedId } from './model.js';
export { createOfficeStore } from './store.js';
export { TLC_CONFIG } from './configs/tlc.js';
export { TEMPLATE_CONFIG } from './configs/_template.js';
