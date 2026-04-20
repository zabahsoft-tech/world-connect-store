import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, User as UserIcon, LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { NavSearch } from "./NavSearch";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { LangSwitcher } from "./LangSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { pickLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header() {
  const { tr, lang } = useLang();
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });
  const s = settingsQ.data;
  const storeName = s ? pickLang(s, "store_name", lang) || "Store" : "Store";

  const navPagesQ = useQuery({
    queryKey: ["nav-pages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("slug,title_en,title_fa,title_ps,show_in_nav,is_published,sort_order")
        .eq("is_published", true)
        .eq("show_in_nav", true)
        .order("sort_order")
        .order("title_en");
      return data ?? [];
    },
  });

  const baseLinks = [
    { to: "/", label: tr("home") },
    { to: "/shop", label: tr("shop") },
    { to: "/categories", label: tr("categories") },
    { to: "/blog", label: tr("blog") },
    { to: "/about", label: tr("about") },
    { to: "/contact", label: tr("contact") },
  ];
  const staticSlugs = new Set(["about", "contact"]);
  const dynamicLinks = (navPagesQ.data ?? [])
    .filter((p) => !staticSlugs.has(p.slug))
    .map((p) => ({
      to: `/p/${p.slug}`,
      label: pickLang(p, "title", lang) || p.slug,
    }));
  const links = [...baseLinks, ...dynamicLinks];

  const initials = (user?.email ?? "?").charAt(0).toUpperCase();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) || user?.email || "";

  const navLinkBase =
    "group relative rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/85 transition-all hover:text-primary-foreground";
  const navLinkActive =
    "rounded-md px-3 py-2 text-sm font-semibold text-primary-foreground bg-white/15";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full text-primary-foreground transition-all duration-300",
        scrolled
          ? "shadow-[var(--shadow-nav)] backdrop-blur-md"
          : "shadow-none",
      )}
      style={{ backgroundImage: "var(--gradient-nav)" }}
    >
      {/* subtle top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div
        className={cn(
          "container mx-auto flex items-center justify-between gap-4 px-4 transition-all duration-300",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 group">
          {s?.logo_url ? (
            <img
              src={s.logo_url}
              alt={storeName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20 transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 text-primary-foreground text-lg font-bold transition-transform group-hover:scale-105">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xl font-bold tracking-tight">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to as string}
              className={navLinkBase}
              activeProps={{ className: navLinkActive }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
              {/* hover underline */}
              <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-white/80 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LangSwitcher />

          <NavSearch className="hidden md:block w-56 lg:w-72" />

          <Link to="/cart" aria-label="Cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-white/15 hover:text-primary-foreground text-primary-foreground/90"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <Badge className="absolute -end-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs bg-white text-primary hover:bg-white shadow-sm ring-2 ring-primary/40 animate-in zoom-in-50">
                  {count}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/15 hover:text-primary-foreground"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-white/30 transition-all hover:ring-white/60">
                    <AvatarFallback className="bg-white/20 text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                    {user.email && displayName !== user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="me-2 h-4 w-4" />
                      Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="me-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-white/15 hover:text-primary-foreground text-primary-foreground"
              >
                <LogIn className="h-4 w-4" />
                <span>{tr("login")}</span>
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-white/15 hover:text-primary-foreground text-primary-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* bottom hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {open && (
        <nav className="border-t border-white/10 bg-background md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            <NavSearch variant="panel" className="mb-2" onNavigate={() => setOpen(false)} />
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to as string}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                activeProps={{ className: "rounded-md px-3 py-2.5 text-sm font-semibold text-primary bg-accent" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserIcon className="me-2 inline h-4 w-4" />
                {tr("login")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
