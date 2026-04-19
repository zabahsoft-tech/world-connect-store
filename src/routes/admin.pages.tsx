import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Lock, ExternalLink } from "lucide-react";
import { Link as RouterLink } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/admin/pages")({
  component: AdminPages,
});

interface PageForm {
  id?: string;
  slug: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  content_en: string;
  content_fa: string;
  content_ps: string;
  meta_description_en: string;
  meta_description_fa: string;
  meta_description_ps: string;
  hero_image: string;
  is_published: boolean;
  is_system: boolean;
  show_in_nav: boolean;
  sort_order: string;
}

const empty: PageForm = {
  slug: "",
  title_en: "",
  title_fa: "",
  title_ps: "",
  content_en: "",
  content_fa: "",
  content_ps: "",
  meta_description_en: "",
  meta_description_fa: "",
  meta_description_ps: "",
  hero_image: "",
  is_published: true,
  is_system: false,
  show_in_nav: false,
  sort_order: "0",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function AdminPages() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PageForm | null>(null);
  const [open, setOpen] = useState(false);

  const pages = useQuery({
    queryKey: ["admin-pages-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: PageForm) => {
      const payload = {
        slug: (f.slug || slugify(f.title_en)).trim(),
        title_en: f.title_en,
        title_fa: f.title_fa,
        title_ps: f.title_ps,
        content_en: f.content_en,
        content_fa: f.content_fa,
        content_ps: f.content_ps,
        meta_description_en: f.meta_description_en || null,
        meta_description_fa: f.meta_description_fa || null,
        meta_description_ps: f.meta_description_ps || null,
        hero_image: f.hero_image || null,
        is_published: f.is_published,
        show_in_nav: f.show_in_nav,
        sort_order: Number(f.sort_order) || 0,
      };
      if (!payload.slug) throw new Error("Slug is required");
      if (!payload.title_en) throw new Error("English title is required");

      if (f.id) {
        const { error } = await supabase.from("pages").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-pages-list"] });
      qc.invalidateQueries({ queryKey: ["pages-public"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("pages").update({ is_published: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pages-list"] });
      qc.invalidateQueries({ queryKey: ["pages-public"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-pages-list"] });
      qc.invalidateQueries({ queryKey: ["pages-public"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const startNew = () => {
    setEditing({ ...empty });
    setOpen(true);
  };

  const startEdit = (p: NonNullable<typeof pages.data>[number]) => {
    setEditing({
      id: p.id,
      slug: p.slug,
      title_en: p.title_en,
      title_fa: p.title_fa,
      title_ps: p.title_ps,
      content_en: p.content_en,
      content_fa: p.content_fa,
      content_ps: p.content_ps,
      meta_description_en: p.meta_description_en ?? "",
      meta_description_fa: p.meta_description_fa ?? "",
      meta_description_ps: p.meta_description_ps ?? "",
      hero_image: p.hero_image ?? "",
      is_published: p.is_published,
      is_system: p.is_system,
      show_in_nav: (p as { show_in_nav?: boolean }).show_in_nav ?? false,
      sort_order: String(p.sort_order ?? 0),
    });
    setOpen(true);
  };

  const publicHref = (slug: string) => {
    if (slug === "about") return "/about";
    if (slug === "contact") return "/contact";
    return `/p/${slug}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pages</h2>
          <p className="text-sm text-muted-foreground">Edit static page content for the public site.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={startNew}>
              <Plus className="me-2 h-4 w-4" /> New page
            </Button>
          </DialogTrigger>
          {editing && (
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit page" : "New page"}</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="general">
                <TabsList className="w-full">
                  <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                  <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                  <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Title (EN)</Label>
                      <Input
                        value={editing.title_en}
                        onChange={(e) => {
                          const title_en = e.target.value;
                          const autoSlug = !editing.id && !editing.is_system && (editing.slug === "" || editing.slug === slugify(editing.title_en));
                          setEditing({
                            ...editing,
                            title_en,
                            slug: autoSlug ? slugify(title_en) : editing.slug,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Slug {editing.is_system && <Lock className="inline h-3 w-3 ms-1" />}</Label>
                      <Input
                        value={editing.slug}
                        onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                        disabled={editing.is_system}
                        placeholder="page-slug"
                      />
                      {editing.is_system && (
                        <p className="mt-1 text-xs text-muted-foreground">System page — slug cannot be changed.</p>
                      )}
                    </div>
                    <div>
                      <Label>Title (FA)</Label>
                      <Input value={editing.title_fa} onChange={(e) => setEditing({ ...editing, title_fa: e.target.value })} dir="rtl" />
                    </div>
                    <div>
                      <Label>Title (PS)</Label>
                      <Input value={editing.title_ps} onChange={(e) => setEditing({ ...editing, title_ps: e.target.value })} dir="rtl" />
                    </div>
                  </div>

                  <div>
                    <Label>Hero image (optional)</Label>
                    <ImageUpload
                      value={editing.hero_image}
                      onChange={(url) => setEditing({ ...editing, hero_image: url })}
                      folder="pages"
                      previewSize="lg"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label className="text-sm font-medium">Published</Label>
                        <p className="text-xs text-muted-foreground">Visible to public visitors.</p>
                      </div>
                      <Switch
                        checked={editing.is_published}
                        onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label className="text-sm font-medium">Show in navigation</Label>
                        <p className="text-xs text-muted-foreground">Pin this page to the main header menu.</p>
                      </div>
                      <Switch
                        checked={editing.show_in_nav}
                        onCheckedChange={(v) => setEditing({ ...editing, show_in_nav: v })}
                      />
                    </div>
                    <div>
                      <Label>Sort order</Label>
                      <Input
                        type="number"
                        value={editing.sort_order}
                        onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 pt-4">
                  <div>
                    <Label>Content (EN)</Label>
                    <RichTextEditor
                      value={editing.content_en}
                      onChange={(html) => setEditing({ ...editing, content_en: html })}
                      minHeight={220}
                    />
                  </div>
                  <div>
                    <Label>Content (FA)</Label>
                    <RichTextEditor
                      value={editing.content_fa}
                      onChange={(html) => setEditing({ ...editing, content_fa: html })}
                      dir="rtl"
                      minHeight={220}
                    />
                  </div>
                  <div>
                    <Label>Content (PS)</Label>
                    <RichTextEditor
                      value={editing.content_ps}
                      onChange={(html) => setEditing({ ...editing, content_ps: html })}
                      dir="rtl"
                      minHeight={220}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 pt-4">
                  <div>
                    <Label>Meta description (EN)</Label>
                    <Textarea
                      value={editing.meta_description_en}
                      onChange={(e) => setEditing({ ...editing, meta_description_en: e.target.value })}
                      maxLength={300}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Meta description (FA)</Label>
                    <Textarea
                      value={editing.meta_description_fa}
                      onChange={(e) => setEditing({ ...editing, meta_description_fa: e.target.value })}
                      maxLength={300}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>Meta description (PS)</Label>
                    <Textarea
                      value={editing.meta_description_ps}
                      onChange={(e) => setEditing({ ...editing, meta_description_ps: e.target.value })}
                      maxLength={300}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
                <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>
                  {save.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        {pages.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : !pages.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No pages yet.</div>
        ) : (
          <div className="divide-y">
            {pages.data.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.title_en || p.slug}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">/{p.slug}</code>
                    {p.is_system && <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> System</Badge>}
                    {!p.is_published && <Badge variant="outline">Draft</Badge>}
                    {(p as { show_in_nav?: boolean }).show_in_nav && <Badge className="bg-primary/10 text-primary hover:bg-primary/15">In nav</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.is_published}
                    onCheckedChange={(v) => togglePublish.mutate({ id: p.id, value: v })}
                    aria-label="Published"
                  />
                  <Button asChild variant="ghost" size="icon" title="View">
                    <RouterLink to={publicHref(p.slug)} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </RouterLink>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (p.is_system) return;
                      if (confirm(`Delete page "${p.title_en || p.slug}"?`)) del.mutate(p.id);
                    }}
                    disabled={p.is_system}
                    title={p.is_system ? "System page — cannot delete" : "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
