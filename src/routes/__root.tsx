import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import appCss from "../styles.css?url";
import { LangProvider } from "@/contexts/LangContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { NotFoundState } from "@/components/ErrorState";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Store — Order on WhatsApp" },
      { name: "description", content: "Modern multilingual store. Order in English, Persian, or Pashto via WhatsApp." },
      { property: "og:title", content: "Store — Order on WhatsApp" },
      { property: "og:description", content: "Modern multilingual store. Order in English, Persian, or Pashto via WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Store — Order on WhatsApp" },
      { name: "twitter:description", content: "Modern multilingual store. Order in English, Persian, or Pashto via WhatsApp." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69adf668-a7ab-45da-b59e-61c6c791196b/id-preview-e83e5e6c--2859184a-8db2-499b-a042-9af03cc7e504.lovable.app-1776572666693.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69adf668-a7ab-45da-b59e-61c6c791196b/id-preview-e83e5e6c--2859184a-8db2-499b-a042-9af03cc7e504.lovable.app-1776572666693.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Vazirmatn:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <SiteLayout>
      <NotFoundState />
    </SiteLayout>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <Outlet />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
