"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Save, X, Award, Upload, Tag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { generateSlug, uploadImage, getImageUrl } from "@/lib/cms-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config/api";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface AwardItem {
  id: string;
  title: string;
  description: string;
  image: string;
  alt_text: string;
  slug: string;
}

interface AwardsData {
  enabled: boolean;
  items: AwardItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

export default function AwardsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get("name");
  const { toast } = useToast();
  const { authFetch } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<AwardsData>({
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
  const [formData, setFormData] = useState<Partial<AwardItem>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const defaultAward: AwardItem = {
    id: "",
    title: "",
    description: "",
    image: "",
    alt_text: "",
    slug: ""
  };

  const fetchAwards = useCallback(async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/awards_recognition_${doctorId}`
      );

      if (response.ok) {
        const result = await response.json();
        const awardsData = result.data || {};
        
        // Handle both old schema (data as array) and new schema (data as object)
        if (Array.isArray(awardsData)) {
          // Old schema: data is directly an array
          setData({
            enabled: true,
            items: awardsData,
            seo: { title: "", description: "", keywords: [], slug: "" }
          });
        } else {
          // New schema: data is an object with enabled, items, seo
          setData({
            enabled: awardsData.enabled !== false,
            items: Array.isArray(awardsData.items) ? awardsData.items : [],
            seo: {
              title: awardsData.seo?.title || "",
              description: awardsData.seo?.description || "",
              keywords: awardsData.seo?.keywords || [],
              slug: awardsData.seo?.slug || "",
              schemaMarkup: awardsData.seo?.schemaMarkup || ""
            }
          });
        }
      } else {
        setData({ enabled: true, items: [], seo: { title: "", description: "", keywords: [], slug: "" } });
      }
    } catch (error) {
      console.error("Error fetching awards:", error);
      setData({ enabled: true, items: [], seo: { title: "", description: "", keywords: [], slug: "" } });
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
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
        imageUrl = await uploadImage(imageFile, "awards", authFetch);
      }

      const awardData: AwardItem = {
        ...defaultAward,
        ...formData,
        id: editingId === "new" ? `award${Date.now()}` : editingId || `award${Date.now()}`,
        slug: formData.slug || generateSlug(formData.title || ""),
        image: imageUrl,
        alt_text: formData.alt_text || `${formData.title} award certificate`
      };

      const updatedItems = editingId && editingId !== "new"
        ? data.items.map(award => award.id === editingId ? awardData : award)
        : [...data.items, awardData];

      const updatedData = { ...data, items: updatedItems };

      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/awards_recognition_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to save award");

      setData(updatedData);
      setEditingId(null);
      setFormData({});
      setImageFile(null);

      toast({
        title: "Success",
        description: `Award ${editingId ? "updated" : "added"} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save award: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (award: AwardItem) => {
    setEditingId(award.id);
    setFormData(award);
  };

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedData = {
        ...data,
        items: data.items.filter(award => award.id !== id)
      };
      
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/awards_recognition_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: updatedData }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete award");

      setData(updatedData);
      toast({
        title: "Success",
        description: "Award deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete award: ${error}`,
      });
    }
  };

  const handleSaveData = async () => {
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/awards_recognition_${doctorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        }
      );

      if (!response.ok) throw new Error("Failed to save awards data");

      toast({
        title: "Success",
        description: "Awards section updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save awards section: ${error}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading awards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Awards & Recognition</h1>
          <p className="text-muted-foreground">
            Manage awards and recognition for {doctorName || `Doctor ID: ${doctorId}`}
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
          Add Award
        </Button>
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId === "new" ? "Add New Award" : "Edit Award"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Award Title *</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Gold Medal in Dermatology"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the award and its significance..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="image">Award Image</Label>
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
                  onClick={() => document.getElementById('award-image-file')?.click()}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="award-image-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsSaving(true);
                      try {
                        const imageUrl = await uploadImage(file, "awards", authFetch);
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

            <div>
              <Label htmlFor="alt_text">Image Alt Text</Label>
              <Input
                id="alt_text"
                value={formData.alt_text || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
                placeholder="Describe the image for accessibility"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Award
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
        {data.items.map((award) => (
          <Card key={award.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {award.image && (
                    <img
                      src={getImageUrl(award.image)}
                      alt={award.alt_text}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-lg">{award.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{award.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(award)}>
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
                        <AlertDialogTitle>Delete Award</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this award? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(award.id)}>
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
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No awards added yet.</p>
              <Button className="mt-4" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Award
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