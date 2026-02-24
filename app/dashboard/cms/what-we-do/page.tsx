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
import { Loader2, Save, RefreshCcw, Brain, Globe, Tag, X } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

interface WhatWeDoDataContent {
  isEnable?: boolean;
  headtitle: string;
  title: string;
  subtitle: string;
  seo: SEOData;
}

interface WhatWeDoData {
  page: string;
  section: string;
  data: WhatWeDoDataContent;
  createdAt?: string;
  updatedAt?: string;
}

const defaultSEO: SEOData = {
  title: "",
  description: "",
  keywords: [],
  slug: "what-we-do",
};

const defaultDataContent: WhatWeDoDataContent = {
  headtitle: "What We Do",
  title: "Services at SRM Arnik Skin & Healthcare Clinic",
  subtitle: "Specialized Services Designed to provide with the Highest Standard of Care",
  seo: defaultSEO,
};

const defaultData: WhatWeDoData = {
  page: "home",
  section: "whatWeDo",
  data: defaultDataContent,
};

export default function WhatWeDoPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<WhatWeDoData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/whatWeDo/`);
      if (response.ok) {
        const res = await response.json();
        setData({
          page: res.page,
          section: res.section,
          data: {
            isEnable: res.data?.isEnable ?? true,
            headtitle: res.data?.headtitle || "What We Do",
            title: res.data?.title || "Services at SRM Arnik Skin & Healthcare Clinic",
            subtitle: res.data?.subtitle || "Specialized Services Designed to provide with the Highest Standard of Care",
            seo: res.data?.seo || defaultSEO,
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load what we do data.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch what we do data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataChange = (field: keyof WhatWeDoDataContent, value: any) => {
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
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/whatWeDo/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, data: { ...data.data, isEnable: checked } }),
      });
      if (res.ok) {
        toast({ title: "Section status updated successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update section status." });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/whatWeDo/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "What We Do section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save what we do data.",
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
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">What We Do CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure what we do section content
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

      {/* Content Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Content Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Head Title</Label>
            <Input
              placeholder="What We Do"
              value={data.data.headtitle}
              onChange={(e) => handleDataChange("headtitle", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Main Title</Label>
            <Input
              placeholder="Services at SRM Arnik Skin & Healthcare Clinic"
              value={data.data.title}
              onChange={(e) => handleDataChange("title", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subtitle</Label>
            <Textarea
              placeholder="Specialized Services Designed to provide with the Highest Standard of Care"
              value={data.data.subtitle}
              onChange={(e) => handleDataChange("subtitle", e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            SEO Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize your what we do section for search engines
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">SEO Title</Label>
              <Input
                placeholder="What We Do - Healthcare Services"
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
                placeholder="what-we-do"
                value={data.data.seo.slug}
                onChange={(e) => handleSEOChange("slug", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Meta Description</Label>
            <Textarea
              placeholder="Discover our specialized healthcare services designed to provide the highest standard of care"
              value={data.data.seo.description}
              onChange={(e) => handleSEOChange("description", e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {data.data.seo.description.length}/160 characters
            </p>
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
            Ready to save what we do section settings
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
