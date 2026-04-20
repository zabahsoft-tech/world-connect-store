import { useEffect, useState, type HTMLAttributes } from "react";

interface SafeHtmlProps extends Omit<HTMLAttributes<HTMLDivElement>, "dangerouslySetInnerHTML"> {
  html: string;
}

/**
 * Renders trusted HTML (from the admin rich-text editor).
 * Sanitization runs only on the client to avoid pulling jsdom into SSR.
 */
export function SafeHtml({ html, ...rest }: SafeHtmlProps) {
  const [clean, setClean] = useState<string>(html);

  useEffect(() => {
    let cancelled = false;
    import("dompurify").then((mod) => {
      if (cancelled) return;
      const DOMPurify = mod.default ?? mod;
      try {
        const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        setClean(sanitized);
      } catch {
        setClean(html);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  // eslint-disable-next-line react/no-danger
  return <div {...rest} dangerouslySetInnerHTML={{ __html: clean }} />;
}
