import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, User as UserIcon, LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { useState } from "react";
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

export function Header() {
  const { tr, lang } = useLang();
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground border-b border-primary/30">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          {s?.logo_url ? (
            <img src={s.logo_url} alt={storeName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-primary-foreground font-bold">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-bold">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to as string}
              className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/15 hover:text-primary-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-primary-foreground bg-white/20" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LangSwitcher />
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-white/15 hover:text-primary-foreground">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <Badge className="absolute -end-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs bg-white text-primary hover:bg-white">
                  {count}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/15 hover:text-primary-foreground">
                  <Avatar className="h-8 w-8">
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
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span>{tr("login")}</span>
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to as string}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-primary bg-accent" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
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
