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
      {page?.hero_image && (
        <div className="relative h-56 w-full overflow-hidden md:h-72">
          <img
            src={page.hero_image}
            alt={title}
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold">{title}</h1>
        {storeName && !page && <h2 className="mb-4 text-2xl font-semibold text-primary">{storeName}</h2>}
        {content ? (
          isHtml ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{content}</p>
          )
        ) : (
          <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{tr("heroSubtitle")}</p>
        )}
      </section>
    </SiteLayout>
  );
}
