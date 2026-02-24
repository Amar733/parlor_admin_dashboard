"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Award, Plus, Trash2, Upload, Loader2, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { CoreValuesSection, CoreValue } from "../types";
import { ImageUpload } from "./image-upload";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(module => ({ default: module.RichTextEditor })));

const stripHtml = (html?: string) => (html || "").replace(/<[^>]*>?/gm, '');

interface CoreValuesTabProps {
  coreValues: CoreValuesSection;
  onChange: (coreValues: CoreValuesSection) => void;
}

export function CoreValuesTab({ coreValues, onChange }: CoreValuesTabProps) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const handleAddValue = () => {
    const newValue: CoreValue = {
      icon: "",
      title: { html: "" },
      description: { html: "" },
      image: ""
    };
    onChange({
      ...coreValues,
      list: [...coreValues.list, newValue]
    });
  };

  const handleUpdateValue = (index: number, value: CoreValue) => {
    const newList = [...coreValues.list];
    newList[index] = value;
    onChange({
      ...coreValues,
      list: newList
    });
  };

  const handleDeleteValue = (index: number) => {
    const newList = [...coreValues.list];
    newList.splice(index, 1);
    onChange({
      ...coreValues,
      list: newList
    });
  };


  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <CardTitle className="text-xl">Core Values</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Values
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Heading</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-6 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: coreValues.heading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Values</Label>
              <Badge variant="secondary" className="text-sm">{coreValues.list.length} values</Badge>
            </div>
            <div className="grid gap-3 mt-2">
              {coreValues.list.map((value, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-lg border-2 border-rose-200 dark:border-rose-800 hover:shadow-md transition-shadow">
                  <div
                    className="font-semibold text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: value.title.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Untitled</span>" }}
                  />
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                    dangerouslySetInnerHTML={{ __html: value.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>No description</span>" }}
                  />
                  {value.icon && (
                    <div className="mt-2 relative w-12 h-12 rounded-lg overflow-hidden border-2 border-rose-300">
                      <Image
                        src={getAssetUrl(value.icon)}
                        alt={stripHtml(value.title.html) || "Core Value Image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              {coreValues.list.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-500 italic border-2 border-dashed rounded-lg">
                  No core values added yet
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Core Values</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Heading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={coreValues.heading.html}
                  onChange={(value) => onChange({
                    ...coreValues,
                    heading: { html: value }
                  })}
                  placeholder="Enter heading..."
                />
              </Suspense>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Values</h3>
                <Button
                  onClick={handleAddValue}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Value
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {coreValues.list.map((value, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-4 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-sm overflow-hidden mb-2">
                    <AccordionTrigger className="hover:no-underline py-4 group">
                      <div className="flex items-center justify-between w-full pr-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            {value.icon ? (
                              <Image
                                src={getAssetUrl(value.icon)}
                                alt="Icon"
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            ) : (
                              <Award className="h-5 w-5 text-rose-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-semibold text-base text-gray-900 dark:text-gray-100 line-clamp-1"
                              dangerouslySetInnerHTML={{ __html: stripHtml(value.title.html) || `Value #${index + 1}` }}
                            />
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                              Edit details
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteValue(index);
                          }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteValue(index);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4 border-t border-dashed">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4">
                          <ImageUpload
                            value={value.icon}
                            onChange={(url) => handleUpdateValue(index, { ...value, icon: url })}
                            label="Value Icon"
                            description="Recommended: 64x64px SVG/PNG"
                          />
                          <div>
                            <Label className="mb-2 block">Title (HTML)</Label>
                            <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={value.title.html}
                                onChange={(v) => handleUpdateValue(index, { ...value, title: { html: v } })}
                                placeholder="Value title"
                              />
                            </Suspense>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <ImageUpload
                            value={value.image}
                            onChange={(url) => handleUpdateValue(index, { ...value, image: url })}
                            label="Value Image"
                            description="Recommended: 400x300px"
                          />
                          <div>
                            <Label className="mb-2 block">Description (HTML)</Label>
                            <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={value.description.html}
                                onChange={(v) => handleUpdateValue(index, { ...value, description: { html: v } })}
                                placeholder="Value description"
                              />
                            </Suspense>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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