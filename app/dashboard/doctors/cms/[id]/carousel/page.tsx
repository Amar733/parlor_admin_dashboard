"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, X, Upload, Edit, Trash2, Image as ImageIcon, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { uploadImage, getImageUrl } from "@/lib/cms-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { API_BASE_URL } from "@/config/api";

interface SlideItem {
  id: string;
  enabled: boolean;
  headline_main: string;
  description: string;
  image: string;
  availability_text: string;
  emergency_text: string;
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
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

interface CarouselData {
  enabled: boolean;
  slides: SlideItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

export default function CarouselPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<CarouselData>({
    enabled: true,
    slides: [],
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: ""
    }
  });
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SlideItem>>({});
  const [keywordInput, setKeywordInput] = useState("");
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [deleteSlideId, setDeleteSlideId] = useState<string | null>(null);

  const defaultSlide: SlideItem = {
    id: "",
    enabled: true,
    headline_main: "",
    description: "",
    image: "",
    availability_text: "",
    emergency_text: "",
    primaryButton: { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
    secondaryButton: { enabled: false, buttonText: "", chooseModuleToOpen: "", url: "" },
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: ""
    }
  };

  const fetchCarousel = useCallback(async () => {
    try {
      const [carouselResponse, modulesResponse] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/carousel_${doctorId}`),
        fetch(`${API_BASE_URL}/api/cms/home/modules_list`)
      ]);

      if (carouselResponse.ok) {
        const result = await carouselResponse.json();
        const slides = Array.isArray(result.data?.slides) ? result.data.slides.map((slide: any) => ({
          ...slide,
          seo: {
            title: slide.seo?.title || "",
            description: slide.seo?.description || "",
            keywords: slide.seo?.keywords || [],
            slug: slide.seo?.slug || ""
          }
        })) : [];
        setData({
          enabled: result.data?.enabled !== false,
          slides,
          seo: {
            title: result.data?.seo?.title || "",
            description: result.data?.seo?.description || "",
            keywords: result.data?.seo?.keywords || [],
            slug: result.data?.seo?.slug || ""
          }
        });
      }

      if (modulesResponse.ok) {
        const modulesResult = await modulesResponse.json();
        setModulesList(modulesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching carousel:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchCarousel();
  }, [fetchCarousel]);

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/carousel_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (!response.ok) throw new Error("Failed to save carousel");

      toast({
        title: "Success",
        description: "Carousel updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save carousel: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSlide = async () => {
    if (!formData.headline_main || !formData.description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    const slideData: SlideItem = {
      ...defaultSlide,
      ...formData,
      id: editingId === "new" ? `slide${Date.now()}` : editingId || `slide${Date.now()}`,
      primaryButton: formData.primaryButton || defaultSlide.primaryButton,
      secondaryButton: formData.secondaryButton || defaultSlide.secondaryButton,
      seo: {
        title: formData.seo?.title || "",
        description: formData.seo?.description || "",
        keywords: formData.seo?.keywords || [],
        slug: formData.seo?.slug || ""
      }
    };

    const updatedSlides = editingId && editingId !== "new"
      ? data.slides.map(slide => slide.id === editingId ? slideData : slide)
      : [...data.slides, slideData];

    const updatedData = { ...data, slides: updatedSlides };
    
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/carousel_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save slide");

      setData(updatedData);
      setEditingId(null);
      setFormData({});

      toast({
        title: "Success",
        description: `Slide ${editingId ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save slide: ${error}`,
      });
    }
  };

  const handleEdit = (slide: SlideItem) => {
    setEditingId(slide.id);
    setFormData(slide);
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
      slides: data.slides.filter(slide => slide.id !== id)
    };
    
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/carousel_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete slide");

      setData(updatedData);
      setDeleteSlideId(null);
      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete slide: ${error}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading carousel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Carousel</h1>
          <p className="text-muted-foreground">
            Manage hero carousel slides for {doctorName || `Doctor ID: ${doctorId}`}
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

      {/* Slides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Carousel Slides</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId === "new" ? "Add New Slide" : "Edit Slide"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled !== false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <span className="text-sm">Slide Enabled</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headline">Main Headline *</Label>
                  <Input
                    id="headline"
                    value={formData.headline_main || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, headline_main: e.target.value }))}
                    placeholder="e.g., Expert Dermatology Care"
                  />
                </div>
                <div>
                  <Label htmlFor="slide-image">Slide Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slide-image"
                      value={formData.image || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Image URL"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('slide-image-file')?.click()}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <input
                      id="slide-image-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsSaving(true);
                          try {
                            const imageUrl = await uploadImage(file, "carousel", authFetch);
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
                    <img src={getImageUrl(formData.image)} alt="Preview" className="mt-2 h-20 w-32 object-cover rounded" />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Slide description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="availability">Availability Text</Label>
                  <Input
                    id="availability"
                    value={formData.availability_text || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability_text: e.target.value }))}
                    placeholder="e.g., Available 24/7"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency">Emergency Text</Label>
                  <Input
                    id="emergency"
                    value={formData.emergency_text || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_text: e.target.value }))}
                    placeholder="e.g., Emergency Care"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label>URL</Label>
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
                        <Label>URL</Label>
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
                        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        setFormData(prev => ({ 
                          ...prev, 
                          seo: { 
                            ...prev.seo, 
                            title, 
                            slug 
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
                  <div>
                    <Label>SEO Slug</Label>
                    <Input
                      value={formData.seo?.slug || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, seo: { ...prev.seo, slug: e.target.value } as any }))}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                </CardContent>
              </Card>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSlide}>Save Slide</Button>
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
            {data.slides.map((slide) => (
              <Card key={slide.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {slide.image && (
                        <img
                          src={getImageUrl(slide.image)}
                          alt={slide.headline_main}
                          className="h-16 w-24 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{slide.headline_main}</h3>
                          {!slide.enabled && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Disabled</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{slide.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {slide.availability_text && <span>📅 {slide.availability_text}</span>}
                          {slide.emergency_text && <span>🚨 {slide.emergency_text}</span>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {slide.primaryButton?.enabled && slide.primaryButton?.buttonText && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {slide.primaryButton.buttonText}
                            </span>
                          )}
                          {slide.secondaryButton?.enabled && slide.secondaryButton?.buttonText && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {slide.secondaryButton.buttonText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(slide)}>
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
                            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this slide? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(slide.id)}>
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

            {data.slides.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No slides added yet.</p>
                  <Button className="mt-4" onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Slide
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
                const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                setData(prev => ({ 
                  ...prev, 
                  seo: { 
                    ...prev.seo, 
                    title, 
                    slug 
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
          <div>
            <Label>SEO Slug</Label>
            <Input
              value={data.seo?.slug || ""}
              onChange={(e) => setData(prev => ({ ...prev, seo: { ...prev.seo, slug: e.target.value } }))}
              placeholder="url-friendly-slug"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}