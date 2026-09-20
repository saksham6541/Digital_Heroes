import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import CharityDetailActions from "@/components/charities/CharityDetailActions";

interface CharityEvent {
  title: string;
  date: string;
  description?: string;
}

export default async function CharityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: charity } = await supabase.from("charities").select("*").eq("slug", slug).single();
  if (!charity) notFound();

  const events = (charity.events as unknown as CharityEvent[]) ?? [];

  return (
    <div className="min-h-screen">
      <NavBar isAuthed={!!user} />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">{charity.name}</h1>
        <p className="text-neutral-300 leading-relaxed mb-8">{charity.description}</p>

        {events.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-3">Upcoming events</h2>
            <div className="space-y-3">
              {events.map((e, i) => (
                <div key={i} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-neutral-500 text-sm">{e.date}</p>
                  {e.description && <p className="text-neutral-400 text-sm mt-1">{e.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <CharityDetailActions charity={{ id: charity.id, name: charity.name }} />
      </div>
    </div>
  );
}
