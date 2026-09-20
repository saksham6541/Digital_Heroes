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
    .select("subscription_status, current_period_end, cancel_at_period_end")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const currentEnd = profile.current_period_end ? new Date(profile.current_period_end) : null;
  const isCancelling =
    profile.subscription_status === "active" &&
    profile.cancel_at_period_end === true &&
    currentEnd !== null &&
    currentEnd.getTime() > Date.now();
  if (!isCancelling) {
    return NextResponse.json({ error: "Subscription is not in a cancelling state." }, { status: 409 });
  }

  // Resuming only clears the scheduled cancellation; it does not alter billing dates.
  const { error } = await adminSupabase
    .from("profiles")
    .update({ cancel_at_period_end: false })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, cancel_at_period_end: false });
}