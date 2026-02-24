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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, Calendar, Eye, EyeOff, ImageIcon, Globe, Tag, Upload, X } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";
import { RichTextEditor } from "@/components/rich-text-editor";

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

interface AppointmentDataContent {
  enabled: boolean;
  title: string;
  subtitle: string;
  buttonText: string;
  secondaryButtonText: string;
  image: string;
  seo: SEOData;
}

interface AppointmentData {
  page: string;
  section: string;
  data: AppointmentDataContent;
  createdAt?: string;
  updatedAt?: string;
}

const defaultSEO: SEOData = {
  title: "",
  description: "",
  keywords: [],
  slug: "appointment-section",
};

const defaultDataContent: AppointmentDataContent = {
  enabled: true,
  title: "",
  subtitle: "",
  buttonText: "Schedule Your Visit",
  secondaryButtonText: "Call Us Now",
  image: "",
  seo: defaultSEO,
};

const defaultData: AppointmentData = {
  page: "home",
  section: "appointment",
  data: defaultDataContent,
};

export default function AppointmentPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<AppointmentData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/appointment/`);
      if (response.ok) {
        const res = await response.json();
        setData({
          page: res.page,
          section: res.section,
          data: {
            enabled: res.data?.enabled ?? true,
            title: res.data?.title || "",
            subtitle: res.data?.subtitle || "",
            buttonText: res.data?.buttonText || "Schedule Your Visit",
            secondaryButtonText: res.data?.secondaryButtonText || "Call Us Now",
            image: res.data?.image || "",
            seo: res.data?.seo || defaultSEO,
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load appointment data.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch appointment data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataChange = (field: keyof AppointmentDataContent, value: any) => {
    setData({
      ...data,
      data: {
        ...data.data,
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    handleDataChange("enabled", checked);
    setIsSaving(true);
    try {
      const updatedData = {
        ...data,
        data: {
          ...data.data,
          enabled: checked
        }
      };
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/appointment/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        toast({ title: "Status updated successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSEOChange = (field: keyof SEOData, value: string | string[]) => {
    setData({
      ...data,
      data: {
        ...data.data,
        seo: {
          ...data.data.seo,
          [field]: value
        }
      }
    });
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const currentKeywords = data.data.seo.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      handleSEOChange("keywords", [...currentKeywords, keywordInput.trim()]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    const newKeywords = (data.data.seo.keywords || []).filter((_, i) => i !== index);
    handleSEOChange("keywords", newKeywords);
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
      handleDataChange("image", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/appointment/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "Appointment section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save appointment data.",
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
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointment CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure appointment booking section content
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
        {/* Content Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Section Status</Label>
                <p className="text-sm text-muted-foreground">Toggle section visibility</p>
              </div>
              <div className="flex items-center gap-2">
                {data.data.enabled ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <Switch
                  checked={data.data.enabled}
                  onCheckedChange={handleToggleChange}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title</Label>
              <RichTextEditor
                placeholder="Ready to Start Your Journey?"
                value={data.data.title}
                onChange={(value) => handleDataChange("title", value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subtitle</Label>
              <RichTextEditor
                placeholder="Schedule a consultation with our experts today..."
                value={data.data.subtitle}
                onChange={(value) => handleDataChange("subtitle", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Button & Image Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Buttons & Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Button Text</Label>
              <Input
                placeholder="Schedule Your Visit"
                value={data.data.buttonText}
                onChange={(e) => handleDataChange("buttonText", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Secondary Button Text</Label>
              <Input
                placeholder="Call Us Now"
                value={data.data.secondaryButtonText}
                onChange={(e) => handleDataChange("secondaryButtonText", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="/uploads/appointment-image.png"
                  value={data.data.image}
                  onChange={(e) => handleDataChange("image", e.target.value)}
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
              {data.data.image && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <Image
                    src={getAssetUrl(data.data.image)}
                    alt="Appointment section"
                    width={80}
                    height={80}
                    className="object-cover rounded"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            SEO Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize your appointment section for search engines
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">SEO Title</Label>
              <Input
                placeholder="Book Appointment - Healthcare Clinic"
                value={data.data.seo.title}
                onChange={(e) => handleSEOChange("title", e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {data.data.seo.title.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">SEO Slug</Label>
              <Input
                placeholder="appointment-section"
                value={data.data.seo.slug}
                onChange={(e) => handleSEOChange("slug", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Meta Description</Label>
            <RichTextEditor
              placeholder="Schedule your consultation with our expert healthcare professionals"
              value={data.data.seo.description}
              onChange={(value) => handleSEOChange("description", value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                className="h-11 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addKeyword}
                className="h-11"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(data.data.seo.keywords || []).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter or click the tag icon to add keywords
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save appointment section settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[160px]"
              style={{ backgroundColor: '#4f46e5', color: 'white' }}
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