import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function getPeriodExtension(plan: "monthly" | "yearly", now: Date) {
  const next = new Date(now);
  if (plan === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function POST(req: Request) {
  if (process.env.MOCK_PAYMENTS !== "true") {
    return NextResponse.json({ error: "Mock payments are disabled." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const plan = body?.plan;
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("current_period_end, plan, subscription_status, cancel_at_period_end")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const now = new Date();
  const currentEnd = profile?.current_period_end ? new Date(profile.current_period_end) : null;
  const baseline = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const nextEnd = getPeriodExtension(plan, baseline);

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({
      subscription_status: "active",
      plan,
      subscription_plan: plan,
      current_period_end: nextEnd.toISOString(),
      subscription_renews_at: nextEnd.toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, current_period_end: nextEnd.toISOString() });
}
