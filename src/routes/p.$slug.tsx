import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { SafeHtml } from "@/components/SafeHtml";
import { ErrorState } from "@/components/ErrorState";
import { buildMeta, buildHreflangLinks, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { page: data };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.page;
    const title = p?.title_en || params.slug;
    const description = p?.meta_description_en || stripHtml(p?.content_en || "").slice(0, 155);
    const url = `${SITE_URL}/p/${params.slug}`;
    return {
      meta: buildMeta({
        title: `${title} — World Connect Store`,
        description,
        url,
        lang: "en",
        image: p?.hero_image || undefined,
      }),
      links: buildHreflangLinks(`/p/${params.slug}`),
    };
  },
  component: PublicPage,
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
        <h1 className="mb-2 text-3xl font-bold">Page not found</h1>
        <p className="mb-6 text-muted-foreground">The page you are looking for does not exist.</p>
        <Link to="/" className="text-primary hover:underline">Go home</Link>
      </div>
    </SiteLayout>
  ),
});

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function PublicPage() {
  const { page } = Route.useLoaderData();
  const { lang } = useLang();

  const title = pickLang(page, "title", lang);
  const content = pickLang(page, "content", lang);

  return (
    <SiteLayout>
      <div className="relative bg-gradient-to-b from-primary-soft/40 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--color-primary-soft)_0%,_transparent_70%)]"
        />
        {page.hero_image && (
          <div className="relative h-64 w-full overflow-hidden md:h-80">
            <img
              src={page.hero_image}
              alt={title}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}
        <section className="container relative mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="rounded-2xl border bg-card/90 p-6 shadow-card backdrop-blur-sm md:p-12">
            <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            {content ? (
              <SafeHtml
                html={content}
                className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg"
              />
            ) : (
              <p className="text-muted-foreground">No content yet.</p>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
