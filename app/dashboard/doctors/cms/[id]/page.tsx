"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";
import {
  Loader,
  Loader2Icon,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
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
  HelpCircle,
  Palette,
} from "lucide-react";

const sectionIcons = {
  topbar: Layout,
  navbar: Navigation,
  carousel: Image,
  stats: BarChart3,
  homepage_about: User,
  services: Briefcase,
  education: FileText,
  workExperience: Briefcase,
  awards_recognition: Award,
  testimonials: MessageSquare,
  beforeAfter: Palette,
  faq: HelpCircle,
  blog: FileText,
  home_cta: Phone,
  footer: Layout,
};

const cmsSchema = [
  { page: "home", section: "topbar", data: { enabled: true } },
  { page: "home", section: "navbar", data: { enabled: true } },
  { page: "home", section: "carousel", data: { enabled: true } },
  { page: "home", section: "stats", data: { enabled: true } },
  { page: "home", section: "homepage_about", data: { enabled: true } },
  { page: "home", section: "services", data: { enabled: true } },
  { page: "home", section: "education", data: [] },
  { page: "home", section: "workExperience", data: [] },
  { page: "home", section: "awards_recognition", data: [] },
  { page: "home", section: "testimonials", data: { enabled: true } },
  { page: "home", section: "beforeAfter", data: { enabled: true } },
  { page: "home", section: "faq", data: { enabled: true } },
  { page: "home", section: "blog", data: { enabled: true } },
  { page: "home", section: "home_cta", data: { enabled: true } },
  { page: "home", section: "footer", data: { enabled: true } },
];

export default function CMSOverviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get('name') || '';
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [homeContent, setHomeContent] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSection, setUpdatingSection] = useState<string | null>(null);
  const [mappedDomains, setMappedDomains] = useState<any[]>([]);

  const fetchAllContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const sectionsToFetch = cmsSchema.map((item) => ({
        page: item.page,
        section: item.section,
      }));

      const fetchPromises = sectionsToFetch.map(({ page, section }) =>
        fetch(`${API_BASE_URL}/api/cms/${page}/${section}_${doctorId}`)
      );

      const responses = await Promise.all(fetchPromises);
      const newHomeContent: any = {};

      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const { section } = sectionsToFetch[i];

        let contentData;
        if (res.ok) {
          const contentItem = await res.json();
          contentData = contentItem.data;
        } else {
          contentData = cmsSchema.find((item) => item.section === section)?.data;
        }

        newHomeContent[section] = contentData;
      }

      setHomeContent(newHomeContent);
      
      // Fetch mapped domains
      try {
        const domainsResponse = await authFetch(`${API_BASE_URL}/api/cms/home/mapdomains`);
        if (domainsResponse.ok) {
          const domainsResult = await domainsResponse.json();
          const userDomains = domainsResult.data?.find((item: any) => item.userId === doctorId);
          setMappedDomains(userDomains?.domains || []);
        }
      } catch (error) {
        console.error("Error fetching domains:", error);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, authFetch]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAllContent();
    }
  }, [mounted, fetchAllContent]);

  const handleToggleSection = async (section: string, enabled: boolean) => {
    setUpdatingSection(section);
    try {
      const updatedContent = {
        ...(homeContent?.[section] || {}),
        enabled: enabled,
      };

      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/${section}_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedContent }),
        }
      );

      if (!response.ok) throw new Error(`Failed to update section: ${section}`);

      setHomeContent((prev: any) => ({
        ...prev,
        [section]: updatedContent,
      }));

      toast({
        title: "Success",
        description: `Section ${enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update section: ${error}`,
      });
    } finally {
      setUpdatingSection(null);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">
          Loading CMS Overview...
        </span>
      </div>
    );
  }

  const getSectionStatus = (section: string) => {
    const data = homeContent?.[section];
    if (Array.isArray(data)) {
      return data.length > 0 ? "configured" : "empty";
    }
    return data?.enabled !== false ? "enabled" : "disabled";
  };

  const getSectionItemCount = (section: string) => {
    const data = homeContent?.[section];
    if (Array.isArray(data)) {
      return data.length;
    }
    if (data?.slides) return data.slides.length;
    if (data?.items) return data.items.length;
    if (data?.testimonials) return data.testimonials.length;
    if (data?.posts) return data.posts.length;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">CMS Overview</h1>
        <p className="text-blue-100">
          Manage your website content sections - {doctorName || `Doctor ID: ${doctorId}`}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Website Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure theme and layout
                </p>
              </div>
            </div>
            <Link href={`/dashboard/doctors/cms/${doctorId}/settings`}>
              <Button className="w-full mt-3" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Open Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Domain Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  Configure custom domains
                </p>
              </div>
            </div>
            <Link href={`/dashboard/doctors/cms/${doctorId}/domains`}>
              <Button className="w-full mt-3" variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Manage Domains
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Preview Website</h3>
                <p className="text-sm text-muted-foreground">
                  View your live website
                </p>
              </div>
            </div>
            <Button 
              className="w-full mt-3" 
              variant="outline"
              onClick={() => {
                const primaryDomain = mappedDomains[0];
                if (primaryDomain) {
                  window.open(`https://${primaryDomain}`, '_blank');
                } else {
                  toast({
                    variant: "destructive",
                    title: "No Domain Found",
                    description: "Please configure a domain first",
                  });
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Preview
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Content Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(homeContent || {})
              .filter(([section]) => section !== "settings" && section !== "modules_list")
              .map(([section, data]) => {
                const Icon = sectionIcons[section as keyof typeof sectionIcons] || Layout;
                const status = getSectionStatus(section);
                const itemCount = getSectionItemCount(section);
                const isUpdating = updatingSection === section;

                return (
                  <Card key={section} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-gray-600" />
                          <h3 className="font-medium capitalize">
                            {section.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                          </h3>
                        </div>
                        <Badge
                          variant={
                            status === "enabled"
                              ? "default"
                              : status === "configured"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {status === "configured" ? "Configured" : status}
                        </Badge>
                      </div>

                      {itemCount !== null && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <Link href={`/dashboard/doctors/cms/${doctorId}/${section === 'workExperience' ? 'experience' : section === 'awards_recognition' ? 'awards' : section === 'homepage_about' ? 'about' : section === 'home_cta' ? 'home-cta' : section === 'beforeAfter' ? 'before_after' : section}`}>
                          <Button variant="outline" size="sm">
                            Edit Section
                          </Button>
                        </Link>

                        {!Array.isArray(data) && (
                          <div className="flex items-center gap-2">
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Switch
                                  checked={data?.enabled !== false}
                                  onCheckedChange={(checked) =>
                                    handleToggleSection(section, checked)
                                  }
                                  disabled={isUpdating}
                                />
                                {data?.enabled !== false ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}