"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, HeartPulse, Globe, Tag } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/rich-text-editor";

interface CTADataContent {
  isEnable?: boolean;
  title: string;
  subtitle: string;
  left_title: string;
  left_description: string;
  right_title: string;
  right_description: string;
}

interface CTAData {
  page: string;
  section: string;
  data: CTADataContent;
  createdAt?: string;
  updatedAt?: string;
}

const defaultDataContent: CTADataContent = {
  title: "",
  subtitle: "",
  left_title: "",
  left_description: "",
  right_title: "",
  right_description: "",
};

const defaultData: CTAData = {
  page: "home",
  section: "ctaBlock",
  data: defaultDataContent,
};

export default function CTASectionPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<CTAData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);




  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/ctaBlock/`);
      if (response.ok) {
        const res = await response.json();
        setData({
          page: res.page,
          section: res.section,
          data: {
            isEnable: res.data?.isEnable ?? true,
            title: res.data?.title || "",
            subtitle: res.data?.subtitle || "",
            left_title: res.data?.left_title || "",
            left_description: res.data?.left_description || "",
            right_title: res.data?.right_title || "",
            right_description: res.data?.right_description || "",
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load CTA data.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch CTA data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);







  const handleDataChange = (field: keyof CTADataContent, value: any) => {
    setData({
      ...data,
      data: {
        ...data.data,
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    handleDataChange("isEnable", checked);
    setIsSaving(true);
    try {
      const updatedData = {
        ...data,
        data: {
          ...data.data,
          isEnable: checked
        }
      };
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/ctaBlock/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        toast({ title: "Section status updated successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update section status.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/ctaBlock/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "CTA section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save CTA data.",
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
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <HeartPulse className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CTA Block CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure call-to-action section content
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={data.data.isEnable ?? true}
                onCheckedChange={handleToggleChange}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">Section Enabled</span>
            </div>
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
        {/* Main Content */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-pink-600" />
              Main Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Main Title</Label>
              <RichTextEditor
                placeholder="Ready to Transform Your Health?"
                value={data.data.title}
                onChange={(value) => handleDataChange("title", value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subtitle</Label>
              <RichTextEditor
                placeholder="Take the first step towards better health and wellness"
                value={data.data.subtitle}
                onChange={(value) => handleDataChange("subtitle", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Left & Right Blocks */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-pink-600" />
              Action Blocks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Left Block</h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Left Title</Label>
                <RichTextEditor
                  placeholder="Book Consultation"
                  value={data.data.left_title}
                  onChange={(value) => handleDataChange("left_title", value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Left Description</Label>
                <RichTextEditor
                  placeholder="Schedule your personalized consultation today"
                  value={data.data.left_description}
                  onChange={(value) => handleDataChange("left_description", value)}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Right Block</h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Right Title</Label>
                <RichTextEditor
                  placeholder="Emergency Care"
                  value={data.data.right_title}
                  onChange={(value) => handleDataChange("right_title", value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Right Description</Label>
                <RichTextEditor
                  placeholder="24/7 emergency healthcare services available"
                  value={data.data.right_description}
                  onChange={(value) => handleDataChange("right_description", value)}
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
            Ready to save CTA section settings
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
