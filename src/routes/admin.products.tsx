import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Package as PackageIcon, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [tab, setTab] = useState("general");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [filterFeatured, setFilterFeatured] = useState<string>("all");

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(id, name_en)")
        .order("created_at", { ascending: false });
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

  const filtered = useMemo(() => {
    const list = products.data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (q && ![p.name_en, p.name_fa, p.name_ps].some((n) => n?.toLowerCase().includes(q))) return false;
      if (filterCat !== "all" && p.category_id !== filterCat) return false;
      if (filterStock === "in" && !p.in_stock) return false;
      if (filterStock === "out" && p.in_stock) return false;
      if (filterFeatured === "yes" && !p.featured) return false;
      if (filterFeatured === "no" && p.featured) return false;
      return true;
    });
  }, [products.data, search, filterCat, filterStock, filterFeatured]);

  const save = useMutation({
    mutationFn: async (f: ProductForm) => {
      if (!f.name_en.trim() || !f.name_fa.trim() || !f.name_ps.trim()) {
        throw new Error("Name is required in all 3 languages");
      }
      const payload = {
        slug: f.slug.trim() || slugify(f.name_en),
        name_en: f.name_en, name_fa: f.name_fa, name_ps: f.name_ps,
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
      setDeleteId(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const openNew = () => {
    setEditing({ ...empty });
    setTab("general");
    setOpen(true);
  };

  const openEdit = (p: typeof products.data extends (infer T)[] | null | undefined ? T : never) => {
    setEditing({
      id: p.id, slug: p.slug,
      name_en: p.name_en, name_fa: p.name_fa, name_ps: p.name_ps,
      description_en: p.description_en ?? "", description_fa: p.description_fa ?? "", description_ps: p.description_ps ?? "",
      price: String(p.price), image_url: p.image_url ?? "", category_id: p.category_id ?? "",
      in_stock: p.in_stock, featured: p.featured,
    });
    setTab("general");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.data ? `${filtered.length} of ${products.data.length}` : "Loading..."}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> New product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit product" : "New product"}</DialogTitle>
              <DialogDescription>
                Fill in the product details. Translations are required in all 3 languages.
              </DialogDescription>
            </DialogHeader>
            {editing && (
              <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="trans">Translations</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-3">
                    <Field label="Slug" hint="Auto-generated from English name if blank.">
                      <Input
                        value={editing.slug}
                        placeholder="auto"
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      />
                    </Field>
                    <Field label="Price">
                      <Input
                        type="number" step="0.01" min="0"
                        value={editing.price}
                        onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                      />
                    </Field>
                    <Field label="Category">
                      <Select
                        value={editing.category_id || "none"}
                        onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? "" : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </TabsContent>

                  <TabsContent value="trans" className="space-y-4">
                    {(["en", "fa", "ps"] as const).map((lng) => (
                      <div key={lng} className="space-y-2 rounded-md border p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {lng === "en" ? "English" : lng === "fa" ? "فارسی (Farsi)" : "پښتو (Pashto)"}
                        </p>
                        <Field label="Name">
                          <Input
                            dir={lng === "en" ? "ltr" : "rtl"}
                            value={editing[`name_${lng}`]}
                            onChange={(e) => setEditing({ ...editing, [`name_${lng}`]: e.target.value })}
                            required
                          />
                        </Field>
                        <Field label="Description">
                          <Textarea
                            rows={3}
                            dir={lng === "en" ? "ltr" : "rtl"}
                            value={editing[`description_${lng}`]}
                            onChange={(e) => setEditing({ ...editing, [`description_${lng}`]: e.target.value })}
                          />
                        </Field>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="media" className="space-y-3">
                    <Field label="Image URL" hint="Direct link to the product image.">
                      <Input
                        value={editing.image_url}
                        placeholder="https://..."
                        onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                      />
                    </Field>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="mb-2 text-xs text-muted-foreground">Preview</p>
                      {editing.image_url ? (
                        <img
                          src={editing.image_url}
                          alt="Preview"
                          className="h-48 w-full rounded object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center rounded bg-muted text-muted-foreground">
                          <ImageOff className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <label className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium text-sm">In stock</p>
                        <p className="text-xs text-muted-foreground">Available for purchase.</p>
                      </div>
                      <Switch
                        checked={editing.in_stock}
                        onCheckedChange={(v) => setEditing({ ...editing, in_stock: v })}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium text-sm">Featured</p>
                        <p className="text-xs text-muted-foreground">Show on the homepage.</p>
                      </div>
                      <Switch
                        checked={editing.featured}
                        onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                      />
                    </label>
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? "Saving..." : "Save product"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name (EN / FA / PS)..."
              className="pl-8"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="in">In stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFeatured} onValueChange={setFilterFeatured}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Featured</SelectItem>
                <SelectItem value="no">Not featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.isLoading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-8 w-16" /></TableCell>
              </TableRow>
            ))}

            {!products.isLoading && filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image_url ? (
                    <img src={p.image_url} className="h-10 w-10 rounded object-cover" alt="" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{p.name_en}</div>
                  <div className="text-xs text-muted-foreground">{p.slug}</div>
                </TableCell>
                <TableCell>
                  {p.categories ? (
                    <Badge variant="outline">{p.categories.name_en}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={p.in_stock ? "secondary" : "destructive"}>
                    {p.in_stock ? "In stock" : "Out"}
                  </Badge>
                </TableCell>
                <TableCell>{p.featured ? <Badge>★ Featured</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!products.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <PackageIcon className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">No products found</p>
                      <p className="text-sm text-muted-foreground">
                        {products.data && products.data.length > 0
                          ? "Try adjusting filters or search."
                          : "Create your first product to get started."}
                      </p>
                    </div>
                    <Button onClick={openNew} className="gap-2">
                      <Plus className="h-4 w-4" /> New product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && del.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
