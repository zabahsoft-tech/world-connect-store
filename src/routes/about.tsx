import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { tr, lang } = useLang();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const about = settings.data ? pickLang(settings.data, "about", lang) : "";
  const name = settings.data ? pickLang(settings.data, "store_name", lang) : "";

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold">{tr("about")}</h1>
        {name && <h2 className="mb-4 text-2xl font-semibold text-primary">{name}</h2>}
        <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
          {about || tr("heroSubtitle")}
        </p>
      </section>
    </SiteLayout>
  );
}
