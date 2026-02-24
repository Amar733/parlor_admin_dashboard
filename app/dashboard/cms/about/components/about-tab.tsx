"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit, Heart, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { AboutSection } from "../types";
import { ImageUpload } from "./image-upload";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(module => ({ default: module.RichTextEditor })));

interface AboutTabProps {
  about: AboutSection;
  onChange: (about: AboutSection) => void;
}

export function AboutTab({ about, onChange }: AboutTabProps) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);


  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">About Section</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit About
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Heading</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: about.heading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 min-h-[80px] text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: about.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          {about.image && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Image Preview</Label>
              <div className="relative w-48 h-48 border-2 border-purple-100 dark:border-purple-900 rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={getAssetUrl(about.image)}
                  alt="About"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit About Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Heading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={about.heading.html}
                  onChange={(value) => onChange({
                    ...about,
                    heading: { html: value }
                  })}
                  placeholder="Enter heading..."
                />
              </Suspense>
            </div>
            <div>
              <Label>Description (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={about.description.html}
                  onChange={(value) => onChange({
                    ...about,
                    description: { html: value }
                  })}
                  placeholder="Write about your company..."
                />
              </Suspense>
            </div>
            <ImageUpload
              value={about.image}
              onChange={(url) => onChange({ ...about, image: url })}
              label="About Image"
              description="Recommended: 500x600px"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}