"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchSectionData, saveSectionData, generateSlug } from "@/lib/cms-utils";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import { MapUrlExtractor } from "@/components/map-url-extractor";

interface TopbarData {
  enabled: boolean;
  phone: string;
  whatsappNumber: string;
  callNumber: string;
  email: string;
  aboutClinic: string;
  address: string;
  timing: string;
  details: string;
  mapUrl: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

const defaultData: TopbarData = {
  enabled: true,
  phone: "",
  whatsappNumber: "",
  callNumber: "",
  email: "",
  aboutClinic: "",
  address: "",
  timing: "",
  details: "",
  mapUrl: "",
  seo: { title: "", description: "", keywords: [], slug: "", schemaMarkup: "" }
};

export default function TopbarPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<TopbarData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await fetchSectionData(doctorId, "topbar");
      if (sectionData) {
        setData({ 
          ...defaultData, 
          ...sectionData,
          seo: { ...defaultData.seo, ...sectionData.seo }
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, [doctorId]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[+]?[0-9\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/[^0-9]/g, '').length >= 10;
  };

  const handleSave = async () => {
    // Validate phone numbers
    if (!validatePhoneNumber(data.phone)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid phone number" });
      return;
    }
    if (!validatePhoneNumber(data.whatsappNumber)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid WhatsApp number" });
      return;
    }
    if (!validatePhoneNumber(data.callNumber)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid call number" });
      return;
    }
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveSectionData(authFetch, doctorId, "topbar", data);
      if (success) {
        toast({ title: "Success", description: "Topbar saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save topbar" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Top Bar Settings</h1>
        <div className="flex items-center gap-2">
          <Switch
            checked={data.enabled}
            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
          />
          <span className="text-sm font-medium">
            {data.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[+]?[0-9\s-()]*$/.test(value)) {
                    setData({ ...data, phone: value });
                  }
                }}
                placeholder="+91 7003385471"
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                value={data.whatsappNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[+]?[0-9\s-()]*$/.test(value)) {
                    setData({ ...data, whatsappNumber: value });
                  }
                }}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="callNumber">Call Number</Label>
              <Input
                id="callNumber"
                value={data.callNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[+]?[0-9\s-()]*$/.test(value)) {
                    setData({ ...data, callNumber: value });
                  }
                }}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="timing">Clinic Timing</Label>
            <Input
              id="timing"
              value={data.timing}
              onChange={(e) => setData({ ...data, timing: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address">Clinic Address</Label>
            <Textarea
              id="address"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="aboutClinic">About Clinic</Label>
            <Textarea
              id="aboutClinic"
              value={data.aboutClinic}
              onChange={(e) => setData({ ...data, aboutClinic: e.target.value })}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="details">Clinic Details</Label>
            <Input
              id="details"
              value={data.details}
              onChange={(e) => setData({ ...data, details: e.target.value })}
            />
          </div>

          <MapUrlExtractor
            value={data.mapUrl}
            onChange={(url) => setData({ ...data, mapUrl: url })}
            label="Google Maps Embed URL"
          />
          {data.mapUrl && (
            <div className="mt-3">
              <Label>Map Preview</Label>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={data.mapUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Topbar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input
              value={data.seo?.title || ""}
              onChange={(e) => {
                const title = e.target.value;
                setData({
                  ...data,
                  seo: {
                    ...data.seo,
                    title,
                    slug: title ? generateSlug(title) : ""
                  }
                });
              }}
              placeholder="Page title for search engines"
            />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              value={data.seo?.description || ""}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, description: e.target.value } })}
              placeholder="Page description for search engines"
              rows={3}
            />
          </div>
          <div>
            <Label>SEO Keywords</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keyword"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && keywordInput.trim()) {
                      e.preventDefault();
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(keywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, keywordInput.trim()] 
                          } 
                        });
                      }
                      setKeywordInput("");
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (keywordInput.trim()) {
                      const currentKeywords = data.seo?.keywords || [];
                      if (!currentKeywords.includes(keywordInput.trim())) {
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: [...currentKeywords, keywordInput.trim()] 
                          } 
                        });
                      }
                      setKeywordInput("");
                    }
                  }}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.seo?.keywords || []).map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => {
                        const newKeywords = (data.seo?.keywords || []).filter((_, i) => i !== index);
                        setData({ 
                          ...data, 
                          seo: { 
                            ...data.seo, 
                            keywords: newKeywords 
                          } 
                        });
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label>SEO Slug</Label>
            <Input
              value={data.seo?.slug || ""}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, slug: e.target.value } })}
              placeholder="url-friendly-slug"
            />
          </div>
          
          <SchemaMarkupEditor
            value={data.seo?.schemaMarkup || ""}
            onChange={(value) => setData({ ...data, seo: { ...data.seo, schemaMarkup: value } })}
            onValidationChange={setIsSchemaValid}
          />
        </CardContent>
      </Card>
    </div>
  );
}