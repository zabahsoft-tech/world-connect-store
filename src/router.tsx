import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SiteLayout } from "./components/SiteLayout";
import { ErrorState } from "./components/ErrorState";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <SiteLayout>
      <ErrorState error={error} reset={reset} />
    </SiteLayout>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
