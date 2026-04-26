ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS address_fa text,
  ADD COLUMN IF NOT EXISTS address_ps text;