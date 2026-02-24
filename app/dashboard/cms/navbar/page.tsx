"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Save, RefreshCcw, Settings, Link2, Eye, EyeOff, Image, Globe, Tag, Upload, GripVertical } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import NextImage from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NavbarItem {
  id: string;
  text: string;
  link: string;
}

interface LogoData {
  image: string;
  alt: string;
  link: string;
}

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}

interface NavbarDataContent {
  enabled: boolean;
  sticky: boolean;
  companyName: string;
  buttonText: string;
  logo: LogoData;
  items: NavbarItem[];
  seo: SEOData;
}

interface NavbarData {
  page: string;
  section: string;
  data: NavbarDataContent;
  createdAt?: string;
  updatedAt?: string;
}

const defaultSEO: SEOData = {
  title: "",
  description: "",
  keywords: [],
  slug: "home-navbar",
};

const defaultLogo: LogoData = {
  image: "",
  alt: "Company Logo",
  link: "/",
};

const defaultDataContent: NavbarDataContent = {
  enabled: true,
  sticky: false,
  companyName: "",
  buttonText: "Book A Meeting",
  logo: defaultLogo,
  items: [],
  seo: defaultSEO,
};

const defaultData: NavbarData = {
  page: "home",
  section: "navbar",
  data: defaultDataContent,
};

function SortableItem({
  item,
  index,
  handleChange,
  handleRemove
}: {
  item: NavbarItem;
  index: number;
  handleChange: (id: string, field: keyof NavbarItem, value: string) => void;
  handleRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-end border border-border/40 p-4 rounded-lg shadow-sm hover:shadow transition-all bg-white dark:bg-gray-950 ${isDragging ? "opacity-50 border-blue-500 ring-2 ring-blue-500/20" : ""
        }`}
    >
      <div className="flex items-center gap-3 md:col-span-2 mb-2 border-b pb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">Link #{index + 1}</span>
      </div>
      <div>
        <Label>Link Text</Label>
        <Input
          value={item.text}
          onChange={(e) => handleChange(item.id, "text", e.target.value)}
          placeholder={`Menu item text`}
        />
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label>URL</Label>
          <Input
            value={item.link}
            onChange={(e) => handleChange(item.id, "link", e.target.value)}
            placeholder="/about, /contact, etc."
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => handleRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NavbarPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<NavbarData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.data.items.findIndex((item) => item.id === active.id);
        const newIndex = prev.data.items.findIndex((item) => item.id === over.id);

        return {
          ...prev,
          data: {
            ...prev.data,
            items: arrayMove(prev.data.items, oldIndex, newIndex),
          },
        };
      });
    }
  };

  // -----------------------------------------------
  // Load Navbar Data
  // -----------------------------------------------
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/navbar/`);
      if (response.ok) {
        const res = await response.json();
        setData({
          page: res.page,
          section: res.section,
          data: {
            enabled: res.data?.enabled ?? true,
            sticky: res.data?.sticky ?? false,
            companyName: res.data?.companyName || "",
            buttonText: res.data?.buttonText || "Book A Meeting",
            logo: res.data?.logo || defaultLogo,
            items: res.data?.items || [],
            seo: res.data?.seo || defaultSEO,
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load navbar data.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch navbar data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------
  // useEffect
  // -----------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------------------------
  // Handlers
  // -----------------------------------------------
  const handleAdd = () => {
    const newItem: NavbarItem = {
      id: Date.now().toString(),
      text: "",
      link: "",
    };
    setData({
      ...data,
      data: {
        ...data.data,
        items: [...data.data.items, newItem]
      }
    });
  };

  const handleRemove = (id: string) => {
    setData({
      ...data,
      data: {
        ...data.data,
        items: data.data.items.filter((item) => item.id !== id)
      }
    });
  };

  const handleChange = (id: string, field: keyof NavbarItem, value: string) => {
    setData({
      ...data,
      data: {
        ...data.data,
        items: data.data.items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      },
    });
  };

  const handleDataChange = (field: keyof NavbarDataContent, value: any) => {
    setData({
      ...data,
      data: {
        ...data.data,
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    const updatedData = {
      ...data,
      data: {
        ...data.data,
        enabled: checked
      }
    };
    setData(updatedData);

    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/navbar/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        toast({ title: "Navbar status updated successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update navbar status.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSEOChange = (field: keyof SEOData, value: string | string[]) => {
    setData({
      ...data,
      data: {
        ...data.data,
        seo: {
          ...data.data.seo,
          [field]: value
        }
      }
    });
  };

  const handleLogoChange = (field: keyof LogoData, value: string) => {
    setData({
      ...data,
      data: {
        ...data.data,
        logo: {
          ...data.data.logo,
          [field]: value
        }
      }
    });
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleLogoChange("image", url);
      toast({ title: "Logo uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // console.log("updating topbar with data:" , data);

    try {
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/navbar/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "Navbar & SEO saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save navbar data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
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
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Navbar CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure navigation, branding, and SEO settings
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
          {data.page}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {data.section}
        </Badge>
        {data.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(data.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Basic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Navbar Status</Label>
                <p className="text-sm text-muted-foreground">Toggle navbar visibility</p>
              </div>
              <div className="flex items-center gap-2">
                {data.data.enabled ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <Switch
                  checked={data.data.enabled}
                  onCheckedChange={handleToggleChange}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sticky Navigation</Label>
                <p className="text-sm text-muted-foreground">Keep navbar fixed on scroll</p>
              </div>
              <Switch
                checked={data.data.sticky}
                onCheckedChange={async (checked) => {
                  const updatedData = {
                    ...data,
                    data: {
                      ...data.data,
                      sticky: checked
                    }
                  };
                  setData(updatedData);
                  setIsSaving(true);
                  try {
                    const res = await authFetch(`${API_BASE_URL}/api/cms/home/navbar/`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updatedData),
                    });
                    if (res.ok) {
                      toast({ title: "Success", description: "Sticky navigation updated" });
                      loadData();
                    } else {
                      toast({ variant: "destructive", title: "Error", description: "Failed to update sticky setting" });
                    }
                  } catch {
                    toast({ variant: "destructive", title: "Error", description: "Failed to update sticky setting" });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                placeholder="SRM Arnik Skin & Healthcare Clinic"
                value={data.data.companyName}
                onChange={(e) => handleDataChange("companyName", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">CTA Button Text</Label>
              <Input
                placeholder="Book A Meeting"
                value={data.data.buttonText}
                onChange={(e) => handleDataChange("buttonText", e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              Logo Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Logo Image</Label>
              <p className="text-xs text-muted-foreground">Recommended size: 200x60 pixels</p>
              <div className="flex gap-2">
                <Input
                  placeholder="/uploads/logo.png"
                  value={data.data.logo.image || ""}
                  onChange={(e) => handleLogoChange("image", e.target.value)}
                  className="h-11 flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingLogo}
                  />
                  <Button
                    variant="outline"
                    disabled={uploadingLogo}
                    type="button"
                    className="h-11"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {data.data.logo.image && (
                <div className="mt-2">
                  <Label className="text-sm font-medium">Logo Preview</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                    <NextImage
                      src={getAssetUrl(data.data.logo.image)}
                      alt={data.data.logo.alt || "Logo Preview"}
                      width={120}
                      height={40}
                      className="h-10 w-auto object-contain"
                      onError={() => {
                        console.log('Logo failed to load:', data.data.logo.image);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Alt Text</Label>
              <Input
                placeholder="Company Logo"
                value={data.data.logo.alt}
                onChange={(e) => handleLogoChange("alt", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Logo Link</Label>
              <Input
                placeholder="/"
                value={data.data.logo.link}
                onChange={(e) => handleLogoChange("link", e.target.value)}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            SEO Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize your navbar for search engines
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">SEO Title</Label>
              <Input
                placeholder="SRM Arnik Skin & Healthcare Clinic - Advanced Dermatology"
                value={data.data.seo.title}
                onChange={(e) => handleSEOChange("title", e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {data.data.seo.title.length}/60 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">SEO Slug</Label>
              <Input
                placeholder="home-navbar"
                value={data.data.seo.slug}
                onChange={(e) => handleSEOChange("slug", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Meta Description</Label>
            <Textarea
              placeholder="Expert dermatology and aesthetic treatments at SRM Arnik Skin & Healthcare Clinic"
              value={data.data.seo.description}
              onChange={(e) => handleSEOChange("description", e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {data.data.seo.description.length}/160 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Keywords</Label>
            <Input
              placeholder="skin clinic, dermatologist, aesthetic treatments"
              value={data.data.seo.keywords.join(", ")}
              onChange={(e) => handleSEOChange("keywords", e.target.value.split(",").map(k => k.trim()).filter(k => k))}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-600" />
                Navigation Links
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your website navigation menu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {data.data.items.length} {data.data.items.length === 1 ? 'link' : 'links'}
              </Badge>
              <Button onClick={handleAdd} size="sm" style={{ backgroundColor: '#4f46e5', color: 'white' }} className="hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Add Link
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No navigation links found. Click “Add Link” to add one.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={data.data.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {data.data.items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      handleChange={handleChange}
                      handleRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {data.data.items.length > 0 && (
              <span>Ready to save {data.data.items.length} navigation links and settings</span>
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
              style={{ backgroundColor: '#4f46e5', color: 'white' }}
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
