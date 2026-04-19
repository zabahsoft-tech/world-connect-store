

Let me explore the current navigation setup to understand how to integrate this.
<lov-tool-use id="toolu_vrtx_01AQMKbnoq6kpj4cgeQ6MNJL" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/Header.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01K7RguNHpb7E2e9AcFqBMHj" name="code--view" integration-id="code" data="{\"file_path\": \"src/routes/admin.pages.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012wyVdp9UqEvTryDTLhtCB6" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/Header.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_015FfizNwYpyjvJJxoFN6FuT" name="code--search_files" integration-id="code" data="{\"query\": \"show_in_nav|show_in_header\"}">
</lov-tool-use>
<lov-plan>

## Plan: Admin-controlled header navigation links

Add a `show_in_nav` toggle on pages so admins can pin any published page into the main header nav.

### 1. Database migration
Add column to `pages`:
```sql
alter table public.pages add column show_in_nav boolean not null default false;
```

### 2. Admin Pages editor — `src/routes/admin.pages.tsx`
- Add a "Show in navigation" switch in the General tab (next to "Published")
- Add a column/badge in the list view so admins can see at a glance which pages are pinned

### 3. Header — `src/components/Header.tsx`
- Query published pages where `show_in_nav = true`, ordered by `sort_order`
- Skip system slugs already in the static nav (`about`, `contact`) to avoid duplicates
- Append them after Contact in both desktop and mobile menus, linking to `/about`, `/contact`, or `/p/{slug}` based on slug
- Use the active language for the label (`pickLang(page, "title", lang)`)

### 4. i18n — `src/lib/i18n.ts`
Add key: `showInNav` ("Show in navigation" / equivalents in fa/ps).

### Files touched
- New migration: `pages.show_in_nav` column
- Edit: `src/routes/admin.pages.tsx` (toggle + list badge)
- Edit: `src/components/Header.tsx` (dynamic nav links)
- Edit: `src/lib/i18n.ts` (new key)

No new dependencies.

