import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, Truck, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ErrorState";
import { buildMeta, buildHreflangLinks, getPageSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = getPageSeo("home", "en");
    return {
      meta: [
        ...buildMeta({
          title: seo.title,
          description: seo.description,
          url: SITE_URL,
          lang: "en",
          keywords: seo.keywords,
        }),
        { property: "og:title:fa", content: getPageSeo("home", "fa").title },
        { property: "og:description:fa", content: getPageSeo("home", "fa").description },
        { property: "og:title:ps", content: getPageSeo("home", "ps").title },
        { property: "og:description:ps", content: getPageSeo("home", "ps").description },
      ],
      links: buildHreflangLinks("/"),
    };
  },
  component: HomePage,
  errorComponent: ({ error, reset }) => (
    <SiteLayout>
      <ErrorState error={error} reset={reset} />
    </SiteLayout>
  ),
});

function HomePage() {
  const { tr, lang } = useLang();
  const [slide, setSlide] = useState(0);

  const slidesQuery = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const SLIDES = slidesQuery.data ?? [];
  const slideCount = SLIDES.length;

  useEffect(() => {
    if (slideCount <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % slideCount), 5000);
    return () => clearInterval(id);
  }, [slideCount]);

  useEffect(() => {
    if (slide >= slideCount && slideCount > 0) setSlide(0);
  }, [slide, slideCount]);

  const goPrev = () => setSlide((s) => (s - 1 + slideCount) % slideCount);
  const goNext = () => setSlide((s) => (s + 1) % slideCount);

  const featured = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const cats = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const current = SLIDES[Math.min(slide, slideCount - 1)];

  return (
    <SiteLayout>
      {/* Hero slider — full-width edge-to-edge */}
      <section className="w-full">
        {slidesQuery.isLoading ? (
          <div className="h-[55vh] min-h-[360px] w-full animate-pulse bg-muted sm:h-[60vh] sm:min-h-[440px] md:h-[70vh] md:max-h-[640px]" />
        ) : slideCount > 0 && current ? (
          <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-black sm:h-[60vh] sm:min-h-[440px] md:h-[70vh] md:max-h-[640px]">
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}
                aria-hidden={i !== slide}
              >
                <img
                  src={s.image}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                  className="absolute inset-0 block h-full w-full object-contain object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              </div>
            ))}

            <div className="relative z-10 flex h-full items-center">
              <div className="container mx-auto w-full px-6 md:px-12 lg:px-16">
                <div className="max-w-2xl text-white">
                  {pickLang(current, "title", lang) && (
                    <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary/95 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
                      ✨ {tr("featured")}
                    </span>
                  )}
                  {pickLang(current, "title", lang) && (
                    <h1 className="text-4xl font-bold leading-tight drop-shadow-lg md:text-5xl lg:text-6xl">
                      {pickLang(current, "title", lang)}
                    </h1>
                  )}
                  {pickLang(current, "subtitle", lang) && (
                    <p className="mt-4 max-w-xl text-base text-white/90 drop-shadow md:text-lg">
                      {pickLang(current, "subtitle", lang)}
                    </p>
                  )}
                  {pickLang(current, "cta_label", lang) && current.cta_link && (
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link to={current.cta_link}>
                        <Button size="lg" className="gap-2 rounded-full">
                          {pickLang(current, "cta_label", lang)} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {slideCount > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="absolute start-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-background/30 text-white backdrop-blur-md transition hover:bg-background/80 hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next slide"
                  className="absolute end-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-background/30 text-white backdrop-blur-md transition hover:bg-background/80 hover:text-foreground"
                >
                  <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                </button>

                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-background/30 px-3 py-1.5 backdrop-blur-md">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>


      {/* Categories — soft band */}
      {cats.data && cats.data.length > 0 && (
        <section className="bg-muted/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{tr("browseCategories")}</p>
                <h2 className="mt-1 text-2xl font-bold md:text-3xl">{tr("categories")}</h2>
              </div>
              <Link to="/categories">
                <Button variant="ghost" size="sm" className="gap-1 rounded-full">
                  {tr("viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {cats.data.map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug }}
                  className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-border transition-all hover:ring-2 hover:ring-primary/40"
                >
                  <div className="h-full w-full bg-white">
                    {c.image && (
                      <img
                        src={c.image}
                        alt={pickLang(c, "name", lang)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-0 py-0" />
                  <span className="absolute bottom-3 start-3 text-sm font-semibold text-white drop-shadow">
                    {pickLang(c, "name", lang)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{tr("handPicked")}</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">{tr("featuredProducts")}</h2>
          </div>
          <Link to="/shop">
            <Button variant="ghost" size="sm" className="gap-1 rounded-full">
              {tr("viewAll")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
        {featured.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : featured.data && featured.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">{tr("noProducts")}</p>
        )}
      </section>
    </SiteLayout>
  );
}
