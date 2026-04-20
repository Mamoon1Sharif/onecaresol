import { LayoutDashboard, Users, HeartHandshake, CalendarDays, ChevronDown, LogOut, MapPin, MessageSquare, FileBarChart, Receipt, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const topItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Care Givers", url: "/caregivers", icon: Users },
  { title: "Service Members", url: "/carereceivers", icon: HeartHandshake },
  { title: "Location Tracking", url: "/location-tracking", icon: MapPin },
  { title: "Communication Log", url: "/communication-log", icon: MessageSquare },
  { title: "Timeline", url: "/timeline", icon: Activity },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const rosterSubItems = [
  { title: "Weekly Roster", url: "/roster" },
  { title: "Daily Roster", url: "/daily-roster" },
];

const invoicingSubItems = [
  { title: "Invoice Groups", url: "/invoicing/invoice-groups" },
  { title: "Wages", url: "/invoicing/wages" },
  { title: "Tariffs", url: "/invoicing/tariffs" },
  { title: "Funders", url: "/invoicing/funders" },
  { title: "Settings", url: "/invoicing/settings" },
  { title: "Bank Holidays", url: "/invoicing/bank-holidays" },
  { title: "Holiday Report", url: "/invoicing/holiday-report" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const rosterOpen = location.pathname === "/roster" || location.pathname === "/daily-roster";
  const invoicingOpen = location.pathname.startsWith("/invoicing");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">
                CareAdmin
              </h1>
              <p className="text-[10px] text-sidebar-muted leading-none">
                Management Portal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Roster with sub-items */}
              <Collapsible defaultOpen={rosterOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={rosterOpen}
                      tooltip="Roster"
                      className="hover:bg-sidebar-accent"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Roster</span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {rosterSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <NavLink
                              to={sub.url}
                              className="hover:bg-sidebar-accent"
                              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            >
                              {sub.title}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Invoicing / Wages with sub-items */}
              <Collapsible defaultOpen={invoicingOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={invoicingOpen}
                      tooltip="Invoicing / Wages"
                      className="hover:bg-sidebar-accent"
                    >
                      <Receipt className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Invoicing / Wages</span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {invoicingSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <NavLink
                              to={sub.url}
                              className="hover:bg-sidebar-accent"
                              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            >
                              {sub.title}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={async () => {
            await signOut();
            nav("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </Sidebar>
  );
}
