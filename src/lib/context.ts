import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { database } from "./supabase";
export const context = cache(async function context() {
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error } = await db
    .from("organization_memberships")
    .select("organization_id,role,organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error)
    throw new Error(
      "Could not load business membership. Check database migrations.",
    );
  if (!membership) redirect("/onboarding");
  const organization = membership.organizations as unknown as Organization;
  return { db, user, organization, role: membership.role as string };
});
export type Organization = {
  id: string;
  name: string;
  business_type: string;
  currency: string;
  timezone: string;
  contact_email: string;
  address: string;
};
