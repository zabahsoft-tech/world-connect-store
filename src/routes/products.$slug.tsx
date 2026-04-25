import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Play } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productImages } from "@/lib/utils";

import { buildQuickOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { SafeHtml } from "@/components/SafeHtml";
import { NotFoundState, ErrorState } from "@/components/ErrorState";
import {
  buildMeta,
  buildHreflangLinks,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  jsonLdScript,
  SITE_URL,
} from "@/lib/seo";

function getVideoEmbed(url: string): { type: "youtube" | "vimeo" | "file"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { type: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { type: "file", src: url };
  // Assume direct file if uploaded via storage
  if (url.includes("/site-assets/") && url.includes("/videos/")) return { type: "file", src: url };
  return { type: "file", src: url };
}

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
    const imgs = productImages(p.images);
    const image = imgs[0];
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
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const gallery: string[] = useMemo(() => (Array.isArray(p.gallery) ? (p.gallery as string[]) : []), [p.gallery]);
  const allImages = useMemo(() => {
    const merged = p.image_url && !gallery.includes(p.image_url) ? [p.image_url, ...gallery] : gallery;
    return merged.filter(Boolean) as string[];
  }, [gallery, p.image_url]);

  const videoEmbed = p.video_url ? getVideoEmbed(p.video_url) : null;
  const totalSlots = allImages.length + (videoEmbed ? 1 : 0);
  const isVideoSlot = videoEmbed && activeIdx === allImages.length;

  const attributes: AttributeRow[] = Array.isArray(p.attributes) ? (p.attributes as unknown as AttributeRow[]) : [];
  const variants: Variant[] = Array.isArray(p.variants) ? (p.variants as unknown as Variant[]) : [];
  const specifications: SpecRow[] = Array.isArray((p as { specifications?: unknown }).specifications)
    ? ((p as { specifications: unknown[] }).specifications as SpecRow[])
    : [];

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;
  const effectivePrice = selectedVariant?.price != null ? Number(selectedVariant.price) : Number(p.price);
  const variantInStock = selectedVariant ? selectedVariant.in_stock : true;
  const canBuy = p.in_stock && variantInStock && (variants.length === 0 || !!selectedVariant);

  const name = pickLang(p, "name", lang);
  const desc = pickLang(p, "description", lang);

  const handleQuickOrder = () => {
    const wa = settings.data?.whatsapp_number;
    if (!wa) {
      toast.error("WhatsApp number not configured");
      return;
    }
    if (variants.length > 0 && !selectedVariant) {
      toast.error(tr("selectVariant"));
      return;
    }
    const variantName = selectedVariant ? pickLang(selectedVariant, "name", lang) : undefined;
    openWhatsApp(
      wa,
      buildQuickOrderMessage({ lang, productName: name, price: effectivePrice * qty, variantName }),
    );
  };

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error(tr("selectVariant"));
      return;
    }
    add(
      {
        id: p.id,
        slug: p.slug,
        name_en: p.name_en,
        name_fa: p.name_fa,
        name_ps: p.name_ps,
        price: effectivePrice,
        image_url: selectedVariant?.image_url || p.image_url,
        ...(selectedVariant
          ? {
              variantId: selectedVariant.id,
              variantName_en: selectedVariant.name_en,
              variantName_fa: selectedVariant.name_fa,
              variantName_ps: selectedVariant.name_ps,
            }
          : {}),
      },
      qty,
    );
    toast.success(tr("addToCart"));
  };

  return (
    <SiteLayout>
      <section className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-white p-4 md:p-6">
            {isVideoSlot && videoEmbed ? (
              videoEmbed.type === "file" ? (
                <video src={videoEmbed.src} controls className="h-full w-full rounded-lg object-contain" />
              ) : (
                <iframe
                  src={videoEmbed.src}
                  title={name}
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : allImages[activeIdx] ? (
              <img src={allImages[activeIdx]} alt={name} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {totalSlots > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${i === activeIdx ? "border-primary" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {videoEmbed && (
                <button
                  type="button"
                  onClick={() => setActiveIdx(allImages.length)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${isVideoSlot ? "border-primary" : "border-transparent"}`}
                  aria-label={tr("watchVideo")}
                >
                  {allImages[0] ? (
                    <img src={allImages[0]} alt="" className="h-full w-full object-cover opacity-70" />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {p.featured && <Badge variant="default">{tr("featured")}</Badge>}
            <Badge variant={p.in_stock && variantInStock ? "secondary" : "destructive"}>
              {p.in_stock && variantInStock ? tr("inStock") : tr("outOfStock")}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{name}</h1>
          {effectivePrice > 0 && (
            <p className="mt-2 text-3xl font-bold text-primary">{effectivePrice.toFixed(2)}</p>
          )}

          {desc && (
            <SafeHtml
              html={desc}
              className="prose prose-sm mt-6 max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-table:border prose-th:border prose-th:bg-muted prose-th:p-2 prose-td:border prose-td:p-2"
              dir={lang === "en" ? "ltr" : "rtl"}
            />
          )}

          {specifications.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">{tr("specifications")}</h2>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  {(() => {
                    const hasGroup = specifications.some(
                      (s) => (s.type ?? "row") === "row" && (s.group_en || s.group_fa || s.group_ps),
                    );
                    const extrasCount = specifications.reduce(
                      (m, s) => ((s.type ?? "row") === "row" ? Math.max(m, s.extras?.length ?? 0) : m),
                      0,
                    );
                    const hasExtras = extrasCount > 0;
                    const colCount = (hasGroup ? 1 : 0) + 1 + 1 + extrasCount;
                    // Build column headers (only shown when extras exist)
                    const firstValHeader = (() => {
                      for (const s of specifications) {
                        if ((s.type ?? "row") !== "row") continue;
                        const v = pickLang(s, "value_header", lang);
                        if (v) return v;
                      }
                      return "";
                    })();
                    const extraHeaders = Array.from({ length: extrasCount }).map((_, idx) => {
                      for (const s of specifications) {
                        if ((s.type ?? "row") !== "row") continue;
                        const ex = s.extras?.[idx];
                        if (!ex) continue;
                        const v = pickLang(ex, "header", lang);
                        if (v) return v;
                      }
                      return "";
                    });
                    let stripeIdx = 0;
                    const out: ReactNode[] = [];
                      for (let i = 0; i < specifications.length; i++) {
                        const s = specifications[i];
                        const kind = s.type ?? "row";
                        if (kind === "section") {
                          const title = pickLang(s, "title", lang);
                          if (!title) continue;
                          out.push(
                            <TableRow key={`sec-${i}`} className="bg-muted/60 hover:bg-muted/60">
                              <TableCell colSpan={colCount} className="py-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                                {title}
                              </TableCell>
                            </TableRow>,
                          );
                          stripeIdx = 0;
                          continue;
                        }
                        const label = pickLang(s, "label", lang);
                        const value = pickLang(s, "value", lang);
                        const extraVals = (s.extras ?? []).map((ex) => pickLang(ex, "value", lang));
                        const anyExtra = extraVals.some((v) => v);
                        if (!label && !value && !anyExtra) continue;
                        const stripe = stripeIdx % 2 === 1 ? "bg-muted/30" : "";
                        stripeIdx++;
                        // group rowSpan: count consecutive following rows with same group (until section/different group)
                        let groupCell: React.ReactNode = null;
                        if (hasGroup) {
                          const myGroup = pickLang(s, "group", lang);
                          const prev = specifications[i - 1];
                          const prevKind = prev?.type ?? "row";
                          const prevGroup =
                            prev && prevKind === "row" ? pickLang(prev, "group", lang) : "";
                          const startsBlock = !prev || prevKind === "section" || prevGroup !== myGroup;
                          if (startsBlock) {
                            let span = 1;
                            for (let j = i + 1; j < specifications.length; j++) {
                              const n = specifications[j];
                              if ((n.type ?? "row") !== "row") break;
                              if (pickLang(n, "group", lang) !== myGroup) break;
                              const nLabel = pickLang(n, "label", lang);
                              const nValue = pickLang(n, "value", lang);
                              const nExtras = (n.extras ?? []).map((ex) => pickLang(ex, "value", lang));
                              if (!nLabel && !nValue && !nExtras.some((v) => v)) break;
                              span++;
                            }
                            groupCell = (
                              <TableCell
                                rowSpan={span}
                                className="w-1/4 border-e bg-muted/20 align-top text-sm font-semibold"
                              >
                                {myGroup}
                              </TableCell>
                            );
                          }
                        }
                        out.push(
                          <TableRow key={`row-${i}`} className={stripe}>
                            {groupCell}
                            <TableCell className="font-medium">
                              {label}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{value}</TableCell>
                            {Array.from({ length: extrasCount }).map((_, idx) => (
                              <TableCell key={idx} className="text-muted-foreground">
                                {extraVals[idx] ?? ""}
                              </TableCell>
                            ))}
                          </TableRow>,
                        );
                      }
                    return (
                      <>
                        {hasExtras && (
                          <TableHeader>
                            <TableRow>
                              {hasGroup && <TableHead />}
                              <TableHead>{tr("spec_label")}</TableHead>
                              <TableHead>{firstValHeader || tr("spec_value")}</TableHead>
                              {extraHeaders.map((h, idx) => (
                                <TableHead key={idx}>{h || `${tr("spec_column")} ${idx + 2}`}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                        )}
                        <TableBody>{out}</TableBody>
                      </>
                    );
                  })()}
                </Table>
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium">{tr("variant")}:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const vname = pickLang(v, "name", lang);
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.in_stock}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary"
                      } ${!v.in_stock ? "cursor-not-allowed line-through opacity-50" : ""}`}
                    >
                      {vname}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {attributes.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">{tr("sizes")}</h2>
              <div className="flex flex-wrap gap-2">
                {attributes.map((a, i) => {
                  const value = pickLang(a, "value", lang);
                  if (!value) return null;
                  return (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm"
                    >
                      {value}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

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
                disabled={!canBuy}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" /> {tr("addToCart")}
              </Button>
              <Button
                size="lg"
                className="flex-1 gap-2 bg-[#25D366] text-white hover:bg-[#1EBE5D]"
                disabled={!canBuy}
                onClick={handleQuickOrder}
              >
                <WhatsAppIcon className="h-5 w-5" /> {tr("quickOrder")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
