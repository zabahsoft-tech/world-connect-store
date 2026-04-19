import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { listUsers, setAdminRole, type AdminUserRow } from "@/lib/users.functions";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmSelf, setConfirmSelf] = useState<AdminUserRow | null>(null);

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await listUsers();
      return res.users;
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async (vars: { userId: string; isAdmin: boolean }) => {
      await setAdminRole({ data: vars });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const handleToggle = (u: AdminUserRow, next: boolean) => {
    if (!next && me?.id === u.id) {
      setConfirmSelf(u);
      return;
    }
    toggleAdmin.mutate({ userId: u.id, isAdmin: next });
  };

  const filtered = (usersQ.data ?? []).filter((u) =>
    !search || (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        {usersQ.isLoading ? (
          <div className="p-6 text-muted-foreground">Loading users...</div>
        ) : usersQ.error ? (
          <div className="p-6 text-destructive">{usersQ.error instanceof Error ? usersQ.error.message : "Failed to load users"}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-muted-foreground">No users found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.email ?? "—"}
                    {me?.id === u.id && <span className="ms-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {u.is_admin ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={u.is_admin}
                      onCheckedChange={(v) => handleToggle(u, v)}
                      disabled={toggleAdmin.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!confirmSelf} onOpenChange={(o) => !o && setConfirmSelf(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke your own admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove admin role from your own account. You will lose access to this dashboard immediately. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmSelf) {
                  toggleAdmin.mutate({ userId: confirmSelf.id, isAdmin: false });
                  setConfirmSelf(null);
                }
              }}
            >
              Revoke admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
