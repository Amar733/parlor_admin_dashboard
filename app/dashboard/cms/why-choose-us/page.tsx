"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, Star, Globe, Tag, Plus, Edit, Trash2, Upload } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WhyChooseUsHeaderData {
  page: string;
  section: string;
  data: {
    title: string;
    subtitle: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface WhyChooseUsData {
  page: string;
  section: string;
  data: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const defaultHeaderData: WhyChooseUsHeaderData = {
  page: "home",
  section: "whyChooseUsHeader",
  data: { title: "", subtitle: "" },
};

const defaultWhyChooseUsData: WhyChooseUsData = {
  page: "home",
  section: "whyChooseUs",
  data: [],
};

export default function WhyChooseUsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [headerData, setHeaderData] = useState<WhyChooseUsHeaderData>(defaultHeaderData);
  const [whyChooseUsData, setWhyChooseUsData] = useState<WhyChooseUsData>(defaultWhyChooseUsData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, featuresRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/whyChooseUsHeader/`),
        authFetch(`${API_BASE_URL}/api/cms/home/whyChooseUs/`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setIsEnable(res.data?.isEnable ?? true);
        setHeaderData({
          page: res.page,
          section: res.section,
          data: res.data || { title: "", subtitle: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (featuresRes.ok) {
        const res = await featuresRes.json();
        setWhyChooseUsData({
          page: res.page,
          section: res.section,
          data: res.data || [],
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch why choose us data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, []);

  const handleHeaderChange = (field: keyof WhyChooseUsHeaderData['data'], value: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    setIsEnable(checked);
    setIsSaving(true);
    try {
      const headerRes = await authFetch(`${API_BASE_URL}/api/cms/home/whyChooseUsHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable: checked } }),
      });

      if (headerRes.ok) {
        toast({ title: "Section status updated successfully" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update section status.",
      });
      setIsEnable(!checked);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [headerRes, featuresRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/whyChooseUsHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable } }),
        }),
        authFetch(`${API_BASE_URL}/api/cms/home/whyChooseUs/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(whyChooseUsData),
        })
      ]);

      if (headerRes.ok && featuresRes.ok) {
        toast({ title: "Why Choose Us section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save why choose us data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = () => {
    setEditingFeature({
      id: "",
      icon: "",
      title: "",
      description: ""
    });
    setShowFeatureModal(true);
  };

  const handleEditFeature = (feature: any) => {
    setEditingFeature(feature);
    setShowFeatureModal(true);
  };

  const handleSaveFeature = () => {
    if (!stripHtml(editingFeature?.title || "").trim()) return;

    if (editingFeature.id) {
      setWhyChooseUsData(prev => ({
        ...prev,
        data: prev.data.map(f =>
          f.id === editingFeature.id ? editingFeature : f
        )
      }));
    } else {
      const newFeature = {
        ...editingFeature,
        id: Date.now().toString(),
      };
      setWhyChooseUsData(prev => ({
        ...prev,
        data: [...prev.data, newFeature]
      }));
    }

    setShowFeatureModal(false);
    setEditingFeature(null);
  };

  const handleDeleteFeature = (id: string) => {
    setWhyChooseUsData(prev => ({
      ...prev,
      data: prev.data.filter(f => f.id !== id)
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!editingFeature) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setEditingFeature((prev: any) => ({ ...prev, icon: url }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingImage(false);
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
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Why Choose Us CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage why choose us header and features
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnable}
                onCheckedChange={handleToggleChange}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">Section Enabled</span>
            </div>
            <Button variant="outline" onClick={loadData} className="bg-white dark:bg-gray-800">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {headerData.page}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Why Choose Us Section
        </Badge>
        {headerData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(headerData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Header Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Why Choose Us Header
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Title</Label>
            <RichTextEditor
              placeholder="Why ClinicPro is the Only Choice for Your Clinic"
              value={headerData.data.title}
              onChange={(value) => handleHeaderChange("title", value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subtitle</Label>
            <RichTextEditor
              placeholder="ClinicPro+ is the integrated, feature-rich SaaS platform designed to Automate your entire Clinic Operation..."
              value={headerData.data.subtitle}
              onChange={(value) => handleHeaderChange("subtitle", value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Features
            </CardTitle>
            <Button onClick={handleAddFeature} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {whyChooseUsData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No features added yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyChooseUsData.data.map((feature) => (
                <div key={feature.id} className="bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-md transition-shadow">
                  {feature.icon && feature.icon.trim() !== '' && (
                    <div className="mb-3">
                      <Image
                        src={getAssetUrl(feature.icon)}
                        alt={feature.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover border"
                        onError={() => {
                          console.log('Image failed to load:', feature.icon);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', feature.icon);
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1">Recommended: 350x350px</p>
                    </div>
                  )}
                  {!feature.icon && (
                    <div className="mb-3">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500 text-sm">
                        No Icon
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 350x350px</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div
                      className="font-medium text-gray-900 dark:text-gray-100"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(feature.title || "") }}
                    />
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(feature.description || "") }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFeature(feature)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Modal */}
      <Dialog open={showFeatureModal} onOpenChange={(open) => {
        if (!open) {
          setShowFeatureModal(false);
          setEditingFeature(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFeature?.id ? "Edit Feature" : "Add Feature"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="featureTitle">Title</Label>
              <RichTextEditor
                value={editingFeature?.title || ""}
                onChange={(value) => setEditingFeature((prev: any) => ({ ...prev, title: value }))}
                placeholder="TOTAL INTEGRATION"
              />
            </div>
            <div>
              <Label htmlFor="featureIcon">Icon</Label>
              <p className="text-xs text-gray-500 mb-2">Recommended: 350x350px</p>
              <div className="flex gap-2">
                <Input
                  id="featureIcon"
                  value={editingFeature?.icon || ""}
                  onChange={(e) => setEditingFeature((prev: any) => ({ ...prev, icon: e.target.value }))}
                  placeholder="/uploads/icon.png"
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
                    disabled={uploadingImage}
                  />
                  <Button
                    variant="outline"
                    disabled={uploadingImage}
                    type="button"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {editingFeature?.icon && (
                <div className="mt-2">
                  <Image
                    src={getAssetUrl(editingFeature.icon)}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-lg object-cover border"
                    onError={() => {
                      console.log('Preview image failed to load:', editingFeature.icon);
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="featureDescription">Description</Label>
              <RichTextEditor
                value={editingFeature?.description || ""}
                onChange={(value) => setEditingFeature((prev: any) => ({ ...prev, description: value }))}
                placeholder="The Seamless Flow of Data between your Admin, Inventory, Billing & Website Modules..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveFeature} className="bg-blue-600 hover:bg-blue-700">
              {editingFeature?.id ? "Update" : "Add"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeatureModal(false);
                setEditingFeature(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save why choose us settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
}