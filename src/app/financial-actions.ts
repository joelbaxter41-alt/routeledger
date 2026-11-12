"use server";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createHash } from "node:crypto";
import { context } from "@/lib/context";
import { records } from "@/lib/records";
import { uuid } from "@/lib/schemas";
import { invoiceSummary, localToday } from "@/lib/metrics";
import { money, invoiceTotal } from "@/lib/finance";
import { rateLimit, adminDatabase } from "@/lib/admin";
import { stripeClient, appOrigin } from "@/lib/billing";
export async function changeInvoiceStatus(form: FormData) {
  const id = uuid.parse(String(form.get("id")));
  let errorMessage = "";
  try {
    const { db, role } = await context();
    if (!["owner", "admin"].includes(role))
      throw new Error("Manager permissions required");
    const { error } = await db.rpc("set_invoice_status", {
      p_invoice: id,
      p_status: String(form.get("status")),
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    unstable_rethrow(e);
    errorMessage = e instanceof Error ? e.message : "Unable to update invoice";
  }
  revalidatePath("/app", "layout");
  redirect(
    `/app/invoices/${id}?${errorMessage ? "error=" + encodeURIComponent(errorMessage) : "success=Invoice+updated"}`,
  );
}
export async function sendInvoice(form: FormData) {
  const id = uuid.parse(String(form.get("id")));
  let failure = "";
  try {
    const r = await records();
    if (!["owner", "admin"].includes(r.role))
      throw new Error("Manager permissions required");
    if (
      !r.subscription?.verified_at ||
      !["active", "trialing"].includes(r.subscription.status) ||
      new Date(r.subscription.period_end) <= new Date()
    )
      throw new Error("Solo Pro required");
    const invoice = r.invoices.find((i) => i.id === id);
    if (!invoice || invoice.status === "voided")
      throw new Error("Invoice unavailable");
    if (!invoice.customer_email)
      throw new Error(
        "Invoice snapshot has no email address. Use print / save PDF to deliver it.",
      );
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new Error(
        "Resend is not configured. Follow the email setup guide.",
      );
    await rateLimit(`invoice-email:${r.organization.id}`, 10, 3600);
    const summary = invoiceSummary(
      invoice,
      r,
      localToday(r.organization.timezone),
    );
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM,
        to: invoice.customer_email,
        subject: `Invoice INV-${String(invoice.number).padStart(4, "0")} from ${r.organization.name}`,
        text: `${r.organization.name}\nInvoice INV-${String(invoice.number).padStart(4, "0")}\n\n${r.items
          .filter((i) => i.invoice_id === id)
          .map(
            (i) =>
              `${i.description} — ${i.quantity_milli / 1000} × ${money(i.unit_cents, r.organization.currency)} = ${money(invoiceTotal([i]).subtotal, r.organization.currency)}`,
          )
          .join(
            "\n",
          )}\n\nTotal: ${money(summary.total, r.organization.currency)}\nBalance due: ${money(summary.outstanding, r.organization.currency)}\nDue date: ${invoice.due_date}\n\n${invoice.notes}\n\nPlease contact ${r.organization.contact_email || r.organization.name} with questions.`,
        replyTo: r.organization.contact_email || undefined,
      },
      {
        idempotencyKey: `invoice-${invoice.id}-${summary.paid}-${createHash("sha256").update(invoice.customer_email).digest("hex")}`,
      },
    );
    if (error)
      throw new Error(
        "Email provider could not accept this message. Try again later.",
      );
    const { error: statusError } = await r.db.rpc("set_invoice_status", {
      p_invoice: id,
      p_status: "sent",
    });
    if (statusError)
      throw new Error(
        "Email accepted, but sent status could not be saved. Refresh before retrying.",
      );
  } catch (e) {
    unstable_rethrow(e);
    failure = e instanceof Error ? e.message : "Unable to send invoice";
  }
  revalidatePath("/app", "layout");
  redirect(
    `/app/invoices/${id}?${failure ? "error=" + encodeURIComponent(failure) : "success=Email+accepted+for+delivery"}`,
  );
}
export async function checkout() {
  let url = "";
  try {
    const { organization, user, role } = await context();
    if (role !== "owner")
      throw new Error("Only the business owner can manage billing");
    if (!process.env.STRIPE_SOLO_PRICE_ID)
      throw new Error("Stripe plan price is not configured");
    await rateLimit(`checkout:${organization.id}`, 5, 3600);
    const db = adminDatabase(),
      stripe = stripeClient();
    const { data: existing, error } = await db
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organization.id)
      .maybeSingle();
    if (error) throw new Error("Could not load billing account");
    if (
      existing?.stripe_subscription_id &&
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        existing.status,
      )
    )
      throw new Error(
        "Use the billing portal to manage your existing subscription.",
      );
    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          name: organization.name,
          metadata: { organization_id: organization.id },
        },
        { idempotencyKey: `org-customer-${organization.id}` },
      );
      customerId = customer.id;
      const { error: saveError } = await db
        .from("subscriptions")
        .upsert(
          { organization_id: organization.id, stripe_customer_id: customerId },
          { onConflict: "organization_id" },
        );
      if (saveError) throw new Error("Could not save billing account");
    }
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });
    if (
      activeSubscriptions.data.some((s) =>
        [
          "active",
          "trialing",
          "past_due",
          "unpaid",
          "incomplete",
          "paused",
        ].includes(s.status),
      )
    )
      throw new Error("A subscription already exists. Use the billing portal.");
    const openSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 10,
    });
    const reusable = openSessions.data.find(
      (s) =>
        s.mode === "subscription" &&
        s.client_reference_id === organization.id &&
        s.url,
    );
    if (reusable?.url) redirect(reusable.url);
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: process.env.STRIPE_SOLO_PRICE_ID, quantity: 1 }],
        client_reference_id: organization.id,
        subscription_data: { metadata: { organization_id: organization.id } },
        success_url: `${appOrigin()}/app/billing?success=Checkout+submitted.+Access+updates+after+webhook+verification.`,
        cancel_url: `${appOrigin()}/app/billing`,
      },
      {
        idempotencyKey: `checkout-${organization.id}-${Math.floor(Date.now() / 600000)}`,
      },
    );
    if (!session.url) throw new Error("Unable to start checkout");
    url = session.url;
  } catch (e) {
    unstable_rethrow(e);
    redirect(
      `/app/billing?error=${encodeURIComponent(e instanceof Error ? e.message : "Unable to open checkout")}`,
    );
  }
  redirect(url);
}
export async function billingPortal() {
  let url = "";
  try {
    const { organization, role } = await context();
    if (role !== "owner")
      throw new Error("Only the business owner can manage billing");
    await rateLimit(`portal:${organization.id}`, 10, 3600);
    const { data, error } = await adminDatabase()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organization.id)
      .single();
    if (error || !data?.stripe_customer_id)
      throw new Error("No Stripe customer exists yet. Start with checkout.");
    const session = await stripeClient().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${appOrigin()}/app/billing`,
    });
    url = session.url;
  } catch (e) {
    unstable_rethrow(e);
    redirect(
      `/app/billing?error=${encodeURIComponent(e instanceof Error ? e.message : "Unable to open portal")}`,
    );
  }
  redirect(url);
}
