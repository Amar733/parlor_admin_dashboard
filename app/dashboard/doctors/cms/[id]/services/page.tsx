"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeHtml } from "@/lib/sanitize";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, X, Upload, Edit, Trash2, Briefcase, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { uploadImage, getImageUrl, generateSlug } from "@/lib/cms-utils";
import { API_BASE_URL } from "@/config/api";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  detailsDescription: string;
  primaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url: string;
  };
  secondaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url: string;
  };
  tertiaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url: string;
  };
  image: string;
  alt_text: string;
  slug: string;
  keywords: string[];
  features: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface ServicesData {
  enabled: boolean;
  subtitle: string;
  title: string;
  description: string;
  image: string;
  items: ServiceItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export default function ServicesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ServicesData>({
    enabled: true,
    subtitle: "",
    title: "",
    description: "",
    image: "",
    items: [],
    seo: {
      title: "",
      description: "",
      keywords: [],
      schemaMarkup: ""
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceItem>>({});
  const [keywordInput, setKeywordInput] = useState("");
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const [isSectionSchemaValid, setIsSectionSchemaValid] = useState(true);

  const defaultService: ServiceItem = {
    id: "",
    title: "",
    description: "",
    detailsDescription: "",
    primaryButton: { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
    secondaryButton: { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
    tertiaryButton: { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
    image: "",
    alt_text: "",
    slug: "",
    keywords: [],
    features: [],
    seo: {
      title: "",
      description: "",
      keywords: [],
      schemaMarkup: ""
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      const [servicesResponse, modulesResponse] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/services_${doctorId}`),
        fetch(`${API_BASE_URL}/api/cms/home/modules_list`)
      ]);

      if (servicesResponse.ok) {
        const result = await servicesResponse.json();
        const servicesData = result.data || {
          enabled: true,
          subtitle: "",
          title: "",
          description: "",
          image: "",
          items: []
        };
        setData({
          ...servicesData,
          seo: {
            title: servicesData.seo?.title || "",
            description: servicesData.seo?.description || "",
            keywords: servicesData.seo?.keywords || []
          },
          items: Array.isArray(servicesData.items) ? servicesData.items.map((item: any) => ({
            ...item,
            seo: {
              title: item.seo?.title || "",
              description: item.seo?.description || "",
              keywords: item.seo?.keywords || []
            }
          })) : []
        });
      }

      if (modulesResponse.ok) {
        const modulesResult = await modulesResponse.json();
        setModulesList(modulesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSaveData = async () => {
    if (!isSectionSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the section schema markup errors before saving" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/services_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (!response.ok) throw new Error("Failed to save services");

      toast({
        title: "Success",
        description: "Services updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save services: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!formData.title || !formData.description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }

    const serviceData: ServiceItem = {
      ...defaultService,
      ...formData,
      id: editingId === "new" ? `service${Date.now()}` : editingId || `service${Date.now()}`,
      slug: formData.slug || generateSlug(formData.title || ""),
      keywords: typeof formData.keywords === 'string' 
        ? (formData.keywords as string).split(',').map((k: string) => k.trim()).filter(Boolean)
        : (formData.keywords as string[]) || [],
      features: formData.features || [],
      alt_text: formData.alt_text || `${formData.title} service`,
      seo: {
        title: formData.seo?.title || "",
        description: formData.seo?.description || "",
        keywords: formData.seo?.keywords || []
      }
    };

    const updatedItems = editingId && editingId !== "new"
      ? data.items.map(item => item.id === editingId ? serviceData : item)
      : [...data.items, serviceData];

    const updatedData = { ...data, items: updatedItems };
    
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/services_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save service");

      setData(updatedData);
      setEditingId(null);
      setFormData({});

      toast({
        title: "Success",
        description: `Service ${editingId ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save service: ${error}`,
      });
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setFormData({
      ...service,
      keywords: Array.isArray(service.keywords) ? service.keywords.join(', ') : (service.keywords as string[])
    });
    setKeywordInput("");
  };

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({});
    setKeywordInput("");
  };

  const handleDelete = async (id: string) => {
    const updatedData = {
      ...data,
      items: data.items.filter(item => item.id !== id)
    };
    
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/services_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete service");

      setData(updatedData);
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete service: ${error}`,
      });
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), ""]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.map((feature, i) => i === index ? value : feature) || []
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage services for {doctorName || `Doctor ID: ${doctorId}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => setData(prev => ({ ...prev, enabled: checked }))}
            />
            <span className="text-sm">Section Enabled</span>
          </div>
          <Button onClick={handleSaveData} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Section Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle">Section Subtitle</Label>
              <Input
                id="subtitle"
                value={data.subtitle}
                onChange={(e) => setData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Our Services"
              />
            </div>
            <div>
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Professional Healthcare Services"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Section Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description about your services..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="section-image">Section Image</Label>
            <div className="flex gap-2">
              <Input
                id="section-image"
                value={data.image}
                onChange={(e) => setData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="Section image URL"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('section-image-file')?.click()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
              <input
                id="section-image-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsSaving(true);
                    try {
                      const imageUrl = await uploadImage(file, "services", authFetch);
                      setData(prev => ({ ...prev, image: imageUrl }));
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to upload image",
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
              />
            </div>
            {data.image && (
              <img src={getImageUrl(data.image)} alt="Section" className="mt-2 h-20 w-32 object-cover rounded" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Service Items</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId === "new" ? "Add New Service" : "Edit Service"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-title">Service Title *</Label>
                  <Input
                    id="service-title"
                    value={formData.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        title,
                        slug: title ? title.toLowerCase().replace(/\s+/g, '-') : "",
                        seo: {
                          title,
                          description: prev.seo?.description || "",
                          keywords: prev.seo?.keywords || []
                        }
                      }));
                    }}
                    placeholder="e.g., Acne Treatment"
                  />
                </div>
                <div>
                  <Label htmlFor="service-image">Service Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="service-image"
                      value={formData.image || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Image URL"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('service-image-file')?.click()}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input
                      id="service-image-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsSaving(true);
                          try {
                            const imageUrl = await uploadImage(file, "services", authFetch);
                            setFormData(prev => ({ ...prev, image: imageUrl }));
                          } catch (error) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to upload image",
                            });
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }}
                    />
                  </div>
                  {formData.image && (
                    <img src={getImageUrl(formData.image)} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="service-description">Description *</Label>
                <Textarea
                  id="service-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the service..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="service-details-description">Details Description</Label>
                <RichTextEditor
                  value={formData.detailsDescription || ""}
                  onChange={(value) => setFormData(prev => ({ ...prev, detailsDescription: value }))}
                  placeholder="Detailed description of the service..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Primary Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.primaryButton?.enabled === true}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          primaryButton: { ...prev.primaryButton, enabled: checked } as any
                        }))}
                      />
                      <span className="text-sm">Enable Button</span>
                    </div>
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={formData.primaryButton?.buttonText || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          primaryButton: { ...prev.primaryButton, buttonText: e.target.value } as any
                        }))}
                        placeholder="Button text"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={formData.primaryButton?.chooseModuleToOpen || ""}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          primaryButton: { ...prev.primaryButton, chooseModuleToOpen: value } as any
                        }))}
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
                    {formData.primaryButton?.chooseModuleToOpen === "external_url" && (
                      <div>
                        <Label>URL (Leave empty for same service details)</Label>
                        <Input
                          value={formData.primaryButton?.url || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            primaryButton: { ...prev.primaryButton, url: e.target.value } as any
                          }))}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Secondary Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.secondaryButton?.enabled === true}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          secondaryButton: { ...prev.secondaryButton, enabled: checked } as any
                        }))}
                      />
                      <span className="text-sm">Enable Button</span>
                    </div>
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={formData.secondaryButton?.buttonText || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          secondaryButton: { ...prev.secondaryButton, buttonText: e.target.value } as any
                        }))}
                        placeholder="Button text"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={formData.secondaryButton?.chooseModuleToOpen || ""}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          secondaryButton: { ...prev.secondaryButton, chooseModuleToOpen: value } as any
                        }))}
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
                    {formData.secondaryButton?.chooseModuleToOpen === "external_url" && (
                      <div>
                        <Label>URL (Leave empty for same service details)</Label>
                        <Input
                          value={formData.secondaryButton?.url || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            secondaryButton: { ...prev.secondaryButton, url: e.target.value } as any
                          }))}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tertiary Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.tertiaryButton?.enabled === true}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          tertiaryButton: { ...prev.tertiaryButton, enabled: checked } as any
                        }))}
                      />
                      <span className="text-sm">Enable Button</span>
                    </div>
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={formData.tertiaryButton?.buttonText || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          tertiaryButton: { ...prev.tertiaryButton, buttonText: e.target.value } as any
                        }))}
                        placeholder="Button text"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={formData.tertiaryButton?.chooseModuleToOpen || ""}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          tertiaryButton: { ...prev.tertiaryButton, chooseModuleToOpen: value } as any
                        }))}
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
                    {formData.tertiaryButton?.chooseModuleToOpen === "external_url" && (
                      <div>
                        <Label>URL (Leave empty for same service details)</Label>
                        <Input
                          value={formData.tertiaryButton?.url || ""}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            tertiaryButton: { ...prev.tertiaryButton, url: e.target.value } as any
                          }))}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Service Features</Label>
                <div className="space-y-2">
                  {formData.features?.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description"
                      />
                      <Button variant="outline" size="sm" onClick={() => removeFeature(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="service-slug">Service Slug</Label>
                <Input
                  id="service-slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                />
              </div>
                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>SEO Title</Label>
                      <Input
                        value={formData.seo?.title || ""}
                        onChange={(e) => {
                          const title = e.target.value;
                          setFormData(prev => ({ 
                            ...prev, 
                            seo: { 
                              ...prev.seo, 
                              title
                            } as any 
                          }));
                        }}
                        placeholder="Page title for search engines"
                      />
                    </div>
                    <div>
                      <Label>SEO Description</Label>
                      <Textarea
                        value={formData.seo?.description || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo: { ...prev.seo, description: e.target.value } as any }))}
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
                                const currentKeywords = formData.seo?.keywords || [];
                                if (!currentKeywords.includes(keywordInput.trim())) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    seo: { 
                                      ...prev.seo, 
                                      keywords: [...currentKeywords, keywordInput.trim()] 
                                    } as any 
                                  }));
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
                                const currentKeywords = formData.seo?.keywords || [];
                                if (!currentKeywords.includes(keywordInput.trim())) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    seo: { 
                                      ...prev.seo, 
                                      keywords: [...currentKeywords, keywordInput.trim()] 
                                    } as any 
                                  }));
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
                          {(formData.seo?.keywords || []).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                              <button
                                type="button"
                                onClick={() => {
                                  const newKeywords = (formData.seo?.keywords || []).filter((_, i) => i !== index);
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    seo: { 
                                      ...prev.seo, 
                                      keywords: newKeywords 
                                    } as any 
                                  }));
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
                    
                    <SchemaMarkupEditor
                      value={formData.seo?.schemaMarkup || ""}
                      onChange={(value) => setFormData(prev => ({ ...prev, seo: { ...prev.seo, schemaMarkup: value } as any }))}
                      onValidationChange={setIsSchemaValid}
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button onClick={handleSaveService}>Save Service</Button>
                  <Button variant="outline" onClick={() => {
                    setEditingId(null);
                    setFormData({});
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4">
            {data.items.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {service.image && (
                        <img
                          src={getImageUrl(service.image)}
                          alt={service.alt_text}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        {service.slug && (
                          <p className="text-xs text-blue-600 mb-2">/{service.slug}</p>
                        )}
                        {service.detailsDescription && (
                          <div 
                            className="text-xs text-muted-foreground mb-2" 
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.detailsDescription) }}
                          />
                        )}
                        <div className="flex gap-2 mt-2">
                          {service.primaryButton?.enabled && service.primaryButton?.buttonText && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {service.primaryButton.buttonText}
                            </span>
                          )}
                          {service.secondaryButton?.enabled && service.secondaryButton?.buttonText && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {service.secondaryButton.buttonText}
                            </span>
                          )}
                          {service.tertiaryButton?.enabled && service.tertiaryButton?.buttonText && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {service.tertiaryButton.buttonText}
                            </span>
                          )}
                        </div>
                        {service.features && service.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {service.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {service.keywords && service.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {service.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this service? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(service.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {data.items.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No services added yet.</p>
                  <Button className="mt-4" onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input
              value={data.seo?.title || ""}
              onChange={(e) => {
                const title = e.target.value;
                setData(prev => ({ 
                  ...prev, 
                  seo: { 
                    ...prev.seo, 
                    title
                  } 
                }));
              }}
              placeholder="Section title for search engines"
            />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              value={data.seo?.description || ""}
              onChange={(e) => setData(prev => ({ ...prev, seo: { ...prev.seo, description: e.target.value } }))}
              placeholder="Section description for search engines"
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
                        setData(prev => ({ 
                          ...prev, 
                          seo: { 
                            ...prev.seo, 
                            keywords: [...currentKeywords, sectionKeywordInput.trim()] 
                          } 
                        }));
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
                        setData(prev => ({ 
                          ...prev, 
                          seo: { 
                            ...prev.seo, 
                            keywords: [...currentKeywords, sectionKeywordInput.trim()] 
                          } 
                        }));
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
                        setData(prev => ({ 
                          ...prev, 
                          seo: { 
                            ...prev.seo, 
                            keywords: newKeywords 
                          } 
                        }));
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
          
          <SchemaMarkupEditor
            value={data.seo?.schemaMarkup || ""}
            onChange={(value) => setData(prev => ({ ...prev, seo: { ...prev.seo, schemaMarkup: value } }))}
            onValidationChange={setIsSectionSchemaValid}
          />
        </CardContent>
      </Card>
    </div>
  );
}