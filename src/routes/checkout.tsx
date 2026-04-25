import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { useCart } from "@/contexts/CartContext";
import { pickLang } from "@/lib/i18n";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buildOrderMessage, openWhatsApp } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { tr, lang } = useLang();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customer_name: "", phone: "", address: "", notes: "" },
  });

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{tr("emptyCart")}</p>
          <Link to="/shop"><Button className="mt-4">{tr("continueShopping")}</Button></Link>
        </div>
      </SiteLayout>
    );
  }

  const onSubmit = async (values: FormData) => {
    const wa = settings.data?.whatsapp_number;
    if (!wa) {
      toast.error("WhatsApp number not configured. Please contact admin.");
      return;
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        id: i.id,
        slug: i.slug,
        name_en: i.name_en,
        name_fa: i.name_fa,
        name_ps: i.name_ps,
        price: i.price,
        quantity: i.quantity,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: values.customer_name,
          phone: values.phone,
          address: values.address ?? null,
          notes: values.notes ?? null,
          items: orderItems,
          total,
          language: lang,
        })
        .select("id")
        .single();

      if (error) throw error;

      const msg = buildOrderMessage({
        lang,
        customerName: values.customer_name,
        phone: values.phone,
        address: values.address,
        notes: values.notes,
        items,
        total,
        orderId: data.id,
      });

      toast.success(tr("orderPlaced"));
      openWhatsApp(wa, msg);
      clear();
      setTimeout(() => navigate({ to: "/" }), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{tr("checkout")}</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="customer_name">{tr("customerName")}</Label>
                <Input id="customer_name" {...form.register("customer_name")} />
                {form.formState.errors.customer_name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.customer_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">{tr("phone")}</Label>
                <Input id="phone" type="tel" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">{tr("address")}</Label>
                <Textarea id="address" rows={2} {...form.register("address")} />
              </div>
              <div>
                <Label htmlFor="notes">{tr("notes")}</Label>
                <Textarea id="notes" rows={3} {...form.register("notes")} />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1EBE5D]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {submitting ? "..." : tr("placeOrder")}
              </Button>
            </form>
          </Card>

          <Card className="h-fit p-5">
            <h2 className="mb-4 text-lg font-bold">{tr("total")}</h2>
            <ul className="mb-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1 text-muted-foreground">{pickLang(i, "name", lang)} × {i.quantity}</span>
                  <span className="shrink-0 font-medium">{(i.price * i.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold">{tr("total")}</span>
              <span className="text-xl font-bold text-primary">{total.toFixed(2)}</span>
            </div>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}
