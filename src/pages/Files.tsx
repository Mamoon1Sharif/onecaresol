import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareGiver, useCareGivers, useCareReceivers } from "@/hooks/use-care-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Upload, FolderCog, FileText, FileImage, File as FileIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

type Category = {
  id: string;
  care_giver_id: string;
  name: string;
  color: string;
};

type Doc = {
  id: string;
  care_giver_id: string;
  service_user_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[] | null;
  category_id: string | null;
  created_at: string;
};

const BUCKET = "caregiver-documents";

export default function Files() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: cg } = useCareGiver(id);
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();

  const { data: categories = [] } = useQuery({
    queryKey: ["caregiver_document_categories", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_document_categories")
        .select("*")
        .eq("care_giver_id", id!)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["caregiver_documents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_documents")
        .select("*")
        .eq("care_giver_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Doc[];
    },
  });

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Filter / search / bulk-action state
  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState<"Remove" | "Move">("Remove");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return docs.filter((d) => {
      if (categoryFilter === "uncategorised" && d.category_id) return false;
      if (categoryFilter !== "all" && categoryFilter !== "uncategorised" && d.category_id !== categoryFilter) return false;
      if (!q) return true;
      const cat = d.category_id ? categoryById[d.category_id]?.name ?? "" : "";
      return [d.file_name, cat, ...(d.tags ?? [])]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [docs, search, categoryById, categoryFilter]);

  // Dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMut = useMutation({
    mutationFn: async (params: {
      file: File;
      categoryId: string | null;
      tags: string;
    }) => {
      const path = `${id}/${Date.now()}-${params.file.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, params.file);
      if (upErr) throw upErr;

      const { error } = await supabase.from("caregiver_documents").insert({
        care_giver_id: id!,
        file_name: params.file.name,
        storage_path: path,
        mime_type: params.file.type,
        size_bytes: params.file.size,
        category_id: params.categoryId,
        tags: params.tags
          ? params.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_documents", id] });
      setUploadOpen(false);
      toast.success("File uploaded");
    },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });

  const updateDocMut = useMutation({
    mutationFn: async (payload: { id: string; file_name: string; category_id: string | null; tags: string[] }) => {
      const { error } = await supabase
        .from("caregiver_documents")
        .update({
          file_name: payload.file_name,
          category_id: payload.category_id,
          tags: payload.tags,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_documents", id] });
      setEditing(null);
      toast.success("File updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteDocMut = useMutation({
    mutationFn: async (docId: string) => {
      const doc = docs.find((d) => d.id === docId);
      if (doc?.storage_path) {
        await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      }
      const { error } = await supabase.from("caregiver_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_documents", id] });
      setDeleteId(null);
      setSelected(new Set());
      toast.success("File deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const openFile = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (error) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const runBulk = async () => {
    if (selected.size === 0) {
      toast.info("Select files first");
      return;
    }
    if (bulkAction === "Remove") {
      for (const docId of selected) {
        await deleteDocMut.mutateAsync(docId);
      }
    }
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filteredDocs.map((d) => d.id)) : new Set());
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="flex items-center px-4 py-2.5 relative">
          <Button
            size="sm"
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            onClick={() => navigate(`/caregivers/${id}`)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-medium text-foreground">
            Documents &amp; Assesments
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Selectors */}
        <Card className="p-3 border-l-4 border-l-primary">
          <div className="space-y-2 max-w-md">
            <Select
              value={id}
              onValueChange={(val) => navigate(`/caregivers/${val}/files`)}
            >
              <SelectTrigger className="h-9 bg-muted/50">
                <SelectValue placeholder="Select care giver" />
              </SelectTrigger>
              <SelectContent>
                {careGivers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={() => {}}>
              <SelectTrigger className="h-9 bg-muted/30 text-muted-foreground">
                <SelectValue placeholder="Select Service Member..." />
              </SelectTrigger>
              <SelectContent>
                {careReceivers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Document Store */}
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Document Store</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline" className="h-8 gap-1.5"
                onClick={() => setCatManagerOpen(true)}
              >
                <FolderCog className="h-3.5 w-3.5" />
                Category Manager
              </Button>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
          </div>

          <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
            You can upload PDF's or images here. Click on a file for more information or to rename it.
          </p>

          {/* Bulk action + search */}
          <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={bulkAction} onValueChange={(v) => setBulkAction(v as any)}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remove">Remove</SelectItem>
                  <SelectItem value="Move">Move</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={runBulk}
              >
                Go
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-semibold">Category:</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="uncategorised">Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-semibold ml-2">Search:</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-sm text-muted-foreground text-center">Loading…</div>
            ) : filteredDocs.length === 0 ? (
              <div className="px-4 py-12 text-sm text-muted-foreground text-center">
                No documents yet. Click <span className="font-semibold">Upload</span> to add one.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-left text-foreground">
                    <th className="px-3 py-2 w-10">
                      <Checkbox
                        checked={
                          filteredDocs.length > 0 &&
                          filteredDocs.every((d) => selected.has(d.id))
                        }
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </th>
                    <th className="px-3 py-2 font-semibold">File Detail</th>
                    <th className="px-3 py-2 font-semibold">Tags</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Created</th>
                    <th className="px-3 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((d) => {
                    const cat = d.category_id ? categoryById[d.category_id] : null;
                    return (
                      <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selected.has(d.id)}
                            onCheckedChange={(c) => {
                              const next = new Set(selected);
                              if (c) next.add(d.id); else next.delete(d.id);
                              setSelected(next);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => openFile(d)}
                            className="text-primary hover:underline font-medium"
                          >
                            {d.file_name}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {(d.tags ?? []).map((t) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <FileTypeBadge mime={d.mime_type} />
                        </td>
                        <td className="px-3 py-2">
                          {cat ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                              style={{ backgroundColor: cat.color + "22", color: cat.color }}
                            >
                              {cat.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => setEditing(d)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => setDeleteId(d.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Upload dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categories}
        onSubmit={(file, categoryId, tags) => uploadMut.mutate({ file, categoryId, tags })}
        saving={uploadMut.isPending}
      />

      {/* Edit dialog */}
      <EditDocDialog
        doc={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSubmit={(payload) => updateDocMut.mutate(payload)}
        saving={updateDocMut.isPending}
      />

      {/* Category manager */}
      <CategoryManagerDialog
        open={catManagerOpen}
        onOpenChange={setCatManagerOpen}
        categories={categories}
        careGiverId={id!}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              The file will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteDocMut.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FileTypeBadge({ mime }: { mime: string | null }) {
  if (mime?.includes("pdf")) {
    return (
      <span className="inline-flex items-center justify-center h-5 w-7 rounded text-[9px] font-bold bg-destructive text-destructive-foreground">
        PDF
      </span>
    );
  }
  if (mime?.startsWith("image/")) {
    return <FileImage className="h-4 w-4 text-primary" />;
  }
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

function UploadDialog({
  open, onOpenChange, categories, onSubmit, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  onSubmit: (file: File, categoryId: string | null, tags: string) => void;
  saving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    if (!file) {
      toast.error("Choose a file");
      return;
    }
    onSubmit(file, categoryId || null, tags);
    setFile(null);
    setCategoryId("");
    setTags("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">File (PDF or image)</Label>
            <Input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Uncategorised" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. signed, 2025, urgent"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDocDialog({
  doc, categories, onClose, onSubmit, saving,
}: {
  doc: Doc | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: { id: string; file_name: string; category_id: string | null; tags: string[] }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState("");

  useMemo(() => {
    if (doc) {
      setName(doc.file_name);
      setCategoryId(doc.category_id ?? "");
      setTags((doc.tags ?? []).join(", "));
    }
  }, [doc]);

  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">File name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Uncategorised" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => onSubmit({
              id: doc.id,
              file_name: name,
              category_id: categoryId || null,
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            })}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagerDialog({
  open, onOpenChange, categories, careGiverId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  careGiverId: string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("caregiver_document_categories").insert({
        care_giver_id: careGiverId,
        name: name.trim(),
        color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_document_categories", careGiverId] });
      setName("");
      toast.success("Category added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (catId: string) => {
      const { error } = await supabase.from("caregiver_document_categories").delete().eq("id", catId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_document_categories", careGiverId] });
      toast.success("Category deleted");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Category Manager</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">New category name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 rounded border border-border cursor-pointer"
              />
            </div>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => addMut.mutate()}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No categories yet</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded border border-border">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{ backgroundColor: c.color + "22", color: c.color }}
                  >
                    {c.name}
                  </span>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => delMut.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
