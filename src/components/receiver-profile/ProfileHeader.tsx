import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Heart, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { getCareReceiverAvatar } from "@/lib/avatars";
import { useDeleteCareReceiver } from "@/hooks/use-care-data";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

interface Props {
  cr: CareReceiver;
  onEdit?: () => void;
}

export function ReceiverProfileHeader({ cr, onEdit }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const deleteMutation = useDeleteCareReceiver();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(cr.id);
      toast({ title: "Service user deleted", description: `${cr.name} has been removed.` });
      navigate("/carereceivers");
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Could not delete service user.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/carereceivers")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Service Users
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6">
          <div className="flex items-start gap-6">
            <AvatarUpload
              table="care_receivers"
              recordId={cr.id}
              currentSrc={cr.avatar_url || getCareReceiverAvatar(cr.id)}
              hasUploadedAvatar={!!cr.avatar_url}
              fallback={<Heart className="h-12 w-12 text-primary" />}
              invalidateKeys={[["care_receivers"], ["care_receivers", cr.id]]}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{cr.name}</h1>
                {cr.dnacpr && <Badge variant="destructive" className="text-xs">DNACPR</Badge>}
                <Badge
                  variant="default"
                  className={
                    cr.care_status === "Active" ? "bg-success/15 text-success border-0" :
                    cr.care_status === "On Hold" ? "bg-warning/15 text-warning border-0" :
                    "bg-muted text-muted-foreground border-0"
                  }
                >
                  {cr.care_status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {cr.care_type} · Age {cr.age ?? "—"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {cr.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cr.address}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {cr.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this service user and is not reversible.
              Linked rota entries, medications, reminders, and other records may also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
