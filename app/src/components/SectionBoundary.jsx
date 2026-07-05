// =============================================================================
// SectionBoundary — a COMPACT, per-section error boundary
// =============================================================================
// The app-wide ErrorBoundary (main.jsx) catches anything, but it replaces the
// WHOLE screen with a full-page recovery card — so one thrown error in one section
// takes down everything around it. For a registration flow a non-technical /
// elderly congregant must use, that is too blunt: this boundary degrades just the
// one section to a small inline card the person can recover from (Try again),
// while the rest of the page keeps working. "Unbreakable, no dead-ends."
//
// Pairs with the app-wide ErrorBoundary (defense in depth) and the break-it ship
// gate. Logs to console for diagnosis like the app-wide one.
import React from 'react';
import { recordError } from '../lib/error-journal.js';

class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Section error caught (${this.props.name || 'section'}):`, error, info?.componentStack);
    // Durable signal for the Quality & Throughput board (DR-0092); never throws.
    recordError({ source: `section:${this.props.name || 'section'}`, kind: 'render', message: error?.message || String(error) });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="bg-white border-2 border-[#B85838] p-4 sm:p-5" role="alert">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">
          {this.props.name ? `${this.props.name} hit a snag` : 'This section hit a snag'}
        </div>
        <p className="text-sm leading-relaxed text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Something on this part of the page didn’t load right — everything already saved is safe, and the rest of the app still works. If you were mid-typing here, that unsaved text may need re-entering.
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
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export { SectionBoundary };
export default SectionBoundary;
