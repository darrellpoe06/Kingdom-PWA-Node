// =============================================================================
// surface-boundary — per-surface crash containment for the mount registry
// =============================================================================
// The 2026-06-25 Books>Tx white screen proved the class: a surface that throws
// during render unwinds the WHOLE React tree to the app-wide ErrorBoundary,
// replacing the entire screen with a full-page recovery card. SectionBoundary
// contained that for Books only; the other ~35 registered surfaces had no
// individual containment. This wraps EVERY surface mounted through the
// registry (surfaces.js), so one broken tab degrades to one inline card and
// the rest of the app keeps working — "unbreakable, no dead-ends" as a
// structural property of the mount layer, not per-surface discipline.
//
// Every catch is recorded to the error journal (lib/error-journal.js) so the
// failure is visible on the Quality & Throughput board afterward, not just a
// console line lost to the moment (DR-0090). Chunk-load failures are healed
// upstream by lib/chunk-reload-heal.js (reload-once on deploy skew); what
// reaches this boundary is a real render/runtime error, where a reload loop
// would not help — so the recovery here is user-driven (Try again / Reload).
//
// Lives in lib/ (not components/) because the registry is CORE and the
// module-boundary law forbids it a static component import; this is mount
// infrastructure, not a feature surface. Navigating away unmounts the
// conditional render branch, so a fresh visit always gets a fresh boundary.
import React from 'react';
import { recordError } from './error-journal.js';

export class SurfaceBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Surface error caught (${this.props.label || 'surface'}):`, error, info && info.componentStack);
    recordError({
      source: `surface:${this.props.label || 'unknown'}`,
      kind: 'render',
      message: (error && error.message) || String(error),
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const label = this.props.label || 'This surface';
    return (
      <div className="bg-white border-2 border-[#B85838] p-4 sm:p-5" role="alert">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">
          {label} hit an error
        </div>
        <p className="text-sm leading-relaxed text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          This part of the app ran into a problem — nothing you entered was lost, and every other tab still works. The error was recorded so it can be fixed.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="bg-[#1A1815] text-white px-4 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="border border-[#1A1815] text-[#1A1815] px-4 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}

// Wrap a (lazy) surface component so every mount through the registry is
// contained. Props flow through untouched; the boundary adds no markup on the
// healthy path beyond the wrapper element React already needs.
export function withSurfaceBoundary(Component, label) {
  function BoundedSurface(props) {
    return (
      <SurfaceBoundary label={label}>
        <Component {...props} />
      </SurfaceBoundary>
    );
  }
  BoundedSurface.displayName = `Bounded(${label || Component.displayName || Component.name || 'Surface'})`;
  return BoundedSurface;
}

export default SurfaceBoundary;
