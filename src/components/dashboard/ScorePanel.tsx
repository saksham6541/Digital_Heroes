"use client";

import { useState } from "react";

type Score = { id: string; score: number; played_on: string };

export default function ScorePanel({ initialScores, isSubscriptionActive }: { initialScores: Score[]; isSubscriptionActive: boolean }) {
  const [scores, setScores] = useState<Score[]>(initialScores);
  const [score, setScore] = useState("");
  const [playedOn, setPlayedOn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftScore, setDraftScore] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/scores");
    const data = await res.json().catch(() => null);
    if (data?.scores) setScores(data.scores);
  }

  async function addScore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(score), playedOn }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "Could not save score.");
      return;
    }
    if (data?.dropped) {
      setError("That score is older than your latest five, so it was not kept.");
    }
    setScore("");
    setPlayedOn("");
    refresh();
  }

  async function deleteScore(id: string) {
    if (!window.confirm("Delete this score?")) return;
    setError(null);
    const res = await fetch(`/api/scores/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "Delete failed.");
      return;
    }
    refresh();
  }

  async function saveEdit(id: string) {
    setError(null);
    const res = await fetch(`/api/scores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: Number(draftScore), playedOn: draftDate }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "Update failed.");
      return;
    }

    setEditingId(null);
    refresh();
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <h2 className="font-semibold text-lg mb-1">Your scores</h2>
      <p className="text-neutral-500 text-xs mb-4">Last 5 rounds (Stableford, 1–45). Newest replaces oldest.</p>

      {!isSubscriptionActive ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium mb-2">An active subscription is required to log scores.</p>
          <a href="#subscription-panel" className="inline-flex rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300">
            Upgrade now
          </a>
        </div>
      ) : (
        <>
          <form onSubmit={addScore} className="flex gap-2 mb-4">
            <input
              type="number"
              min={1}
              max={45}
              required
              placeholder="Score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-20 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="date"
              required
              value={playedOn}
              onChange={(e) => setPlayedOn(e.target.value)}
              className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <button
              disabled={loading}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold px-4 text-sm transition-colors"
            >
              Add
            </button>
          </form>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        </>
      )}

      <div className="space-y-2 mt-4">
        {scores.length === 0 && <p className="text-neutral-600 text-sm">No scores logged yet.</p>}
        {scores.map((s) => {
          const isEditing = editingId === s.id;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-neutral-950/60 px-3 py-2 text-sm"
            >
              {isEditing ? (
                <>
                  <input
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={draftScore}
                    onChange={(e) => setDraftScore(e.target.value)}
                    className="w-16 rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s.id)} className="text-emerald-400 text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-neutral-400 text-xs">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-neutral-400">{new Date(s.played_on).toLocaleDateString()}</span>
                  <span className="font-semibold">{s.score}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setDraftDate(s.played_on);
                        setDraftScore(String(s.score));
                      }}
                      className="text-neutral-300 hover:text-emerald-400 text-xs"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteScore(s.id)} className="text-neutral-600 hover:text-red-400 text-xs">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
