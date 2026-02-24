"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Settings,
  Globe,
  Layout,
  User,
  Briefcase,
  Award,
  MessageSquare,
  FileText,
  Phone,
  Navigation,
  BarChart3,
  Image,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Brain,
  HeartPulse,
  Activity,
  GitCompare,
  LineChart,
} from "lucide-react";
import { group } from "console";

const sidebarSections = [
  // Site Structure
  {
    id: "topbar",
    label: "Top Bar",
    icon: Layout,
    href: "/dashboard/cms",
    category: "Site Structure"
  },
  {
    id: "navbar",
    label: "Navigation",
    icon: Navigation,
    href: "/dashboard/cms/navbar",
    category: "Site Structure"
  },
  {
    id: "footer",
    label: "Footer",
    icon: Layout,
    href: "/dashboard/cms/footer",
    category: "Site Structure"
  },

  // Homepage Sections
  {
    id: "carousel",
    label: "Hero Carousel",
    icon: Image,
    href: "/dashboard/cms/carousel",
    category: "Homepage"
  },
  {
    id: "features",
    label: "Features",
    icon: Globe,
    href: "/dashboard/cms/features",
    category: "Homepage"
  },
  // {
  //   id: "new-about",
  //   label: "New About",
  //   icon: User,
  //   href: "/dashboard/cms/new-about",
  //   category: "Homepage"
  // },
  {
    id: "homePageAbout",
    label: "Homepage About",
    icon: BarChart3,
    href: "/dashboard/cms/homepage-about",
    category: "Homepage"
  },
  {
    id: "services",
    label: "Services",
    icon: Briefcase,
    href: "/dashboard/cms/services",
    category: "Homepage"
  },
  {
    id: "why-choose-us",
    label: "Why Choose Us",
    icon: Award,
    href: "/dashboard/cms/why-choose-us",
    category: "Homepage"
  },
  // {
  //   id: "activities",
  //   label: "Activities",
  //   icon: Activity,
  //   href: "/dashboard/cms/activities",
  //   category: "Homepage"
  // },
  // {
  //   id: "portfolio",
  //   label: "Portfolio",
  //   icon: LineChart,
  //   href: "/dashboard/cms/portfolio",
  //   category: "Homepage"
  // },
  {
    id: "before-after",
    label: "Before after",
    icon: GitCompare,
    href: "/dashboard/cms/before_after",
    category: "Homepage"
  },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: MessageSquare,
    href: "/dashboard/cms/testimonials",
    category: "Homepage"
  },
  {
    id: "home-cta",
    label: "CTA Block",
    icon: HeartPulse,
    href: "/dashboard/cms/cta-block",
    category: "Homepage"
  },

  // Company Pages
  {
    id: "aboutSection",
    label: "About Page",
    icon: User,
    href: "/dashboard/cms/about",
    category: "Company"
  },
  {
    id: "team",
    label: "Team",
    icon: User,
    href: "/dashboard/cms/team",
    category: "Company"
  },
  // {
  //   id: "whatWeDO",
  //   label: "What We Do",
  //   icon: Brain,
  //   href: "/dashboard/cms/what-we-do",
  //   category: "Company"
  // },

  // Interactive Features
  {
    id: "faq-header",
    label: "FAQ",
    icon: BarChart3,
    href: "/dashboard/cms/faq",
    category: "Features"
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: ShieldCheck,
    href: "/dashboard/cms/appointment",
    category: "Features"
  },
  {
    id: "blog",
    label: "Blog",
    icon: FileText,
    href: "/dashboard/cms/blog-header",
    category: "Features"
  },
  {
    id: "contact",
    label: "Contact",
    icon: Phone,
    href: "/dashboard/cms/contact",
    category: "Features"
  },

  // Content Management
  {
    id: "pages",
    label: "Pages",
    icon: FileText,
    href: "/dashboard/cms/pages",
    category: "Content"
  },

  // Settings
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/dashboard/cms/settings",
    category: "Settings"
  },
];

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("cms-sidebar-collapsed");
    if (savedState) setSidebarCollapsed(JSON.parse(savedState));
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("cms-sidebar-collapsed", JSON.stringify(newState));
  };

  const getActiveSection = () => {
    const pathParts = pathname.split("/").filter(Boolean);
    // Example pathParts: ['dashboard', 'cms', 'navbar']
    const section = pathParts[2]; // after cms/
    if (!section || pathname === "/dashboard/cms" || pathname === "/dashboard/cms/") return "topbar";

    // Map specific routes to their section IDs
    const routeMap: { [key: string]: string } = {
      "homepage-about": "homePageAbout",
      "faq": "faq-header",
      "before_after": "before-after",
      "appointment": "appointments",
      "about": "aboutSection",
      "what-we-do": "whatWeDO",
      "blog-header": "blog",
      "cta-block": "home-cta",
      "why-choose-us": "why-choose-us"
    };

    return routeMap[section] || section;
  };

  const currentSection = getActiveSection();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              CMS Dashboard
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <TooltipProvider delayDuration={200}>
            <nav className="space-y-1">
              {(() => {
                const categories = ['Site Structure', 'Homepage', 'Company', 'Features', 'Content', 'Settings'];
                return categories.map((category) => {
                  const categoryItems = sidebarSections.filter(section => section.category === category);
                  return (
                    <div key={category}>
                      {!sidebarCollapsed && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category}
                        </div>
                      )}
                      {categoryItems.map((section) => {
                        const isActive = section.id === 'topbar'
                          ? (pathname === '/dashboard/cms' || pathname === '/dashboard/cms/' || pathname === '/dashboard/cms/topbar' || pathname === '/dashboard/cms/topbar/')
                          : (pathname === section.href || pathname === section.href + '/');

                        const linkContent = (
                          <Link
                            key={section.id}
                            href={section.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              isActive
                                ? "bg-secondary text-secondary-foreground"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            <section.icon className="h-4 w-4 shrink-0" />
                            {!sidebarCollapsed && <span>{section.label}</span>}
                          </Link>
                        );

                        return sidebarCollapsed ? (
                          <Tooltip key={section.id}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{section.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkContent
                        );
                      })}
                      {!sidebarCollapsed && category !== 'Settings' && (
                        <div className="h-px bg-gray-200 mx-3 my-2" />
                      )}
                    </div>
                  );
                });
              })()}
            </nav>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
