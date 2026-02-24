"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Tag, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { RichTextEditor } from "@/components/rich-text-editor";

interface AboutData {
  isEnable?: boolean;
  image1: string;
  image2: string;
  experience_years: string;
  features: string[];
  subtitle: string;
  title: string;
  description: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup?: string;
  };
  alt_text_image1: string;
  alt_text_image2: string;
  primaryButton?: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url?: string;
  };
  secondaryButton?: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url?: string;
  };
  tertiaryButton?: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url?: string;
  };
}

export default function HomepageAboutPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<AboutData>({
    isEnable: true,
    image1: "",
    image2: "",
    experience_years: "",
    features: [],
    subtitle: "",
    title: "",
    description: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "",
      schemaMarkup: "",
    },
    alt_text_image1: "",
    alt_text_image2: "",
    primaryButton: { enabled: false, buttonText: "Book Appointment", chooseModuleToOpen: "appointment", url: "" },
    secondaryButton: { enabled: false, buttonText: "Learn More", chooseModuleToOpen: "services", url: "" },
    tertiaryButton: { enabled: false, buttonText: "Contact Us", chooseModuleToOpen: "contact", url: "" },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`);
        if (response.ok) {
          const result = await response.json();
          const loadedData = result.data || {};
          setData({
            ...data,
            ...loadedData,
            seo: loadedData.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "",
              schemaMarkup: "",
            },
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Could not fetch data from API.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authFetch, toast]);

  const handleSave = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        page: "home",
        section: "homepage_about",
        data: data,
      };

      const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Homepage About updated successfully" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AboutData, value: string | string[] | boolean) => {
    setData({ ...data, [field]: value });
  };

  const handleToggleChange = async (field: keyof AboutData, value: boolean) => {
    const updatedData = { ...data, [field]: value };
    setData(updatedData);

    setSaving(true);
    try {
      const payload = {
        page: "home",
        section: "homepage_about",
        data: updatedData,
      };

      const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Changes saved automatically" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, field: "image1" | "image2") => {
    setUploading(field);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleChange(field, url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(null);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const currentKeywords = data.seo.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      setData({ ...data, seo: { ...data.seo, keywords: [...currentKeywords, keywordInput.trim()] } });
    }
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    const newKeywords = (data.seo.keywords || []).filter((_, i) => i !== index);
    setData({ ...data, seo: { ...data.seo, keywords: newKeywords } });
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    const currentFeatures = data.features || [];
    if (!currentFeatures.includes(featureInput.trim())) {
      handleChange("features", [...currentFeatures, featureInput.trim()]);
    }
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    const newFeatures = (data.features || []).filter((_, i) => i !== index);
    handleChange("features", newFeatures);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-4 text-gray-900 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Homepage About Section</h1>
              <p className="text-gray-700 text-sm">
                Manage about section content and images
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.isEnable ?? true}
                  onCheckedChange={(checked) => handleToggleChange("isEnable", checked)}
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <RichTextEditor
              value={data.subtitle}
              onChange={(value) => handleChange("subtitle", value)}
              placeholder="ABOUT US"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <RichTextEditor
              value={data.title}
              onChange={(value) => handleChange("title", value)}
              placeholder="ClinicPro+"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <RichTextEditor
            value={data.description}
            onChange={(value) => handleChange("description", value)}
            placeholder="Brief description about your clinic..."
          />
        </div>

        {/* Experience Years */}
        <div>
          <label className="block text-sm font-medium mb-1">Experience/Tagline</label>
          <Input
            value={data.experience_years}
            onChange={(e) => handleChange("experience_years", e.target.value)}
            placeholder="Efficiently & Effortlessly Manage Clinic"
          />
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium mb-1">Features</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add feature"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(data.features || []).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Image 1</label>
            <p className="text-xs text-gray-500 mb-2">Required: 500x600px</p>
            <div className="flex gap-2 mb-2">
              <Input
                value={data.image1}
                onChange={(e) => handleChange("image1", e.target.value)}
                placeholder="Image 1 URL"
                className="flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "image1");
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading === "image1"}
                />
                <Button variant="outline" disabled={uploading === "image1"}>
                  {uploading === "image1" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Input
              value={data.alt_text_image1}
              onChange={(e) => handleChange("alt_text_image1", e.target.value)}
              placeholder="Alt text for image 1"
              className="mb-2"
            />
            {data.image1 && (
              <img
                src={getAssetUrl(data.image1)}
                alt="Image 1 Preview"
                className="w-full h-32 object-cover rounded"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image 2</label>
            <p className="text-xs text-gray-500 mb-2">Required: 500x600px</p>
            <div className="flex gap-2 mb-2">
              <Input
                value={data.image2}
                onChange={(e) => handleChange("image2", e.target.value)}
                placeholder="Image 2 URL"
                className="flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "image2");
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading === "image2"}
                />
                <Button variant="outline" disabled={uploading === "image2"}>
                  {uploading === "image2" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Input
              value={data.alt_text_image2}
              onChange={(e) => handleChange("alt_text_image2", e.target.value)}
              placeholder="Alt text for image 2"
              className="mb-2"
            />
            {data.image2 && (
              <img
                src={getAssetUrl(data.image2)}
                alt="Image 2 Preview"
                className="w-full h-32 object-cover rounded"
              />
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Button Configuration</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Primary Button */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Primary Button</CardTitle>
                  <Switch
                    checked={data.primaryButton?.enabled}
                    onCheckedChange={async (checked) => {
                      const updatedData = { ...data, primaryButton: { ...data.primaryButton!, enabled: checked } };
                      setData(updatedData);
                      setSaving(true);
                      try {
                        const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ page: "home", section: "homepage_about", data: updatedData }),
                        });
                        if (response.ok) {
                          toast({ title: "Changes saved automatically" });
                        } else {
                          toast({ variant: "destructive", title: "Save failed" });
                        }
                      } catch (err) {
                        toast({ variant: "destructive", title: "Save failed" });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={data.primaryButton?.buttonText || ""}
                    onChange={(e) =>
                      setData({ ...data, primaryButton: { ...data.primaryButton!, buttonText: e.target.value } })
                    }
                    placeholder="Book Appointment"
                  />
                </div>
                <div>
                  <Label>Module to Open</Label>
                  <Select
                    value={data.primaryButton?.chooseModuleToOpen || ""}
                    onValueChange={(value) =>
                      setData({ ...data, primaryButton: { ...data.primaryButton!, chooseModuleToOpen: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Book Appointment</SelectItem>
                      <SelectItem value="demo">Book Demo</SelectItem>
                      <SelectItem value="call">Call Us</SelectItem>
                      <SelectItem value="email">Email Us</SelectItem>
                      <SelectItem value="url">External Url</SelectItem>
                      <SelectItem value="services">Our Services (for more info)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {data.primaryButton?.chooseModuleToOpen === "url" && (
                  <div>
                    <Label>External URL</Label>
                    <Input
                      value={data.primaryButton?.url || ""}
                      onChange={(e) =>
                        setData({ ...data, primaryButton: { ...data.primaryButton!, url: e.target.value } })
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secondary Button */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Secondary Button</CardTitle>
                  <Switch
                    checked={data.secondaryButton?.enabled}
                    onCheckedChange={async (checked) => {
                      const updatedData = { ...data, secondaryButton: { ...data.secondaryButton!, enabled: checked } };
                      setData(updatedData);
                      setSaving(true);
                      try {
                        const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ page: "home", section: "homepage_about", data: updatedData }),
                        });
                        if (response.ok) {
                          toast({ title: "Changes saved automatically" });
                        } else {
                          toast({ variant: "destructive", title: "Save failed" });
                        }
                      } catch (err) {
                        toast({ variant: "destructive", title: "Save failed" });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={data.secondaryButton?.buttonText || ""}
                    onChange={(e) =>
                      setData({ ...data, secondaryButton: { ...data.secondaryButton!, buttonText: e.target.value } })
                    }
                    placeholder="Learn More"
                  />
                </div>
                <div>
                  <Label>Module to Open</Label>
                  <Select
                    value={data.secondaryButton?.chooseModuleToOpen || ""}
                    onValueChange={(value) =>
                      setData({ ...data, secondaryButton: { ...data.secondaryButton!, chooseModuleToOpen: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Book Appointment</SelectItem>
                      <SelectItem value="demo">Book Demo</SelectItem>
                      <SelectItem value="call">Call Us</SelectItem>
                      <SelectItem value="email">Email Us</SelectItem>
                      <SelectItem value="url">External Url</SelectItem>
                      <SelectItem value="services">Our Services (for more info)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {data.secondaryButton?.chooseModuleToOpen === "url" && (
                  <div>
                    <Label>External URL</Label>
                    <Input
                      value={data.secondaryButton?.url || ""}
                      onChange={(e) =>
                        setData({ ...data, secondaryButton: { ...data.secondaryButton!, url: e.target.value } })
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tertiary Button */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tertiary Button</CardTitle>
                  <Switch
                    checked={data.tertiaryButton?.enabled}
                    onCheckedChange={async (checked) => {
                      const updatedData = { ...data, tertiaryButton: { ...data.tertiaryButton!, enabled: checked } };
                      setData(updatedData);
                      setSaving(true);
                      try {
                        const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ page: "home", section: "homepage_about", data: updatedData }),
                        });
                        if (response.ok) {
                          toast({ title: "Changes saved automatically" });
                        } else {
                          toast({ variant: "destructive", title: "Save failed" });
                        }
                      } catch (err) {
                        toast({ variant: "destructive", title: "Save failed" });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={data.tertiaryButton?.buttonText || ""}
                    onChange={(e) =>
                      setData({ ...data, tertiaryButton: { ...data.tertiaryButton!, buttonText: e.target.value } })
                    }
                    placeholder="Contact Us"
                  />
                </div>
                <div>
                  <Label>Module to Open</Label>
                  <Select
                    value={data.tertiaryButton?.chooseModuleToOpen || ""}
                    onValueChange={(value) =>
                      setData({ ...data, tertiaryButton: { ...data.tertiaryButton!, chooseModuleToOpen: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Book Appointment</SelectItem>
                      <SelectItem value="demo">Book Demo</SelectItem>
                      <SelectItem value="call">Call Us</SelectItem>
                      <SelectItem value="email">Email Us</SelectItem>
                      <SelectItem value="url">External Url</SelectItem>
                      <SelectItem value="services">Our Services (for more info)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {data.tertiaryButton?.chooseModuleToOpen === "url" && (
                  <div>
                    <Label>External URL</Label>
                    <Input
                      value={data.tertiaryButton?.url || ""}
                      onChange={(e) =>
                        setData({ ...data, tertiaryButton: { ...data.tertiaryButton!, url: e.target.value } })
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEO */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">SEO Title</label>
              <Input
                value={data.seo.title}
                onChange={(e) => setData({ ...data, seo: { ...data.seo, title: e.target.value } })}
                placeholder="SEO meta title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Slug</label>
              <Input
                value={data.seo.slug}
                onChange={(e) => setData({ ...data, seo: { ...data.seo, slug: e.target.value } })}
                placeholder="url-slug"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">SEO Description</label>
            <Textarea
              value={data.seo.description}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, description: e.target.value } })}
              placeholder="SEO meta description"
              rows={2}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Keywords</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(data.seo.keywords || []).map((keyword, index) => (
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
          </div>
          <div className="mt-4">
            <SchemaMarkupEditor
              value={data.seo.schemaMarkup || ""}
              onChange={(value) => setData({ ...data, seo: { ...data.seo, schemaMarkup: value } })}
              onValidationChange={setIsSchemaValid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}