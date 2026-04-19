import { createFileRoute, Outlet, Link, useRouter, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (isLogin) return;
    if (!user) {
      router.navigate({ to: "/admin/login" });
    }
  }, [user, loading, isLogin, router]);

  if (isLogin) return <Outlet />;

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">Your account does not have admin privileges.</p>
        <Button variant="outline" className="mt-4" onClick={() => signOut()}>Sign out</Button>
        <Link to="/" className="mt-2 text-sm text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: "Products", icon: Package, exact: false },
    { to: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
    { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
  ] as const;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">A</div>
          <span className="font-bold">Admin</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-primary text-primary-foreground" }}
              activeOptions={{ exact: l.exact }}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="border-t pt-3">
          <Link to="/" className="mb-2 block text-xs text-muted-foreground hover:text-primary">← Back to site</Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
