import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ErrorState } from "@/components/ErrorState";
import {
  buildMeta,
  buildHreflangLinks,
  buildBlogJsonLd,
  jsonLdScript,
  getPageSeo,
  SITE_URL,
} from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BlogListItem {
  id: string;
  slug: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  excerpt_en: string;
  excerpt_fa: string;
  excerpt_ps: string;
  cover_image: string | null;
  tags: string[];
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

// Cast supabase client because the auto-generated `Database` types may not yet include `blog_posts`.
// Using `any` here is intentional — types regenerate after the next deploy.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export const Route = createFileRoute("/blog")({
  validateSearch: (search: Record<string, unknown>) => ({
    tag: typeof search.tag === "string" ? search.tag : undefined,
  }),
  loader: async () => {
    const { data, error } = await sb
      .from("blog_posts")
      .select(
        "id, slug, title_en, title_fa, title_ps, excerpt_en, excerpt_fa, excerpt_ps, cover_image, tags, author_name, published_at, created_at"
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { posts: (data ?? []) as BlogListItem[] };
  },
  head: ({ loaderData }) => {
    const seo = getPageSeo("blog", "en");
    const url = `${SITE_URL}/blog`;
    const recent = (loaderData?.posts ?? []).slice(0, 10).map((p) => ({
      title: p.title_en || p.slug,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.published_at || p.created_at,
      description: p.excerpt_en || "",
      image: p.cover_image || undefined,
    }));
    return {
      meta: buildMeta({
        title: seo.title,
        description: seo.description,
        url,
        lang: "en",
        keywords: seo.keywords,
        type: "website",
      }),
      links: buildHreflangLinks("/blog"),
      scripts: [jsonLdScript(buildBlogJsonLd(recent))],
    };
  },
  component: BlogIndex,
  errorComponent: ({ error, reset }) => (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <ErrorState error={error} reset={reset} />
      </div>
    </SiteLayout>
  ),
});

function formatDate(iso: string | null, lang: string) {
  if (!iso) return "";
  const locale = lang === "fa" ? "fa-IR" : lang === "ps" ? "ps-AF" : "en-US";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  const { tag } = Route.useSearch();
  const { lang, tr } = useLang();

  const tagSet = new Set<string>();
  posts.forEach((p: BlogListItem) => p.tags?.forEach((t: string) => tagSet.add(t)));
  const allTags = Array.from(tagSet).sort();

  const filtered = tag ? posts.filter((p: BlogListItem) => p.tags?.includes(tag)) : posts;

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10 md:py-14">
        <header className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold md:text-4xl">{tr("blog")}</h1>
          <p className="mt-2 text-muted-foreground">{tr("latestPosts")}</p>

          {allTags.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/blog"
                search={{ tag: undefined }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  !tag ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {tr("allPosts")}
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t}
                  to="/blog"
                  search={{ tag: t }}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    tag === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </header>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed py-20 text-center text-muted-foreground">
            {tr("noPostsYet")}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: BlogListItem) => {
              const title = pickLang(p, "title", lang) || p.slug;
              const excerpt = pickLang(p, "excerpt", lang);
              const date = formatDate(p.published_at || p.created_at, lang);
              return (
                <Card key={p.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="block"
                    aria-label={title}
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      {p.cover_image ? (
                        <img
                          src={p.cover_image}
                          alt={title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          {tr("blog")}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.tags?.slice(0, 3).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
                        {title}
                      </h2>
                      {excerpt && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span>{date}</span>
                        <span className="font-medium text-primary">{tr("readMore")} →</span>
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
