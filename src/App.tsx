import { useEffect, useState } from "react";
import type { Screen } from "./data";
import { actions } from "./lib/store";
import { authEnabled } from "./lib/supabase";
import { useAuth } from "./lib/auth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ErrorBoundary from "./components/ErrorBoundary";
import SignIn from "./screens/SignIn";
import Dashboard from "./screens/Dashboard";
import Voice from "./screens/Voice";
import Lesson from "./screens/Lesson";
import Review from "./screens/Review";
import Pronunciation from "./screens/Pronunciation";
import Progress from "./screens/Progress";
import Tutors from "./screens/Tutors";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const navigate = (s: Screen) => setScreen(s);
  const { session, ready } = useAuth();
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      <Sidebar screen={screen} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto px-[34px] pb-[60px] pt-[30px]">
          {/* Per-screen, not app-wide: a crash in one screen leaves the shell
              and sidebar usable so the learner can navigate out of it. */}
          <ErrorBoundary resetKey={screen}>
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
    </div>
  );
}
