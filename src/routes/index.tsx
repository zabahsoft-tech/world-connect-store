import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShoppingBag, Truck, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { tr, lang } = useLang();

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

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-background to-background">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              ✨ {tr("featured")}
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              {tr("heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              {tr("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="gap-2">
                  {tr("shopNow")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/categories">
                <Button size="lg" variant="outline">{tr("browseCategories")}</Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-destructive opacity-90" />
            <div className="relative flex h-full items-center justify-center p-12">
              <ShoppingBag className="h-48 w-48 text-white opacity-30" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

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
