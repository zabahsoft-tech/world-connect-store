import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, SearchX, ShieldAlert, Home, ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BaseProps {
  className?: string;
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}

interface IconBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "destructive" | "warning";
}

function IconBadge({ icon: Icon, variant = "primary" }: IconBadgeProps) {
  const styles =
    variant === "destructive"
      ? "bg-destructive/10 text-destructive ring-destructive/20"
      : variant === "warning"
        ? "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
        : "bg-primary/10 text-primary ring-primary/20";
  return (
    <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ring-8 ${styles}`}>
      <Icon className="h-10 w-10" />
    </div>
  );
}

/**
 * 404 — Page not found.
 * Use inside a layout (SiteLayout) to render with header/footer.
 */
export function NotFoundState({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has been moved.",
  showShopCta = true,
  className,
}: BaseProps & { title?: string; description?: string; showShopCta?: boolean }) {
  return (
    <section className={`relative flex min-h-[60vh] items-center justify-center px-4 py-16 ${className ?? ""}`}>
      <Backdrop />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <IconBadge icon={SearchX} />
        <p className="mt-6 text-7xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          {showShopCta && (
            <Button asChild variant="outline">
              <Link to="/shop">
                <ShoppingBag className="h-4 w-4" />
                Browse shop
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Generic error boundary UI. Pass `error` and `reset` from errorComponent props.
 */
export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
  description,
  className,
  compact = false,
}: BaseProps & {
  error?: Error;
  reset?: () => void;
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  const desc = description ?? "An unexpected error occurred. Please try again.";

  return (
    <section
      className={`relative flex ${compact ? "min-h-[40vh]" : "min-h-[60vh]"} items-center justify-center px-4 py-16 ${className ?? ""}`}
    >
      <Backdrop />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <IconBadge icon={AlertTriangle} variant="destructive" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        {isDev && error?.message && (
          <pre className="mt-4 max-h-40 w-full overflow-auto rounded-md border border-destructive/20 bg-destructive/5 p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * 403 — Access denied. For admin / protected routes.
 */
export function ForbiddenState({
  title = "Access denied",
  description = "You don't have permission to view this page.",
  className,
}: BaseProps & { title?: string; description?: string }) {
  return (
    <section className={`relative flex min-h-[60vh] items-center justify-center px-4 py-16 ${className ?? ""}`}>
      <Backdrop />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <IconBadge icon={ShieldAlert} variant="warning" />
        <p className="mt-6 text-7xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">403</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
