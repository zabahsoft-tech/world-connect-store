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
import { RouteTransition } from "@/components/RouteTransition";
import {
  buildMeta,
  buildHreflangLinks,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  jsonLdScript,
  getPageSeo,
  SITE_URL,
} from "@/lib/seo";

const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69adf668-a7ab-45da-b59e-61c6c791196b/id-preview-e83e5e6c--2859184a-8db2-499b-a042-9af03cc7e504.lovable.app-1776572666693.png";

export const Route = createRootRoute({
  head: () => {
    const seo = getPageSeo("home", "en");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...buildMeta({
          title: seo.title,
          description: seo.description,
          image: OG_IMAGE,
          url: SITE_URL,
          lang: "en",
          keywords: seo.keywords,
        }),
        // Multilingual hint tags so crawlers see all three titles/descriptions
        { property: "og:title:fa", content: getPageSeo("home", "fa").title },
        { property: "og:description:fa", content: getPageSeo("home", "fa").description },
        { property: "og:title:ps", content: getPageSeo("home", "ps").title },
        { property: "og:description:ps", content: getPageSeo("home", "ps").description },
        { httpEquiv: "content-language", content: "en, fa, ps" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        // Preconnect to Supabase + R2 image CDN for faster first paint
        { rel: "preconnect", href: "https://kqfdaqggrxflrticxisu.supabase.co", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://kqfdaqggrxflrticxisu.supabase.co" },
        { rel: "preconnect", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Vazirmatn:wght@400;600;700&display=swap",
        },
        { rel: "alternate", type: "application/rss+xml", title: "World Connect Store Blog", href: `${SITE_URL}/rss.xml` },
        ...buildHreflangLinks("/"),
      ],
      scripts: [
        jsonLdScript(buildOrganizationJsonLd({ url: SITE_URL, logo: OG_IMAGE })),
        jsonLdScript(buildWebsiteJsonLd()),
      ],
    };
  },
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
    defaultOptions: {
      queries: {
        // Marketing data (settings, categories, slides) rarely changes — cache aggressively
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <RouteTransition />
            <Outlet />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
