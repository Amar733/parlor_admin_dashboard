"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, RefreshCcw, FileText, Globe, Tag, X, Plus, Edit, Trash2, Upload } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";
import { Switch } from "@/components/ui/switch";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml } from "@/lib/sanitize";

interface BlogItem {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  alt_text: string;
}

interface BlogHeaderData {
  page: string;
  section: string;
  data: {
    title: string;
    subtitle: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      slug: string;
      schemaMarkup: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface BlogData {
  page: string;
  section: string;
  data: BlogItem[];
  createdAt?: string;
  updatedAt?: string;
}

const defaultBlogItem: BlogItem = {
  id: "",
  title: "",
  content: "",
  author: "SRM Arnik Clinic",
  date: new Date().toISOString().split('T')[0],
  imageUrl: "",
  slug: "",
  meta_title: "",
  meta_description: "",
  keywords: [],
  alt_text: "",
};

export default function BlogHeaderPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [headerData, setHeaderData] = useState<BlogHeaderData>({
    page: "home",
    section: "blogHeader",
    data: {
      title: "FROM OUR BLOGS",
      subtitle: "Latest News & Updates",
      seo: {
        title: "",
        description: "",
        keywords: [],
        slug: "",
        schemaMarkup: ""
      }
    },
  });

  const [blogData, setBlogData] = useState<BlogData>({
    page: "home",
    section: "blog",
    data: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BlogItem | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [headerKeywordInput, setHeaderKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, blogRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/blogHeader/`),
        authFetch(`${API_BASE_URL}/api/cms/home/blog/`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setIsEnable(res.data?.isEnable ?? true);
        setHeaderData({
          page: res.page,
          section: res.section,
          data: {
            title: res.data?.title || "FROM OUR BLOGS",
            subtitle: res.data?.subtitle || "Latest News & Updates",
            seo: res.data?.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "",
              schemaMarkup: ""
            }
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (blogRes.ok) {
        const res = await blogRes.json();
        setBlogData({
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
        description: "Could not fetch blog data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHeaderChange = (field: keyof BlogHeaderData['data'], value: string) => {
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleAddItem = () => {
    const newItem: BlogItem = {
      ...defaultBlogItem,
      id: generateUniqueId(),
    };
    setEditingItem(newItem);
    setShowModal(true);
  };

  const handleEditItem = (item: BlogItem) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleItemChange = (field: keyof BlogItem, value: string | string[]) => {
    if (!editingItem) return;
    const updatedItem = { ...editingItem, [field]: value };

    // Auto-generate slug when title changes
    if (field === "title" && typeof value === "string" && value.trim()) {
      updatedItem.slug = generateSlug(value);
      updatedItem.meta_title = `${value} | SRM Arnik Clinic`;
    }

    setEditingItem(updatedItem);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;

    const isNew = !blogData.data.find((item) => item.id === editingItem.id);
    let updatedItems;

    if (isNew) {
      updatedItems = [...blogData.data, editingItem];
    } else {
      updatedItems = blogData.data.map((item) =>
        item.id === editingItem.id ? editingItem : item
      );
    }

    setBlogData({
      ...blogData,
      data: updatedItems
    });
    setShowModal(false);
    setEditingItem(null);
    toast({ title: isNew ? "Blog added successfully" : "Blog updated successfully" });
  };

  const handleRemoveItem = (id: string) => {
    setBlogData({
      ...blogData,
      data: blogData.data.filter((item) => item.id !== id)
    });
    toast({ title: "Blog removed successfully" });
  };

  const handleImageUpload = async (file: File) => {
    if (!editingItem) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleItemChange("imageUrl", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim() || !editingItem) return;
    const currentKeywords = editingItem.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      handleItemChange("keywords", [...currentKeywords, keywordInput.trim()]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    if (!editingItem) return;
    const newKeywords = (editingItem.keywords || []).filter((_, i) => i !== index);
    handleItemChange("keywords", newKeywords);
  };

  const handleAddHeaderKeyword = () => {
    if (headerKeywordInput.trim() && !headerData.data.seo.keywords.includes(headerKeywordInput.trim())) {
      setHeaderData({
        ...headerData,
        data: {
          ...headerData.data,
          seo: {
            ...headerData.data.seo,
            keywords: [...headerData.data.seo.keywords, headerKeywordInput.trim()]
          }
        }
      });
      setHeaderKeywordInput("");
    }
  };

  const handleRemoveHeaderKeyword = (keyword: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        seo: {
          ...headerData.data.seo,
          keywords: headerData.data.seo.keywords.filter(k => k !== keyword)
        }
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    setIsEnable(checked);
    setIsSavingHeader(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blogHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable: checked } }),
      });

      if (response.ok) {
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
      setIsSavingHeader(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }
    setIsSavingHeader(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blogHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...headerData, data: { ...headerData.data, isEnable } }),
      });

      if (response.ok) {
        toast({ title: "Blog header saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save blog header.",
      });
    } finally {
      setIsSavingHeader(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blog/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });

      if (response.ok) {
        toast({ title: "Blog posts saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save blog posts.",
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage blog header and blog posts
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnable}
                onCheckedChange={handleToggleChange}
                disabled={isSavingHeader}
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
          Blog Section
        </Badge>
        {headerData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(headerData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Header Settings Card */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Blog Header
              </CardTitle>
              <div
                className="text-sm font-medium mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.title || "No title set") }}
              />
              {headerData.data.subtitle && (
                <div
                  className="text-sm text-muted-foreground mt-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.subtitle) }}
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
            <DialogTitle>Edit Blog Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Header Title</Label>
              <RichTextEditor
                placeholder="FROM OUR BLOGS"
                value={headerData.data.title}
                onChange={(value) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, title: value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Header Subtitle</Label>
              <RichTextEditor
                placeholder="Latest News & Updates"
                value={headerData.data.subtitle}
                onChange={(value) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, subtitle: value }
                })}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Title</Label>
                  <Input
                    value={headerData.data.seo.title}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, title: e.target.value }
                      }
                    })}
                    placeholder="Blog - SRM Arnik Clinic"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Description</Label>
                  <Textarea
                    value={headerData.data.seo.description}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, description: e.target.value }
                      }
                    })}
                    placeholder="Read our latest blog posts and updates"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Slug</Label>
                  <Input
                    value={headerData.data.seo.slug}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, slug: e.target.value }
                      }
                    })}
                    placeholder="blog"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={headerKeywordInput}
                      onChange={(e) => setHeaderKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHeaderKeyword())}
                      placeholder="Add keyword and press Enter"
                    />
                    <Button type="button" onClick={handleAddHeaderKeyword} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {headerData.data.seo.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {headerData.data.seo.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveHeaderKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <SchemaMarkupEditor
                  value={headerData.data.seo.schemaMarkup}
                  onChange={(value) => setHeaderData({
                    ...headerData,
                    data: {
                      ...headerData.data,
                      seo: { ...headerData.data.seo, schemaMarkup: value }
                    }
                  })}
                  onValidationChange={setIsSchemaValid}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHeader} disabled={isSavingHeader}>
                {isSavingHeader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Header
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blog Posts */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Blog Posts
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your blog articles
              </p>
            </div>
            <Badge variant="secondary">
              {blogData.data.length} {blogData.data.length === 1 ? 'post' : 'posts'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {blogData.data.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                No blog posts configured yet
              </p>
              <Button onClick={handleAddItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Your First Blog Post
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {blogData.data.map((item, index) => (
                <Card key={item.id} className="overflow-hidden h-full flex flex-col">
                  <div className="aspect-video relative">
                    {item.imageUrl ? (
                      <Image
                        src={getAssetUrl(item.imageUrl)}
                        alt={item.alt_text || item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-xs">
                        Post #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1 space-y-3">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {item.title || "Untitled Post"}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {item.content || "No content"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {item.author} • {item.date}
                      </div>
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

          {/* Add Blog Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleAddItem} className="w-full" style={{ backgroundColor: '#4f46e5', color: 'white' }}>
              <Plus className="h-4 w-4 mr-2" /> Add New Blog Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {blogData.data.length > 0 && (
              <span>Ready to save {blogData.data.length} blog posts</span>
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
                  <Save className="h-4 w-4 mr-2" /> Save Blog Posts
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
              {editingItem && blogData.data.find((item) => item.id === editingItem.id)
                ? "Edit Blog Post"
                : "Add New Blog Post"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Title</Label>
                  <RichTextEditor
                    value={editingItem.title}
                    onChange={(value) => handleItemChange("title", value)}
                    placeholder="Blog post title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Author</Label>
                  <Input
                    value={editingItem.author}
                    onChange={(e) => handleItemChange("author", e.target.value)}
                    placeholder="SRM Arnik Clinic"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => handleItemChange("date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Slug</Label>
                  <Input
                    value={editingItem.slug}
                    onChange={(e) => handleItemChange("slug", e.target.value)}
                    placeholder="blog-post-slug"
                  />
                </div>
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Featured Image</Label>
                <p className="text-xs text-muted-foreground">Recommended size: 800x400 pixels</p>
                <div className="flex gap-2">
                  <Input
                    value={editingItem.imageUrl}
                    onChange={(e) => handleItemChange("imageUrl", e.target.value)}
                    placeholder="/uploads/blog-image.jpg"
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
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {editingItem.imageUrl && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <Image
                      src={getAssetUrl(editingItem.imageUrl)}
                      alt="Preview"
                      width={200}
                      height={100}
                      className="object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Alt Text</Label>
                <Input
                  value={editingItem.alt_text}
                  onChange={(e) => handleItemChange("alt_text", e.target.value)}
                  placeholder="Descriptive alt text for the image"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Content</Label>
                <RichTextEditor
                  value={editingItem.content}
                  onChange={(value) => handleItemChange("content", value)}
                  placeholder="Write your blog content here..."
                />
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SEO Settings</h3>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Meta Title</Label>
                  <Input
                    value={editingItem.meta_title}
                    onChange={(e) => handleItemChange("meta_title", e.target.value)}
                    placeholder="SEO title for search engines"
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingItem.meta_title.length}/60 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Meta Description</Label>
                  <Textarea
                    value={editingItem.meta_description}
                    onChange={(e) => handleItemChange("meta_description", e.target.value)}
                    placeholder="Brief description for search engines"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingItem.meta_description.length}/160 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyword}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(editingItem.keywords || []).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or click the tag icon to add keywords
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Blog Post
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
