"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeHtml } from "@/lib/sanitize";
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
  Star,
  Users,
  Sparkles,
} from "lucide-react";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));
const SchemaMarkupEditor = lazy(() => import("@/components/schema-markup-editor").then(m => ({ default: m.SchemaMarkupEditor })));

interface HeroStat {
  value: string;
  label: string;
  icon: string;
}

interface HeroItem {
  id: number;
  title: string;
  titleHighlight: string;
  description: string;
  image: string;
  imageAlt: string;
  services: string[];
  priceRange: string;
}

interface HeroData {
  page: string;
  section: string;
  data: {
    section: string;
    stats: HeroStat[];
    data: HeroItem[];
    seo?: {
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

export default function HeroPage() {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [isEnable, setIsEnable] = useState(true);
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [stats, setStats] = useState<HeroStat[]>([
    { value: "15+", label: "Years Experience", icon: "⭐" },
    { value: "50K+", label: "Happy Clients", icon: "👥" },
    { value: "100%", label: "Satisfaction", icon: "✨" }
  ]);
  const [heroData, setHeroData] = useState<HeroData>({
    page: "home",
    section: "hero",
    data: {
      section: "heroSection",
      stats: [],
      data: [],
      seo: { title: "", description: "", keywords: [], slug: "hero", schemaMarkup: "" }
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const [editingHeroItem, setEditingHeroItem] = useState<HeroItem | null>(null);
  const [editingStats, setEditingStats] = useState<HeroStat[]>([]);
  const [uploadingHero, setUploadingHero] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");

  const emptyHeroItem: HeroItem = {
    id: Date.now(),
    title: "",
    titleHighlight: "",
    description: "",
    image: "",
    imageAlt: "",
    services: [],
    priceRange: "$$ - $$$",
  };

  const loadHeroData = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/hero/`);

      if (response.ok) {
        const result = await response.json();
        setHeroData({
          page: result.page,
          section: result.section,
          data: {
            section: result.data?.section || "heroSection",
            stats: result.data?.stats || stats,
            data: result.data?.data || [],
            seo: result.data?.seo || { title: "", description: "", keywords: [], slug: "hero", schemaMarkup: "" }
          },
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        });
        setHeroItems(result.data?.data || []);
        setStats(result.data?.stats || stats);
        setIsEnable(result.data?.isEnable ?? true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading hero data",
        description: "Could not fetch data from API.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHeroData();
  }, []);

  const saveHeroData = async (updatedItems: HeroItem[], updatedStats = stats, enableState = isEnable) => {
    setIsSaving(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/hero/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "hero",
            data: {
              section: "heroSection",
              stats: updatedStats,
              data: updatedItems,
              isEnable: enableState,
              seo: heroData.data.seo
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Save failed");

      setHeroItems(updatedItems);
      setStats(updatedStats);
      setShowModal(false);
      setShowStatsModal(false);
      setEditingHeroItem(null);
      toast({ title: "Hero section updated successfully" });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save hero section",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnable = async (checked: boolean) => {
    setIsEnable(checked);
    await saveHeroData(heroItems, stats, checked);
  };

  const handleAdd = () => {
    setEditingHeroItem({ ...emptyHeroItem, id: Date.now() });
    setShowModal(true);
  };

  const handleEdit = (item: HeroItem) => {
    setEditingHeroItem({ ...item });
    setShowModal(true);
  };

  const handleEditStats = () => {
    setEditingStats([...stats]);
    setShowStatsModal(true);
  };

  const handleSave = () => {
    if (!editingHeroItem) return;

    const isNew = !heroItems.find((s) => s.id === editingHeroItem.id);
    let updatedItems;

    if (isNew) {
      updatedItems = [...heroItems, editingHeroItem];
    } else {
      updatedItems = heroItems.map((s) =>
        s.id === editingHeroItem.id ? editingHeroItem : s,
      );
    }

    saveHeroData(updatedItems);
  };

  const handleSaveStats = () => {
    saveHeroData(heroItems, editingStats);
  };

  const handleDelete = (itemId: number) => {
    const updatedItems = heroItems.filter((s) => s.id !== itemId);
    saveHeroData(updatedItems);
  };

  const handleHeroItemChange = useCallback((
    field: keyof HeroItem,
    value: string | string[],
  ) => {
    setEditingHeroItem(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleStatChange = useCallback((
    index: number,
    field: keyof HeroStat,
    value: string
  ) => {
    setEditingStats(prev => {
      const newStats = [...prev];
      newStats[index] = { ...newStats[index], [field]: value };
      return newStats;
    });
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!editingHeroItem) return;

    setUploadingHero(editingHeroItem.id.toString());
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleHeroItemChange("image", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingHero(null);
    }
  };

  const addService = useCallback(() => {
    if (!serviceInput.trim() || !editingHeroItem) return;
    const currentServices = editingHeroItem.services || [];
    if (currentServices.includes(serviceInput.trim())) return;
    
    handleHeroItemChange("services", [...currentServices, serviceInput.trim()]);
    setServiceInput("");
  }, [serviceInput, editingHeroItem, handleHeroItemChange]);

  const removeService = useCallback((index: number) => {
    if (!editingHeroItem) return;
    const currentServices = editingHeroItem.services || [];
    handleHeroItemChange("services", currentServices.filter((_, i) => i !== index));
  }, [editingHeroItem, handleHeroItemChange]);

  const saveSEO = async () => {
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
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/hero/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroData),
      });

      if (!response.ok) throw new Error("Save failed");

      toast({ title: "Hero SEO updated successfully" });
      setShowHeaderModal(false);
      loadHeroData();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save SEO settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getIconForStat = (iconName: string) => {
    switch(iconName) {
      case "⭐": return <Star className="h-4 w-4" />;
      case "👥": return <Users className="h-4 w-4" />;
      case "✨": return <Sparkles className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 p-4 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hero Section Management</h1>
              <p className="text-purple-100 text-sm">
                Manage hero section content, stats, and slides
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

      {/* Stats Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statistics</CardTitle>
              <p className="text-sm text-muted-foreground">Manage hero section stats display</p>
            </div>
            <Button onClick={handleEditStats} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Stats
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1 flex justify-center">
                    {getIconForStat(stat.icon)}
                  </div>
                  <div className="font-bold text-xl">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Edit Modal */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {editingStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Icon</Label>
                      <Select
                        value={stat.icon}
                        onValueChange={(value) => handleStatChange(index, "icon", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="⭐">Star ⭐</SelectItem>
                          <SelectItem value="👥">Users 👥</SelectItem>
                          <SelectItem value="✨">Sparkles ✨</SelectItem>
                          <SelectItem value="🏆">Trophy 🏆</SelectItem>
                          <SelectItem value="💯">100 💯</SelectItem>
                          <SelectItem value="❤️">Heart ❤️</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => handleStatChange(index, "value", e.target.value)}
                        placeholder="15+"
                      />
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => handleStatChange(index, "label", e.target.value)}
                        placeholder="Years Experience"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowStatsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStats} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Stats
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SEO Settings Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SEO Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Manage hero section SEO</p>
            </div>
            <Button onClick={() => setShowHeaderModal(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit SEO
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* SEO Edit Modal */}
      <Dialog open={showHeaderModal} onOpenChange={setShowHeaderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hero Section SEO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={heroData.data.seo?.title || ""}
                onChange={(e) => setHeroData({
                  ...heroData,
                  data: { ...heroData.data, seo: { ...heroData.data.seo!, title: e.target.value } }
                })}
                placeholder="Hero section SEO title"
              />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={heroData.data.seo?.description || ""}
                onChange={(e) => setHeroData({
                  ...heroData,
                  data: { ...heroData.data, seo: { ...heroData.data.seo!, description: e.target.value } }
                })}
                placeholder="Hero section SEO description"
                rows={2}
              />
            </div>
            <div>
              <Label>SEO Slug</Label>
              <Input
                value={heroData.data.seo?.slug || ""}
                onChange={(e) => setHeroData({
                  ...heroData,
                  data: { ...heroData.data, seo: { ...heroData.data.seo!, slug: e.target.value } }
                })}
                placeholder="hero"
              />
            </div>
            <div>
              <Label>Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keyword"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (keywordInput.trim() && !heroData.data.seo?.keywords.includes(keywordInput.trim())) {
                        setHeroData({
                          ...heroData,
                          data: { 
                            ...heroData.data, 
                            seo: { 
                              ...heroData.data.seo!, 
                              keywords: [...(heroData.data.seo?.keywords || []), keywordInput.trim()] 
                            } 
                          }
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
                    if (keywordInput.trim() && !heroData.data.seo?.keywords.includes(keywordInput.trim())) {
                      setHeroData({
                        ...heroData,
                        data: { 
                          ...heroData.data, 
                          seo: { 
                            ...heroData.data.seo!, 
                            keywords: [...(heroData.data.seo?.keywords || []), keywordInput.trim()] 
                          } 
                        }
                      });
                      setKeywordInput("");
                    }
                  }}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(heroData.data.seo?.keywords || []).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = (heroData.data.seo?.keywords || []).filter((_, i) => i !== index);
                        setHeroData({
                          ...heroData,
                          data: { 
                            ...heroData.data, 
                            seo: { ...heroData.data.seo!, keywords: newKeywords } 
                          }
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
            <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
              <SchemaMarkupEditor
                value={heroData.data.seo?.schemaMarkup || ""}
                onChange={(value) => setHeroData({
                  ...heroData,
                  data: { ...heroData.data, seo: { ...heroData.data.seo!, schemaMarkup: value } }
                })}
                onValidationChange={setIsSchemaValid}
              />
            </Suspense>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveSEO} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save SEO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Slides Grid */}
      {heroItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No hero slides found.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add First Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {heroItems.map((item, index) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-video relative">
                {item.image ? (
                  <img
                    src={getAssetUrl(item.image.replace(/&quot;|&amp;/g, (match) => match === '&quot;' ? '"' : '&').replace(/^"|"$/g, ''))}
                    alt={item.imageAlt || item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    Slide #{index + 1}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">{item.priceRange}</Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">
                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title || "") }} />
                    {item.titleHighlight && (
                      <span className="text-primary ml-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.titleHighlight) }} />
                    )}
                  </div>
                  <div
                    className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(item.description || "No description"),
                    }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {item.services?.slice(0, 2).map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {item.services?.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.services.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hero Item Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHeroItem && heroItems.find((s) => s.id === editingHeroItem.id)
                ? "Edit Hero Slide"
                : "Add New Hero Slide"}
            </DialogTitle>
          </DialogHeader>

          {editingHeroItem && (
            <div className="space-y-4">
              {/* Image */}
              <div>
                <Label>Slide Image</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Recommended: 800x600px
                </p>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editingHeroItem.image}
                    onChange={(e) =>
                      handleHeroItemChange("image", e.target.value)
                    }
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
                      disabled={uploadingHero === editingHeroItem.id.toString()}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingHero === editingHeroItem.id.toString()}
                    >
                      {uploadingHero === editingHeroItem.id.toString() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingHeroItem.image && (
                  <img
                    src={getAssetUrl(editingHeroItem.image.replace(/&quot;|&amp;/g, (match) => match === '&quot;' ? '"' : '&').replace(/^"|"$/g, ''))}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Basic Info */}
              <div className="grid gap-4">
                <div>
                  <Label>Title</Label>
                  <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                    <RichTextEditor
                      value={editingHeroItem.title}
                      onChange={(value) =>
                        handleHeroItemChange("title", value)
                      }
                      placeholder="Where Beauty Meets"
                    />
                  </Suspense>
                </div>
                <div>
                  <Label>Title Highlight</Label>
                  <Suspense fallback={<div className="h-24 flex items-center justify-center border rounded"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                    <RichTextEditor
                      value={editingHeroItem.titleHighlight}
                      onChange={(value) =>
                        handleHeroItemChange("titleHighlight", value)
                      }
                      placeholder="Perfection"
                    />
                  </Suspense>
                </div>
              </div>

              <div>
                <Label>Image Alt Text</Label>
                <Input
                  value={editingHeroItem.imageAlt}
                  onChange={(e) =>
                    handleHeroItemChange("imageAlt", e.target.value)
                  }
                  placeholder="Describe the image for accessibility"
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <RichTextEditor
                    value={editingHeroItem.description}
                    onChange={(value) =>
                      handleHeroItemChange("description", value)
                    }
                    placeholder="Enter slide description..."
                  />
                </Suspense>
              </div>

              {/* Services */}
              <div>
                <Label>Services</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      placeholder="Add service"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addService())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addService}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editingHeroItem.services || []).map(
                      (service, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {service}
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label>Price Range</Label>
                <Input
                  value={editingHeroItem.priceRange}
                  onChange={(e) => handleHeroItemChange("priceRange", e.target.value)}
                  placeholder="Enter price range (e.g., $$ - $$$)"
                />
              </div>

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
