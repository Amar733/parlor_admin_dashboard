"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Edit, Target, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HeroSection } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface HeroTabProps {
  hero: HeroSection;
  onChange: (hero: HeroSection) => void;
}

export function HeroTab({ hero, onChange }: HeroTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Hero Section
            </CardTitle>
            <Button onClick={() => setShowModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Heading</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border mt-1 min-h-[60px]" dangerouslySetInnerHTML={{ __html: hero.heading.html || "<span class='text-gray-400'>Not set</span>" }} />
            </div>
            <div>
              <Label className="text-sm font-medium">Subheading</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border mt-1 min-h-[60px]" dangerouslySetInnerHTML={{ __html: hero.subheading.html || "<span class='text-gray-400'>Not set</span>" }} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-semibold">CTA Buttons Preview</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Primary", config: hero.cta.primary },
                { label: "Secondary", config: hero.cta.secondary },
                { label: "Tertiary", config: hero.cta.tertiary }
              ].map((btn, i) => (
                <div key={i} className={cn(
                  "flex-1 min-w-[200px] p-3 rounded-lg border-2 border-dashed transition-colors",
                  btn.config?.enabled
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                    : "bg-gray-50/50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800/30 opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {btn.label}
                    </span>
                    <Badge variant={btn.config?.enabled ? "default" : "secondary"} className="h-4 text-[9px] px-1.5">
                      {btn.config?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate">
                      {btn.config?.text || <span className="text-gray-400 italic font-normal">No text</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" />
                      {btn.config?.chooseModuleToOpen || "No module selected"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hero Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Heading</Label>
              <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                <RichTextEditor
                  value={hero.heading.html}
                  onChange={(value) => onChange({ ...hero, heading: { html: value } })}
                  placeholder="Enter heading"
                />
              </Suspense>
            </div>
            <div>
              <Label>Subheading</Label>
              <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                <RichTextEditor
                  value={hero.subheading.html}
                  onChange={(value) => onChange({ ...hero, subheading: { html: value } })}
                  placeholder="Enter subheading"
                />
              </Suspense>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">CTA Buttons</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Primary Button */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium mb-3">Primary Button</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.primary.enabled} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, primary: { ...hero.cta.primary, enabled: checked } } })} />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input value={hero.cta.primary.text} onChange={(e) => onChange({ ...hero, cta: { ...hero.cta, primary: { ...hero.cta.primary, text: e.target.value } } })} placeholder="Learn More" />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select value={hero.cta.primary.chooseModuleToOpen || ""} onValueChange={(value) => onChange({ ...hero, cta: { ...hero.cta, primary: { ...hero.cta.primary, chooseModuleToOpen: value } } })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Book Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.primary.showIcon} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, primary: { ...hero.cta.primary, showIcon: checked } } })} />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>

                {/* Secondary Button */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium mb-3">Secondary Button</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.secondary.enabled} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, secondary: { ...hero.cta.secondary, enabled: checked } } })} />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input value={hero.cta.secondary.text} onChange={(e) => onChange({ ...hero, cta: { ...hero.cta, secondary: { ...hero.cta.secondary, text: e.target.value } } })} placeholder="Contact Us" />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select value={hero.cta.secondary.chooseModuleToOpen || ""} onValueChange={(value) => onChange({ ...hero, cta: { ...hero.cta, secondary: { ...hero.cta.secondary, chooseModuleToOpen: value } } })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Book Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.secondary.showIcon} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, secondary: { ...hero.cta.secondary, showIcon: checked } } })} />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>

                {/* Tertiary Button */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium mb-3">Tertiary Button</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.tertiary?.enabled || false} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, tertiary: { enabled: checked, text: hero.cta.tertiary?.text || "", showIcon: hero.cta.tertiary?.showIcon || false, chooseModuleToOpen: hero.cta.tertiary?.chooseModuleToOpen } } })} />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input value={hero.cta.tertiary?.text || ""} onChange={(e) => onChange({ ...hero, cta: { ...hero.cta, tertiary: { ...hero.cta.tertiary, enabled: hero.cta.tertiary?.enabled || false, text: e.target.value, showIcon: hero.cta.tertiary?.showIcon || false } } })} placeholder="Services" />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select value={hero.cta.tertiary?.chooseModuleToOpen || ""} onValueChange={(value) => onChange({ ...hero, cta: { ...hero.cta, tertiary: { ...hero.cta.tertiary, enabled: hero.cta.tertiary?.enabled || false, text: hero.cta.tertiary?.text || "", showIcon: hero.cta.tertiary?.showIcon || false, chooseModuleToOpen: value } } })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Book Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email Us</SelectItem>
                          <SelectItem value="url">External URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={hero.cta.tertiary?.showIcon || false} onCheckedChange={(checked) => onChange({ ...hero, cta: { ...hero.cta, tertiary: { ...hero.cta.tertiary, enabled: hero.cta.tertiary?.enabled || false, text: hero.cta.tertiary?.text || "", showIcon: checked } } })} />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}