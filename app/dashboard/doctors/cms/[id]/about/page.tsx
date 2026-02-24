"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, X, Upload, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchSectionData, saveSectionData } from "@/lib/cms-utils";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "@/config/api";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

export default function AboutPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<any>({
    enabled: true,
    subtitle: "",
    title: "",
    specialty: "",
    description: "",
    image1: "",
    features: [],
    primaryButton: {
      enabled: false,
      buttonText: "",
      chooseModuleToOpen: "",
      url: ""
    },
    secondaryButton: {
      enabled: false,
      buttonText: "",
      chooseModuleToOpen: "",
      url: ""
    },
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "",
      schemaMarkup: ""
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [modulesList, setModulesList] = useState([]);
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await fetchSectionData(doctorId, "homepage_about");
      if (sectionData) {
        setData({
          ...sectionData,
          primaryButton: sectionData.primaryButton || { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
          secondaryButton: sectionData.secondaryButton || { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
          seo: {
            title: sectionData.seo?.title || "",
            description: sectionData.seo?.description || "",
            keywords: sectionData.seo?.keywords || [],
            slug: sectionData.seo?.slug || "",
            schemaMarkup: sectionData.seo?.schemaMarkup || ""
          }
        });
      }
      setIsLoading(false);
    };
    const loadModules = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/cms/home/modules_list`);
        if (response.ok) {
          const result = await response.json();
          setModulesList(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };
    loadData();
    loadModules();
  }, [doctorId]);

  const handleSave = async () => {
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }
    setIsSaving(true);
    try {
      const success = await saveSectionData(authFetch, doctorId, "homepage_about", data);
      if (success) {
        toast({ title: "Success", description: "About section saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save about section" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setData({ ...data, image1: url });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const addFeature = () => {
    setData({ ...data, features: [...data.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = data.features.filter((_: any, i: number) => i !== index);
    setData({ ...data, features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...data.features];
    newFeatures[index] = value;
    setData({ ...data, features: newFeatures });
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
        <h1 className="text-2xl font-bold">About Section</h1>
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
          <CardTitle>About Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subtitle</Label>
              <Input
                value={data.subtitle || ""}
                onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                placeholder="Who I'm"
              />
            </div>
            <div>
              <Label>Specialty</Label>
              <Input
                value={data.specialty || ""}
                onChange={(e) => setData({ ...data, specialty: e.target.value })}
                placeholder="Obstetrics & Gynaecology"
              />
            </div>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={data.title || ""}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Hello my name is..."
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={data.description || ""}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              rows={4}
              placeholder="About description"
            />
          </div>

          <div>
            <Label>Profile Image</Label>
            <div className="flex gap-2">
              <Input
                value={data.image1 || ""}
                onChange={(e) => setData({ ...data, image1: e.target.value })}
                placeholder="Image URL"
                className="flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <Button variant="outline" disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {data.image1 && (
              <div className="mt-2">
                <Image src={getAssetUrl(data.image1)} alt="Profile" width={200} height={240} className="object-cover rounded" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.features?.map((feature: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                placeholder="Feature description"
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addFeature} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Button */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Primary Button</Label>
                <Switch
                  checked={data.primaryButton?.enabled}
                  onCheckedChange={(checked) => 
                    setData({ ...data, primaryButton: { ...data.primaryButton, enabled: checked } })
                  }
                />
              </div>
              
              {data.primaryButton?.enabled && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={data.primaryButton?.buttonText || ""}
                      onChange={(e) => 
                        setData({ ...data, primaryButton: { ...data.primaryButton, buttonText: e.target.value } })
                      }
                      placeholder="Enter button text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Module to Open</Label>
                    <Select
                      value={data.primaryButton?.chooseModuleToOpen || ""}
                      onValueChange={(value) => 
                        setData({ ...data, primaryButton: { ...data.primaryButton, chooseModuleToOpen: value } })
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
                  
                  {data.primaryButton?.chooseModuleToOpen === "external_url" && (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={data.primaryButton?.url || ""}
                        onChange={(e) => 
                          setData({ ...data, primaryButton: { ...data.primaryButton, url: e.target.value } })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary Button */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Secondary Button</Label>
                <Switch
                  checked={data.secondaryButton?.enabled}
                  onCheckedChange={(checked) => 
                    setData({ ...data, secondaryButton: { ...data.secondaryButton, enabled: checked } })
                  }
                />
              </div>
              
              {data.secondaryButton?.enabled && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={data.secondaryButton?.buttonText || ""}
                      onChange={(e) => 
                        setData({ ...data, secondaryButton: { ...data.secondaryButton, buttonText: e.target.value } })
                      }
                      placeholder="Enter button text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Module to Open</Label>
                    <Select
                      value={data.secondaryButton?.chooseModuleToOpen || ""}
                      onValueChange={(value) => 
                        setData({ ...data, secondaryButton: { ...data.secondaryButton, chooseModuleToOpen: value } })
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
                  
                  {data.secondaryButton?.chooseModuleToOpen === "external_url" && (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={data.secondaryButton?.url || ""}
                        onChange={(e) => 
                          setData({ ...data, secondaryButton: { ...data.secondaryButton, url: e.target.value } })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input
              value={data.seo?.title || ""}
              onChange={(e) => {
                const title = e.target.value;
                const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                setData({ 
                  ...data, 
                  seo: { 
                    ...data.seo, 
                    title, 
                    slug 
                  } 
                });
              }}
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
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keyword"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && keywordInput.trim()) {
                      e.preventDefault();
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(keywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, keywordInput.trim()] 
                          } 
                        });
                      }
                      setKeywordInput("");
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (keywordInput.trim()) {
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(keywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, keywordInput.trim()] 
                          } 
                        });
                      }
                      setKeywordInput("");
                    }
                  }}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.seo?.keywords || []).map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = (data.seo?.keywords || []).filter((_: string, i: number) => i !== index);
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
          
          <SchemaMarkupEditor
            value={data.seo?.schemaMarkup || ""}
            onChange={(value) => setData({ ...data, seo: { ...data.seo, schemaMarkup: value } })}
            onValidationChange={setIsSchemaValid}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save About Section
      </Button>
    </div>
  );
}