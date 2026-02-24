

"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { Stethoscope, Loader2, Image as ImageIcon, Trash2, Undo, Download, Link as LinkIcon, FileText, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/pagination';
import type { PaginatedResponse } from '@/lib/api/db';


interface GalleryFile {
    name: string;
    size: number;
    createdAt: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'other';
}

type PaginatedFiles = PaginatedResponse<GalleryFile>;

export default function GalleryPage() {
  const { user, loading: authLoading, token, authFetch } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeFiles, setActiveFiles] = useState<PaginatedFiles | null>(null);
  const [binnedFiles, setBinnedFiles] = useState<PaginatedFiles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 12;
  const currentTab = searchParams.get('tab') || 'active';


  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`/api/gallery?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch gallery files");
      const data = await response.json();
      setActiveFiles(data.activeFiles);
      setBinnedFiles(data.binnedFiles);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsLoading(false);
    }
  }, [toast, authFetch, page, limit]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchFiles();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchFiles]);
  
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', value);
    newParams.set('page', '1');
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const handleAction = async (action: 'delete' | 'restore' | 'permanent-delete', filename: string) => {
    if (!token) return;
    setProcessingFile(filename);

    try {
        const response = await authFetch(`/api/gallery/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Action failed');
        }

        toast({ title: 'Success', description: `File action successful.` });
        await fetchFiles();
    } catch (error) {
        if (!(error as Error).message.includes('Session expired')) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    } finally {
        setProcessingFile(null);
    }
  };

  const handleCopyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: 'Success', description: 'Link copied to clipboard.' });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const renderFileCard = (file: GalleryFile, isBinned: boolean) => {
    const isProcessing = processingFile === file.name;
    
    let icon;
    let containerClass = "bg-muted";

    switch (file.type) {
        case 'image':
            icon = <Image src={file.url} alt={file.name} fill className="object-cover" />;
            break;
        case 'video':
            containerClass = "bg-black";
            icon = (
                <>
                {playingFile === file.name ? (
                     <video
                        src={file.url}
                        controls
                        autoPlay
                        onEnded={() => setPlayingFile(null)}
                        className="w-full h-full object-cover"
                      >
                          Your browser does not support the video tag.
                      </video>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-20 w-20 text-white/70 hover:text-white/90" onClick={() => setPlayingFile(file.name)}>
                            <PlayCircle className="h-20 w-20" />
                            <span className="sr-only">Play video</span>
                        </Button>
                    </div>
                )}
                </>
            );
            break;
        case 'document':
            icon = <FileText className="h-12 w-12 text-muted-foreground" />;
            break;
        default:
            icon = <ImageIcon className="h-12 w-12 text-muted-foreground" />;
            break;
    }

    return (
        <Card key={file.name} className="overflow-hidden group relative flex flex-col">
            <CardHeader className="p-0">
                <div className={cn("aspect-video w-full flex items-center justify-center relative", containerClass)}>
                   {icon}
                </div>
            </CardHeader>
            <CardContent className="p-3 flex-grow">
                <p className="text-sm font-semibold truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} &bull; {format(new Date(file.createdAt), 'PP')}
                </p>
            </CardContent>
            <CardFooter className="p-2 pt-0 flex justify-end gap-1">
                {isProcessing ? (
                    <div className="flex items-center justify-center w-full p-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : isBinned ? (
                    <>
                        <Button variant="outline" size="sm" onClick={() => handleAction('restore', file.name)} disabled={!can('delete', pathname)}>
                            <Undo className="h-3 w-3"/> Restore
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={!can('delete', pathname)}>
                                    <Trash2 className="h-3 w-3"/> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the file.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction('permanent-delete', file.name)} className={cn(buttonVariants({ variant: 'destructive' }))}>
                                        Yes, delete permanently
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                ) : (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <a href={file.url} download><Download className="h-3 w-3"/></a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(file.url)}>
                            <LinkIcon className="h-3 w-3"/>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={!can('delete', pathname)}>
                                    <Trash2 className="h-3 w-3"/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Move to Bin?</AlertDialogTitle>
                                    <AlertDialogDescription>This will move the file to the bin. You can restore it later.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAction('delete', file.name)}>Move to Bin</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </CardFooter>
        </Card>
    );
  };
  
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = (files: PaginatedFiles | null, isBinned: boolean, emptyIcon: React.ReactNode, emptyTitle: string, emptyDescription: string) => {
    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    if (!files || files.data.length === 0) {
        return (
            <Card className="h-64 flex flex-col items-center justify-center text-center">
                {emptyIcon}
                <h3 className="text-xl font-semibold">{emptyTitle}</h3>
                <p className="text-muted-foreground">{emptyDescription}</p>
            </Card>
        );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {files.data.map(file => renderFileCard(file, isBinned))}
        </div>
        {files.totalPages > 1 && (
            <Pagination
                page={files.currentPage}
                totalPages={files.totalPages}
                limit={limit}
                totalItems={files.totalItems}
            />
        )}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground">Manage all uploaded media files.</p>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
            <TabsTrigger value="active">Uploaded Files ({activeFiles?.totalItems ?? 0})</TabsTrigger>
            <TabsTrigger value="binned">Bin ({binnedFiles?.totalItems ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
            {renderContent(
                activeFiles, 
                false, 
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />,
                "No Files Uploaded",
                "Your gallery is empty."
            )}
        </TabsContent>
        <TabsContent value="binned" className="mt-4">
             {renderContent(
                binnedFiles, 
                true,
                <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />,
                "The Bin is Empty",
                "No files have been deleted."
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
