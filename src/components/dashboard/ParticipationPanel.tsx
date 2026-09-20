export interface DrawRecord {
  id: string;
  period: string;
  status: string;
  mode: string;
  winning_numbers?: number[] | null;
}

export default function ParticipationPanel({ draws }: { draws: DrawRecord[] }) {
  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6">
      <h2 className="font-semibold text-lg mb-4">Draws</h2>
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
