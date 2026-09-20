"use client";

import { useEffect, useState } from "react";

export interface EditableUser {
  id: string;
  email?: string;
  full_name: string | null;
  role: string;
  subscription_status: string;
  subscription_plan: string | null;
  plan?: string | null;
  current_period_end?: string | null;
  subscription_renews_at?: string | null;
  cancel_at_period_end?: boolean | null;
  charity_id: string | null;
  charity_contribution_pct?: number;
  charities?: { name: string } | null;
}

interface UserEditModalProps {
  user: EditableUser;
  charities: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (updated: EditableUser) => void;
}

interface UserScore {
  id: string;
  score: number;
  played_on: string;
}

export default function UserEditModal({
  user,
  charities,
  onClose,
  onSaved,
}: UserEditModalProps) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [role, setRole] = useState(user.role);
  const [subStatus, setSubStatus] = useState(user.subscription_status);
  const [subPlan, setSubPlan] = useState(user.subscription_plan ?? "monthly");
  const [charityId, setCharityId] = useState(user.charity_id ?? "");
  const [contributionPct, setContributionPct] = useState(
    user.charity_contribution_pct ?? 10
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [scoresLoading, setScoresLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/users/${user.id}/scores`)
      .then((response) => response.json().catch(() => null).then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (active) {
          if (response.ok) setScores(data?.scores ?? []);
          else setError(data?.error || "Scores could not be loaded.");
          setScoresLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Scores could not be loaded.");
          setScoresLoading(false);
        }
      });
    return () => { active = false; };
  }, [user.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(contributionPct) || contributionPct < 10 || contributionPct > 100) {
      setError("Contribution must be between 10 and 100 percent.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          role,
          subscription_status: subStatus,
          subscription_plan: subStatus === "active" ? subPlan : null,
          charity_id: charityId || null,
          charity_contribution_pct: contributionPct,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      const selectedCharity = charities.find((c) => c.id === charityId);
      onSaved({
        ...user,
        full_name: fullName,
        role,
        subscription_status: subStatus,
        subscription_plan: subStatus === "active" ? subPlan : null,
        charity_id: charityId || null,
        charity_contribution_pct: contributionPct,
        charities: selectedCharity ? { name: selectedCharity.name } : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function addScore() {
    setError(null);
    const response = await fetch(`/api/admin/users/${user.id}/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(scoreValue), playedOn: scoreDate }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.error || "Score could not be added."); return; }
    setScoreValue("");
    setScoreDate("");
    const refreshed = await fetch(`/api/admin/users/${user.id}/scores`);
    const refreshedData = await refreshed.json().catch(() => null);
    if (refreshed.ok) setScores(refreshedData?.scores ?? []);
  }

  async function deleteScore(scoreId: string) {
    const response = await fetch(`/api/admin/users/${user.id}/scores/${scoreId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.error || "Score could not be deleted."); return; }
    setScores((current) => current.filter((score) => score.id !== scoreId));
  }

  async function editScore(score: UserScore) {
    const nextScore = window.prompt("Score (1-45)", String(score.score));
    const nextDate = window.prompt("Date (YYYY-MM-DD)", score.played_on);
    if (nextScore === null || nextDate === null) return;
    const response = await fetch(`/api/admin/users/${user.id}/scores/${score.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(nextScore), playedOn: nextDate }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.error || "Score could not be updated."); return; }
    setScores((current) => current.map((item) => item.id === score.id ? { ...item, score: Number(nextScore), played_on: nextDate } : item));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <h2 className="text-lg font-bold text-white">Edit User: {user.full_name || user.id.slice(0, 8)}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-xl font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <h3 className="mb-2 text-sm font-semibold text-white">Golf scores</h3>
            <div className="mb-3 grid grid-cols-[5rem_1fr_auto] gap-2">
              <input type="number" min="1" max="45" placeholder="Score" value={scoreValue} onChange={(e) => setScoreValue(e.target.value)} className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-sm" />
              <input type="date" value={scoreDate} onChange={(e) => setScoreDate(e.target.value)} className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-sm" />
              <button type="button" onClick={addScore} className="rounded-lg border border-neutral-700 px-3 text-xs text-neutral-200">Add</button>
            </div>
            {scoresLoading ? <p className="text-xs text-neutral-500">Loading scores…</p> : scores.length === 0 ? <p className="text-xs text-neutral-500">No scores yet.</p> : <div className="space-y-2">{scores.map((score) => <div key={score.id} className="flex items-center justify-between rounded-lg bg-neutral-950 px-3 py-2 text-xs"><span>{score.played_on} · {score.score}</span><span className="space-x-2"><button type="button" onClick={() => editScore(score)} className="text-neutral-300">Edit</button><button type="button" onClick={() => deleteScore(score.id)} className="text-red-400">Delete</button></span></div>)}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="subscriber">Subscriber</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Subscription Status</label>
              <select
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lapsed">Lapsed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 font-medium">Subscription Plan</label>
              <select
                value={subPlan}
                onChange={(e) => setSubPlan(e.target.value)}
                disabled={subStatus !== "active"}
                className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-40"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Charity Donation %</label>
              <input
                type="number"
                min="10"
                max="100"
                value={contributionPct}
                onChange={(e) => setContributionPct(Number(e.target.value))}
                className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-medium">Assigned Charity</label>
            <select
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">None selected</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
