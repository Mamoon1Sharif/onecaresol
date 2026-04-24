import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/use-company";
import { Users, Plus, ShieldAlert } from "lucide-react";

const CompanyUsers = () => {
  const { data: cu, isLoading } = useCurrentCompany();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    username: "", display_name: "", password: "", role: "member",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["company_users", cu?.company_id],
    enabled: !!cu,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", cu!.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const isAdmin = cu && (cu.role === "owner" || cu.role === "admin");
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card><CardContent className="py-10 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Company admins only</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to manage users.
          </p>
        </CardContent></Card>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-provision", {
        body: {
          action: "create_user",
          company_id: cu!.company_id,
          ...form,
        },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({ title: "User created", description: form.username });
      setForm({ username: "", display_name: "", password: "", role: "member" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["company_users", cu!.company_id] });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Company <span className="font-mono">{(cu as any)?.companies?.company_code}</span> · {(cu as any)?.companies?.name}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add user to company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Username / User Code" value={form.username}
                onChange={(v) => setForm({ ...form, username: v })} placeholder="jdoe" />
              <Field label="Display name (optional)" value={form.display_name}
                onChange={(v) => setForm({ ...form, display_name: v })} placeholder="John Doe" />
              <Field label="Temp password" type="password" value={form.password}
                onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 8 chars" />
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy || !form.username || form.password.length < 8}>
                {busy ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.username}</TableCell>
                  <TableCell>{u.display_name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Active" ? "default" : "secondary"}>{u.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} />
    </div>
  );
}

export default CompanyUsers;
