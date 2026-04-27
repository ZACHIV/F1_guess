import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#040507] px-6 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-white/52">system fault</p>
          <h1 className="max-w-md text-xl font-semibold text-white/90">
            Something went wrong. Refresh the page or return to the gallery.
          </h1>
          <a
            className="rounded-full border border-[rgba(244,233,226,0.14)] bg-black/22 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl transition hover:bg-black/34 hover:text-white"
            href="/"
          >
            Back to gallery
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}
