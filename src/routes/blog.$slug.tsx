import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ErrorState } from "@/components/ErrorState";
import {
  buildMeta,
  buildHreflangLinks,
  buildBlogPostingJsonLd,
  jsonLdScript,
  SITE_URL,
} from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface RelatedPost {
  id: string;
  slug: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  excerpt_en: string;
  excerpt_fa: string;
  excerpt_ps: string;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await sb
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();

    const { data: related } = await sb
      .from("blog_posts")
      .select("id, slug, title_en, title_fa, title_ps, excerpt_en, excerpt_fa, excerpt_ps, cover_image, published_at, created_at")
      .eq("is_published", true)
      .neq("id", data.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3);

    return { post: data, related: (related ?? []) as RelatedPost[] };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.post;
    if (!p) return {};
    const title = p.title_en || params.slug;
    const description =
      p.meta_description_en ||
      p.excerpt_en ||
      stripHtml(p.content_en || "").slice(0, 155);
    const url = `${SITE_URL}/blog/${params.slug}`;
    const datePublished = p.published_at || p.created_at;

    const meta = buildMeta({
      title: `${title} — World Connect Store Blog`,
      description,
      url,
      lang: "en",
      image: p.cover_image || undefined,
      type: "article",
    });
    meta.push({ property: "article:published_time", content: datePublished });
    if (p.updated_at) meta.push({ property: "article:modified_time", content: p.updated_at });
    if (p.author_name) meta.push({ property: "article:author", content: p.author_name });
    p.tags?.forEach((t: string) => meta.push({ property: "article:tag", content: t }));

    return {
      meta,
      links: buildHreflangLinks(`/blog/${params.slug}`),
      scripts: [
        jsonLdScript(
          buildBlogPostingJsonLd({
            title,
            description,
            image: p.cover_image || undefined,
            url,
            datePublished,
            dateModified: p.updated_at,
            authorName: p.author_name || undefined,
          })
        ),
      ],
    };
  },
  component: BlogPost,
  errorComponent: ({ error, reset }) => (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <ErrorState error={error} reset={reset} />
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-2 text-3xl font-bold">Post not found</h1>
        <p className="mb-6 text-muted-foreground">The article you are looking for does not exist.</p>
        <Link to="/blog" className="text-primary hover:underline">
          Back to blog
        </Link>
      </div>
    </SiteLayout>
  ),
});

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(iso: string | null, lang: string) {
  if (!iso) return "";
  const locale = lang === "fa" ? "fa-IR" : lang === "ps" ? "ps-AF" : "en-US";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const { lang, tr } = useLang();

  const title = pickLang(post, "title", lang) || post.slug;
  const content = pickLang(post, "content", lang);
  const date = formatDate(post.published_at || post.created_at, lang);

  return (
    <SiteLayout>
      <article>
        {post.cover_image && (
          <div className="relative h-64 w-full overflow-hidden md:h-96">
            <img
              src={post.cover_image}
              alt={title}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-4 py-10 md:py-12">
          <nav className="mb-6 text-sm">
            <Link to="/blog" className="text-muted-foreground hover:text-primary">
              ← {tr("blog")}
            </Link>
          </nav>

          {post.tags && post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {post.tags.map((t: string) => (
                <Link key={t} to="/blog" search={{ tag: t }}>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground">
                    #{t}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>

          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {date && (
              <span>
                {tr("publishedOn")} {date}
              </span>
            )}
            {post.author_name && <span>· {post.author_name}</span>}
          </div>

          {content ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-muted-foreground">No content yet.</p>
          )}
        </div>

        {related.length > 0 && (
          <section className="border-t bg-muted/30">
            <div className="container mx-auto max-w-5xl px-4 py-12">
              <h2 className="mb-6 text-2xl font-bold">{tr("relatedPosts")}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r: RelatedPost) => {
                  const rt = pickLang(r, "title", lang) || r.slug;
                  const rex = pickLang(r, "excerpt", lang);
                  return (
                    <Card key={r.id} className="group overflow-hidden transition-shadow hover:shadow-md">
                      <Link to="/blog/$slug" params={{ slug: r.slug }} className="block">
                        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                          {r.cover_image ? (
                            <img
                              src={r.cover_image}
                              alt={rt}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              {tr("blog")}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5 p-4">
                          <h3 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                            {rt}
                          </h3>
                          {rex && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">{rex}</p>
                          )}
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}
