import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Package as PackageIcon, ImageOff, X, ArrowUp, ArrowDown, Heading, GripVertical, Copy } from "lucide-react";
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
import { GalleryUpload } from "@/components/GalleryUpload";
import { MediaUpload } from "@/components/MediaUpload";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface AttributeRow {
  label_en: string;
  label_fa: string;
  label_ps: string;
  value_en: string;
  value_fa: string;
  value_ps: string;
}

interface SpecRow {
  type?: "row" | "section";
  // section title fields
  title_en?: string;
  title_fa?: string;
  title_ps?: string;
  // optional group ("main col")
  group_en?: string;
  group_fa?: string;
  group_ps?: string;
  label_en: string;
  label_fa: string;
  label_ps: string;
  value_en: string;
  value_fa: string;
  value_ps: string;
}

interface VariantRow {
  id: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  sku: string;
  price: string; // override; "" = use base
  in_stock: boolean;
  image_url: string;
}

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
  gallery: string[];
  video_url: string;
  category_id: string;
  in_stock: boolean;
  featured: boolean;
  attributes: AttributeRow[];
  sizesText: string;
  variants: VariantRow[];
  specifications: SpecRow[];
}

const empty: ProductForm = {
  slug: "", name_en: "", name_fa: "", name_ps: "",
  description_en: "", description_fa: "", description_ps: "",
  price: "0", gallery: [], video_url: "", category_id: "",
  in_stock: true, featured: false, attributes: [], sizesText: "", variants: [], specifications: [],
};

const emptySpec = (): SpecRow => ({
  type: "row",
  group_en: "", group_fa: "", group_ps: "",
  label_en: "", label_fa: "", label_ps: "",
  value_en: "", value_fa: "", value_ps: "",
});

const emptySection = (): SpecRow => ({
  type: "section",
  title_en: "", title_fa: "", title_ps: "",
  group_en: "", group_fa: "", group_ps: "",
  label_en: "", label_fa: "", label_ps: "",
  value_en: "", value_fa: "", value_ps: "",
});

const emptyAttr = (): AttributeRow => ({
  label_en: "", label_fa: "", label_ps: "",
  value_en: "", value_fa: "", value_ps: "",
});

// Convert existing attribute rows -> "en | fa | ps" lines (one per row).
// Falls back across languages if some are empty so legacy specs migrate cleanly.
function attrsToSizesText(attrs: Partial<AttributeRow>[]): string {
  return attrs
    .map((a) => {
      const en = (a.value_en || a.value_fa || a.value_ps || "").trim();
      const fa = (a.value_fa || a.value_en || a.value_ps || "").trim();
      const ps = (a.value_ps || a.value_en || a.value_fa || "").trim();
      if (!en && !fa && !ps) return "";
      // If all three are identical, render single segment
      if (en === fa && fa === ps) return en;
      return `${en} | ${fa} | ${ps}`;
    })
    .filter((l) => l.length > 0)
    .join("\n");
}

// Parse "en | fa | ps" lines back into AttributeRow[] (label = "Size" per language).
function sizesTextToAttrs(text: string): AttributeRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const en = parts[0] || "";
      const fa = parts[1] ?? en;
      const ps = parts[2] ?? (parts[1] ?? en);
      return {
        label_en: "Size",
        label_fa: "اندازه",
        label_ps: "اندازه",
        value_en: en,
        value_fa: fa,
        value_ps: ps,
      };
    });
}

const emptyVariant = (): VariantRow => ({
  id: crypto.randomUUID(),
  name_en: "", name_fa: "", name_ps: "",
  sku: "", price: "", in_stock: true, image_url: "",
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("general");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<"upload" | "url">("upload");

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
      const cleanAttrs = sizesTextToAttrs(f.sizesText);
      const cleanSpecs = f.specifications
        .filter((s) => {
          if (s.type === "section") {
            return ((s.title_en ?? "") + (s.title_fa ?? "") + (s.title_ps ?? "")).trim().length > 0;
          }
          return (s.label_en + s.label_fa + s.label_ps + s.value_en + s.value_fa + s.value_ps).trim().length > 0;
        })
        .map((s) => {
          if (s.type === "section") {
            return {
              type: "section" as const,
              title_en: (s.title_en ?? "").trim(),
              title_fa: (s.title_fa ?? "").trim(),
              title_ps: (s.title_ps ?? "").trim(),
            };
          }
          return {
            type: "row" as const,
            group_en: (s.group_en ?? "").trim(),
            group_fa: (s.group_fa ?? "").trim(),
            group_ps: (s.group_ps ?? "").trim(),
            label_en: s.label_en.trim(),
            label_fa: s.label_fa.trim(),
            label_ps: s.label_ps.trim(),
            value_en: s.value_en.trim(),
            value_fa: s.value_fa.trim(),
            value_ps: s.value_ps.trim(),
          };
        });
      const cleanVariants = f.variants
        .filter((v) => (v.name_en + v.name_fa + v.name_ps).trim().length > 0)
        .map((v) => ({
          id: v.id,
          name_en: v.name_en,
          name_fa: v.name_fa,
          name_ps: v.name_ps,
          sku: v.sku || null,
          price: v.price.trim() === "" ? null : Number(v.price),
          in_stock: v.in_stock,
          image_url: v.image_url || null,
        }));
      const payload = {
        slug: f.slug.trim() || slugify(f.name_en),
        name_en: f.name_en, name_fa: f.name_fa, name_ps: f.name_ps,
        description_en: f.description_en || null,
        description_fa: f.description_fa || null,
        description_ps: f.description_ps || null,
        price: Number(f.price) || 0,
        image_url: f.gallery[0] || null,
        gallery: f.gallery as unknown as never,
        video_url: f.video_url || null,
        attributes: cleanAttrs as unknown as never,
        variants: cleanVariants as unknown as never,
        specifications: cleanSpecs as unknown as never,
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
    setVideoMode("upload");
    setOpen(true);
  };

  const openEdit = (p: typeof products.data extends (infer T)[] | null | undefined ? T : never) => {
    const galleryArr: string[] = Array.isArray(p.gallery) ? (p.gallery as string[]) : [];
    // if image_url exists but isn't in gallery, prepend it
    const merged = p.image_url && !galleryArr.includes(p.image_url) ? [p.image_url, ...galleryArr] : galleryArr;
    const attrsRaw = (Array.isArray(p.attributes) ? p.attributes : []) as Partial<AttributeRow>[];
    const variantsRaw = (Array.isArray(p.variants) ? p.variants : []) as Array<Partial<VariantRow> & { price?: number | string | null }>;
    const specsRaw = (Array.isArray((p as { specifications?: unknown }).specifications)
      ? ((p as { specifications: unknown[] }).specifications as Partial<SpecRow>[])
      : []);
    setEditing({
      id: p.id, slug: p.slug,
      name_en: p.name_en, name_fa: p.name_fa, name_ps: p.name_ps,
      description_en: p.description_en ?? "", description_fa: p.description_fa ?? "", description_ps: p.description_ps ?? "",
      price: String(p.price),
      gallery: merged,
      video_url: p.video_url ?? "",
      category_id: p.category_id ?? "",
      in_stock: p.in_stock, featured: p.featured,
      attributes: attrsRaw.map((a) => ({ ...emptyAttr(), ...a })),
      sizesText: attrsToSizesText(attrsRaw),
      variants: variantsRaw.map((v) => ({
        ...emptyVariant(),
        ...v,
        id: v.id ?? crypto.randomUUID(),
        price: v.price == null ? "" : String(v.price),
      })),
      specifications: specsRaw.map((s) => ({ ...emptySpec(), ...s })),
    });
    setTab("general");
    setVideoMode(p.video_url && /^https?:\/\//.test(p.video_url) && !p.video_url.includes("supabase") ? "url" : "upload");
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
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit product" : "New product"}</DialogTitle>
              <DialogDescription>
                Fill in the product details. Translations are required in all 3 languages.
              </DialogDescription>
            </DialogHeader>
            {editing && (
              <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="trans">Translations</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="variations">Variations</TabsTrigger>
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
                            onChange={(e) => {
                              const val = e.target.value;
                              if (lng === "en") {
                                const autoSlug = !editing.id && (editing.slug === "" || editing.slug === slugify(editing.name_en));
                                setEditing({
                                  ...editing,
                                  name_en: val,
                                  slug: autoSlug ? slugify(val) : editing.slug,
                                });
                              } else {
                                setEditing({ ...editing, [`name_${lng}`]: val });
                              }
                            }}
                            required
                          />
                        </Field>
                        <Field label="Description">
                          <RichTextEditor
                            dir={lng === "en" ? "ltr" : "rtl"}
                            value={editing[`description_${lng}`]}
                            onChange={(html: string) => setEditing({ ...editing, [`description_${lng}`]: html })}
                            minHeight={220}
                          />
                        </Field>
                      </div>
                    ))}

                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">Specifications</p>
                          <p className="text-[11px] text-muted-foreground">
                            Build a side-by-side spec table (e.g. Material, Weight, Warranty). Leave a language blank to fall back to English.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing({ ...editing, specifications: [...editing.specifications, emptySpec()] })}
                        >
                          <Plus className="me-1 h-3.5 w-3.5" /> Add row
                        </Button>
                      </div>
                      {editing.specifications.length === 0 && (
                        <p className="text-xs text-muted-foreground">No specifications yet.</p>
                      )}
                      {editing.specifications.map((s, i) => (
                        <div key={i} className="space-y-2 rounded border bg-muted/30 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground">Row {i + 1}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={i === 0}
                                onClick={() => {
                                  const next = editing.specifications.slice();
                                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                  setEditing({ ...editing, specifications: next });
                                }}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={i === editing.specifications.length - 1}
                                onClick={() => {
                                  const next = editing.specifications.slice();
                                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                                  setEditing({ ...editing, specifications: next });
                                }}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  setEditing({
                                    ...editing,
                                    specifications: editing.specifications.filter((_, idx) => idx !== i),
                                  })
                                }
                              >
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {(["en", "fa", "ps"] as const).map((lng) => (
                            <div key={lng} className="grid gap-2 md:grid-cols-2">
                              <Input
                                placeholder={`Label (${lng.toUpperCase()})`}
                                dir={lng === "en" ? "ltr" : "rtl"}
                                value={s[`label_${lng}`]}
                                onChange={(e) => {
                                  const next = editing.specifications.slice();
                                  next[i] = { ...next[i], [`label_${lng}`]: e.target.value };
                                  setEditing({ ...editing, specifications: next });
                                }}
                                className="text-xs"
                              />
                              <Input
                                placeholder={`Value (${lng.toUpperCase()})`}
                                dir={lng === "en" ? "ltr" : "rtl"}
                                value={s[`value_${lng}`]}
                                onChange={(e) => {
                                  const next = editing.specifications.slice();
                                  next[i] = { ...next[i], [`value_${lng}`]: e.target.value };
                                  setEditing({ ...editing, specifications: next });
                                }}
                                className="text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Gallery images</Label>
                      <p className="text-xs text-muted-foreground">
                        Upload multiple product photos. Drag-free reorder with arrows; the first image is used as the thumbnail across the site.
                      </p>
                      <GalleryUpload
                        value={editing.gallery}
                        onChange={(g) => setEditing({ ...editing, gallery: g })}
                        folder="products/images"
                      />
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-medium">Thumbnail preview</p>
                      <p className="mb-2 text-[11px] text-muted-foreground">
                        This is the thumbnail customers see in listings.
                      </p>
                      {editing.gallery[0] ? (
                        <img
                          src={editing.gallery[0]}
                          alt="Thumbnail"
                          className="h-32 w-32 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                          <ImageOff className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Product video (optional)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={videoMode === "upload" ? "default" : "outline"}
                          onClick={() => setVideoMode("upload")}
                        >
                          Upload file
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={videoMode === "url" ? "default" : "outline"}
                          onClick={() => setVideoMode("url")}
                        >
                          Paste URL
                        </Button>
                      </div>
                      {videoMode === "upload" ? (
                        <MediaUpload
                          kind="video"
                          value={editing.video_url}
                          onChange={(u) => setEditing({ ...editing, video_url: u })}
                          folder="products/videos"
                        />
                      ) : (
                        <Input
                          value={editing.video_url}
                          onChange={(e) => setEditing({ ...editing, video_url: e.target.value })}
                          placeholder="https://youtube.com/... or https://vimeo.com/... or .mp4"
                        />
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Supported: YouTube, Vimeo, direct .mp4/.webm links, or uploaded video files.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="variations" className="space-y-6">
                    {/* Sizes */}
                    <div className="space-y-2 rounded-md border p-3">
                      <div>
                        <p className="text-sm font-semibold">Sizes</p>
                        <p className="text-[11px] text-muted-foreground">
                          One size per line. Use <code className="rounded bg-muted px-1">|</code> to separate languages: <code className="rounded bg-muted px-1">English | فارسی | پښتو</code>. If you only type one value, it&apos;s used for all 3 languages.
                        </p>
                      </div>
                      <Textarea
                        value={editing.sizesText}
                        onChange={(e) => setEditing({ ...editing, sizesText: e.target.value })}
                        placeholder={"Small | کوچک | کوچنی\nMedium | متوسط | منځنی\nLarge | بزرگ | لوی"}
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>

                    {/* Variants */}
                    <div className="space-y-3 rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Sellable variants</p>
                          <p className="text-[11px] text-muted-foreground">
                            Selectable options (e.g. Size: Small / Large) with optional price override and stock.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing({ ...editing, variants: [...editing.variants, emptyVariant()] })}
                        >
                          <Plus className="me-1 h-3.5 w-3.5" /> Add variant
                        </Button>
                      </div>
                      {editing.variants.length === 0 && (
                        <p className="text-xs text-muted-foreground">No variants — product sells as a single SKU.</p>
                      )}
                      {editing.variants.map((v, i) => (
                        <div key={v.id} className="space-y-2 rounded border bg-muted/30 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground">Variant {i + 1}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() =>
                                setEditing({ ...editing, variants: editing.variants.filter((_, idx) => idx !== i) })
                              }
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {(["en", "fa", "ps"] as const).map((lng) => (
                              <Input
                                key={lng}
                                placeholder={`Name (${lng.toUpperCase()})`}
                                dir={lng === "en" ? "ltr" : "rtl"}
                                value={v[`name_${lng}`]}
                                onChange={(e) => {
                                  const next = editing.variants.slice();
                                  next[i] = { ...next[i], [`name_${lng}`]: e.target.value };
                                  setEditing({ ...editing, variants: next });
                                }}
                                className="text-xs"
                              />
                            ))}
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              placeholder="SKU (optional)"
                              value={v.sku}
                              onChange={(e) => {
                                const next = editing.variants.slice();
                                next[i] = { ...next[i], sku: e.target.value };
                                setEditing({ ...editing, variants: next });
                              }}
                              className="text-xs"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Price override (blank = base)"
                              value={v.price}
                              onChange={(e) => {
                                const next = editing.variants.slice();
                                next[i] = { ...next[i], price: e.target.value };
                                setEditing({ ...editing, variants: next });
                              }}
                              className="text-xs"
                            />
                            <Select
                              value={v.image_url || "none"}
                              onValueChange={(val) => {
                                const next = editing.variants.slice();
                                next[i] = { ...next[i], image_url: val === "none" ? "" : val };
                                setEditing({ ...editing, variants: next });
                              }}
                            >
                              <SelectTrigger className="text-xs"><SelectValue placeholder="Variant image (from gallery)" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— No image —</SelectItem>
                                {editing.gallery.map((g, idx) => (
                                  <SelectItem key={g} value={g}>
                                    Image {idx + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <label className="flex items-center justify-between rounded border bg-background p-2">
                            <span className="text-xs">In stock</span>
                            <Switch
                              checked={v.in_stock}
                              onCheckedChange={(checked) => {
                                const next = editing.variants.slice();
                                next[i] = { ...next[i], in_stock: checked };
                                setEditing({ ...editing, variants: next });
                              }}
                            />
                          </label>
                        </div>
                      ))}
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
