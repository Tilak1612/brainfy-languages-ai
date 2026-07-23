import { useState } from "react";
import type { Screen } from "../data";
import { useStore, actions } from "../lib/store";
import { authEnabled } from "../lib/supabase";
import { useAuth, useDisplayName, updateDisplayName, deleteAccount } from "../lib/auth";

const GOALS = [10, 25, 45];

export default function Settings({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { session } = useAuth();
  const email = session?.user?.email ?? null;
  const currentName = useDisplayName();
  const goal = useStore((s) => s.dailyGoalMin);

  const [name, setName] = useState(currentName);
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function saveName() {
    if (!name.trim() || name.trim() === currentName) return;
    setNameState("saving");
    const ok = await updateDisplayName(name.trim());
    setNameState(ok ? "saved" : "error");
    if (ok) setTimeout(() => setNameState("idle"), 2000);
  }

  async function onDelete() {
    setDeleting(true);
    setDeleteError("");
    const ok = await deleteAccount();
    // On success the session is torn down and the app returns to sign-in; nothing
    // more to do here. On failure the account is untouched — surface it.
    if (!ok) {
      setDeleting(false);
      setDeleteError("Something went wrong. Your account was not deleted — please try again.");
    }
  }

  return (
    <div className="anim-fade mx-auto max-w-[680px]">
      <h1 className="m-0 mb-6 font-display text-[28px] font-extrabold tracking-[-.025em]">Settings</h1>

      {/* Profile ------------------------------------------------------------ */}
      <section className="mb-4 rounded-[20px] border border-[#E7E4DD] bg-white p-6">
        <h2 className="mb-4 font-display text-[16px] font-bold">Profile</h2>

        <label className="mb-1.5 block text-[13px] font-semibold text-muted">Display name</label>
        <div className="flex flex-wrap gap-2.5">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameState("idle");
            }}
            maxLength={40}
            disabled={!authEnabled}
            className="min-w-[200px] flex-1 rounded-[11px] border border-[#E4E1DA] bg-white px-[13px] py-[10px] text-[14px] text-ink outline-none focus:border-brand disabled:opacity-60"
          />
          <button
            onClick={saveName}
            disabled={!authEnabled || nameState === "saving" || !name.trim() || name.trim() === currentName}
            className="grad-brand rounded-[11px] px-5 py-[10px] text-[13.5px] font-bold text-white transition hover:brightness-[1.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nameState === "saving" ? "Saving…" : nameState === "saved" ? "Saved ✓" : "Save"}
          </button>
        </div>
        {nameState === "error" && (
          <div className="mt-2 text-[12.5px] font-semibold text-coral-deep">Couldn't save. Try again.</div>
        )}

        <label className="mb-1.5 mt-5 block text-[13px] font-semibold text-muted">Email</label>
        <div className="rounded-[11px] border border-[#EFECE5] bg-cream-soft px-[13px] py-[10px] text-[14px] text-muted">
          {email ?? "Not signed in"}
        </div>
      </section>

      {/* Learning ----------------------------------------------------------- */}
      <section className="mb-4 rounded-[20px] border border-[#E7E4DD] bg-white p-6">
        <h2 className="mb-1 font-display text-[16px] font-bold">Daily goal</h2>
        <p className="mb-4 text-[13px] text-muted">How many minutes of practice you're aiming for each day.</p>
        <div className="flex flex-wrap gap-2.5">
          {GOALS.map((m) => (
            <button
              key={m}
              onClick={() => actions.setDailyGoal(m)}
              aria-pressed={goal === m}
              className={`rounded-[12px] border px-5 py-[11px] text-[14px] font-bold transition ${
                goal === m
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-[#E4E1DA] bg-white text-ink hover:border-brand"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </section>

      {/* Data & privacy ----------------------------------------------------- */}
      <section className="mb-4 rounded-[20px] border border-[#E7E4DD] bg-white p-6">
        <h2 className="mb-1 font-display text-[16px] font-bold">Data &amp; privacy</h2>
        <p className="mb-4 text-[13px] leading-[1.55] text-muted">
          How we handle your learning and voice data is described in our{" "}
          <button onClick={() => onNavigate("privacy")} className="font-semibold text-brand underline underline-offset-2">
            Privacy Policy
          </button>
          .
        </p>
        <button
          onClick={() => {
            if (confirm("Reset your progress? Your XP, streak and review history will be cleared. This cannot be undone.")) {
              actions.reset();
            }
          }}
          className="rounded-[11px] border border-[#E4E1DA] bg-white px-4 py-[10px] text-[13.5px] font-bold text-[#4b4842] transition hover:bg-[#f3f1ec]"
        >
          Reset progress
        </button>
        <p className="mt-2 text-[12px] text-muted">Clears your stats but keeps your account.</p>
      </section>

      {/* Danger zone -------------------------------------------------------- */}
      {authEnabled && (
        <section className="mb-4 rounded-[20px] border border-[#F1C9BC] bg-[#FFF7F4] p-6">
          <h2 className="mb-1 font-display text-[16px] font-bold text-coral-deep">Delete account</h2>
          <p className="mb-4 text-[13px] leading-[1.55] text-[#7a5347]">
            Permanently deletes your account and all your data — progress, streak, review history,
            custom tutors, and subscription. This cannot be undone. Any active subscription is
            cancelled.
          </p>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[#7a5347]">
            Type <span className="font-extrabold">DELETE</span> to confirm
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm account deletion"
              className="min-w-[160px] flex-1 rounded-[11px] border border-[#F1C9BC] bg-white px-[13px] py-[10px] text-[14px] text-ink outline-none focus:border-coral-deep"
            />
            <button
              onClick={onDelete}
              disabled={confirmDelete !== "DELETE" || deleting}
              className="rounded-[11px] bg-coral-deep px-5 py-[10px] text-[13.5px] font-bold text-white transition hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
          {deleteError && <div className="mt-2 text-[12.5px] font-semibold text-coral-deep">{deleteError}</div>}
        </section>
      )}
    </div>
  );
}
