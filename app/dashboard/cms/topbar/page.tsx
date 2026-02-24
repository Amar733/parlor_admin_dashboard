

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
import { Loader2, Save, Tag, RefreshCcw, Settings, Globe, Phone, MapPin, Clock, Mail, Eye, EyeOff, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";
import { MapUrlExtractor } from "@/components/map-url-extractor";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  schemaMarkup: string;
}

interface TopbarData {
  enabled: boolean;
  sticky: boolean;
  phone: string;
  whatsappNumber: string;
  callNumber: string;
  email: string;
  aboutClinic: string;
  location: string;
  timing: string;
  details: string;
  mapUrl: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  seo: SEOData;
}

const defaultData: TopbarData = {
  enabled: true,
  sticky: false,
  phone: "",
  whatsappNumber: "",
  callNumber: "",
  email: "",
  aboutClinic: "",
  location: "",
  timing: "",
  details: "",
  mapUrl: "",
  facebook: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  seo: {
    title: "",
    description: "",
    keywords: [],
    slug: "/",
    schemaMarkup: "",
  },
};

export default function TopbarPage() {
  const params = useParams();
  const doctorId = params?.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<TopbarData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);


  
 const loadData = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/cms/home/topbar/`);
        if (response.ok) {
          const respo = await response.json();
          setData({
            ...defaultData,
            ...respo.data,
            seo: {
              ...defaultData.seo,
              ...respo.data?.seo,
            },
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load topbar data.",
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Could not fetch topbar data.",
        });
      } finally {
        setIsLoading(false);
      }
    };



  useEffect(() => {

    loadData();
  }, [doctorId]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[+]?[0-9\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/[^0-9]/g, "").length >= 10;
  };

  const handleSave = async () => {
    if (!validatePhoneNumber(data.phone)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Invalid phone number" });
      return;
    }
    if (!validatePhoneNumber(data.whatsappNumber)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Invalid WhatsApp number" });
      return;
    }
    if (!validatePhoneNumber(data.callNumber)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Invalid call number" });
      return;
    }
    if (!isSchemaValid) {
      toast({ variant: "destructive", title: "Invalid Schema Markup", description: "Please fix the schema markup errors before saving" });
      return;
    }

    setIsSaving(true);

    console.log("updating topbar with data:" , data);

    try {
    
      const res = await authFetch(`${API_BASE_URL}/api/cms/home/topbar/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({data}),
      });

      if (res.ok) {
        loadData();

        toast({ title: "Success", description: "Topbar saved successfully" });
      } else {
        const err = await res.text();
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to save topbar: ${err || res.statusText}`,
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Network Error", description: "Request failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 rounded-xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                <Settings className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Topbar CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure topbar contact information and settings
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
          home
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          topbar
        </Badge>
      </div>

      {/* Basic Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Topbar Status</Label>
              <p className="text-sm text-muted-foreground">Toggle topbar visibility</p>
            </div>
            <div className="flex items-center gap-2">
              {data.enabled ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <Switch
                checked={data.enabled}
                onCheckedChange={async (checked) => {
                  const updatedData = { ...data, enabled: checked };
                  setData(updatedData);
                  setIsSaving(true);
                  try {
                    const res = await authFetch(`${API_BASE_URL}/api/cms/home/topbar/`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ data: updatedData }),
                    });
                    if (res.ok) {
                      toast({ title: "Success", description: "Topbar status updated" });
                    } else {
                      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
                    }
                  } catch {
                    toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
                  } finally {
                    setIsSaving(false);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Sticky Navigation</Label>
              <p className="text-sm text-muted-foreground">Keep topbar fixed on scroll</p>
            </div>
            <Switch
              checked={data.sticky}
              onCheckedChange={async (checked) => {
                const updatedData = { ...data, sticky: checked };
                setData(updatedData);
                setIsSaving(true);
                try {
                  const res = await authFetch(`${API_BASE_URL}/api/cms/home/topbar/`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: updatedData }),
                  });
                  if (res.ok) {
                    toast({ title: "Success", description: "Sticky navigation updated" });
                  } else {
                    toast({ variant: "destructive", title: "Error", description: "Failed to update sticky setting" });
                  }
                } catch {
                  toast({ variant: "destructive", title: "Error", description: "Failed to update sticky setting" });
                } finally {
                  setIsSaving(false);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "phone", label: "Phone Number", field: "phone" },
              { id: "whatsappNumber", label: "WhatsApp Number", field: "whatsappNumber" },
              { id: "callNumber", label: "Call Number", field: "callNumber" },
            ].map(({ id, label, field }) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
                <Input
                  id={id}
                  value={(data as any)[field] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[+]?[0-9\s-()]*$/.test(val)) setData({ ...data, [field]: val });
                  }}
                  className="h-11"
                  placeholder="+91 9876543210"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input 
              value={data.email || ""} 
              onChange={(e) => setData({ ...data, email: e.target.value })} 
              className="h-11"
              placeholder="contact@clinic.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Clinic Timing
            </Label>
            <Input 
              value={data.timing || ""} 
              onChange={(e) => setData({ ...data, timing: e.target.value })} 
              className="h-11"
              placeholder="Mon-Sat: 9:00 AM - 6:00 PM"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Clinic Address
            </Label>
            <Textarea 
              value={data.location || ""} 
              onChange={(e) => setData({ ...data, location: e.target.value })} 
              rows={3} 
              className="resize-none"
              placeholder="Enter complete clinic address"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">About Clinic</Label>
            <Textarea
              value={data.aboutClinic || ""}
              onChange={(e) => setData({ ...data, aboutClinic: e.target.value })}
              rows={4}
              className="resize-none"
              placeholder="Brief description about the clinic"
            />
          </div>

          <MapUrlExtractor
            value={data.mapUrl || ""}
            onChange={(url) => setData({ ...data, mapUrl: url })}
            label="Google Maps Embed URL"
          />
          {data.mapUrl && (
            <div className="mt-3">
              <Label className="text-sm font-medium">Map Preview</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
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
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Social Media Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["facebook", "linkedin", "twitter", "instagram"].map((id) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id} className="text-sm font-medium">
                  {id.charAt(0).toUpperCase() + id.slice(1)} URL
                </Label>
                <Input
                  id={id}
                  value={(data as any)[id] || ""}
                  onChange={(e) => setData({ ...data, [id]: e.target.value })}
                  placeholder={`https://${id}.com/yourprofile`}
                  className="h-11"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            SEO Settings (Home Page)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input
              value={data.seo.title}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, title: e.target.value } })}
              placeholder="Home - Clinic Name"
            />
          </div>

          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={data.seo.description}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, description: e.target.value } })}
              rows={3}
              className="resize-none"
              placeholder="Brief description for search engines"
            />
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keywordInput.trim()) {
                    e.preventDefault();
                    setData({ ...data, seo: { ...data.seo, keywords: [...data.seo.keywords, keywordInput.trim()] } });
                    setKeywordInput("");
                  }
                }}
                placeholder="Type keyword and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.seo.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {keyword}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setData({ ...data, seo: { ...data.seo, keywords: data.seo.keywords.filter((_, i) => i !== index) } })}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={data.seo.slug}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, slug: e.target.value } })}
              placeholder="/"
            />
          </div>

          <SchemaMarkupEditor
            value={data.seo.schemaMarkup}
            onChange={(value) => setData({ ...data, seo: { ...data.seo, schemaMarkup: value } })}
            onValidationChange={setIsSchemaValid}
          />
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save topbar settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="min-w-[160px] bg-slate-600 hover:bg-slate-700"
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
