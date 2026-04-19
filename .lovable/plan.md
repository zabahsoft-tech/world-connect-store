

## Plan: Multilingual Blog with high SEO

A full blog system mirroring the existing Pages pattern: 3-language content, admin CRUD, public listing + detail, and SEO (per-post metadata, OG image, JSON-LD Article, sitemap inclusion, RSS feed).

### 1. Database — new `blog_posts` table (migration)
Columns:
- `id`, `slug` (unique), `created_at`, `updated_at`
- `title_en/fa/ps`, `excerpt_en/fa/ps`, `content_en/fa/ps` (rich HTML)
- `meta_description_en/fa/ps`, `cover_image`, `tags` (text[])
- `is_published` (bool), `published_at` (timestamptz), `views` (int default 0)
- `author_name` (text, optional)

RLS:
- Public SELECT where `is_published = true`
- Admin ALL via `has_role(auth.uid(), 'admin')`

Index on `(is_published, published_at desc)` and unique on `slug`.

### 2. Admin UI — `src/routes/admin.blog.tsx`
Mirrors `admin.pages.tsx`:
- List with publish toggle, edit, delete, view-link
- Dialog with 3 tabs: **General** (slug auto from EN title, cover image, tags input, publish + published_at), **Content** (excerpt + RichText body × 3 langs), **SEO** (meta description × 3 langs)
- Add `/admin/blog` to the sidebar `NAV` in `admin.tsx` (icon: `Newspaper`)

### 3. Public routes
- **`src/routes/blog.tsx`** — listing page: paginated grid of post cards (cover, title, excerpt, date), filter by tag from search params (`?tag=...`), language-aware text via `pickLang`. Includes proper `head()` with title/description/OG.
- **`src/routes/blog.$slug.tsx`** — single post: hero cover, title, date, author, prose body, related posts (3 latest excluding current). Loader fetches by slug + `is_published=true`, throws `notFound()` otherwise.

### 4. SEO — per-post and global
On `blog.$slug.tsx`:
- `head()` derives title, description (meta_description or excerpt), `og:image` from `cover_image`, `og:type=article`, `article:published_time`, hreflang links.
- JSON-LD `BlogPosting` schema (headline, image, datePublished, author, mainEntityOfPage) — add helper `buildBlogPostingJsonLd` in `src/lib/seo.ts`.
- Add `blog` entry to `SEO_PAGES` for the listing page (en/fa/ps).

On `blog.tsx`:
- JSON-LD `Blog` schema with `blogPost` ItemList of recent posts.

Global:
- Update `src/routes/sitemap[.]xml.tsx` to query `blog_posts` and add `/blog/{slug}` entries with `lastmod`, plus `/blog` itself.
- New **`src/routes/rss[.]xml.tsx`** — RSS 2.0 feed of latest 30 published posts (English content for feed body).
- Add `<link rel="alternate" type="application/rss+xml">` in root head.

### 5. Navigation + i18n
- Add **Blog** link to header `Header.tsx` (between Categories and About).
- New i18n keys in `src/lib/i18n.ts`: `blog`, `readMore`, `latestPosts`, `relatedPosts`, `publishedOn`, `noPostsYet`, `tags`, `allPosts`, `excerpt`, `coverImage` — each in en/fa/ps.

### Files touched
- New migration: `blog_posts` table + RLS + indexes
- New: `src/routes/admin.blog.tsx`, `src/routes/blog.tsx`, `src/routes/blog.$slug.tsx`, `src/routes/rss[.]xml.tsx`
- Edit: `src/routes/admin.tsx` (nav entry), `src/components/Header.tsx` (blog link), `src/lib/i18n.ts` (keys), `src/lib/seo.ts` (BlogPosting helper + blog SEO_PAGES), `src/routes/sitemap[.]xml.tsx` (include posts)

No new dependencies.

