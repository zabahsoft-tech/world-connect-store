import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ComponentType } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Send,
  Loader2,
  MessageCircle,
  ChevronRight,
  Navigation,
  Share2,
  ArrowRight,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { openWhatsApp } from "@/lib/whatsapp";

import {
  buildMeta,
  buildHreflangLinks,
  buildLocalBusinessJsonLd,
  jsonLdScript,
  getPageSeo,
  SITE_URL,
} from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => {
    const seo = getPageSeo("contact", "en");
    return {
      meta: [
        ...buildMeta({
          title: seo.title,
          description: seo.description,
          url: `${SITE_URL}/contact`,
          lang: "en",
          keywords: seo.keywords,
        }),
        { property: "og:title:fa", content: getPageSeo("contact", "fa").title },
        { property: "og:description:fa", content: getPageSeo("contact", "fa").description },
        { property: "og:title:ps", content: getPageSeo("contact", "ps").title },
        { property: "og:description:ps", content: getPageSeo("contact", "ps").description },
      ],
      links: buildHreflangLinks("/contact"),
      scripts: [jsonLdScript(buildLocalBusinessJsonLd({ url: `${SITE_URL}/contact` }))],
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { tr, lang } = useLang();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const pageQ = useQuery({
    queryKey: ["page", "contact"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", "contact")
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
  });

  const s = settings.data;
  const page = pageQ.data;
  const wa = s?.whatsapp_number;
  const wa2 = s?.whatsapp_number_2;
  

  const pageTitle = page ? pickLang(page, "title", lang) : tr("contactUs");
  const pageContent = page ? pickLang(page, "content", lang) : "";

  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const messageSchema = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(30).regex(/^[+\d\s\-()]*$/, "Invalid phone").optional().or(z.literal("")),
    email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
    message: z.string().trim().min(5).max(1000),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = messageSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tr("messageError"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        message: parsed.data.message,
        language: lang,
      });
      if (error) throw error;
      toast.success(tr("messageSent"));
      if (wa) {
        const waMsg =
          `📩 ${parsed.data.name}` +
          (parsed.data.phone ? ` (${parsed.data.phone})` : "") +
          (parsed.data.email ? ` <${parsed.data.email}>` : "") +
          `:\n\n${parsed.data.message}`;
        openWhatsApp(wa, waMsg);
      }
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error(tr("messageError"));
    } finally {
      setSubmitting(false);
    }
  };

  const socials: { url: string | null | undefined; icon: typeof Facebook; label: string }[] = [
    { url: s?.facebook_url, icon: Facebook, label: "Facebook" },
    { url: s?.instagram_url, icon: Instagram, label: "Instagram" },
    { url: s?.twitter_url, icon: Twitter, label: "Twitter" },
    { url: s?.youtube_url, icon: Youtube, label: "YouTube" },
    { url: s?.telegram_url, icon: Send, label: "Telegram" },
  ];
  const visibleSocials = socials.filter((x) => x.url && x.url.trim());

  type InfoTile = {
    href?: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    wide?: boolean;
    iconClassName?: string;
    tileClassName?: string;
  };
  const infoTiles: InfoTile[] = [];
  if (wa)
    infoTiles.push({
      href: `https://wa.me/${wa.replace(/[^\d]/g, "")}`,
      icon: WhatsAppIcon,
      label: "WhatsApp",
      value: wa,
      iconClassName: "h-4.5 w-4.5 text-[#25D366]",
      tileClassName: "bg-[#25D366]/10 text-[#25D366]",
    });
  if (wa2)
    infoTiles.push({
      href: `https://wa.me/${wa2.replace(/[^\d]/g, "")}`,
      icon: WhatsAppIcon,
      label: "WhatsApp 2",
      value: wa2,
      iconClassName: "h-4.5 w-4.5 text-[#25D366]",
      tileClassName: "bg-[#25D366]/10 text-[#25D366]",
    });
  if (s?.phone) infoTiles.push({ href: `tel:${s.phone}`, icon: Phone, label: tr("phone"), value: s.phone });
  if (s?.email) infoTiles.push({ href: `mailto:${s.email}`, icon: Mail, label: tr("email"), value: s.email });
  const address = s
    ? (lang === "en"
        ? s.address
        : (lang === "fa" ? s.address_fa : s.address_ps) || s.address)
    : null;
  if (address) infoTiles.push({ icon: MapPin, label: "Address", value: address, wide: true });
  if (s?.business_hours) infoTiles.push({ icon: Clock, label: "Hours", value: s.business_hours, wide: true });

  const storeName = s ? pickLang(s, "store_name", lang) : "";
  const directionsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
  // Accept any Google Maps URL the user pastes and convert it to an embeddable iframe URL.
  // - /maps/embed?... → use as-is (official embed)
  // - /maps/place/... or /maps/...@lat,lng,zoom → extract coords and use maps.google.com/maps?q=...&output=embed
  // - fallback: query by address
  const buildEmbedUrl = (raw: string | null | undefined, address: string | null | undefined): string | null => {
    const url = raw?.trim();
    if (url && /^https:\/\/www\.google\.[^/]+\/maps\/embed/.test(url)) return url;
    const coordMatch = url?.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);
    if (coordMatch) {
      const [, lat, lng, zoom] = coordMatch;
      const z = zoom ?? "16";
      return `https://maps.google.com/maps?q=${lat},${lng}&z=${z}&output=embed`;
    }
    if (address?.trim()) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    }
    return null;
  };
  const embedUrl = buildEmbedUrl(s?.google_maps_embed_url, address);
  const hasEmbed = !!embedUrl;
  const replyHelper = s?.business_hours
    ? `We usually reply during ${s.business_hours}.`
    : "We usually reply within a few hours.";

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Hero header */}
        <header
          className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-[var(--primary-soft)] via-card to-card p-6 md:mb-8 md:p-8"
        >
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:gap-5 md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Get in touch
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">{pageTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {tr("contactFormIntro")}
              </p>
            </div>
          </div>
        </header>

        {pageContent && (
          <div
            className="prose mb-6 max-w-none prose-headings:font-semibold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: form (desktop) / second on mobile */}
          <Card className="relative order-2 overflow-hidden p-5 md:p-6 lg:order-1 lg:col-span-3">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <h2 className="mb-4 text-lg font-semibold">{tr("sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="cf-name" className="mb-1.5 block">{tr("yourName")} *</Label>
                <Input id="cf-name" className="h-11" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cf-phone" className="mb-1.5 block">{tr("yourPhone")}</Label>
                  <Input id="cf-phone" className="h-11" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="cf-email" className="mb-1.5 block">{tr("yourEmail")}</Label>
                  <Input id="cf-email" className="h-11" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} maxLength={255} />
                </div>
              </div>
              <div>
                <Label htmlFor="cf-message" className="mb-1.5 block">{tr("yourMessage")} *</Label>
                <Textarea id="cf-message" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} maxLength={1000} required />
                <div className="mt-1 text-right text-xs text-muted-foreground">{form.message.length}/1000</div>
              </div>
              <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{replyHelper}</p>
                <Button
                  type="submit"
                  size="lg"
                  className="group w-full gap-2 sm:w-auto sm:px-8"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {tr("sendMessage")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Right: info tiles + map + socials. First on mobile so phone/WhatsApp are tappable up top. */}
          <div className="order-1 space-y-4 lg:order-2 lg:col-span-2">
            {/* Info tiles grid */}
            {settings.isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[78px] w-full rounded-xl" />
                ))}
              </div>
            ) : infoTiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {infoTiles.map((t, i) => {
                  const Icon = t.icon;
                  const inner = (
                    <div className="flex h-full items-start gap-3 rounded-xl border bg-card p-3.5 shadow-[var(--shadow-soft)] transition-all group-hover:border-primary/40 group-hover:shadow-md">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.tileClassName ?? "bg-primary-soft text-primary"}`}
                      >
                        <Icon className={t.iconClassName ?? "h-4.5 w-4.5"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {t.label}
                        </p>
                        <p className="mt-0.5 break-words text-sm font-semibold leading-snug">
                          {t.value}
                        </p>
                      </div>
                      {t.href && (
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-all rtl:rotate-180 group-hover:translate-x-0.5 group-hover:text-primary rtl:group-hover:-translate-x-0.5" />
                      )}
                    </div>
                  );
                  const wrapperClass = `group block ${t.wide ? "sm:col-span-2" : ""}`;
                  return t.href ? (
                    <a
                      key={i}
                      href={t.href}
                      target={t.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className={wrapperClass}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={i} className={wrapperClass}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Map (real iframe or wireframe) */}
            {settings.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl md:h-[300px]" />
            ) : hasEmbed ? (
              <div className="relative overflow-hidden rounded-xl border shadow-[var(--shadow-soft)]">
                <iframe
                  src={embedUrl!}
                  title="Map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="h-[260px] w-full border-0 md:h-[300px]"
                />
                {directionsHref && (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-lg bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md ring-1 ring-border backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get directions
                  </a>
                )}
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-xl border bg-muted/30 shadow-[var(--shadow-soft)]"
                aria-label="Map placeholder"
              >
                <div
                  className="relative h-[260px] w-full md:h-[300px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
                    backgroundSize: "32px 32px, 32px 32px",
                  }}
                >
                  {/* Decorative roads */}
                  <svg
                    className="absolute inset-0 h-full w-full text-muted-foreground/30"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M -20 220 Q 100 180 200 200 T 420 160"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 60 -20 Q 140 80 180 150 T 240 320"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <path
                      d="M 420 40 Q 320 90 280 160 T 200 320"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                  </svg>

                  {/* Preview badge */}
                  <div className="absolute end-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border backdrop-blur">
                    Preview
                  </div>

                  {/* Pulsing pin */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
                      <span className="absolute inline-flex h-7 w-7 rounded-full bg-primary/20" />
                      <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                        <MapPin className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  {/* Floating info card */}
                  {(storeName || s?.address) && (
                    <div className="absolute bottom-3 start-3 max-w-[75%] rounded-xl border bg-background/95 p-3 shadow-md backdrop-blur">
                      {storeName && (
                        <p className="truncate text-xs font-semibold">{storeName}</p>
                      )}
                      {s?.address && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {s.address}
                        </p>
                      )}
                      {directionsHref && (
                        <a
                          href={directionsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          <Navigation className="h-3 w-3" />
                          Get directions
                        </a>
                      )}
                    </div>
                  )}

                  {!s?.address && !storeName && (
                    <div className="absolute bottom-3 start-3 end-3 rounded-lg bg-background/90 p-2.5 text-center text-[11px] text-muted-foreground ring-1 ring-border backdrop-blur">
                      Add a Google Maps embed URL in settings to display a real map.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Socials */}
            {visibleSocials.length > 0 && (
              <div className="rounded-xl border bg-card p-3.5 shadow-[var(--shadow-soft)]">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  Follow us
                </p>
                <div className="flex flex-wrap gap-2">
                  {visibleSocials.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft hover:text-primary hover:shadow-sm"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
