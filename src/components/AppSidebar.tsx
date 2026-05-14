import { LayoutDashboard, Users, HeartHandshake, CalendarDays, ChevronDown, LogOut, MapPin, MessageSquare, FileBarChart, Receipt, Activity, Sparkles, BookMarked, Building2, UserCog, Plus, Circle, Eye, Printer, Wrench, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useCurrentCompany, useHasAppRole } from "@/hooks/use-company";
import { useFeatureToggles } from "@/hooks/use-feature-toggles";
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
  { title: "Insights", url: "/insights", icon: Sparkles, feature: "insights" as const },
  { title: "Care Givers", url: "/caregivers", icon: Users },
  { title: "Service Members", url: "/carereceivers", icon: HeartHandshake },
  { title: "Bookings", url: "/bookings", icon: BookMarked, feature: "bookings" as const },
  { title: "Location Tracking", url: "/location-tracking", icon: MapPin },
  { title: "Communication Log", url: "/communication-log", icon: MessageSquare, feature: "communicationLog" as const },
  { title: "Timeline", url: "/timeline", icon: Activity, feature: "timeline" as const },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const rotaSubItems = [
  { title: "Add Rota", url: "/rota/add", icon: Plus },
  { title: "Daily Rota", url: "/rota/daily", icon: Circle },
  { title: "Advanced Rota", url: "/rota/advanced", icon: Circle },
  { title: "Live Run Routes", url: "/rota/live-run-routes", icon: Circle, feature: "liveRunRoutes" as const },
  { title: "The Monitor", url: "/rota/monitor", icon: Eye, feature: "theMonitor" as const },
  { title: "Printable Rota", url: "/rota/printable", icon: Printer, feature: "printableRota" as const },
  { title: "Build Rota", url: "/rota/build", icon: Wrench, feature: "buildRota" as const },
  { title: "Conflicts", url: "/rota/conflicts", icon: AlertTriangle },
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
  const { data: cu } = useCurrentCompany();
  const { data: isSuper } = useHasAppRole("super_admin");
  const { features } = useFeatureToggles();
  const isCompanyAdmin = cu && (cu.role === "owner" || cu.role === "admin");

  const visibleTopItems = topItems.filter(
    (item) => !("feature" in item) || features[item.feature as keyof typeof features],
  );
  const visibleRotaSubItems = rotaSubItems.filter(
    (item) => !("feature" in item) || features[item.feature as keyof typeof features],
  );

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const invoicingOpen = location.pathname.startsWith("/invoicing");
  const rotaOpen = location.pathname.startsWith("/rota") || location.pathname.startsWith("/roster") || location.pathname.startsWith("/daily-roster");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-5 border-b border-sidebar-border">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
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

      <SidebarContent className="pt-2 overflow-y-auto overflow-x-hidden scrollbar-themed">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleTopItems.map((item) => (
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


              {/* Rota with sub-items */}
              <Collapsible defaultOpen={rotaOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={rotaOpen}
                      tooltip="Rota"
                      className="hover:bg-sidebar-accent"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">Rota</span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {visibleRotaSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <NavLink
                              to={sub.url}
                              className="hover:bg-sidebar-accent"
                              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            >
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.title}</span>
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

              {isCompanyAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/company-users")} tooltip="Users">
                    <NavLink to="/company-users" className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <UserCog className="h-4 w-4" />
                      {!collapsed && <span>Users</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isSuper && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/super-admin")} tooltip="Companies">
                    <NavLink to="/super-admin" className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <Building2 className="h-4 w-4" />
                      {!collapsed && <span>Companies</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border">
       <Button
  variant="ghost"
  className={`w-full gap-2 text-white bg-[#EF4444] hover:bg-[#DC2626] hover:text-white ${
    collapsed ? "justify-center mr-2" : "justify-start"
  }`}
  onClick={async () => {
    await signOut();
    nav("/login");
  }}
>
  <LogOut className="h-4 w-4" />
  {!collapsed && "Sign Out"}
</Button>
      </div>
    </Sidebar>
  );
}
