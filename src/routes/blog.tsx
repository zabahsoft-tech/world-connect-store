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
import { CalendarDays, User, ArrowRight, Tag, Newspaper, Rss } from "lucide-react";

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
  validateSearch: (search: Record<string, unknown>): { tag?: string } => {
    const tag = typeof search.tag === "string" ? search.tag : undefined;
    return tag ? { tag } : {};
  },
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
  const featured = !tag && filtered.length > 0 ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;

  return (
    <SiteLayout>
      {/* Hero header */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.15), transparent 40%), radial-gradient(circle at 80% 0%, hsl(var(--primary) / 0.1), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Newspaper className="h-3.5 w-3.5" />
              {tr("blog")}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {tr("latestPosts")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {tr("blog")} — {tr("latestPosts")}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <a
                href="/rss.xml"
                className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Rss className="h-3.5 w-3.5" />
                RSS
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-14">
        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="me-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              {tr("filterAll") /* fallback */}
            </span>
            <Link
              to="/blog"
              search={{ tag: undefined }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                !tag
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "bg-background hover:border-primary/40 hover:bg-accent"
              }`}
            >
              {tr("allPosts")}
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                to="/blog"
                search={{ tag: t }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  tag === t
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:border-primary/40 hover:bg-accent"
                }`}
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-24 text-center">
            <Newspaper className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{tr("noPostsYet")}</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link
                to="/blog/$slug"
                params={{ slug: featured.slug }}
                className="group mb-12 block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-xl"
                aria-label={pickLang(featured, "title", lang) || featured.slug}
              >
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted md:aspect-auto md:h-full md:min-h-[320px]">
                    {featured.cover_image ? (
                      <img
                        src={featured.cover_image}
                        alt={pickLang(featured, "title", lang) || featured.slug}
                        loading="eager"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Newspaper className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <Badge className="bg-primary text-primary-foreground shadow-md">
                        {tr("featured")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
                    <div className="flex flex-wrap gap-1.5">
                      {featured.tags?.slice(0, 4).map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="text-2xl font-bold leading-tight tracking-tight transition-colors group-hover:text-primary md:text-3xl lg:text-4xl">
                      {pickLang(featured, "title", lang) || featured.slug}
                    </h2>
                    {pickLang(featured, "excerpt", lang) && (
                      <p className="line-clamp-3 text-base text-muted-foreground">
                        {pickLang(featured, "excerpt", lang)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {featured.author_name && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {featured.author_name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featured.published_at || featured.created_at, lang)}
                      </span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {tr("readMore")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of posts */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p: BlogListItem) => {
                  const title = pickLang(p, "title", lang) || p.slug;
                  const excerpt = pickLang(p, "excerpt", lang);
                  const date = formatDate(p.published_at || p.created_at, lang);
                  return (
                    <Card
                      key={p.id}
                      className="group flex flex-col overflow-hidden border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Link
                        to="/blog/$slug"
                        params={{ slug: p.slug }}
                        className="flex flex-1 flex-col"
                        aria-label={title}
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                          {p.cover_image ? (
                            <img
                              src={p.cover_image}
                              alt={title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Newspaper className="h-10 w-10 opacity-30" />
                            </div>
                          )}
                          {p.tags && p.tags.length > 0 && (
                            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                              <Badge
                                variant="secondary"
                                className="bg-background/90 text-[10px] backdrop-blur"
                              >
                                #{p.tags[0]}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <h2 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                            {title}
                          </h2>
                          {excerpt && (
                            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                              {excerpt}
                            </p>
                          )}
                          <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {date}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                              {tr("readMore")}
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </SiteLayout>
  );
}
