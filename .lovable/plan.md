

## Add image upload to the rich text editor (used by Pages)

Add image insertion to `RichTextEditor` so admins can embed images inside page content (and any other place the editor is used). Images are uploaded to the existing `site-assets` Supabase bucket using the same path/code as `ImageUpload`, then inserted into the editor at the cursor.

### Changes

**1. Add Tiptap image extension dependency**
- Run `bun add @tiptap/extension-image@^3.22.4` (matches the version of the other `@tiptap/*` packages already installed).

**2. `src/components/RichTextEditor.tsx` — add Image extension + toolbar button**
- Import `Image` from `@tiptap/extension-image` and add it to the `extensions` array, configured with `inline: false`, `allowBase64: false`, and an `HTMLAttributes` class so embedded images get sensible styling: `class: "rounded-md max-w-full h-auto"`.
- Import `ImageIcon` (lucide) and `Loader2` for the upload spinner.
- Import `supabase` from `@/integrations/supabase/client` and `toast` from `sonner`.
- Add a hidden `<input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" />` ref + an `uploading` state.
- Add an `uploadImage(file)` helper mirroring `ImageUpload.handleFile`:
  - 5 MB limit (toast on overflow).
  - Upload to `site-assets` bucket at path `editor/{Date.now()}-{rand}.{ext}`.
  - Get public URL and call `editor.chain().focus().setImage({ src: url, alt: file.name }).run()`.
  - Toast success / failure.
- Add a new toolbar `ToolBtn` next to the Link buttons:
  - Icon: `ImageIcon` (or `Loader2` spinner while uploading).
  - Title: "Insert image".
  - Click: opens the hidden file input.
  - Disabled while uploading.
- Add a new prop (optional) `imageFolder?: string` defaulted to `"editor"` so callers can route uploads into a different subfolder if they want — `admin.pages.tsx` will pass `imageFolder="pages/content"`.

**3. `src/routes/admin.pages.tsx` — pass folder**
- Pass `imageFolder="pages/content"` to each of the three `<RichTextEditor>` instances (EN/FA/PS) so embedded page images live under `site-assets/pages/content/`.

**4. `src/components/SafeHtml.tsx` — confirm images are kept**
- DOMPurify with `USE_PROFILES: { html: true }` keeps `<img>` with `src/alt/width/height` by default, so no change needed. Public-page rendering (`/p/$slug`, `/about`, `/contact`) will display embedded images correctly through the existing `SafeHtml`.

### Notes / out of scope

- Uses the existing `site-assets` bucket — assumes it is already public and writable for admins (it is, since `ImageUpload` already uses it for hero images).
- No drag-and-drop or paste-from-clipboard image upload in this pass — only the toolbar button. Easy to add later by attaching `editor.view.props.handlePaste` / `handleDrop` to the same `uploadImage` helper.
- No image resize/alignment controls — Tiptap renders images at natural width capped to `max-w-full`. Can be added later with `tiptap-extension-resize-image` if needed.
- No alt-text prompt — alt defaults to the original filename. Can be promoted to a `window.prompt` later if desired.

### Files touched

- `package.json` (via `bun add @tiptap/extension-image`)
- `src/components/RichTextEditor.tsx`
- `src/routes/admin.pages.tsx`

