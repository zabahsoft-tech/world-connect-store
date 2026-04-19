

## Plan: Contact message form with admin inbox

Add a Name + Phone + Email + Message form to the Contact page. Each submission saves to the database, opens a pre-filled WhatsApp deep link to your number, and appears in a new "Messages" inbox in the admin panel.

### 1. Database — new `contact_messages` table

```sql
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  language text not null default 'en',
  status text not null default 'new',  -- 'new' | 'read' | 'archived'
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
-- Anyone can insert (public form)
create policy "Public can submit messages" on public.contact_messages
  for insert to public with check (true);
-- Admins can read/update/delete
create policy "Admins read messages" on public.contact_messages
  for select to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins update messages" on public.contact_messages
  for update to authenticated using (has_role(auth.uid(), 'admin'));
create policy "Admins delete messages" on public.contact_messages
  for delete to authenticated using (has_role(auth.uid(), 'admin'));
```

### 2. Public form — edit `src/routes/contact.tsx`
Add a form card above the existing contact-info cards with:
- Name (required, 2–100 chars)
- Phone (optional, 6–30 chars, digits/spaces/+ only)
- Email (optional, valid email)
- Message (required, 5–1000 chars)
- Submit button → zod-validate → insert into `contact_messages` → on success: toast + open WhatsApp deep link pre-filled with `"New message from {name} ({phone}): {message}"` so the customer can also send it directly.

### 3. Admin inbox — new `src/routes/admin.messages.tsx`
- List view (newest first) showing name, phone/email, snippet, status badge, time
- Click row → side dialog with full message + customer contact info + buttons:
  - "Open in WhatsApp" (uses customer's phone)
  - "Email reply" (mailto:)
  - "Mark as read" / "Archive" / "Delete"
- Filter chips: All / New / Read / Archived
- Unread count badge on the sidebar nav item

### 4. Wire admin nav — edit `src/routes/admin.tsx`
Add `{ to: "/admin/messages", label: "Messages", icon: MessageSquare }` to NAV. Show the unread count badge next to the label.

### 5. i18n — edit `src/lib/i18n.ts`
Add keys: `messages`, `yourName`, `yourEmail`, `yourMessage`, `sendMessage`, `messageSent`, `messageError`, `markAsRead`, `archive`, `noMessages`, `newMessage`.

### Files
- New migration: `contact_messages` table + RLS
- New: `src/routes/admin.messages.tsx`
- Edit: `src/routes/contact.tsx` (add form section)
- Edit: `src/routes/admin.tsx` (nav entry + unread badge)
- Edit: `src/lib/i18n.ts` (new keys)

No new dependencies, no edge functions needed (insert goes through Supabase client + RLS).

