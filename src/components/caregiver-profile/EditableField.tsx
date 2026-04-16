import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  onSave: (value: string) => void;
  type?: string;
}

export function EditableField({ label, value, icon: Icon, onSave, type = "text" }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
          <div className="flex items-center gap-1">
            <Input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            />
            <button onClick={handleSave} className="p-1 rounded hover:bg-primary/10 text-primary"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={handleCancel} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-2 py-1.5 group cursor-pointer rounded-md px-1 -mx-1 hover:bg-muted/50 transition-colors"
      onClick={() => setEditing(true)}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-sm text-foreground break-words">{value || "—"}</p>
      </div>
      <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors mt-1 shrink-0" />
    </div>
  );
}
