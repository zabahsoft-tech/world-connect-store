import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, MessageCircle, Clock, Facebook, Instagram, Twitter, Youtube, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
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
  const greeting = { en: "Hi! I have a question.", fa: "سلام! یک سوال دارم.", ps: "سلام! یوه پوښتنه لرم." }[lang];

  const pageTitle = page ? pickLang(page, "title", lang) : tr("contactUs");
  const pageContent = page ? pickLang(page, "content", lang) : "";

  const socials: { url: string | null | undefined; icon: typeof Facebook; label: string }[] = [
    { url: s?.facebook_url, icon: Facebook, label: "Facebook" },
    { url: s?.instagram_url, icon: Instagram, label: "Instagram" },
    { url: s?.twitter_url, icon: Twitter, label: "Twitter" },
    { url: s?.youtube_url, icon: Youtube, label: "YouTube" },
    { url: s?.telegram_url, icon: Send, label: "Telegram" },
  ];
  const visibleSocials = socials.filter((x) => x.url && x.url.trim());

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-4 text-4xl font-bold">{pageTitle}</h1>
        {pageContent && (
          <div
            className="prose prose-lg mb-8 max-w-none prose-headings:font-semibold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: pageContent }}
          />
        )}
        <div className="space-y-4">
          {wa && (
            <a href={`https://wa.me/${wa.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-semibold">{wa}</p>
              </div>
            </a>
          )}
          {wa2 && (
            <a href={`https://wa.me/${wa2.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp (alt)</p>
                <p className="font-semibold">{wa2}</p>
              </div>
            </a>
          )}
          {s?.phone && (
            <a href={`tel:${s.phone}`} className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("phone")}</p>
                <p className="font-semibold">{s.phone}</p>
              </div>
            </a>
          )}
          {s?.email && (
            <a href={`mailto:${s.email}`} className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("email")}</p>
                <p className="font-semibold">{s.email}</p>
              </div>
            </a>
          )}
          {s?.address && (
            <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-semibold">{s.address}</p>
              </div>
            </div>
          )}
          {s?.business_hours && (
            <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Business hours</p>
                <p className="font-semibold">{s.business_hours}</p>
              </div>
            </div>
          )}
        </div>

        {visibleSocials.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">Follow us</p>
            <div className="flex flex-wrap gap-2">
              {visibleSocials.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {wa && (
          <Button size="lg" className="mt-8 w-full gap-2" onClick={() => openWhatsApp(wa, greeting)}>
            <MessageCircle className="h-5 w-5" />
            {tr("send")} WhatsApp
          </Button>
        )}
      </section>
    </SiteLayout>
  );
}
