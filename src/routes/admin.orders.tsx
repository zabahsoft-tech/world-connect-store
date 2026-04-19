import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Status = "pending" | "contacted" | "completed" | "cancelled";

const statusColor: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  contacted: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

interface OrderItem { id: string; name_en: string; price: number; quantity: number }

function AdminOrders() {
  const qc = useQueryClient();
  const [view, setView] = useState<null | { id: string; items: OrderItem[]; customer_name: string; phone: string; address: string | null; notes: string | null; total: number }>(null);

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Lang</th>
              <th className="p-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.data?.map((o) => {
              const items = (o.items as unknown as OrderItem[]) ?? [];
              return (
                <tr key={o.id} className="border-b">
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-medium">{o.customer_name}</td>
                  <td className="p-3">{o.phone}</td>
                  <td className="p-3">{items.length}</td>
                  <td className="p-3">{Number(o.total).toFixed(2)}</td>
                  <td className="p-3 uppercase text-muted-foreground">{o.language}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => update.mutate({ id: o.id, status: v as Status })}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["pending", "contacted", "completed", "cancelled"] as const).map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge variant={statusColor[s]} className="capitalize">{s}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setView({
                      id: o.id, items, customer_name: o.customer_name, phone: o.phone, address: o.address, notes: o.notes, total: Number(o.total),
                    })}>View</Button>
                  </td>
                </tr>
              );
            })}
            {orders.data && orders.data.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order details</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> <strong>{view.customer_name}</strong></p>
              <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${view.phone}`} className="text-primary">{view.phone}</a></p>
              {view.address && <p><span className="text-muted-foreground">Address:</span> {view.address}</p>}
              {view.notes && <p><span className="text-muted-foreground">Notes:</span> {view.notes}</p>}
              <div className="border-t pt-3">
                <p className="mb-2 font-semibold">Items</p>
                <ul className="space-y-1">
                  {view.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{i.name_en} × {i.quantity}</span>
                      <span>{(i.price * i.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span className="text-primary">{view.total.toFixed(2)}</span></p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
