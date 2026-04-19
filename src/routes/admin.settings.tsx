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

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

interface SettingsForm {
  id?: string;
  whatsapp_number: string;
  store_name_en: string;
  store_name_fa: string;
  store_name_ps: string;
  email: string;
  address: string;
  about_en: string;
  about_fa: string;
  about_ps: string;
}

const empty: SettingsForm = {
  whatsapp_number: "", store_name_en: "", store_name_fa: "", store_name_ps: "",
  email: "", address: "", about_en: "", about_fa: "", about_ps: "",
};

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(empty);

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
      setForm({
        id: settings.data.id,
        whatsapp_number: settings.data.whatsapp_number ?? "",
        store_name_en: settings.data.store_name_en ?? "",
        store_name_fa: settings.data.store_name_fa ?? "",
        store_name_ps: settings.data.store_name_ps ?? "",
        email: settings.data.email ?? "",
        address: settings.data.address ?? "",
        about_en: settings.data.about_en ?? "",
        about_fa: settings.data.about_fa ?? "",
        about_ps: settings.data.about_ps ?? "",
      });
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async (f: SettingsForm) => {
      const payload = {
        whatsapp_number: f.whatsapp_number,
        store_name_en: f.store_name_en,
        store_name_fa: f.store_name_fa,
        store_name_ps: f.store_name_ps,
        email: f.email || null,
        address: f.address || null,
        about_en: f.about_en || null,
        about_fa: f.about_fa || null,
        about_ps: f.about_ps || null,
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
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-4">
          <div>
            <Label>WhatsApp number (with country code, no +)</Label>
            <Input placeholder="93700000000" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} required />
            <p className="mt-1 text-xs text-muted-foreground">All orders open this WhatsApp number.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label className="text-xs">Store name (EN)</Label><Input value={form.store_name_en} onChange={(e) => setForm({ ...form, store_name_en: e.target.value })} /></div>
            <div><Label className="text-xs">Store name (FA)</Label><Input dir="rtl" value={form.store_name_fa} onChange={(e) => setForm({ ...form, store_name_fa: e.target.value })} /></div>
            <div><Label className="text-xs">Store name (PS)</Label><Input dir="rtl" value={form.store_name_ps} onChange={(e) => setForm({ ...form, store_name_ps: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label className="text-xs">About (EN)</Label><Textarea rows={4} value={form.about_en} onChange={(e) => setForm({ ...form, about_en: e.target.value })} /></div>
            <div><Label className="text-xs">About (FA)</Label><Textarea rows={4} dir="rtl" value={form.about_fa} onChange={(e) => setForm({ ...form, about_fa: e.target.value })} /></div>
            <div><Label className="text-xs">About (PS)</Label><Textarea rows={4} dir="rtl" value={form.about_ps} onChange={(e) => setForm({ ...form, about_ps: e.target.value })} /></div>
          </div>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "..." : "Save settings"}</Button>
        </form>
      </Card>
    </div>
  );
}
