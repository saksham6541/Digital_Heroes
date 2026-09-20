import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Stripe webhook — keeps profiles.subscription_status / plan / renews_at in
// sync with what actually happened in Stripe. Uses the service-role client
// since there's no authenticated user in a webhook request.
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_plan: plan === "yearly" ? "yearly" : "monthly",
            stripe_subscription_id: session.subscription as string,
            subscription_renews_at: new Date(
              Date.now() + (plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("profiles")
        .update({ subscription_status: "cancelled" })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from("profiles")
        .update({ subscription_status: "lapsed" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
