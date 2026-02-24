"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Edit, Trash2, MoveUp, MoveDown, Upload, Loader2, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Challenge, SectionHeader } from "../types";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface ChallengesTabProps {
  challenges: Challenge[];
  sectionHeader?: SectionHeader;
  onChange: (challenges: Challenge[]) => void;
  onHeaderChange: (header: SectionHeader) => void;
}

export function ChallengesTab({ challenges, sectionHeader, onChange, onHeaderChange }: ChallengesTabProps) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [uploading, setUploading] = useState(false);

  const defaultHeader: SectionHeader = {
    heading: { html: 'Doctors are Facing These <span style="color: #3b82f6">Challenges</span>' },
    subheading: { html: 'We understand the unique struggles healthcare professionals face in the digital landscape' }
  };

  const header = sectionHeader || defaultHeader;

  const handleAdd = () => {
    setEditing({
      id: Date.now().toString(),
      enabled: true,
      title: "",
      description: "",
      image: "",
    });
    setShowModal(true);
  };

  const handleEdit = (challenge: Challenge) => {
    setEditing(challenge);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editing?.title.trim()) return;
    const isNew = !challenges.find((c) => c.id === editing.id);
    onChange(isNew ? [...challenges, editing] : challenges.map((c) => (c.id === editing.id ? editing : c)));
    setShowModal(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onChange(challenges.filter((c) => c.id !== id));
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = challenges.findIndex((c) => c.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === challenges.length - 1)) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newChallenges = [...challenges];
    [newChallenges[index], newChallenges[newIndex]] = [newChallenges[newIndex], newChallenges[index]];
    onChange(newChallenges);
  };

  const handleImageUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await authFetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();
      setEditing({ ...editing, image: url });
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(false);
    }
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
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Challenges ({challenges.length})
            </CardTitle>
            <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Challenge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-1">No challenges added yet</p>
              <Button onClick={handleAdd} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Challenge
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge, index) => (
                <Card key={challenge.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMove(challenge.id, "up")} disabled={index === 0}>
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-center text-muted-foreground">{index + 1}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMove(challenge.id, "down")} disabled={index === challenges.length - 1}>
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                            {challenge.image && (
                              <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border">
                                <Image src={getAssetUrl(challenge.image)} alt={challenge.title} fill className="object-cover" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(challenge)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(challenge.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing && challenges.find((c) => c.id === editing.id) ? "Edit Challenge" : "Add Challenge"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Tired of Traditional Marketing" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Describe the challenge..." rows={3} />
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="Image URL" className="flex-1" />
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
                    <Button variant="outline" disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {editing.image && (
                  <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border">
                    <Image src={getAssetUrl(editing.image)} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {editing && challenges.find((c) => c.id === editing.id) ? "Update" : "Add"} Challenge
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
