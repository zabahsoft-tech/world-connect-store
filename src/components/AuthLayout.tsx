import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "./LangSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { pickLang } from "@/lib/i18n";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { lang } = useLang();
  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });
  const s = settingsQ.data;
  const storeName = s ? pickLang(s, "store_name", lang) || "Store" : "Store";
  const tagline = s ? pickLang(s, "meta_description", lang) : "";

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Branded panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground lg:w-1/2 lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary-foreground/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/20 blur-3xl" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-3">
          {s?.logo_url ? (
            <img src={s.logo_url} alt={storeName} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm font-bold">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xl font-bold">{storeName}</span>
        </Link>

        <div className="relative z-10 hidden lg:block">
          <h2 className="text-4xl font-bold leading-tight">
            Welcome to {storeName}
          </h2>
          {tagline && (
            <p className="mt-4 max-w-md text-lg text-primary-foreground/90">{tagline}</p>
          )}

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-foreground/20 p-2 backdrop-blur-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Fast & easy ordering</p>
                <p className="text-sm text-primary-foreground/80">Browse and order in seconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-foreground/20 p-2 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Secure & trusted</p>
                <p className="text-sm text-primary-foreground/80">Your data stays protected.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-foreground/20 p-2 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Quality products</p>
                <p className="text-sm text-primary-foreground/80">Curated for you.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden text-sm text-primary-foreground/70 lg:block">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col bg-background">
        <div className="absolute end-4 top-4 z-10">
          <LangSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
