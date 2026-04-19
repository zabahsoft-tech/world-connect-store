import { useLang } from "@/contexts/LangContext";
import { Link } from "@tanstack/react-router";

export function Footer() {
  const { tr } = useLang();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="font-bold">Store</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{tr("heroSubtitle")}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("shop")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">{tr("shop")}</Link></li>
            <li><Link to="/categories" className="hover:text-primary">{tr("categories")}</Link></li>
            <li><Link to="/cart" className="hover:text-primary">{tr("cart")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("about")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">{tr("about")}</Link></li>
            <li><Link to="/contact" className="hover:text-primary">{tr("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{tr("admin")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/admin/login" className="hover:text-primary">{tr("login")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Store. All rights reserved.
      </div>
    </footer>
  );
}
