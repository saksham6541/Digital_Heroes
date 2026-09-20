import { PLANS } from "@/lib/plans";

export interface DrawRecord {
  id: string;
  period: string;
  status: string;
  mode: string;
  winning_numbers?: number[] | null;
}

export default function ParticipationPanel({
  draws,
  drawEntriesCount,
  nextDraw,
}: {
  draws: DrawRecord[];
  drawEntriesCount: number;
  nextDraw: { period: string; date: string; label: string };
}) {
  const planPrice = PLANS.monthly.priceInr;

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <h2 className="font-semibold text-lg mb-4">Participation summary</h2>
      <div className="space-y-3 mb-5">
        <div className="rounded-lg bg-neutral-950/60 px-3 py-2.5">
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Draws entered</p>
          <p className="text-xl font-semibold text-white">{drawEntriesCount}</p>
        </div>
        <div className="rounded-lg bg-neutral-950/60 px-3 py-2.5">
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Next draw</p>
          <p className="text-sm font-medium text-white">{nextDraw.period}</p>
          <p className="text-xs text-neutral-400">{new Date(nextDraw.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
        </div>
      </div>

      <div className="rounded-lg bg-neutral-950/60 px-3 py-2.5">
        <p className="text-neutral-500 text-xs uppercase tracking-wide">Charity contribution</p>
        <p className="text-lg font-semibold text-emerald-400">₹{(planPrice * 0.1).toLocaleString("en-IN")}</p>
        <p className="text-xs text-neutral-400">10% of monthly plan per period</p>
      </div>

      <h3 className="font-medium text-sm mt-5 mb-3">Latest draws</h3>
      {draws.length === 0 && <p className="text-neutral-600 text-sm">No draws published yet — check back soon.</p>}
      <div className="space-y-3">
        {draws.map((d) => (
          <div key={d.id} className="flex items-center justify-between text-sm rounded-lg bg-neutral-950/60 px-3 py-2.5">
            <div>
              <p className="font-medium">{d.period}</p>
              <p className="text-neutral-500 text-xs capitalize">{d.status} · {d.mode}</p>
            </div>
            {d.status === "published" && (
              <p className="text-neutral-400 text-xs">
                Winning: {(d.winning_numbers ?? []).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
