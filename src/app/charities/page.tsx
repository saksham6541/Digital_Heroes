import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import CharityDirectoryClient, { CharityItem } from "@/components/charities/CharityDirectoryClient";

export default async function CharitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: charities } = await supabase.from("charities").select("*").order("name");

  return (
    <div className="min-h-screen">
      <NavBar isAuthed={!!user} />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2 text-white">Charity Directory</h1>
        <p className="text-neutral-400 mb-10">
          Pick the cause your subscription supports, or make an independent donation directly.
        </p>

        <CharityDirectoryClient
          initialCharities={(charities as unknown as CharityItem[]) ?? []}
        />
      </div>
    </div>
  );
}
