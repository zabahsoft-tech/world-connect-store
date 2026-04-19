

## Plan: Polish the blog post page

The page already loads correctly (network shows 200s) — what feels "not working" is the bare layout: tiny content like `<p>ABN</p>` looks lost, the hero has no overlaid title, there's no share row, no reading time, no view tracking, and when there are no related posts the page just ends abruptly.

### 1. Hero with overlaid title — `src/routes/blog.$slug.tsx`
Replace the standalone cover image + separate title block with a unified hero:
- Cover image becomes a **full-width banner** with stronger gradient (`from-background via-background/80`) and **title + meta overlaid at the bottom** (white text, drop-shadow).
- When no cover image: show a clean gradient header block with the title centered.
- Breadcrumb (`Blog → {title}`) sits **above** the hero in the container.
- Tags chip row moved into the overlay.

### 2. Article body card
- Wrap the prose in a **white/card container** (`rounded-2xl border bg-card shadow-sm p-6 md:p-10`) that floats up over the hero edge (`-mt-12 relative z-10`).
- Add `max-w-3xl mx-auto` for comfortable reading width.
- Apply richer prose tokens: `prose-headings:tracking-tight prose-p:leading-relaxed prose-img:shadow-md prose-blockquote:border-primary`.
- Empty content fallback shows a friendlier message + back-to-blog button.

### 3. Meta row enhancements
Under the title, show: **date · reading time · author** (compute reading time from word count of `content_{lang}`, ~200 wpm). Use small icons (Calendar, Clock, User from lucide-react).

### 4. Share row
After the article body, add a compact **Share** bar with WhatsApp, Telegram, Facebook, X/Twitter, and Copy link buttons (use existing `WhatsAppIcon` + lucide). Each opens the platform share URL in a new tab; copy uses `navigator.clipboard` + sonner toast.

### 5. View counter (lightweight)
On mount, fire-and-forget `supabase.rpc` not needed — just `update blog_posts set views = views + 1 where id = ...`. RLS currently blocks public UPDATE, so add a tiny migration: SECURITY DEFINER function `increment_blog_view(post_id uuid)` that bumps `views`, granted to `anon, authenticated`. Display "X views" in the meta row when > 0.

### 6. Related section fallback + CTA
- When `related.length === 0`: show a single centered CTA card "Explore more articles → /blog" instead of nothing.
- When present: keep the 3-card grid but tighten spacing and add the date to each card.

### 7. Back-to-top + sticky read progress (small touches)
- Thin **reading progress bar** fixed at the top of the viewport (driven by scroll position on the article element).
- After the article, a "← Back to all posts" link styled as a button.

### 8. Mobile polish
- Hero height: `h-[280px] md:h-[420px]`.
- Title sizes: `text-2xl md:text-4xl lg:text-5xl`.
- Share row wraps; buttons stay ≥40px tap targets.
- Card overlap (`-mt-12`) reduces to `-mt-8` on mobile.

### Files touched
- Edit: `src/routes/blog.$slug.tsx` (full layout refresh + share + view increment + reading time + progress bar)
- New migration: `increment_blog_view(uuid)` SECURITY DEFINER function + grant
- No i18n changes required (reuse existing `blog`, `relatedPosts`, `publishedOn`, `readMore` keys; share labels can stay English-only since they're brand names)

No new dependencies.

