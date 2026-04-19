import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SITE_URL, HREFLANG_MAP } from "@/lib/seo";

const STATIC_PATHS = ["", "/shop", "/categories", "/about", "/contact"];

function urlEntry(path: string, lastmod?: string, priority = "0.8") {
  const loc = `${SITE_URL}${path}`;
  const alternates = (Object.values(HREFLANG_MAP))
    .map(
      (code) =>
        `    <xhtml:link rel="alternate" hreflang="${code}" href="${loc}" />`,
    )
    .join("\n");
  return `  <url>
    <loc>${loc}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const entries: string[] = STATIC_PATHS.map((p) =>
          urlEntry(p, undefined, p === "" ? "1.0" : "0.8"),
        );

        if (supabaseUrl && supabaseKey) {
          try {
            const sb = createClient<Database>(supabaseUrl, supabaseKey);
            const [products, categories] = await Promise.all([
              sb.from("products").select("slug, updated_at"),
              sb.from("categories").select("slug, updated_at"),
            ]);

            (products.data ?? []).forEach((p) => {
              entries.push(urlEntry(`/products/${p.slug}`, p.updated_at, "0.9"));
            });
            (categories.data ?? []).forEach((c) => {
              entries.push(
                urlEntry(`/shop?category=${encodeURIComponent(c.slug)}`, c.updated_at, "0.7"),
              );
            });
          } catch {
            // ignore — still return static entries
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
