"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCcw, Phone, Globe, Tag, Edit, Trash2, Plus, X } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeHtml } from "@/lib/sanitize";

interface ContactHeaderData {
  page: string;
  section: string;
  data: {
    heading: string;
    description: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
      slug: string;
      schemaMarkup: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ContactInfoData {
  page: string;
  section: string;
  data: {
    address: string;
    phones: Array<{
      id: string;
      number: string;
    }>;
    emails: Array<{
      id: string;
      email: string;
    }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ContactFormData {
  page: string;
  section: string;
  data: {
    heading: string;
    description: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface MapEmbedData {
  page: string;
  section: string;
  data: {
    url: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const defaultHeaderData: ContactHeaderData = {
  page: "contact",
  section: "header",
  data: {
    heading: "",
    description: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "",
      schemaMarkup: ""
    }
  },
};

const defaultContactInfoData: ContactInfoData = {
  page: "contact",
  section: "contactInfo",
  data: { address: "", phones: [], emails: [] },
};

const defaultFormData: ContactFormData = {
  page: "contact",
  section: "form",
  data: { heading: "", description: "" },
};

const defaultMapData: MapEmbedData = {
  page: "contact",
  section: "mapEmbedUrl",
  data: { url: "" },
};

export default function ContactPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [headerData, setHeaderData] = useState<ContactHeaderData>(defaultHeaderData);
  const [contactInfoData, setContactInfoData] = useState<ContactInfoData>(defaultContactInfoData);
  const [formData, setFormData] = useState<ContactFormData>(defaultFormData);
  const [mapData, setMapData] = useState<MapEmbedData>(defaultMapData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState<{ id: string; number: string } | null>(null);
  const [editingEmail, setEditingEmail] = useState<{ id: string; email: string } | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [headerRes, contactInfoRes, formRes, mapRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/contact/header/`),
        authFetch(`${API_BASE_URL}/api/cms/contact/contactInfo/`),
        authFetch(`${API_BASE_URL}/api/cms/contact/form/`),
        authFetch(`${API_BASE_URL}/api/cms/contact/mapEmbedUrl/`)
      ]);

      if (headerRes.ok) {
        const res = await headerRes.json();
        setHeaderData({
          page: res.page,
          section: res.section,
          data: {
            heading: res.data?.heading || "",
            description: res.data?.description || "",
            seo: res.data?.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "",
              schemaMarkup: ""
            }
          },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (contactInfoRes.ok) {
        const res = await contactInfoRes.json();
        setContactInfoData({
          page: res.page,
          section: res.section,
          data: res.data || { address: "", phones: [], emails: [] },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (formRes.ok) {
        const res = await formRes.json();
        setFormData({
          page: res.page,
          section: res.section,
          data: res.data || { heading: "", description: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }

      if (mapRes.ok) {
        const res = await mapRes.json();
        setMapData({
          page: res.page,
          section: res.section,
          data: res.data || { url: "" },
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch contact data.",
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

  const handleSaveHeader = async () => {
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
      const headerRes = await authFetch(`${API_BASE_URL}/api/cms/contact/header/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(headerData),
      });

      if (headerRes.ok) {
        toast({ title: "Contact header saved successfully" });
        setShowHeaderModal(false);
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save contact header.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !headerData.data.seo.keywords.includes(keywordInput.trim())) {
      setHeaderData({
        ...headerData,
        data: {
          ...headerData.data,
          seo: {
            ...headerData.data.seo,
            keywords: [...headerData.data.seo.keywords, keywordInput.trim()]
          }
        }
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setHeaderData({
      ...headerData,
      data: {
        ...headerData.data,
        seo: {
          ...headerData.data.seo,
          keywords: headerData.data.seo.keywords.filter(k => k !== keyword)
        }
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [headerRes, contactInfoRes, formRes, mapRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/cms/contact/header/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(headerData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/contact/contactInfo/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactInfoData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/contact/form/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }),
        authFetch(`${API_BASE_URL}/api/cms/contact/mapEmbedUrl/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapData),
        })
      ]);

      if (headerRes.ok && contactInfoRes.ok && formRes.ok && mapRes.ok) {
        toast({ title: "Contact page saved successfully" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save contact data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhone = () => {
    setEditingPhone({ id: "", number: "" });
    setShowPhoneModal(true);
  };

  const handleEditPhone = (phone: { id: string; number: string }) => {
    setEditingPhone(phone);
    setShowPhoneModal(true);
  };

  const handleSavePhone = () => {
    if (!editingPhone?.number.trim()) return;

    if (editingPhone.id) {
      setContactInfoData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          phones: prev.data.phones.map(p =>
            p.id === editingPhone.id ? editingPhone : p
          )
        }
      }));
    } else {
      const newPhone = {
        id: Date.now().toString(),
        number: editingPhone.number,
      };
      setContactInfoData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          phones: [...prev.data.phones, newPhone]
        }
      }));
    }

    setShowPhoneModal(false);
    setEditingPhone(null);
  };

  const handleDeletePhone = (id: string) => {
    setContactInfoData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        phones: prev.data.phones.filter(p => p.id !== id)
      }
    }));
  };

  const handleAddEmail = () => {
    setEditingEmail({ id: "", email: "" });
    setShowEmailModal(true);
  };

  const handleEditEmail = (email: { id: string; email: string }) => {
    setEditingEmail(email);
    setShowEmailModal(true);
  };

  const handleSaveEmail = () => {
    if (!editingEmail?.email.trim()) return;

    if (editingEmail.id) {
      setContactInfoData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          emails: prev.data.emails.map(e =>
            e.id === editingEmail.id ? editingEmail : e
          )
        }
      }));
    } else {
      const newEmail = {
        id: Date.now().toString(),
        email: editingEmail.email,
      };
      setContactInfoData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          emails: [...prev.data.emails, newEmail]
        }
      }));
    }

    setShowEmailModal(false);
    setEditingEmail(null);
  };

  const handleDeleteEmail = (id: string) => {
    setContactInfoData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        emails: prev.data.emails.filter(e => e.id !== id)
      }
    }));
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage contact page content and information
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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
          Contact Section
        </Badge>
        {headerData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(headerData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Header Section Card */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Page Header
              </CardTitle>
              <div
                className="text-sm font-medium mt-1"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.heading || "No heading set") }}
              />
              {headerData.data.description && (
                <div
                  className="text-sm text-muted-foreground mt-1 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(headerData.data.description) }}
                />
              )}
            </div>
            <Button onClick={() => setShowHeaderModal(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Header
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Header Edit Modal */}
      <Dialog open={showHeaderModal} onOpenChange={setShowHeaderModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact Page Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Heading</Label>
              <RichTextEditor
                placeholder="Contact Us"
                value={headerData.data.heading}
                onChange={(value) => setHeaderData(prev => ({
                  ...prev,
                  data: { ...prev.data, heading: value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <RichTextEditor
                placeholder="Experience exceptional skincare and healthcare services..."
                value={headerData.data.description}
                onChange={(value) => setHeaderData(prev => ({
                  ...prev,
                  data: { ...prev.data, description: value }
                }))}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">SEO Settings</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Title</Label>
                  <Input
                    value={headerData.data.seo.title}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, title: e.target.value }
                      }
                    })}
                    placeholder="Contact Us - SRM Arnik Clinic"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Description</Label>
                  <Textarea
                    value={headerData.data.seo.description}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, description: e.target.value }
                      }
                    })}
                    placeholder="Get in touch with SRM Arnik Clinic"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">SEO Slug</Label>
                  <Input
                    value={headerData.data.seo.slug}
                    onChange={(e) => setHeaderData({
                      ...headerData,
                      data: {
                        ...headerData.data,
                        seo: { ...headerData.data.seo, slug: e.target.value }
                      }
                    })}
                    placeholder="contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="Add keyword and press Enter"
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {headerData.data.seo.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {headerData.data.seo.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <SchemaMarkupEditor
                  value={headerData.data.seo.schemaMarkup}
                  onChange={(value) => setHeaderData({
                    ...headerData,
                    data: {
                      ...headerData.data,
                      seo: { ...headerData.data.seo, schemaMarkup: value }
                    }
                  })}
                  onValidationChange={setIsSchemaValid}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowHeaderModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveHeader} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Header
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Information */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Address</Label>
            <RichTextEditor
              placeholder="CE A1/A/151 1st Floor CE Block, Near Axis Mall..."
              value={contactInfoData.data.address}
              onChange={(value) => setContactInfoData(prev => ({
                ...prev,
                data: { ...prev.data, address: value }
              }))}
            />
          </div>

          {/* Phone Numbers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Phone Numbers</Label>
              <Button onClick={handleAddPhone} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" /> Add Phone
              </Button>
            </div>
            {(contactInfoData.data.phones || []).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No phone numbers added yet
              </div>
            ) : (
              <div className="space-y-2">
                {(contactInfoData.data.phones || []).map((phone) => (
                  <div key={phone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-900 dark:text-gray-100">{phone.number}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPhone(phone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePhone(phone.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Addresses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Email Addresses</Label>
              <Button onClick={handleAddEmail} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" /> Add Email
              </Button>
            </div>
            {(contactInfoData.data.emails || []).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No email addresses added yet
              </div>
            ) : (
              <div className="space-y-2">
                {(contactInfoData.data.emails || []).map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-900 dark:text-gray-100">{email.email}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmail(email)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmail(email.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Contact Form Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Form Heading</Label>
            <RichTextEditor
              placeholder="Get in Touch"
              value={formData.data.heading}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                data: { ...prev.data, heading: value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Form Description</Label>
            <RichTextEditor
              placeholder="We're here to help you achieve your skin and healthcare goals..."
              value={formData.data.description}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                data: { ...prev.data, description: value }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Map Embed Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Map Embed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Google Maps Embed URL</Label>
            <Textarea
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={mapData.data.url}
              onChange={(e) => setMapData(prev => ({
                ...prev,
                data: { ...prev.data, url: e.target.value }
              }))}
              className="min-h-[100px] resize-none"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">How to get Google Maps embed URL:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://maps.google.com" target="_blank" className="text-blue-600 hover:underline">Google Maps</a></li>
                <li>Search for your location or business</li>
                <li>Click the "Share" button</li>
                <li>Select "Embed a map" tab</li>
                <li>Choose map size (Medium recommended)</li>
                <li>Copy the entire iframe src URL (starts with https://www.google.com/maps/embed)</li>
              </ol>
            </div>
          </div>
          {mapData.data.url && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Map Preview</Label>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={mapData.data.url}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPhone?.id ? "Edit Phone Number" : "Add Phone Number"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={editingPhone?.number || ""}
                  onChange={(e) => setEditingPhone(prev => prev ? { ...prev, number: e.target.value } : null)}
                  placeholder="+91 8981443595"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSavePhone} className="bg-green-600 hover:bg-green-700">
                {editingPhone?.id ? "Update" : "Add"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhoneModal(false);
                  setEditingPhone(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingEmail?.id ? "Edit Email Address" : "Add Email Address"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={editingEmail?.email || ""}
                  onChange={(e) => setEditingEmail(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="srmarnik@gmail.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveEmail} className="bg-green-600 hover:bg-green-700">
                {editingEmail?.id ? "Update" : "Add"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setEditingEmail(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save contact page settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[160px] bg-green-600 hover:bg-green-700"
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