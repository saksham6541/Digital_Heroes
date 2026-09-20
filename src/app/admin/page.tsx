import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import AdminCharts, {
  DrawStatItem,
  CharityStatItem,
  SubscriberStatusItem,
} from "@/components/admin/AdminCharts";

export default async function AdminHome() {
  const supabase = await createClient();
  const [
    { count: userCount },
    { data: draws },
    { data: donationData },
    { data: profileStatuses },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("draws")
      .select("period, pool_total, pool_5, pool_4, pool_3, active_subscriber_count")
      .eq("status", "published")
      .order("period"),
    supabase.from("donations").select("amount, charities(name)"),
    supabase.from("profiles").select("subscription_status"),
  ]);

  const totalPool = (draws ?? []).reduce((s, d) => s + Number(d.pool_total || 0), 0);
  const charityTotal = (donationData ?? []).reduce((s, d) => s + Number(d.amount || 0), 0);

  const stats = [
    { label: "Total users", value: userCount ?? 0 },
    { label: "Total prize pool (all draws)", value: `₹${totalPool.toLocaleString("en-IN")}` },
    { label: "Charity totals (donations)", value: `₹${charityTotal.toLocaleString("en-IN")}` },
    { label: "Draws published", value: (draws ?? []).length },
  ];

  const links = [
    { href: "/admin/users", label: "User management", desc: "View & edit profiles, subscriptions, scores" },
    { href: "/admin/draws", label: "Draw management", desc: "Configure mode, simulate, publish results" },
    { href: "/admin/charities", label: "Charity management", desc: "Add, edit, delete charity listings" },
    { href: "/admin/winners", label: "Winners management", desc: "Verify proof, mark payouts as completed" },
  ];

  // Prepare chart data
  interface DonationRow {
    amount: number;
    charities?: { name: string } | null;
  }

  const drawStats: DrawStatItem[] = (draws ?? []).map((d) => ({
    period: d.period,
    pool_total: Number(d.pool_total),
    pool_5: Number(d.pool_5),
    pool_4: Number(d.pool_4),
    pool_3: Number(d.pool_3),
    subscribers: d.active_subscriber_count,
  }));

  const charityMap = new Map<string, number>();
  for (const d of (donationData as unknown as DonationRow[]) ?? []) {
    const name = d.charities?.name || "General Fund";
    charityMap.set(name, (charityMap.get(name) || 0) + Number(d.amount));
  }
  const charityStats: CharityStatItem[] = Array.from(charityMap.entries()).map(
    ([name, amount]) => ({ name, amount })
  );

  const statusMap = new Map<string, number>();
  for (const p of profileStatuses ?? []) {
    const s = p.subscription_status || "inactive";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  }
  const subscriberStats: SubscriberStatusItem[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status, count })
  );

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Real-time platform metrics, prize pools, and operational controls.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            Full Platform Control
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 backdrop-blur-sm">
              <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Visual Recharts Analytics Section */}
        <AdminCharts
          drawStats={drawStats}
          charityStats={charityStats}
          subscriberStats={subscriberStats}
        />

        <h2 className="text-lg font-bold text-white mb-4">Operations & Management</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:border-emerald-500/50 hover:bg-neutral-900/60 transition-all p-6 group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                {l.label} →
              </h3>
              <p className="text-neutral-400 text-sm">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
