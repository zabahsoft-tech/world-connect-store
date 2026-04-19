import { useLang } from "@/contexts/LangContext";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Twitter, Youtube, Send } from "lucide-react";
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
  // Custom (non-system) pages live under /p/:slug; "about" and "contact" already have their own routes
  const customPages = (pagesQ.data ?? []).filter((p) => !p.is_system);

  const storeName = s ? pickLang(s, "store_name", lang) || "Store" : "Store";
  const footerText = s ? pickLang(s, "footer_text", lang) : "";
  const tagline = footerText || tr("heroSubtitle");

  const socials: { url: string | null | undefined; icon: typeof Facebook; label: string }[] = [
    { url: s?.facebook_url, icon: Facebook, label: "Facebook" },
    { url: s?.instagram_url, icon: Instagram, label: "Instagram" },
    { url: s?.twitter_url, icon: Twitter, label: "Twitter" },
    { url: s?.youtube_url, icon: Youtube, label: "YouTube" },
    { url: s?.telegram_url, icon: Send, label: "Telegram" },
  ];
  const visibleSocials = socials.filter((x) => x.url && x.url.trim());

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            {s?.logo_url ? (
              <img src={s.logo_url} alt={storeName} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold">{storeName}</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">{tagline}</p>
          {visibleSocials.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              {visibleSocials.map(({ url, icon: Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("shop")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">{tr("shop")}</Link></li>
            <li><Link to="/categories" className="hover:text-primary">{tr("categories")}</Link></li>
            <li><Link to="/cart" className="hover:text-primary">{tr("cart")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("about")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">{tr("about")}</Link></li>
            <li><Link to="/contact" className="hover:text-primary">{tr("contact")}</Link></li>
            {customPages.map((p) => {
              const title = pickLang(p, "title", lang) || p.slug;
              return (
                <li key={p.slug}>
                  <Link to="/p/$slug" params={{ slug: p.slug }} className="hover:text-primary">
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("contactUs")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {s?.email && <li><a href={`mailto:${s.email}`} className="hover:text-primary">{s.email}</a></li>}
            {s?.phone && <li>{s.phone}</li>}
            {s?.address && <li>{s.address}</li>}
            {s?.business_hours && <li className="text-xs">{s.business_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
