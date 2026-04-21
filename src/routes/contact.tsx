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
  };
  const infoTiles: InfoTile[] = [];
  if (wa) infoTiles.push({ href: `https://wa.me/${wa.replace(/[^\d]/g, "")}`, icon: WhatsAppIcon, label: "WhatsApp", value: wa });
  if (wa2) infoTiles.push({ href: `https://wa.me/${wa2.replace(/[^\d]/g, "")}`, icon: WhatsAppIcon, label: "WhatsApp 2", value: wa2 });
  if (s?.phone) infoTiles.push({ href: `tel:${s.phone}`, icon: Phone, label: tr("phone"), value: s.phone });
  if (s?.email) infoTiles.push({ href: `mailto:${s.email}`, icon: Mail, label: tr("email"), value: s.email });
  if (s?.address) infoTiles.push({ icon: MapPin, label: "Address", value: s.address, wide: true });
  if (s?.business_hours) infoTiles.push({ icon: Clock, label: "Hours", value: s.business_hours, wide: true });

  const storeName = s ? pickLang(s, "store_name", lang) : "";
  const directionsHref = s?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
    : null;
  const hasEmbed = !!(s?.google_maps_embed_url && /^https:\/\/www\.google\.com\/maps\/embed/.test(s.google_maps_embed_url));
  const replyHelper = s?.business_hours
    ? `We usually reply during ${s.business_hours}.`
    : "We usually reply within a few hours.";

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">{pageTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{tr("contactFormIntro")}</p>
        </header>

        {pageContent && (
          <div
            className="prose mb-6 max-w-none prose-headings:font-semibold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: form */}
          <Card className="p-5 md:p-6 lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold">{tr("sendMessage")}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="cf-name" className="mb-1.5 block">{tr("yourName")} *</Label>
                <Input id="cf-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={100} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cf-phone" className="mb-1.5 block">{tr("yourPhone")}</Label>
                  <Input id="cf-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="cf-email" className="mb-1.5 block">{tr("yourEmail")}</Label>
                  <Input id="cf-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} maxLength={255} />
                </div>
              </div>
              <div>
                <Label htmlFor="cf-message" className="mb-1.5 block">{tr("yourMessage")} *</Label>
                <Textarea id="cf-message" rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} maxLength={1000} required />
                <div className="mt-1 text-right text-xs text-muted-foreground">{form.message.length}/1000</div>
              </div>
              <Button type="submit" size="lg" className="w-full gap-2 sm:w-auto sm:px-8" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {tr("sendMessage")}
              </Button>
            </form>
          </Card>

          {/* Right: info panel + map + socials */}
          <div className="space-y-4 lg:col-span-2">
            {infoTiles.length > 0 && (
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {infoTiles.map((t, i) => {
                    const Icon = t.icon;
                    const inner = (
                      <div className="flex min-h-[56px] items-center gap-3 p-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
                          <p className="truncate text-sm font-semibold">{t.value}</p>
                        </div>
                      </div>
                    );
                    return (
                      <li key={i}>
                        {t.href ? (
                          <a href={t.href} target={t.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block transition-colors hover:bg-muted/50">
                            {inner}
                          </a>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {s?.google_maps_embed_url && /^https:\/\/www\.google\.com\/maps\/embed/.test(s.google_maps_embed_url) ? (
              <div className="overflow-hidden rounded-xl border shadow-[var(--shadow-soft)]">
                <iframe
                  src={s.google_maps_embed_url}
                  title="Map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="h-[220px] w-full border-0 md:h-[280px]"
                />
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-xl border bg-muted/30 shadow-[var(--shadow-soft)]"
                aria-label="Map placeholder"
              >
                <div
                  className="h-[220px] w-full md:h-[280px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
                    backgroundSize: "32px 32px, 32px 32px",
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <MapIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold">Map preview</p>
                    <p className="px-6 text-xs text-muted-foreground">
                      Add a Google Maps embed URL in settings to display the map here.
                    </p>
                  </div>
                  <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20" />
                </div>
              </div>
            )}

            {visibleSocials.length > 0 && (
              <div className="rounded-xl border bg-card p-3.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Follow us</p>
                <div className="flex flex-wrap gap-2">
                  {visibleSocials.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
