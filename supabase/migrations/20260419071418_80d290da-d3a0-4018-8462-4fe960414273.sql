create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null default '',
  title_fa text not null default '',
  title_ps text not null default '',
  content_en text not null default '',
  content_fa text not null default '',
  content_ps text not null default '',
  meta_description_en text,
  meta_description_fa text,
  meta_description_ps text,
  hero_image text,
  is_published boolean not null default true,
  is_system boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "Public can read published pages"
  on public.pages for select
  to public
  using (is_published = true);

create policy "Admins read all pages"
  on public.pages for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins manage pages"
  on public.pages for all
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create trigger update_pages_updated_at
  before update on public.pages
  for each row execute function public.update_updated_at_column();

insert into public.pages (slug, title_en, title_fa, title_ps, is_system, sort_order) values
  ('about',    'About Us',        'درباره ما',     'زموږ په اړه',    true,  1),
  ('contact',  'Contact Us',      'تماس با ما',    'اړیکه ونیسئ',    true,  2),
  ('shipping', 'Shipping Info',   'اطلاعات ارسال', 'د لیږد معلومات', false, 3),
  ('privacy',  'Privacy Policy',  'حریم خصوصی',    'د محرمیت تګلاره', false, 4),
  ('terms',    'Terms of Service','شرایط استفاده', 'د کارونې شرایط',  false, 5);