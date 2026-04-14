
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCareGivers, useAddCareGiver } from "@/hooks/use-care-data";

const CareGivers = () => {
  const { data: careGivers = [], isLoading } = useCareGivers();
  const addMutation = useAddCareGiver();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const filtered = careGivers.filter((cg) =>
    cg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Name is required";
    if (!formEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errors.email = "Invalid email";
    if (!formPhone.trim()) errors.phone = "Phone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    try {
      await addMutation.mutateAsync({ name: formName.trim(), email: formEmail.trim(), phone: formPhone.trim() });
      setFormName(""); setFormEmail(""); setFormPhone(""); setFormErrors({});
      setIsDrawerOpen(false);
      toast({ title: "Care Giver Added", description: `${formName.trim()} has been added successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to add care giver.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Givers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your care giving staff · {careGivers.length} total</p>
          </div>
          <Button onClick={() => { setFormName(""); setFormEmail(""); setFormPhone(""); setFormErrors({}); setIsDrawerOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add New Care Giver
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
          <div className="text-center py-12 text-muted-foreground">No care givers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cg) => (
              <div
                key={cg.id}
                onClick={() => navigate(`/caregivers/${cg.id}`)}
                className="group border border-border rounded-xl bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm truncate pr-2">{cg.name}</h3>
                  <Badge
                    variant={cg.status === "Active" ? "default" : "secondary"}
                    className={`shrink-0 text-[10px] px-2 py-0.5 ${cg.status === "Active" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}`}
                  >
                    {cg.status}
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center shrink-0">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 space-y-1.5 text-sm">
                    {cg.address && (
                      <p className="text-muted-foreground text-xs leading-tight line-clamp-2">{cg.address}</p>
                    )}
                    {cg.phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs">{cg.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="text-xs">{cg.last_check_in || "Never"}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New Care Giver</SheetTitle>
            <SheetDescription>Fill in the details to register a new care giver.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="cg-name">Full Name</Label>
              <Input id="cg-name" placeholder="e.g. Jane Smith" value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cg-email">Email Address</Label>
              <Input id="cg-email" type="email" placeholder="e.g. jane@care.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} maxLength={255} />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cg-phone">Phone Number</Label>
              <Input id="cg-phone" type="tel" placeholder="e.g. (555) 123-4567" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} maxLength={20} />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>
          </div>
          <SheetFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Care Giver"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default CareGivers;
