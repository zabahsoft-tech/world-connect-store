import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ErrorState } from "@/components/ErrorState";
import { buildMeta, buildHreflangLinks, getPageSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/categories")({
  head: () => {
    const seo = getPageSeo("categories", "en");
    return {
      meta: [
        ...buildMeta({
          title: seo.title,
          description: seo.description,
          url: `${SITE_URL}/categories`,
          lang: "en",
          keywords: seo.keywords,
        }),
        { property: "og:title:fa", content: getPageSeo("categories", "fa").title },
        { property: "og:description:fa", content: getPageSeo("categories", "fa").description },
        { property: "og:title:ps", content: getPageSeo("categories", "ps").title },
        { property: "og:description:ps", content: getPageSeo("categories", "ps").description },
      ],
      links: buildHreflangLinks("/categories"),
    };
  },
  component: CategoriesPage,
  errorComponent: ({ error, reset }) => (
    <SiteLayout>
      <ErrorState error={error} reset={reset} />
    </SiteLayout>
  ),
});

function CategoriesPage() {
  const { tr, lang } = useLang();
  const cats = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">{tr("categories")}</h1>
        {cats.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : cats.data && cats.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cats.data.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-[var(--shadow-soft)]"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {c.image && (
                    <img
                      src={c.image}
                      alt={pickLang(c, "name", lang)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary">{pickLang(c, "name", lang)}</h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">{tr("noProducts")}</p>
        )}
      </section>
    </SiteLayout>
  );
}
