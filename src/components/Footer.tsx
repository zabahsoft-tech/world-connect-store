import { useLang } from "@/contexts/LangContext";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Send,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";
import { pickLang } from "@/lib/i18n";

export function Footer() {
  const { tr, lang } = useLang();

  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });
  const s = settingsQ.data;

  const pagesQ = useQuery({
    queryKey: ["pages-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("slug, title_en, title_fa, title_ps, is_system, sort_order")
        .eq("is_published", true)
        .order("sort_order");
      return data ?? [];
    },
  });
  const customPages = (pagesQ.data ?? []).filter((p) => !p.is_system);

  const storeName = s ? pickLang(s, "store_name", lang) || "Store" : "Store";
  const footerText = s ? pickLang(s, "footer_text", lang) : "";
  const tagline = footerText || tr("heroSubtitle");

  const address = s
    ? (lang === "en"
        ? s.address
        : (lang === "fa" ? s.address_fa : s.address_ps) || s.address)
    : null;

  const socials: { url: string | null | undefined; icon: typeof Facebook; label: string }[] = [
    { url: s?.facebook_url, icon: Facebook, label: "Facebook" },
    { url: s?.instagram_url, icon: Instagram, label: "Instagram" },
    { url: s?.twitter_url, icon: Twitter, label: "Twitter" },
    { url: s?.youtube_url, icon: Youtube, label: "YouTube" },
    { url: s?.telegram_url, icon: Send, label: "Telegram" },
  ];
  const visibleSocials = socials.filter((x) => x.url && x.url.trim());

  const trustItems: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    iconClassName?: string;
    tileClassName?: string;
  }[] = [
    { icon: ShoppingBag, label: tr("easyOrderingDesc") },
    { icon: Truck, label: tr("fastDeliveryDesc") },
    {
      icon: WhatsAppIcon,
      label: tr("whatsappSupportDesc"),
      iconClassName: "h-4 w-4 text-[#25D366]",
      tileClassName: "bg-[#25D366]/10 text-[#25D366]",
    },
  ];

  const linkClass =
    "group inline-flex items-center gap-1 hover:text-primary transition-colors";
  const chevronClass =
    "h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-180";

  return (
    <footer className="mt-16 relative">
      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="bg-gradient-to-b from-muted/30 to-muted/60 border-t">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              {s?.logo_url ? (
                <img src={s.logo_url} alt={storeName} className="h-10 w-10 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-bold tracking-tight">{storeName}</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3 max-w-xs">{tagline}</p>
            {visibleSocials.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {visibleSocials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-primary">•</span> {tr("shop")}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/shop" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("shop")}</span>
                </Link>
              </li>
              <li>
                <Link to="/categories" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("categories")}</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("cart")}</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("blog")}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-primary">•</span> {tr("about")}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("about")}</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkClass}>
                  <ChevronRight className={chevronClass} />
                  <span>{tr("contact")}</span>
                </Link>
              </li>
              {customPages.map((p) => {
                const title = pickLang(p, "title", lang) || p.slug;
                return (
                  <li key={p.slug}>
                    <Link to="/p/$slug" params={{ slug: p.slug }} className={linkClass}>
                      <ChevronRight className={chevronClass} />
                      <span>{title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-4 flex items-center gap-1.5 text-sm font-semibold">
              <span className="text-primary">•</span> {tr("contactUs")}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {s?.email && (
                <li>
                  <a href={`mailto:${s.email}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span className="break-all">{s.email}</span>
                  </a>
                </li>
              )}
              {s?.phone && (
                <li>
                  <a href={`tel:${s.phone}`} className="flex items-start gap-2 hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                    <span dir="ltr">{s.phone}</span>
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span>{address}</span>
                </li>
              )}
              {s?.business_hours && (
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                  <span className="text-xs">{s.business_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Trust strip */}
        <div className="container mx-auto px-4 pb-6">
          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-background/60 p-4 md:grid-cols-3">
            {trustItems.map(({ icon: Icon, label, iconClassName, tileClassName }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tileClassName ?? "bg-primary/10 text-primary"}`}
                >
                  <Icon className={iconClassName ?? "h-4 w-4"} />
                </div>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t bg-background/40">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
            <p className="text-center md:text-start">
              © {new Date().getFullYear()} {storeName}. {tr("allRightsReserved")}
            </p>
            <p className="text-center md:text-end">
              {tr("developedBy")}{" "}
              <a
                href="https://zabahsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                zabahsoft.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
