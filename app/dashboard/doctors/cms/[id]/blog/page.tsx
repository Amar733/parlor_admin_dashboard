"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, Loader2, Upload, Tag, FileText } from "lucide-react";
import { uploadImage, getImageUrl, generateSlug } from "@/lib/cms-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

interface BlogData {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  posts: BlogPost[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

export default function BlogPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get('name') || '';
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<BlogData>({
    enabled: false,
    title: "My Insights & Articles",
    subtitle: "Blog Post",
    description: "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
    posts: [],
    seo: { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" }
  });
  const [modulesList, setModulesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sectionKeywordInput, setSectionKeywordInput] = useState("");
  const [postKeywordInput, setPostKeywordInput] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const [isPostSchemaValid, setIsPostSchemaValid] = useState(true);

  useEffect(() => {
    fetchData();
    fetchModules();
  }, [doctorId]);

  const fetchData = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blog_${doctorId}`);
      if (response.ok) {
        const result = await response.json();
        const apiData = result.data || {
          enabled: false,
          title: "My Insights & Articles",
          subtitle: "Blog Post",
          description: "This is a great site for everything around the home, and it also has a useful section. You can see the best products.",
          posts: []
        };
        
        setData({
          ...apiData,
          seo: apiData.seo || { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" },
          posts: (apiData.posts || []).map((post: any) => ({
            ...post,
            seo: post.seo || { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" }
          }))
        });
      }
    } catch (error) {
      console.error("Error fetching blog data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/modules_list`);
      if (response.ok) {
        const result = await response.json();
        setModulesList(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const handleSave = async () => {
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the section schema markup errors before saving" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blog_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        await fetchData();
        toast({
          title: "Success",
          description: "Blog content saved successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save blog content",
        });
      }
    } catch (error) {
      console.error("Error saving blog data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, postId?: string) => {
    try {
      const imageUrl = await uploadImage(file, "blog", authFetch);
      if (postId) {
        setEditingPost(prev => prev ? { ...prev, image: imageUrl } : null);
      }
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return "";
    }
  };

  const openEditDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost({ ...post });
    } else {
      setEditingPost({
        id: Date.now().toString(),
        title: "",
        excerpt: "",
        image: "",
        author: "",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        category: "",
        seo: { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" }
      });
    }
    setPostKeywordInput("");
    setIsDialogOpen(true);
  };

  const savePost = async () => {
    if (!editingPost) return;

    if (!editingPost.title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Blog post title is required",
      });
      return;
    }
    
    if (!isPostSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the post schema markup errors before saving" });
      return;
    }

    const existingIndex = data.posts.findIndex(post => post.id === editingPost.id);
    const updatedData = {
      ...data,
      posts: existingIndex >= 0 
        ? data.posts.map(post => post.id === editingPost.id ? editingPost : post)
        : [...data.posts, editingPost]
    };

    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blog_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData }),
      });

      if (response.ok) {
        await fetchData();
        setIsDialogOpen(false);
        setEditingPost(null);
        toast({
          title: "Success",
          description: `Blog post ${existingIndex >= 0 ? 'updated' : 'created'} successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save blog post",
        });
      }
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving the blog post",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const deletePost = async () => {
    if (!postToDelete) return;
    
    const updatedData = {
      ...data,
      posts: data.posts.filter(post => post.id !== postToDelete)
    };

    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/blog_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData }),
      });

      if (response.ok) {
        await fetchData();
        setDeleteConfirmOpen(false);
        setPostToDelete(null);
        toast({
          title: "Success",
          description: "Blog post deleted successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete blog post",
        });
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the blog post",
      });
    } finally {
      setIsSaving(false);
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-gray-600">Manage blog posts and content for {doctorName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
            />
            <span className="text-sm">Enable Blog Section</span>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={data.subtitle}
                  onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Section Description</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Blog Posts ({data.posts.length})
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openEditDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPost && data.posts.find(post => post.id === editingPost.id) ? "Edit Blog Post" : "Add New Blog Post"}
                    </DialogTitle>
                  </DialogHeader>
                  {editingPost && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={editingPost.title}
                            onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Author</Label>
                          <Input
                            value={editingPost.author}
                            onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Excerpt</Label>
                        <Textarea
                          value={editingPost.excerpt}
                          onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={editingPost.category}
                            onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            value={editingPost.date}
                            onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
                            placeholder="March 24, 2024"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Featured Image</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editingPost.image}
                            onChange={(e) => setEditingPost({ ...editingPost, image: e.target.value })}
                            placeholder="Image URL"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('blog-image-file')?.click()}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </Button>
                          <input
                            id="blog-image-file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsSaving(true);
                                try {
                                  const imageUrl = await uploadImage(file, "blog", authFetch);
                                  setEditingPost(prev => prev ? { ...prev, image: imageUrl } : null);
                                  toast({
                                    title: "Success",
                                    description: "Image uploaded successfully!",
                                  });
                                } catch (error) {
                                  console.error("Failed to upload image:", error);
                                  toast({
                                    variant: "destructive",
                                    title: "Upload Error",
                                    description: "Failed to upload image",
                                  });
                                } finally {
                                  setIsSaving(false);
                                }
                              }
                            }}
                          />
                        </div>
                        {editingPost.image && (
                          <img
                            src={getImageUrl(editingPost.image)}
                            alt="Preview"
                            className="mt-2 h-20 w-32 object-cover rounded"
                          />
                        )}
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">SEO Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>SEO Title</Label>
                            <Input
                              value={editingPost.seo?.title || ""}
                              onChange={(e) => {
                                const title = e.target.value;
                                setEditingPost({
                                  ...editingPost,
                                  seo: {
                                    ...editingPost.seo,
                                    title,
                                    slug: title ? generateSlug(title) : "",
                                    description: editingPost.seo?.description || "",
                                    keywords: editingPost.seo?.keywords || []
                                  }
                                });
                              }}
                            />
                          </div>
                          <div>
                            <Label>SEO Description</Label>
                            <Textarea
                              value={editingPost.seo?.description || ""}
                              onChange={(e) => setEditingPost({
                                ...editingPost,
                                seo: {
                                  ...editingPost.seo,
                                  description: e.target.value,
                                  title: editingPost.seo?.title || "",
                                  keywords: editingPost.seo?.keywords || [],
                                  slug: editingPost.seo?.slug || ""
                                }
                              })}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label>SEO Keywords</Label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={postKeywordInput}
                                  onChange={(e) => setPostKeywordInput(e.target.value)}
                                  placeholder="Add keyword"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && postKeywordInput.trim()) {
                                      e.preventDefault();
                                      const currentKeywords = editingPost.seo?.keywords || [];
                                      if (!currentKeywords.includes(postKeywordInput.trim())) {
                                        setEditingPost({
                                          ...editingPost,
                                          seo: {
                                            ...editingPost.seo,
                                            keywords: [...currentKeywords, postKeywordInput.trim()],
                                            title: editingPost.seo?.title || "",
                                            description: editingPost.seo?.description || "",
                                            slug: editingPost.seo?.slug || ""
                                          }
                                        });
                                      }
                                      setPostKeywordInput("");
                                    }
                                  }}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (postKeywordInput.trim()) {
                                      const currentKeywords = editingPost.seo?.keywords || [];
                                      if (!currentKeywords.includes(postKeywordInput.trim())) {
                                        setEditingPost({
                                          ...editingPost,
                                          seo: {
                                            ...editingPost.seo,
                                            keywords: [...currentKeywords, postKeywordInput.trim()],
                                            title: editingPost.seo?.title || "",
                                            description: editingPost.seo?.description || "",
                                            slug: editingPost.seo?.slug || ""
                                          }
                                        });
                                      }
                                      setPostKeywordInput("");
                                    }
                                  }}
                                >
                                  <Tag className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(editingPost.seo?.keywords || []).map((keyword, index) => (
                                  <Badge key={index} variant="secondary">
                                    {keyword}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newKeywords = (editingPost.seo?.keywords || []).filter((_, i) => i !== index);
                                        setEditingPost({
                                          ...editingPost,
                                          seo: {
                                            ...editingPost.seo,
                                            keywords: newKeywords,
                                            title: editingPost.seo?.title || "",
                                            description: editingPost.seo?.description || "",
                                            slug: editingPost.seo?.slug || ""
                                          }
                                        });
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
                              value={editingPost.seo?.slug || ""}
                              onChange={(e) => setEditingPost({
                                ...editingPost,
                                seo: {
                                  ...editingPost.seo,
                                  slug: e.target.value,
                                  title: editingPost.seo?.title || "",
                                  description: editingPost.seo?.description || "",
                                  keywords: editingPost.seo?.keywords || [],
                                  schemaMarkup: editingPost.seo?.schemaMarkup || ""
                                }
                              })}
                            />
                          </div>
                          
                          <SchemaMarkupEditor
                            value={editingPost.seo?.schemaMarkup || ""}
                            onChange={(value) => setEditingPost({
                              ...editingPost,
                              seo: {
                                ...editingPost.seo,
                                schemaMarkup: value,
                                title: editingPost.seo?.title || "",
                                description: editingPost.seo?.description || "",
                                keywords: editingPost.seo?.keywords || [],
                                slug: editingPost.seo?.slug || ""
                              }
                            })}
                            onValidationChange={setIsPostSchemaValid}
                          />
                        </CardContent>
                      </Card>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={savePost}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Post
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {data.posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No blog posts yet. Add your first post to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>By {post.author}</span>
                            <span>{post.category}</span>
                            <span>{post.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {post.image && (
                            <img
                              src={getImageUrl(post.image)}
                              alt={post.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Section SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={data.seo.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setData({
                      ...data,
                      seo: {
                        ...data.seo,
                        title,
                        slug: title ? generateSlug(title) : ""
                      }
                    });
                  }}
                />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={data.seo.description}
                  onChange={(e) => setData({
                    ...data,
                    seo: { ...data.seo, description: e.target.value }
                  })}
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
                          if (!data.seo.keywords.includes(sectionKeywordInput.trim())) {
                            setData({
                              ...data,
                              seo: {
                                ...data.seo,
                                keywords: [...data.seo.keywords, sectionKeywordInput.trim()]
                              }
                            });
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
                        if (sectionKeywordInput.trim() && !data.seo.keywords.includes(sectionKeywordInput.trim())) {
                          setData({
                            ...data,
                            seo: {
                              ...data.seo,
                              keywords: [...data.seo.keywords, sectionKeywordInput.trim()]
                            }
                          });
                          setSectionKeywordInput("");
                        }
                      }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => setData({
                            ...data,
                            seo: {
                              ...data.seo,
                              keywords: data.seo.keywords.filter((_, i) => i !== index)
                            }
                          })}
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
                  value={data.seo.slug}
                  onChange={(e) => setData({
                    ...data,
                    seo: { ...data.seo, slug: e.target.value }
                  })}
                />
              </div>
              
              <SchemaMarkupEditor
                value={data.seo.schemaMarkup || ""}
                onChange={(value) => setData({
                  ...data,
                  seo: { ...data.seo, schemaMarkup: value }
                })}
                onValidationChange={setIsSchemaValid}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmOpen(false);
              setPostToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deletePost} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}