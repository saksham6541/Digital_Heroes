import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import WinnerReview from "@/components/admin/WinnerReview";

export default async function AdminWinnersPage() {
  const supabase = await createClient();
  const { data: winners } = await supabase
    .from("winners")
    .select("*, profiles(full_name), draws(period)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-8">Winners management</h1>
        <WinnerReview winners={winners ?? []} />
      </div>
    </div>
  );
}
