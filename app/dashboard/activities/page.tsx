
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Activity } from '@/lib/data';
import { PlusCircle, Trash2, Stethoscope, Film, Upload, Loader2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { MagicTextarea } from '@/components/magic-textarea';
import { usePermission } from '@/hooks/use-permission';
import { getAssetUrl } from '@/lib/asset-utils';

type EditingActivity = Partial<Activity>;

export default function ActivitiesPage() {
  const { user, loading: authLoading, token, authFetch } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs State
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Form State
  const [editingActivity, setEditingActivity] = useState<EditingActivity>({});
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // in KB/s

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/activities');
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      setItems(data);
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
        router.push('/dashboard/');
      } else {
        fetchActivities();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchActivities]);

  const uploadWithProgress = useCallback((
    file: File,
    onProgress: (percent: number, speed: number) => void
  ): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      let lastLoaded = 0;
      let lastTime = Date.now();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          
          const currentTime = Date.now();
          const timeElapsed = (currentTime - lastTime) / 1000; // in seconds
          const bytesUploaded = event.loaded - lastLoaded;
          const speed = timeElapsed > 0 ? bytesUploaded / timeElapsed / 1024 : 0; // in KB/s

          onProgress(progress, speed);

          lastLoaded = event.loaded;
          lastTime = currentTime;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100, 0);
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Upload failed with status: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed due to a network error.'));
      
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }, []);

  const handleFileUpload = async (
    file: File,
    previewSetter: (url: string) => void,
    fieldSetter: (url: string) => void
  ) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);

    try {
      const { url } = await uploadWithProgress(file, (progress, speed) => {
        setUploadProgress(progress);
        setUploadSpeed(speed);
      });
      previewSetter(url);
      fieldSetter(url);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: "destructive", title: "Upload Failed", description: (error as Error).message });
       }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
        handleFileUpload(file, setVideoPreview, (url) => {
             setEditingActivity(prev => ({ 
                ...prev, 
                videoUrl: url, 
                title: prev.title || file.name.replace(/\.[^/.]+$/, "") 
            }));
        });
    } else if (file) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please select a video file." });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        handleFileUpload(file, setThumbnailPreview, (url) => {
             setEditingActivity(prev => ({ ...prev, thumbnailUrl: url }));
        });
    } else if (file) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please select an image file." });
    }
  };

  const resetUploadDialog = () => {
    setEditingActivity({});
    setVideoPreview(null);
    setThumbnailPreview(null);
    setIsSubmitting(false);
  };

  const handleOpenUploadDialog = () => {
    resetUploadDialog();
    setIsUploadDialogOpen(true);
  }
  
  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !editingActivity.videoUrl || !editingActivity.thumbnailUrl || !editingActivity.title || !editingActivity.description) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please provide a video, thumbnail, title, and description.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await authFetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingActivity)
      });
      if (!response.ok) throw new Error('Failed to upload video');

      toast({ title: 'Success', description: 'Video uploaded successfully.' });
      setIsUploadDialogOpen(false);
      fetchActivities();
    } catch(error) {
        if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setEditingActivity(activity)
    setIsEditDialogOpen(true);
  }

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedActivity || !token) return;

    setIsSubmitting(true);
    try {
      const response = await authFetch(`/api/activities/${selectedActivity._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingActivity.title,
          description: editingActivity.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to update activity');
      
      toast({ title: "Success", description: "Activity details updated." });
      setIsEditDialogOpen(false);
      fetchActivities();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteItem = async (id: string) => {
    if(!token) return;
    try {
        const response = await authFetch(`/api/activities/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error("Failed to delete video. Server responded with an error.");
        }
        toast({ title: 'Success', description: 'Video deleted.' });
        await fetchActivities();
    } catch(error) {
        if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
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
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Upload New Activity Video</DialogTitle>
            <DialogDescription>
              Select a video file, a thumbnail image, and provide a title and description.
            </DialogDescription>
          </DialogHeader>
          <form id="upload-activity-form" onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 grid gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="video-file">1. Video File</Label>
                <Input id="video-file" type="file" accept="video/*" onChange={handleVideoChange} disabled={isUploading || !!videoPreview}/>
              </div>
              
              {isUploading && videoPreview === null && (
                <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground text-center">Uploading... {uploadProgress.toFixed(0)}% ({uploadSpeed.toFixed(1)} KB/s)</p>
                </div>
              )}

              {videoPreview && (
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="thumbnail-file">2. Thumbnail Image</Label>
                    <Input id="thumbnail-file" type="file" accept="image/*" onChange={handleThumbnailChange} disabled={isUploading || !!thumbnailPreview}/>
                  </div>
                  
                  {isUploading && thumbnailPreview === null && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-muted-foreground text-center">Uploading... {uploadProgress.toFixed(0)}% ({uploadSpeed.toFixed(1)} KB/s)</p>
                    </div>
                  )}

                  {thumbnailPreview && (
                    <div className="space-y-4">
                       <div className="grid w-full items-center gap-1.5">
                         <Label htmlFor="video-title-upload">3. Title</Label>
                         <Input id="video-title-upload" type="text" value={editingActivity.title || ''} onChange={(e) => setEditingActivity(p=>({...p, title: e.target.value}))} placeholder="Enter video title" required />
                       </div>
                       <div className="grid w-full items-center gap-1.5">
                         <Label htmlFor="video-description-upload">4. Description</Label>
                         <MagicTextarea 
                            id="video-description-upload"
                            value={editingActivity.description || ''} 
                            onValueChange={(newValue) => setEditingActivity(p=>({...p, description: newValue}))} 
                            placeholder="Enter video description" 
                            required
                            aiContext="a description for a short video about a healthcare clinic's activities"
                         />
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
          <DialogFooter className="p-6 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsUploadDialogOpen(false)}>Close</Button>
            <Button type="submit" form="upload-activity-form" disabled={!videoPreview || !thumbnailPreview || isSubmitting || isUploading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form id="edit-activity-form" onSubmit={handleEditSave}>
            <DialogHeader>
              <DialogTitle>Edit Activity Details</DialogTitle>
              <DialogDescription>
                Update the title and description for this video. The video file cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6 px-6">
              <div className="space-y-2">
                <Label htmlFor="video-title-edit">Title</Label>
                <Input id="video-title-edit" name="title" value={editingActivity?.title || ''} onChange={(e) => setEditingActivity(p=>({...p, title: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-description-edit">Description</Label>
                <MagicTextarea
                  id="video-description-edit"
                  value={editingActivity?.description || ''}
                  onValueChange={(newValue) => setEditingActivity(p=>({...p, description: newValue}))}
                  aiContext="a description for a short video about a healthcare clinic's activities"
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="edit-activity-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">Showcase your clinic activities with videos.</p>
        </div>
        {can('edit', pathname) && (
          <Button onClick={handleOpenUploadDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Video
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
              <CardHeader className="p-0 relative">
                 <div className="aspect-video w-full bg-muted">
                   {playingVideoId === item._id ? (
                      <video
                        src={getAssetUrl(item.videoUrl)}
                        controls
                        autoPlay
                        onEnded={() => setPlayingVideoId(null)}
                        className="w-full h-full object-cover"
                      >
                          Your browser does not support the video tag.
                      </video>
                   ) : (
                    <>
                      <Image
                        src={getAssetUrl(item.thumbnailUrl)}
                        alt={item.title}
                        fill
                        className="object-cover"
                        data-ai-hint="clinic video"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-16 w-16 text-white hover:bg-white/20 hover:text-white" onClick={() => setPlayingVideoId(item._id)}>
                              <Film className="h-12 w-12" />
                              <span className="sr-only">Play video</span>
                          </Button>
                      </div>
                    </>
                   )}
                 </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="mt-2 text-sm text-muted-foreground">{item.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                {can('edit', pathname) && (
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(item)}
                  >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {can('delete', pathname) && (
                  <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteItem(item._id)}
                  >
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
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Activity Videos</h3>
            <p className="text-muted-foreground">Click "Add Video" to upload your first clinic video.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
