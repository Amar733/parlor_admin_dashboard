"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
    className?: string;
    maxSizeMB?: number;
}

export function ImageUpload({
    value,
    onChange,
    label,
    description,
    className,
    maxSizeMB = 2,
}: ImageUploadProps) {
    const { authFetch } = useAuth();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please upload an image file.",
            });
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: `Image size should be less than ${maxSizeMB}MB.`,
            });
            return;
        }

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
            onChange(url);
            toast({ title: "Image uploaded successfully" });
        } catch {
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: "Something went wrong while uploading the image.",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                </Label>
            )}
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="/uploads/image.jpg"
                        className="flex-1 h-9 border-gray-200 dark:border-gray-800 focus-visible:ring-purple-500"
                    />
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                            ref={fileInputRef}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            ) : (
                                <Upload className="h-4 w-4 text-purple-600" />
                            )}
                        </Button>
                    </div>
                </div>

                {value ? (
                    <div className="relative group w-fit">
                        <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-purple-100 dark:border-purple-900 shadow-sm transition-all duration-300 group-hover:shadow-md">
                            <Image
                                src={getAssetUrl(value)}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 text-muted-foreground transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">
                            No Preview
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
