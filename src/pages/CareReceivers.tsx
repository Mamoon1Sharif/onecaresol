import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus } from "lucide-react";

export interface CareReceiver {
  id: number;
  name: string;
  address: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  careStatus: "Active" | "On Hold" | "Discharged";
  age: number;
  carePlan: string;
  medications: { date: string; medication: string; dosage: string; administeredBy: string; notes: string }[];
  visitNotes: { date: string; caregiver: string; note: string }[];
}

export const careReceiversData: CareReceiver[] = [
  {
    id: 1, name: "Mary Williams", age: 78, address: "42 Oak Lane, Springfield", nextOfKin: "John Williams", nextOfKinPhone: "(555) 111-2233",
    careStatus: "Active",
    carePlan: "Daily assistance with mobility exercises, medication management, and meal preparation. Weekly physiotherapy sessions on Tuesdays and Thursdays. Monitor blood pressure twice daily. Ensure fluid intake of at least 2L per day. Fall risk — walker required at all times.",
    medications: [
      { date: "Apr 14, 2026", medication: "Lisinopril 10mg", dosage: "1 tablet", administeredBy: "Sarah Johnson", notes: "Taken with breakfast" },
      { date: "Apr 14, 2026", medication: "Metformin 500mg", dosage: "1 tablet", administeredBy: "Sarah Johnson", notes: "After lunch" },
      { date: "Apr 13, 2026", medication: "Lisinopril 10mg", dosage: "1 tablet", administeredBy: "Emily Davis", notes: "Taken with breakfast" },
      { date: "Apr 13, 2026", medication: "Metformin 500mg", dosage: "1 tablet", administeredBy: "Emily Davis", notes: "After lunch" },
      { date: "Apr 12, 2026", medication: "Lisinopril 10mg", dosage: "1 tablet", administeredBy: "Sarah Johnson", notes: "Slight dizziness reported" },
      { date: "Apr 11, 2026", medication: "Lisinopril 10mg", dosage: "1 tablet", administeredBy: "Tom Harris", notes: "Normal" },
      { date: "Apr 10, 2026", medication: "Metformin 500mg", dosage: "1 tablet", administeredBy: "Tom Harris", notes: "Taken with dinner" },
    ],
    visitNotes: [
      { date: "Apr 14, 2026 — 9:30 AM", caregiver: "Sarah Johnson", note: "Mary was in good spirits today. Completed morning exercises without difficulty. Blood pressure 128/82. Prepared oatmeal and fruit for breakfast." },
      { date: "Apr 13, 2026 — 10:00 AM", caregiver: "Emily Davis", note: "Assisted with shower and dressing. Mary mentioned mild knee pain — documented for physiotherapist review. Appetite was good." },
      { date: "Apr 12, 2026 — 9:15 AM", caregiver: "Sarah Johnson", note: "Mary experienced slight dizziness after medication. Rested for 30 minutes. Blood pressure 118/75 after rest. Will monitor." },
      { date: "Apr 11, 2026 — 2:00 PM", caregiver: "Tom Harris", note: "Afternoon visit — light exercises and companionship. Mary enjoyed a walk in the garden with walker. No concerns." },
    ],
  },
  {
    id: 2, name: "John Davidson", age: 82, address: "15 Maple Drive, Riverside", nextOfKin: "Susan Davidson", nextOfKinPhone: "(555) 222-3344",
    careStatus: "Active",
    carePlan: "Dementia care — routine-based schedule critical. Assistance with all ADLs. Medication dispensed by caregiver only. Gentle redirection techniques. Weekly cognitive exercises. Family visit log maintained.",
    medications: [
      { date: "Apr 14, 2026", medication: "Donepezil 10mg", dosage: "1 tablet", administeredBy: "Mike Patel", notes: "Evening dose" },
      { date: "Apr 13, 2026", medication: "Donepezil 10mg", dosage: "1 tablet", administeredBy: "Anna Garcia", notes: "Evening dose" },
      { date: "Apr 12, 2026", medication: "Donepezil 10mg", dosage: "1 tablet", administeredBy: "Mike Patel", notes: "Mild nausea reported" },
    ],
    visitNotes: [
      { date: "Apr 14, 2026 — 8:00 AM", caregiver: "Mike Patel", note: "John recognized his daughter in a photo today. Good morning — ate full breakfast. Calm demeanor throughout visit." },
      { date: "Apr 13, 2026 — 8:15 AM", caregiver: "Anna Garcia", note: "Some confusion in the morning. Gentle redirection worked well. Completed puzzle activity together." },
    ],
  },
  {
    id: 3, name: "Eleanor Brooks", age: 71, address: "8 Birch Court, Lakeview", nextOfKin: "Patricia Brooks", nextOfKinPhone: "(555) 333-4455",
    careStatus: "On Hold",
    carePlan: "Post-surgery recovery — hip replacement (Mar 28). Limited mobility, bed rest with gradual increase. Pain management per physician orders. Physical therapy 3x/week starting Apr 15.",
    medications: [
      { date: "Apr 14, 2026", medication: "Acetaminophen 500mg", dosage: "2 tablets", administeredBy: "Lisa Chen", notes: "Pain level 3/10" },
      { date: "Apr 13, 2026", medication: "Acetaminophen 500mg", dosage: "2 tablets", administeredBy: "Lisa Chen", notes: "Pain level 4/10" },
    ],
    visitNotes: [
      { date: "Apr 14, 2026 — 11:00 AM", caregiver: "Lisa Chen", note: "Eleanor is progressing well. Managed to sit upright for 20 minutes. Pain manageable. Looking forward to starting PT." },
    ],
  },
  {
    id: 4, name: "Robert Turner", age: 85, address: "23 Elm Street, Greenfield", nextOfKin: "Mark Turner", nextOfKinPhone: "(555) 444-5566",
    careStatus: "Active",
    carePlan: "Palliative care — comfort-focused. Pain management priority. Emotional support and companionship. Family liaison for updates. No resuscitation order on file.",
    medications: [
      { date: "Apr 14, 2026", medication: "Morphine 15mg", dosage: "1 dose", administeredBy: "Tom Harris", notes: "Administered at 8 AM" },
    ],
    visitNotes: [
      { date: "Apr 14, 2026 — 8:30 AM", caregiver: "Tom Harris", note: "Robert rested comfortably. Read to him from his favorite book. Son Mark called during visit — Robert smiled hearing his voice." },
    ],
  },
  {
    id: 5, name: "Dorothy Clarke", age: 69, address: "55 Pine Avenue, Westbrook", nextOfKin: "Emma Clarke", nextOfKinPhone: "(555) 555-6677",
    careStatus: "Discharged",
    carePlan: "Discharged on Apr 5, 2026. Recovery complete following pneumonia treatment. Follow-up with GP in 2 weeks.",
    medications: [],
    visitNotes: [
      { date: "Apr 5, 2026 — 10:00 AM", caregiver: "Anna Garcia", note: "Final visit. Dorothy is feeling much better and is confident managing independently. Discharge paperwork completed. Follow-up appointment scheduled." },
    ],
  },
];

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-0 hover:bg-success/20",
  "On Hold": "bg-warning/15 text-warning border-0 hover:bg-warning/20",
  Discharged: "bg-muted text-muted-foreground border-0",
};

const CareReceivers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filtered = careReceiversData.filter((cr) =>
    cr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Receivers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage patients and care recipients &middot; {careReceiversData.length} total
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Care Receiver
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No care receivers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cr) => (
                    <TableRow
                      key={cr.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/carereceivers/${cr.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{cr.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Age {cr.age}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{cr.address}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{cr.nextOfKin}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cr.nextOfKinPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className={statusStyles[cr.careStatus]}>
                          {cr.careStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CareReceivers;
