"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StatsSection } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface StatsTabProps {
  stats: StatsSection;
  onChange: (stats: StatsSection) => void;
}

export function StatsTab({ stats, onChange }: StatsTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-xl">Statistics</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Stats
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clients</Label>
            <div
              className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: stats.clients.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clients Text</Label>
            <div
              className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: stats.clientsText.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clients (HTML)</Label>
              <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={stats.clients.html}
                  onChange={(value) => onChange({
                    ...stats,
                    clients: { html: value }
                  })}
                  placeholder="500+"
                />
              </Suspense>
            </div>
            <div>
              <Label>Clients Text (HTML)</Label>
              <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={stats.clientsText.html}
                  onChange={(value) => onChange({
                    ...stats,
                    clientsText: { html: value }
                  })}
                  placeholder="Happy Clients"
                />
              </Suspense>
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