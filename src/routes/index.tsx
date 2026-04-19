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
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const current = SLIDES[Math.min(slide, slideCount - 1)];

  return (
    <SiteLayout>
      {/* Hero slider — full width, text on image */}
      {slidesQuery.isLoading ? (
        <section className="h-[70vh] min-h-[480px] w-full animate-pulse bg-muted md:h-[85vh]" />
      ) : slideCount > 0 && current ? (
        <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden md:h-[85vh]">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== slide}
            >
              <img src={s.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
            </div>
          ))}

          <div className="relative z-10 flex h-full items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl text-white">
                <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  ✨ {tr("featured")}
                </span>
                <h1 className="text-4xl font-bold leading-tight drop-shadow-lg md:text-6xl lg:text-7xl">
                  {pickLang(current, "title", lang) || tr("heroTitle")}
                </h1>
                <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow md:text-xl">
                  {pickLang(current, "subtitle", lang) || tr("heroSubtitle")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to={current.cta_link || "/shop"}>
                    <Button size="lg" className="gap-2">
                      {pickLang(current, "cta_label", lang) || tr("shopNow")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </Link>
                  <Link to="/categories">
                    <Button size="lg" variant="outline" className="border-white bg-white/10 text-white backdrop-blur hover:bg-white hover:text-foreground">
                      {tr("browseCategories")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {slideCount > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous slide"
                className="absolute start-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-foreground"
              >
                <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
              </button>
              <button
                onClick={goNext}
                aria-label="Next slide"
                className="absolute end-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-foreground"
              >
                <ChevronRight className="h-6 w-6 rtl:rotate-180" />
              </button>

              <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${i === slide ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Features */}
      <section className="container mx-auto grid grid-cols-1 gap-4 px-4 py-12 md:grid-cols-3">
        {[
          { icon: ShoppingBag, en: "Easy ordering", fa: "سفارش آسان", ps: "اسان فرمایش" },
          { icon: Truck, en: "Fast delivery", fa: "تحویل سریع", ps: "ګړنده رسول" },
          { icon: Headphones, en: "WhatsApp support", fa: "پشتیبانی واتساپ", ps: "د واټس اپ ملاتړ" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <f.icon className="h-6 w-6" />
            </div>
            <span className="font-semibold">{f[lang]}</span>
          </div>
        ))}
      </section>

      {/* Categories */}
      {cats.data && cats.data.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">{tr("categories")}</h2>
            <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
              {tr("viewAll")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {cats.data.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="group flex flex-col items-center rounded-xl border bg-card p-4 transition-all hover:border-primary hover:shadow-[var(--shadow-soft)]"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                  {c.image && (
                    <img src={c.image} alt={pickLang(c, "name", lang)} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </div>
                <span className="mt-3 text-center text-sm font-semibold">{pickLang(c, "name", lang)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">{tr("featuredProducts")}</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            {tr("viewAll")} →
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
