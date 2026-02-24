"use client";

import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Users, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { TeamsSection, TeamMember } from "../types";
import { ImageUpload } from "./image-upload";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(module => ({ default: module.RichTextEditor })));

const stripHtml = (html?: string) => (html || "").replace(/<[^>]*>?/gm, '');

interface TeamsTabProps {
  teams: TeamsSection;
  onChange: (teams: TeamsSection) => void;
}

export function TeamsTab({ teams, onChange }: TeamsTabProps) {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const handleAddMember = () => {
    const newMember: TeamMember = {
      image: "",
      title: { html: "" },
      description: { html: "" }
    };
    onChange({
      ...teams,
      list: [...teams.list, newMember]
    });
  };

  const handleUpdateMember = (index: number, member: TeamMember) => {
    const newList = [...teams.list];
    newList[index] = member;
    onChange({
      ...teams,
      list: newList
    });
  };

  const handleDeleteMember = (index: number) => {
    const newList = [...teams.list];
    newList.splice(index, 1);
    onChange({
      ...teams,
      list: newList
    });
  };


  return (
    <>
      <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl">Teams</CardTitle>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Teams
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Heading</Label>
            <div
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 mb-6 text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: teams.heading.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Not set</span>" }}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Team Members</Label>
              <Badge variant="secondary" className="text-sm">{teams.list.length} members</Badge>
            </div>
            <div className="grid gap-3 mt-2">
              {teams.list.map((member, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
                  <div
                    className="font-semibold text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: member.title.html || "<span class='text-gray-500 dark:text-gray-500 italic'>Untitled</span>" }}
                  />
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                    dangerouslySetInnerHTML={{ __html: member.description.html || "<span class='text-gray-500 dark:text-gray-500 italic'>No description</span>" }}
                  />
                  {member.image && (
                    <div className="mt-2 relative w-12 h-12 rounded-full overflow-hidden border-2 border-orange-300">
                      <Image
                        src={getAssetUrl(member.image)}
                        alt={stripHtml(member.title.html) || "Team Member Image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              {teams.list.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-500 italic border-2 border-dashed rounded-lg">
                  No team members added yet
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teams Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Heading (HTML)</Label>
              <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                <RichTextEditor
                  value={teams.heading.html}
                  onChange={(value) => onChange({
                    ...teams,
                    heading: { html: value }
                  })}
                  placeholder="Enter heading..."
                />
              </Suspense>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Team Members</h3>
                <Button
                  onClick={handleAddMember}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Member
                </Button>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                {teams.list.map((member, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-4 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-sm overflow-hidden mb-2">
                    <AccordionTrigger className="hover:no-underline py-4 group">
                      <div className="flex items-center justify-between w-full pr-6">
                        <div className="flex items-center gap-4 text-left">
                          <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center border border-orange-100 dark:border-orange-900/50 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            {member.image ? (
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <Image
                                  src={getAssetUrl(member.image)}
                                  alt="Icon"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <Users className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-semibold text-base text-gray-900 dark:text-gray-100 line-clamp-1"
                              dangerouslySetInnerHTML={{ __html: stripHtml(member.title.html) || `Member #${index + 1}` }}
                            />
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                              Edit details
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(index);
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
                                handleDeleteMember(index);
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
                            value={member.image}
                            onChange={(url) => handleUpdateMember(index, { ...member, image: url })}
                            label="Member Image"
                            description="Recommended: 300x300px"
                          />
                          <div>
                            <Label className="mb-2 block">Title (HTML)</Label>
                            <Suspense fallback={<div className="h-20 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={member.title.html}
                                onChange={(value) => handleUpdateMember(index, { ...member, title: { html: value } })}
                                placeholder="Member title"
                              />
                            </Suspense>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="mb-2 block">Description (HTML)</Label>
                            <Suspense fallback={<div className="h-32 border rounded-md animate-pulse bg-muted" />}>
                              <RichTextEditor
                                value={member.description.html}
                                onChange={(value) => handleUpdateMember(index, { ...member, description: { html: value } })}
                                placeholder="Member description"
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