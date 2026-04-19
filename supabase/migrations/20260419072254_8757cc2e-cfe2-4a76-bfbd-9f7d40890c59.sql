create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  language text not null default 'en',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Public can submit messages"
  on public.contact_messages
  for insert
  to public
  with check (true);

create policy "Admins read messages"
  on public.contact_messages
  for select
  to authenticated
  using (has_role(auth.uid(), 'admin'));

create policy "Admins update messages"
  on public.contact_messages
  for update
  to authenticated
  using (has_role(auth.uid(), 'admin'));

create policy "Admins delete messages"
  on public.contact_messages
  for delete
  to authenticated
  using (has_role(auth.uid(), 'admin'));

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index contact_messages_status_idx on public.contact_messages (status);