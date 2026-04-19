import type { Lang } from "./i18n";

// Canonical production URL — fallback for SSR / sitemap when window is unavailable
export const SITE_URL = "https://world-connect-store.lovable.app";

export const GEO = {
  region: "AF",
  placename: "Kabul, Afghanistan",
  position: "34.5553;69.2075",
  icbm: "34.5553, 69.2075",
  currency: "AFN",
} as const;

export const LOCALE_MAP: Record<Lang, string> = {
  en: "en_US",
  fa: "fa_AF",
  ps: "ps_AF",
};

export const HREFLANG_MAP: Record<Lang, string> = {
  en: "en-AF",
  fa: "fa-AF",
  ps: "ps-AF",
};

type SeoCopy = Record<Lang, { title: string; description: string; keywords: string }>;

const STORE_NAME = {
  en: "World Connect Store",
  fa: "فروشگاه ورلد کانکت",
  ps: "د ورلډ کنیکټ پلورنځی",
};

const COMMON_KEYWORDS = {
  en: "Afghanistan online shop, Kabul shopping, online store Afghanistan, WhatsApp order, Herat, Mazar-i-Sharif, Kandahar, Jalalabad",
  fa: "فروشگاه آنلاین افغانستان، خرید آنلاین کابل، خرید اینترنتی، سفارش از واتساپ، هرات، مزار شریف، قندهار، جلال آباد",
  ps: "د افغانستان آنلاین پلورنځی، د کابل آنلاین پیرود، انټرنیټي پیرود، د واټس اپ فرمایش، هرات، مزار شریف، کندهار، جلال آباد",
};

export const SEO_PAGES: Record<string, SeoCopy> = {
  home: {
    en: {
      title: "World Connect Store — Online Shopping in Afghanistan | Order on WhatsApp",
      description: "Shop online in Afghanistan. Browse our catalog and place your order instantly via WhatsApp. Fast delivery in Kabul, Herat, Mazar-i-Sharif, Kandahar, and Jalalabad.",
      keywords: `online shopping Afghanistan, ${COMMON_KEYWORDS.en}, ecommerce Kabul`,
    },
    fa: {
      title: "فروشگاه ورلد کانکت — خرید آنلاین در افغانستان | سفارش از واتساپ",
      description: "خرید آنلاین در افغانستان. کاتالوگ ما را مرور کنید و سفارش خود را فوراً از طریق واتساپ ثبت کنید. ارسال سریع به کابل، هرات، مزار شریف، قندهار و جلال آباد.",
      keywords: `خرید آنلاین افغانستان، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "د ورلډ کنیکټ پلورنځی — په افغانستان کې آنلاین پیرود | په واټس اپ فرمایش",
      description: "په افغانستان کې آنلاین پیرود وکړئ. زموږ کتلاګ وګورئ او خپل فرمایش د واټس اپ له لارې سمدلاسه ثبت کړئ. کابل، هرات، مزار شریف، کندهار او جلال آباد ته ګړنده رسول.",
      keywords: `آنلاین پیرود افغانستان، ${COMMON_KEYWORDS.ps}`,
    },
  },
  shop: {
    en: {
      title: "Shop All Products — World Connect Store Afghanistan",
      description: "Browse all products available for delivery across Afghanistan. Filter by category, search, and order on WhatsApp.",
      keywords: `shop Afghanistan, products Kabul, ${COMMON_KEYWORDS.en}`,
    },
    fa: {
      title: "فروشگاه — همه محصولات | ورلد کانکت افغانستان",
      description: "همه محصولات قابل ارسال در سراسر افغانستان را مرور کنید. بر اساس دسته‌بندی فیلتر کنید، جستجو کنید و از واتساپ سفارش دهید.",
      keywords: `فروشگاه افغانستان، محصولات کابل، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "پلورنځی — ټول توکي | ورلډ کنیکټ افغانستان",
      description: "هغه ټول توکي وګورئ چې په ټول افغانستان کې د رسولو وړ دي. د کټګورۍ له مخې فلټر کړئ، لټون وکړئ او په واټس اپ فرمایش وکړئ.",
      keywords: `پلورنځی افغانستان، د کابل توکي، ${COMMON_KEYWORDS.ps}`,
    },
  },
  categories: {
    en: {
      title: "Product Categories — World Connect Store Afghanistan",
      description: "Explore our product categories. Find what you need and order quickly on WhatsApp from anywhere in Afghanistan.",
      keywords: `categories Afghanistan, ${COMMON_KEYWORDS.en}`,
    },
    fa: {
      title: "دسته‌بندی محصولات — ورلد کانکت افغانستان",
      description: "دسته‌بندی محصولات ما را کاوش کنید. آنچه را نیاز دارید پیدا کنید و از هر جای افغانستان سریعاً از واتساپ سفارش دهید.",
      keywords: `دسته‌بندی افغانستان، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "د توکو کټګورۍ — ورلډ کنیکټ افغانستان",
      description: "زموږ د توکو کټګورۍ وڅیړئ. څه چې اړتیا لرئ ومومئ او د افغانستان له هرځایه په ګړندۍ توګه په واټس اپ فرمایش وکړئ.",
      keywords: `کټګورۍ افغانستان، ${COMMON_KEYWORDS.ps}`,
    },
  },
  about: {
    en: {
      title: "About Us — World Connect Store Afghanistan",
      description: "Learn about World Connect Store, your trusted online shopping destination in Afghanistan with WhatsApp ordering.",
      keywords: `about World Connect, online store Afghanistan, ${COMMON_KEYWORDS.en}`,
    },
    fa: {
      title: "درباره ما — فروشگاه ورلد کانکت افغانستان",
      description: "با فروشگاه ورلد کانکت آشنا شوید، مقصد قابل اعتماد خرید آنلاین شما در افغانستان با امکان سفارش از واتساپ.",
      keywords: `درباره ورلد کانکت، فروشگاه آنلاین افغانستان، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "زموږ په اړه — د ورلډ کنیکټ پلورنځی افغانستان",
      description: "د ورلډ کنیکټ پلورنځي سره آشنا شئ، ستاسو په افغانستان کې د واټس اپ فرمایش سره د آنلاین پیرود د باور وړ ځای.",
      keywords: `د ورلډ کنیکټ په اړه، آنلاین پلورنځی افغانستان، ${COMMON_KEYWORDS.ps}`,
    },
  },
  contact: {
    en: {
      title: "Contact Us — World Connect Store Afghanistan",
      description: "Get in touch with World Connect Store. Reach us via WhatsApp, phone, or email for orders and support across Afghanistan.",
      keywords: `contact, WhatsApp Afghanistan, ${COMMON_KEYWORDS.en}`,
    },
    fa: {
      title: "تماس با ما — فروشگاه ورلد کانکت افغانستان",
      description: "با فروشگاه ورلد کانکت در ارتباط باشید. برای سفارش و پشتیبانی در سراسر افغانستان از واتساپ، تلفن یا ایمیل با ما تماس بگیرید.",
      keywords: `تماس، واتساپ افغانستان، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "اړیکه — د ورلډ کنیکټ پلورنځی افغانستان",
      description: "د ورلډ کنیکټ پلورنځي سره اړیکه ونیسئ. د افغانستان په کچه د فرمایش او ملاتړ لپاره د واټس اپ، تلیفون یا برېښنالیک له لارې موږ سره اړیکه ونیسئ.",
      keywords: `اړیکه، واټس اپ افغانستان، ${COMMON_KEYWORDS.ps}`,
    },
  },
  blog: {
    en: {
      title: "Blog — News, Tips & Updates | World Connect Store Afghanistan",
      description: "Read the latest articles, shopping tips, product updates, and news from World Connect Store. Stay informed about online shopping in Afghanistan.",
      keywords: `blog, news, articles, ${COMMON_KEYWORDS.en}`,
    },
    fa: {
      title: "وبلاگ — اخبار، نکات و به‌روزرسانی‌ها | ورلد کانکت افغانستان",
      description: "آخرین مقالات، نکات خرید، به‌روزرسانی محصولات و اخبار فروشگاه ورلد کانکت را بخوانید. درباره خرید آنلاین در افغانستان آگاه باشید.",
      keywords: `وبلاگ، اخبار، مقالات، ${COMMON_KEYWORDS.fa}`,
    },
    ps: {
      title: "بلاګ — خبرونه، نکتې او تازه معلومات | ورلډ کنیکټ افغانستان",
      description: "د ورلډ کنیکټ پلورنځي وروستي مقالې، د پیرودلو نکتې، د توکو تازه معلومات او خبرونه ولولئ. په افغانستان کې د آنلاین پیرود په اړه خبر اوسئ.",
      keywords: `بلاګ، خبرونه، مقالې، ${COMMON_KEYWORDS.ps}`,
    },
  },
};

export interface BlogPostingArgs {
  title: string;
  description: string;
  image?: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function buildBlogPostingJsonLd(args: BlogPostingArgs) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: args.title,
    description: args.description,
    ...(args.image && { image: args.image }),
    datePublished: args.datePublished,
    dateModified: args.dateModified || args.datePublished,
    author: {
      "@type": args.authorName ? "Person" : "Organization",
      name: args.authorName || STORE_NAME.en,
    },
    publisher: {
      "@type": "Organization",
      name: STORE_NAME.en,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": args.url,
    },
  };
}

export function buildBlogJsonLd(posts: Array<{ title: string; url: string; datePublished: string; description: string; image?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${STORE_NAME.en} Blog`,
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: p.url,
      datePublished: p.datePublished,
      description: p.description,
      ...(p.image && { image: p.image }),
    })),
  };
}

interface BuildMetaArgs {
  title: string;
  description: string;
  image?: string;
  url: string;
  lang?: Lang;
  type?: "website" | "article" | "product";
  keywords?: string;
}

export function buildMeta({
  title,
  description,
  image,
  url,
  lang = "en",
  type = "website",
  keywords,
}: BuildMetaArgs) {
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },

    // Geo targeting — Afghanistan
    { name: "geo.region", content: GEO.region },
    { name: "geo.placename", content: GEO.placename },
    { name: "geo.position", content: GEO.position },
    { name: "ICBM", content: GEO.icbm },

    // Mobile / accessibility hints
    { name: "format-detection", content: "telephone=yes" },
    { name: "theme-color", content: "#0ea5e9" },

    // Open Graph
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:site_name", content: STORE_NAME[lang] },
    { property: "og:locale", content: LOCALE_MAP[lang] },

    // Twitter
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  // Locale alternates for OG
  (Object.entries(LOCALE_MAP) as [Lang, string][])
    .filter(([l]) => l !== lang)
    .forEach(([, locale]) => {
      meta.push({ property: "og:locale:alternate", content: locale });
    });

  if (keywords) meta.push({ name: "keywords", content: keywords });
  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
  }

  return meta;
}

export function buildHreflangLinks(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: `${SITE_URL}${cleanPath}` },
    { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}${cleanPath}` },
  ];
  (Object.entries(HREFLANG_MAP) as [Lang, string][]).forEach(([, code]) => {
    links.push({ rel: "alternate", hreflang: code, href: `${SITE_URL}${cleanPath}` });
  });
  return links;
}

interface OrgJsonLdArgs {
  name?: string;
  url?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  sameAs?: string[];
}

export function buildOrganizationJsonLd(args: OrgJsonLdArgs = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: args.name || STORE_NAME.en,
    url: args.url || SITE_URL,
    ...(args.logo && { logo: args.logo }),
    address: {
      "@type": "PostalAddress",
      addressCountry: "AF",
      addressLocality: "Kabul",
      ...(args.address && { streetAddress: args.address }),
    },
    ...(args.phone && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: args.phone,
        contactType: "customer service",
        areaServed: "AF",
        availableLanguage: ["English", "Persian", "Pashto"],
      },
    }),
    ...(args.email && { email: args.email }),
    ...(args.sameAs && args.sameAs.length > 0 && { sameAs: args.sameAs }),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE_NAME.en,
    url: SITE_URL,
    inLanguage: ["en", "fa", "ps"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

interface ProductJsonLdArgs {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  inStock: boolean;
  url: string;
  sku?: string;
}

export function buildProductJsonLd(args: ProductJsonLdArgs) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: args.name,
    ...(args.description && { description: args.description }),
    ...(args.image && { image: args.image }),
    ...(args.sku && { sku: args.sku }),
    offers: {
      "@type": "Offer",
      url: args.url,
      priceCurrency: args.currency || GEO.currency,
      price: args.price.toFixed(2),
      availability: args.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      areaServed: {
        "@type": "Country",
        name: "Afghanistan",
      },
    },
  };
}

export function buildLocalBusinessJsonLd(args: OrgJsonLdArgs = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: args.name || STORE_NAME.en,
    url: args.url || SITE_URL,
    ...(args.logo && { image: args.logo }),
    ...(args.phone && { telephone: args.phone }),
    ...(args.email && { email: args.email }),
    address: {
      "@type": "PostalAddress",
      addressCountry: "AF",
      addressLocality: "Kabul",
      ...(args.address && { streetAddress: args.address }),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 34.5553,
      longitude: 69.2075,
    },
    areaServed: [
      { "@type": "City", name: "Kabul" },
      { "@type": "City", name: "Herat" },
      { "@type": "City", name: "Mazar-i-Sharif" },
      { "@type": "City", name: "Kandahar" },
      { "@type": "City", name: "Jalalabad" },
    ],
    ...(args.sameAs && args.sameAs.length > 0 && { sameAs: args.sameAs }),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function getPageSeo(pageKey: keyof typeof SEO_PAGES, lang: Lang = "en") {
  return SEO_PAGES[pageKey][lang];
}
