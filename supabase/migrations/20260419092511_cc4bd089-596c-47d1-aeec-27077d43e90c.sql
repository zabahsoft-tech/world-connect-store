CREATE OR REPLACE FUNCTION public.increment_blog_view(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id AND is_published = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_view(uuid) TO anon, authenticated;