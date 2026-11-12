import "server-only";
import Stripe from "stripe";
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error(
      "Stripe is not configured. Follow the billing setup guide.",
    );
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
export function appOrigin() {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) throw new Error("NEXT_PUBLIC_APP_URL is required.");
  return new URL(origin).origin;
}
