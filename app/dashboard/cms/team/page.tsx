"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanitizeHtml } from "@/lib/sanitize";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  RefreshCcw,
  Users,
  Globe,
  Tag,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/rich-text-editor";
import { API_BASE_URL } from "@/config/api";
import Image from "next/image";
import { getAssetUrl } from "@/lib/asset-utils";
import { Switch } from "@/components/ui/switch";

import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface TeamHeaderData {
  page: string;
  section: string;
  data: {
    title: string;
    subtitle: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      slug: string;
      schemaMarkup?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface TeamMembersData {
  page: string;
  section: string;
  data: Array<{
    id: string;
    name: string;
    role: string;
    image: string;
    slug: string;
    title: string;
    short_description: string;
    description: string;
    keywords: string[];
    primaryButton?: {
      enabled: boolean;
      buttonText: string;
      chooseModuleToOpen: string;
      url?: string;
    };
    secondaryButton?: {
      enabled: boolean;
      buttonText: string;
      chooseModuleToOpen: string;
      url?: string;
    };
    tertiaryButton?: {
      enabled: boolean;
      buttonText: string;
      chooseModuleToOpen: string;
      url?: string;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const defaultHeaderData: TeamHeaderData = {
  page: "about",
  section: "teamHeader",
  data: {
    title: "",
    subtitle: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "team",
      schemaMarkup: "",
    },
  },
};

const defaultMembersData: TeamMembersData = {
  page: "about",
  section: "teamMembers",
  data: [],
};

export default function TeamPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [headerData, setHeaderData] =
    useState<TeamHeaderData>(defaultHeaderData);
  const [membersData, setMembersData] =
    useState<TeamMembersData>(defaultMembersData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, membersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/about/teamHeader/`),
        authFetch(`${API_BASE_URL}/api/cms/about/teamMembers/`),
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setIsEnable(res.data?.isEnable ?? true);
        const loadedData = res.data || { title: "", subtitle: "" };
        setHeaderData({
          page: res.page,
          section: res.section,
          data: {
            ...loadedData,
            seo: loadedData.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "team",
              schemaMarkup: "",
            },
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (membersRes.ok) {
        const res = await membersRes.json();
        setMembersData({
          page: res.page,
          section: res.section,
          data: (res.data || []).map((member: any) => ({
            ...member,
            primaryButton: member.primaryButton || {
              enabled: true,
              buttonText: "Know More",
              chooseModuleToOpen: "services",
            },
            secondaryButton: member.secondaryButton || {
              enabled: true,
              buttonText: "Contact Us",
              chooseModuleToOpen: "call",
            },
            tertiaryButton: member.tertiaryButton || {
              enabled: true,
              buttonText: "Book Appointment",
              chooseModuleToOpen: "appointment",
            },
          })),
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch team data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current && !isLoading) {
      handleSave();
    }
  }, [isEnable]);

  const handleHeaderChange = (
    field: keyof TeamHeaderData["data"],
    value: string
  ) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        [field]: value,
      },
    });
  };

  const handleSave = async (
    currentHeaderData = headerData,
    currentMembersData = membersData
  ) => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const [headerRes, membersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/about/teamHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...currentHeaderData,
            data: { ...currentHeaderData.data, isEnable },
          }),
        }),
        authFetch(`${API_BASE_URL}/api/cms/about/teamMembers/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentMembersData),
        }),
      ]);

      if (headerRes.ok && membersRes.ok) {
        toast({ title: "Team section saved successfully" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save team data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = () => {
    setEditingMember({
      id: "",
      name: "",
      role: "",
      image: "",
      slug: "",
      title: "",
      short_description: "",
      description: "",
      keywords: [],
      primaryButton: {
        enabled: true,
        buttonText: "Know More",
        chooseModuleToOpen: "services",
      },
      secondaryButton: {
        enabled: false,
        buttonText: "Learn More",
        chooseModuleToOpen: "contact",
      },
    });
    setShowMemberModal(true);
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  const handleSaveMember = () => {
    if (!editingMember?.name.trim()) return;

    let updatedMembersData;

    if (editingMember.id) {
      updatedMembersData = {
        ...membersData,
        data: membersData.data.map((m) =>
          m.id === editingMember.id ? editingMember : m
        ),
      };
    } else {
      const newMember = {
        ...editingMember,
        id: Date.now().toString(),
      };
      updatedMembersData = {
        ...membersData,
        data: [...membersData.data, newMember],
      };
    }

    setMembersData(updatedMembersData);
    setShowMemberModal(false);
    setEditingMember(null);
    handleSave(headerData, updatedMembersData);
  };

  const handleDeleteMember = (id: string) => {
    const updatedMembersData = {
      ...membersData,
      data: membersData.data.filter((m) => m.id !== id),
    };
    setMembersData(updatedMembersData);
    handleSave(headerData, updatedMembersData);
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !editingMember.keywords.includes(keyword.trim())) {
      setEditingMember((prev: any) => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()],
      }));
    }
  };

  const removeKeyword = (index: number) => {
    setEditingMember((prev: any) => ({
      ...prev,
      keywords: prev.keywords.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleButtonChange = (
    buttonType: "primaryButton" | "secondaryButton" | "tertiaryButton",
    field: string,
    value: string | boolean
  ) => {
    if (!editingMember) return;
    setEditingMember({
      ...editingMember,
      [buttonType]: {
        ...editingMember[buttonType],
        [field]: value,
      },
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!editingMember) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setEditingMember((prev: any) => ({ ...prev, image: url }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Team Management
              </h1>
              <p className="text-purple-100">
                Manage your team members and section settings
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <Switch
                  checked={isEnable}
                  onCheckedChange={setIsEnable}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button
                variant="secondary"
                onClick={loadData}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 border"
              >
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {headerData.page}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Team Section
        </Badge>
        {headerData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong>{" "}
            {new Date(headerData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Header Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Team Header
              </CardTitle>
              <div
                className="text-sm text-muted-foreground mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.title || "No title set") }}
              />
            </div>
            <Button onClick={() => setShowHeaderModal(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Header
            </Button>
          </div>
        </CardHeader>
        {headerData.data.subtitle && (
          <CardContent>
            <div
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.subtitle) }}
            />
          </CardContent>
        )}
      </Card>

      {/* Team Members Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Team Members
            </CardTitle>
            <Button
              onClick={handleAddMember}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {membersData.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members added yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membersData.data.map((member) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  {member.image && member.image.trim() !== "" && (
                    <div className="mb-3">
                      <Image
                        src={getAssetUrl(member.image)}
                        alt={member.name}
                        width={300}
                        height={256}
                        className="w-full h-64 rounded-lg object-cover border"
                        onError={() => {
                          console.log("Image failed to load:", member.image);
                        }}
                        onLoad={() => {
                          console.log(
                            "Image loaded successfully:",
                            member.image
                          );
                        }}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Required: 500x550px
                      </p>
                    </div>
                  )}
                  {!member.image && (
                    <div className="mb-3">
                      <div className="w-full h-64 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500 text-sm">
                        No Image
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Required: 500x550px
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </h4>
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.role) }}
                    />
                    {member.short_description && (
                      <div
                        className="text-xs text-gray-500 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.short_description) }}
                      />
                    )}
                    {member.primaryButton?.enabled && (
                      <p className="text-xs text-blue-600">
                        Primary: {member.primaryButton.buttonText}
                      </p>
                    )}
                    {member.secondaryButton?.enabled && (
                      <p className="text-xs text-green-600">
                        Secondary: {member.secondaryButton.buttonText}
                      </p>
                    )}
                    {member.tertiaryButton?.enabled && (
                      <p className="text-xs text-orange-600">
                        Tertiary: {member.tertiaryButton.buttonText}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMember(member)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header Edit Modal */}
      <Dialog open={showHeaderModal} onOpenChange={setShowHeaderModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Page Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <RichTextEditor
                value={headerData.data.title}
                onChange={(value) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, title: value }
                })}
                placeholder="Why ClinicPro+ for All Doctors"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <RichTextEditor
                value={headerData.data.subtitle}
                onChange={(value) => setHeaderData({
                  ...headerData,
                  data: { ...headerData.data, subtitle: value }
                })}
                placeholder="ClinicPro+ : Robust Solution for own Clinic Practice..."
              />
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>SEO Title</Label>
                    <Input
                      value={headerData.data.seo.title}
                      onChange={(e) => setHeaderData({
                        ...headerData,
                        data: { ...headerData.data, seo: { ...headerData.data.seo, title: e.target.value } }
                      })}
                      placeholder="Our Team - Company Name"
                    />
                  </div>
                  <div>
                    <Label>SEO Slug</Label>
                    <Input
                      value={headerData.data.seo.slug}
                      onChange={(e) => setHeaderData({
                        ...headerData,
                        data: { ...headerData.data, seo: { ...headerData.data.seo, slug: e.target.value } }
                      })}
                      placeholder="team"
                    />
                  </div>
                </div>
                <div>
                  <Label>SEO Description</Label>
                  <Textarea
                    value={headerData.data.seo.description}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: { ...headerData.data, seo: { ...headerData.data.seo, description: e.target.value } }
                    })}
                    placeholder="Meet our team of experts"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add keyword"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (keywordInput.trim() && !headerData.data.seo.keywords.includes(keywordInput.trim())) {
                            setHeaderData({
                              ...headerData,
                              data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: [...headerData.data.seo.keywords, keywordInput.trim()] } }
                            });
                            setKeywordInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (keywordInput.trim() && !headerData.data.seo.keywords.includes(keywordInput.trim())) {
                          setHeaderData({
                            ...headerData,
                            data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: [...headerData.data.seo.keywords, keywordInput.trim()] } }
                          });
                          setKeywordInput("");
                        }
                      }}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {headerData.data.seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = headerData.data.seo.keywords.filter((_, i) => i !== index);
                            setHeaderData({
                              ...headerData,
                              data: { ...headerData.data, seo: { ...headerData.data.seo, keywords: newKeywords } }
                            });
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <SchemaMarkupEditor
                  value={headerData.data.seo.schemaMarkup || ""}
                  onChange={(value) => setHeaderData({
                    ...headerData,
                    data: { ...headerData.data, seo: { ...headerData.data.seo, schemaMarkup: value } }
                  })}
                  onValidationChange={setIsSchemaValid}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => { setShowHeaderModal(false); handleSave(); }} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Header
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Modal */}
      <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember?.id ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="memberName">Name</Label>
                  <Input
                    id="memberName"
                    value={editingMember?.name || ""}
                    onChange={(e) =>
                      setEditingMember((prev: any) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter member name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="memberSlug">Slug</Label>
                  <Input
                    id="memberSlug"
                    value={editingMember?.slug || ""}
                    onChange={(e) =>
                      setEditingMember((prev: any) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    placeholder="member-slug"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="memberTitle">Title</Label>
                  <RichTextEditor
                    value={editingMember?.title || ""}
                    onChange={(value) =>
                      setEditingMember((prev: any) => ({
                        ...prev,
                        title: value,
                      }))
                    }
                    placeholder="Enter title"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="memberImage">Image</Label>
                <div className="bg-muted/30 border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border flex-shrink-0">
                      {editingMember?.image ? (
                        <Image
                          src={getAssetUrl(editingMember.image)}
                          alt="Preview"
                          fill
                          className="object-cover"
                          onError={() => console.log("Preview failed")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Users className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Recommended: 500x550px</p>
                        <div className="flex gap-2">
                          <Input
                            id="memberImage"
                            value={editingMember?.image || ""}
                            onChange={(e) =>
                              setEditingMember((prev: any) => ({
                                ...prev,
                                image: e.target.value,
                              }))
                            }
                            placeholder="/uploads/image.jpg"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImage}
                        />
                        <Button
                          variant="outline"
                          disabled={uploadingImage}
                          type="button"
                          className="w-full"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" /> Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="memberRole">Role</Label>
                <RichTextEditor
                  value={editingMember?.role || ""}
                  onChange={(value) =>
                    setEditingMember((prev: any) => ({
                      ...prev,
                      role: value,
                    }))
                  }
                  placeholder="Enter member role"
                />
              </div>
              <div>
                <Label htmlFor="memberShortDescription">Short Description</Label>
                <RichTextEditor
                  value={editingMember?.short_description || ""}
                  onChange={(value) =>
                    setEditingMember((prev: any) => ({
                      ...prev,
                      short_description: value,
                    }))
                  }
                  placeholder="Enter short description"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="memberDescription" className="mb-2 block">Full Description</Label>
              <RichTextEditor
                value={editingMember?.description || ""}
                onChange={(value) =>
                  setEditingMember((prev: any) => ({
                    ...prev,
                    description: value,
                  }))
                }
                placeholder="Enter description with rich formatting"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Primary Button
                    </CardTitle>
                    <Switch
                      checked={editingMember?.primaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange("primaryButton", "enabled", checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={editingMember?.primaryButton?.buttonText || ""}
                      onChange={(e) =>
                        handleButtonChange(
                          "primaryButton",
                          "buttonText",
                          e.target.value,
                        )
                      }
                      placeholder="Book Appointment"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={
                          editingMember?.primaryButton?.chooseModuleToOpen || ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "primaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">External Link</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingMember?.primaryButton?.chooseModuleToOpen === "url" && (
                      <div className="space-y-2">
                        <Label>External URL</Label>
                        <Input
                          value={editingMember?.primaryButton?.url || ""}
                          onChange={(e) =>
                            handleButtonChange(
                              "primaryButton",
                              "url",
                              e.target.value,
                            )
                          }
                          placeholder="https://"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Secondary Button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Secondary Button
                    </CardTitle>
                    <Switch
                      checked={editingMember?.secondaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange(
                          "secondaryButton",
                          "enabled",
                          checked,
                        )
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={editingMember?.secondaryButton?.buttonText || ""}
                      onChange={(e) =>
                        handleButtonChange(
                          "secondaryButton",
                          "buttonText",
                          e.target.value,
                        )
                      }
                      placeholder="Learn More"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={
                          editingMember?.secondaryButton?.chooseModuleToOpen ||
                          ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "secondaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">External Link</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingMember?.secondaryButton?.chooseModuleToOpen === "url" && (
                      <div className="space-y-2">
                        <Label>External URL</Label>
                        <Input
                          value={editingMember?.secondaryButton?.url || ""}
                          onChange={(e) =>
                            handleButtonChange(
                              "secondaryButton",
                              "url",
                              e.target.value,
                            )
                          }
                          placeholder="https://"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tertiary Button */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Tertiary Button
                    </CardTitle>
                    <Switch
                      checked={editingMember?.tertiaryButton?.enabled}
                      onCheckedChange={(checked) =>
                        handleButtonChange("tertiaryButton", "enabled", checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input
                      value={editingMember?.tertiaryButton?.buttonText || ""}
                      onChange={(e) =>
                        handleButtonChange(
                          "tertiaryButton",
                          "buttonText",
                          e.target.value,
                        )
                      }
                      placeholder="View Profile"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={
                          editingMember?.tertiaryButton?.chooseModuleToOpen ||
                          ""
                        }
                        onValueChange={(value) =>
                          handleButtonChange(
                            "tertiaryButton",
                            "chooseModuleToOpen",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="demo">Book Demo</SelectItem>
                          <SelectItem value="call">Call Us</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">External Link</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editingMember?.tertiaryButton?.chooseModuleToOpen === "url" && (
                      <div className="space-y-2">
                        <Label>External URL</Label>
                        <Input
                          value={editingMember?.tertiaryButton?.url || ""}
                          onChange={(e) =>
                            handleButtonChange(
                              "tertiaryButton",
                              "url",
                              e.target.value,
                            )
                          }
                          placeholder="https://"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Label>Keywords</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2 p-3 bg-muted/30 rounded-lg border min-h-[50px]">
                {editingMember?.keywords?.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">No keywords added</span>
                )}
                {editingMember?.keywords?.map((keyword: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 pl-2 pr-1 py-1"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-1 text-muted-foreground hover:text-red-500 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type keyword and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addKeyword(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="max-w-md"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowMemberModal(false);
                setEditingMember(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMember}
              className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
            >
              {editingMember?.id ? "Update Member" : "Add Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save team settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="min-w-[160px] bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
