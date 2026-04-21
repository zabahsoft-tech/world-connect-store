import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Images, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/slides")({
  component: AdminSlides,
});

type SlideForm = {
  id?: string;
  image: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  subtitle_en: string;
  subtitle_fa: string;
  subtitle_ps: string;
  cta_label_en: string;
  cta_label_fa: string;
  cta_label_ps: string;
  cta_link: string;
  sort_order: number;
  active: boolean;
};

const empty: SlideForm = {
  image: "",
  title_en: "",
  title_fa: "",
  title_ps: "",
  subtitle_en: "",
  subtitle_fa: "",
  subtitle_ps: "",
  cta_label_en: "",
  cta_label_fa: "",
  cta_label_ps: "",
  cta_link: "/shop",
  sort_order: 0,
  active: true,
};

function AdminSlides() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SlideForm>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const slides = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (s: SlideForm) => {
      const payload = {
        image: s.image,
        title_en: s.title_en,
        title_fa: s.title_fa,
        title_ps: s.title_ps,
        subtitle_en: s.subtitle_en,
        subtitle_fa: s.subtitle_fa,
        subtitle_ps: s.subtitle_ps,
        cta_label_en: s.cta_label_en || null,
        cta_label_fa: s.cta_label_fa || null,
        cta_label_ps: s.cta_label_ps || null,
        cta_link: s.cta_link || null,
        sort_order: s.sort_order,
        active: s.active,
      };
      if (s.id) {
        const { error } = await supabase.from("hero_slides").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_slides").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Slide saved");
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      setOpen(false);
      setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("hero_slides").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slide deleted");
      qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      qc.invalidateQueries({ queryKey: ["hero-slides"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setForm({ ...empty, sort_order: (slides.data?.length ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (s: typeof empty & { id: string }) => {
    setForm({
      id: s.id,
      image: s.image ?? "",
      title_en: s.title_en ?? "",
      title_fa: s.title_fa ?? "",
      title_ps: s.title_ps ?? "",
      subtitle_en: s.subtitle_en ?? "",
      subtitle_fa: s.subtitle_fa ?? "",
      subtitle_ps: s.subtitle_ps ?? "",
      cta_label_en: s.cta_label_en ?? "",
      cta_label_fa: s.cta_label_fa ?? "",
      cta_label_ps: s.cta_label_ps ?? "",
      cta_link: s.cta_link ?? "",
      sort_order: s.sort_order ?? 0,
      active: s.active ?? true,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hero slides</h2>
          <p className="text-sm text-muted-foreground">Manage homepage banner slides</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New slide
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><GripVertical className="h-4 w-4 text-muted-foreground" /></TableHead>
              <TableHead className="w-24">Image</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead className="w-24">Order</TableHead>
              <TableHead className="w-24">Active</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><div className="h-12 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : !slides.data?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Images className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No slides yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                    Create your first slide
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              slides.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><span className="text-xs text-muted-foreground">{s.sort_order}</span></TableCell>
                  <TableCell>
                    <div className="h-12 w-20 overflow-hidden rounded border bg-muted">
                      {s.image && <img src={s.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{s.title_en || <span className="text-muted-foreground">Untitled</span>}</TableCell>
                  <TableCell>{s.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: s.id, active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s as never)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit slide" : "New slide"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>Slide image</Label>
                <ImageUpload
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  bucket="site-assets"
                  folder="hero-slides"
                  previewSize="lg"
                />
                {form.image && (
                  <div className="aspect-[16/7] overflow-hidden rounded-lg border bg-muted">
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA link</Label>
                  <Input
                    value={form.cta_link}
                    onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                    placeholder="/shop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Show this slide on the homepage</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4">
              <Tabs defaultValue="en">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="fa">فارسی</TabsTrigger>
                  <TabsTrigger value="ps">پښتو</TabsTrigger>
                </TabsList>
                {(["en", "fa", "ps"] as const).map((l) => (
                  <TabsContent key={l} value={l} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={form[`title_${l}`]}
                        onChange={(e) => setForm({ ...form, [`title_${l}`]: e.target.value })}
                        dir={l === "en" ? "ltr" : "rtl"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Textarea
                        rows={2}
                        value={form[`subtitle_${l}`]}
                        onChange={(e) => setForm({ ...form, [`subtitle_${l}`]: e.target.value })}
                        dir={l === "en" ? "ltr" : "rtl"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA label</Label>
                      <Input
                        value={form[`cta_label_${l}`]}
                        onChange={(e) => setForm({ ...form, [`cta_label_${l}`]: e.target.value })}
                        dir={l === "en" ? "ltr" : "rtl"}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.image}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete slide?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)}>
              {del.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Badge variant="outline" className="text-xs">
        {slides.data?.filter((s) => s.active).length ?? 0} active / {slides.data?.length ?? 0} total
      </Badge>
    </div>
  );
}
