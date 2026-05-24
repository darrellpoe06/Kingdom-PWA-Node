// app/src/lib/connectedContext.js
// CONNECTED-CONTEXT helpers — pure functions per
// /docs/00-foundations/_root/CONNECTED-CONTEXT.md. Leaf module by design:
// imports nothing from the rest of the app, so any component can import
// without creating a cycle through poe-financial-mvp-v28.jsx.
//
// Every entity carries links: [] — bidirectional connections to other
// entities. Append-only by design; manual and auto-matched links share the
// shape. ensureExternalProfile lays the ECOSYSTEM-PARTICIPANTS field foundation.

export function makeLink({ toEntityType, toEntityId, kind = 'related', source = 'auto', by = 'system', note = '' }) {
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    toEntityType, toEntityId, kind, source, by, note,
    at: new Date().toISOString(),
  };
}

export function ensureLinks(item) {
  if (!item) return item;
  if (Array.isArray(item.links)) return item;
  return { ...item, links: [] };
}

// Pure auto-link matcher per CONNECTED-CONTEXT Pattern 2. Returns top-N matches
// of a given entity type for a new item. Matching strategy varies per type.
export function findRelatedAuto(newItem, entityType, allData, maxResults = 10) {
  if (!newItem) return [];
  const matches = [];
  // Property-scoped: incidents mentioning the same property id. Reads the
  // canonical `linkedTo: { type, id }` shape used by every addIncident call
  // site (BigPicture Action Queue, Rentals tenant-late, Inbound convert).
  if (entityType === 'incident' && newItem.linkedTo?.type === 'rental' && newItem.linkedTo?.id) {
    (allData.incidents || []).forEach(i => {
      if (i.id !== newItem.id && i.linkedTo?.type === 'rental' && i.linkedTo?.id === newItem.linkedTo.id) {
        matches.push({ toEntityType: 'incident', toEntityId: i.id, kind: 'same-property' });
      }
    });
  }
  // Same-caller voicemails
  if (entityType === 'inbound' && newItem.caller) {
    (allData.inbound || []).forEach(c => {
      if (c.id !== newItem.id && c.caller === newItem.caller) {
        matches.push({ toEntityType: 'inbound', toEntityId: c.id, kind: 'same-caller' });
      }
    });
  }
  // Same-source inquiries
  if (entityType === 'inquiry' && newItem.source) {
    (allData.inquiries || []).forEach(i => {
      if (i.id !== newItem.id && i.source === newItem.source) {
        matches.push({ toEntityType: 'inquiry', toEntityId: i.id, kind: 'same-source' });
      }
    });
  }
  // Same-view feedback
  if (entityType === 'feedback' && newItem.currentView) {
    (allData.feedback || []).forEach(f => {
      if (f.id !== newItem.id && f.currentView === newItem.currentView) {
        matches.push({ toEntityType: 'feedback', toEntityId: f.id, kind: 'same-view' });
      }
    });
  }
  // Sort newest-first (heuristic: longer IDs include later timestamps from Date.now())
  return matches.slice(0, maxResults).map(m => makeLink({ ...m, source: 'auto', by: 'system' }));
}

export function ensureExternalProfile(item, type) {
  if (!item) return item;
  if (item.externalProfile && typeof item.externalProfile === 'object') return item;
  const defaultPerms = {
    contractor: ['view-assigned-projects', 'view-own-payments-ytd', 'submit-status-update', 'message-project-owner'],
    tenant:     ['view-own-lease', 'view-own-rent-history', 'submit-maintenance-request', 'message-landlord'],
  };
  return {
    ...item,
    externalProfile: {
      name: item.name || (item.tenantName || ''),
      email: item.email || (item.tenantEmail || ''),
      phone: item.phone || (item.tenantPhone || ''),
      permissions: defaultPerms[type] || [],
      inviteStatus: 'not-invited',
      invitedAt: null,
      invitedBy: null,
      acceptedAt: null,
      lastSeenAt: null,
      notes: '',
    },
  };
}
