"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MissionVisionSection } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface MissionVisionTabProps {
  missionVision: MissionVisionSection;
  onChange: (missionVision: MissionVisionSection) => void;
}

export function MissionVisionTab({ missionVision, onChange }: MissionVisionTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Mission & Vision</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mission</Label>
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <div
                  className="font-semibold text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: missionVision.mission.title.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Title not set</span>" }}
                />
              </div>
              <div
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 min-h-[80px] text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: missionVision.mission.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Description not set</span>" }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vision</Label>
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <div
                  className="font-semibold text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: missionVision.vision.title.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Title not set</span>" }}
                />
              </div>
              <div
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 min-h-[80px] text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: missionVision.vision.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Description not set</span>" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mission & Vision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Mission</h3>
              <div>
                <Label>Title (HTML)</Label>
                <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                  <RichTextEditor
                    value={missionVision.mission.title.html}
                    onChange={(value) => onChange({
                      ...missionVision,
                      mission: { ...missionVision.mission, title: { html: value } }
                    })}
                    placeholder="Mission Title"
                  />
                </Suspense>
              </div>
              <div>
                <Label>Description (HTML)</Label>
                <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                  <RichTextEditor
                    value={missionVision.mission.description.html}
                    onChange={(value) => onChange({
                      ...missionVision,
                      mission: { ...missionVision.mission, description: { html: value } }
                    })}
                    placeholder="Our mission is to..."
                  />
                </Suspense>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-lg">Vision</h3>
              <div>
                <Label>Title (HTML)</Label>
                <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                  <RichTextEditor
                    value={missionVision.vision.title.html}
                    onChange={(value) => onChange({
                      ...missionVision,
                      vision: { ...missionVision.vision, title: { html: value } }
                    })}
                    placeholder="Vision Title"
                  />
                </Suspense>
              </div>
              <div>
                <Label>Description (HTML)</Label>
                <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                  <RichTextEditor
                    value={missionVision.vision.description.html}
                    onChange={(value) => onChange({
                      ...missionVision,
                      vision: { ...missionVision.vision, description: { html: value } }
                    })}
                    placeholder="Our vision is to..."
                  />
                </Suspense>
              </div>
            </div>
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