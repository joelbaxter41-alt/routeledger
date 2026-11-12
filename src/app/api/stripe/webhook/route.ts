import { stripeClient } from "@/lib/billing";
import { adminDatabase } from "@/lib/admin";
import type Stripe from "stripe";
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
    return new Response("Webhook configuration or signature missing", {
      status: 400,
    });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    const supported = [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "checkout.session.completed",
      "invoice.paid",
      "invoice.payment_failed",
    ];
    if (!supported.includes(event.type))
      return Response.json({ received: true });
    const object = event.data.object as unknown as {
      id: string;
      customer?: string | { id: string };
      subscription?: string | { id: string };
      parent?: {
        subscription_details?: { subscription?: string | { id: string } };
      };
    };
    let subscriptionId = event.type.startsWith("customer.subscription.")
      ? object.id
      : typeof object.subscription === "string"
        ? object.subscription
        : object.subscription?.id;
    const parentSub = object.parent?.subscription_details?.subscription;
    if (!subscriptionId)
      subscriptionId =
        typeof parentSub === "string" ? parentSub : parentSub?.id;
    if (!subscriptionId) return Response.json({ received: true });
    const stripe = stripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const db = adminDatabase();
    const { data: account, error: accountError } = await db
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_customer_id", customer)
      .single();
    if (accountError || !account)
      throw new Error("Billing account unavailable");
    const price = subscription.items.data[0]?.price.id;
    const isConfiguredPrice = price === process.env.STRIPE_SOLO_PRICE_ID;
    const periodEnd = subscription.items.data.reduce(
      (min, item) => Math.min(min, item.current_period_end),
      Number.MAX_SAFE_INTEGER,
    );
    const { error } = await db.rpc("apply_billing_event", {
      p_event: event.id,
      p_created: event.created,
      p_org: account.organization_id,
      p_customer: customer,
      p_subscription: subscription.id,
      p_status: isConfiguredPrice ? subscription.status : "inactive",
      p_price: price || "",
      p_end: new Date(periodEnd * 1000).toISOString(),
    });
    if (error) throw error;
    return Response.json({ received: true });
  } catch {
    return new Response("Billing state not saved; retry required", {
      status: 500,
    });
  }
}
