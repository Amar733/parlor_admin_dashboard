"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Upload, Save, X, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { generateSlug, uploadImage, getImageUrl } from "@/lib/cms-utils";
import { API_BASE_URL } from "@/config/api";

interface ExperienceItem {
  id: string;
  title: string;
  organization: string;
  duration: string;
  description: string;
  slug: string;
  keywords: string[];
  image: string;
  alt_text: string;
  chooseModuleToOpen: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

interface ExperienceData {
  enabled: boolean;
  items: ExperienceItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

export default function ExperiencePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { toast } = useToast();
  const { authFetch } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ExperienceData>({
    enabled: true,
    items: [],
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: ""
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExperienceItem>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [modulesList, setModulesList] = useState<any[]>([]);

  const defaultExperience: ExperienceItem = {
    id: "",
    title: "",
    organization: "",
    duration: "",
    description: "",
    slug: "",
    keywords: [],
    image: "",
    alt_text: "",
    chooseModuleToOpen: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: ""
    }
  };

  const fetchExperiences = useCallback(async () => {
    try {
      const [experienceResponse, modulesResponse] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/workExperience_${doctorId}`),
        fetch(`${API_BASE_URL}/api/cms/home/modules_list`)
      ]);

      if (experienceResponse.ok) {
        const result = await experienceResponse.json();
        const experienceData = result.data || { enabled: true, items: [] };
        setData({
          enabled: experienceData.enabled !== false,
          items: Array.isArray(experienceData.items) ? experienceData.items.map((item: any) => ({
            ...item,
            seo: {
              title: item.seo?.title || "",
              description: item.seo?.description || "",
              keywords: item.seo?.keywords || [],
              slug: item.seo?.slug || ""
            }
          })) : [],
          seo: {
            title: experienceData.seo?.title || "",
            description: experienceData.seo?.description || "",
            keywords: experienceData.seo?.keywords || [],
            slug: experienceData.seo?.slug || ""
          }
        });
      } else {
        setData({ enabled: true, items: [], seo: { title: "", description: "", keywords: [], slug: "" } });
      }

      if (modulesResponse.ok) {
        const modulesResult = await modulesResponse.json();
        setModulesList(modulesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching experiences:", error);
      setExperiences([]);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleSave = async () => {
    if (!formData.title || !formData.organization || !formData.duration) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = formData.image || "";
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, "experience", authFetch);
      }

      const experienceData: ExperienceItem = {
        ...defaultExperience,
        ...formData,
        id: editingId === "new" ? `work${Date.now()}` : editingId || `work${Date.now()}`,
        slug: formData.slug || generateSlug(formData.title || ""),
        keywords: typeof formData.keywords === 'string' 
          ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : formData.keywords || [],
        image: imageUrl,
        alt_text: formData.alt_text || `${formData.title} at ${formData.organization}`,
        seo: {
          title: formData.seo?.title || "",
          description: formData.seo?.description || "",
          keywords: formData.seo?.keywords || [],
          slug: formData.seo?.slug || ""
        }
      };

      const updatedItems = editingId && editingId !== "new"
        ? data.items.map(exp => exp.id === editingId ? experienceData : exp)
        : [...data.items, experienceData];

      const updatedData = { ...data, items: updatedItems };

      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/workExperience_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save experience");

      setData(updatedData);
      setEditingId(null);
      setFormData({});
      setImageFile(null);

      toast({
        title: "Success",
        description: `Experience ${editingId ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save experience: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (experience: ExperienceItem) => {
    setEditingId(experience.id);
    setFormData({
      ...experience,
      keywords: Array.isArray(experience.keywords) ? experience.keywords.join(', ') : experience.keywords
    });
    setKeywordInput("");
  };

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({});
    setKeywordInput("");
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/workExperience_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (!response.ok) throw new Error("Failed to save experience data");

      toast({
        title: "Success",
        description: "Experience section updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save experience section: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedData = {
        ...data,
        items: data.items.filter(exp => exp.id !== id)
      };
      
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/workExperience_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete experience");

      setData(updatedData);
      toast({
        title: "Success",
        description: "Experience deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete experience: ${error}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading experiences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Experience</h1>
          <p className="text-muted-foreground">
            Manage professional experience for {doctorName || `Doctor ID: ${doctorId}`}
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

      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId === "new" ? "Add New Experience" : "Edit Experience"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Position Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Consultant Dermatologist"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <Input
                  id="organization"
                  value={formData.organization || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="e.g., SRM Arnik Skin & Healthcare Clinic"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 2019 - Present"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your role and responsibilities..."
                rows={4}
              />
            </div>



            <div>
              <Label htmlFor="image">Experience Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  value={formData.image || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="Image URL"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('experience-image-file')?.click()}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="experience-image-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsSaving(true);
                      try {
                        const imageUrl = await uploadImage(file, "experience", authFetch);
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
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Experience
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingId(null);
                setFormData({});
                setImageFile(null);
              }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {data.items.map((experience) => (
          <Card key={experience.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {experience.image && (
                    <img
                      src={getImageUrl(experience.image)}
                      alt={experience.alt_text}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{experience.title}</h3>
                    <p className="text-muted-foreground">{experience.organization}</p>
                    <p className="text-sm text-muted-foreground">{experience.duration}</p>
                    {experience.description && (
                      <p className="mt-2 text-sm">{experience.description}</p>
                    )}
                    {experience.keywords && experience.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {experience.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(experience)}>
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
                        <AlertDialogTitle>Delete Experience</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this experience entry? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(experience.id)}>
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
              <p className="text-muted-foreground">No work experience added yet.</p>
              <Button className="mt-4" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Experience
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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