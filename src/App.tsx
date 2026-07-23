import { useCallback, useEffect, useState } from "react";
import type { Screen } from "./data";
import { actions, useStore } from "./lib/store";
import { authEnabled } from "./lib/supabase";
import { useAuth } from "./lib/auth";
import {
  applyMeta,
  NOT_FOUND_META,
  pathForScreen,
  SCREEN_META,
  screenFromPath,
} from "./lib/routes";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ErrorBoundary from "./components/ErrorBoundary";
import BottomNav from "./components/BottomNav";
import SignIn from "./screens/SignIn";
import Welcome from "./screens/Welcome";
import Dashboard from "./screens/Dashboard";
import Voice from "./screens/Voice";
import Lesson from "./screens/Lesson";
import Review from "./screens/Review";
import Pronunciation from "./screens/Pronunciation";
import Progress from "./screens/Progress";
import Tutors from "./screens/Tutors";
import NotFound from "./screens/NotFound";

export default function App() {
  // null means "the URL matches no screen" — render the 404 rather than
  // silently showing the dashboard, which would be a soft 404 that tells the
  // learner nothing and tells crawlers the wrong thing.
  const [screen, setScreen] = useState<Screen | null>(() =>
    screenFromPath(window.location.pathname),
  );

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    const path = pathForScreen(s);
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
  }, []);

  // Back/forward buttons. Without this the URL changed but the view did not.
  useEffect(() => {
    const onPop = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    applyMeta(screen ? SCREEN_META[screen] : NOT_FOUND_META);
  }, [screen]);

  const { session, ready } = useAuth();
  const onboarded = useStore((s) => s.onboarded);
  const signedIn = !authEnabled || Boolean(session);

  // Register a learning session for today (advances streak once/day). Waits for
  // auth so it lands on the user's own row rather than a pre-hydration blank.
  useEffect(() => {
    if (!ready || !signedIn) return;
    actions.registerActivity(0);
  }, [ready, signedIn]);

  if (authEnabled && !ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream text-[14px] text-muted">
        Loading your progress…
      </div>
    );
  }

  if (!signedIn) return <SignIn />;

  // First run: orient the learner before dropping them on a dashboard of zeros.
  if (!onboarded) {
    return (
      <div className="flex h-screen w-full items-center justify-center overflow-y-auto bg-cream px-5 py-10">
        <Welcome onDone={navigate} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      <Sidebar screen={screen} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onNavigate={navigate} />
        {/* pb-24 on mobile clears the fixed bottom nav; the old flat pb-[60px]
            left the last card under it. */}
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 md:px-[34px] md:pb-[60px] md:pt-[30px]">
          {/* Per-screen, not app-wide: a crash in one screen leaves the shell
              and sidebar usable so the learner can navigate out of it. */}
          <ErrorBoundary resetKey={screen ?? "404"}>
            {screen === null && <NotFound onNavigate={navigate} />}
            {screen === "dashboard" && <Dashboard onNavigate={navigate} />}
            {screen === "voice" && <Voice />}
            {screen === "lesson" && <Lesson onNavigate={navigate} />}
            {screen === "review" && <Review onNavigate={navigate} />}
            {screen === "pron" && <Pronunciation />}
            {screen === "progress" && <Progress />}
            {screen === "tutors" && <Tutors onNavigate={navigate} />}
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav screen={screen} onNavigate={navigate} />
    </div>
  );
}
