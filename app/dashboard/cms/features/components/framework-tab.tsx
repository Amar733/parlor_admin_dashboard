"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Layers, Plus, Edit, Trash2, MoveUp, MoveDown, ChevronDown, ChevronUp, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FrameworkStep, SectionHeader, FrameworkFeature } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface FrameworkTabProps {
  framework: FrameworkStep[];
  sectionHeader?: SectionHeader;
  onChange: (framework: FrameworkStep[]) => void;
  onHeaderChange: (header: SectionHeader) => void;
}

export function FrameworkTab({ framework, sectionHeader, onChange, onHeaderChange }: FrameworkTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FrameworkStep | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const defaultHeader: SectionHeader = {
    heading: { html: 'Our <span style="color: #3b82f6">3-Phase Growth</span> Framework' },
    subheading: { html: 'A systematic approach to building your digital presence and attracting more patients' }
  };

  const header = sectionHeader || defaultHeader;

  const handleAdd = () => {
    setEditing({
      id: Date.now().toString(),
      enabled: true,
      phase: "",
      tagline: "",
      youtubeUrl: "",
      features: [],
      result: "",
    });
    setShowModal(true);
  };

  const handleEdit = (step: FrameworkStep) => {
    setEditing(step);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editing?.phase.trim()) return;
    const isNew = !framework.find((f) => f.id === editing.id);
    onChange(isNew ? [...framework, editing] : framework.map((f) => (f.id === editing.id ? editing : f)));
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onChange(framework.filter((f) => f.id !== id));
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = framework.findIndex((f) => f.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === framework.length - 1)) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newFramework = [...framework];
    [newFramework[index], newFramework[newIndex]] = [newFramework[newIndex], newFramework[index]];
    onChange(newFramework);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const addFeature = () => {
    if (!editing) return;
    setEditing({ ...editing, features: [...editing.features, { title: "", description: "" }] });
  };

  const updateFeature = (index: number, field: keyof FrameworkFeature, value: string) => {
    if (!editing) return;
    const newFeatures = [...editing.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setEditing({ ...editing, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    if (!editing) return;
    setEditing({ ...editing, features: editing.features.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Section Header
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Section Heading</Label>
            <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
              <RichTextEditor
                value={header.heading.html}
                onChange={(value) => onHeaderChange({ ...header, heading: { html: value } })}
                placeholder="Enter section heading"
              />
            </Suspense>
          </div>
          <div>
            <Label>Section Subheading</Label>
            <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
              <RichTextEditor
                value={header.subheading.html}
                onChange={(value) => onHeaderChange({ ...header, subheading: { html: value } })}
                placeholder="Enter section subheading"
              />
            </Suspense>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Framework Steps ({framework.length})
            </CardTitle>
            <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Framework Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {framework.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-1">No framework steps added yet</p>
              <Button onClick={handleAdd} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Framework Step
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {framework.map((step, index) => (
                <Card key={step.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMove(step.id, "up")} disabled={index === 0}>
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-center text-muted-foreground">{index + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMove(step.id, "down")} disabled={index === framework.length - 1}>
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleExpand(step.id)} className="p-0 h-6 w-6">
                              {expanded.has(step.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <div>
                              <h3 className="font-medium text-lg">{step.phase}</h3>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{step.tagline}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(step)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(step.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {expanded.has(step.id) && (
                          <div className="pl-9 mt-4 space-y-3">
                            {step.youtubeUrl && (
                              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                <p className="text-sm"><strong>YouTube:</strong> {step.youtubeUrl}</p>
                              </div>
                            )}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                              <p className="text-sm"><strong>Result:</strong> {step.result || "Not set"}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">Features ({step.features.length})</h4>
                              <div className="space-y-2">
                                {step.features.map((feature, idx) => (
                                  <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <h5 className="font-medium text-sm">{feature.title}</h5>
                                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                                  </div>
                                ))}
                                {step.features.length === 0 && <p className="text-sm text-muted-foreground italic">No features added</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing && framework.find((f) => f.id === editing.id) ? "Edit Framework Step" : "Add Framework Step"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Phase</Label>
                <Input value={editing.phase} onChange={(e) => setEditing({ ...editing, phase: e.target.value })} placeholder="Digital Presence" />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} placeholder="Be Visible. Be Consistent. Be Trusted" />
              </div>
              <div>
                <Label>YouTube URL</Label>
                <Input value={editing.youtubeUrl || ""} onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })} placeholder="https://youtube.com/embed/..." />
              </div>
              <div>
                <Label>Result</Label>
                <Textarea value={editing.result} onChange={(e) => setEditing({ ...editing, result: e.target.value })} placeholder="Your clinic looks digitally strong..." rows={2} />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">Features ({editing.features.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-1" /> Add Feature
                  </Button>
                </div>
                <div className="space-y-3">
                  {editing.features.map((feature, index) => (
                    <Card key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input value={feature.title} onChange={(e) => updateFeature(index, "title", e.target.value)} placeholder="Feature title" className="bg-white dark:bg-gray-900" />
                          <Textarea value={feature.description} onChange={(e) => updateFeature(index, "description", e.target.value)} placeholder="Feature description" rows={2} className="bg-white dark:bg-gray-900" />
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {editing.features.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                      No features added yet. Click "Add Feature" to get started.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editing && framework.find((f) => f.id === editing.id) ? "Update" : "Add"} Framework Step
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
