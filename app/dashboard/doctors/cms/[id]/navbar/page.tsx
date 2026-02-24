"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, X, Upload, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchSectionData, saveSectionData } from "@/lib/cms-utils";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/config/api";

export default function NavbarPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<any>({
    enabled: true,
    logo: "",
    items: [],
    primaryButton: { enabled: true, buttonText: "", chooseModuleToOpen: "" },
    secondaryButton: { enabled: true, buttonText: "", chooseModuleToOpen: "" },
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: ""
    }
  });
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [navKeywordInput, setNavKeywordInput] = useState("");
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const [sectionData, modulesData] = await Promise.all([
        fetchSectionData(doctorId, "navbar"),
        fetch(`${API_BASE_URL}/api/cms/home/modules_list`).then(res => res.ok ? res.json() : null)
      ]);
      
      if (sectionData) {
        setData({
          ...sectionData,
          seo: {
            title: sectionData.seo?.title || "",
            description: sectionData.seo?.description || "",
            keywords: sectionData.seo?.keywords || [],
            slug: sectionData.seo?.slug || ""
          }
        });
      }
      if (modulesData?.data) {
        setModulesList(modulesData.data);
      }
      setIsLoading(false);
    };
    loadData();
  }, [doctorId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveSectionData(authFetch, doctorId, "navbar", data);
      if (success) {
        toast({ title: "Success", description: "Navigation saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save navigation" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await authFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      setData({ ...data, logo: url });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const addNavItem = () => {
    setData({
      ...data,
      items: [...data.items, { 
        id: Date.now().toString(), 
        text: "", 
        link: "",
        seo_title: "",
        seo_description: "",
        seo_keywords: ""
      }]
    });
  };

  const removeNavItem = (index: number) => {
    const newItems = data.items.filter((_: any, i: number) => i !== index);
    setData({ ...data, items: newItems });
  };

  const updateNavItem = (index: number, field: string, value: string) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, items: newItems });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Navigation Settings</h1>
        <div className="flex items-center gap-2">
          <Switch
            checked={data.enabled}
            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
          />
          <span className="text-sm font-medium">
            {data.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={data.logo || ""}
              onChange={(e) => setData({ ...data, logo: e.target.value })}
              placeholder="Logo URL"
              className="flex-1"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {data.logo && (
            <div className="mt-2">
              <Image src={getAssetUrl(data.logo)} alt="Logo" width={200} height={80} className="object-contain" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.items?.map((item: any, index: number) => (
            <div key={item.id || index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex gap-2 items-center">
                <Input
                  value={item.text || ""}
                  onChange={(e) => updateNavItem(index, "text", e.target.value)}
                  placeholder="Menu Text"
                  className="flex-1"
                />
                <Input
                  value={item.link || ""}
                  onChange={(e) => updateNavItem(index, "link", e.target.value)}
                  placeholder="Link URL"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeNavItem(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={item.seo_title || ""}
                  onChange={(e) => updateNavItem(index, "seo_title", e.target.value)}
                  placeholder="SEO Title"
                />
                <Input
                  value={item.seo_description || ""}
                  onChange={(e) => updateNavItem(index, "seo_description", e.target.value)}
                  placeholder="SEO Description"
                />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={navKeywordInput}
                      onChange={(e) => setNavKeywordInput(e.target.value)}
                      placeholder="Add keyword"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && navKeywordInput.trim()) {
                          e.preventDefault();
                          const currentKeywords = item.seo_keywords ? item.seo_keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
                          if (!currentKeywords.includes(navKeywordInput.trim())) {
                            const newKeywords = [...currentKeywords, navKeywordInput.trim()];
                            updateNavItem(index, "seo_keywords", newKeywords.join(', '));
                          }
                          setNavKeywordInput("");
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (navKeywordInput.trim()) {
                          const currentKeywords = item.seo_keywords ? item.seo_keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
                          if (!currentKeywords.includes(navKeywordInput.trim())) {
                            const newKeywords = [...currentKeywords, navKeywordInput.trim()];
                            updateNavItem(index, "seo_keywords", newKeywords.join(', '));
                          }
                          setNavKeywordInput("");
                        }
                      }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(item.seo_keywords ? item.seo_keywords.split(',').map(k => k.trim()).filter(Boolean) : []).map((keyword, keywordIndex) => (
                      <Badge key={keywordIndex} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const currentKeywords = item.seo_keywords.split(',').map(k => k.trim()).filter(Boolean);
                            const newKeywords = currentKeywords.filter((_, i) => i !== keywordIndex);
                            updateNavItem(index, "seo_keywords", newKeywords.join(', '));
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addNavItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Navigation Item
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Primary Button</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={data.primaryButton?.enabled}
                onCheckedChange={(checked) => 
                  setData({ 
                    ...data, 
                    primaryButton: { ...data.primaryButton, enabled: checked }
                  })
                }
              />
              <span className="text-sm">Enable Button</span>
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={data.primaryButton?.buttonText || ""}
                onChange={(e) => 
                  setData({ 
                    ...data, 
                    primaryButton: { ...data.primaryButton, buttonText: e.target.value }
                  })
                }
              />
            </div>
            <div>
              <Label>Module to Open</Label>
              <Select
                value={data.primaryButton?.chooseModuleToOpen || ""}
                onValueChange={(value) => 
                  setData({ 
                    ...data, 
                    primaryButton: { ...data.primaryButton, chooseModuleToOpen: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modulesList.map((module: any) => (
                    <SelectItem key={module.key} value={module.key}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secondary Button</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={data.secondaryButton?.enabled}
                onCheckedChange={(checked) => 
                  setData({ 
                    ...data, 
                    secondaryButton: { ...data.secondaryButton, enabled: checked }
                  })
                }
              />
              <span className="text-sm">Enable Button</span>
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={data.secondaryButton?.buttonText || ""}
                onChange={(e) => 
                  setData({ 
                    ...data, 
                    secondaryButton: { ...data.secondaryButton, buttonText: e.target.value }
                  })
                }
              />
            </div>
            <div>
              <Label>Module to Open</Label>
              <Select
                value={data.secondaryButton?.chooseModuleToOpen || ""}
                onValueChange={(value) => 
                  setData({ 
                    ...data, 
                    secondaryButton: { ...data.secondaryButton, chooseModuleToOpen: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modulesList.map((module: any) => (
                    <SelectItem key={module.key} value={module.key}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input
              value={data.seo?.title || ""}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, title: e.target.value } })}
              placeholder="Page title for search engines"
            />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              value={data.seo?.description || ""}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, description: e.target.value } })}
              placeholder="Page description for search engines"
              rows={3}
            />
          </div>
          <div>
            <Label>SEO Keywords</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={sectionKeywordInput}
                  onChange={(e) => setSectionKeywordInput(e.target.value)}
                  placeholder="Add keyword"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && sectionKeywordInput.trim()) {
                      e.preventDefault();
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(sectionKeywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, sectionKeywordInput.trim()] 
                          } 
                        });
                      }
                      setSectionKeywordInput("");
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (sectionKeywordInput.trim()) {
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(sectionKeywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, sectionKeywordInput.trim()] 
                          } 
                        });
                      }
                      setSectionKeywordInput("");
                    }
                  }}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.seo?.keywords || []).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = (data.seo?.keywords || []).filter((_, i) => i !== index);
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: newKeywords 
                          } 
                        });
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label>SEO Slug</Label>
            <Input
              value={data.seo?.slug || ""}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, slug: e.target.value } })}
              placeholder="url-friendly-slug"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Navigation
      </Button>
    </div>
  );
}