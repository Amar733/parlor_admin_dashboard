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
import { Loader2, Save, Plus, X, Upload, Edit, Trash2, GraduationCap, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadImage, getImageUrl, generateSlug } from "@/lib/cms-utils";
import { API_BASE_URL } from "@/config/api";

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
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

interface EducationData {
  enabled: boolean;
  items: EducationItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

export default function EducationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<EducationData>({
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
  const [formData, setFormData] = useState<Partial<EducationItem>>({});
  const [keywordInput, setKeywordInput] = useState("");
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [modulesList, setModulesList] = useState<any[]>([]);

  const defaultEducation: EducationItem = {
    id: "",
    degree: "",
    institution: "",
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

  const fetchEducations = useCallback(async () => {
    try {
      const [educationResponse, modulesResponse] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/education_${doctorId}`),
        fetch(`${API_BASE_URL}/api/cms/home/modules_list`)
      ]);

      if (educationResponse.ok) {
        const result = await educationResponse.json();
        const educationData = result.data || {};
        
        // Handle both old schema (data as array) and new schema (data as object)
        if (Array.isArray(educationData)) {
          // Old schema: data is directly an array
          setData({
            enabled: true,
            items: educationData.map((item: any) => ({
              ...item,
              seo: {
                title: item.seo?.title || "",
                description: item.seo?.description || "",
                keywords: item.seo?.keywords || [],
                slug: item.seo?.slug || ""
              }
            })),
            seo: { title: "", description: "", keywords: [], slug: "" }
          });
        } else {
          // New schema: data is an object with enabled, items, seo
          setData({
            enabled: educationData.enabled !== false,
            items: Array.isArray(educationData.items) ? educationData.items.map((item: any) => ({
              ...item,
              seo: {
                title: item.seo?.title || "",
                description: item.seo?.description || "",
                keywords: item.seo?.keywords || [],
                slug: item.seo?.slug || ""
              }
            })) : [],
            seo: {
              title: educationData.seo?.title || "",
              description: educationData.seo?.description || "",
              keywords: educationData.seo?.keywords || [],
              slug: educationData.seo?.slug || ""
            }
          });
        }
      } else {
        setData({ enabled: true, items: [], seo: { title: "", description: "", keywords: [], slug: "" } });
      }

      if (modulesResponse.ok) {
        const modulesResult = await modulesResponse.json();
        setModulesList(modulesResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching educations:", error);
      setData({ enabled: true, items: [], seo: { title: "", description: "", keywords: [], slug: "" } });
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchEducations();
  }, [fetchEducations]);

  const handleSave = async () => {
    if (!formData.degree || !formData.institution || !formData.duration) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSaving(true);
    try {
      const educationData: EducationItem = {
        ...defaultEducation,
        ...formData,
        id: editingId === "new" ? `edu${Date.now()}` : editingId || `edu${Date.now()}`,
        slug: formData.slug || generateSlug(formData.degree || ""),
        keywords: typeof formData.keywords === 'string' 
          ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : formData.keywords || [],
        alt_text: formData.alt_text || `${formData.degree} at ${formData.institution}`,
        seo: {
          title: formData.seo?.title || "",
          description: formData.seo?.description || "",
          keywords: formData.seo?.keywords || [],
          slug: formData.seo?.slug || ""
        }
      };

      const updatedItems = editingId && editingId !== "new"
        ? data.items.map(edu => edu.id === editingId ? educationData : edu)
        : [...data.items, educationData];

      const updatedData = { ...data, items: updatedItems };

      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/education_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save education");

      setData(updatedData);
      setEditingId(null);
      setFormData({});

      toast({
        title: "Success",
        description: `Education ${editingId ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save education: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (education: EducationItem) => {
    setEditingId(education.id);
    setFormData({
      ...education,
      keywords: Array.isArray(education.keywords) ? education.keywords.join(', ') : education.keywords
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
        `${API_BASE_URL}/api/cms/home/education_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (!response.ok) throw new Error("Failed to save education data");

      toast({
        title: "Success",
        description: "Education section updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save education section: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedData = {
        ...data,
        items: data.items.filter(edu => edu.id !== id)
      };
      
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/education_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete education");

      setData(updatedData);
      toast({
        title: "Success",
        description: "Education deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete education: ${error}`,
      });
    }
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
        <div>
          <h1 className="text-2xl font-bold">Education</h1>
          <p className="text-muted-foreground">
            Manage educational background for {doctorName || `Doctor ID: ${doctorId}`}
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
          Add Education
        </Button>
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId === "new" ? "Add New Education" : "Edit Education"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={formData.degree || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                  placeholder="e.g., MBBS, MD Dermatology"
                />
              </div>
              <div>
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  value={formData.institution || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                  placeholder="e.g., AIIMS New Delhi"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 2015 - 2020"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about the education..."
                rows={4}
              />
            </div>



            <div>
              <Label htmlFor="image">Education Image</Label>
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
                  onClick={() => document.getElementById('education-image-file')?.click()}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="education-image-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsSaving(true);
                      try {
                        const imageUrl = await uploadImage(file, "education", authFetch);
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
                Save Education
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingId(null);
                setFormData({});
              }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {data.items.map((education) => (
          <Card key={education.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {education.image && (
                    <img
                      src={getImageUrl(education.image)}
                      alt={education.alt_text}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{education.degree}</h3>
                    </div>
                    <p className="text-muted-foreground">{education.institution}</p>
                    <p className="text-sm text-muted-foreground">{education.duration}</p>
                    {education.description && (
                      <p className="mt-2 text-sm">{education.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(education)}>
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
                        <AlertDialogTitle>Delete Education</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this education entry? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(education.id)}>
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
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No education entries added yet.</p>
              <Button className="mt-4" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Education Entry
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