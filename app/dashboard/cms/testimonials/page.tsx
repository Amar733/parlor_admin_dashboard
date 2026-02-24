"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, Edit, Upload, X, Plus, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml } from "@/lib/sanitize";


interface Testimonial {
  id?: string;
  enabled?: boolean;
  name: string;
  title: string;
  quote: string;
  rating: number;
  avatarUrl: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

export default function TestimonialsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [header, setHeader] = useState<HeaderData>({
    title: "",
    subtitle: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "",
      schemaMarkup: ""
    }
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [uploadingTestimonial, setUploadingTestimonial] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingTestimonials, setSavingTestimonials] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const emptyTestimonial: Testimonial = {
    name: "",
    title: "",
    quote: "",
    rating: 0,
    avatarUrl: "",
    enabled: true,
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [headerRes, testimonialsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/cms/home/testimonialsHeader/`),
          authFetch(`${API_BASE_URL}/api/cms/home/testimonials/`),
        ]);

        if (headerRes && headerRes.ok) {
          const headerJson = await headerRes.json();
          setIsEnable(headerJson?.data?.isEnable ?? true);
          setHeader({
            title: headerJson?.data?.title || "",
            subtitle: headerJson?.data?.subtitle || "",
            seo: headerJson?.data?.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "",
              schemaMarkup: ""
            }
          });
        }

        if (testimonialsRes && testimonialsRes.ok) {
          const testimonialsJson = await testimonialsRes.json();
          const list = Array.isArray(testimonialsJson?.data) ? testimonialsJson.data.map((t: Testimonial) => ({
            ...t,
            enabled: t.enabled ?? true
          })) : [];
          setTestimonials(list);
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Please check the API or your internet connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authFetch, toast]);

  useEffect(() => {
    if (loading) return;
    handleSaveHeader();
  }, [isEnable]);

  const handleSaveHeader = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }
    setSavingHeader(true);
    try {
      const payload = {
        page: "home",
        section: "testimonialsHeader",
        data: { ...header, isEnable },
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/testimonialsHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Header saved", description: "Testimonials header updated successfully." });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server returned an error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please check your internet connection." });
    } finally {
      setSavingHeader(false);
    }
  };

  const saveTestimonials = async (updatedTestimonials: Testimonial[]) => {
    setSavingTestimonials(true);
    try {
      const payload = {
        page: "home",
        section: "testimonials",
        data: updatedTestimonials,
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/testimonials/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTestimonials(updatedTestimonials);
        setShowModal(false);
        setEditingTestimonial(null);
        toast({ title: "Testimonials updated successfully" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSavingTestimonials(false);
    }
  };


  const handleAdd = () => {
    setEditingTestimonial({ ...emptyTestimonial, id: Date.now().toString() });
    setShowModal(true);
  };


  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial({ ...testimonial });
    setShowModal(true);
  };



  const handleSave = () => {
    if (!editingTestimonial) return;

    const isNew = !testimonials.find((t) => t.id === editingTestimonial.id);
    let updatedTestimonials;

    if (isNew) {
      updatedTestimonials = [...testimonials, editingTestimonial];
    } else {
      updatedTestimonials = testimonials.map((t) =>
        t.id === editingTestimonial.id ? editingTestimonial : t
      );
    }

    saveTestimonials(updatedTestimonials);
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const updatedTestimonials = testimonials.filter((t) => t.id !== id);
    saveTestimonials(updatedTestimonials);
  };

  const handleTestimonialChange = (field: keyof Testimonial, value: string | boolean | number) => {
    if (!editingTestimonial) return;
    setEditingTestimonial({ ...editingTestimonial, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!editingTestimonial) return;

    setUploadingTestimonial(editingTestimonial.id || "");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleTestimonialChange("avatarUrl", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingTestimonial(null);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !header.seo.keywords.includes(keywordInput.trim())) {
      setHeader({
        ...header,
        seo: {
          ...header.seo,
          keywords: [...header.seo.keywords, keywordInput.trim()]
        }
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setHeader({
      ...header,
      seo: {
        ...header.seo,
        keywords: header.seo.keywords.filter(k => k !== keyword)
      }
    });
  };

  const renderStars = (rating: number) => {
    if (rating === 0) {
      return <span className="text-xs text-gray-400">No rating</span>;
    }
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}>
        ★
      </span>
    ));
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-700 to-rose-800 p-4 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Testimonials Management</h1>
              <p className="text-purple-100 text-sm">
                Manage testimonials header and testimonials
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEnable}
                  onCheckedChange={setIsEnable}
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleAdd}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Testimonial
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section Card */}
      <Card className="bg-white rounded-lg shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Section Header</CardTitle>
              <div
                className="text-sm font-medium mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(header.title || "No title set") }}
              />
              {header.subtitle && (
                <div
                  className="text-sm text-muted-foreground mt-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(header.subtitle) }}
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
            <DialogTitle>Edit Testimonials Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <RichTextEditor
                value={header.title}
                onChange={(value) => setHeader({ ...header, title: value })}
                placeholder="What Our Patients Say"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <RichTextEditor
                value={header.subtitle}
                onChange={(value) => setHeader({ ...header, subtitle: value })}
                placeholder="Real Stories, Real Results"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Title</Label>
                  <Input
                    value={header.seo.title}
                    onChange={(e) => setHeader({ ...header, seo: { ...header.seo, title: e.target.value } })}
                    placeholder="Testimonials - SRM Arnik Clinic"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Description</Label>
                  <Textarea
                    value={header.seo.description}
                    onChange={(e) => setHeader({ ...header, seo: { ...header.seo, description: e.target.value } })}
                    placeholder="Read what our patients say about us"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Slug</Label>
                  <Input
                    value={header.seo.slug}
                    onChange={(e) => setHeader({ ...header, seo: { ...header.seo, slug: e.target.value } })}
                    placeholder="testimonials"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="Add keyword and press Enter"
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {header.seo.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {header.seo.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <SchemaMarkupEditor
                  value={header.seo.schemaMarkup}
                  onChange={(value) => setHeader({ ...header, seo: { ...header.seo, schemaMarkup: value } })}
                  onValidationChange={setIsSchemaValid}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHeader} disabled={savingHeader}>
                {savingHeader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Header
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Testimonials Grid */}
      {testimonials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No testimonials found.</p>
          <Button onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add First Testimonial
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start gap-3 mb-3">
                {testimonial.avatarUrl ? (
                  <img
                    src={getAssetUrl(testimonial.avatarUrl)}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="flex-1">
                  <div
                    className="font-semibold text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(testimonial.name || "") }}
                  />
                  <p className="text-xs text-gray-500">{testimonial.title}</p>
                  <div className="flex gap-1 mt-1">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </div>

              <div
                className="text-xs text-gray-600 line-clamp-3 mb-3"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(testimonial.quote || "") }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(testimonial)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(testimonial.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Testimonial Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open) { setShowModal(false); setEditingTestimonial(null); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial && testimonials.find((t) => t.id === editingTestimonial.id)
                ? "Edit Testimonial"
                : "Add New Testimonial"}
            </DialogTitle>
          </DialogHeader>

          {editingTestimonial && (
            <div className="space-y-4">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium mb-1">Avatar Image</label>
                <div className="flex gap-2">
                  <Input
                    value={editingTestimonial.avatarUrl}
                    onChange={(e) => handleTestimonialChange("avatarUrl", e.target.value)}
                    placeholder="Avatar URL"
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
                      disabled={uploadingTestimonial === editingTestimonial.id}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingTestimonial === editingTestimonial.id}
                    >
                      {uploadingTestimonial === editingTestimonial.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingTestimonial.avatarUrl && (
                  <img
                    src={getAssetUrl(editingTestimonial.avatarUrl)}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover mt-2"
                  />
                )}
              </div>

              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={editingTestimonial.name}
                    onChange={(e) => handleTestimonialChange("name", e.target.value)}
                    placeholder="Ananya Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={editingTestimonial.title}
                    onChange={(e) => handleTestimonialChange("title", e.target.value)}
                    placeholder="Satisfied Patient"
                  />
                </div>
              </div>

              {/* Quote */}
              <div>
                <label className="block text-sm font-medium mb-1">Quote</label>
                <RichTextEditor
                  value={editingTestimonial.quote}
                  onChange={(value) => handleTestimonialChange("quote", value)}
                  placeholder="The care I received was exceptional..."
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => handleTestimonialChange("rating", 0)}
                    className={`px-2 py-1 text-xs rounded border ${editingTestimonial.rating === 0
                        ? "bg-gray-200 border-gray-400"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    0
                  </button>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleTestimonialChange("rating", rating)}
                      className={`text-2xl ${rating <= editingTestimonial.rating && editingTestimonial.rating > 0
                          ? "text-yellow-400"
                          : "text-gray-300"
                        }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {editingTestimonial.rating === 0 ? 'No rating' : `${editingTestimonial.rating} star${editingTestimonial.rating !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={savingTestimonials}>
                  {savingTestimonials && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Testimonial
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}