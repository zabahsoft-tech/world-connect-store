

## Make WhatsApp buttons green and use the official WhatsApp icon

Replace the generic `MessageCircle` (lucide) icon with the existing official `WhatsAppIcon` component (`src/components/icons/WhatsAppIcon.tsx`) on every WhatsApp action, and color those buttons in WhatsApp brand green so users instantly recognize them.

### Brand color

Use the official WhatsApp green for solid buttons:
- Background: `#25D366` (WhatsApp brand green)
- Hover: `#1EBE5D` (slightly darker)
- Text: `white`

Implementation: apply via Tailwind arbitrary values directly on the `<Button>`, e.g.
`className="bg-[#25D366] text-white hover:bg-[#1EBE5D]"`. No `tailwind.config.js` change needed (Tailwind v4 supports arbitrary values out of the box), and no design-token edit, since this is a brand-locked color that should look the same in light and dark mode.

For outline-style WhatsApp buttons (used as a secondary action, e.g. in admin messages), use a green-tinted outline instead of solid:
`className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"`.

### Files & exact button changes

**1. `src/routes/checkout.tsx` — main "Place order via WhatsApp" CTA**
- Remove `import { MessageCircle } from "lucide-react";`
- Add `import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";`
- In the submit `<Button>`, swap `<MessageCircle className="h-5 w-5" />` → `<WhatsAppIcon className="h-5 w-5" />`
- Add green styling: `className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1EBE5D]"`

**2. `src/routes/products.$slug.tsx` — "Quick order on WhatsApp" CTA**
- Remove `MessageCircle` from the lucide import (keep `Minus, Plus, ShoppingCart, Play`).
- Add `import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";`
- Swap the icon in the Quick Order button and apply the green solid styling, same scheme as checkout.

**3. `src/routes/admin.messages.tsx` — "WhatsApp" outline button in the message dialog**
- Remove `MessageCircle` from the lucide import (keep the others: `Mail, Trash2, Archive, ArchiveRestore, Eye, EyeOff, Inbox`).
- Add `import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";`
- Swap the icon and add the outline-green classes:
  `className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"`

**4. `src/routes/contact.tsx` — "Send via WhatsApp" submit button**
- The icon import is already there (`WhatsAppIcon` is already imported). Verify the contact form's WhatsApp submit button uses `WhatsAppIcon` (or swap `MessageCircle` → `WhatsAppIcon` if it doesn't), and add the green solid styling so it matches the rest of the app.
- The info-tile WhatsApp links (already use `WhatsAppIcon`) get a green icon tint: add `text-[#25D366]` to the WhatsApp tile icon (or wrap it) so the icon visibly reads as WhatsApp at a glance, while the surrounding tile keeps its neutral background. The WhatsApp 2 tile gets the same treatment.

**5. `src/components/Footer.tsx` — "Chat with us anytime" line**
- This currently shows `MessageCircle` next to the whatsappSupportDesc label. Swap to `WhatsAppIcon` and tint it green: `className="h-4 w-4 text-[#25D366]"`. Remove `MessageCircle` from the lucide import if it becomes unused after this change.

**6. `src/routes/blog.$slug.tsx` — share-on-WhatsApp button**
- Already uses `WhatsAppIcon`. Add green tint to the icon (`text-[#25D366]`) so the share row visually identifies WhatsApp at a glance. Button itself stays in its current row layout (no full green fill, since it sits in a row of share targets that should remain visually consistent).

### Notes / consistency

- Every primary CTA that triggers a WhatsApp action becomes a solid WhatsApp-green button (checkout, product quick order, contact form submit).
- Every secondary/utility WhatsApp affordance (admin messages dialog, footer line, blog share row, contact info tiles) keeps its existing layout but uses the official `WhatsAppIcon` and a green icon/border tint so it's instantly recognizable.
- `MessageCircle` is fully removed wherever it stood in for WhatsApp; it's no longer imported in `checkout.tsx`, `products.$slug.tsx`, `admin.messages.tsx`, and `Footer.tsx` (kept in any file where it's still used for non-WhatsApp purposes — none in the searched files).
- No DB / i18n / dependency changes. No new files. Brand green is hard-coded so it stays correct in both light and dark mode.

### Files touched

- `src/routes/checkout.tsx`
- `src/routes/products.$slug.tsx`
- `src/routes/admin.messages.tsx`
- `src/routes/contact.tsx`
- `src/components/Footer.tsx`
- `src/routes/blog.$slug.tsx`

