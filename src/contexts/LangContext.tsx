import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, dirOf, t, tr } from "@/lib/i18n";

interface LangContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  tr: (key: keyof typeof t) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "app_lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "en" || stored === "fa" || stored === "ps") {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dirOf(lang);

      // Sync content-language meta tag for SEO
      let metaTag = document.querySelector('meta[http-equiv="content-language"]');
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("http-equiv", "content-language");
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", lang);
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LangContext.Provider
      value={{
        lang,
        dir: dirOf(lang),
        setLang,
        tr: (key) => tr(key, lang),
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
