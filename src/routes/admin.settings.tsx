import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface SettingsForm {
  id?: string;
  whatsapp_number: string;
  whatsapp_number_2: string;
  phone: string;
  business_hours: string;
  store_name_en: string;
  store_name_fa: string;
  store_name_ps: string;
  email: string;
  address: string;
  google_maps_embed_url: string;
  about_en: string;
  about_fa: string;
  about_ps: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  telegram_url: string;
  footer_text_en: string;
  footer_text_fa: string;
  footer_text_ps: string;
  meta_description_en: string;
  meta_description_fa: string;
  meta_description_ps: string;
}

const empty: SettingsForm = {
  whatsapp_number: "", whatsapp_number_2: "", phone: "", business_hours: "",
  store_name_en: "", store_name_fa: "", store_name_ps: "",
  email: "", address: "", google_maps_embed_url: "",
  about_en: "", about_fa: "", about_ps: "",
  logo_url: "", favicon_url: "", primary_color: "",
  facebook_url: "", instagram_url: "", twitter_url: "", youtube_url: "", telegram_url: "",
  footer_text_en: "", footer_text_fa: "", footer_text_ps: "",
  meta_description_en: "", meta_description_fa: "", meta_description_ps: "",
};

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(empty);
  const set = <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.data) {
      const d = settings.data as Record<string, string | null | undefined> & { id: string };
      setForm({
        id: d.id,
        whatsapp_number: d.whatsapp_number ?? "",
        whatsapp_number_2: d.whatsapp_number_2 ?? "",
        phone: d.phone ?? "",
        business_hours: d.business_hours ?? "",
        store_name_en: d.store_name_en ?? "",
        store_name_fa: d.store_name_fa ?? "",
        store_name_ps: d.store_name_ps ?? "",
        email: d.email ?? "",
        address: d.address ?? "",
        about_en: d.about_en ?? "",
        about_fa: d.about_fa ?? "",
        about_ps: d.about_ps ?? "",
        logo_url: d.logo_url ?? "",
        favicon_url: d.favicon_url ?? "",
        primary_color: d.primary_color ?? "",
        facebook_url: d.facebook_url ?? "",
        instagram_url: d.instagram_url ?? "",
        twitter_url: d.twitter_url ?? "",
        youtube_url: d.youtube_url ?? "",
        telegram_url: d.telegram_url ?? "",
        footer_text_en: d.footer_text_en ?? "",
        footer_text_fa: d.footer_text_fa ?? "",
        footer_text_ps: d.footer_text_ps ?? "",
        meta_description_en: d.meta_description_en ?? "",
        meta_description_fa: d.meta_description_fa ?? "",
        meta_description_ps: d.meta_description_ps ?? "",
      });
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async (f: SettingsForm) => {
      const nullify = (v: string) => (v.trim() ? v : null);
      const payload = {
        whatsapp_number: f.whatsapp_number,
        whatsapp_number_2: nullify(f.whatsapp_number_2),
        phone: nullify(f.phone),
        business_hours: nullify(f.business_hours),
        store_name_en: f.store_name_en,
        store_name_fa: f.store_name_fa,
        store_name_ps: f.store_name_ps,
        email: nullify(f.email),
        address: nullify(f.address),
        about_en: nullify(f.about_en),
        about_fa: nullify(f.about_fa),
        about_ps: nullify(f.about_ps),
        logo_url: nullify(f.logo_url),
        favicon_url: nullify(f.favicon_url),
        primary_color: nullify(f.primary_color),
        facebook_url: nullify(f.facebook_url),
        instagram_url: nullify(f.instagram_url),
        twitter_url: nullify(f.twitter_url),
        youtube_url: nullify(f.youtube_url),
        telegram_url: nullify(f.telegram_url),
        footer_text_en: nullify(f.footer_text_en),
        footer_text_fa: nullify(f.footer_text_fa),
        footer_text_ps: nullify(f.footer_text_ps),
        meta_description_en: nullify(f.meta_description_en),
        meta_description_fa: nullify(f.meta_description_fa),
        meta_description_ps: nullify(f.meta_description_ps),
      };
      if (f.id) {
        const { error } = await supabase.from("settings").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (settings.isLoading) {
    return <div className="text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site settings</h1>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="general">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="footer">Footer & SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div><Label className="text-xs">Store name (EN)</Label><Input value={form.store_name_en} onChange={(e) => set("store_name_en", e.target.value)} /></div>
              <div><Label className="text-xs">Store name (FA)</Label><Input dir="rtl" value={form.store_name_fa} onChange={(e) => set("store_name_fa", e.target.value)} /></div>
              <div><Label className="text-xs">Store name (PS)</Label><Input dir="rtl" value={form.store_name_ps} onChange={(e) => set("store_name_ps", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs">Logo</Label>
                <ImageUpload
                  value={form.logo_url}
                  onChange={(url) => set("logo_url", url)}
                  folder="logos"
                  previewSize="lg"
                />
              </div>
              <div>
                <Label className="text-xs">Favicon</Label>
                <ImageUpload
                  value={form.favicon_url}
                  onChange={(url) => set("favicon_url", url)}
                  folder="favicons"
                  previewSize="sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Primary brand color (hex)</Label>
              <div className="flex items-center gap-2">
                <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} placeholder="#3b82f6" />
                {form.primary_color && <div className="h-9 w-9 rounded border" style={{ backgroundColor: form.primary_color }} />}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">WhatsApp number (primary, no +)</Label>
                <Input placeholder="93700000000" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">All orders open this WhatsApp number.</p>
              </div>
              <div>
                <Label className="text-xs">WhatsApp number (secondary)</Label>
                <Input placeholder="93700000001" value={form.whatsapp_number_2} onChange={(e) => set("whatsapp_number_2", e.target.value)} />
              </div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="md:col-span-2">
                <Label className="text-xs">Business hours</Label>
                <Input value={form.business_hours} onChange={(e) => set("business_hours", e.target.value)} placeholder="Mon-Fri 9am - 6pm" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div><Label className="text-xs">Facebook URL</Label><Input value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." /></div>
              <div><Label className="text-xs">Instagram URL</Label><Input value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." /></div>
              <div><Label className="text-xs">Twitter / X URL</Label><Input value={form.twitter_url} onChange={(e) => set("twitter_url", e.target.value)} placeholder="https://x.com/..." /></div>
              <div><Label className="text-xs">YouTube URL</Label><Input value={form.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} placeholder="https://youtube.com/..." /></div>
              <div><Label className="text-xs">Telegram URL</Label><Input value={form.telegram_url} onChange={(e) => set("telegram_url", e.target.value)} placeholder="https://t.me/..." /></div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Use the toolbar to format your About content. Each language has its own rich text editor.
            </p>
            <div>
              <Label className="text-xs">About (EN)</Label>
              <RichTextEditor value={form.about_en} onChange={(v) => set("about_en", v)} />
            </div>
            <div>
              <Label className="text-xs">About (FA)</Label>
              <RichTextEditor value={form.about_fa} onChange={(v) => set("about_fa", v)} dir="rtl" />
            </div>
            <div>
              <Label className="text-xs">About (PS)</Label>
              <RichTextEditor value={form.about_ps} onChange={(v) => set("about_ps", v)} dir="rtl" />
            </div>
          </TabsContent>

          <TabsContent value="footer" className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-semibold">Footer text</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div><Label className="text-xs">EN</Label><Textarea rows={3} value={form.footer_text_en} onChange={(e) => set("footer_text_en", e.target.value)} /></div>
                <div><Label className="text-xs">FA</Label><Textarea rows={3} dir="rtl" value={form.footer_text_fa} onChange={(e) => set("footer_text_fa", e.target.value)} /></div>
                <div><Label className="text-xs">PS</Label><Textarea rows={3} dir="rtl" value={form.footer_text_ps} onChange={(e) => set("footer_text_ps", e.target.value)} /></div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">SEO meta description</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div><Label className="text-xs">EN</Label><Textarea rows={3} value={form.meta_description_en} onChange={(e) => set("meta_description_en", e.target.value)} /></div>
                <div><Label className="text-xs">FA</Label><Textarea rows={3} dir="rtl" value={form.meta_description_fa} onChange={(e) => set("meta_description_fa", e.target.value)} /></div>
                <div><Label className="text-xs">PS</Label><Textarea rows={3} dir="rtl" value={form.meta_description_ps} onChange={(e) => set("meta_description_ps", e.target.value)} /></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
