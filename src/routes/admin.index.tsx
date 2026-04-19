import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, FolderTree, ShoppingBag, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, categories, orders, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const recentOrders = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const lowStock = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name_en, image_url")
        .eq("in_stock", false)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Products", value: stats.data?.products, icon: Package, color: "text-blue-500", to: "/admin/products" },
    { label: "Categories", value: stats.data?.categories, icon: FolderTree, color: "text-purple-500", to: "/admin/categories" },
    { label: "Orders", value: stats.data?.orders, icon: ShoppingBag, color: "text-green-500", to: "/admin/orders" },
    { label: "Pending", value: stats.data?.pending, icon: Clock, color: "text-primary", to: "/admin/orders" },
  ] as const;

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" =>
    s === "pending" ? "default" : s === "completed" ? "secondary" : s === "cancelled" ? "destructive" : "outline";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-sm text-muted-foreground">A snapshot of your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="mt-3 text-3xl font-bold">{c.value ?? "..."}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {recentOrders.data && recentOrders.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
          <ul className="space-y-2">
            {recentOrders.data?.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{Number(o.total).toFixed(2)}</span>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Out of stock
            </h3>
            <Link to="/admin/products" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {lowStock.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {lowStock.data && lowStock.data.length === 0 && (
            <p className="text-sm text-muted-foreground">All products in stock 🎉</p>
          )}
          <ul className="space-y-2">
            {lowStock.data?.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name_en}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <Badge variant="destructive">Out</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
