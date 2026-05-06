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
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useHasAppRole } from "@/hooks/use-company";
import { Building2, Plus, ShieldAlert } from "lucide-react";

const SuperAdmin = () => {
  const { data: isSuper, isLoading } = useHasAppRole("super_admin");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    company_code: "",
    company_name: "",
    admin_username: "",
    admin_display_name: "",
    admin_password: "",
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-all"],
    enabled: !!isSuper,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isSuper) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Super-admin only</h2>
            <p className="text-sm text-muted-foreground">
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-provision", {
        body: { action: "create_company", ...form },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({ title: "Company created", description: `${form.company_name} (${form.company_code})` });
      setForm({ company_code: "", company_name: "", admin_username: "", admin_display_name: "", admin_password: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["companies-all"] });
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
            <Building2 className="h-6 w-6" /> Companies
          </h1>
          <p className="text-sm text-muted-foreground">
            Provision tenant companies and their first administrator.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create company</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Company ID (login code)" value={form.company_code}
                onChange={(v) => setForm({ ...form, company_code: v.toUpperCase().replace(/\s+/g, "") })}
                placeholder="ACME" />
              <Field label="Company name" value={form.company_name}
                onChange={(v) => setForm({ ...form, company_name: v })} placeholder="Acme Care Ltd." />
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">First admin</p>
                <Field label="Username" value={form.admin_username}
                  onChange={(v) => setForm({ ...form, admin_username: v })} placeholder="jdoe" />
                <Field label="Display name (optional)" value={form.admin_display_name}
                  onChange={(v) => setForm({ ...form, admin_display_name: v })} placeholder="John Doe" />
                <Field label="Temp password" type="password" value={form.admin_password}
                  onChange={(v) => setForm({ ...form, admin_password: v })} placeholder="At least 8 chars" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy ||
                !form.company_code || !form.company_name || !form.admin_username || form.admin_password.length < 8}>
                {busy ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All companies</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.company_code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(c.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No companies yet.
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

export default SuperAdmin;
