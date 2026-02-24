"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Briefcase, Plus, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { WhatWeDoSection, Service } from "../types";
import { ImageUpload } from "./image-upload";
import { getAssetUrl } from "@/lib/asset-utils";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(module => ({ default: module.RichTextEditor })));

const stripHtml = (html?: string) => (html || "").replace(/<[^>]*>?/gm, '');

interface WhatWeDoTabProps {
  whatWeDo: WhatWeDoSection;
  onChange: (whatWeDo: WhatWeDoSection) => void;
}

export function WhatWeDoTab({ whatWeDo, onChange }: WhatWeDoTabProps) {
  const [showModal, setShowModal] = useState(false);

  const handleAddService = () => {
    const newService: Service = {
      title: { html: "" },
      description: { html: "" },
      icon: ""
    };
    onChange({
      ...whatWeDo,
      services: [...whatWeDo.services, newService]
    });
  };

  const handleUpdateService = (index: number, service: Service) => {
    const newServices = [...whatWeDo.services];
    newServices[index] = service;
    onChange({
      ...whatWeDo,
      services: newServices
    });
  };

  const handleDeleteService = (index: number) => {
    const newServices = [...whatWeDo.services];
    newServices.splice(index, 1);
    onChange({
      ...whatWeDo,
      services: newServices
    });
  };

  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">What We Do</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Services
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Heading</Label>
              <div
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: whatWeDo.heading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subheading</Label>
              <div
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: whatWeDo.subheading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Services</Label>
                <Badge variant="secondary" className="text-sm">{whatWeDo.services.length} items</Badge>
              </div>
              <div className="grid gap-3 mt-2">
                {whatWeDo.services.map((service, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                    <div
                      className="font-semibold text-gray-900 dark:text-gray-100"
                      dangerouslySetInnerHTML={{ __html: service.title.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Title not set</span>" }}
                    />
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                      dangerouslySetInnerHTML={{ __html: service.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Description not set</span>" }}
                    />
                    {service.icon && (
                      <div className="mt-2 relative w-12 h-12 rounded-lg overflow-hidden border-2 border-green-300">
                        <Image
                          src={getAssetUrl(service.icon)}
                          alt={stripHtml(service.title.html) || "Service Image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {whatWeDo.services.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-500 italic border-2 border-dashed rounded-lg">
                    No services added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit What We Do Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Heading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={whatWeDo.heading.html}
                  onChange={(value) => onChange({
                    ...whatWeDo,
                    heading: { html: value }
                  })}
                  placeholder="Enter heading..."
                />
              </Suspense>
            </div>
            <div>
              <Label>Subheading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={whatWeDo.subheading.html}
                  onChange={(value) => onChange({
                    ...whatWeDo,
                    subheading: { html: value }
                  })}
                  placeholder="Enter subheading..."
                />
              </Suspense>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Services</h3>
                <Button
                  onClick={handleAddService}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Service
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {whatWeDo.services.map((service, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-4 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-sm overflow-hidden mb-2">
                    <AccordionTrigger className="hover:no-underline py-4 group">
                      <div className="flex items-center justify-between w-full pr-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center border border-green-100 dark:border-green-900/50 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            {service.icon ? (
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <Image
                                  src={getAssetUrl(service.icon)}
                                  alt="Icon"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <Briefcase className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-semibold text-base text-gray-900 dark:text-gray-100 line-clamp-1"
                              dangerouslySetInnerHTML={{ __html: stripHtml(service.title.html) || `Service #${index + 1}` }}
                            />
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              Edit details
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteService(index);
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
                                handleDeleteService(index);
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
                            value={service.icon}
                            onChange={(url) => handleUpdateService(index, { ...service, icon: url })}
                            label="Service Icon"
                            description="Recommended: 64x64px"
                          />
                          <div>
                            <Label className="mb-2 block">Title (HTML)</Label>
                            <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={service.title.html}
                                onChange={(value) => handleUpdateService(index, { ...service, title: { html: value } })}
                                placeholder="Service title"
                              />
                            </Suspense>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="mb-2 block">Description (HTML)</Label>
                            <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={service.description.html}
                                onChange={(value) => handleUpdateService(index, { ...service, description: { html: value } })}
                                placeholder="Service description"
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