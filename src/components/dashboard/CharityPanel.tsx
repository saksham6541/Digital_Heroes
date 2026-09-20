"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CharityOption {
  id: string;
  name: string;
}

export interface UserCharityProfile {
  id: string;
  charity_id?: string | null;
  charity_contribution_pct?: number | null;
}

export default function CharityPanel({
  profile,
  charities,
}: {
  profile: UserCharityProfile | null;
  charities: CharityOption[];
}) {
  const [charityId, setCharityId] = useState(profile?.charity_id ?? "");
  const [pct, setPct] = useState(profile?.charity_contribution_pct ?? 10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ charity_id: charityId || null, charity_contribution_pct: pct })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <h2 className="font-semibold text-lg mb-4">Your charity</h2>

      <label className="text-xs text-neutral-500 uppercase tracking-wide">Recipient</label>
      <select
        value={charityId}
        onChange={(e) => setCharityId(e.target.value)}
        className="mt-1 mb-4 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      >
        <option value="">Choose a charity…</option>
        {charities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="text-xs text-neutral-500 uppercase tracking-wide">
        Contribution — {pct}% of subscription
      </label>
      <input
        type="range"
        min={10}
        max={100}
        step={5}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        className="w-full mt-2 accent-emerald-500"
      />
      <p className="text-xs text-neutral-500 mb-4">Minimum 10% — increase any time.</p>

      <button
        onClick={save}
        disabled={saving || !charityId}
        className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-semibold py-2 text-sm transition-colors"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save charity"}
      </button>
    </div>
  );
}
