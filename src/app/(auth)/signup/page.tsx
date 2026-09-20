"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charities, setCharities] = useState<Array<{ id: string; name: string }>>([]);
  const [charityId, setCharityId] = useState("");
  const [contributionPct, setContributionPct] = useState(10);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("charities").select("id, name").order("name").then(({ data }) => setCharities(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session && data.user) {
      const { error: profileError } = await supabase.from("profiles").update({ charity_id: charityId || null, charity_contribution_pct: contributionPct }).eq("id", data.user.id);
      if (profileError) {
        setError(profileError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess("Account created. Confirm your email, then choose or review your charity from the dashboard.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-neutral-400 text-sm mb-8">
          Track your scores, join the draw, support a cause.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-neutral-300">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Charity (optional)</label>
            <select value={charityId} onChange={(e) => setCharityId(e.target.value)} className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500">
              <option value="">Choose later</option>
              {charities.map((charity) => <option key={charity.id} value={charity.id}>{charity.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-300">Charity contribution: {contributionPct}%</label>
            <input type="range" min="10" max="100" step="5" value={contributionPct} onChange={(e) => setContributionPct(Number(e.target.value))} className="mt-2 w-full accent-emerald-500" />
            <p className="text-xs text-neutral-500">Minimum 10%; you can change this later.</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 transition-colors text-neutral-950 font-semibold py-2.5 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-neutral-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
