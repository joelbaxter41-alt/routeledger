import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!process.env.NEXT_PUBLIC_APP_URL) return [];
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
  return ["", "/features", "/pricing", "/privacy", "/terms"].map((path) => ({
    url: origin + path,
    changeFrequency: "monthly",
    priority: path ? 0.7 : 1,
  }));
}
