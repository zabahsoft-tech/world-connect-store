import type { CartItem } from "@/contexts/CartContext";
import type { Lang } from "@/lib/i18n";
import { pickLang } from "@/lib/i18n";

function cleanNumber(n: string) {
  return n.replace(/[^\d]/g, "");
}

export function buildOrderMessage(opts: {
  lang: Lang;
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  items: CartItem[];
  total: number;
  orderId?: string;
}): string {
  const { lang, customerName, phone, address, notes, items, total, orderId } = opts;
  const labels = {
    en: { hi: "New Order", id: "Order ID", name: "Name", phone: "Phone", addr: "Address", notes: "Notes", items: "Items", total: "Total" },
    fa: { hi: "سفارش جدید", id: "شناسه سفارش", name: "نام", phone: "تماس", addr: "آدرس", notes: "یادداشت", items: "موارد", total: "جمع کل" },
    ps: { hi: "نوی فرمایش", id: "د فرمایش پېژند", name: "نوم", phone: "تلیفون", addr: "پته", notes: "یادښت", items: "توکي", total: "ټول" },
  }[lang];

  const lines: string[] = [];
  lines.push(`🛒 *${labels.hi}*`);
  if (orderId) lines.push(`${labels.id}: ${orderId.slice(0, 8)}`);
  lines.push("");
  lines.push(`👤 ${labels.name}: ${customerName}`);
  lines.push(`📞 ${labels.phone}: ${phone}`);
  if (address) lines.push(`📍 ${labels.addr}: ${address}`);
  if (notes) lines.push(`📝 ${labels.notes}: ${notes}`);
  lines.push("");
  lines.push(`*${labels.items}:*`);
  for (const i of items) {
    const name = pickLang(i, "name", lang);
    const variantName = pickLang(i, "variantName", lang);
    const display = variantName ? `${name} — ${variantName}` : name;
    lines.push(`• ${display} × ${i.quantity} = ${(i.price * i.quantity).toFixed(2)}`);
  }
  lines.push("");
  lines.push(`💰 *${labels.total}: ${total.toFixed(2)}*`);
  return lines.join("\n");
}

export function buildQuickOrderMessage(opts: {
  lang: Lang;
  productName: string;
  price: number;
  variantName?: string;
}): string {
  const { lang, productName, price, variantName } = opts;
  const fullName = variantName ? `${productName} (${variantName})` : productName;
  const tpl = {
    en: `Hi! I'd like to order:\n\n• ${fullName} — ${price.toFixed(2)}\n\nPlease confirm availability.`,
    fa: `سلام! می‌خواهم این محصول را سفارش دهم:\n\n• ${fullName} — ${price.toFixed(2)}\n\nلطفاً موجودی را تأیید کنید.`,
    ps: `سلام! غواړم دا توکی فرمایش کړم:\n\n• ${fullName} — ${price.toFixed(2)}\n\nمهرباني وکړئ شتون تایید کړئ.`,
  };
  return tpl[lang];
}

export function openWhatsApp(number: string, message: string) {
  const num = cleanNumber(number);
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
