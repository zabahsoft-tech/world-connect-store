import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Flame, Loader2, Send, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildMeta, buildHreflangLinks, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/diesel-burners")({
  head: () => ({
    meta: buildMeta({
      title: "Iranian Diesel Oil Burners — Request a Quote",
      description:
        "Request a tailored quote for Iranian diesel (gasoil) burners. Multilingual form in English, Persian and Pashto.",
      url: `${SITE_URL}/diesel-burners`,
      lang: "en",
    }),
    links: buildHreflangLinks("/diesel-burners"),
  }),
  component: DieselBurnersPage,
});

type FuelType = "diesel" | "heavy" | "dual";

function DieselBurnersPage() {
  const { tr, lang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    country: "",
    burnerModel: "",
    quantity: "1",
    application: "",
    fuelType: "diesel" as FuelType,
    notes: "",
  });

  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(4).max(30).regex(/^[+\d\s\-()]+$/, "Invalid phone"),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    company: z.string().trim().max(150).optional().or(z.literal("")),
    country: z.string().trim().min(2).max(100),
    burnerModel: z.string().trim().min(2).max(200),
    quantity: z.string().trim().regex(/^\d+$/).transform((v) => parseInt(v, 10)).pipe(z.number().min(1).max(9999)),
    application: z.string().trim().min(2).max(300),
    fuelType: z.enum(["diesel", "heavy", "dual"]),
    notes: z.string().trim().max(1500).optional().or(z.literal("")),
  });

  const fuelLabel = (f: FuelType) =>
    f === "diesel" ? tr("dieselFuelDiesel") : f === "heavy" ? tr("dieselFuelHeavy") : tr("dieselFuelDual");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? tr("dieselError"));
      return;
    }
    setSubmitting(true);
    try {
      const d = parsed.data;
      // Encode all structured fields into the message body so the existing
      // admin inbox (contact_messages) can display them. Tagged for filtering.
      const body = [
        "[DIESEL BURNER REQUEST]",
        `Burner model / capacity: ${d.burnerModel}`,
        `Quantity: ${d.quantity}`,
        `Fuel type: ${fuelLabel(d.fuelType)} (${d.fuelType})`,
        `Application: ${d.application}`,
        `Country / city: ${d.country}`,
        d.company ? `Company: ${d.company}` : null,
        d.notes ? `\nNotes:\n${d.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const { error } = await supabase.from("contact_messages").insert({
        name: d.name,
        phone: d.phone,
        email: d.email || null,
        message: body,
        language: lang,
      });
      if (error) throw error;
      toast.success(tr("dieselSent"));
      setForm({
        name: "",
        phone: "",
        email: "",
        company: "",
        country: "",
        burnerModel: "",
        quantity: "1",
        application: "",
        fuelType: "diesel",
        notes: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(tr("dieselError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <header className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-[var(--primary-soft)] via-card to-card p-6 md:mb-8 md:p-8">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:gap-5 md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Flame className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {tr("dieselBadge")}
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">
                {tr("dieselTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {tr("dieselSubtitle")}
              </p>
            </div>
          </div>
        </header>

        <Card className="relative overflow-hidden p-5 md:p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="db-name" className="mb-1.5 block">
                  {tr("yourName")} *
                </Label>
                <Input
                  id="db-name"
                  className="h-11"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="db-company" className="mb-1.5 block">
                  {tr("dieselCompany")}
                </Label>
                <Input
                  id="db-company"
                  className="h-11"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  maxLength={150}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="db-phone" className="mb-1.5 block">
                  {tr("phone")} *
                </Label>
                <Input
                  id="db-phone"
                  className="h-11"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  maxLength={30}
                  required
                />
              </div>
              <div>
                <Label htmlFor="db-email" className="mb-1.5 block">
                  {tr("yourEmail")}
                </Label>
                <Input
                  id="db-email"
                  className="h-11"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  maxLength={255}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="db-country" className="mb-1.5 block">
                {tr("dieselCountry")} *
              </Label>
              <Input
                id="db-country"
                className="h-11"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="db-model" className="mb-1.5 block">
                  {tr("dieselBurnerModel")} *
                </Label>
                <Input
                  id="db-model"
                  className="h-11"
                  placeholder={tr("dieselBurnerModelPh")}
                  value={form.burnerModel}
                  onChange={(e) => setForm((f) => ({ ...f, burnerModel: e.target.value }))}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="db-qty" className="mb-1.5 block">
                  {tr("dieselQuantity")} *
                </Label>
                <Input
                  id="db-qty"
                  className="h-11"
                  type="number"
                  min={1}
                  max={9999}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="db-fuel" className="mb-1.5 block">
                  {tr("dieselFuelType")} *
                </Label>
                <Select
                  value={form.fuelType}
                  onValueChange={(v) => setForm((f) => ({ ...f, fuelType: v as FuelType }))}
                >
                  <SelectTrigger id="db-fuel" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">{tr("dieselFuelDiesel")}</SelectItem>
                    <SelectItem value="heavy">{tr("dieselFuelHeavy")}</SelectItem>
                    <SelectItem value="dual">{tr("dieselFuelDual")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="db-app" className="mb-1.5 block">
                  {tr("dieselApplication")} *
                </Label>
                <Input
                  id="db-app"
                  className="h-11"
                  placeholder={tr("dieselApplicationPh")}
                  value={form.application}
                  onChange={(e) => setForm((f) => ({ ...f, application: e.target.value }))}
                  maxLength={300}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="db-notes" className="mb-1.5 block">
                {tr("dieselNotes")}
              </Label>
              <Textarea
                id="db-notes"
                rows={4}
                placeholder={tr("dieselNotesPh")}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                maxLength={1500}
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {form.notes.length}/1500
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="lg" className="group gap-2 sm:px-8" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {tr("dieselSubmit")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </SiteLayout>
  );
}