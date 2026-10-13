// =============================================================================
// workflow-registry — n8n is retired; the app lists no n8n workflows (DR-0617)
// =============================================================================
// History (kept for accuracy): DR-0158 gave Ari a registry of every stored n8n
// workflow export, measured at build time from docs/00-foundations/n8n-workflows/
// and infra/n8n/ (vite.config.js buildWorkflowRegistry). n8n was retired to
// zero (DR-0132 / DR-0218), and on 2026-09-24 Darrell said "No n8n!!!" — the
// export library and this build-time reader left the repository (DR-0617).
// What still touches the live NAS n8n (infra/n8n, the /n8n transport, the
// ops-announce bell) is HELD until its replacement is proven end to end.
//
// The honest state is therefore EMPTY ON PURPOSE, and every surface that used
// to render the registry says so in words (WORKFLOW_REGISTRY_RETIRED) rather
// than reading as an injection failure. The running system's automation is the
// sovereign loop fleet (infra/nas-loops), read through loop currency.
// =============================================================================

export const WORKFLOW_REGISTRY_RETIRED = Object.freeze({
  decision: 'DR-0617',
  title: 'n8n workflows are retired',
  note: 'n8n is retired (DR-0132, DR-0218), and the app no longer lists n8n workflows (DR-0617). Its export library is gone from the repository; the few n8n stack files still in infra/n8n are HELD only until the live pieces they run (the ntfy bell, Ollama, the property-history bridge) are proven on their replacements. The running automation is the sovereign loop fleet in infra/nas-loops, whose currency is read live.',
});

// Always empty: the app no longer measures or lists n8n workflows.
export function storedWorkflowRegistry() {
  return [];
}
