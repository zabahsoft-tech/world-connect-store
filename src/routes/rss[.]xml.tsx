import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SITE_URL } from "@/lib/seo";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const items: string[] = [];
        let lastBuildDate = new Date().toUTCString();

        if (supabaseUrl && supabaseKey) {
          try {
            const sb = createClient<Database>(supabaseUrl, supabaseKey);
            const { data } = await sb
              .from("blog_posts")
              .select(
                "slug, title_en, excerpt_en, content_en, cover_image, author_name, published_at, created_at, tags"
              )
              .eq("is_published", true)
              .order("published_at", { ascending: false, nullsFirst: false })
              .limit(30);

            (data ?? []).forEach((p) => {
              const title = p.title_en || p.slug;
              const link = `${SITE_URL}/blog/${p.slug}`;
              const pubDate = new Date(p.published_at || p.created_at).toUTCString();
              const description = p.excerpt_en || stripHtml(p.content_en || "").slice(0, 280);
              const image = p.cover_image
                ? `<enclosure url="${escapeXml(p.cover_image)}" type="image/jpeg" />`
                : "";
              const categories = (p.tags ?? [])
                .map((t) => `<category>${escapeXml(t)}</category>`)
                .join("");
              const author = p.author_name ? `<dc:creator>${escapeXml(p.author_name)}</dc:creator>` : "";

              items.push(`    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      ${author}
      ${categories}
      ${image}
    </item>`);
            });

            if (data && data.length > 0) {
              lastBuildDate = new Date(data[0].published_at || data[0].created_at).toUTCString();
            }
          } catch {
            // ignore
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>World Connect Store — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Latest articles, tips and news from World Connect Store Afghanistan.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
