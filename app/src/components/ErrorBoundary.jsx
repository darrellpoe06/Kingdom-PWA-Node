// ErrorBoundary — per EXECUTION-OUTCOME-OBSERVABILITY.md. Before this existed,
// any thrown error in any tab unmounted the whole React tree and left a blank
// white screen with no signal to the user (broken-and-invisible). This catches
// render/lifecycle errors anywhere below it and degrades to a visible card the
// person can recover from, while still logging the error for diagnosis.
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the console signal for diagnosis; the boundary handles the UI.
    console.error('App error caught by ErrorBoundary:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF8F4]">
        <div className="bg-white border-2 border-[#B85838] p-6 max-w-lg w-full">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Something went wrong on this screen</div>
          <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>
            This page hit an error — but your data is safe.
          </h2>
          <p className="text-sm leading-relaxed text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            Nothing you entered was lost. Try again, or reload the app. If this keeps
            happening on the same screen, let us know so we can fix it.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="bg-[#1A1815] text-white px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border border-[#1A1815] text-[#1A1815] px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Reload app
            </button>
          </div>
          <details className="mt-4">
            <summary className="text-[10px] uppercase tracking-wider text-[#5A5751] cursor-pointer hover:text-[#1A1815]">Technical detail</summary>
            <pre className="mt-2 text-[11px] text-[#5A5751] whitespace-pre-wrap break-words" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
