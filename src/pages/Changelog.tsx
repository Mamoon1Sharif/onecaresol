import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareGiver } from "@/hooks/use-care-data";
import { MemberSidebar, MemberTopBar } from "@/components/member/MemberSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, addDays, subDays } from "date-fns";

type ChangeLog = {
  id: string;
  care_giver_id: string;
  record_id: string;
  made_by: string;
  title: string;
  description: string;
  for_name: string | null;
  log_time: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Changelog() {
  const { id } = useParams<{ id: string }>();
  const { data: cg } = useCareGiver(id);

  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["caregiver_changelog", id, date.toDateString()],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_changelog")
        .select("*")
        .eq("care_giver_id", id!)
        .gte("log_time", startOfDay(date).toISOString())
        .lte("log_time", endOfDay(date).toISOString())
        .order("log_time", { ascending: false });
      if (error) throw error;
      return data as ChangeLog[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.record_id, l.made_by, l.title, l.description, l.for_name]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="min-h-screen bg-muted/30">
      <MemberTopBar title="Care Giver Change Logs" backTo={`/caregivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <MemberSidebar cg={cg} basePath={"changelog" as any} />

        <div className="space-y-3">
          {/* Date navigation bar */}
          <Card className="flex items-center justify-between px-3 py-2">
            <div />
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary"
                onClick={() => setDate((d) => subDays(d, 1))}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-8 px-3 text-xs border border-border rounded bg-background inline-flex items-center gap-1.5 hover:bg-muted">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(date, "dd/MM/yyyy")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary"
                onClick={() => setDate((d) => addDays(d, 1))}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-primary">All Change Logs</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <span>Show</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">Search:</span>
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-7 w-48 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-left text-foreground">
                    <th className="px-3 py-2 font-semibold w-28">Record ID</th>
                    <th className="px-3 py-2 font-semibold w-44">Time</th>
                    <th className="px-3 py-2 font-semibold w-40">Made By</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                    <th className="px-3 py-2 font-semibold w-40">For</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No change logs for this date
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((l, idx) => (
                      <tr
                        key={l.id}
                        className={`border-t border-border ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                      >
                        <td className="px-3 py-2 font-medium text-foreground align-top">
                          {l.record_id}
                        </td>
                        <td className="px-3 py-2 text-foreground align-top whitespace-nowrap">
                          {format(parseISO(l.log_time), "yyyy-MM-dd HH:mm:ss")}
                        </td>
                        <td className="px-3 py-2 text-foreground align-top">{l.made_by}</td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {l.title}
                          </div>
                          <div className="text-foreground mt-0.5">{l.description}</div>
                        </td>
                        <td className="px-3 py-2 text-foreground align-top">
                          {l.for_name || ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-border text-xs">
              <span className="text-muted-foreground">
                Showing {pageItems.length === 0 ? 0 : pageStart + 1} to{" "}
                {pageStart + pageItems.length} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded bg-primary text-primary-foreground text-xs">
                  {currentPage}
                </span>
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
