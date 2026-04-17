import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Reference {
  name: string;
  type: string;
  number?: string;
  description?: string;
}

interface Props {
  references: Reference[];
  onSave: (refs: Reference[]) => void;
}

export function ReferencesSection({ references, onSave }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Reference>({ name: "", type: "", number: "", description: "" });
  const [adding, setAdding] = useState(false);

  const startEdit = (i: number) => {
    setDraft({ ...references[i], number: references[i].number || "", description: references[i].description || "" });
    setEditingIdx(i);
    setAdding(false);
  };

  const startAdd = () => {
    setDraft({ name: "", type: "", number: "", description: "" });
    setAdding(true);
    setEditingIdx(null);
  };

  const saveEdit = () => {
    if (adding) {
      onSave([...references, draft]);
      setAdding(false);
    } else if (editingIdx !== null) {
      const next = [...references];
      next[editingIdx] = draft;
      onSave(next);
      setEditingIdx(null);
    }
  };

  const remove = (i: number) => {
    onSave(references.filter((_, idx) => idx !== i));
  };

  const cancel = () => {
    setEditingIdx(null);
    setAdding(false);
  };

  const isEditingRow = (i: number) => editingIdx === i;

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">References</h3>
          <Button size="sm" variant="outline" onClick={startAdd} className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Reference
          </Button>
        </div>
        <Separator className="mb-4" />
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider">Ref Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Ref Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Ref Number</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {references.length === 0 && !adding && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No references yet.
                  </TableCell>
                </TableRow>
              )}
              {references.map((r, i) =>
                isEditingRow(i) ? (
                  <TableRow key={i}>
                    <TableCell><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8" /></TableCell>
                    <TableCell><Input value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="h-8" /></TableCell>
                    <TableCell><Input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} className="h-8" /></TableCell>
                    <TableCell><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-[60px] text-sm" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.type}</TableCell>
                    <TableCell className="text-muted-foreground">{r.number || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-md whitespace-pre-wrap">{r.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
              {adding && (
                <TableRow>
                  <TableCell><Input placeholder="Ref Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-8" autoFocus /></TableCell>
                  <TableCell><Input placeholder="Ref Type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className="h-8" /></TableCell>
                  <TableCell><Input placeholder="Ref Number" value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} className="h-8" /></TableCell>
                  <TableCell><Textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-[60px] text-sm" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancel}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
