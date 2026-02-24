"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Save, MessageSquare, Upload, Tag, Star, Users, Award, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { uploadImage, getImageUrl, generateSlug } from "@/lib/cms-utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { API_BASE_URL } from "@/config/api";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface TestimonialItem {
  id: string;
  name: string;
  title: string;
  content: string;
  image: string;
}

interface StatItem {
  id: string;
  value: string;
  label: string;
}

interface TestimonialsData {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  stats: StatItem[];
  testimonials: TestimonialItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

export default function TestimonialsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { toast } = useToast();
  const { authFetch } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<TestimonialsData>({
    enabled: true,
    title: "What my Patients Says",
    subtitle: "Testimonial",
    description: "",
    stats: [],
    testimonials: [],
    seo: { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" }
  });
  
  const [testimonialDialog, setTestimonialDialog] = useState(false);
  const [statDialog, setStatDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [editingStat, setEditingStat] = useState<StatItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/testimonials_${doctorId}`);
      if (response.ok) {
        const result = await response.json();
        const apiData = result.data || {};
        setData({
          enabled: true,
          title: "What my Patients Says",
          subtitle: "Testimonial",
          description: "",
          stats: Array.isArray(apiData.stats) ? apiData.stats : [],
          testimonials: Array.isArray(apiData.testimonials) ? apiData.testimonials : [],
          seo: { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" },
          ...apiData
        });
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveData = async (updatedData: TestimonialsData) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/testimonials_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData }),
      });
      if (!response.ok) throw new Error("Failed to save");
      setData(updatedData);
      return true;
    } catch (error) {
      console.error("Save error:", error);
      return false;
    }
  };

  const handleSaveAll = async () => {
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }
    setIsSaving(true);
    const success = await saveData(data);
    toast({
      title: success ? "Success" : "Error",
      description: success ? "All changes saved successfully" : "Failed to save changes",
      variant: success ? "default" : "destructive",
    });
    setIsSaving(false);
  };

  const handleSaveTestimonial = async (testimonial: TestimonialItem) => {
    const updatedTestimonials = testimonial.id && data.testimonials.find(t => t.id === testimonial.id)
      ? data.testimonials.map(t => t.id === testimonial.id ? testimonial : t)
      : [...data.testimonials, { ...testimonial, id: testimonial.id || Date.now().toString() }];
    
    const success = await saveData({ ...data, testimonials: updatedTestimonials });
    toast({
      title: success ? "Success" : "Error",
      description: success ? "Testimonial saved successfully" : "Failed to save testimonial",
      variant: success ? "default" : "destructive",
    });
    
    if (success) {
      setTestimonialDialog(false);
      setEditingTestimonial(null);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const updatedTestimonials = data.testimonials.filter(t => t.id !== id);
    const success = await saveData({ ...data, testimonials: updatedTestimonials });
    toast({
      title: success ? "Success" : "Error",
      description: success ? "Testimonial deleted successfully" : "Failed to delete testimonial",
      variant: success ? "default" : "destructive",
    });
  };

  const handleSaveStat = async (stat: StatItem) => {
    const updatedStats = stat.id && data.stats.find(s => s.id === stat.id)
      ? data.stats.map(s => s.id === stat.id ? stat : s)
      : [...data.stats, { ...stat, id: stat.id || Date.now().toString() }];
    
    const success = await saveData({ ...data, stats: updatedStats });
    toast({
      title: success ? "Success" : "Error",
      description: success ? "Statistic saved successfully" : "Failed to save statistic",
      variant: success ? "default" : "destructive",
    });
    
    if (success) {
      setStatDialog(false);
      setEditingStat(null);
    }
  };

  const handleDeleteStat = async (id: string) => {
    const updatedStats = data.stats.filter(s => s.id !== id);
    const success = await saveData({ ...data, stats: updatedStats });
    toast({
      title: success ? "Success" : "Error",
      description: success ? "Statistic deleted successfully" : "Failed to delete statistic",
      variant: success ? "default" : "destructive",
    });
  };

  const TestimonialForm = ({ testimonial, onSave, onCancel }: {
    testimonial?: TestimonialItem;
    onSave: (testimonial: TestimonialItem) => void;
    onCancel: () => void;
  }) => {
    const [form, setForm] = useState<TestimonialItem>(testimonial || {
      id: "",
      name: "",
      title: "",
      content: "",
      image: ""
    });

    const handleSubmit = () => {
      if (!form.name.trim() || !form.content.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Name and content are required",
        });
        return;
      }
      onSave(form);
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Patient Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Ananya Sharma"
            />
          </div>
          <div>
            <Label>Title/Designation</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Satisfied Patient"
            />
          </div>
        </div>
        
        <div>
          <Label>Testimonial Content *</Label>
          <Textarea
            value={form.content}
            onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Patient's testimonial..."
            rows={4}
          />
        </div>
        
        <div>
          <Label>Patient Image</Label>
          <div className="flex gap-2">
            <Input
              value={form.image}
              onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
              placeholder="Image URL or upload below"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('testimonial-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
          </div>
          <input
            id="testimonial-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsUploading(true);
                try {
                  const imageUrl = await uploadImage(file, "testimonials", authFetch);
                  setForm(prev => ({ ...prev, image: imageUrl }));
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Upload Error",
                    description: "Failed to upload image",
                  });
                } finally {
                  setIsUploading(false);
                }
              }
            }}
          />
          {form.image && (
            <div className="mt-3">
              <img 
                src={getImageUrl(form.image)} 
                alt="Preview" 
                className="h-16 w-16 object-cover rounded-full border-2 border-gray-200"
              />
            </div>
          )}
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            Save Testimonial
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const StatForm = ({ stat, onSave, onCancel }: {
    stat?: StatItem;
    onSave: (stat: StatItem) => void;
    onCancel: () => void;
  }) => {
    const [form, setForm] = useState<StatItem>(stat || {
      id: "",
      value: "",
      label: ""
    });

    const handleSubmit = () => {
      if (!form.value.trim() || !form.label.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Value and label are required",
        });
        return;
      }
      onSave(form);
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Value *</Label>
            <Input
              value={form.value}
              onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder="e.g., 500+"
            />
          </div>
          <div>
            <Label>Label *</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Happy Patients"
            />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            Save Statistic
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading testimonials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-gray-600 mt-1">
            Manage patient testimonials for {doctorName || `Doctor ID: ${doctorId}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => setData(prev => ({ ...prev, enabled: checked }))}
            />
            <span className="text-sm font-medium">Section Enabled</span>
          </div>
          <Button onClick={handleSaveAll} disabled={isSaving} size="lg">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Section Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={data.title}
                onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What my Patients Says"
              />
            </div>
            <div>
              <Label>Section Subtitle</Label>
              <Input
                value={data.subtitle}
                onChange={(e) => setData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Testimonial"
              />
            </div>
          </div>
          <div>
            <Label>Section Description</Label>
            <Textarea
              value={data.description}
              onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description about testimonials..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Statistics
            </CardTitle>
            <Dialog open={statDialog} onOpenChange={setStatDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingStat(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Statistic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingStat ? "Edit Statistic" : "Add New Statistic"}</DialogTitle>
                </DialogHeader>
                <StatForm
                  stat={editingStat || undefined}
                  onSave={handleSaveStat}
                  onCancel={() => setStatDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.stats.map((stat) => (
              <Card key={stat.id} className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600 mb-4">{stat.label}</div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setEditingStat(stat);
                        setStatDialog(true);
                      }}
                    >
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
                          <AlertDialogTitle>Delete Statistic</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this statistic? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteStat(stat.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.stats.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No statistics added yet. Click "Add Statistic" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Testimonials ({data.testimonials.length})
            </CardTitle>
            <Dialog open={testimonialDialog} onOpenChange={setTestimonialDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTestimonial(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
                </DialogHeader>
                <TestimonialForm
                  testimonial={editingTestimonial || undefined}
                  onSave={handleSaveTestimonial}
                  onCancel={() => setTestimonialDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {data.testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {testimonial.image ? (
                        <img
                          src={getImageUrl(testimonial.image)}
                          alt={testimonial.name}
                          className="h-16 w-16 object-cover rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        {testimonial.title && (
                          <span className="text-sm text-gray-500">• {testimonial.title}</span>
                        )}
                      </div>
                      <p className="text-gray-700 italic leading-relaxed">"{testimonial.content}"</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingTestimonial(testimonial);
                          setTestimonialDialog(true);
                        }}
                      >
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
                            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this testimonial? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTestimonial(testimonial.id)}>
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
            {data.testimonials.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials yet</h3>
                  <p className="text-gray-500 mb-6">Start building trust by adding your first patient testimonial.</p>
                  <Button onClick={() => {
                    setEditingTestimonial(null);
                    setTestimonialDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Testimonial
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            SEO Settings
          </CardTitle>
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
                    title, 
                    slug: generateSlug(title)
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
          
          <SchemaMarkupEditor
            value={data.seo?.schemaMarkup || ""}
            onChange={(value) => setData(prev => ({ ...prev, seo: { ...prev.seo, schemaMarkup: value } }))}
            onValidationChange={setIsSchemaValid}
          />
        </CardContent>
      </Card>
    </div>
  );
}