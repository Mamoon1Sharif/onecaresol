import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, Mail } from "lucide-react";
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

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border" />
        </div>

        <Card className="border border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Phone Number</TableHead>
                  <TableHead className="font-semibold text-foreground">Last Check-in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No care givers found.</TableCell></TableRow>
                ) : (
                  filtered.map((cg) => (
                    <TableRow key={cg.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{cg.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" /> {cg.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cg.status === "Active" ? "default" : "secondary"} className={cg.status === "Active" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}>
                          {cg.status}
                        </Badge>
                      </TableCell>
                      <TableCell><span className="flex items-center gap-1.5 text-sm text-foreground"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{cg.phone}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cg.last_check_in}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
