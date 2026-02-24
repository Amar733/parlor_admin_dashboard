"use client";

import React, { useState, useEffect } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
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
  Palette,
  Navigation,
  BarChart3,
  Image,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const sidebarSections = [
  { id: "overview", label: "Overview", icon: Home, href: "" },
  { id: "topbar", label: "Top Bar", icon: Layout, href: "/topbar" },
  { id: "navbar", label: "Navigation", icon: Navigation, href: "/navbar" },
  { id: "carousel", label: "Hero Carousel", icon: Image, href: "/carousel" },
  { id: "stats", label: "Statistics", icon: BarChart3, href: "/stats" },
  { id: "homepage_about", label: "About Section", icon: User, href: "/about" },
  { id: "services", label: "Services", icon: Briefcase, href: "/services" },
  { id: "education", label: "Education", icon: FileText, href: "/education" },
  {
    id: "workExperience",
    label: "Experience",
    icon: Briefcase,
    href: "/experience",
  },
  { id: "awards_recognition", label: "Awards", icon: Award, href: "/awards" },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: MessageSquare,
    href: "/testimonials",
  },
  {
    id: "beforeAfter",
    label: "Before & After",
    icon: Palette,
    href: "/before_after",
  },
  { id: "faq", label: "FAQ", icon: BarChart3, href: "/faq" },
  { id: "blog", label: "Blog", icon: FileText, href: "/blog" },
  { id: "home_cta", label: "CTA", icon: Phone, href: "/home-cta" },
  { id: "footer", label: "Footer", icon: Layout, href: "/footer" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  { id: "domains", label: "Domain Mapping", icon: Globe, href: "/domains" },
];

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authFetch } = useAuth();
  const doctorId = params.id as string;
  const [doctorName, setDoctorName] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state and fetch doctor name
  useEffect(() => {
    const savedState = localStorage.getItem("cms-sidebar-collapsed");
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }

    // Fetch doctor name
    const fetchDoctorName = async () => {
      try {
        const response = await authFetch("/api/users?role=doctor");
        if (response.ok) {
          const doctors = await response.json();
          const doctor = doctors?.find((doc: any) => doc._id === doctorId);
          if (doctor) {
            setDoctorName(doctor.name || "");
          }
        }
      } catch (error) {
        console.error("Error fetching doctor name:", error);
      }
    };

    if (doctorId) {
      fetchDoctorName();
    }
  }, [doctorId, authFetch]);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("cms-sidebar-collapsed", JSON.stringify(newState));
  };

  const getActiveSection = () => {
    const pathParts = pathname.split("/").filter(Boolean);

    // Find the section after the doctor ID
    const cmsIndex = pathParts.findIndex((part) => part === "cms");
    if (cmsIndex === -1) return "overview";

    const sectionPart = pathParts[cmsIndex + 2]; // After cms/[id]/

    // If no section part, we're at overview
    if (!sectionPart) return "overview";

    // Map URL segments to section IDs
    const urlToSectionMap: { [key: string]: string } = {
      topbar: "topbar",
      navbar: "navbar",
      carousel: "carousel",
      stats: "stats",
      about: "homepage_about",
      services: "services",
      education: "education",
      experience: "workExperience",
      awards: "awards_recognition",
      testimonials: "testimonials",
      blog: "blog",
      "home-cta": "home_cta",
      footer: "footer",
      settings: "settings",
      domains: "domains",
    };

    return urlToSectionMap[sectionPart] || sectionPart;
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
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  CMS Dashboard
                </h2>
                <p className="text-sm text-gray-500">
                  {doctorName || `Doctor ID: ${doctorId}`}
                </p>
              </div>
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
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <TooltipProvider delayDuration={200}>
            <nav className="space-y-1">
              {sidebarSections.map((section) => {
                const isActive = currentSection === section.id;

                const linkContent = (
                  <Link
                    key={section.id}
                    href={`/dashboard/doctors/cms/${doctorId}${section.href}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <section.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{section.label}</span>
                    )}
                  </Link>
                );

                return sidebarCollapsed ? (
                  <Tooltip key={section.id} delayDuration={100}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{section.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkContent
                );
              })}
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
