"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  Upload,
  Tag,
  X,
} from "lucide-react";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));
const SchemaMarkupEditor = lazy(() => import("@/components/schema-markup-editor").then(m => ({ default: m.SchemaMarkupEditor })));

interface ServiceItem {
  id: string;
  enabled?: boolean;
  title: string;
  short_description: string;
  description: string;
  image: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  alt_text: string;
  short_highlights: string[];
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

interface WhatWeDoData {
  page: string;
  section: string;
  data: {
    headtitle: string;
    title: string;
    subtitle: string;
    isEnable?: boolean;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      slug: string;
      schemaMarkup?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function ServicesPage() {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [isEnable, setIsEnable] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [whatWeDoData, setWhatWeDoData] = useState<WhatWeDoData>({
    page: "home",
    section: "whatWeDo",
    data: {
      headtitle: "What We Do",
      title: "",
      subtitle: "",
      isEnable: true,
      seo: { title: "", description: "", keywords: [], slug: "what-we-do", schemaMarkup: "" }
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null,
  );
  const [uploadingService, setUploadingService] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");

  const emptyService: ServiceItem = {
    id: "",
    enabled: true,
    title: "",
    short_description: "",
    description: "",
    image: "",
    slug: "",
    meta_title: "",
    meta_description: "",
    keywords: [],
    alt_text: "",
    short_highlights: [],
    primaryButton: {
      enabled: true,
      buttonText: "Book Appointment",
      chooseModuleToOpen: "appointment",
    },
    secondaryButton: {
      enabled: false,
      buttonText: "Learn More",
      chooseModuleToOpen: "services",
    },
    tertiaryButton: {
      enabled: false,
      buttonText: "Contact Us",
      chooseModuleToOpen: "contact",
    },
  };

  const loadServices = async () => {
    try {
      const [servicesRes, whatWeDoRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/services`),
        authFetch(`${API_BASE_URL}/api/cms/home/whatWeDo/`)
      ]);

      if (servicesRes.ok) {
        const result = await servicesRes.json();
        setIsEnable(result.data?.isEnable ?? true);
        const servicesData = ((result.data?.services || result.data) || []).map((service: ServiceItem) => ({
          ...service,
          enabled: service.enabled ?? true,
          short_description: service.short_description || "",
          keywords: service.keywords || [],
          short_highlights: service.short_highlights || [],
          primaryButton: service.primaryButton || {
            enabled: true,
            buttonText: "Book Appointment",
            chooseModuleToOpen: "appointment",
          },
          secondaryButton: service.secondaryButton || {
            enabled: false,
            buttonText: "Learn More",
            chooseModuleToOpen: "services",
          },
          tertiaryButton: service.tertiaryButton || {
            enabled: false,
            buttonText: "Contact Us",
            chooseModuleToOpen: "contact",
          },
        }));
        setServices(servicesData);
      }

      if (whatWeDoRes.ok) {
        const res = await whatWeDoRes.json();
        setWhatWeDoData({
          page: res.page,
          section: res.section,
          data: {
            headtitle: res.data?.headtitle || "What We Do",
            title: res.data?.title || "",
            subtitle: res.data?.subtitle || "",
            isEnable: res.data?.isEnable ?? true,
            seo: {
              title: res.data?.seo?.title || "",
              description: res.data?.seo?.description || "",
              keywords: res.data?.seo?.keywords || [],
              slug: res.data?.seo?.slug || "what-we-do",
              schemaMarkup: res.data?.seo?.schemaMarkup || ""
            }
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading services",
        description: "Could not fetch data from API.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const saveServices = async (updatedServices: ServiceItem[], enableState = isEnable) => {
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/services/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "services",
            data: { isEnable: enableState, services: updatedServices },
          }),
        },
      );

      if (!response.ok) throw new Error("Save failed");

      setServices(updatedServices);
      setShowModal(false);
      setEditingService(null);
      toast({ title: "Services updated successfully" });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save services",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnable = async (checked: boolean) => {
    setIsEnable(checked);
    await saveServices(services, checked);
  };

  const handleToggleServiceEnabled = async (serviceId: string, checked: boolean) => {
    const updatedServices = services.map((s) =>
      s.id === serviceId ? { ...s, enabled: checked } : s
    );
    setServices(updatedServices);
    await saveServices(updatedServices);
  };

  const handleAdd = () => {
    setEditingService({ ...emptyService, id: Date.now().toString() });
    setShowModal(true);
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingService({ ...service });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingService) return;

    const isNew = !services.find((s) => s.id === editingService.id);
    let updatedServices;

    if (isNew) {
      updatedServices = [...services, editingService];
    } else {
      updatedServices = services.map((s) =>
        s.id === editingService.id ? editingService : s,
      );
    }

    saveServices(updatedServices);
  };

  const handleDelete = (serviceId: string) => {
    const updatedServices = services.filter((s) => s.id !== serviceId);
    saveServices(updatedServices);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleServiceChange = useCallback((
    field: keyof ServiceItem,
    value: string | boolean | string[],
  ) => {
    setEditingService(prev => {
      if (!prev) return null;
      const updatedService = { ...prev, [field]: value };
      if (field === "title" && typeof value === "string" && value.trim()) {
        updatedService.slug = generateSlug(value);
      }
      return updatedService;
    });
  }, []);

  const handleButtonChange = useCallback((
    buttonType: "primaryButton" | "secondaryButton" | "tertiaryButton",
    field: string,
    value: string | boolean,
  ) => {
    setEditingService(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [buttonType]: {
          ...prev[buttonType]!,
          [field]: value,
        },
      };
    });
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!editingService) return;

    setUploadingService(editingService.id);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleServiceChange("image", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingService(null);
    }
  };

  const addKeyword = useCallback(() => {
    if (!keywordInput.trim()) return;
    setEditingService(prev => {
      if (!prev) return null;
      const currentKeywords = prev.keywords || [];
      if (currentKeywords.includes(keywordInput.trim())) return prev;
      return { ...prev, keywords: [...currentKeywords, keywordInput.trim()] };
    });
    setKeywordInput("");
  }, [keywordInput]);

  const removeKeyword = useCallback((index: number) => {
    setEditingService(prev => {
      if (!prev) return null;
      return { ...prev, keywords: (prev.keywords || []).filter((_, i) => i !== index) };
    });
  }, []);

  const addHighlight = useCallback(() => {
    if (!highlightInput.trim()) return;
    setEditingService(prev => {
      if (!prev) return null;
      const currentHighlights = prev.short_highlights || [];
      if (currentHighlights.includes(highlightInput.trim())) return prev;
      return { ...prev, short_highlights: [...currentHighlights, highlightInput.trim()] };
    });
    setHighlightInput("");
  }, [highlightInput]);

  const removeHighlight = useCallback((index: number) => {
    setEditingService(prev => {
      if (!prev) return null;
      return { ...prev, short_highlights: (prev.short_highlights || []).filter((_, i) => i !== index) };
    });
  }, []);

  const saveHeader = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/whatWeDo/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatWeDoData),
      });

      if (!response.ok) throw new Error("Save failed");

      toast({ title: "Service header updated successfully" });
      setShowHeaderModal(false);
      loadServices();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save header",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 p-4 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Services Management</h1>
              <p className="text-green-100 text-sm">
                Manage services page header and services
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEnable}
                  onCheckedChange={handleToggleEnable}
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleAdd}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Page Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(whatWeDoData.data.headtitle || "") }}
              />
              <div
                className="text-sm font-medium mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(whatWeDoData.data.title || "No title set") }}
              />
              {whatWeDoData.data.subtitle && (
                <div
                  className="text-sm text-muted-foreground mt-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(whatWeDoData.data.subtitle) }}
                />
              )}
            </div>
            <Button onClick={() => setShowHeaderModal(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Header
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Header Edit Modal */}
      <Dialog open={showHeaderModal} onOpenChange={setShowHeaderModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service Page Header (What We Do)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Head Title</Label>
              <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                <RichTextEditor
                  value={whatWeDoData.data.headtitle}
                  onChange={(value) => setWhatWeDoData({
                    ...whatWeDoData,
                    data: { ...whatWeDoData.data, headtitle: value }
                  })}
                  placeholder="What We Do"
                />
              </Suspense>
            </div>
            <div>
              <Label>Main Title</Label>
              <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                <RichTextEditor
                  value={whatWeDoData.data.title}
                  onChange={(value) => setWhatWeDoData({
                    ...whatWeDoData,
                    data: { ...whatWeDoData.data, title: value }
                  })}
                  placeholder="Services at SRM Arnik Skin & Healthcare Clinic"
                />
              </Suspense>
            </div>
            <div>
              <Label>Subtitle</Label>
              <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                <RichTextEditor
                  value={whatWeDoData.data.subtitle}
                  onChange={(value) => setWhatWeDoData({
                    ...whatWeDoData,
                    data: { ...whatWeDoData.data, subtitle: value }
                  })}
                  placeholder="Specialized Services Designed to provide with the Highest Standard of Care"
                />
              </Suspense>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div>
                  <Label>SEO Title</Label>
                  <Input
                    value={whatWeDoData.data.seo.title}
                    onChange={(e) => setWhatWeDoData({
                      ...whatWeDoData,
                      data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, title: e.target.value } }
                    })}
                    placeholder="What We Do - Healthcare Services"
                  />
                </div>
                <div>
                  <Label>SEO Description</Label>
                  <Textarea
                    value={whatWeDoData.data.seo.description}
                    onChange={(e) => setWhatWeDoData({
                      ...whatWeDoData,
                      data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, description: e.target.value } }
                    })}
                    placeholder="Discover our specialized healthcare services"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>SEO Slug</Label>
                  <Input
                    value={whatWeDoData.data.seo.slug}
                    onChange={(e) => setWhatWeDoData({
                      ...whatWeDoData,
                      data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, slug: e.target.value } }
                    })}
                    placeholder="what-we-do"
                  />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (keywordInput.trim() && !whatWeDoData.data.seo.keywords.includes(keywordInput.trim())) {
                            setWhatWeDoData({
                              ...whatWeDoData,
                              data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, keywords: [...whatWeDoData.data.seo.keywords, keywordInput.trim()] } }
                            });
                            setKeywordInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (keywordInput.trim() && !whatWeDoData.data.seo.keywords.includes(keywordInput.trim())) {
                          setWhatWeDoData({
                            ...whatWeDoData,
                            data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, keywords: [...whatWeDoData.data.seo.keywords, keywordInput.trim()] } }
                          });
                          setKeywordInput("");
                        }
                      }}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {whatWeDoData.data.seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = whatWeDoData.data.seo.keywords.filter((_, i) => i !== index);
                            setWhatWeDoData({
                              ...whatWeDoData,
                              data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, keywords: newKeywords } }
                            });
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <SchemaMarkupEditor
                    value={whatWeDoData.data.seo.schemaMarkup || ""}
                    onChange={(value) => setWhatWeDoData({
                      ...whatWeDoData,
                      data: { ...whatWeDoData.data, seo: { ...whatWeDoData.data.seo, schemaMarkup: value } }
                    })}
                    onValidationChange={setIsSchemaValid}
                  />
                </Suspense>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveHeader} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Header
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No services found.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Card key={service.id} className="overflow-hidden">
              <div className="aspect-video relative">
                {service.image ? (
                  <img
                    src={getAssetUrl(service.image)}
                    alt={service.alt_text || service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </span>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div
                    className="font-semibold text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.title || "") }}
                  />
                  <div
                    className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        service.short_description || service.description || "No description",
                      ),
                    }}
                  />
                  {service.primaryButton?.enabled && (
                    <p className="text-xs text-blue-600">
                      Primary: {service.primaryButton.buttonText}
                    </p>
                  )}
                  {service.secondaryButton?.enabled && (
                    <p className="text-xs text-green-600">
                      Secondary: {service.secondaryButton.buttonText}
                    </p>
                  )}
                  {service.tertiaryButton?.enabled && (
                    <p className="text-xs text-orange-600">
                      Tertiary: {service.tertiaryButton.buttonText}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService &&
                services.find((s) => s.id === editingService.id)
                ? "Edit Service"
                : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          {editingService && (
            <div className="space-y-4">
              {/* Enabled Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingService.enabled}
                  onCheckedChange={async (checked) => {
                    handleServiceChange("enabled", checked);
                    if (services.find((s) => s.id === editingService.id)) {
                      await handleToggleServiceEnabled(editingService.id, checked);
                    }
                  }}
                />
                <Label>Service Enabled</Label>
              </div>

              {/* Image */}
              <div>
                <Label>Service Image</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Required: 400x300px
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingService.image}
                    onChange={(e) =>
                      handleServiceChange("image", e.target.value)
                    }
                    placeholder="Image URL"
                    className="flex-1"
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
                      disabled={uploadingService === editingService.id}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingService === editingService.id}
                    >
                      {uploadingService === editingService.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingService.image && (
                  <img
                    src={getAssetUrl(editingService.image)}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Service Title</Label>
                  <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                    <RichTextEditor
                      value={editingService.title}
                      onChange={(value) =>
                        handleServiceChange("title", value)
                      }
                      placeholder="Aesthetic Services"
                    />
                  </Suspense>
                </div>
                <div>
                  <Label>Alt Text</Label>
                  <Input
                    value={editingService.alt_text}
                    onChange={(e) =>
                      handleServiceChange("alt_text", e.target.value)
                    }
                    placeholder="Image alt text for SEO"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <Label>Short Description</Label>
                <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <RichTextEditor
                    value={editingService.short_description}
                    onChange={(value) =>
                      handleServiceChange("short_description", value)
                    }
                    placeholder="Brief description for the service"
                  />
                </Suspense>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <RichTextEditor
                    value={editingService.description}
                    onChange={(value) =>
                      handleServiceChange("description", value)
                    }
                    placeholder="Enter service description..."
                  />
                </Suspense>
              </div>

              {/* Short Highlights */}
              <div>
                <Label>Short Highlights</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      placeholder="Add highlight"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addHighlight())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addHighlight}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editingService.short_highlights || []).map(
                      (highlight, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {highlight}
                          <button
                            type="button"
                            onClick={() => removeHighlight(index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Primary Button</CardTitle>
                    <Switch
                      checked={editingService.primaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange("primaryButton", "enabled", checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={editingService.primaryButton?.buttonText || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "primaryButton",
                            "buttonText",
                            e.target.value,
                          )
                        }
                        placeholder="Book Appointment"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={
                          editingService.primaryButton?.chooseModuleToOpen || ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "primaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">
                            Book Appointment
                          </SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External Url</SelectItem>
                          <SelectItem value="services">Our Services (for more info)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingService.primaryButton?.chooseModuleToOpen === "url" && (
                    <div>
                      <Label>External URL</Label>
                      <Input
                        value={editingService.primaryButton?.url || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "primaryButton",
                            "url",
                            e.target.value,
                          )
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
                    <CardTitle className="text-base">
                      Secondary Button
                    </CardTitle>
                    <Switch
                      checked={editingService.secondaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange(
                          "secondaryButton",
                          "enabled",
                          checked,
                        )
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={editingService.secondaryButton?.buttonText || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "secondaryButton",
                            "buttonText",
                            e.target.value,
                          )
                        }
                        placeholder="Learn More"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={
                          editingService.secondaryButton?.chooseModuleToOpen ||
                          ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "secondaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">
                            Book Appointment
                          </SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External Url</SelectItem>
                          <SelectItem value="services">Our Services (for more info)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingService.secondaryButton?.chooseModuleToOpen === "url" && (
                    <div>
                      <Label>External URL</Label>
                      <Input
                        value={editingService.secondaryButton?.url || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "secondaryButton",
                            "url",
                            e.target.value,
                          )
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
                    <CardTitle className="text-base">
                      Tertiary Button
                    </CardTitle>
                    <Switch
                      checked={editingService.tertiaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange(
                          "tertiaryButton",
                          "enabled",
                          checked,
                        )
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={editingService.tertiaryButton?.buttonText || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "tertiaryButton",
                            "buttonText",
                            e.target.value,
                          )
                        }
                        placeholder="Contact Us"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={
                          editingService.tertiaryButton?.chooseModuleToOpen ||
                          ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "tertiaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">
                            Book Appointment
                          </SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External Url</SelectItem>
                          <SelectItem value="services">Our Services (for more info)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingService.tertiaryButton?.chooseModuleToOpen === "url" && (
                    <div>
                      <Label>External URL</Label>
                      <Input
                        value={editingService.tertiaryButton?.url || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "tertiaryButton",
                            "url",
                            e.target.value,
                          )
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Meta Title</Label>
                      <Input
                        value={editingService.meta_title}
                        onChange={(e) =>
                          handleServiceChange("meta_title", e.target.value)
                        }
                        placeholder="SEO meta title"
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={editingService.slug}
                        onChange={(e) =>
                          handleServiceChange("slug", e.target.value)
                        }
                        placeholder="url-slug"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={editingService.meta_description}
                      onChange={(e) =>
                        handleServiceChange("meta_description", e.target.value)
                      }
                      placeholder="SEO meta description"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Add keyword"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addKeyword())
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addKeyword}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(editingService.keywords || []).map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
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
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Save Service
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
