"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Save, RefreshCcw, FileText, Plus, Edit, Trash2, X } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { PageContentPreview } from "@/components/page-content-preview";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { API_BASE_URL } from "@/config/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { Textarea } from "@/components/ui/textarea";

interface Page {
  _id: string;
  name: string;
  slug: string;
  content: string;
  position: string;
  status: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const defaultPage: Omit<Page, '_id'> = {
  name: "",
  slug: "",
  content: "",
  position: "header",
  status: "Active",
  seo: {
    title: "",
    description: "",
    keywords: [],
    slug: "",
    schemaMarkup: ""
  }
};

export default function PagesPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<Omit<Page, '_id'>>(defaultPage);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/pages`);
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch pages data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug,
        seo: {
          ...prev.seo,
          slug
        }
      }));
    }
  };

  const handleSeoChange = (field: keyof Page['seo'], value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value
      }
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.seo.keywords.includes(keywordInput.trim())) {
      handleSeoChange('keywords', [...formData.seo.keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    handleSeoChange('keywords', formData.seo.keywords.filter(k => k !== keyword));
  };

  const handleSaveConfirm = async () => {
    setIsSaving(true);
    try {
      const url = editingPage 
        ? `${API_BASE_URL}/api/pages/${editingPage._id}`
        : `${API_BASE_URL}/api/pages`;
      
      const method = editingPage ? "PUT" : "POST";
      
      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ 
          title: `Page ${editingPage ? 'updated' : 'created'} successfully` 
        });
        setIsDialogOpen(false);
        setEditingPage(null);
        setFormData(defaultPage);
        loadPages();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editingPage ? 'update' : 'create'} page.`,
      });
    } finally {
      setIsSaving(false);
      setShowSaveAlert(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and slug are required.",
      });
      return;
    }
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }
    setShowSaveAlert(true);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      content: page.content,
      position: page.position,
      status: page.status,
      seo: page.seo || {
        title: "",
        description: "",
        keywords: [],
        slug: page.slug,
        schemaMarkup: ""
      }
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/api/pages/${pageToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Page deleted successfully" });
        loadPages();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete page.",
      });
    } finally {
      setShowDeleteAlert(false);
      setPageToDelete(null);
    }
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData(defaultPage);
    setKeywordInput("");
    setIsSchemaValid(true);
    setIsDialogOpen(true);
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pages Management</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Create and manage website pages with rich content
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={loadPages} className="bg-white dark:bg-gray-800">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Page
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            All Pages ({pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pages created yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map((page) => (
                <Card key={page._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                          {page.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={page.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                            {page.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {page.position}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewPage(page);
                            setShowPreview(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                          title="Preview"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(page)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPageToDelete(page._id);
                            setShowDeleteAlert(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Slug:</span>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">/{page.slug}</code>
                      </div>
                      
                      {page.content && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Preview:</span>
                          <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-md line-clamp-3">
                            {page.content.replace(/<[^>]*>/g, '').substring(0, 120)}
                            {page.content.length > 120 && '...'}
                          </div>
                        </div>
                      )}
                      
                      {page.updatedAt && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>Last updated</span>
                          <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Edit Page" : "Add New Page"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name *</Label>
                <Input
                  id="pageName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageSlug">Slug *</Label>
                <Input
                  id="pageSlug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="about-us"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pagePosition">Position</Label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange("position", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageStatus">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageContent">Content</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder="Enter page content here..."
                />
              </div>
              
              {formData.content && (
                <PageContentPreview 
                  content={formData.content}
                  title="Live Preview"
                />
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">SEO Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seo.title}
                  onChange={(e) => handleSeoChange("title", e.target.value)}
                  placeholder="Page title for search engines"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seo.description}
                  onChange={(e) => handleSeoChange("description", e.target.value)}
                  placeholder="Page description for search engines"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoSlug">SEO Slug</Label>
                <Input
                  id="seoSlug"
                  value={formData.seo.slug}
                  onChange={(e) => handleSeoChange("slug", e.target.value)}
                  placeholder="page-url-slug"
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Add keyword and press Enter"
                  />
                  <Button type="button" onClick={handleAddKeyword} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.seo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seo.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        {keyword}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveKeyword(keyword)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <SchemaMarkupEditor
                value={formData.seo.schemaMarkup}
                onChange={(value) => handleSeoChange("schemaMarkup", value)}
                onValidationChange={setIsSchemaValid}
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingPage ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPage ? "Update Page" : "Create Page"}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPage(null);
                setFormData(defaultPage);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview: {previewPage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-white border rounded-lg p-6 min-h-[400px]">
              <div 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewPage?.content || '') }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteAlert(false);
              setPageToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Alert */}
      <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{editingPage ? 'Update' : 'Create'} Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {editingPage ? 'update' : 'create'} this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingPage ? 'Update' : 'Create')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}