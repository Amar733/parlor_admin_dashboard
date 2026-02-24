
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicTextarea } from '@/components/magic-textarea';
import type { BlogPost } from '@/lib/data';
import { PlusCircle, Trash2, Stethoscope, Edit, Loader2, Newspaper } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { getAssetUrl } from '@/lib/asset-utils';

export default function BlogPage() {
  const { user, loading: authLoading, token, authFetch } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/blog');
      if (!response.ok) throw new Error("Failed to fetch blog posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsLoading(false);
    }
  }, [toast, authFetch]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchPosts();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchPosts]);

  const handleAddNewClick = () => {
    setSelectedPost(null);
    setEditingPost({
      date: new Date().toISOString().split('T')[0],
      author: user?.name,
    });
    setPhotoPreview(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (post: BlogPost) => {
    setSelectedPost(post);
    setEditingPost(post);
    setPhotoPreview(getAssetUrl(post.imageUrl));
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedPost(null);
      setEditingPost({});
      setPhotoPreview(null);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await authFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const { url } = await response.json();
        setPhotoPreview(url);
        setEditingPost(p => ({ ...p, imageUrl: url }));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const url = selectedPost ? `/api/blog/${selectedPost._id}` : '/api/blog';
      const method = selectedPost ? 'PUT' : 'POST';

      // Prepare data for saving
      const dataToSave = { ...editingPost };
      
      // For edits, preserve the original date
      if (selectedPost) {
        dataToSave.date = selectedPost.date;
      }

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save post.');
      }
      
      toast({ title: "Success", description: `Blog post ${selectedPost ? 'updated' : 'created'} successfully.` });
      handleDialogChange(false);
      await fetchPosts();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       }
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async (postId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/blog/${postId}`, { 
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete blog post');
      toast({ title: "Success", description: "Blog post has been deleted." });
      await fetchPosts();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: "Could not delete post." });
       }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
            <DialogDescription>
              Fill out the details for your blog post. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form id="blog-form" onSubmit={handleSave} className="grid grid-cols-2 gap-x-4 gap-y-6 p-6">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={editingPost.title || ''} onChange={(e) => setEditingPost(p => ({...p, title: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" name="author" value={editingPost.author || ''} onChange={(e) => setEditingPost(p => ({...p, author: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">{selectedPost ? 'Original Date' : 'Date'}</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  value={editingPost.date || ''} 
                  onChange={(e) => setEditingPost(p => ({...p, date: e.target.value}))} 
                  required 
                  readOnly={!!selectedPost}
                  className={selectedPost ? 'bg-muted' : ''}
                />
                {selectedPost && (
                  <p className="text-xs text-muted-foreground">Original publication date cannot be changed</p>
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="content">Content</Label>
                <MagicTextarea
                  id="content"
                  value={editingPost.content || ''}
                  onValueChange={(newValue) => setEditingPost(p => ({...p, content: newValue}))}
                  required
                  rows={10}
                  aiContext="the main content of a blog post for a healthcare clinic"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="image">Featured Image</Label>
                <Input id="image" type="file" onChange={handlePhotoChange} accept="image/*" disabled={isUploading}/>
              </div>
              {isUploading && (
                <div className="flex items-center justify-center col-span-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {photoPreview && (
                <div className="space-y-2 col-span-2">
                    <Label>Image Preview</Label>
                    <Image src={getAssetUrl(photoPreview)} alt="Blog post preview" width={300} height={150} className="rounded-md border object-cover aspect-video" />
                </div>
              )}
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="blog-form" disabled={isUploading || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Create and manage your clinic's articles.</p>
        </div>
        {can('edit', pathname) && (
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Post
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post._id} className="overflow-hidden group relative flex flex-col">
              <CardHeader className="p-0">
                 <Image
                   src={getAssetUrl(post.imageUrl)}
                   alt={post.title}
                   width={600}
                   height={400}
                   className="aspect-video w-full object-cover"
                   data-ai-hint="blog article"
                 />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  By {post.author} on {new Date(post.date).toLocaleDateString()}
                </CardDescription>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.content}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                {can('edit', pathname) && (
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(post)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {can('delete', pathname) && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(post._id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Blog Posts Yet</h3>
            <p className="text-muted-foreground">Click "Add New Post" to create your first article.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
