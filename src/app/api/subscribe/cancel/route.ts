import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.MOCK_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Mock payments are disabled." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createAdminClient();
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("subscription_status, current_period_end, plan, subscription_plan")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const currentEnd = profile?.current_period_end ? new Date(profile.current_period_end) : null;
  const hasActiveSubscription = profile?.subscription_status === "active" && currentEnd && currentEnd.getTime() > Date.now();

  if (!hasActiveSubscription) {
    return NextResponse.json({ error: "No active subscription to cancel." }, { status: 409 });
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({ cancel_at_period_end: true })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
