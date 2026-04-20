import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { Upload, FileCheck2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/admin/import")({
  component: AdminImportPage,
  errorComponent: ({ error, reset }) => <ErrorState error={error} reset={reset} />,
});

// ---------- Types ----------
interface CategoryRow {
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  image?: string;
  sort_order?: string | number;
}

interface ProductRow {
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  description_en?: string;
  description_fa?: string;
  description_ps?: string;
  price?: string | number;
  image_url?: string;
  gallery?: string;
  category_slug?: string;
  featured?: string;
  in_stock?: string;
  video_url?: string;
  attributes?: string;
  sizes?: string;
  variants?: string;
}

interface ParsedFile<T> {
  rows: T[];
  errors: string[];
  warnings: string[];
}

// ---------- Helpers ----------
function parseBool(v: unknown, fallback: boolean): boolean {
  if (v == null || v === "") return fallback;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function safeJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sizesToAttributes(sizesText: string | undefined) {
  if (!sizesText || !sizesText.trim()) return null;
  const lines = sizesText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return lines.map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    const en = parts[0] || "";
    const fa = parts[1] || en;
    const ps = parts[2] || fa || en;
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

async function parseCsv<T>(file: File): Promise<ParsedFile<T>> {
  return new Promise((resolve) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const errors = res.errors.map((e) => `Row ${e.row}: ${e.message}`);
        resolve({ rows: res.data, errors, warnings: [] });
      },
      error: (err) => resolve({ rows: [], errors: [err.message], warnings: [] }),
    });
  });
}

function validateCategories(rows: CategoryRow[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (!r.slug?.trim()) errs.push(`Row ${i + 2}: missing slug`);
    if (!r.name_en?.trim() && !r.name_fa?.trim() && !r.name_ps?.trim())
      errs.push(`Row ${i + 2} (${r.slug}): all name fields blank`);
    if (r.slug && seen.has(r.slug)) errs.push(`Row ${i + 2}: duplicate slug "${r.slug}"`);
    if (r.slug) seen.add(r.slug);
  });
  return errs;
}

function validateProducts(rows: ProductRow[], categorySlugs: Set<string>) {
  const errs: string[] = [];
  const warns: string[] = [];
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (!r.slug?.trim()) errs.push(`Row ${i + 2}: missing slug`);
    if (!r.name_en?.trim() && !r.name_fa?.trim() && !r.name_ps?.trim())
      errs.push(`Row ${i + 2} (${r.slug}): all name fields blank`);
    if (r.slug && seen.has(r.slug)) errs.push(`Row ${i + 2}: duplicate slug "${r.slug}"`);
    if (r.slug) seen.add(r.slug);
    if (r.category_slug && r.category_slug.trim() && !categorySlugs.has(r.category_slug.trim())) {
      warns.push(`Row ${i + 2} (${r.slug}): category "${r.category_slug}" not found — will import uncategorised`);
    }
    if (r.gallery && r.gallery.trim()) {
      try { JSON.parse(r.gallery); } catch { errs.push(`Row ${i + 2} (${r.slug}): invalid JSON in gallery`); }
    }
    if (r.attributes && r.attributes.trim()) {
      try { JSON.parse(r.attributes); } catch { errs.push(`Row ${i + 2} (${r.slug}): invalid JSON in attributes`); }
    }
    if (r.variants && r.variants.trim()) {
      try { JSON.parse(r.variants); } catch { errs.push(`Row ${i + 2} (${r.slug}): invalid JSON in variants`); }
    }
  });
  return { errs, warns };
}

// ---------- Component ----------
function AdminImportPage() {
  const [catFile, setCatFile] = useState<File | null>(null);
  const [prodFile, setProdFile] = useState<File | null>(null);
  const [catParsed, setCatParsed] = useState<ParsedFile<CategoryRow> | null>(null);
  const [prodParsed, setProdParsed] = useState<ParsedFile<ProductRow> | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ categories: number; products: number } | null>(null);

  const handleCatFile = async (f: File) => {
    setCatFile(f);
    setCatParsed(null);
    const parsed = await parseCsv<CategoryRow>(f);
    parsed.errors = [...parsed.errors, ...validateCategories(parsed.rows)];
    setCatParsed(parsed);
  };

  const handleProdFile = async (f: File) => {
    setProdFile(f);
    setProdParsed(null);
    const parsed = await parseCsv<ProductRow>(f);
    const catSlugs = new Set((catParsed?.rows ?? []).map((c) => c.slug?.trim()).filter(Boolean) as string[]);
    // also add already-existing categories from DB
    const { data: existing } = await supabase.from("categories").select("slug");
    (existing ?? []).forEach((c) => c.slug && catSlugs.add(c.slug));
    const { errs, warns } = validateProducts(parsed.rows, catSlugs);
    parsed.errors = [...parsed.errors, ...errs];
    parsed.warnings = warns;
    setProdParsed(parsed);
  };

  const canCommit =
    (catParsed && catParsed.rows.length > 0 && catParsed.errors.length === 0) ||
    (prodParsed && prodParsed.rows.length > 0 && prodParsed.errors.length === 0);

  const commit = async () => {
    setImporting(true);
    setDone(null);
    try {
      let catCount = 0;
      let prodCount = 0;

      // 1) Upsert categories first (by slug)
      if (catParsed && catParsed.rows.length > 0 && catParsed.errors.length === 0) {
        const payload = catParsed.rows.map((r, i) => ({
          slug: r.slug.trim(),
          name_en: (r.name_en || r.name_fa || r.name_ps || "").trim(),
          name_fa: (r.name_fa || r.name_en || r.name_ps || "").trim(),
          name_ps: (r.name_ps || r.name_en || r.name_fa || "").trim(),
          image: r.image?.trim() || null,
          sort_order: Number(r.sort_order ?? i) || i,
        }));
        const { error } = await supabase.from("categories").upsert(payload, { onConflict: "slug" });
        if (error) throw error;
        catCount = payload.length;
      }

      // 2) Resolve all category slugs → ids
      const slugToId = new Map<string, string>();
      const { data: cats, error: catErr } = await supabase.from("categories").select("id, slug");
      if (catErr) throw catErr;
      (cats ?? []).forEach((c) => c.slug && slugToId.set(c.slug, c.id));

      // 3) Upsert products (by slug)
      if (prodParsed && prodParsed.rows.length > 0 && prodParsed.errors.length === 0) {
        const payload = prodParsed.rows.map((r) => {
          const sizesAttrs = sizesToAttributes(r.sizes);
          const explicitAttrs = safeJson<unknown[]>(r.attributes, []);
          const attributes = sizesAttrs && sizesAttrs.length > 0 ? sizesAttrs : explicitAttrs;
          const gallery = safeJson<string[]>(r.gallery, []);
          const variants = safeJson<unknown[]>(r.variants, []);
          const catSlug = r.category_slug?.trim();
          const category_id = catSlug ? slugToId.get(catSlug) ?? null : null;
          return {
            slug: r.slug.trim(),
            name_en: (r.name_en || r.name_fa || r.name_ps || "").trim(),
            name_fa: (r.name_fa || r.name_en || r.name_ps || "").trim(),
            name_ps: (r.name_ps || r.name_en || r.name_fa || "").trim(),
            description_en: r.description_en?.trim() || null,
            description_fa: r.description_fa?.trim() || null,
            description_ps: r.description_ps?.trim() || null,
            price: Number(r.price ?? 0) || 0,
            image_url: r.image_url?.trim() || null,
            gallery,
            category_id,
            featured: parseBool(r.featured, false),
            in_stock: parseBool(r.in_stock, true),
            video_url: r.video_url?.trim() || null,
            attributes,
            variants,
          };
        });
        // Chunked upsert (Supabase has a payload size limit)
        const chunkSize = 200;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error } = await supabase.from("products").upsert(chunk as never, { onConflict: "slug" });
          if (error) throw error;
        }
        prodCount = payload.length;
      }

      setDone({ categories: catCount, products: prodCount });
      toast.success(`Imported ${catCount} categories and ${prodCount} products`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Import failed: ${msg}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import data from old site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload <code className="rounded bg-muted px-1">categories.csv</code> first, then{" "}
          <code className="rounded bg-muted px-1">products.csv</code>. Both files use slugs as unique keys, so re-running
          the import safely updates existing rows. Use the Codex prompt below to convert your old Laravel CSV exports
          into the right shape.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need to convert old CSVs first?</CardTitle>
          <CardDescription>
            Open <code>codex-migration-prompt.md</code> (delivered as an artifact in chat), paste your old CSV(s) into
            Codex/ChatGPT under it, and you'll get back two files ready to upload here.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">1. Categories</TabsTrigger>
          <TabsTrigger value="products">2. Products</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <FileSection
            label="categories.csv"
            file={catFile}
            parsed={catParsed as ParsedFile<Record<string, unknown>> | null}
            onFile={(f) => handleCatFile(f)}
            previewCols={["slug", "name_en", "name_fa", "name_ps"]}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <FileSection
            label="products.csv"
            file={prodFile}
            parsed={prodParsed as ParsedFile<Record<string, unknown>> | null}
            onFile={(f) => handleProdFile(f)}
            previewCols={["slug", "name_en", "price", "category_slug"]}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {done ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Imported {done.categories} categories and {done.products} products.
              </span>
            ) : canCommit ? (
              <span className="text-muted-foreground">Ready to import. Re-running is safe (upsert by slug).</span>
            ) : (
              <span className="text-muted-foreground">Upload at least one valid CSV with no errors to enable import.</span>
            )}
          </div>
          <Button onClick={commit} disabled={!canCommit || importing} size="lg">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {importing ? "Importing..." : "Commit import"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- File section sub-component ----------
interface FileSectionProps<T extends Record<string, unknown>> {
  label: string;
  file: File | null;
  parsed: ParsedFile<T> | null;
  onFile: (f: File) => void;
  previewCols: string[];
}

function FileSection<T extends Record<string, unknown>>({ label, file, parsed, onFile, previewCols }: FileSectionProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{label}</span>
          {parsed && parsed.errors.length === 0 && parsed.rows.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <FileCheck2 className="h-3 w-3" /> {parsed.rows.length} rows ready
            </Badge>
          )}
          {parsed && parsed.errors.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> {parsed.errors.length} errors
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          UTF-8 CSV with header row. Drag & drop or click below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:bg-muted/50">
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">{file ? file.name : `Choose ${label}`}</span>
          <span className="text-xs text-muted-foreground">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "CSV file, up to a few MB"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        {parsed && parsed.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="mb-1 text-sm font-semibold text-destructive">Errors (must fix before import):</p>
            <ul className="max-h-40 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-destructive">
              {parsed.errors.slice(0, 50).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {parsed.errors.length > 50 && <li>...and {parsed.errors.length - 50} more</li>}
            </ul>
          </div>
        )}

        {parsed && parsed.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-400">Warnings:</p>
            <ul className="max-h-40 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-amber-700 dark:text-amber-400">
              {parsed.warnings.slice(0, 50).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
              {parsed.warnings.length > 50 && <li>...and {parsed.warnings.length - 50} more</li>}
            </ul>
          </div>
        )}

        {parsed && parsed.rows.length > 0 && (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {previewCols.map((c) => (
                    <th key={c} className="px-2 py-1.5 text-left font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t">
                    {previewCols.map((c) => (
                      <td key={c} className="max-w-[200px] truncate px-2 py-1.5">{String((r as Record<string, unknown>)[c] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 5 && (
              <p className="border-t bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                ...and {parsed.rows.length - 5} more rows
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
