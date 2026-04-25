import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { cn, mainImage } from "@/lib/utils";

interface NavSearchProps {
  className?: string;
  variant?: "navbar" | "panel";
  onNavigate?: () => void;
}

export function NavSearch({ className, variant = "navbar", onNavigate }: NavSearchProps) {
  const { tr, lang } = useLang();
  const navigate = useNavigate();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Close on route change
  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      setOpen(false);
    });
    return unsub;
  }, [router]);

  const enabled = debounced.length >= 2;
  const suggestQ = useQuery({
    queryKey: ["nav-search", debounced],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const term = debounced.replace(/[%,]/g, "");
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name_en, name_fa, name_ps, images, price")
        .or(`name_en.ilike.%${term}%,name_fa.ilike.%${term}%,name_ps.ilike.%${term}%`)
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = suggestQ.data ?? [];

  const submitSearch = (term: string) => {
    const value = term.trim();
    if (!value) return;
    setOpen(false);
    onNavigate?.();
    navigate({ to: "/shop", search: { q: value } });
  };

  const goToProduct = (slug: string) => {
    setOpen(false);
    onNavigate?.();
    navigate({ to: "/products/$slug", params: { slug } });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && results[highlight]) {
        goToProduct(results[highlight].slug);
      } else {
        submitSearch(q);
      }
    }
  };

  const isPanel = variant === "panel";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(q);
        }}
        className="relative"
      >
        <Search
          className={cn(
            "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2",
            isPanel ? "text-muted-foreground" : "text-primary-foreground/70 peer-focus:text-muted-foreground",
          )}
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tr("search")}
          aria-label={tr("search")}
          className={cn(
            "peer h-9 w-full rounded-md border ps-9 pe-9 text-sm outline-none transition-colors",
            "focus:bg-background focus:text-foreground focus:placeholder:text-muted-foreground focus:border-input focus:ring-2 focus:ring-white/40",
            isPanel
              ? "bg-background text-foreground border-input placeholder:text-muted-foreground"
              : "bg-white/15 text-primary-foreground placeholder:text-primary-foreground/70 border-white/20 hover:bg-white/20",
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setDebounced("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear"
            className={cn(
              "absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors",
              isPanel ? "text-muted-foreground hover:text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground peer-focus:text-muted-foreground peer-focus:hover:text-foreground",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {open && enabled && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
          {suggestQ.isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {tr("noProducts")}
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((p, i) => {
                const name = pickLang(p, "name", lang) || p.slug;
                const img = mainImage(p.images);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => goToProduct(p.slug)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-start transition-colors",
                        highlight === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                      )}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {img ? (
                          <img
                            src={img}
                            alt={name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          {Number(p.price).toLocaleString()}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            to="/shop"
            search={{ q: debounced }}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block border-t border-border bg-muted/40 px-3 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted"
          >
            {`→ "${debounced}"`}
          </Link>
        </div>
      )}
    </div>
  );
}
