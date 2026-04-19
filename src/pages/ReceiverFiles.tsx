import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareReceiver } from "@/hooks/use-care-data";
import { ServiceUserSidebar, ServiceUserTopBar } from "@/components/member/ServiceUserSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Upload, FolderCog, FileImage, File as FileIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

type Category = { id: string; care_receiver_id: string; name: string; color: string };
type Doc = {
  id: string; care_receiver_id: string; file_name: string; storage_path: string;
  mime_type: string | null; size_bytes: number | null; tags: string[] | null;
  category_id: string | null; created_at: string;
};

const BUCKET = "service-user-documents";

export default function ReceiverFiles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: cr } = useCareReceiver(id);

  const { data: categories = [] } = useQuery({
    queryKey: ["receiver_document_categories", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_document_categories" as any).select("*").eq("care_receiver_id", id!).order("name");
      if (error) throw error;
      return data as unknown as Category[];
    },
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["receiver_documents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_documents" as any).select("*").eq("care_receiver_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Doc[];
    },
  });

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return docs;
    return docs.filter((d) => {
      const cat = d.category_id ? categoryById[d.category_id]?.name ?? "" : "";
      return [d.file_name, cat, ...(d.tags ?? [])].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [docs, search, categoryById]);

  const uploadMut = useMutation({
    mutationFn: async (params: { file: File; categoryId: string | null; tags: string }) => {
      const path = `${id}/${Date.now()}-${params.file.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, params.file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("receiver_documents" as any).insert({
        care_receiver_id: id!, file_name: params.file.name, storage_path: path,
        mime_type: params.file.type, size_bytes: params.file.size, category_id: params.categoryId,
        tags: params.tags ? params.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_documents", id] }); setUploadOpen(false); toast.success("Uploaded"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDocMut = useMutation({
    mutationFn: async (docId: string) => {
      const doc = docs.find((d) => d.id === docId);
      if (doc?.storage_path) await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      const { error } = await supabase.from("receiver_documents" as any).delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_documents", id] }); setDeleteId(null); setSelected(new Set()); toast.success("Deleted"); },
  });

  const updateDocMut = useMutation({
    mutationFn: async (p: { id: string; file_name: string; category_id: string | null; tags: string[] }) => {
      const { error } = await supabase.from("receiver_documents" as any).update({ file_name: p.file_name, category_id: p.category_id, tags: p.tags } as any).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_documents", id] }); setEditing(null); toast.success("Updated"); },
  });

  const openFile = async (doc: Doc) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60);
    if (error) return toast.error("Could not open");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ServiceUserTopBar title="Documents & Assessments" backTo={`/carereceivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <ServiceUserSidebar cr={cr} basePath="files" />

        <Card className="overflow-hidden border-l-4 border-l-primary">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Document Store</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setCatManagerOpen(true)}>
                <FolderCog className="h-3.5 w-3.5" /> Category Manager
              </Button>
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end px-4 py-3 gap-2">
            <span className="text-xs font-semibold">Search:</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-48 text-xs" />
          </div>

          <div className="overflow-x-auto">
            {isLoading ? <div className="px-4 py-8 text-sm text-muted-foreground text-center">Loading…</div>
              : filteredDocs.length === 0 ? <div className="px-4 py-12 text-sm text-muted-foreground text-center">No documents yet. Click <span className="font-semibold">Upload</span> to add one.</div>
              : (
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-foreground">
                      <th className="px-3 py-2 w-10"><Checkbox checked={filteredDocs.length > 0 && filteredDocs.every((d) => selected.has(d.id))} onCheckedChange={(c) => setSelected(c ? new Set(filteredDocs.map((d) => d.id)) : new Set())} /></th>
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
                          <td className="px-3 py-2"><Checkbox checked={selected.has(d.id)} onCheckedChange={(c) => { const next = new Set(selected); if (c) next.add(d.id); else next.delete(d.id); setSelected(next); }} /></td>
                          <td className="px-3 py-2"><button onClick={() => openFile(d)} className="text-primary hover:underline font-medium">{d.file_name}</button></td>
                          <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{(d.tags ?? []).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>)}</div></td>
                          <td className="px-3 py-2">{d.mime_type?.includes("pdf") ? <span className="inline-flex items-center justify-center h-5 w-7 rounded text-[9px] font-bold bg-destructive text-destructive-foreground">PDF</span> : d.mime_type?.startsWith("image/") ? <FileImage className="h-4 w-4 text-primary" /> : <FileIcon className="h-4 w-4 text-muted-foreground" />}</td>
                          <td className="px-3 py-2">{cat ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: cat.color + "22", color: cat.color }}>{cat.name}</span> : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-3 py-2 text-muted-foreground">{format(parseISO(d.created_at), "dd/MM/yyyy")}</td>
                          <td className="px-3 py-2"><div className="flex items-center gap-1 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDeleteId(d.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>
        </Card>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} categories={categories} onSubmit={(file, categoryId, tags) => uploadMut.mutate({ file, categoryId, tags })} saving={uploadMut.isPending} />
      <EditDocDialog doc={editing} categories={categories} onClose={() => setEditing(null)} onSubmit={(p) => updateDocMut.mutate(p)} saving={updateDocMut.isPending} />
      <CategoryManagerDialog open={catManagerOpen} onOpenChange={setCatManagerOpen} categories={categories} careReceiverId={id!} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this file?</AlertDialogTitle><AlertDialogDescription>The file will be permanently removed from storage.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteDocMut.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UploadDialog({ open, onOpenChange, categories, onSubmit, saving }: { open: boolean; onOpenChange: (o: boolean) => void; categories: Category[]; onSubmit: (file: File, categoryId: string | null, tags: string) => void; saving: boolean; }) {
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">File (PDF or image)</Label><Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" /></div>
          <div><Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Uncategorised" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tags (comma-separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-8 text-xs" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => { if (!file) return toast.error("Choose a file"); onSubmit(file, categoryId || null, tags); setFile(null); setCategoryId(""); setTags(""); }} disabled={saving}>
            {saving ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDocDialog({ doc, categories, onClose, onSubmit, saving }: { doc: Doc | null; categories: Category[]; onClose: () => void; onSubmit: (p: { id: string; file_name: string; category_id: string | null; tags: string[] }) => void; saving: boolean; }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  useMemo(() => { if (doc) { setName(doc.file_name); setCategoryId(doc.category_id ?? ""); setTags((doc.tags ?? []).join(", ")); } }, [doc]);
  if (!doc) return null;
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">File name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Uncategorised" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Tags</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-8 text-xs" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={() => onSubmit({ id: doc.id, file_name: name, category_id: categoryId || null, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagerDialog({ open, onOpenChange, categories, careReceiverId }: { open: boolean; onOpenChange: (o: boolean) => void; categories: Category[]; careReceiverId: string; }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("receiver_document_categories" as any).insert({ care_receiver_id: careReceiverId, name: name.trim(), color } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_document_categories", careReceiverId] }); setName(""); toast.success("Added"); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (catId: string) => {
      const { error } = await supabase.from("receiver_document_categories" as any).delete().eq("id", catId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receiver_document_categories", careReceiverId] }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Category Manager</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-end gap-2">
            <div className="flex-1"><Label className="text-xs">New category</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" /></div>
            <div><Label className="text-xs">Color</Label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded border border-border cursor-pointer" /></div>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => addMut.mutate()}><Plus className="h-3.5 w-3.5" /> Add</Button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {categories.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No categories</p>
              : categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded border border-border">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: c.color + "22", color: c.color }}>{c.name}</span>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => delMut.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
