"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, RefreshCcw, GitCompare, Plus, Trash2, Globe, Tag, Upload, Edit } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";

interface BeforeAfterItem {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  title: string;
  description: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
}

interface BeforeAfterHeaderData {
  page: string;
  section: string;
  data: HeaderData;
  createdAt?: string;
  updatedAt?: string;
}

interface BeforeAfterItemsData {
  page: string;
  section: string;
  data: BeforeAfterItem[];
  createdAt?: string;
  updatedAt?: string;
}

const defaultHeader: HeaderData = {
  title: "",
  subtitle: "",
};

export default function BeforeAfterPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [headerData, setHeaderData] = useState<BeforeAfterHeaderData>({
    page: "home",
    section: `beforeAfterHeader_${doctorId}`,
    data: defaultHeader,
  });
  
  const [itemsData, setItemsData] = useState<BeforeAfterItemsData>({
    page: "home",
    section: `before_after_${doctorId}`,
    data: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BeforeAfterItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, itemsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/beforeAfterHeader_${doctorId}`),
        authFetch(`${API_BASE_URL}/api/cms/home/before_after_${doctorId}`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setHeaderData({
          page: res.page || "home",
          section: res.section || `beforeAfterHeader_${doctorId}`,
          data: res.data || defaultHeader,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (itemsRes.ok) {
        const res = await itemsRes.json();
        setItemsData({
          page: res.page || "home",
          section: res.section || `before_after_${doctorId}`,
          data: res.data || [],
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch before & after data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      loadData();
    }
  }, [doctorId]);

  const handleHeaderChange = (field: keyof HeaderData, value: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        [field]: value
      }
    });
  };

  const generateUniqueId = () => {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}_${now.getMilliseconds()}`;
  };

  const handleAddItem = () => {
    const newItem: BeforeAfterItem = {
      id: generateUniqueId(),
      beforeImageUrl: "",
      afterImageUrl: "",
      title: "",
      description: "",
    };
    setEditingItem(newItem);
    setShowModal(true);
  };

  const handleEditItem = (item: BeforeAfterItem) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleItemChange = (field: keyof BeforeAfterItem, value: string) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: value });
  };

  const handleSaveItem = () => {
    if (!editingItem) return;

    const isNew = !itemsData.data.find((item) => item.id === editingItem.id);
    let updatedItems;

    if (isNew) {
      updatedItems = [...itemsData.data, editingItem];
    } else {
      updatedItems = itemsData.data.map((item) =>
        item.id === editingItem.id ? editingItem : item
      );
    }

    setItemsData({
      ...itemsData,
      data: updatedItems
    });
    setShowModal(false);
    setEditingItem(null);
    toast({ title: isNew ? "Case added successfully" : "Case updated successfully" });
  };

  const handleRemoveItem = (id: string) => {
    setItemsData({
      ...itemsData,
      data: itemsData.data.filter((item) => item.id !== id)
    });
  };

  const handleImageUpload = async (imageType: 'beforeImageUrl' | 'afterImageUrl', file: File) => {
    if (!editingItem) return;
    setUploadingItem(`${editingItem.id}-${imageType}`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleItemChange(imageType, url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingItem(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [headerRes, itemsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/beforeAfterHeader_${doctorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(headerData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/home/before_after_${doctorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemsData),
        })
      ]);

      if (headerRes.ok && itemsRes.ok) {
        toast({ title: "Before & After section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save before & after data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Before & After Management</h1>
        </div>
        <div className="flex items-center gap-4">

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
        {/* <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Doctor {doctorId}
        </Badge> */}
        <Badge variant="secondary" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Before & After Section
        </Badge>

      </div>

      {/* Header Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-teal-600" />
            Section Header Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Section Title</Label>
            <Input
              placeholder="Real Results, Real Confidence"
              value={headerData.data.title}
              onChange={(e) => handleHeaderChange("title", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Section Subtitle</Label>
            <Textarea
              placeholder="See the transformative results our patients have experienced."
              value={headerData.data.subtitle}
              onChange={(e) => handleHeaderChange("subtitle", e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Before & After Items */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-teal-600" />
                Before & After Cases
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showcase transformation results
              </p>
            </div>
            <Badge variant="secondary">
              {itemsData.data.length} {itemsData.data.length === 1 ? 'case' : 'cases'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {itemsData.data.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                No before & after cases configured yet
              </p>
              <Button onClick={handleAddItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Your First Case
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {itemsData.data.map((item, index) => (
                <Card key={item.id} className="overflow-hidden h-full flex flex-col">
                  <div className="aspect-square relative">
                    <div className="grid grid-cols-2 h-full">
                      <div className="relative">
                        {item.beforeImageUrl ? (
                          <img
                            src={getAssetUrl(item.beforeImageUrl)}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Before</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">Before</Badge>
                        </div>
                      </div>
                      <div className="relative">
                        {item.afterImageUrl ? (
                          <img
                            src={getAssetUrl(item.afterImageUrl)}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">After</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">After</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                      <Badge variant="outline" className="text-xs">
                        Case #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1 space-y-3">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {item.title || "Untitled Case"}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {item.description || "No description"}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Add Case Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleAddItem} className="w-full" style={{backgroundColor: '#4f46e5', color: 'white'}}>
              <Plus className="h-4 w-4 mr-2" /> Add New Case
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {itemsData.data.length > 0 && (
              <span>Ready to save {itemsData.data.length} cases and header settings</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="min-w-[160px]"
              style={{backgroundColor: '#4f46e5', color: 'white'}}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem && itemsData.data.find((item) => item.id === editingItem.id)
                ? "Edit Before & After Case"
                : "Add New Before & After Case"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-6">
              {/* Images */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Before Image</Label>
                  <p className="text-xs text-muted-foreground">Recommended size: 400x400 pixels</p>
                  <div className="flex gap-2">
                    <Input
                      value={editingItem.beforeImageUrl}
                      onChange={(e) => handleItemChange("beforeImageUrl", e.target.value)}
                      placeholder="/uploads/before-image.jpg"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload("beforeImageUrl", file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingItem === `${editingItem.id}-beforeImageUrl`}
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingItem === `${editingItem.id}-beforeImageUrl`}
                      >
                        {uploadingItem === `${editingItem.id}-beforeImageUrl` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {editingItem.beforeImageUrl && (
                    <img
                      src={getAssetUrl(editingItem.beforeImageUrl)}
                      alt="Before Preview"
                      className="w-full h-96 object-cover rounded border mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">After Image</Label>
                  <p className="text-xs text-muted-foreground">Recommended size: 400x400 pixels</p>
                  <div className="flex gap-2">
                    <Input
                      value={editingItem.afterImageUrl}
                      onChange={(e) => handleItemChange("afterImageUrl", e.target.value)}
                      placeholder="/uploads/after-image.jpg"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload("afterImageUrl", file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingItem === `${editingItem.id}-afterImageUrl`}
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingItem === `${editingItem.id}-afterImageUrl`}
                      >
                        {uploadingItem === `${editingItem.id}-afterImageUrl` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {editingItem.afterImageUrl && (
                    <img
                      src={getAssetUrl(editingItem.afterImageUrl)}
                      alt="After Preview"
                      className="w-full h-96 object-cover rounded border mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Case Title</Label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => handleItemChange("title", e.target.value)}
                  placeholder="Acne Scar Reduction Treatment"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Case Description</Label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => handleItemChange("description", e.target.value)}
                  placeholder="Describe the treatment process and results achieved..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Case
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




