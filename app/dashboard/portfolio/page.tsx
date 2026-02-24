
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
import type { PortfolioItem } from '@/lib/data';
import { PlusCircle, Trash2, Stethoscope, Edit, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { getAssetUrl } from '@/lib/asset-utils';

export default function PortfolioPage() {
  const { user, loading: authLoading, token, authFetch } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/portfolio');
      if (!response.ok) throw new Error("Failed to fetch portfolio items");
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
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
        fetchItems();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchItems]);

  const handleAddNewClick = () => {
    setSelectedItem(null);
    setEditingItem({});
    setPhotoPreview(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setEditingItem(item);
    setPhotoPreview(getAssetUrl(item.imageUrl));
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedItem(null);
      setEditingItem({});
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
        setEditingItem(p => ({ ...p, imageUrl: url }));
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

    if (!editingItem.imageUrl) {
        toast({ variant: "destructive", title: "Error", description: "Please select an image for the portfolio item."});
        setIsSaving(false);
        return;
    }

    try {
      const url = selectedItem ? `/api/portfolio/${selectedItem._id}` : '/api/portfolio';
      const method = selectedItem ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save portfolio item.');
      }
      
      toast({ title: "Success", description: `Portfolio item ${selectedItem ? 'updated' : 'created'} successfully.` });
      handleDialogChange(false);
      await fetchItems();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       }
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async (itemId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/portfolio/${itemId}`, { 
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete portfolio item');
      toast({ title: "Success", description: "Portfolio item has been deleted." });
      await fetchItems();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: "Could not delete item." });
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</DialogTitle>
            <DialogDescription>
              Provide a title and upload an image for the portfolio.
            </DialogDescription>
          </DialogHeader>
          <form id="portfolio-form" onSubmit={handleSave}>
            <div className="grid gap-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={editingItem.title || ''} onChange={(e) => setEditingItem(p => ({...p, title: e.target.value}))} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input id="image" type="file" onChange={handlePhotoChange} accept="image/*" disabled={isUploading}/>
              </div>
              
              {isUploading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
              {photoPreview && !isUploading && (
                <div className="space-y-2">
                    <Label>Image Preview</Label>
                    <div className="relative w-full aspect-video">
                      <Image src={getAssetUrl(photoPreview)} alt="Portfolio item preview" fill className="rounded-md border object-cover" />
                    </div>
                </div>
              )}
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="portfolio-form" disabled={isUploading || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your clinic with images and videos.</p>
        </div>
        {can('edit', pathname) && (
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden group relative flex flex-col">
              <CardHeader className="p-0">
                 <Image
                   src={getAssetUrl(item.imageUrl)}
                   alt={item.title}
                   width={600}
                   height={400}
                   className="aspect-video w-full object-cover"
                   data-ai-hint="clinic interior"
                 />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                 {can('edit', pathname) && (
                   <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                 )}
                 {can('delete', pathname) && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>
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
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Portfolio Items</h3>
            <p className="text-muted-foreground">Click "Add Item" to upload your first portfolio image.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
