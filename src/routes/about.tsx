import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { buildMeta, buildHreflangLinks, getPageSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => {
    const seo = getPageSeo("about", "en");
    return {
      meta: [
        ...buildMeta({
          title: seo.title,
          description: seo.description,
          url: `${SITE_URL}/about`,
          lang: "en",
          keywords: seo.keywords,
        }),
        { property: "og:title:fa", content: getPageSeo("about", "fa").title },
        { property: "og:description:fa", content: getPageSeo("about", "fa").description },
        { property: "og:title:ps", content: getPageSeo("about", "ps").title },
        { property: "og:description:ps", content: getPageSeo("about", "ps").description },
      ],
      links: buildHreflangLinks("/about"),
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { tr, lang } = useLang();

  const pageQ = useQuery({
    queryKey: ["page", "about"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", "about")
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
  });

  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const page = pageQ.data;
  const settings = settingsQ.data;

  // Prefer the editable Pages CMS entry; fall back to legacy settings.about_* for backward compat.
  const title = page ? pickLang(page, "title", lang) : tr("about");
  const content = page ? pickLang(page, "content", lang) : settings ? pickLang(settings, "about", lang) : "";
  const storeName = settings ? pickLang(settings, "store_name", lang) : "";
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  return (
    <SiteLayout>
      <div className="relative bg-gradient-to-b from-primary-soft/40 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--color-primary-soft)_0%,_transparent_70%)]"
        />
        {page?.hero_image && (
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
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            {storeName && !page && (
              <h2 className="mb-6 text-2xl font-semibold text-primary">{storeName}</h2>
            )}
            {content ? (
              isHtml ? (
                <div
                  className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{content}</p>
              )
            ) : (
              <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{tr("heroSubtitle")}</p>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
