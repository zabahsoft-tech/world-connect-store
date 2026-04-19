import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
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

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlog,
});

interface PostForm {
  id?: string;
  slug: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  excerpt_en: string;
  excerpt_fa: string;
  excerpt_ps: string;
  content_en: string;
  content_fa: string;
  content_ps: string;
  meta_description_en: string;
  meta_description_fa: string;
  meta_description_ps: string;
  cover_image: string;
  tags: string;
  author_name: string;
  is_published: boolean;
  published_at: string;
}

const empty: PostForm = {
  slug: "",
  title_en: "",
  title_fa: "",
  title_ps: "",
  excerpt_en: "",
  excerpt_fa: "",
  excerpt_ps: "",
  content_en: "",
  content_fa: "",
  content_ps: "",
  meta_description_en: "",
  meta_description_fa: "",
  meta_description_ps: "",
  cover_image: "",
  tags: "",
  author_name: "",
  is_published: false,
  published_at: "",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function toLocalDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function AdminBlog() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PostForm | null>(null);
  const [open, setOpen] = useState(false);

  const posts = useQuery({
    queryKey: ["admin-blog-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: PostForm) => {
      const tagsArr = f.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const slug = (f.slug || slugify(f.title_en)).trim();
      if (!slug) throw new Error("Slug is required");
      if (!f.title_en) throw new Error("English title is required");

      const publishedAt =
        f.is_published && !f.published_at
          ? new Date().toISOString()
          : f.published_at
          ? new Date(f.published_at).toISOString()
          : null;

      const payload = {
        slug,
        title_en: f.title_en,
        title_fa: f.title_fa,
        title_ps: f.title_ps,
        excerpt_en: f.excerpt_en,
        excerpt_fa: f.excerpt_fa,
        excerpt_ps: f.excerpt_ps,
        content_en: f.content_en,
        content_fa: f.content_fa,
        content_ps: f.content_ps,
        meta_description_en: f.meta_description_en || null,
        meta_description_fa: f.meta_description_fa || null,
        meta_description_ps: f.meta_description_ps || null,
        cover_image: f.cover_image || null,
        tags: tagsArr,
        author_name: f.author_name || null,
        is_published: f.is_published,
        published_at: publishedAt,
      };

      if (f.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-blog-list"] });
      qc.invalidateQueries({ queryKey: ["blog-public"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, value, hasPublishedAt }: { id: string; value: boolean; hasPublishedAt: boolean }) => {
      const update: { is_published: boolean; published_at?: string } = { is_published: value };
      if (value && !hasPublishedAt) update.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog-list"] });
      qc.invalidateQueries({ queryKey: ["blog-public"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-list"] });
      qc.invalidateQueries({ queryKey: ["blog-public"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const startNew = () => {
    setEditing({ ...empty });
    setOpen(true);
  };

  const startEdit = (p: NonNullable<typeof posts.data>[number]) => {
    setEditing({
      id: p.id,
      slug: p.slug,
      title_en: p.title_en,
      title_fa: p.title_fa,
      title_ps: p.title_ps,
      excerpt_en: p.excerpt_en,
      excerpt_fa: p.excerpt_fa,
      excerpt_ps: p.excerpt_ps,
      content_en: p.content_en,
      content_fa: p.content_fa,
      content_ps: p.content_ps,
      meta_description_en: p.meta_description_en ?? "",
      meta_description_fa: p.meta_description_fa ?? "",
      meta_description_ps: p.meta_description_ps ?? "",
      cover_image: p.cover_image ?? "",
      tags: (p.tags ?? []).join(", "),
      author_name: p.author_name ?? "",
      is_published: p.is_published,
      published_at: toLocalDateInput(p.published_at),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Blog posts</h2>
          <p className="text-sm text-muted-foreground">Write articles in 3 languages with full SEO control.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={startNew}>
              <Plus className="me-2 h-4 w-4" /> New post
            </Button>
          </DialogTrigger>
          {editing && (
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit post" : "New post"}</DialogTitle>
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
                          const autoSlug = !editing.id && (editing.slug === "" || editing.slug === slugify(editing.title_en));
                          setEditing({
                            ...editing,
                            title_en,
                            slug: autoSlug ? slugify(title_en) : editing.slug,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={editing.slug}
                        onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                        placeholder="post-slug"
                      />
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
                    <Label>Cover image</Label>
                    <ImageUpload
                      value={editing.cover_image}
                      onChange={(url) => setEditing({ ...editing, cover_image: url })}
                      folder="blog"
                      previewSize="lg"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Author name</Label>
                      <Input
                        value={editing.author_name}
                        onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={editing.tags}
                        onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                        placeholder="news, tips, deals"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label className="text-sm font-medium">Published</Label>
                        <p className="text-xs text-muted-foreground">Visible on the public blog.</p>
                      </div>
                      <Switch
                        checked={editing.is_published}
                        onCheckedChange={(v) => setEditing({ ...editing, is_published: v })}
                      />
                    </div>
                    <div>
                      <Label>Publish date</Label>
                      <Input
                        type="datetime-local"
                        value={editing.published_at}
                        onChange={(e) => setEditing({ ...editing, published_at: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 pt-4">
                  <div>
                    <Label>Excerpt (EN)</Label>
                    <Textarea
                      value={editing.excerpt_en}
                      onChange={(e) => setEditing({ ...editing, excerpt_en: e.target.value })}
                      maxLength={300}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Content (EN)</Label>
                    <RichTextEditor
                      value={editing.content_en}
                      onChange={(html) => setEditing({ ...editing, content_en: html })}
                      minHeight={260}
                    />
                  </div>

                  <div>
                    <Label>Excerpt (FA)</Label>
                    <Textarea
                      value={editing.excerpt_fa}
                      onChange={(e) => setEditing({ ...editing, excerpt_fa: e.target.value })}
                      maxLength={300}
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>Content (FA)</Label>
                    <RichTextEditor
                      value={editing.content_fa}
                      onChange={(html) => setEditing({ ...editing, content_fa: html })}
                      dir="rtl"
                      minHeight={260}
                    />
                  </div>

                  <div>
                    <Label>Excerpt (PS)</Label>
                    <Textarea
                      value={editing.excerpt_ps}
                      onChange={(e) => setEditing({ ...editing, excerpt_ps: e.target.value })}
                      maxLength={300}
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label>Content (PS)</Label>
                    <RichTextEditor
                      value={editing.content_ps}
                      onChange={(html) => setEditing({ ...editing, content_ps: html })}
                      dir="rtl"
                      minHeight={260}
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
        {posts.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : !posts.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No posts yet.</div>
        ) : (
          <div className="divide-y">
            {posts.data.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                {p.cover_image && (
                  <img
                    src={p.cover_image}
                    alt=""
                    className="h-12 w-16 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.title_en || p.slug}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">/{p.slug}</code>
                    {!p.is_published && <Badge variant="outline">Draft</Badge>}
                    {p.tags?.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  {p.published_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(p.published_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.is_published}
                    onCheckedChange={(v) =>
                      togglePublish.mutate({ id: p.id, value: v, hasPublishedAt: !!p.published_at })
                    }
                    aria-label="Published"
                  />
                  <Button asChild variant="ghost" size="icon" title="View">
                    <RouterLink to="/blog/$slug" params={{ slug: p.slug }} target="_blank">
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
                      if (confirm(`Delete post "${p.title_en || p.slug}"?`)) del.mutate(p.id);
                    }}
                    title="Delete"
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
