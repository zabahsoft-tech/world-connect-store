CREATE TABLE public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  title_fa text NOT NULL DEFAULT '',
  title_ps text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_fa text NOT NULL DEFAULT '',
  subtitle_ps text NOT NULL DEFAULT '',
  cta_label_en text,
  cta_label_fa text,
  cta_label_ps text,
  cta_link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read hero slides"
ON public.hero_slides FOR SELECT
USING (true);

CREATE POLICY "Admins manage hero slides"
ON public.hero_slides FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hero_slides (image, title_en, title_fa, title_ps, subtitle_en, subtitle_fa, subtitle_ps, cta_label_en, cta_label_fa, cta_label_ps, cta_link, sort_order) VALUES
('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920&q=80', 'Discover quality products', 'محصولات با کیفیت را کشف کنید', 'د کیفیت لرونکي توکي ومومئ', 'Shop the latest arrivals at unbeatable prices', 'جدیدترین محصولات با قیمت‌های بی‌نظیر', 'وروستي توکي په غوره بیو', 'Shop now', 'اکنون خرید کنید', 'اوس پیرود وکړئ', '/shop', 1),
('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80', 'Fashion for everyone', 'مد برای همه', 'د هر چا لپاره فیشن', 'Curated styles delivered to your door', 'استایل‌های منتخب درب منزل شما', 'غوره سټایلونه ستاسو ور ته', 'Browse collection', 'مشاهده مجموعه', 'ټولګه وګورئ', '/categories', 2),
('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80', 'Fast & reliable delivery', 'تحویل سریع و مطمئن', 'ګړنده او باوري رسول', 'Order today, get it tomorrow', 'امروز سفارش دهید، فردا دریافت کنید', 'نن فرمایش ورکړئ، سبا یې واخلئ', 'Start shopping', 'شروع خرید', 'پیرود پیل کړئ', '/shop', 3);