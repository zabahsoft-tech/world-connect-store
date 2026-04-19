import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { tr, lang } = useLang();
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center">
          <ShoppingBag className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
          <h1 className="mt-4 text-2xl font-bold">{tr("emptyCart")}</h1>
          <Link to="/shop" className="mt-6">
            <Button size="lg">{tr("continueShopping")}</Button>
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{tr("cart")}</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="flex items-center gap-4 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {i.image_url && <img src={i.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/products/$slug" params={{ slug: i.slug }} className="line-clamp-1 font-semibold hover:text-primary">
                    {pickLang(i, "name", lang)}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-primary">{i.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center rounded-lg border">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQty(i.id, i.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQty(i.id, i.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label={tr("remove")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <h2 className="mb-4 text-lg font-bold">{tr("total")}</h2>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{tr("subtotal")}</span>
              <span className="font-semibold">{total.toFixed(2)}</span>
            </div>
            <div className="mb-4 flex justify-between border-t pt-3">
              <span className="font-bold">{tr("total")}</span>
              <span className="text-xl font-bold text-primary">{total.toFixed(2)}</span>
            </div>
            <Link to="/checkout">
              <Button size="lg" className="w-full">{tr("proceedCheckout")}</Button>
            </Link>
            <Link to="/shop" className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary">
              {tr("continueShopping")}
            </Link>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
