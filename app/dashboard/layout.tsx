"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  DollarSign,
  CalendarDays,
  LayoutDashboard,
  Users,
  Layers,
  ListChecks,
  HeartPulse,
  Images,
  Package,
  ShoppingCart,
  Settings,
  TicketPercent,
  PanelLeft,
  Building,
  Stethoscope,
  TrendingUp,
  ScanLine,
  BookMarked,
  FileText,
  ClipboardList,
  Receipt,
  LayoutGrid,
  Landmark,
  HandCoins,
  MonitorCog,
  ArrowRightLeft,
  Store,
  UserCheck,
  Clock,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { usePermission } from "@/hooks/use-permission";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { getAssetUrl } from "@/lib/asset-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingBar, showLoadingBar } from "@/components/loading-bar";

const navItems = [
  {
    label: "Dashboards",
    icon: LayoutDashboard,
    isParent: true,
    children: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      {
        href: "/dashboard/financial-dashboard",
        icon: DollarSign,
        label: "Financial",
      },
    ],
  },
  {
    label: "Sales",
    icon: DollarSign,
    isParent: true,
    children: [
      { href: "/dashboard/sales", icon: TrendingUp, label: "Sales" },
      {
        href: "/dashboard/package-sales",
        icon: Package,
        label: "Package Sales",
      },
      { href: "/dashboard/pos", icon: ScanLine, label: "POS" },
      // { href: "/dashboard/booking", icon: BookMarked, label: "Booking" },
      // { href: "/dashboard/quotation", icon: FileText, label: "Quotation" },
      // {
      //   href: "/dashboard/work-order",
      //   icon: ClipboardList,
      //   label: "Work Order",
      // },
    ],
  },
  {
    label: "Expense",
    icon: Receipt,
    isParent: true,
    children: [
      { href: "/dashboard/expense", icon: Receipt, label: "Expense" },
      {
        href: "/dashboard/expense-category",
        icon: LayoutGrid,
        label: "Expense Category",
      },
      { href: "/dashboard/accounts", icon: Landmark, label: "Accounts" },
      { href: "/dashboard/pay-mode", icon: HandCoins, label: "Pay Mode" },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    isParent: true,
    children: [
      {
        href: "/dashboard/inventory?tab=products",
        icon: Package,
        label: "Products / Services",
      },
      {
        href: "/dashboard/inventory/purchases?tab=bills",
        icon: ShoppingCart,
        label: "Purchases",
      },
      {
        href: "/dashboard/inventory/stock-adjustments",
        icon: ArrowRightLeft,
        label: "Stock Adjustment",
      },
    ],
  },
  // Reports
  {
    label: "Reports",
    icon: ListChecks,
    isParent: true,
    children: [
      {
        href: "/dashboard/reports/stock-transactions",
        icon: ListChecks,
        label: "Stock Reports",
      },
      {
        href: "/dashboard/reports/store",
        icon: Store,
        label: "Store Reports",
      },
    ],
  },
  {
    label: "Clinic Management",
    icon: HeartPulse,
    isParent: true,
    children: [


      {
        href: "/dashboard/appointments",
        icon: CalendarDays,
        label: "Appointments",
      },
      // {
      //   href: "/dashboard/digitalPrescription",
      //   icon: FileText,
      //   label: "Digital Prescription",
      // },

      {
        // href: "/dashboard/doctorVisiting",
        href: "/dashboard/doctor-visiting",
        icon: Layers,
        label: "Doctor Visiting",

      },

      {
        href: "/dashboard/visiting",
        icon: UserCheck,
        label: "Visiting Patients",
      },


      { href: "/dashboard/patients", icon: Users, label: "Patients" },
      // {
      //   href: "/dashboard/medical-records",
      //   icon: HeartPulse,
      //   label: "Medical Records",
      // },
      { href: "/dashboard/doctors", icon: Stethoscope, label: "Doctors" },
      { href: "/dashboard/services", icon: Layers, label: "Services" },
      {
        href: "/dashboard/package-templates",
        icon: Package,
        label: "Package Templates",
      },
      { href: "/dashboard/summaries", icon: ListChecks, label: "Summaries" },
    ],
  },

  {
    label: "Website",
    icon: Building,
    isParent: true,
    children: [
      { href: "/dashboard/cms", icon: Layers, label: "Website Content" },
      { href: "/dashboard/gallery", icon: Images, label: "Gallery" },
      { href: "/dashboard/coupons", icon: TicketPercent, label: "Coupons" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    isParent: true,
    children: [
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      { href: "/dashboard/package", icon: Package, label: "Package Management" },
      {
        href: "/dashboard/role-matrix",
        icon: MonitorCog,
        label: "Role Matrix",
      },
      { href: "/dashboard/users", icon: Users, label: "Users" },
      { href: "/dashboard/timeslots", icon: CalendarDays, label: "Time Slots" },
      {
        href: "/dashboard/settings/access-time",
        icon: Clock,
        label: "Access Time",
      },
      {
        href: "/dashboard/activity-log",
        icon: ListChecks,
        label: "Activity Log",
      },
    ],
  },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { can } = usePermission();
  const { settings: adminSettings } = useAdminSettings();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: newState }));
    setTooltipKey((prev) => prev + 1);
  };

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(true));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);
  const [tooltipKey, setTooltipKey] = useState(0);
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const accessibleNavItems = navItems
    .map((item) => {
      if (item.isParent && item.children) {
        const accessibleChildren = item.children.filter((child) =>
          can("view", child.href.split("?")[0])
        );
        if (accessibleChildren.length > 0) {
          return { ...item, children: accessibleChildren };
        }
        return null;
      }
      return null;
    })
    .filter(Boolean);

  const renderMenuItem = (child: any, isActive: boolean) => {
    const isClicked = clickedItem === child.href;
    const menuItemContent = (
      <Button
        asChild
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2 whitespace-nowrap transition-all duration-300",
          isClicked && "opacity-70 scale-95"
        )}
      >
        <Link
          href={child.href}
          onClick={() => {
            setClickedItem(child.href);
            showLoadingBar();
            setTimeout(() => setClickedItem(null), 500);
            // Auto-collapse on mobile after clicking
            if (window.innerWidth < 768) {
              setIsSidebarCollapsed(true);
              localStorage.setItem("sidebar-collapsed", JSON.stringify(true));
            }
          }}
        >
          <child.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-all duration-200",
              isClicked && "animate-pulse"
            )}
          />
          <span
            className={cn(
              "font-medium transition-opacity",
              isSidebarCollapsed && "opacity-0 delay-0 hidden"
            )}
          >
            {child.label}
          </span>
        </Link>
      </Button>
    );

    return (
      <TooltipProvider key={`${child.href}-${tooltipKey}`} delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild disabled={!isSidebarCollapsed}>
            {menuItemContent}
          </TooltipTrigger>
          {isSidebarCollapsed && (
            <TooltipContent
              side="right"
              className="z-[9999] fixed whitespace-nowrap"
            >
              {child.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside
        className="flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out z-10 print:hidden flex-shrink-0"
        style={{ width: isSidebarCollapsed ? "4.5rem" : "16rem" }}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b",
            isSidebarCollapsed ? "justify-center px-0" : "px-4"
          )}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            {adminSettings.logo ? (
              <img
                src={getAssetUrl(adminSettings.logo)}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            ) : (
              <Stethoscope className="h-6 w-6 text-primary" />
            )}
            <span
              className={cn(
                "text-lg transition-opacity max-w-[140px] truncate",
                isSidebarCollapsed ? "opacity-0 hidden" : "opacity-100"
              )}
              title={adminSettings.companyName}
            >
              {adminSettings.companyName}
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-2">
          {accessibleNavItems.map((item, index) => (
            <div key={index} className="space-y-1">
              <h4
                className={cn(
                  "px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-300",
                  isSidebarCollapsed && "text-center"
                )}
              >
                {isSidebarCollapsed ? item!.label.substring(0, 3) : item!.label}
              </h4>
              {item!.children.map((child) => {
                const pathOnly = child.href.split("?")[0];
                const currentTab = searchParams.get("tab");

                // Normalize paths by removing trailing slashes
                const normalizedPathname = pathname.replace(/\/$/, "") || "/";
                const normalizedPathOnly = pathOnly.replace(/\/$/, "") || "/";

                let isActive = false;
                if (
                  pathname === "/dashboard/inventory" &&
                  child.href.startsWith("/dashboard/inventory?tab=")
                ) {
                  isActive = child.href.includes(
                    `tab=${currentTab || "products"}`
                  );
                } else if (
                  pathname === "/dashboard/inventory/purchases" &&
                  child.href.startsWith("/dashboard/inventory/purchases?tab=")
                ) {
                  isActive = child.href.includes(
                    `tab=${currentTab || "bills"}`
                  );
                } else if (
                  child.href === "/dashboard/doctors" &&
                  pathname.startsWith("/dashboard/doctors/cms/")
                ) {
                  // Make doctors menu active when in CMS pages
                  isActive = true;
                } else {
                  // Check for exact match first
                  isActive = normalizedPathname === normalizedPathOnly;

                  // If not exact match, check if current path starts with the menu item path
                  // This handles nested routes like /dashboard/cms/topbar/ under /dashboard/cms
                  if (!isActive && normalizedPathOnly !== "/dashboard") {
                    // Special handling for inventory routes to prevent cross-activation
                    if (normalizedPathOnly === "/dashboard/inventory" && pathname.startsWith("/dashboard/inventory/")) {
                      isActive = false; // Don't activate main inventory when on sub-routes
                    } else if (child.href.includes("/dashboard/inventory/") && pathname === "/dashboard/inventory") {
                      isActive = false; // Don't activate sub-routes when on main inventory
                    } else {
                      isActive = normalizedPathname.startsWith(normalizedPathOnly + "/");
                    }
                  }
                }
                return renderMenuItem(child, isActive);
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <LoadingBar />
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-xl px-2 sm:px-6 print:hidden flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 sm:px-6 sm:py-4 print:p-0">{children}</main>
      </div>
    </div>
  );
}

// ...existing code...
import { MeetingProvider } from "@/components/providers/MeetingProvider";
import { GlobalMeetingOverlay } from "@/components/meeting/GlobalMeetingOverlay";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Stethoscope className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <MeetingProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
        <GlobalMeetingOverlay />
      </MeetingProvider>
    </Suspense>
  );
}





