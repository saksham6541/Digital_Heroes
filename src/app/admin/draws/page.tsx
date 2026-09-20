import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import DrawRunner from "@/components/admin/DrawRunner";

export default async function AdminDrawsPage() {
  const supabase = await createClient();
  const { data: draws } = await supabase.from("draws").select("*").order("period", { ascending: false });

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Draw management</h1>
        <DrawRunner />

        <h2 className="font-semibold text-lg mt-12 mb-4">Past draws</h2>
        <div className="space-y-3">
          {(draws ?? []).map((d) => (
            <div key={d.id} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{d.period}</span>
                <span className="text-neutral-500 capitalize">{d.status} · {d.mode}</span>
              </div>
              <p className="text-neutral-400">
                Winning numbers: {(d.winning_numbers ?? []).join(", ") || "—"} · Pool ₹
                {Number(d.pool_total ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
