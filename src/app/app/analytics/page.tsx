import { Analytics } from "@/components/analytics";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  return <Analytics params={searchParams} />;
}
