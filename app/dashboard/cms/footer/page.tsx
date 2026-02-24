"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, Layout, Globe, Tag, X, Plus, Trash2, Upload } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

interface FooterDataContent {
  logoUrl: string;
  title: string;
  description: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  quickLinks: { id: string; label: string; url: string }[];
  services: { id: string; name: string; url: string }[];
  contactInfo: {
    address: string;
    email: string;
    phone1: string;
    phone2: string;
  };
  copyright: string;
  designer: { name: string; url: string };
}

interface FooterData {
  page: string;
  section: string;
  data: FooterDataContent;
  createdAt?: string;
  updatedAt?: string;
}

const defaultSEO: SEOData = {
  title: "",
  description: "",
  keywords: [],
  slug: "footer",
};

const defaultDataContent: FooterDataContent = {
  logoUrl: "",
  title: "",
  description: "",
  socialLinks: { facebook: "", twitter: "", instagram: "", linkedin: "" },
  quickLinks: [],
  services: [],
  contactInfo: { address: "", email: "", phone1: "", phone2: "" },
  copyright: "",
  designer: { name: "", url: "" },
};

const defaultData: FooterData = {
  page: "home",
  section: "footer",
  data: defaultDataContent,
};

export default function FooterPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<FooterData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/footer/`);
      if (response.ok) {
        const res = await response.json();
        setData({
          page: res.page,
          section: res.section,
          data: {
            logoUrl: res.data?.logoUrl || "",
            title: res.data?.title || "",
            description: res.data?.description || "",
            socialLinks: res.data?.socialLinks || { facebook: "", twitter: "", instagram: "", linkedin: "" },
            quickLinks: res.data?.quickLinks || [],
            services: res.data?.services || [],
            contactInfo: res.data?.contactInfo || { address: "", email: "", phone1: "", phone2: "" },
            copyright: res.data?.copyright || "",
            designer: res.data?.designer || { name: "", url: "" },
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load footer data.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch footer data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataChange = (field: keyof FooterDataContent, value: any) => {
    setData({ 
      ...data, 
      data: { 
        ...data.data, 
        [field]: value 
      } 
    });
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleDataChange("logoUrl", url);
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/footer/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "Footer saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save footer data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                <Layout className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Footer CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage footer content, links, and contact information
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={loadData} className="bg-white dark:bg-gray-800">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {data.page}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {data.section}
        </Badge>
        {data.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(data.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Logo & Brand */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-slate-600" />
              Logo & Brand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Logo</Label>
              <p className="text-xs text-muted-foreground">Recommended size: 200x80 pixels</p>
              <div className="flex gap-2">
                <Input
                  placeholder="/uploads/logo.png"
                  value={data.data.logoUrl}
                  onChange={(e) => handleDataChange("logoUrl", e.target.value)}
                  className="h-11 flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button variant="outline" className="h-11" disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {data.data.logoUrl && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <Image 
                    src={getAssetUrl(data.data.logoUrl)} 
                    alt="Footer Logo" 
                    width={120}
                    height={48}
                    className="object-contain rounded"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title</Label>
              <Input
                placeholder="Company Name"
                value={data.data.title}
                onChange={(e) => handleDataChange("title", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                placeholder="Your trusted application for advance clinic management"
                value={data.data.description}
                onChange={(e) => handleDataChange("description", e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-600" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.data.socialLinks).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium capitalize">{key}</Label>
                <Input
                  value={value}
                  onChange={(e) =>
                    handleDataChange("socialLinks", { ...data.data.socialLinks, [key]: e.target.value })
                  }
                  placeholder={`https://${key}.com/yourpage`}
                  className="h-11"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Quick Links */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-slate-600" />
                Quick Links
              </CardTitle>
              <Badge variant="secondary">
                {data.data.quickLinks.length} links
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.data.quickLinks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-muted-foreground text-sm mb-4">
                  No quick links configured yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.data.quickLinks.map((link, i) => (
                  <div key={link.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const newLinks = [...data.data.quickLinks];
                          newLinks[i].label = e.target.value;
                          handleDataChange("quickLinks", newLinks);
                        }}
                        placeholder="About Us"
                        className="h-10"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...data.data.quickLinks];
                          newLinks[i].url = e.target.value;
                          handleDataChange("quickLinks", newLinks);
                        }}
                        placeholder="/about"
                        className="h-10"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        handleDataChange("quickLinks", data.data.quickLinks.filter((_, idx) => idx !== i))
                      }
                      className="h-10 w-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() =>
                  handleDataChange("quickLinks", [
                    ...data.data.quickLinks,
                    { id: `ql${data.data.quickLinks.length + 1}`, label: "", url: "" },
                  ])
                }
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Quick Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-slate-600" />
                Services
              </CardTitle>
              <Badge variant="secondary">
                {data.data.services.length} services
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.data.services.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-muted-foreground text-sm mb-4">
                  No services configured yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.data.services.map((service, i) => (
                  <div key={service.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Service Name</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => {
                          const newServices = [...data.data.services];
                          newServices[i].name = e.target.value;
                          handleDataChange("services", newServices);
                        }}
                        placeholder="AI Powered Workflow"
                        className="h-10"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Service URL</Label>
                      <Input
                        value={service.url}
                        onChange={(e) => {
                          const newServices = [...data.data.services];
                          newServices[i].url = e.target.value;
                          handleDataChange("services", newServices);
                        }}
                        placeholder="/services/ai-workflow"
                        className="h-10"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        handleDataChange("services", data.data.services.filter((_, idx) => idx !== i))
                      }
                      className="h-10 w-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() =>
                  handleDataChange("services", [
                    ...data.data.services,
                    { id: `s${data.data.services.length + 1}`, name: "", url: "" },
                  ])
                }
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Contact Info */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <Textarea
                value={data.data.contactInfo.address}
                onChange={(e) =>
                  handleDataChange("contactInfo", { ...data.data.contactInfo, address: e.target.value })
                }
                placeholder="811 PS Qube Near City Center II\nAction Area II New Town Kolkata -700156"
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                value={data.data.contactInfo.email}
                onChange={(e) =>
                  handleDataChange("contactInfo", { ...data.data.contactInfo, email: e.target.value })
                }
                placeholder="contact@company.com"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Primary Phone</Label>
                <Input
                  value={data.data.contactInfo.phone1}
                  onChange={(e) =>
                    handleDataChange("contactInfo", { ...data.data.contactInfo, phone1: e.target.value })
                  }
                  placeholder="+91 9958953081"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Secondary Phone</Label>
                <Input
                  value={data.data.contactInfo.phone2}
                  onChange={(e) =>
                    handleDataChange("contactInfo", { ...data.data.contactInfo, phone2: e.target.value })
                  }
                  placeholder="+91 XXXXXXXXXX"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Bottom */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-slate-600" />
              Footer Bottom
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Copyright Text</Label>
              <Input
                value={data.data.copyright}
                onChange={(e) => handleDataChange("copyright", e.target.value)}
                placeholder="99Clinix (All rights reserved)"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Designer Name</Label>
                <Input
                  value={data.data.designer.name}
                  onChange={(e) =>
                    handleDataChange("designer", { ...data.data.designer, name: e.target.value })
                  }
                  placeholder="T2P Office"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Designer URL</Label>
                <Input
                  value={data.data.designer.url}
                  onChange={(e) =>
                    handleDataChange("designer", { ...data.data.designer, url: e.target.value })
                  }
                  placeholder="https://designer-website.com"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save footer settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="min-w-[160px]"
              style={{backgroundColor: '#4f46e5', color: 'white'}}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
