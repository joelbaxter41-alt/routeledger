import { adminDatabase } from "@/lib/admin";
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return new Response("Unauthorized", { status: 401 });
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 30);
  const { data, error } = await adminDatabase().rpc("generate_recurring", {
    p_until: date.toISOString().slice(0, 10),
  });
  if (error)
    return new Response("Recurring generation failed", { status: 500 });
  return Response.json({ created: data });
}
