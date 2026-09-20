"use client";

import { useState } from "react";

interface DrawRunResult {
  winningNumbers?: number[];
  pool?: {
    total: number;
    pool5: number;
    pool4: number;
    pool3: number;
  };
  winnerCounts?: {
    tier5: number;
    tier4: number;
    tier3: number;
  };
  error?: string;
  [key: string]: unknown;
}

export default function DrawRunner() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [mode, setMode] = useState<"random" | "algorithmic">("random");
  const [result, setResult] = useState<DrawRunResult | null>(null);
  const [loading, setLoading] = useState<"simulate" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "simulate" | "publish") {
    setLoading(action);
    setError(null);
    if (action === "publish" && !window.confirm(`Publish the ${period} draw now?`)) {
      setLoading(null);
      return;
    }
    const res = await fetch("/api/draws/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, mode, action }),
    });
    const data = await res.json().catch(() => null);
    setLoading(null);
    if (!res.ok) {
      setError(data?.error || "The draw action failed.");
      setResult(null);
      return;
    }
    setResult(data);
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <h2 className="font-semibold text-lg mb-4">Configure & run a draw</h2>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

      <div className="flex gap-3 mb-4">
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-1 block rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wide">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "random" | "algorithmic")}
            className="mt-1 block rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm"
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic (weighted)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => run("simulate")}
          disabled={loading !== null}
          className="rounded-lg border border-neutral-700 hover:border-emerald-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading === "simulate" ? "Simulating…" : "Simulate"}
        </button>
        <button
          onClick={() => run("publish")}
          disabled={loading !== null}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading === "publish" ? "Publishing…" : "Publish"}
        </button>
      </div>

      {result && (
        <pre className="text-xs bg-neutral-950 rounded-lg p-4 overflow-x-auto text-neutral-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
