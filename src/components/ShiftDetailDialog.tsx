import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useShiftNotes, useAddShiftNote, useShiftTasks, useAddShiftTask, useToggleShiftTask } from "@/hooks/use-care-data";
import {
  Clock, MessageSquare, ListChecks, User, CheckCircle2, XCircle,
} from "lucide-react";

interface CompletedVisit {
  id: string;
  start_hour: number;
  duration: number;
  check_in_time: string | null;
  check_out_time: string | null;
  visit_date: string;
  care_givers: { name: string } | null;
  care_receivers: { name: string; dnacpr?: boolean } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: CompletedVisit | null;
}

function fmt(h: number) {
  return `${String(h % 24).padStart(2, "0")}:00`;
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function diffMinutes(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs}h ${String(mins).padStart(2, "0")}m`;
}

export function ShiftDetailDialog({ open, onOpenChange, visit }: Props) {
  const { data: notes = [] } = useShiftNotes(visit?.id);
  const { data: tasks = [] } = useShiftTasks(visit?.id);
  const addNote = useAddShiftNote();
  const addTask = useAddShiftTask();
  const toggleTask = useToggleShiftTask();

  const [newNote, setNewNote] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (!visit) return null;

  const scheduledStart = fmt(visit.start_hour);
  const scheduledEnd = fmt(visit.start_hour + visit.duration);
  const totalWorked = diffMinutes(visit.check_in_time, visit.check_out_time);
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync({
      daily_visit_id: visit.id,
      note: newNote.trim(),
      author: (visit.care_givers as any)?.name ?? "Unknown",
    });
    setNewNote("");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask.mutateAsync({ daily_visit_id: visit.id, title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Completed Shift</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {(visit.care_receivers as any)?.name ?? "Unknown"} · {new Date(visit.visit_date).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
            <Badge className="bg-success/15 text-success border-0">Completed</Badge>
          </div>
        </div>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6">
            {/* Time Details */}
            <div className="pt-4 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Time Details
              </h3>
              <Separator className="mt-1.5" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Scheduled Start</p>
                <p className="text-lg font-bold text-foreground mt-1">{scheduledStart}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Checked In</p>
                <p className="text-lg font-bold text-foreground mt-1">{fmtTime(visit.check_in_time)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Scheduled End</p>
                <p className="text-lg font-bold text-foreground mt-1">{scheduledEnd}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Clocked Out</p>
                <p className="text-lg font-bold text-foreground mt-1">{fmtTime(visit.check_out_time)}</p>
              </div>
            </div>

            {totalWorked && (
              <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-foreground">Total Worked</span>
                <span className="text-lg font-bold text-primary">{totalWorked}</span>
              </div>
            )}

            <div className="flex items-center gap-3 py-3 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Care Giver</p>
                <p className="text-sm font-medium text-foreground">{(visit.care_givers as any)?.name ?? "Unassigned"}</p>
              </div>
            </div>

            {/* Tasks */}
            <div className="pt-4 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Tasks
                {tasks.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {completedCount}/{tasks.length}
                  </Badge>
                )}
              </h3>
              <Separator className="mt-1.5" />
            </div>

            <div className="space-y-2 py-2">
              {tasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No tasks recorded</p>
              )}
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-1.5">
                  {task.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {task.title}
                    </p>
                    {task.is_completed && task.completed_by && (
                      <p className="text-[10px] text-muted-foreground">
                        Done by {task.completed_by} · {task.completed_at ? new Date(task.completed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="pt-4 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Shift Notes
              </h3>
              <Separator className="mt-1.5" />
            </div>

            <div className="space-y-3 py-2">
              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No notes added yet</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{n.author}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm text-foreground">{n.note}</p>
                </div>
              ))}

              <div className="space-y-2 mt-2">
                <Textarea
                  placeholder="Write a shift note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending || !newNote.trim()} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Note
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
