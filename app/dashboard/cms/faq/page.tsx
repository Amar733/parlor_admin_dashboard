"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, HelpCircle, Plus, Trash2, Eye, EyeOff, Globe, Tag, Upload, Edit, X } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml } from "@/lib/sanitize";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface HeaderData {
  isEnable?: boolean;
  title: string;
  subtitle: string;
  image: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup?: string;
  };
}

interface FAQData {
  page: string;
  section: string;
  data: HeaderData | FAQ[];
  createdAt?: string;
  updatedAt?: string;
}

const defaultHeader: HeaderData = {
  title: "",
  subtitle: "",
  image: "",
  seo: {
    title: "",
    description: "",
    keywords: [],
    slug: "faq",
    schemaMarkup: "",
  },
};

export default function FAQPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [headerData, setHeaderData] = useState<FAQData>({
    page: "home",
    section: "faqHeader",
    data: defaultHeader,
  });

  const [faqsData, setFaqsData] = useState<FAQData>({
    page: "home",
    section: "faqs",
    data: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, faqsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/faqHeader/`),
        authFetch(`${API_BASE_URL}/api/cms/home/faqs/`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        const loadedData = { ...defaultHeader, ...res.data, isEnable: res.data?.isEnable ?? true };
        setHeaderData({
          page: res.page,
          section: res.section,
          data: {
            ...loadedData,
            seo: loadedData.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "faq",
              schemaMarkup: "",
            },
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (faqsRes.ok) {
        const res = await faqsRes.json();
        setFaqsData({
          page: res.page,
          section: res.section,
          data: res.data || [],
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch FAQ data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHeaderChange = (field: keyof HeaderData, value: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...(headerData.data as HeaderData),
        [field]: value
      }
    });
  };

  const handleToggleChange = async (checked: boolean) => {
    const updatedHeaderData = {
      ...headerData,
      data: {
        ...(headerData.data as HeaderData),
        isEnable: checked
      }
    };
    setHeaderData(updatedHeaderData);

    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/faqHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedHeaderData),
      });

      if (response.ok) {
        toast({ title: `FAQ section ${checked ? 'enabled' : 'disabled'} successfully` });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update section status.",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleHeaderChange("image", url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFAQ = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: "",
      answer: "",
    };
    setFaqsData({
      ...faqsData,
      data: [...(faqsData.data as FAQ[]), newFAQ]
    });
  };

  const handleFAQChange = (id: string, field: keyof FAQ, value: string) => {
    setFaqsData({
      ...faqsData,
      data: (faqsData.data as FAQ[]).map((faq) =>
        faq.id === id ? { ...faq, [field]: value } : faq
      )
    });
  };

  const handleRemoveFAQ = (id: string) => {
    setFaqsData({
      ...faqsData,
      data: (faqsData.data as FAQ[]).filter((faq) => faq.id !== id)
    });
  };

  const handleSave = async () => {
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
      const [headerRes, faqsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/home/faqHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(headerData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/home/faqs/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(faqsData),
        })
      ]);

      if (headerRes.ok && faqsRes.ok) {
        toast({ title: "FAQ section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save FAQ data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const headerContent = headerData.data as HeaderData;
  const faqsList = faqsData.data as FAQ[];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FAQ CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage frequently asked questions and header content
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={(headerData.data as HeaderData).isEnable ?? true}
                onCheckedChange={handleToggleChange}
              />
              <span className="text-sm font-medium">Section Enabled</span>
            </div>
            <Button variant="outline" onClick={loadData} className="bg-white dark:bg-gray-800">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
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
          FAQ Section
        </Badge>
        {headerData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(headerData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Header Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                FAQ Header Settings
              </CardTitle>
              <div
                className="text-sm text-muted-foreground mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerContent.title || "No title set") }}
              />
            </div>
            <Button onClick={() => setShowHeaderModal(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Header
            </Button>
          </div>
        </CardHeader>
        {headerContent.subtitle && (
          <CardContent>
            <div
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerContent.subtitle) }}
            />
          </CardContent>
        )}
      </Card>

      {/* Header Edit Modal */}
      <Dialog open={showHeaderModal} onOpenChange={setShowHeaderModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ Page Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <RichTextEditor
                value={headerContent.title}
                onChange={(value) => handleHeaderChange("title", value)}
                placeholder="Frequently Asked Questions"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <RichTextEditor
                value={headerContent.subtitle}
                onChange={(value) => handleHeaderChange("subtitle", value)}
                placeholder="Find answer to common questions about our Services, Appointments & Policies."
              />
            </div>
            <div>
              <Label>Image</Label>
              <p className="text-xs text-muted-foreground mb-2">Recommended: 500x600px</p>
              <div className="flex gap-2">
                <Input
                  value={headerContent.image}
                  onChange={(e) => handleHeaderChange("image", e.target.value)}
                  placeholder="/uploads/faq-image.jpg"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button variant="outline" disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {headerContent.image && (
                <div className="mt-2">
                  <Image
                    src={getAssetUrl(headerContent.image)}
                    alt="Preview"
                    width={200}
                    height={240}
                    className="w-48 h-56 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>SEO Title</Label>
                    <Input
                      value={headerContent.seo.title}
                      onChange={(e) => setHeaderData({
                        ...headerData,
                        data: { ...headerContent, seo: { ...headerContent.seo, title: e.target.value } }
                      })}
                      placeholder="FAQ - Company Name"
                    />
                  </div>
                  <div>
                    <Label>SEO Slug</Label>
                    <Input
                      value={headerContent.seo.slug}
                      onChange={(e) => setHeaderData({
                        ...headerData,
                        data: { ...headerContent, seo: { ...headerContent.seo, slug: e.target.value } }
                      })}
                      placeholder="faq"
                    />
                  </div>
                </div>
                <div>
                  <Label>SEO Description</Label>
                  <Textarea
                    value={headerContent.seo.description}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: { ...headerContent, seo: { ...headerContent.seo, description: e.target.value } }
                    })}
                    placeholder="Find answers to frequently asked questions"
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
                          if (keywordInput.trim() && !headerContent.seo.keywords.includes(keywordInput.trim())) {
                            setHeaderData({
                              ...headerData,
                              data: { ...headerContent, seo: { ...headerContent.seo, keywords: [...headerContent.seo.keywords, keywordInput.trim()] } }
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
                        if (keywordInput.trim() && !headerContent.seo.keywords.includes(keywordInput.trim())) {
                          setHeaderData({
                            ...headerData,
                            data: { ...headerContent, seo: { ...headerContent.seo, keywords: [...headerContent.seo.keywords, keywordInput.trim()] } }
                          });
                          setKeywordInput("");
                        }
                      }}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {headerContent.seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = headerContent.seo.keywords.filter((_, i) => i !== index);
                            setHeaderData({
                              ...headerData,
                              data: { ...headerContent, seo: { ...headerContent.seo, keywords: newKeywords } }
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
                  value={headerContent.seo.schemaMarkup || ""}
                  onChange={(value) => setHeaderData({
                    ...headerData,
                    data: { ...headerContent, seo: { ...headerContent.seo, schemaMarkup: value } }
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

      {/* FAQ Management */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                FAQ Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add and manage frequently asked questions
              </p>
            </div>
            <Badge variant="secondary">
              {faqsList.length} {faqsList.length === 1 ? 'FAQ' : 'FAQs'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqsList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                No FAQs configured yet
              </p>
              <Button onClick={handleAddFAQ} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Your First FAQ
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {faqsList.map((faq, index) => (
                <div
                  key={faq.id}
                  className="group relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Question</Label>
                      <RichTextEditor
                        value={faq.question || ""}
                        onChange={(value) => handleFAQChange(faq.id, "question", value)}
                        placeholder={`FAQ Question ${index + 1}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Answer</Label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveFAQ(faq.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                      <RichTextEditor
                        value={faq.answer || ""}
                        onChange={(value) => handleFAQChange(faq.id, "answer", value)}
                        placeholder="Enter the answer to this question"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add FAQ Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleAddFAQ} className="w-full" style={{ backgroundColor: '#4f46e5', color: 'white' }}>
              <Plus className="h-4 w-4 mr-2" /> Add New FAQ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {faqsList.length > 0 && (
              <span>Ready to save {faqsList.length} FAQs and header settings</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[160px]"
              style={{ backgroundColor: '#4f46e5', color: 'white' }}
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