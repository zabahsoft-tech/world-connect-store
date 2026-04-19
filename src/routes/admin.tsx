import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Settings, LogOut, Home } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (loading || isLogin) return;
    if (!user) router.navigate({ to: "/admin/login" });
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

  const current = NAV.find((n) => (n.exact ? path === n.to : path.startsWith(n.to)));
  const title = current?.label ?? "Admin";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b">
            <Link to="/admin" className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">A</div>
              <span className="font-bold group-data-[collapsible=icon]:hidden">Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((l) => {
                    const active = l.exact ? path === l.to : path.startsWith(l.to);
                    return (
                      <SidebarMenuItem key={l.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={l.label}>
                          <Link to={l.to}>
                            <l.icon className="h-4 w-4" />
                            <span>{l.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to site">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>Back to site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()} tooltip="Sign out">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">{title}</h1>
          </header>
          <main className="flex-1 overflow-x-auto bg-muted/30 p-4 md:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
