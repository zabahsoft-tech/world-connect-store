// One-shot CSV importer. Reads categories.csv and products.csv from the
// `site-assets/imports/` storage path and upserts into categories/products.
// Uses service role so it bypasses RLS — protected by config (no JWT needed
// but should be removed/disabled after the migration is complete).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CategoryRow {
  slug: string; name_en?: string; name_fa?: string; name_ps?: string;
  image?: string; sort_order?: string;
}
interface ProductRow {
  slug: string; name_en?: string; name_fa?: string; name_ps?: string;
  description_en?: string; description_fa?: string; description_ps?: string;
  price?: string; image_url?: string; gallery?: string;
  category_slug?: string; featured?: string; in_stock?: string;
  video_url?: string; attributes?: string; sizes?: string; variants?: string;
}

const parseBool = (v: unknown, d: boolean) => {
  if (v == null || v === "") return d;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
};

const safeJson = <T,>(raw: string | undefined, fb: T): T => {
  if (!raw || !raw.trim()) return fb;
  try { return JSON.parse(raw) as T; } catch { return fb; }
};

const sizesToAttrs = (txt: string | undefined) => {
  if (!txt || !txt.trim()) return null;
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return lines.map(line => {
    const p = line.split("|").map(x => x.trim());
    const en = p[0] || "", fa = p[1] || en, ps = p[2] || fa;
    return { label_en:"Size", label_fa:"اندازه", label_ps:"اندازه",
             value_en:en, value_fa:fa, value_ps:ps };
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download CSVs
    const [catFile, prodFile] = await Promise.all([
      supabase.storage.from("site-assets").download("imports/categories.csv"),
      supabase.storage.from("site-assets").download("imports/products.csv"),
    ]);
    if (catFile.error) throw new Error(`categories.csv: ${catFile.error.message}`);
    if (prodFile.error) throw new Error(`products.csv: ${prodFile.error.message}`);

    const catText = await catFile.data.text();
    const prodText = await prodFile.data.text();

    const catParsed = Papa.parse<CategoryRow>(catText, {
      header: true, skipEmptyLines: "greedy",
      transformHeader: (h: string) => h.trim(),
    });
    const prodParsed = Papa.parse<ProductRow>(prodText, {
      header: true, skipEmptyLines: "greedy",
      transformHeader: (h: string) => h.trim(),
    });

    // Categories
    const catPayload = catParsed.data
      .filter(r => r.slug?.trim())
      .map((r, i) => {
        const en = (r.name_en || r.name_fa || r.name_ps || "").trim();
        const fa = (r.name_fa || en).trim();
        const ps = (r.name_ps || fa).trim();
        return {
          slug: r.slug!.trim(),
          name_en: en, name_fa: fa, name_ps: ps,
          image: r.image?.trim() || null,
          sort_order: Number(r.sort_order ?? i) || i,
        };
      });

    if (catPayload.length) {
      const { error } = await supabase.from("categories")
        .upsert(catPayload, { onConflict: "slug" });
      if (error) throw new Error(`categories upsert: ${error.message}`);
    }

    // Resolve slug → id
    const { data: cats, error: catErr } = await supabase
      .from("categories").select("id, slug");
    if (catErr) throw new Error(`fetch categories: ${catErr.message}`);
    const slugToId = new Map<string, string>();
    (cats ?? []).forEach(c => c.slug && slugToId.set(c.slug, c.id));

    // Products
    const missing = new Set<string>();
    const prodPayload = prodParsed.data
      .filter(r => r.slug?.trim())
      .map(r => {
        const en = (r.name_en || r.name_fa || r.name_ps || "").trim();
        const fa = (r.name_fa || en).trim();
        const ps = (r.name_ps || fa).trim();
        const sizesAttrs = sizesToAttrs(r.sizes);
        const explicitAttrs = safeJson<unknown[]>(r.attributes, []);
        const attributes = sizesAttrs?.length ? sizesAttrs : explicitAttrs;
        const gallery = safeJson<string[]>(r.gallery, []);
        const variants = safeJson<unknown[]>(r.variants, []);
        const catSlug = r.category_slug?.trim();
        const category_id = catSlug ? (slugToId.get(catSlug) ?? null) : null;
        if (catSlug && !category_id) missing.add(catSlug);
        return {
          slug: r.slug!.trim(),
          name_en: en, name_fa: fa, name_ps: ps,
          description_en: r.description_en?.trim() || null,
          description_fa: r.description_fa?.trim() || null,
          description_ps: r.description_ps?.trim() || null,
          price: Number(r.price ?? 0) || 0,
          image_url: r.image_url?.trim() || null,
          gallery, category_id,
          featured: parseBool(r.featured, false),
          in_stock: parseBool(r.in_stock, true),
          video_url: r.video_url?.trim() || null,
          attributes, variants,
        };
      });

    let productsImported = 0;
    const CHUNK = 50;
    for (let i = 0; i < prodPayload.length; i += CHUNK) {
      const chunk = prodPayload.slice(i, i + CHUNK);
      const { error } = await supabase.from("products")
        .upsert(chunk as never, { onConflict: "slug" });
      if (error) throw new Error(`products upsert chunk ${i}: ${error.message}`);
      productsImported += chunk.length;
    }

    return new Response(JSON.stringify({
      ok: true,
      categories_imported: catPayload.length,
      products_imported: productsImported,
      missing_categories: Array.from(missing),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
