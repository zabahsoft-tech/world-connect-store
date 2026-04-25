-- 1. Add new images column to products and migrate data
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Migrate image_url + gallery into images array
UPDATE public.products
SET images = (
  CASE
    WHEN image_url IS NOT NULL AND image_url <> '' THEN
      jsonb_build_array(image_url) || COALESCE(gallery, '[]'::jsonb)
    ELSE
      COALESCE(gallery, '[]'::jsonb)
  END
)
WHERE images = '[]'::jsonb;

-- Drop old columns
ALTER TABLE public.products DROP COLUMN IF EXISTS image_url;
ALTER TABLE public.products DROP COLUMN IF EXISTS gallery;
ALTER TABLE public.products DROP COLUMN IF EXISTS attributes;
ALTER TABLE public.products DROP COLUMN IF EXISTS variants;
ALTER TABLE public.products DROP COLUMN IF EXISTS specifications;

-- 2. Create filter_groups table
CREATE TABLE public.filter_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_fa text NOT NULL,
  name_ps text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.filter_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read filter groups"
  ON public.filter_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins manage filter groups"
  ON public.filter_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_filter_groups_updated_at
  BEFORE UPDATE ON public.filter_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create filter_options table
CREATE TABLE public.filter_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.filter_groups(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_fa text NOT NULL,
  name_ps text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_filter_options_group ON public.filter_options(group_id);

ALTER TABLE public.filter_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read filter options"
  ON public.filter_options FOR SELECT
  USING (true);

CREATE POLICY "Admins manage filter options"
  ON public.filter_options FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_filter_options_updated_at
  BEFORE UPDATE ON public.filter_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create product_filter_options join table
CREATE TABLE public.product_filter_options (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.filter_options(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, option_id)
);

CREATE INDEX idx_pfo_product ON public.product_filter_options(product_id);
CREATE INDEX idx_pfo_option ON public.product_filter_options(option_id);

ALTER TABLE public.product_filter_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product filter options"
  ON public.product_filter_options FOR SELECT
  USING (true);

CREATE POLICY "Admins manage product filter options"
  ON public.product_filter_options FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));