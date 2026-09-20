import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import CharityEditor from "@/components/admin/CharityEditor";

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase.from("charities").select("*").order("name");

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Charity management</h1>
        <CharityEditor charities={charities ?? []} />
      </div>
    </div>
  );
}
