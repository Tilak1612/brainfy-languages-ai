import { useEffect, useState } from "react";
import type { Screen } from "./data";
import { actions } from "./lib/store";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
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

  // Register a learning session for today (advances streak once/day).
  useEffect(() => {
    actions.registerActivity(0);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      <Sidebar screen={screen} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto px-[34px] pb-[60px] pt-[30px]">
          {screen === "dashboard" && <Dashboard onNavigate={navigate} />}
          {screen === "voice" && <Voice />}
          {screen === "lesson" && <Lesson onNavigate={navigate} />}
          {screen === "review" && <Review onNavigate={navigate} />}
          {screen === "pron" && <Pronunciation />}
          {screen === "progress" && <Progress />}
          {screen === "tutors" && <Tutors onNavigate={navigate} />}
        </main>
      </div>
    </div>
  );
}
