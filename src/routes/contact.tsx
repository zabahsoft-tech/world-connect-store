import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { tr, lang } = useLang();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const wa = settings.data?.whatsapp_number;
  const greeting = { en: "Hi! I have a question.", fa: "سلام! یک سوال دارم.", ps: "سلام! یوه پوښتنه لرم." }[lang];

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold">{tr("contactUs")}</h1>
        <div className="space-y-4">
          {wa && (
            <a href={`https://wa.me/${wa.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-semibold">{wa}</p>
              </div>
            </a>
          )}
          {settings.data?.email && (
            <a href={`mailto:${settings.data.email}`} className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:border-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("email")}</p>
                <p className="font-semibold">{settings.data.email}</p>
              </div>
            </a>
          )}
          {settings.data?.address && (
            <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-semibold">{settings.data.address}</p>
              </div>
            </div>
          )}
        </div>

        {wa && (
          <Button size="lg" className="mt-8 w-full gap-2" onClick={() => openWhatsApp(wa, greeting)}>
            <MessageCircle className="h-5 w-5" />
            {tr("send")} WhatsApp
          </Button>
        )}
      </section>
    </SiteLayout>
  );
}
