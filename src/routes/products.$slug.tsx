import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Play } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang, type Lang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const allImages = useMemo(() => productImages(p.images), [p.images]);

  const videoEmbed = p.video_url ? getVideoEmbed(p.video_url) : null;
  const totalSlots = allImages.length + (videoEmbed ? 1 : 0);
  const isVideoSlot = videoEmbed && activeIdx === allImages.length;

  const effectivePrice = Number(p.price);
  const canBuy = p.in_stock;

  const name = pickLang(p, "name", lang);
  const desc = pickLang(p, "description", lang);

  const handleQuickOrder = () => {
    const wa = settings.data?.whatsapp_number;
    if (!wa) {
      toast.error("WhatsApp number not configured");
      return;
    }
    openWhatsApp(
      wa,
      buildQuickOrderMessage({ lang, productName: name, price: effectivePrice * qty }),
    );
  };

  const handleAddToCart = () => {
    add(
      {
        id: p.id,
        slug: p.slug,
        name_en: p.name_en,
        name_fa: p.name_fa,
        name_ps: p.name_ps,
        price: effectivePrice,
        image_url: allImages[0] ?? null,
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
            <Badge variant={p.in_stock ? "secondary" : "destructive"}>
              {p.in_stock ? tr("inStock") : tr("outOfStock")}
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
      <SpecificationsTable specs={(p as { specifications?: unknown }).specifications} lang={lang} title={tr("specifications")} />
    </SiteLayout>
  );
}

// ---------- Specifications ----------

interface SpecExtra {
  header_en?: string;
  header_fa?: string;
  header_ps?: string;
  value_en?: string;
  value_fa?: string;
  value_ps?: string;
}

interface SpecRowData {
  type?: "row" | "section";
  title_en?: string;
  title_fa?: string;
  title_ps?: string;
  group_en?: string;
  group_fa?: string;
  group_ps?: string;
  label_en?: string;
  label_fa?: string;
  label_ps?: string;
  value_en?: string;
  value_fa?: string;
  value_ps?: string;
  value_header_en?: string;
  value_header_fa?: string;
  value_header_ps?: string;
  extras?: SpecExtra[];
}

function pick3(en?: string, fa?: string, ps?: string, lang?: Lang): string {
  const e = (en ?? "").trim();
  const f = (fa ?? "").trim();
  const p = (ps ?? "").trim();
  if (lang === "fa") return f || e || p;
  if (lang === "ps") return p || e || f;
  return e || f || p;
}

function SpecificationsTable({
  specs,
  lang,
  title,
}: {
  specs: unknown;
  lang: Lang;
  title: string;
}) {
  if (!Array.isArray(specs)) return null;
  const rows = (specs as SpecRowData[]).filter((s) => {
    if (!s || typeof s !== "object") return false;
    if ((s.type ?? "row") === "section") {
      return Boolean(pick3(s.title_en, s.title_fa, s.title_ps, lang));
    }
    const hasLabel = Boolean(pick3(s.label_en, s.label_fa, s.label_ps, lang));
    const hasValue = Boolean(pick3(s.value_en, s.value_fa, s.value_ps, lang));
    const hasExtras = (s.extras ?? []).some((e) => Boolean(pick3(e.value_en, e.value_fa, e.value_ps, lang)));
    return hasLabel || hasValue || hasExtras;
  });
  if (rows.length === 0) return null;

  const dataRows = rows.filter((s) => (s.type ?? "row") === "row");
  const hasGroup = dataRows.some((s) => Boolean(pick3(s.group_en, s.group_fa, s.group_ps, lang)));
  const extrasCount = dataRows.reduce((max, s) => Math.max(max, s.extras?.length ?? 0), 0);

  // First row that has any header content (for column headers).
  const headerRow = dataRows.find((s) => {
    const vh = pick3(s.value_header_en, s.value_header_fa, s.value_header_ps, lang);
    const eh = (s.extras ?? []).some((e) => pick3(e.header_en, e.header_fa, e.header_ps, lang));
    return Boolean(vh) || eh;
  });
  const valueHeader = headerRow
    ? pick3(headerRow.value_header_en, headerRow.value_header_fa, headerRow.value_header_ps, lang)
    : "";
  const extraHeaders: string[] = Array.from({ length: extrasCount }, (_, i) =>
    headerRow ? pick3(headerRow.extras?.[i]?.header_en, headerRow.extras?.[i]?.header_fa, headerRow.extras?.[i]?.header_ps, lang) : "",
  );
  const showHeaderRow = Boolean(valueHeader) || extraHeaders.some((h) => h.length > 0);

  const totalCols = (hasGroup ? 1 : 0) + 1 /* label */ + 1 /* value */ + extrasCount;

  // Pre-compute group rowSpan info.
  const groupSpanByIndex = new Map<number, number>();
  if (hasGroup) {
    let i = 0;
    while (i < rows.length) {
      if ((rows[i].type ?? "row") !== "row") {
        i += 1;
        continue;
      }
      const g = pick3(rows[i].group_en, rows[i].group_fa, rows[i].group_ps, lang);
      let j = i + 1;
      while (
        j < rows.length &&
        (rows[j].type ?? "row") === "row" &&
        pick3(rows[j].group_en, rows[j].group_fa, rows[j].group_ps, lang) === g
      ) {
        j += 1;
      }
      groupSpanByIndex.set(i, j - i);
      i = j;
    }
  }

  return (
    <section className="container mx-auto px-4 pb-12">
      <h2 className="mb-3 text-2xl font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-2xl border bg-card" dir={lang === "en" ? "ltr" : "rtl"}>
        <Table>
          {showHeaderRow && (
            <TableHeader>
              <TableRow>
                {hasGroup && <TableHead />}
                <TableHead />
                <TableHead>{valueHeader}</TableHead>
                {extraHeaders.map((h, i) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {rows.map((s, i) => {
              if ((s.type ?? "row") === "section") {
                return (
                  <TableRow key={i} className="bg-muted/60 hover:bg-muted/60">
                    <TableCell colSpan={totalCols} className="py-3 align-top text-sm font-semibold">
                      {pick3(s.title_en, s.title_fa, s.title_ps, lang)}
                    </TableCell>
                  </TableRow>
                );
              }
              const span = groupSpanByIndex.get(i);
              const groupText = pick3(s.group_en, s.group_fa, s.group_ps, lang);
              const label = pick3(s.label_en, s.label_fa, s.label_ps, lang);
              const value = pick3(s.value_en, s.value_fa, s.value_ps, lang);
              return (
                <TableRow key={i}>
                  {hasGroup && span !== undefined && (
                    <TableCell
                      rowSpan={span}
                      className="w-1/5 align-top bg-muted/30 font-medium text-foreground"
                    >
                      {groupText}
                    </TableCell>
                  )}
                  <TableCell className="align-top font-medium text-muted-foreground">{label}</TableCell>
                  <TableCell className="align-top">{value}</TableCell>
                  {Array.from({ length: extrasCount }, (_, k) => (
                    <TableCell key={k} className="align-top">
                      {pick3(s.extras?.[k]?.value_en, s.extras?.[k]?.value_fa, s.extras?.[k]?.value_ps, lang)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
