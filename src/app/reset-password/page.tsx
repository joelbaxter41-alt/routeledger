import { AuthPage } from "@/components/auth-page";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    verify?: string;
    requested?: string;
  }>;
}) {
  return <AuthPage mode="password" params={searchParams} />;
}
