import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildQuickOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { NotFoundState, ErrorState } from "@/components/ErrorState";
import {
  buildMeta,
  buildHreflangLinks,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  jsonLdScript,
  SITE_URL,
} from "@/lib/seo";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { product: data };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const url = `${SITE_URL}/products/${params.slug}`;
    if (!p) {
      return {
        meta: [{ title: "Product — World Connect Store" }],
        links: buildHreflangLinks(`/products/${params.slug}`),
      };
    }
    const nameEn = p.name_en || "Product";
    const descEn = p.description_en || `Buy ${nameEn} on World Connect Store. Order on WhatsApp with delivery across Afghanistan.`;
    const image = p.image_url || undefined;
    return {
      meta: [
        ...buildMeta({
          title: `${nameEn} — World Connect Store Afghanistan`,
          description: descEn.slice(0, 160),
          image: image || undefined,
          url,
          lang: "en",
          type: "product",
          keywords: `${nameEn}, buy ${nameEn} Afghanistan, ${nameEn} Kabul, online shopping Afghanistan`,
        }),
        { property: "product:price:amount", content: Number(p.price).toFixed(2) },
        { property: "product:price:currency", content: "AFN" },
        { property: "product:availability", content: p.in_stock ? "in stock" : "out of stock" },
        { property: "og:title:fa", content: `${p.name_fa || nameEn} — ورلد کانکت افغانستان` },
        { property: "og:description:fa", content: (p.description_fa || descEn).slice(0, 160) },
        { property: "og:title:ps", content: `${p.name_ps || nameEn} — ورلډ کنیکټ افغانستان` },
        { property: "og:description:ps", content: (p.description_ps || descEn).slice(0, 160) },
      ],
      links: buildHreflangLinks(`/products/${params.slug}`),
      scripts: [
        jsonLdScript(
          buildProductJsonLd({
            name: nameEn,
            description: descEn,
            image: image,
            price: Number(p.price),
            inStock: p.in_stock,
            url,
            sku: p.id,
          }),
        ),
        jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Home", url: SITE_URL },
            { name: "Shop", url: `${SITE_URL}/shop` },
            { name: nameEn, url },
          ]),
        ),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <SiteLayout>
      <NotFoundState
        title="Product not found"
        description="This product doesn't exist or is no longer available."
      />
    </SiteLayout>
  ),
  errorComponent: ({ error, reset }) => (
    <SiteLayout>
      <ErrorState error={error} reset={reset} />
    </SiteLayout>
  ),
});

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const { tr, lang } = useLang();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  if (!p) return null;

  const name = pickLang(p, "name", lang);
  const desc = pickLang(p, "description", lang);
  const gallery: string[] = Array.isArray(p.gallery) ? (p.gallery as string[]) : [];
  const allImages = [p.image_url, ...gallery].filter(Boolean) as string[];

  const handleQuickOrder = () => {
    const wa = settings.data?.whatsapp_number;
    if (!wa) {
      toast.error("WhatsApp number not configured");
      return;
    }
    openWhatsApp(wa, buildQuickOrderMessage({ lang, productName: name, price: Number(p.price) * qty }));
  };

  return (
    <SiteLayout>
      <section className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
            {allImages[activeImg] ? (
              <img src={allImages[activeImg]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${i === activeImg ? "border-primary" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {p.featured && <Badge variant="default">{tr("featured")}</Badge>}
            <Badge variant={p.in_stock ? "secondary" : "destructive"}>
              {p.in_stock ? tr("inStock") : tr("outOfStock")}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{name}</h1>
          <p className="mt-2 text-3xl font-bold text-primary">{Number(p.price).toFixed(2)}</p>

          {desc && <p className="mt-6 whitespace-pre-line text-muted-foreground">{desc}</p>}

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{tr("quantity")}:</span>
              <div className="flex items-center rounded-lg border">
                <Button size="icon" variant="ghost" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <Button size="icon" variant="ghost" onClick={() => setQty((q) => q + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="flex-1 gap-2"
                disabled={!p.in_stock}
                onClick={() => {
                  add({
                    id: p.id,
                    slug: p.slug,
                    name_en: p.name_en,
                    name_fa: p.name_fa,
                    name_ps: p.name_ps,
                    price: Number(p.price),
                    image_url: p.image_url,
                  }, qty);
                  toast.success(tr("addToCart"));
                }}
              >
                <ShoppingCart className="h-5 w-5" /> {tr("addToCart")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                disabled={!p.in_stock}
                onClick={handleQuickOrder}
              >
                <MessageCircle className="h-5 w-5" /> {tr("quickOrder")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
