import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

interface CatForm {
  id?: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  image: string;
  sort_order: string;
}

const empty: CatForm = { slug: "", name_en: "", name_fa: "", name_ps: "", image: "", sort_order: "0" };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CatForm | null>(null);
  const [open, setOpen] = useState(false);

  const cats = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: CatForm) => {
      const payload = {
        slug: f.slug || slugify(f.name_en),
        name_en: f.name_en,
        name_fa: f.name_fa,
        name_ps: f.name_ps,
        image: f.image || null,
        sort_order: Number(f.sort_order) || 0,
      };
      if (f.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-cats-list"] });
      setOpen(false); setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-cats-list"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ...empty })} className="gap-2"><Plus className="h-4 w-4" /> New</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            {editing && (
              <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div><Label className="text-xs">Name (EN)</Label><Input value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} required /></div>
                  <div><Label className="text-xs">Name (FA)</Label><Input dir="rtl" value={editing.name_fa} onChange={(e) => setEditing({ ...editing, name_fa: e.target.value })} required /></div>
                  <div><Label className="text-xs">Name (PS)</Label><Input dir="rtl" value={editing.name_ps} onChange={(e) => setEditing({ ...editing, name_ps: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div><Label className="text-xs">Slug</Label><Input value={editing.slug} placeholder="auto" onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
                  <div><Label className="text-xs">Image URL</Label><Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
                  <div><Label className="text-xs">Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "..." : "Save"}</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr><th className="p-3">Image</th><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Order</th><th></th></tr>
          </thead>
          <tbody>
            {cats.data?.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-3">{c.image ? <img src={c.image} className="h-10 w-10 rounded object-cover" alt="" /> : <div className="h-10 w-10 rounded bg-muted" />}</td>
                <td className="p-3 font-medium">{c.name_en}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.sort_order}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing({ id: c.id, slug: c.slug, name_en: c.name_en, name_fa: c.name_fa, name_ps: c.name_ps, image: c.image ?? "", sort_order: String(c.sort_order) }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete category?")) del.mutate(c.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {cats.data && cats.data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No categories yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
