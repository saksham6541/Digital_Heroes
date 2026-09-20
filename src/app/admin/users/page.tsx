import { getAdminContext } from "@/lib/admin-auth";
import NavBar from "@/components/NavBar";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { EditableUser } from "@/components/admin/UserEditModal";

export default async function AdminUsersPage() {
  const context = await getAdminContext();
  if (context.error) return <main className="p-8">Admin access required.</main>;
  const [{ data: users }, { data: charities }, { data: authUsers }] = await Promise.all([
    context.adminClient
      .from("profiles")
      .select("id, full_name, role, subscription_status, plan, subscription_plan, current_period_end, subscription_renews_at, cancel_at_period_end, charity_id, charity_contribution_pct, charities(name)")
      .order("created_at", { ascending: false }),
    context.adminClient.from("charities").select("id, name").order("name"),
    context.adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailById = new Map((authUsers?.users ?? []).map((user) => [user.id, user.email ?? ""]));
  const usersWithEmail = (users ?? []).map((user) => ({ ...user, email: emailById.get(user.id) ?? "" }));

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
            {usersWithEmail.length} registered users
          </span>
        </div>

        <UserManagementTable
          initialUsers={usersWithEmail as unknown as EditableUser[]}
          charities={charities ?? []}
        />
      </div>
    </div>
  );
}
