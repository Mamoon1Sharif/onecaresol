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
  const { toast } = useToast();
  const member = careReceiversData.find((cr) => cr.id === Number(id));

  const [carePlanText, setCarePlanText] = useState(member?.carePlan ?? "");
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  const [risks, setRisks] = useState<RiskAssessment[]>([
    { id: 1, category: "Falls", description: "History of falls in bathroom", level: "High", mitigations: "Non-slip mats installed, grab rails fitted, mobility aid assessment scheduled", lastReviewed: "2025-04-10" },
    { id: 2, category: "Medication", description: "Complex medication regime with 5+ prescriptions", level: "Medium", mitigations: "Dosette box in use, weekly pharmacy review", lastReviewed: "2025-04-08" },
    { id: 3, category: "Nutrition", description: "Low appetite and weight loss noted", level: "Medium", mitigations: "Fortified meals, weekly weight monitoring, dietitian referral pending", lastReviewed: "2025-04-05" },
  ]);

  const [goals, setGoals] = useState<HealthGoal[]>([
    { id: 1, goal: "Improve mobility", target: "Walk 100m unaided within 3 months", status: "In Progress", notes: "Physiotherapy twice weekly" },
    { id: 2, goal: "Medication compliance", target: "100% adherence for 30 consecutive days", status: "In Progress", notes: "Using reminder app" },
    { id: 3, goal: "Social engagement", target: "Attend day centre twice per week", status: "Not Started", notes: "Transport to be arranged" },
  ]);

  const [riskDialog, setRiskDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskAssessment | null>(null);
  const [riskForm, setRiskForm] = useState({ category: "", description: "", level: "Low" as RiskAssessment["level"], mitigations: "" });

  const [goalDialog, setGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<HealthGoal | null>(null);
  const [goalForm, setGoalForm] = useState({ goal: "", target: "", status: "Not Started" as HealthGoal["status"], notes: "" });

  const openRiskDialog = (r?: RiskAssessment) => {
    if (r) { setEditingRisk(r); setRiskForm({ category: r.category, description: r.description, level: r.level, mitigations: r.mitigations }); }
    else { setEditingRisk(null); setRiskForm({ category: "", description: "", level: "Low", mitigations: "" }); }
    setRiskDialog(true);
  };

  const saveRisk = () => {
    if (!riskForm.category) return;
    const entry: RiskAssessment = { id: editingRisk?.id ?? Date.now(), ...riskForm, lastReviewed: new Date().toISOString().slice(0, 10) };
    if (editingRisk) setRisks((p) => p.map((r) => r.id === editingRisk.id ? entry : r));
    else setRisks((p) => [...p, entry]);
    setRiskDialog(false);
    toast({ title: editingRisk ? "Risk Updated" : "Risk Added" });
  };

  const openGoalDialog = (g?: HealthGoal) => {
    if (g) { setEditingGoal(g); setGoalForm({ goal: g.goal, target: g.target, status: g.status, notes: g.notes }); }
    else { setEditingGoal(null); setGoalForm({ goal: "", target: "", status: "Not Started", notes: "" }); }
    setGoalDialog(true);
  };

  const saveGoal = () => {
    if (!goalForm.goal) return;
    const entry: HealthGoal = { id: editingGoal?.id ?? Date.now(), ...goalForm };
    if (editingGoal) setGoals((p) => p.map((g) => g.id === editingGoal.id ? entry : g));
    else setGoals((p) => [...p, entry]);
    setGoalDialog(false);
    toast({ title: editingGoal ? "Goal Updated" : "Goal Added" });
  };

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
            <div className="space-y-6">
              {/* Care Plan Text */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Care Plan</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    if (isEditingPlan) { toast({ title: "Care Plan Saved" }); }
                    setIsEditingPlan(!isEditingPlan);
                  }}>
                    <Edit2 className="h-3.5 w-3.5" /> {isEditingPlan ? "Save" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditingPlan ? (
                    <Textarea value={carePlanText} onChange={(e) => setCarePlanText(e.target.value)} rows={6} className="text-sm" />
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{carePlanText}</p>
                  )}
                </CardContent>
              </Card>

              {/* Risk Assessments */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-destructive" /> Risk Assessments</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openRiskDialog()}>
                    <Plus className="h-3.5 w-3.5" /> Add Risk
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Category</TableHead>
                        <TableHead className="font-semibold text-foreground">Description</TableHead>
                        <TableHead className="font-semibold text-foreground">Level</TableHead>
                        <TableHead className="font-semibold text-foreground">Mitigations</TableHead>
                        <TableHead className="font-semibold text-foreground">Reviewed</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {risks.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm font-medium flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" /> {r.category}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px]">{r.description}</TableCell>
                          <TableCell><Badge className={`${riskLevelStyles[r.level]} border-0`}>{r.level}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px]">{r.mitigations}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.lastReviewed}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRiskDialog(r)}><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setRisks((p) => p.filter((x) => x.id !== r.id)); toast({ title: "Risk Removed" }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Health Goals */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Health Goals</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openGoalDialog()}>
                    <Plus className="h-3.5 w-3.5" /> Add Goal
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {goals.map((g) => (
                      <div key={g.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-muted/20">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{g.goal}</p>
                            <Badge className={`${goalStatusStyles[g.status]} border-0 text-xs`}>{g.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Target: {g.target}</p>
                          {g.notes && <p className="text-xs text-muted-foreground italic">{g.notes}</p>}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openGoalDialog(g)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setGoals((p) => p.filter((x) => x.id !== g.id)); toast({ title: "Goal Removed" }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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

      {/* Risk Assessment Dialog */}
      <Dialog open={riskDialog} onOpenChange={setRiskDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRisk ? "Edit Risk Assessment" : "Add Risk Assessment"}</DialogTitle>
            <DialogDescription>Define risks and their mitigations for this care receiver.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={riskForm.category} onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value })} placeholder="e.g. Falls, Medication" />
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select value={riskForm.level} onValueChange={(v) => setRiskForm({ ...riskForm, level: v as RiskAssessment["level"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={riskForm.description} onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })} rows={2} placeholder="Describe the risk..." />
            </div>
            <div className="space-y-2">
              <Label>Mitigations</Label>
              <Textarea value={riskForm.mitigations} onChange={(e) => setRiskForm({ ...riskForm, mitigations: e.target.value })} rows={2} placeholder="Control measures..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRiskDialog(false)}>Cancel</Button>
            <Button onClick={saveRisk} disabled={!riskForm.category}>{editingRisk ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Goal Dialog */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Health Goal" : "Add Health Goal"}</DialogTitle>
            <DialogDescription>Set specific, measurable health goals for this care receiver.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Goal</Label>
              <Input value={goalForm.goal} onChange={(e) => setGoalForm({ ...goalForm, goal: e.target.value })} placeholder="e.g. Improve mobility" />
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} placeholder="Measurable target..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={goalForm.status} onValueChange={(v) => setGoalForm({ ...goalForm, status: v as HealthGoal["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Achieved">Achieved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={goalForm.notes} onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })} rows={2} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={!goalForm.goal}>{editingGoal ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MemberProfile;
