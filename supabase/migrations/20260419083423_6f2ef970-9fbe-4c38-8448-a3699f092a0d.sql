-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL DEFAULT '',
  title_fa TEXT NOT NULL DEFAULT '',
  title_ps TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  excerpt_fa TEXT NOT NULL DEFAULT '',
  excerpt_ps TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  content_fa TEXT NOT NULL DEFAULT '',
  content_ps TEXT NOT NULL DEFAULT '',
  meta_description_en TEXT,
  meta_description_fa TEXT,
  meta_description_ps TEXT,
  cover_image TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC);
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN (tags);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published posts"
ON public.blog_posts
FOR SELECT
TO public
USING (is_published = true);

-- Admins read all
CREATE POLICY "Admins read all posts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins manage all
CREATE POLICY "Admins manage posts"
ON public.blog_posts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger using existing helper
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();