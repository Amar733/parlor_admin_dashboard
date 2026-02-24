"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";

interface CarouselData {
  isEnable?: boolean;
  slides: CarouselItem[];
}

interface CarouselItem {
  id: string;
  enabled: boolean;
  image: string;
  headline_small: string;
  headline_main: string;
  short_description: string;
  description: string;
  availability_text: string;
  emergency_text: string;
  button_text: string;
  button_link: string;
  primaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url?: string;
  };
  secondaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url?: string;
  };
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

export default function CarouselPage() {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [isEnable, setIsEnable] = useState(true);
  const [slides, setSlides] = useState<CarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselItem | null>(null);
  const [uploadingSlide, setUploadingSlide] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");

  const emptySlide: CarouselItem = {
    id: "",
    enabled: true,
    image: "",
    headline_small: "",
    headline_main: "",
    short_description: "",
    description: "",
    availability_text: "",
    emergency_text: "",
    button_text: "",
    button_link: "",
    primaryButton: {
      enabled: false,
      buttonText: "Book Appointment",
      chooseModuleToOpen: "appointment",
    },
    secondaryButton: {
      enabled: false,
      buttonText: "Contact Now",
      chooseModuleToOpen: "contact",
    },
    seo: { title: "", description: "", keywords: [], slug: "" },
  };

  const loadCarousel = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/carousel`);
      if (!response.ok) throw new Error("Failed to load data");

      const result = await response.json();
      setIsEnable(result.data?.isEnable ?? true);
      const slidesData = ((result.data?.slides || result.data) || []).map((slide: CarouselItem) => ({
        ...slide,
        enabled: slide.enabled ?? true,
        short_description: slide.short_description || "",
        availability_text: slide.availability_text || "",
        emergency_text: slide.emergency_text || "",
        primaryButton: slide.primaryButton || {
          enabled: true,
          buttonText: "Book Appointment",
          chooseModuleToOpen: "appointment",
        },
        secondaryButton: slide.secondaryButton || {
          enabled: false,
          buttonText: "Contact Now",
          chooseModuleToOpen: "contact",
        },
        seo: slide.seo || {
          title: "",
          description: "",
          keywords: [],
          slug: "",
        },
      }));
      setSlides(slidesData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading carousel",
        description: "Could not fetch data from API.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCarousel();
  }, []);

  const saveSlides = async (updatedSlides: CarouselItem[], enableState?: boolean) => {
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/carousel/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "carousel",
            data: { isEnable: enableState ?? isEnable, slides: updatedSlides },
          }),
        }
      );

      if (!response.ok) throw new Error("Save failed");

      setSlides(updatedSlides);
      setShowModal(false);
      setEditingSlide(null);
      toast({ title: "Carousel updated successfully" });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save carousel",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnable = async (checked: boolean) => {
    setIsEnable(checked);
    await saveSlides(slides, checked);
  };

  const handleSlideToggle = async (slideId: string, enabled: boolean) => {
    const updatedSlides = slides.map((s) =>
      s.id === slideId ? { ...s, enabled } : s
    );
    await saveSlides(updatedSlides);
  };

  const handleAdd = () => {
    setEditingSlide({ ...emptySlide, id: Date.now().toString() });
    setShowModal(true);
  };

  const handleEdit = (slide: CarouselItem) => {
    setEditingSlide({ ...slide });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingSlide) return;

    const isNew = !slides.find((s) => s.id === editingSlide.id);
    let updatedSlides;

    if (isNew) {
      updatedSlides = [...slides, editingSlide];
    } else {
      updatedSlides = slides.map((s) =>
        s.id === editingSlide.id ? editingSlide : s
      );
    }

    saveSlides(updatedSlides);
  };

  const handleDelete = (slideId: string) => {
    const updatedSlides = slides.filter((s) => s.id !== slideId);
    saveSlides(updatedSlides);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSlideChange = (
    field: keyof CarouselItem,
    value: string | boolean
  ) => {
    if (!editingSlide) return;

    const updatedSlide = { ...editingSlide, [field]: value };

    // Auto-generate slug when headline_main changes
    if (
      field === "headline_main" &&
      typeof value === "string" &&
      value.trim()
    ) {
      const slug = generateSlug(value);
      updatedSlide.seo = { ...updatedSlide.seo!, slug };
    }

    setEditingSlide(updatedSlide);
  };

  const handleButtonChange = (
    buttonType: "primaryButton" | "secondaryButton",
    field: string,
    value: string | boolean
  ) => {
    if (!editingSlide) return;
    setEditingSlide({
      ...editingSlide,
      [buttonType]: {
        ...editingSlide[buttonType],
        [field]: value,
      },
    });
  };

  const handleSeoChange = (field: string, value: string | string[]) => {
    if (!editingSlide) return;
    setEditingSlide({
      ...editingSlide,
      seo: { ...editingSlide.seo!, [field]: value },
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!editingSlide) return;

    setUploadingSlide(editingSlide.id);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleSlideChange("image", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingSlide(null);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim() || !editingSlide) return;

    const currentKeywords = editingSlide.seo?.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      handleSeoChange("keywords", [...currentKeywords, keywordInput.trim()]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    if (!editingSlide) return;
    const newKeywords = (editingSlide.seo?.keywords || []).filter(
      (_, i) => i !== index
    );
    handleSeoChange("keywords", newKeywords);
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Carousel Management</h1>
              <p className="text-blue-100 text-sm">
                Manage homepage carousel slides
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
                <Plus className="h-4 w-4 mr-2" /> Add Slide
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Slides Grid */}
      {slides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No slides found.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add First Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="aspect-video relative">
                {slide.image ? (
                  <img
                    src={getAssetUrl(slide.image)}
                    alt={slide.headline_main}
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
                    className="text-xs text-muted-foreground line-clamp-1"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(slide.headline_small || ""),
                    }}
                  />
                  <div
                    className="font-semibold text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(slide.headline_main || ""),
                    }}
                  />
                  <div
                    className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(slide.short_description || slide.description || "No description"),
                    }}
                  />
                  {slide.primaryButton?.enabled && (
                    <p className="text-xs text-blue-600">
                      Primary: {slide.primaryButton.buttonText}
                    </p>
                  )}
                  {slide.secondaryButton?.enabled && (
                    <p className="text-xs text-green-600">
                      Secondary: {slide.secondaryButton.buttonText}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(slide)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(slide.id)}
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
              {editingSlide && slides.find((s) => s.id === editingSlide.id)
                ? "Edit Slide"
                : "Add New Slide"}
            </DialogTitle>
          </DialogHeader>

          {editingSlide && (
            <div className="space-y-4">
              {/* Enabled Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSlide.enabled}
                  onCheckedChange={(checked) => {
                    handleSlideChange("enabled", checked);
                    if (slides.find((s) => s.id === editingSlide.id)) {
                      handleSlideToggle(editingSlide.id, checked);
                    }
                  }}
                />
                <Label>Slide Enabled</Label>
              </div>

              {/* Image */}
              <div>
                <Label>Slide Image</Label>
                <p className="text-xs text-gray-500 mb-2">Required: 1920x1080px</p>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingSlide.image}
                    onChange={(e) => handleSlideChange("image", e.target.value)}
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
                      disabled={uploadingSlide === editingSlide.id}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingSlide === editingSlide.id}
                    >
                      {uploadingSlide === editingSlide.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingSlide.image && (
                  <img
                    src={getAssetUrl(editingSlide.image)}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Headlines */}
              <div className="space-y-4">
                <div>
                  <Label>Small Headline</Label>
                  <RichTextEditor
                    value={editingSlide.headline_small}
                    onChange={(value) =>
                      handleSlideChange("headline_small", value)
                    }
                    placeholder="SKIN, HAIR & NAIL CARE"
                  />
                </div>
                <div>
                  <Label>Main Headline</Label>
                  <RichTextEditor
                    value={editingSlide.headline_main}
                    onChange={(value) =>
                      handleSlideChange("headline_main", value)
                    }
                    placeholder="Trusted Skin & Healthcare"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <Label>Short Description</Label>
                <RichTextEditor
                  value={editingSlide.short_description}
                  onChange={(value) =>
                    handleSlideChange("short_description", value)
                  }
                  placeholder="Brief description for the slide"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <RichTextEditor
                  value={editingSlide.description}
                  onChange={(value) => handleSlideChange("description", value)}
                  placeholder="Enter slide description..."
                />
              </div>

              {/* Additional Text Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Availability Text</Label>
                  <Input
                    value={editingSlide.availability_text}
                    onChange={(e) =>
                      handleSlideChange("availability_text", e.target.value)
                    }
                    placeholder="Available 10:00 AM to 1:00 PM"
                  />
                </div>
                <div>
                  <Label>Emergency Text</Label>
                  <Input
                    value={editingSlide.emergency_text}
                    onChange={(e) =>
                      handleSlideChange("emergency_text", e.target.value)
                    }
                    placeholder="Available On Call"
                  />
                </div>
              </div>



              {/* Primary Button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Primary Button</CardTitle>
                    <Switch
                      checked={editingSlide.primaryButton.enabled}
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
                        value={editingSlide.primaryButton.buttonText}
                        onChange={(e) =>
                          handleButtonChange(
                            "primaryButton",
                            "buttonText",
                            e.target.value
                          )
                        }
                        placeholder="Book the Consultation"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={editingSlide.primaryButton.chooseModuleToOpen}
                        onValueChange={(value) =>
                          handleButtonChange(
                            "primaryButton",
                            "chooseModuleToOpen",
                            value
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
                  {editingSlide.primaryButton.chooseModuleToOpen === "url" && (
                    <div>
                      <Label>External URL</Label>
                      <Input
                        value={editingSlide.primaryButton.url || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "primaryButton",
                            "url",
                            e.target.value
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
                      checked={editingSlide.secondaryButton.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange(
                          "secondaryButton",
                          "enabled",
                          checked
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
                        value={editingSlide.secondaryButton.buttonText}
                        onChange={(e) =>
                          handleButtonChange(
                            "secondaryButton",
                            "buttonText",
                            e.target.value
                          )
                        }
                        placeholder="Contact Now"
                      />
                    </div>
                    <div>
                      <Label>Module to Open</Label>
                      <Select
                        value={editingSlide.secondaryButton.chooseModuleToOpen}
                        onValueChange={(value) =>
                          handleButtonChange(
                            "secondaryButton",
                            "chooseModuleToOpen",
                            value
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
                  {editingSlide.secondaryButton.chooseModuleToOpen === "url" && (
                    <div>
                      <Label>External URL</Label>
                      <Input
                        value={editingSlide.secondaryButton.url || ""}
                        onChange={(e) =>
                          handleButtonChange(
                            "secondaryButton",
                            "url",
                            e.target.value
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
                      <Label>SEO Title</Label>
                      <Input
                        value={editingSlide.seo?.title || ""}
                        onChange={(e) =>
                          handleSeoChange("title", e.target.value)
                        }
                        placeholder="SEO title"
                      />
                    </div>
                    <div>
                      <Label>SEO Slug</Label>
                      <Input
                        value={editingSlide.seo?.slug || ""}
                        onChange={(e) =>
                          handleSeoChange("slug", e.target.value)
                        }
                        placeholder="url-slug"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>SEO Description</Label>
                    <Textarea
                      value={editingSlide.seo?.description || ""}
                      onChange={(e) =>
                        handleSeoChange("description", e.target.value)
                      }
                      placeholder="SEO description"
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
                      {(editingSlide.seo?.keywords || []).map(
                        (keyword, index) => (
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
                        )
                      )}
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
                  Save Slide
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
























