import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// PATCH /api/admin/users/[id]
// Admin-only: update user profile, role, subscription override, and scores
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const body = await req.json();
  const {
    role,
    subscription_status,
    subscription_plan,
    full_name,
    charity_id,
    charity_contribution_pct,
  } = body;

  const profileUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (role !== undefined && ["subscriber", "admin"].includes(role)) {
    profileUpdates.role = role;
  }
  if (
    subscription_status !== undefined &&
    ["inactive", "active", "lapsed", "cancelled"].includes(subscription_status)
  ) {
    profileUpdates.subscription_status = subscription_status;
  }
  if (subscription_plan !== undefined) {
    profileUpdates.subscription_plan = subscription_plan;
  }
  if (full_name !== undefined) {
    profileUpdates.full_name = full_name;
  }
  if (charity_id !== undefined) {
    profileUpdates.charity_id = charity_id || null;
  }
  if (charity_contribution_pct !== undefined) {
    profileUpdates.charity_contribution_pct = Math.min(
      100,
      Math.max(10, Number(charity_contribution_pct))
    );
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update(profileUpdates)
    .eq("id", targetUserId);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "User updated successfully" });
}

// GET /api/admin/users/[id]
// Retrieve full details for the edit modal (scores, full profile)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const [{ data: profile }, { data: scores }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("*, charities(name)")
      .eq("id", targetUserId)
      .single(),
    adminClient
      .from("scores")
      .select("*")
      .eq("user_id", targetUserId)
      .order("played_on", { ascending: false }),
  ]);

  return NextResponse.json({ profile, scores: scores ?? [] });
}
