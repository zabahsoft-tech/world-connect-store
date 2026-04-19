import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Optional message shown under the spinner */
  label?: string;
  /** Visual size of the spinner */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Inline branded spinner — three pulsing concentric rings in the primary color.
 * Use inside cards, buttons, or any container.
 */
export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-16 w-16" : "h-10 w-10";
  return (
    <div className={cn("relative", dim, className)} role="status" aria-label="Loading">
      <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary" />
      <span
        className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-primary/60"
        style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
      />
    </div>
  );
}

/**
 * Inline loader — spinner + optional label, centered in its parent.
 */
export function Loader({ label, size = "md", className }: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <Spinner size={size} />
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}

/**
 * Full-screen branded loader. Shows the store logo (from settings) in the center
 * with an animated ring around it and an optional status label below.
 * Use for top-level route guards, auth bootstrap, and full-page transitions.
 */
export function FullScreenLoader({ label }: { label?: string }) {
  const { lang } = useLang();
  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
    staleTime: 5 * 60_000,
  });
  const s = settingsQ.data;
  const storeName = s ? pickLang(s, "store_name", lang) || "Store" : "Store";
  const initial = storeName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Soft branded backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo + animated rings */}
        <div className="relative h-24 w-24">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary" />
          <span
            className="absolute -inset-2 animate-spin rounded-full border-2 border-transparent border-b-primary/40"
            style={{ animationDuration: "2.5s", animationDirection: "reverse" }}
          />
          <div className="absolute inset-2 flex items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-lg">
            {s?.logo_url ? (
              <img src={s.logo_url} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{initial}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-base font-semibold tracking-tight">{storeName}</p>
          <p className="text-sm text-muted-foreground animate-pulse">{label ?? "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}
