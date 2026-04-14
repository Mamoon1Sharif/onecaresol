
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { useCareReceivers } from "@/hooks/use-care-data";
import { CareReceiverProfileDialog } from "@/components/CareReceiverProfileDialog";

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-0 hover:bg-success/20",
  "On Hold": "bg-warning/15 text-warning border-0 hover:bg-warning/20",
  Discharged: "bg-muted text-muted-foreground border-0",
};

const CareReceivers = () => {
  const { data: careReceivers = [], isLoading } = useCareReceivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCR, setSelectedCR] = useState<any>(null);
  const navigate = useNavigate();

  const filtered = careReceivers.filter((cr) =>
    cr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Receivers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage patients and care recipients · {careReceivers.length} total</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Care Receiver</Button>
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
                  <TableHead className="font-semibold text-foreground">Member Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Address</TableHead>
                  <TableHead className="font-semibold text-foreground">Next of Kin</TableHead>
                  <TableHead className="font-semibold text-foreground">Care Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No care receivers found.</TableCell></TableRow>
                ) : (
                  filtered.map((cr) => (
                    <TableRow key={cr.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedCR(cr)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{cr.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Age {cr.age}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{cr.address}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{cr.next_of_kin}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cr.next_of_kin_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={statusStyles[cr.care_status] ?? ""}>{cr.care_status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CareReceiverProfileDialog
        open={!!selectedCR}
        onOpenChange={(open) => { if (!open) setSelectedCR(null); }}
        receiver={selectedCR}
      />
    </AppLayout>
  );
};

export default CareReceivers;
