import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/features", "/pricing"],
      disallow: ["/app/", "/api/", "/auth/", "/reset-password", "/onboarding"],
    },
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? {
          sitemap: `${new URL(process.env.NEXT_PUBLIC_APP_URL).origin}/sitemap.xml`,
        }
      : {}),
  };
}
