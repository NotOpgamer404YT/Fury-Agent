import type { MetadataRoute } from "next";
import { DOCS } from "@/lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const docRoutes = DOCS.map((d) => ({ url: `${base}/docs${d.slug ? `/${d.slug}` : ""}`, lastModified: now, priority: 0.6 }));
  return [
    { url: base, lastModified: now, priority: 1 },
    { url: `${base}/login`, lastModified: now, priority: 0.3 },
    { url: `${base}/register`, lastModified: now, priority: 0.3 },
    ...docRoutes,
  ];
}
