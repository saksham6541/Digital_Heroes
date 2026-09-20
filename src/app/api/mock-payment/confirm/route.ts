import { NextResponse } from "next/server";
import { mockPayment } from "@/lib/mock-payment";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function getPeriodEnd(plan: "monthly" | "yearly", now: Date) {
  const next = new Date(now);
  if (plan === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
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
  const charityId = body?.charityId || null;
  const contributionPct = body?.contributionPct ?? 10;

  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  if (!Number.isFinite(contributionPct) || contributionPct < 10 || contributionPct > 100) {
    return NextResponse.json({ error: "Contribution must be between 10 and 100 percent." }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: currentProfile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("current_period_end")
    .eq("id", user.id)
    .single();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  if (charityId) {
    const { data: charity, error: charityError } = await adminSupabase
      .from("charities")
      .select("id")
      .eq("id", charityId)
      .maybeSingle();
    if (charityError) return NextResponse.json({ error: charityError.message }, { status: 500 });
    if (!charity) return NextResponse.json({ error: "Charity not found." }, { status: 404 });
  }

  const subscription = await mockPayment.createSubscription({ plan, userId: user.id });
  const now = new Date();
  const existingEnd = currentProfile?.current_period_end ? new Date(currentProfile.current_period_end) : null;
  // Renewals extend an unexpired subscription instead of shortening it.
  const baseline = existingEnd && existingEnd.getTime() > now.getTime() ? existingEnd : now;
  const nextEnd = getPeriodEnd(plan, baseline);
  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
      plan,
      subscription_renews_at: nextEnd.toISOString(),
      current_period_end: nextEnd.toISOString(),
      cancel_at_period_end: false,
      charity_id: charityId,
      charity_contribution_pct: contributionPct,
      stripe_subscription_id: subscription.id,
    })
    .eq("id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, subscriptionId: subscription.id, renewsAt: nextEnd.toISOString() });
}
