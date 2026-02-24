
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicTextarea } from '@/components/magic-textarea';
import type { Testimonial } from '@/lib/data';
import { PlusCircle, Edit, Trash2, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { getAssetUrl } from '@/lib/asset-utils';

export default function TestimonialsPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/testimonials');
      if (!response.ok) throw new Error("Failed to fetch testimonials");
      const data = await response.json();
      setTestimonials(data);
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
        fetchTestimonials();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchTestimonials]);

  const handleEditClick = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setEditingTestimonial(testimonial);
    setPhotoPreview(getAssetUrl(testimonial.avatarUrl));
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedTestimonial(null);
    setEditingTestimonial({});
    setPhotoPreview(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedTestimonial(null);
      setEditingTestimonial({});
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
        setEditingTestimonial(t => ({...t, avatarUrl: url}));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (testimonialId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/testimonials/${testimonialId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete testimonial');
      toast({ title: "Success", description: "Testimonial has been deleted." });
      await fetchTestimonials();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete testimonial." });
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    
    try {
      const url = selectedTestimonial ? `/api/testimonials/${selectedTestimonial._id}` : '/api/testimonials';
      const method = selectedTestimonial ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestimonial),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save testimonial.');
      }
      
      toast({ title: "Success", description: `Testimonial ${selectedTestimonial ? 'updated' : 'created'} successfully.` });
      handleDialogChange(false);
      await fetchTestimonials();

    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       }
    } finally {
        setIsSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage client feedback and reviews.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          {can('edit', pathname) && (
            <DialogTrigger asChild>
              <Button onClick={handleAddNewClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Testimonial
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>{selectedTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
              <DialogDescription>
                {selectedTestimonial ? 'Update this client testimonial.' : 'Add a new client testimonial.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <form id="testimonial-form" onSubmit={handleSave} className="grid gap-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" name="clientName" value={editingTestimonial.clientName || ''} onChange={e => setEditingTestimonial(t => ({...t, clientName: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text">Testimonial</Label>
                  <MagicTextarea
                    id="text"
                    value={editingTestimonial.text || ''}
                    onValueChange={(newValue) => setEditingTestimonial(t => ({...t, text: newValue}))}
                    required
                    aiContext="a client testimonial or review for a healthcare clinic"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo">Avatar</Label>
                    <Input id="photo" name="photo" type="file" onChange={handlePhotoChange} accept="image/*" disabled={isUploading}/>
                </div>
                {isUploading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                {photoPreview && !isUploading && (
                  <div className="space-y-2">
                      <Label>Avatar Preview</Label>
                      <Image src={getAssetUrl(photoPreview)} alt="Avatar preview" width={80} height={80} className="rounded-full border" />
                  </div>
                )}
              </form>
            </div>
            <DialogFooter className="p-6 pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="testimonial-form" disabled={isUploading || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {testimonials.map((testimonial) => (
          <Card key={testimonial._id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Image
                  src={getAssetUrl(testimonial.avatarUrl)}
                  alt={`Avatar of ${testimonial.clientName}`}
                  width={48}
                  height={48}
                  className="rounded-full"
                  data-ai-hint="person portrait"
                />
                <div>
                  <CardTitle>{testimonial.clientName}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-2 pl-6 italic text-muted-foreground">
                "{testimonial.text}"
              </blockquote>
            </CardContent>
            {(can('edit', pathname) || can('delete', pathname)) && (
              <CardFooter className="flex justify-end gap-2">
                  {can('edit', pathname) && (
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(testimonial)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  )}
                  {can('delete', pathname) && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(testimonial._id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  )}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
