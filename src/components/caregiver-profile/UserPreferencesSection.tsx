import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Info } from "lucide-react";
import { useState } from "react";

export function UserPreferencesSection() {
  const [lockEnabled, setLockEnabled] = useState(true);
  const [search, setSearch] = useState("");

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">User Preferences</h3>
        <Separator className="mb-4" />

        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border mb-4">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-foreground">Lock team member preferences</span>
              <Switch checked={lockEnabled} onCheckedChange={setLockEnabled} />
            </div>
            <p>
              When enabled, if a service user scores this team member less than 3 stars, they will not be allowed to be assigned
              to the call. Be mindful when using bulk actions — there will be no warning if the team member has not been assigned
              in some instances. If no preference is set between a service user and team member, the team member will be allowed
              to be assigned and a default rating will be created at the minimum star level set in settings.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Preferences show the team member → service user / service user → team member preference for the corresponding user to aid
          judgement when assigning team members to rotas. Click on a name to edit. Hover over the stars to see the description.
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Search:</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter preferences..."
            className="h-8 max-w-xs"
          />
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs uppercase tracking-wider">Team Member Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Preference</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Service User Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Preference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground/50" />
                    No data available in table
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Showing 0 to 0 of 0 entries</p>
      </CardContent>
    </Card>
  );
}
