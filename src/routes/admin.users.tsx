import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus, ShieldCheck, ShieldOff, KeyRound, Mail, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  listUsers, setAdminRole, createUser, adminResetPassword,
  sendPasswordResetEmail, deleteUser, type AdminUserRow,
} from "@/lib/users.functions";
import { supabase } from "@/integrations/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmSelf, setConfirmSelf] = useState<AdminUserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await listUsers({ headers: await authHeaders() });
      return res.users;
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async (vars: { userId: string; isAdmin: boolean }) => {
      await setAdminRole({ data: vars, headers: await authHeaders() });
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const createUserM = useMutation({
    mutationFn: async (vars: { email: string; password: string; isAdmin: boolean }) => {
      await createUser({ data: vars, headers: await authHeaders() });
    },
    onSuccess: () => {
      toast.success("User created");
      setCreateOpen(false);
      setNewEmail("");
      setNewUserPassword("");
      setNewIsAdmin(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const resetPwM = useMutation({
    mutationFn: async (vars: { userId: string; password: string }) => {
      await adminResetPassword({ data: vars, headers: await authHeaders() });
    },
    onSuccess: () => {
      toast.success("Password updated");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const sendResetEmailM = useMutation({
    mutationFn: async (email: string) => {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      await sendPasswordResetEmail({ data: { email, redirectTo }, headers: await authHeaders() });
    },
    onSuccess: () => toast.success("Reset email sent"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteUserM = useMutation({
    mutationFn: async (userId: string) => {
      await deleteUser({ data: { userId }, headers: await authHeaders() });
    },
    onSuccess: () => {
      toast.success("User deleted");
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const handleRoleChange = (u: AdminUserRow, makeAdmin: boolean) => {
    if (!makeAdmin && me?.id === u.id) {
      setConfirmSelf(u);
      return;
    }
    toggleAdmin.mutate({ userId: u.id, isAdmin: makeAdmin });
  };

  const filtered = (usersQ.data ?? []).filter((u) =>
    !search || (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="me-2 h-4 w-4" />New user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new user</DialogTitle>
                <DialogDescription>
                  The account will be created with email auto-confirmed. Share the password securely.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                  />
                  Grant admin role
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => createUserM.mutate({ email: newEmail, password: newUserPassword, isAdmin: newIsAdmin })}
                  disabled={createUserM.isPending || !newEmail || newUserPassword.length < 6}
                >
                  {createUserM.isPending ? "Creating..." : "Create user"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                <TableHead className="text-right">Actions</TableHead>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Manage user</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {u.is_admin ? (
                          <DropdownMenuItem onSelect={() => handleRoleChange(u, false)}>
                            <ShieldOff className="me-2 h-4 w-4" />Revoke admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => handleRoleChange(u, true)}>
                            <ShieldCheck className="me-2 h-4 w-4" />Make admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => { setResetTarget(u); setNewPassword(""); }}>
                          <KeyRound className="me-2 h-4 w-4" />Set password
                        </DropdownMenuItem>
                        {u.email && (
                          <DropdownMenuItem onSelect={() => sendResetEmailM.mutate(u.email!)}>
                            <Mail className="me-2 h-4 w-4" />Send reset email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={me?.id === u.id}
                          onSelect={() => setConfirmDelete(u)}
                        >
                          <Trash2 className="me-2 h-4 w-4" />Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{confirmDelete?.email}</strong> and all their authentication data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && deleteUserM.mutate(confirmDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.email}</strong>. They will need to use this password on their next sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reset-password-input">New password</Label>
            <Input
              id="reset-password-input"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword(""); }}>Cancel</Button>
            <Button
              onClick={() => resetTarget && resetPwM.mutate({ userId: resetTarget.id, password: newPassword })}
              disabled={resetPwM.isPending || newPassword.length < 6}
            >
              {resetPwM.isPending ? "Saving..." : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
