import { NextResponse } from "next/server";
import { database } from "@/lib/supabase";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const db = await database();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = url.searchParams.get("next");
      return NextResponse.redirect(
        new URL(next === "/reset-password" ? next : "/app", url.origin),
      );
    }
  }
  return NextResponse.redirect(
    new URL("/login?error=Invalid+or+expired+authentication+link", url.origin),
  );
}
