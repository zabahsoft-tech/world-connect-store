import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FullScreenLoader } from "@/components/Loader";

/**
 * Page-transition indicator:
 * - Shows a slim animated top progress bar for any in-flight navigation
 * - Falls back to a branded full-screen loader if navigation takes >500ms
 * - Auto-hides instantly when navigation resolves
 */
export function RouteTransition() {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Top bar progress animation
  useEffect(() => {
    if (!isLoading) {
      // Snap to 100% then hide
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 250);
      return () => clearTimeout(t);
    }
    setProgress(15);
    const t1 = setTimeout(() => setProgress(45), 100);
    const t2 = setTimeout(() => setProgress(70), 350);
    const t3 = setTimeout(() => setProgress(85), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLoading]);

  // Full-screen loader after 500ms threshold
  useEffect(() => {
    if (!isLoading) {
      setShowFullScreen(false);
      return;
    }
    const t = setTimeout(() => setShowFullScreen(true), 500);
    return () => clearTimeout(t);
  }, [isLoading]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
        style={{ opacity: progress > 0 ? 1 : 0, transition: "opacity 200ms ease" }}
      >
        <div
          className="h-full bg-primary shadow-[0_0_8px_var(--primary)]"
          style={{
            width: `${progress}%`,
            transition: progress === 100 ? "width 200ms ease" : "width 400ms cubic-bezier(0.1, 0.7, 0.1, 1)",
          }}
        />
      </div>
      {showFullScreen && <FullScreenLoader />}
    </>
  );
}
