import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, MapPin, Phone, Heart, Loader2 } from "lucide-react";
import { useCareReceivers, useAddCareReceiver } from "@/hooks/use-care-data";
import { getCareReceiverAvatar } from "@/lib/avatars";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-0",
  "On Hold": "bg-warning/15 text-warning border-0",
  Discharged: "bg-muted text-muted-foreground border-0",
};

const emptyForm = {
  name: "",
  address: "",
  next_of_kin: "",
  next_of_kin_phone: "",
};

const CareReceivers = () => {
  const { data: careReceivers = [], isLoading } = useCareReceivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();
  const addReceiver = useAddCareReceiver();

  const filtered = careReceivers
    .filter((cr) => cr.care_status !== "Discharged")
    .filter((cr) => cr.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const created = await addReceiver.mutateAsync({
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        next_of_kin: form.next_of_kin.trim() || undefined,
        next_of_kin_phone: form.next_of_kin_phone.trim() || undefined,
      });
      toast.success("Service member added");
      setDialogOpen(false);
      setForm(emptyForm);
      if (created?.id) navigate(`/carereceivers/${created.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add service member");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Service Members</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service members · {careReceivers.length} total</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add Service Member
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            <Search className="h-3.5 w-3.5 mr-1.5" /> {filtered.length} results
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No service members found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cr) => (
              <div
                key={cr.id}
                onClick={() => navigate(`/carereceivers/${cr.id}`)}
                className="group border border-border rounded-xl bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{cr.name}</h3>
                    {cr.dnacpr && (
                      <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0 gap-0.5">
                        <Heart className="h-2.5 w-2.5" /> DNACPR
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant="default"
                    className={`shrink-0 text-[10px] px-2 py-0.5 ${statusStyles[cr.care_status] ?? ""}`}
                  >
                    {cr.care_status}
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-full border-2 border-border overflow-hidden shrink-0">
                    <img src={getCareReceiverAvatar(cr.id, cr.avatar_url)} alt={cr.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 space-y-1.5 text-sm">
                    {cr.address && (
                      <p className="text-muted-foreground text-xs leading-tight line-clamp-2 flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        {cr.address}
                      </p>
                    )}
                    {cr.next_of_kin_phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs">{cr.next_of_kin_phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service Member</DialogTitle>
            <DialogDescription>Create a new service member for your company.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nok">Next of kin</Label>
                <Input id="nok" value={form.next_of_kin} onChange={(e) => setForm({ ...form, next_of_kin: e.target.value })} placeholder="Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nokp">NoK phone</Label>
                <Input id="nokp" value={form.next_of_kin_phone} onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })} placeholder="07..." />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addReceiver.isPending} className="gap-2">
                {addReceiver.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Service Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CareReceivers;
