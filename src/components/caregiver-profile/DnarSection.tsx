import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function DnarSection({ enabled, onChange }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const requestToggle = (next: boolean) => {
    setPendingValue(next);
    setPassword("");
    setConfirmOpen(true);
  };

  const confirm = () => {
    if (!password) {
      toast({ title: "Password required", description: "Enter your password to continue.", variant: "destructive" });
      return;
    }
    onChange(pendingValue);
    setConfirmOpen(false);
    toast({
      title: pendingValue ? "DNAR enabled" : "DNAR disabled",
      description: "This action has been logged.",
    });
  };

  return (
    <>
      {/* <Card className="border border-destructive/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-destructive">
              Care Giver DNAR Settings
            </h3>
          </div>
          <Separator className="mb-4" />

          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              If this Care Giver has a <span className="font-semibold text-foreground">DNAR (Do Not Attempt Resuscitation)</span>{" "}
              in place you can replicate that setting here. This will be shown around the entire system when viewing the Team
              Member's profile. Please be very careful turning this setting on — getting this wrong is a matter of life and
              death. The user that turns this on will be clearly logged in the system and may be held accountable.{" "}
              <span className="font-semibold text-foreground">You must enter your password to turn this setting on or off.</span>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">DNAR Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabled ? "DNAR is currently active for this care giver." : "No DNAR in place."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={enabled ? "destructive" : "secondary"}>
                {enabled ? "DNAR Active" : "Inactive"}
              </Badge>
              <Switch checked={enabled} onCheckedChange={requestToggle} />
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DNAR History</p>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Action</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Changed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                    No DNAR history.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card> */}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Confirm DNAR change
            </DialogTitle>
            <DialogDescription>
              You are about to {pendingValue ? "enable" : "disable"} DNAR for this care giver. This action will be logged.
              Please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirm}>
              Confirm {pendingValue ? "Enable" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
