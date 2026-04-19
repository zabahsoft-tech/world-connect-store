import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  FolderTree,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const [products, featured, categories, orders, ordersWeek, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("featured", true),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        products: products.count ?? 0,
        featured: featured.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
        ordersWeek: ordersWeek.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const revenueQuery = useQuery({
    queryKey: ["admin-revenue-7d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 6 * 86400000);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("total, created_at, status")
        .gte("created_at", since.toISOString())
        .neq("status", "cancelled");
      if (error) throw error;

      const buckets: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = { revenue: 0, orders: 0 };
      }
      for (const o of data ?? []) {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        if (buckets[key]) {
          buckets[key].revenue += Number(o.total) || 0;
          buckets[key].orders += 1;
        }
      }
      const series = Object.entries(buckets).map(([date, v]) => ({
        date,
        label: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
        revenue: Number(v.revenue.toFixed(2)),
        orders: v.orders,
      }));
      const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
      const totalOrders = series.reduce((s, p) => s + p.orders, 0);
      return { series, totalRevenue, totalOrders };
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
        .select("id, slug, name_en, image_url, price")
        .eq("in_stock", false)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const topCategories = useQuery({
    queryKey: ["admin-top-categories"],
    queryFn: async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("id, name_en, slug"),
        supabase.from("products").select("category_id"),
      ]);
      const counts = new Map<string, number>();
      for (const p of prods ?? []) {
        if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
      }
      const rows = (cats ?? [])
        .map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const max = Math.max(1, ...rows.map((r) => r.count));
      return { rows, max };
    },
  });

  const restock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ in_stock: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked in stock");
      qc.invalidateQueries({ queryKey: ["admin-low-stock"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cards = [
    {
      label: "Products",
      value: stats.data?.products,
      sub: stats.data ? `${stats.data.featured} featured` : null,
      icon: Package,
      tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      to: "/admin/products" as const,
    },
    {
      label: "Categories",
      value: stats.data?.categories,
      sub: "Browse taxonomy",
      icon: FolderTree,
      tile: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      to: "/admin/categories" as const,
    },
    {
      label: "Orders",
      value: stats.data?.orders,
      sub: stats.data ? `${stats.data.ordersWeek} this week` : null,
      icon: ShoppingBag,
      tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      to: "/admin/orders" as const,
    },
    {
      label: "Pending",
      value: stats.data?.pending,
      sub: stats.data && stats.data.pending > 0 ? "Needs attention" : "All clear",
      icon: Clock,
      tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      to: "/admin/orders" as const,
      warn: !!(stats.data && stats.data.pending > 0),
    },
  ];

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" =>
    s === "pending" ? "default" : s === "completed" ? "secondary" : s === "cancelled" ? "destructive" : "outline";

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {today}
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {getGreeting()}
              {user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
            </h2>
            <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/orders" })}>
              <ShoppingBag className="me-2 h-4 w-4" /> View orders
            </Button>
            <Button onClick={() => navigate({ to: "/admin/products" })}>
              <Plus className="me-2 h-4 w-4" /> New product
            </Button>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div
                className={`absolute inset-x-0 top-0 h-0.5 ${c.warn ? "bg-amber-500" : "bg-gradient-to-r from-primary/60 to-primary/20"}`}
              />
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.tile}`}>
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
              {stats.isLoading ? (
                <Skeleton className="mt-3 h-9 w-20" />
              ) : (
                <p className="mt-3 text-3xl font-bold tabular-nums">{c.value ?? 0}</p>
              )}
              {c.sub && (
                <p className={`mt-1 text-xs ${c.warn ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {c.sub}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue — last 7 days
            </h3>
            <p className="text-xs text-muted-foreground">Daily totals (excludes cancelled orders)</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              {revenueQuery.isLoading ? (
                <Skeleton className="mt-1 h-6 w-24" />
              ) : (
                <p className="text-xl font-bold tabular-nums">
                  {(revenueQuery.data?.totalRevenue ?? 0).toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              {revenueQuery.isLoading ? (
                <Skeleton className="mt-1 h-6 w-12" />
              ) : (
                <p className="text-xl font-bold tabular-nums">{revenueQuery.data?.totalOrders ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        {revenueQuery.isLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={revenueQuery.data?.series ?? []} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} width={40} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#rev)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </Card>

      {/* Recent orders + Out of stock */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Recent orders
            </h3>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {recentOrders.data && recentOrders.data.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
          )}
          <ul className="space-y-2">
            {recentOrders.data?.map((o) => (
              <li key={o.id}>
                <Link
                  to="/admin/orders"
                  className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{o.customer_name}</span>
                      <span className="text-xs text-muted-foreground">#{shortId(o.id)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 ps-2">
                    <span className="font-semibold tabular-nums">{Number(o.total).toFixed(2)}</span>
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </div>
                </Link>
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
          {lowStock.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}
          {lowStock.data && lowStock.data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm text-muted-foreground">All products in stock 🎉</p>
            </div>
          )}
          <ul className="space-y-2">
            {lowStock.data?.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name_en}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{Number(p.price).toFixed(2)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restock.isPending}
                  onClick={() => restock.mutate(p.id)}
                >
                  Restock
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top categories */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Top categories
          </h3>
          <Link to="/admin/categories" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {topCategories.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        )}
        {topCategories.data && topCategories.data.rows.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No categories yet.</p>
        )}
        <ul className="space-y-3">
          {topCategories.data?.rows.map((c) => (
            <li key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.name_en}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{c.count} products</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{ width: `${(c.count / topCategories.data!.max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
