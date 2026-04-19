import { Link } from "@tanstack/react-router";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  price: number;
  image_url: string | null;
  in_stock: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const { lang, tr } = useLang();
  const { add } = useCart();
  const name = pickLang(product, "name", lang);

  return (
    <Card className="group flex flex-col overflow-hidden border transition-all hover:shadow-[var(--shadow-soft)]">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square w-full overflow-hidden bg-muted"
        aria-label={name}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/products/$slug" params={{ slug: product.slug }}>
          <h3 className="line-clamp-2 font-semibold leading-tight hover:text-primary">{name}</h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-primary">{Number(product.price).toFixed(2)}</span>
          <Button
            size="sm"
            disabled={!product.in_stock}
            onClick={() => {
              add({
                id: product.id,
                slug: product.slug,
                name_en: product.name_en,
                name_fa: product.name_fa,
                name_ps: product.name_ps,
                price: Number(product.price),
                image_url: product.image_url,
              });
              toast.success(tr("addToCart"));
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="ms-1 hidden sm:inline">{product.in_stock ? tr("addToCart") : tr("outOfStock")}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
