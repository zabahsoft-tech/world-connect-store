import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Mail, Trash2, Archive, ArchiveRestore, Eye, EyeOff, Inbox } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Status = "new" | "read" | "archived";

interface Message {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  language: string;
  status: Status;
  created_at: string;
}

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessages,
});

const FILTERS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

const statusVariant: Record<Status, "default" | "secondary" | "outline"> = {
  new: "default",
  read: "secondary",
  archived: "outline",
};

function AdminMessages() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [view, setView] = useState<Message | null>(null);

  const messages = useQuery({
    queryKey: ["admin-messages", filter],
    queryFn: async () => {
      let q = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Message[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-messages"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      setView(null);
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-messages"] });
    },
  });

  const openMessage = (m: Message) => {
    setView(m);
    if (m.status === "new") updateStatus.mutate({ id: m.id, status: "read" });
  };

  const openWhatsApp = (phone: string) => {
    const num = phone.replace(/[^\d]/g, "");
    if (num) window.open(`https://wa.me/${num}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        {messages.isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading...</div>
        ) : !messages.data?.length ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-muted-foreground">
            <Inbox className="h-10 w-10" />
            <p className="text-sm">No messages</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Message</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.data.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={`cursor-pointer border-b hover:bg-muted/40 ${m.status === "new" ? "font-medium" : ""}`}
                >
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </td>
                  <td className="p-3">{m.name}</td>
                  <td className="p-3 text-muted-foreground">{m.phone || m.email || "—"}</td>
                  <td className="max-w-md truncate p-3">{m.message}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[m.status]}>{m.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          {view && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {view.name}
                  <Badge variant={statusVariant[view.status]}>{view.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  {new Date(view.created_at).toLocaleString()} · lang: {view.language}
                </div>
                {view.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <a href={`tel:${view.phone}`} className="font-medium text-primary hover:underline">{view.phone}</a>
                  </div>
                )}
                {view.email && (
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <a href={`mailto:${view.email}`} className="font-medium text-primary hover:underline">{view.email}</a>
                  </div>
                )}
                <div className="rounded-lg border bg-muted/40 p-3 whitespace-pre-wrap">{view.message}</div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {view.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                      onClick={() => openWhatsApp(view.phone!)}
                    >
                      <WhatsAppIcon className="mr-1.5 h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                  {view.email && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${view.email}`}>
                        <Mail className="mr-1.5 h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {view.status !== "new" ? (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: view.id, status: "new" })}>
                      <EyeOff className="mr-1.5 h-4 w-4" /> Mark as new
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: view.id, status: "read" })}>
                      <Eye className="mr-1.5 h-4 w-4" /> Mark as read
                    </Button>
                  )}
                  {view.status !== "archived" ? (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: view.id, status: "archived" })}>
                      <Archive className="mr-1.5 h-4 w-4" /> Archive
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: view.id, status: "read" })}>
                      <ArchiveRestore className="mr-1.5 h-4 w-4" /> Unarchive
                    </Button>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(view.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
