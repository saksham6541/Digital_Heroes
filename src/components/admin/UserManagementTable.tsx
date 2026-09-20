"use client";

import { useState } from "react";
import UserEditModal, { EditableUser } from "./UserEditModal";

interface UserManagementTableProps {
  initialUsers: EditableUser[];
  charities: Array<{ id: string; name: string }>;
}

export default function UserManagementTable({
  initialUsers,
  charities,
}: UserManagementTableProps) {
  const [users, setUsers] = useState<EditableUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);

  function handleUserSaved(updatedUser: EditableUser) {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/90 text-neutral-400 text-left border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3.5 font-medium">Name</th>
              <th className="px-4 py-3.5 font-medium">Role</th>
              <th className="px-4 py-3.5 font-medium">Subscription</th>
              <th className="px-4 py-3.5 font-medium">Charity</th>
              <th className="px-4 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3.5 font-medium text-white">
                  {u.full_name || <span className="text-neutral-500 italic">Unnamed</span>}
                  <span className="block text-[11px] font-mono text-neutral-500">{u.id.slice(0, 8)}...</span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      u.role === "admin"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      u.subscription_status === "active"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : u.subscription_status === "cancelled"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {u.subscription_status}
                  </span>
                  {u.subscription_plan && (
                    <span className="text-xs text-neutral-500 ml-1.5 capitalize">
                      ({u.subscription_plan})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-neutral-300">
                  {u.charities?.name ?? <span className="text-neutral-500">—</span>}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-xs font-medium text-neutral-200 hover:border-emerald-500 hover:text-emerald-400 hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <UserEditModal
          user={editingUser}
          charities={charities}
          onClose={() => setEditingUser(null)}
          onSaved={handleUserSaved}
        />
      )}
    </div>
  );
}
