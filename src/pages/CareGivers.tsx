import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CareGiver {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  lastCheckIn: string;
}

const initialCareGivers: CareGiver[] = [
  { id: 1, name: "Sarah Johnson", email: "sarah.j@care.com", phone: "(555) 123-4567", status: "Active", lastCheckIn: "Today, 9:15 AM" },
  { id: 2, name: "Mike Patel", email: "mike.p@care.com", phone: "(555) 234-5678", status: "Active", lastCheckIn: "Today, 8:42 AM" },
  { id: 3, name: "Lisa Chen", email: "lisa.c@care.com", phone: "(555) 345-6789", status: "Inactive", lastCheckIn: "Apr 10, 2026" },
  { id: 4, name: "Tom Harris", email: "tom.h@care.com", phone: "(555) 456-7890", status: "Active", lastCheckIn: "Today, 10:03 AM" },
  { id: 5, name: "Anna Garcia", email: "anna.g@care.com", phone: "(555) 567-8901", status: "Active", lastCheckIn: "Yesterday, 5:30 PM" },
  { id: 6, name: "James Wilson", email: "james.w@care.com", phone: "(555) 678-9012", status: "Inactive", lastCheckIn: "Apr 8, 2026" },
  { id: 7, name: "Emily Davis", email: "emily.d@care.com", phone: "(555) 789-0123", status: "Active", lastCheckIn: "Today, 7:55 AM" },
];

const CareGivers = () => {
  const [careGivers, setCareGivers] = useState<CareGiver[]>(initialCareGivers);
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
    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim();
    const trimmedPhone = formPhone.trim();

    if (!trimmedName) errors.name = "Name is required";
    else if (trimmedName.length > 100) errors.name = "Name must be under 100 characters";

    if (!trimmedEmail) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = "Invalid email address";

    if (!trimmedPhone) errors.phone = "Phone is required";
    else if (trimmedPhone.length < 7) errors.phone = "Phone number is too short";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) return;

    const newCareGiver: CareGiver = {
      id: Date.now(),
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      status: "Active",
      lastCheckIn: "Never",
    };
    setCareGivers((prev) => [newCareGiver, ...prev]);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormErrors({});
    setIsDrawerOpen(false);
    toast({ title: "Care Giver Added", description: `${newCareGiver.name} has been added successfully.` });
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormErrors({});
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Givers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your care giving staff &middot; {careGivers.length} total
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setIsDrawerOpen(true); }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Care Giver
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Table */}
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No care givers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cg) => (
                    <TableRow key={cg.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{cg.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {cg.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={cg.status === "Active" ? "default" : "secondary"}
                          className={
                            cg.status === "Active"
                              ? "bg-success/15 text-success border-0 hover:bg-success/20"
                              : "bg-muted text-muted-foreground border-0"
                          }
                        >
                          {cg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {cg.phone}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cg.lastCheckIn}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New Care Giver</SheetTitle>
            <SheetDescription>Fill in the details to register a new care giver.</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="cg-name">Full Name</Label>
              <Input
                id="cg-name"
                placeholder="e.g. Jane Smith"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={100}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cg-email">Email Address</Label>
              <Input
                id="cg-email"
                type="email"
                placeholder="e.g. jane@care.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                maxLength={255}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cg-phone">Phone Number</Label>
              <Input
                id="cg-phone"
                type="tel"
                placeholder="e.g. (555) 123-4567"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                maxLength={20}
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Care Giver</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default CareGivers;
