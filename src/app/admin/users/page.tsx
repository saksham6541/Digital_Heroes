import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { EditableUser } from "@/components/admin/UserEditModal";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [{ data: users }, { data: charities }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, subscription_status, subscription_plan, charity_id, charity_contribution_pct, charities(name)")
      .order("created_at", { ascending: false }),
    supabase.from("charities").select("id, name").order("name"),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar isAuthed isAdmin />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-neutral-400 mt-1">
              View and update user profiles, change roles, and override subscription states.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            {(users ?? []).length} registered users
          </span>
        </div>

        <UserManagementTable
          initialUsers={(users as unknown as EditableUser[]) ?? []}
          charities={charities ?? []}
        />
      </div>
    </div>
  );
}
