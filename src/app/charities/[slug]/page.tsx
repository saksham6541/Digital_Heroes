import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import CharityDetailActions from "@/components/charities/CharityDetailActions";

interface CharityEvent {
  title: string;
  date: string;
  location: string;
}

export default async function CharityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: charity } = await supabase.from("charities").select("*").eq("slug", slug).single();
  if (!charity) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const events = ((charity.events as unknown as CharityEvent[]) ?? [])
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen">
      <NavBar isAuthed={!!user} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">{charity.name}</h1>
        {charity.image_url && (
          // Charity media is optional because older records may not have an image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={charity.image_url} alt="" className="mb-8 max-h-72 w-full rounded-2xl object-cover border border-neutral-800" />
        )}
        <p className="text-neutral-300 leading-relaxed mb-8">{charity.description}</p>

        <div className="mb-8">
            <h2 className="font-semibold text-lg mb-3">Upcoming events</h2>
            {events.length === 0 ? <p className="text-sm text-neutral-500">No upcoming events</p> : <div className="space-y-3">
              {events.map((e) => (
                <div key={`${e.date}-${e.title}`} className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-neutral-500 text-sm">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${e.date}T12:00:00`))} · {e.location}</p>
                </div>
              ))}
            </div>}
          </div>

        <CharityDetailActions charity={{ id: charity.id, name: charity.name }} />
      </div>
    </div>
  );
}
