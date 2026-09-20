"use client";

import { useState } from "react";

export interface EditableUser {
  id: string;
  full_name: string | null;
  role: string;
  subscription_status: string;
  subscription_plan: string | null;
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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

      const data = await res.json();
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
