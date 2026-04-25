import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Calendar, Clock, User, Eye, Share2, Link2, Send, Facebook, Twitter, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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

function computeReadingTime(html: string) {
  const text = stripHtml(html);
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetRef]);
  return (
    <div className="fixed inset-x-0 top-16 z-40 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ShareRow({ url, title }: { url: string; title: string }) {
  const enc = encodeURIComponent;
  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
      icon: <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
      icon: <Send className="h-4 w-4" />,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: <Facebook className="h-4 w-4" />,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
      icon: <Twitter className="h-4 w-4" />,
    },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };
  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-4">
      <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Share2 className="h-4 w-4" /> Share
      </span>
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          {s.icon}
          <span>{s.label}</span>
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
      >
        <Link2 className="h-4 w-4" />
        <span>Copy</span>
      </button>
    </div>
  );
}

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const { lang, tr } = useLang();
  const articleRef = useRef<HTMLElement>(null);

  const title = pickLang(post, "title", lang) || post.slug;
  const content = pickLang(post, "content", lang);
  const date = formatDate(post.published_at || post.created_at, lang);
  const readingTime = computeReadingTime(content || post.content_en || "");
  const [views, setViews] = useState<number>(post.views ?? 0);

  // Increment view counter once per mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { error } = await sb.rpc("increment_blog_view", { post_id: post.id });
      if (!error && !cancelled) setViews((v) => v + 1);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${SITE_URL}/blog/${post.slug}`;

  return (
    <SiteLayout>
      <ReadingProgress targetRef={articleRef} />

      <article ref={articleRef}>
        {/* Hero */}
        <header className="relative">
          {post.cover_image ? (
            <div className="relative h-[280px] w-full overflow-hidden md:h-[420px]">
              <img
                src={post.cover_image}
                alt={title}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
              <div className="absolute inset-x-0 bottom-0">
                <div className="container mx-auto max-w-4xl px-4 pb-10 md:pb-14">
                  <HeroContent
                    title={title}
                    date={date}
                    readingTime={readingTime}
                    views={views}
                    author={post.author_name}
                    tags={post.tags}
                    tr={tr}
                    onLight
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full bg-gradient-to-br from-primary/15 via-primary/5 to-background py-14 md:py-20">
              <div className="container mx-auto max-w-4xl px-4">
                <HeroContent
                  title={title}
                  date={date}
                  readingTime={readingTime}
                  views={views}
                  author={post.author_name}
                  tags={post.tags}
                  tr={tr}
                />
              </div>
            </div>
          )}
        </header>

        {/* Body card */}
        <div className="container mx-auto max-w-4xl px-4">
          <nav className="-mt-3 mb-3 flex items-center gap-1.5 text-sm text-muted-foreground md:-mt-5">
            <Link to="/blog" className="hover:text-primary">
              {tr("blog")}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-foreground">{title}</span>
          </nav>

          <div className="relative z-10 -mt-2 rounded-2xl border bg-card p-6 shadow-sm md:-mt-6 md:p-10">
            {content ? (
              <div
                className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-primary"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="py-10 text-center">
                <p className="mb-4 text-muted-foreground">No content yet for this language.</p>
                <Button asChild variant="outline">
                  <Link to="/blog">← {tr("blog")}</Link>
                </Button>
              </div>
            )}

            <ShareRow url={shareUrl} title={title} />
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4" /> {tr("blog")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Related */}
        <section className="mt-14 border-t bg-muted/30">
          <div className="container mx-auto max-w-5xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-bold">{tr("relatedPosts")}</h2>
            {related.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r: RelatedPost) => {
                  const rt = pickLang(r, "title", lang) || r.slug;
                  const rex = pickLang(r, "excerpt", lang);
                  const rd = formatDate(r.published_at || r.created_at, lang);
                  return (
                    <Card key={r.id} className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
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
                          {rd && (
                            <p className="text-xs text-muted-foreground">{rd}</p>
                          )}
                          {rex && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">{rex}</p>
                          )}
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="mx-auto max-w-xl p-8 text-center">
                <p className="mb-4 text-muted-foreground">No related posts yet.</p>
                <Button asChild>
                  <Link to="/blog">
                    {tr("blog")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </section>
      </article>
    </SiteLayout>
  );
}

function HeroContent({
  title,
  date,
  readingTime,
  views,
  author,
  tags,
  tr,
  onLight = false,
}: {
  title: string;
  date: string;
  readingTime: number;
  views: number;
  author?: string | null;
  tags?: string[] | null;
  tr: (k: string) => string;
  onLight?: boolean;
}) {
  const textCls = onLight ? "text-white drop-shadow-md" : "text-foreground";
  const mutedCls = onLight ? "text-white/85 drop-shadow" : "text-muted-foreground";
  return (
    <>
      {tags && tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.map((t: string) => (
            <Link key={t} to="/blog" search={{ tag: t }}>
              <Badge
                variant="secondary"
                className={
                  onLight
                    ? "bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground"
                    : "hover:bg-primary hover:text-primary-foreground"
                }
              >
                #{t}
              </Badge>
            </Link>
          ))}
        </div>
      )}
      <h1 className={`mb-4 text-2xl font-bold leading-tight md:text-4xl lg:text-5xl ${textCls}`}>
        {title}
      </h1>
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm ${mutedCls}`}>
        {date && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {date}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {readingTime} min read
        </span>
        {author && (
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4" /> {author}
          </span>
        )}
        {views > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> {views.toLocaleString()}
          </span>
        )}
      </div>
    </>
  );
}
