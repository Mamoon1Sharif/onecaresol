import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, MapPin, Phone, User, FileText, Pill, ClipboardList, Plus, Edit2, Trash2,
  AlertTriangle, Target, Shield,
} from "lucide-react";
import { careReceiversData } from "./CareReceivers";
import { useToast } from "@/hooks/use-toast";

interface RiskAssessment {
  id: number;
  category: string;
  description: string;
  level: "Low" | "Medium" | "High" | "Critical";
  mitigations: string;
  lastReviewed: string;
}

interface HealthGoal {
  id: number;
  goal: string;
  target: string;
  status: "Not Started" | "In Progress" | "Achieved";
  notes: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-0",
  "On Hold": "bg-warning/15 text-warning border-0",
  Discharged: "bg-muted text-muted-foreground border-0",
};

const riskLevelStyles: Record<string, string> = {
  Low: "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-destructive/15 text-destructive",
};

const goalStatusStyles: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/15 text-primary",
  Achieved: "bg-success/15 text-success",
};

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = careReceiversData.find((cr) => cr.id === Number(id));

  if (!member) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">Member not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/carereceivers")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Care Receivers
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back & Header */}
        <div>
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/carereceivers")}>
            <ArrowLeft className="h-4 w-4" /> Back to Care Receivers
          </Button>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-foreground">{member.name}</h1>
                      <Badge className={statusStyles[member.careStatus]}>{member.careStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">Age {member.age}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm text-foreground">{member.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Next of Kin</p>
                    <p className="text-sm text-foreground">{member.nextOfKin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="text-sm text-foreground">{member.nextOfKinPhone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="care-plan">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="care-plan" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /> Care Plan
            </TabsTrigger>
            <TabsTrigger value="medication" className="gap-1.5 text-xs sm:text-sm">
              <Pill className="h-3.5 w-3.5" /> Medication History
            </TabsTrigger>
            <TabsTrigger value="visit-notes" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardList className="h-3.5 w-3.5" /> Visit Notes
            </TabsTrigger>
          </TabsList>

          {/* Care Plan */}
          <TabsContent value="care-plan">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Care Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {member.carePlan}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medication History */}
          <TabsContent value="medication">
            <Card className="border border-border shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Medication History — Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {member.medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No medication records.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Medication</TableHead>
                        <TableHead className="font-semibold text-foreground">Dosage</TableHead>
                        <TableHead className="font-semibold text-foreground">Administered By</TableHead>
                        <TableHead className="font-semibold text-foreground">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {member.medications.map((med, i) => (
                        <TableRow key={i} className="hover:bg-muted/30">
                          <TableCell className="text-sm">{med.date}</TableCell>
                          <TableCell className="text-sm font-medium text-foreground">{med.medication}</TableCell>
                          <TableCell className="text-sm">{med.dosage}</TableCell>
                          <TableCell className="text-sm">{med.administeredBy}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{med.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit Notes */}
          <TabsContent value="visit-notes">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Visit Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {member.visitNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No visit notes yet.</p>
                ) : (
                  <div className="space-y-0">
                    {member.visitNotes.map((note, i) => (
                      <div key={i} className="relative pl-6 pb-6 last:pb-0 border-l-2 border-border last:border-l-transparent">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{note.date}</p>
                          <p className="text-xs text-muted-foreground mb-1.5">by {note.caregiver}</p>
                          <p className="text-sm text-foreground leading-relaxed">{note.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MemberProfile;
