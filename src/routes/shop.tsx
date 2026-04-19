import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["new", "asc", "desc"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  component: ShopPage,
});

function ShopPage() {
  const { tr, lang } = useLang();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  const { q = "", category = "all", sort = "new" } = search;

  const cats = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["shop-products", q, category, sort],
    queryFn: async () => {
      let qry = supabase.from("products").select("*, categories(slug, name_en, name_fa, name_ps)");
      if (category && category !== "all") {
        const cat = cats.data?.find((c) => c.slug === category);
        if (cat) qry = qry.eq("category_id", cat.id);
      }
      if (q) {
        qry = qry.or(`name_en.ilike.%${q}%,name_fa.ilike.%${q}%,name_ps.ilike.%${q}%`);
      }
      if (sort === "asc") qry = qry.order("price", { ascending: true });
      else if (sort === "desc") qry = qry.order("price", { ascending: false });
      else qry = qry.order("created_at", { ascending: false });
      const { data, error } = await qry;
      if (error) throw error;
      return data;
    },
    enabled: !cats.isLoading,
  });

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{tr("shop")}</h1>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tr("search")}
              value={q}
              onChange={(e) => navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, q: e.target.value || undefined }) })}
              className="ps-9"
            />
          </div>
          <Select
            value={category}
            onValueChange={(v) => navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, category: v === "all" ? undefined : v }) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("filterAll")}</SelectItem>
              {cats.data?.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{pickLang(c, "name", lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => navigate({ search: (p: z.infer<typeof searchSchema>) => ({ ...p, sort: v as "new" | "asc" | "desc" }) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{tr("newest")}</SelectItem>
              <SelectItem value="asc">{tr("priceLowHigh")}</SelectItem>
              <SelectItem value="desc">{tr("priceHighLow")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : products.data && products.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">{tr("noProducts")}</p>
        )}
      </section>
    </SiteLayout>
  );
}
