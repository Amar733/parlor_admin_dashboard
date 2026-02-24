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
import { Loader2, Save, RefreshCcw, User, Globe, Tag, Upload, X } from "lucide-react";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface AboutHeaderData {
  page: string;
  section: string;
  data: {
    title: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      slug: string;
      schemaMarkup?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AboutIntroData {
  page: string;
  section: string;
  data: {
    title: string;
    description: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AboutDetailsData {
  page: string;
  section: string;
  data: {
    vision: string;
    overview: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface KeyPointsData {
  page: string;
  section: string;
  data: Array<{
    id: string;
    text: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface ExperienceBlockData {
  page: string;
  section: string;
  data: {
    text: string;
    image: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface HighlightsData {
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

const defaultHeaderData: AboutHeaderData = {
  page: "about",
  section: "aboutHeader",
  data: { 
    title: "About Us",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "about-us",
      schemaMarkup: "",
    },
  },
};

const defaultIntroData: AboutIntroData = {
  page: "about",
  section: "aboutIntro",
  data: { title: "", description: "" },
};

const defaultDetailsData: AboutDetailsData = {
  page: "about",
  section: "aboutDetails",
  data: { vision: "", overview: "" },
};

const defaultKeyPointsData: KeyPointsData = {
  page: "about",
  section: "keyPoints",
  data: [],
};

const defaultExperienceBlockData: ExperienceBlockData = {
  page: "about",
  section: "experienceBlock",
  data: { text: "", image: "" },
};

const defaultHighlightsData: HighlightsData = {
  page: "about",
  section: "highlights",
  data: [],
};

export default function AboutPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [headerData, setHeaderData] = useState<AboutHeaderData>(defaultHeaderData);
  const [introData, setIntroData] = useState<AboutIntroData>(defaultIntroData);
  const [detailsData, setDetailsData] = useState<AboutDetailsData>(defaultDetailsData);
  const [keyPointsData, setKeyPointsData] = useState<KeyPointsData>(defaultKeyPointsData);
  const [experienceBlockData, setExperienceBlockData] = useState<ExperienceBlockData>(defaultExperienceBlockData);
  const [highlightsData, setHighlightsData] = useState<HighlightsData>(defaultHighlightsData);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKeyPoint, setEditingKeyPoint] = useState<{ id: string; text: string } | null>(null);
  const [showKeyPointModal, setShowKeyPointModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<{ id: string; icon: string; title: string; description: string } | null>(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, introRes, detailsRes, keyPointsRes, experienceRes, highlightsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/about/aboutHeader/`),
        authFetch(`${API_BASE_URL}/api/cms/about/aboutIntro/`),
        authFetch(`${API_BASE_URL}/api/cms/about/aboutDetails/`),
        authFetch(`${API_BASE_URL}/api/cms/about/keyPoints/`),
        authFetch(`${API_BASE_URL}/api/cms/about/experienceBlock/`),
        authFetch(`${API_BASE_URL}/api/cms/about/highlights/`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setIsEnable(res.data?.isEnable ?? true);
        const loadedData = res.data || { title: "About Us" };
        setHeaderData({
          page: res.page,
          section: res.section,
          data: {
            ...loadedData,
            seo: loadedData.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "about-us",
              schemaMarkup: "",
            },
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (introRes.ok) {
        const res = await introRes.json();
        setIntroData({
          page: res.page,
          section: res.section,
          data: res.data || { title: "", description: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (detailsRes.ok) {
        const res = await detailsRes.json();
        setDetailsData({
          page: res.page,
          section: res.section,
          data: res.data || { vision: "", overview: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (keyPointsRes.ok) {
        const res = await keyPointsRes.json();
        setKeyPointsData({
          page: res.page,
          section: res.section,
          data: res.data || [],
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (experienceRes.ok) {
        const res = await experienceRes.json();
        setExperienceBlockData({
          page: res.page,
          section: res.section,
          data: res.data || { text: "", image: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (highlightsRes.ok) {
        const res = await highlightsRes.json();
        setHighlightsData({
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
        description: "Could not fetch about data.",
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

  const handleHeaderChange = (field: keyof AboutHeaderData['data'], value: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        [field]: value
      }
    });
  };

  const handleIntroChange = (field: keyof AboutIntroData['data'], value: string) => {
    setIntroData({
      ...introData,
      data: {
        ...introData.data,
        [field]: value
      }
    });
  };

  const handleDetailsChange = (field: keyof AboutDetailsData['data'], value: string) => {
    setDetailsData({
      ...detailsData,
      data: {
        ...detailsData.data,
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    setIsEnable(checked);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/about/aboutHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable: checked } }),
      });

      if (response.ok) {
        toast({ title: `Section ${checked ? 'enabled' : 'disabled'} successfully` });
      } else {
        throw new Error();
      }
    } catch {
      setIsEnable(!checked);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update section status.",
      });
    }
  };

  const handleSave = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const [headerRes, introRes, detailsRes, keyPointsRes, experienceRes, highlightsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/about/aboutHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable } }),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/aboutIntro/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(introData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/aboutDetails/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailsData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/keyPoints/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(keyPointsData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/experienceBlock/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experienceBlockData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/highlights/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(highlightsData),
        })
      ]);

      if (headerRes.ok && introRes.ok && detailsRes.ok && keyPointsRes.ok && experienceRes.ok && highlightsRes.ok) {
        toast({ title: "About section saved successfully" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save about data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKeyPoint = () => {
    setEditingKeyPoint({ id: "", text: "" });
    setShowKeyPointModal(true);
  };

  const handleEditKeyPoint = (keyPoint: { id: string; text: string }) => {
    setEditingKeyPoint(keyPoint);
    setShowKeyPointModal(true);
  };

  const handleSaveKeyPoint = () => {
    if (!editingKeyPoint?.text.trim()) return;

    if (editingKeyPoint.id) {
      setKeyPointsData(prev => ({
        ...prev,
        data: prev.data.map(kp => 
          kp.id === editingKeyPoint.id ? editingKeyPoint : kp
        )
      }));
    } else {
      const newKeyPoint = {
        id: Date.now().toString(),
        text: editingKeyPoint.text,
      };
      setKeyPointsData(prev => ({
        ...prev,
        data: [...prev.data, newKeyPoint]
      }));
    }

    setShowKeyPointModal(false);
    setEditingKeyPoint(null);
  };

  const handleDeleteKeyPoint = (id: string) => {
    setKeyPointsData(prev => ({
      ...prev,
      data: prev.data.filter(kp => kp.id !== id)
    }));
  };

  const handleExperienceChange = (field: keyof ExperienceBlockData['data'], value: string) => {
    setExperienceBlockData({
      ...experienceBlockData,
      data: {
        ...experienceBlockData.data,
        [field]: value
      }
    });
  };

  const handleAddHighlight = () => {
    setEditingHighlight({ id: "", icon: "", title: "", description: "" });
    setShowHighlightModal(true);
  };

  const handleEditHighlight = (highlight: { id: string; icon: string; title: string; description: string }) => {
    setEditingHighlight(highlight);
    setShowHighlightModal(true);
  };

  const handleSaveHighlight = () => {
    if (!editingHighlight?.title.trim()) return;

    if (editingHighlight.id) {
      setHighlightsData(prev => ({
        ...prev,
        data: prev.data.map(h => 
          h.id === editingHighlight.id ? editingHighlight : h
        )
      }));
    } else {
      const newHighlight = {
        ...editingHighlight,
        id: Date.now().toString(),
      };
      setHighlightsData(prev => ({
        ...prev,
        data: [...prev.data, newHighlight]
      }));
    }

    setShowHighlightModal(false);
    setEditingHighlight(null);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlightsData(prev => ({
      ...prev,
      data: prev.data.filter(h => h.id !== id)
    }));
  };

  const handleImageUpload = async (file: File) => {
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
      setExperienceBlockData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          image: url
        }
      }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleHighlightImageUpload = async (file: File) => {
    if (!editingHighlight) return;
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
      setEditingHighlight(prev => prev ? { ...prev, icon: url } : null);
      toast({ title: "Icon uploaded successfully" });
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
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">About CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage about page content and sections
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnable}
                onCheckedChange={handleToggleChange}
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
          About Section
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
            <User className="h-5 w-5 text-blue-600" />
            Page Header
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Page Title</Label>
            <Input
              placeholder="About Us"
              value={headerData.data.title}
              onChange={(e) => handleHeaderChange("title", e.target.value)}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Introduction Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Introduction Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Section Title</Label>
            <Input
              placeholder="Your Trusted Partner in Clinic Management Application"
              value={introData.data.title}
              onChange={(e) => handleIntroChange("title", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              placeholder="ClinicPro+ is an AI powered Integrated Clinic Management Application..."
              value={introData.data.description}
              onChange={(e) => handleIntroChange("description", e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            About Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vision Statement</Label>
            <Textarea
              placeholder="Control the Central Nervous System of Your Clinic—Designed for Efficiency, Control, and Flawless Operation."
              value={detailsData.data.vision}
              onChange={(e) => handleDetailsChange("vision", e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Overview</Label>
            <Textarea
              placeholder="ClinicPro+ is the integrated, feature-rich SaaS Platform designed to Automate your entire Clinic Operation..."
              value={detailsData.data.overview}
              onChange={(e) => handleDetailsChange("overview", e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Use numbered lists and line breaks to organize content clearly
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Points Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Key Points
            </CardTitle>
            <Button onClick={handleAddKeyPoint} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Add Key Point
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keyPointsData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No key points added yet
            </div>
          ) : (
            <div className="space-y-3">
              {keyPointsData.data.map((keyPoint) => (
                <div key={keyPoint.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">{keyPoint.text}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditKeyPoint(keyPoint)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKeyPoint(keyPoint.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Block Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Experience Block
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Text</Label>
            <Input
              placeholder="Experienced Medical Professionals"
              value={experienceBlockData.data.text}
              onChange={(e) => handleExperienceChange("text", e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image</Label>
            <p className="text-xs text-gray-500 mb-2">Required: 500x600px</p>
            <div className="flex gap-2">
              <Input
                placeholder="/uploads/image.jpg"
                value={experienceBlockData.data.image}
                onChange={(e) => handleExperienceChange("image", e.target.value)}
                className="h-11 flex-1"
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
                  className="h-11"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {experienceBlockData.data.image && (
              <div className="mt-2">
                <Image
                  src={getAssetUrl(experienceBlockData.data.image)}
                  alt="Experience Block Preview"
                  width={200}
                  height={240}
                  className="w-48 h-56 rounded-lg object-cover border"
                  onError={() => {
                    console.log('Experience block image failed to load:', experienceBlockData.data.image);
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Highlights Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Highlights
            </CardTitle>
            <Button onClick={handleAddHighlight} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Add Highlight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {highlightsData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No highlights added yet
            </div>
          ) : (
            <div className="space-y-3">
              {highlightsData.data.map((highlight) => (
                <div key={highlight.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {highlight.icon && (
                        <Image
                          src={getAssetUrl(highlight.icon)}
                          alt={highlight.title}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded object-cover border flex-shrink-0"
                          onError={() => {
                            console.log('Highlight icon failed to load:', highlight.icon);
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{highlight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{highlight.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditHighlight(highlight)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteHighlight(highlight.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            SEO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={headerData.data.seo.title}
                onChange={(e) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, seo: { ...headerData.data.seo, title: e.target.value } }
                })}
                placeholder="About Us - Company Name"
              />
            </div>
            <div>
              <Label>SEO Slug</Label>
              <Input
                value={headerData.data.seo.slug}
                onChange={(e) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, seo: { ...headerData.data.seo, slug: e.target.value } }
                })}
                placeholder="about-us"
              />
            </div>
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              value={headerData.data.seo.description}
              onChange={(e) => setHeaderData({
                ...headerData,
                data: { ...headerData.data, seo: { ...headerData.data.seo, description: e.target.value } }
              })}
              placeholder="Learn more about our company and mission"
              rows={2}
            />
          </div>
          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (keywordInput.trim() && !headerData.data.seo.keywords.includes(keywordInput.trim())) {
                      setHeaderData({
                        ...headerData,
                        data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: [...headerData.data.seo.keywords, keywordInput.trim()] } }
                      });
                      setKeywordInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (keywordInput.trim() && !headerData.data.seo.keywords.includes(keywordInput.trim())) {
                    setHeaderData({
                      ...headerData,
                      data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: [...headerData.data.seo.keywords, keywordInput.trim()] } }
                    });
                    setKeywordInput("");
                  }
                }}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {headerData.data.seo.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => {
                      const newKeywords = headerData.data.seo.keywords.filter((_, i) => i !== index);
                      setHeaderData({
                        ...headerData,
                        data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: newKeywords } }
                      });
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <SchemaMarkupEditor
            value={headerData.data.seo.schemaMarkup || ""}
            onChange={(value) => setHeaderData({
              ...headerData,
              data: { ...headerData.data, seo: { ...headerData.data.seo, schemaMarkup: value } }
            })}
            onValidationChange={setIsSchemaValid}
          />
        </CardContent>
      </Card>

      {/* Highlight Modal */}
      {showHighlightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingHighlight?.id ? "Edit Highlight" : "Add Highlight"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="highlightTitle">Title</Label>
                <Input
                  id="highlightTitle"
                  value={editingHighlight?.title || ""}
                  onChange={(e) => setEditingHighlight(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter highlight title"
                />
              </div>
              <div>
                <Label htmlFor="highlightDescription">Description</Label>
                <Textarea
                  id="highlightDescription"
                  value={editingHighlight?.description || ""}
                  onChange={(e) => setEditingHighlight(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter highlight description"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="highlightIcon">Icon</Label>
                <p className="text-xs text-gray-500 mb-2">Required: 300x300px</p>
                <div className="flex gap-2">
                  <Input
                    id="highlightIcon"
                    value={editingHighlight?.icon || ""}
                    onChange={(e) => setEditingHighlight(prev => prev ? { ...prev, icon: e.target.value } : null)}
                    placeholder="/uploads/icon.jpg"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHighlightImageUpload(file);
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
                {editingHighlight?.icon && (
                  <div className="mt-2">
                    <Image
                      src={getAssetUrl(editingHighlight.icon)}
                      alt="Icon Preview"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg object-cover border"
                      onError={() => {
                        console.log('Highlight icon failed to load:', editingHighlight.icon);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveHighlight} className="bg-blue-600 hover:bg-blue-700">
                {editingHighlight?.id ? "Update" : "Add"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowHighlightModal(false);
                  setEditingHighlight(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Key Point Modal */}
      {showKeyPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingKeyPoint?.id ? "Edit Key Point" : "Add Key Point"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyPointText">Text</Label>
                <Input
                  id="keyPointText"
                  value={editingKeyPoint?.text || ""}
                  onChange={(e) => setEditingKeyPoint(prev => prev ? { ...prev, text: e.target.value } : null)}
                  placeholder="Enter key point text"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveKeyPoint} className="bg-blue-600 hover:bg-blue-700">
                {editingKeyPoint?.id ? "Update" : "Add"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowKeyPointModal(false);
                  setEditingKeyPoint(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save about page settings
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
    </div>
  );
}