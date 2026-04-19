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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface ProductForm {
  id?: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  description_en: string;
  description_fa: string;
  description_ps: string;
  price: string;
  image_url: string;
  category_id: string;
  in_stock: boolean;
  featured: boolean;
}

const empty: ProductForm = {
  slug: "", name_en: "", name_fa: "", name_ps: "",
  description_en: "", description_fa: "", description_ps: "",
  price: "0", image_url: "", category_id: "", in_stock: true, featured: false,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const [open, setOpen] = useState(false);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name_en)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cats = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name_en");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: ProductForm) => {
      const payload = {
        slug: f.slug || slugify(f.name_en),
        name_en: f.name_en,
        name_fa: f.name_fa,
        name_ps: f.name_ps,
        description_en: f.description_en || null,
        description_fa: f.description_fa || null,
        description_ps: f.description_ps || null,
        price: Number(f.price) || 0,
        image_url: f.image_url || null,
        category_id: f.category_id || null,
        in_stock: f.in_stock,
        featured: f.featured,
      };
      if (f.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ...empty })} className="gap-2">
              <Plus className="h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} product</DialogTitle></DialogHeader>
            {editing && (
              <form
                onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Name (EN)"><Input value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} required /></Field>
                  <Field label="Name (FA)"><Input value={editing.name_fa} onChange={(e) => setEditing({ ...editing, name_fa: e.target.value })} dir="rtl" required /></Field>
                  <Field label="Name (PS)"><Input value={editing.name_ps} onChange={(e) => setEditing({ ...editing, name_ps: e.target.value })} dir="rtl" required /></Field>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Description (EN)"><Textarea rows={3} value={editing.description_en} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} /></Field>
                  <Field label="Description (FA)"><Textarea rows={3} dir="rtl" value={editing.description_fa} onChange={(e) => setEditing({ ...editing, description_fa: e.target.value })} /></Field>
                  <Field label="Description (PS)"><Textarea rows={3} dir="rtl" value={editing.description_ps} onChange={(e) => setEditing({ ...editing, description_ps: e.target.value })} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Field label="Price"><Input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></Field>
                  <Field label="Slug"><Input value={editing.slug} placeholder="auto" onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
                  <Field label="Category">
                    <Select value={editing.category_id || "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Image URL"><Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." /></Field>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={editing.in_stock} onCheckedChange={(v) => setEditing({ ...editing, in_stock: v })} />
                    In stock
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} />
                    Featured
                  </label>
                </div>
                <Button type="submit" disabled={save.isPending} className="w-full">{save.isPending ? "..." : "Save"}</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name (EN)</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Featured</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.data?.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">
                  {p.image_url ? <img src={p.image_url} className="h-10 w-10 rounded object-cover" alt="" /> : <div className="h-10 w-10 rounded bg-muted" />}
                </td>
                <td className="p-3 font-medium">{p.name_en}</td>
                <td className="p-3">{Number(p.price).toFixed(2)}</td>
                <td className="p-3">{p.in_stock ? "✓" : "✗"}</td>
                <td className="p-3">{p.featured ? "★" : ""}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing({
                    id: p.id, slug: p.slug,
                    name_en: p.name_en, name_fa: p.name_fa, name_ps: p.name_ps,
                    description_en: p.description_en ?? "", description_fa: p.description_fa ?? "", description_ps: p.description_ps ?? "",
                    price: String(p.price), image_url: p.image_url ?? "", category_id: p.category_id ?? "",
                    in_stock: p.in_stock, featured: p.featured,
                  }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this product?")) del.mutate(p.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {products.data && products.data.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
