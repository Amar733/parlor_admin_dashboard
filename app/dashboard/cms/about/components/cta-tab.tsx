"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CTASection } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface CTATabProps {
  cta: CTASection;
  onChange: (cta: CTASection) => void;
}

export function CTATab({ cta, onChange }: CTATabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-teal-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle className="text-xl">Call to Action</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600" size="sm">
              <Edit className="h-4 w-4 mr-2 text-black" /> <span className="text-black">Edit CTA</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Heading</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: cta.heading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subheading</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: cta.subheading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">CTA Buttons Preview</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "Primary", config: cta.buttons.primary },
                { label: "Secondary", config: cta.buttons.secondary },
                { label: "Tertiary", config: cta.buttons.tertiary }
              ].map((btn, i) => (
                <div key={i} className={cn(
                  "flex-1 min-w-[200px] p-4 rounded-xl border-2 border-dashed transition-all duration-300",
                  btn.config?.enabled
                    ? "bg-teal-50/30 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/30"
                    : "bg-gray-50/50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800/30 opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {btn.label}
                    </span>
                    <Badge variant={btn.config?.enabled ? "default" : "secondary"} className="h-4 text-[9px] px-1.5">
                      {btn.config?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {btn.config?.text || <span className="text-gray-400 italic font-normal">No text</span>}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Target className="h-3 w-3 text-teal-500/50" />
                      <span>{btn.config?.chooseModuleToOpen || "No module selected"}</span>
                    </div>
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
            <DialogTitle>Edit Call to Action Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Heading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={cta.heading.html}
                  onChange={(value) => onChange({
                    ...cta,
                    heading: { html: value }
                  })}
                  placeholder="Ready to get started?"
                />
              </Suspense>
            </div>
            <div>
              <Label>Subheading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={cta.subheading.html}
                  onChange={(value) => onChange({
                    ...cta,
                    subheading: { html: value }
                  })}
                  placeholder="Join us today and experience the difference"
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
                      <Switch
                        checked={cta.buttons.primary.enabled}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, primary: { ...cta.buttons.primary, enabled: checked } } })}
                      />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input
                        value={cta.buttons.primary.text}
                        onChange={(e) => onChange({ ...cta, buttons: { ...cta.buttons, primary: { ...cta.buttons.primary, text: e.target.value } } })}
                        placeholder="Get Started"
                      />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select
                        value={cta.buttons.primary.chooseModuleToOpen || ""}
                        onValueChange={(value) => onChange({ ...cta, buttons: { ...cta.buttons, primary: { ...cta.buttons.primary, chooseModuleToOpen: value } } })}
                      >
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
                      <Switch
                        checked={cta.buttons.primary.showIcon}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, primary: { ...cta.buttons.primary, showIcon: checked } } })}
                      />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>

                {/* Secondary Button */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium mb-3">Secondary Button</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cta.buttons.secondary.enabled}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, secondary: { ...cta.buttons.secondary, enabled: checked } } })}
                      />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input
                        value={cta.buttons.secondary.text}
                        onChange={(e) => onChange({ ...cta, buttons: { ...cta.buttons, secondary: { ...cta.buttons.secondary, text: e.target.value } } })}
                        placeholder="Learn More"
                      />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select
                        value={cta.buttons.secondary.chooseModuleToOpen || ""}
                        onValueChange={(value) => onChange({ ...cta, buttons: { ...cta.buttons, secondary: { ...cta.buttons.secondary, chooseModuleToOpen: value } } })}
                      >
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
                      <Switch
                        checked={cta.buttons.secondary.showIcon}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, secondary: { ...cta.buttons.secondary, showIcon: checked } } })}
                      />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>

                {/* Tertiary Button */}
                <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium mb-3">Tertiary Button</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cta.buttons.tertiary?.enabled || false}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, tertiary: { enabled: checked, text: cta.buttons.tertiary?.text || "", showIcon: cta.buttons.tertiary?.showIcon || false, chooseModuleToOpen: cta.buttons.tertiary?.chooseModuleToOpen } } })}
                      />
                      <Label>Enabled</Label>
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input
                        value={cta.buttons.tertiary?.text || ""}
                        onChange={(e) => onChange({ ...cta, buttons: { ...cta.buttons, tertiary: { ...cta.buttons.tertiary, enabled: cta.buttons.tertiary?.enabled || false, text: e.target.value, showIcon: cta.buttons.tertiary?.showIcon || false } } })}
                        placeholder="Services"
                      />
                    </div>
                    <div>
                      <Label>Module</Label>
                      <Select
                        value={cta.buttons.tertiary?.chooseModuleToOpen || ""}
                        onValueChange={(value) => onChange({ ...cta, buttons: { ...cta.buttons, tertiary: { ...cta.buttons.tertiary, enabled: cta.buttons.tertiary?.enabled || false, text: cta.buttons.tertiary?.text || "", showIcon: cta.buttons.tertiary?.showIcon || false, chooseModuleToOpen: value } } })}
                      >
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
                      <Switch
                        checked={cta.buttons.tertiary?.showIcon || false}
                        onCheckedChange={(checked) => onChange({ ...cta, buttons: { ...cta.buttons, tertiary: { ...cta.buttons.tertiary, enabled: cta.buttons.tertiary?.enabled || false, text: cta.buttons.tertiary?.text || "", showIcon: checked } } })}
                      />
                      <Label>Show Icon</Label>
                    </div>
                  </div>
                </Card>
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