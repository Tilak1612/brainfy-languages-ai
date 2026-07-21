import { Component, type ErrorInfo, type ReactNode } from "react";

// Without this, any render error takes the entire app to a blank white page —
// no message, no way back. A learner mid-lesson would simply lose everything on
// screen. Scoped per-screen in App.tsx so a broken screen doesn't destroy the
// shell: the sidebar stays usable and they can navigate somewhere that works.
interface Props {
  children: ReactNode;
  /** Remounts the boundary when it changes, so navigating away clears the error. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced for whatever error reporting gets wired up later; until then the
    // console is the only record, and silently swallowing would be worse.
    console.error("Screen crashed:", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="anim-fade mx-auto max-w-[520px] pt-16 text-center">
        <h1 className="m-0 font-display text-[24px] font-extrabold tracking-[-.02em]">
          This screen hit a problem
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.55] text-[#6b6862]">
          Your progress is safe — it's saved as you go. Pick another screen from the sidebar,
          or reload to try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="grad-brand mt-6 rounded-[13px] px-6 py-3 text-[14px] font-bold text-white transition hover:brightness-[1.06]"
        >
          Reload
        </button>
      </div>
    );
  }
}
