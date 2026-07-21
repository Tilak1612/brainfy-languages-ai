import { useState } from "react";
import { BrandLogoIcon, SparkleIcon } from "../components/icons";
import { signIn, signUp } from "../lib/auth";

export default function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "in") {
        await signIn(email, password);
        // A successful sign-in flips the session and unmounts this screen.
      } else {
        await signUp(email, password, name.trim() || email.split("@")[0]);
        setNotice(
          "Account created. If your project has email confirmation on, check your inbox before signing in.",
        );
        setMode("in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-cream px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex items-center gap-[11px]">
          <div className="grad-brand-3 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] shadow-[0_6px_18px_-6px_rgba(91,75,232,.7)]">
            <BrandLogoIcon />
          </div>
          <div className="leading-[1.1]">
            <div className="font-display text-[17px] font-extrabold">Brainfy</div>
            <div className="text-[10.5px] font-bold tracking-[.14em] text-muted">LANGUAGES AI</div>
          </div>
        </div>

        <h1 className="m-0 mb-1 font-display text-[26px] font-extrabold tracking-[-.025em]">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-[14px] text-muted">
          {mode === "in"
            ? "Sign in to pick up your streak where you left off."
            : "Your progress, streak and review schedule sync across devices."}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-2.5">
          {mode === "up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="name"
              className="rounded-[12px] border border-[#E4E1DA] bg-white px-3.5 py-3 text-[14px] outline-none focus:border-brand"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            className="rounded-[12px] border border-[#E4E1DA] bg-white px-3.5 py-3 text-[14px] outline-none focus:border-brand"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            placeholder="Password"
            aria-label="Password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className="rounded-[12px] border border-[#E4E1DA] bg-white px-3.5 py-3 text-[14px] outline-none focus:border-brand"
          />

          {error && (
            <div role="alert" id="auth-error" className="rounded-[12px] border border-[#FADDD2] bg-[#FFF6F3] px-3.5 py-2.5 text-[13px] text-[#5c4238]">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-[12px] border border-[#B8E6D2] bg-[#E3F6EE] px-3.5 py-2.5 text-[13px] text-green">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="grad-brand mt-1 rounded-[12px] py-3 text-[14.5px] font-bold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError("");
            setNotice("");
          }}
          className="mt-4 w-full text-[13.5px] text-muted transition hover:text-ink"
        >
          {mode === "in" ? (
            <>
              New here? <span className="font-bold text-brand">Create an account</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-bold text-brand">Sign in</span>
            </>
          )}
        </button>

        <div className="mt-7 flex items-start gap-2 rounded-[14px] border border-[#DCD6FA] bg-[linear-gradient(135deg,#EEEBFD,#F4F2FE)] px-4 py-3">
          <SparkleIcon size={14} />
          <div className="text-[12.5px] leading-[1.5] text-[#3d3a52]">
            A new account starts at zero — no streak, no XP. Everything you see after this is
            something you earned.
          </div>
        </div>
      </div>
    </div>
  );
}
