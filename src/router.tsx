import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SiteLayout } from "./components/SiteLayout";
import { ErrorState } from "./components/ErrorState";
import { Loader } from "./components/Loader";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <SiteLayout>
      <ErrorState error={error} reset={reset} />
    </SiteLayout>
  );
}

function DefaultPendingComponent() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader />
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    // Aggressive preloading on hover/focus for instant navigation
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    // Avoid spinner flash on quick loads; min display time prevents jank
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
    defaultErrorComponent: DefaultErrorComponent,
    defaultPendingComponent: DefaultPendingComponent,
  });

  return router;
};
