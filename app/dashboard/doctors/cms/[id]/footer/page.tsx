"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, Loader2, Upload, Tag, Layout, Link, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { uploadImage, getImageUrl, generateSlug } from "@/lib/cms-utils";
import { API_BASE_URL } from "@/config/api";

interface FooterLink {
  name: string;
  url: string;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface ContactItem {
  icon: string;
  text: string;
  url: string;
}

interface FooterData {
  enabled: boolean;
  logo: string;
  description: string;
  socialLinks: SocialLink[];
  services: FooterLink[];
  quickLinks: FooterLink[];
  contact: ContactItem[];
  copyright: string;
  sectionTitles: {
    services: string;
    quickLinks: string;
    contact: string;
    socialLinks: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

export default function FooterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get('name') || '';
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<FooterData>({
    enabled: true,
    logo: "",
    description: "Providing compassionate and professional healthcare services with a focus on patient well-being and medical excellence.",
    socialLinks: [
      { name: "Facebook", url: "#", icon: "facebook" },
      { name: "Instagram", url: "#", icon: "instagram" },
      { name: "LinkedIn", url: "#", icon: "linkedin" },
      { name: "YouTube", url: "#", icon: "youtube" }
    ],
    services: [
      { name: "General Consultation", url: "/services/consultation" },
      { name: "Health Checkups", url: "/services/checkups" },
      { name: "Specialist Care", url: "/services/specialist" },
      { name: "Emergency Care", url: "/services/emergency" }
    ],
    quickLinks: [
      { name: "About Doctor", url: "/about" },
      { name: "Appointments", url: "/appointments" },
      { name: "Patient Reviews", url: "/reviews" },
      { name: "Health Blog", url: "/blog" }
    ],
    contact: [
      { icon: "phone", text: "8981443595", url: "https://srmarnik.com" },
      { icon: "email", text: "srmarnik@gmail.com", url: "mailto:srmarnik@gmail.com" },
      { icon: "location", text: "123 Medical Center, Health City", url: "#" },
      { icon: "clock", text: "Mon-Fri: 9AM-6PM", url: "#" }
    ],
    copyright: "© 2024 Srmarnik. All rights reserved.",
    sectionTitles: {
      services: "Services",
      quickLinks: "Quick Links",
      contact: "Contact Information",
      socialLinks: "Follow Us"
    },
    seo: { title: "", description: "", keywords: [], slug: "" }
  });

  const [modulesList, setModulesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    fetchData();
    fetchModules();
  }, [doctorId]);

  const fetchData = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/footer_${doctorId}`);
      if (response.ok) {
        const result = await response.json();
        const apiData = result.data || {};
        setData({
          ...data,
          ...apiData,
          sectionTitles: {
            services: "Services",
            quickLinks: "Quick Links",
            contact: "Contact Information",
            socialLinks: "Follow Us",
            ...apiData.sectionTitles
          },
          seo: apiData.seo || { title: "", description: "", keywords: [], slug: "" }
        });
      }
    } catch (error) {
      console.error("Error fetching footer data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      console.log('Fetching modules from API...');
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/modules_list`);
      console.log('Modules API response:', response.status, response.ok);
      if (response.ok) {
        const result = await response.json();
        console.log('Modules API result:', result);
        setModulesList(result.data || []);
      } else {
        console.error('Modules API failed with status:', response.status);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/footer_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Footer data saved successfully!",
        });
        // Refetch data after successful save
        await fetchData();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save footer data",
        });
      }
    } catch (error) {
      console.error("Error saving footer data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsSaving(true);
      const imageUrl = await uploadImage(file, "footer", authFetch);
      setData(prev => ({ ...prev, logo: imageUrl }));
      toast({
        title: "Success",
        description: "Logo uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload logo",
      });
    } finally {
      setIsSaving(false);
    }
  };



  const addKeyword = () => {
    if (keywordInput.trim() && !data.seo.keywords.includes(keywordInput.trim())) {
      setData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...prev.seo.keywords, keywordInput.trim()]
        }
      }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((_, i) => i !== index)
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Footer Management</h1>
          <p className="text-gray-600">Manage footer content and links for {doctorName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
            />
            <span className="text-sm">Enable Footer</span>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Footer Logo</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.logo}
                    onChange={(e) => setData({ ...data, logo: e.target.value })}
                    placeholder="Logo URL"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('footer-logo-file')?.click()}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                  <input
                    id="footer-logo-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>
                {data.logo && (
                  <img
                    src={getImageUrl(data.logo)}
                    alt="Footer Logo"
                    className="mt-2 h-12 w-auto object-contain"
                  />
                )}
              </div>

              <div>
                <Label>Footer Description</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Copyright Text</Label>
                <Input
                  value={data.copyright}
                  onChange={(e) => setData({ ...data, copyright: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Titles */}
          <Card>
            <CardHeader>
              <CardTitle>Section Titles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Services Section Title</Label>
                <Input
                  value={data.sectionTitles.services}
                  onChange={(e) => setData({ 
                    ...data, 
                    sectionTitles: { ...data.sectionTitles, services: e.target.value } 
                  })}
                  placeholder="e.g., Our Services, Medical Services"
                />
              </div>
              <div>
                <Label>Quick Links Section Title</Label>
                <Input
                  value={data.sectionTitles.quickLinks}
                  onChange={(e) => setData({ 
                    ...data, 
                    sectionTitles: { ...data.sectionTitles, quickLinks: e.target.value } 
                  })}
                  placeholder="e.g., Quick Links, Important Links"
                />
              </div>
              <div>
                <Label>Contact Section Title</Label>
                <Input
                  value={data.sectionTitles.contact}
                  onChange={(e) => setData({ 
                    ...data, 
                    sectionTitles: { ...data.sectionTitles, contact: e.target.value } 
                  })}
                  placeholder="e.g., Contact Us, Get In Touch"
                />
              </div>
              <div>
                <Label>Social Links Section Title</Label>
                <Input
                  value={data.sectionTitles.socialLinks}
                  onChange={(e) => setData({ 
                    ...data, 
                    sectionTitles: { ...data.sectionTitles, socialLinks: e.target.value } 
                  })}
                  placeholder="e.g., Follow Us, Social Media"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                {data.sectionTitles.services}
              </CardTitle>
              <Button 
                onClick={() => setData({ ...data, services: [...data.services, { name: "", url: "" }] })}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.services.map((service, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <Label>Service Name</Label>
                    <Input
                      value={service.name}
                      onChange={(e) => {
                        const newServices = [...data.services];
                        newServices[index] = { ...service, name: e.target.value };
                        setData({ ...data, services: newServices });
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>URL</Label>
                      <Input
                        value={service.url}
                        onChange={(e) => {
                          const newServices = [...data.services];
                          newServices[index] = { ...service, url: e.target.value };
                          setData({ ...data, services: newServices });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newServices = data.services.filter((_, i) => i !== index);
                        setData({ ...data, services: newServices });
                      }}
                      className="h-10 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                {data.sectionTitles.quickLinks}
              </CardTitle>
              <Button 
                onClick={() => setData({ ...data, quickLinks: [...data.quickLinks, { name: "", url: "" }] })}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.quickLinks.map((link, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <Label>Link Name</Label>
                    <Input
                      value={link.name}
                      onChange={(e) => {
                        const newLinks = [...data.quickLinks];
                        newLinks[index] = { ...link, name: e.target.value };
                        setData({ ...data, quickLinks: newLinks });
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...data.quickLinks];
                          newLinks[index] = { ...link, url: e.target.value };
                          setData({ ...data, quickLinks: newLinks });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLinks = data.quickLinks.filter((_, i) => i !== index);
                        setData({ ...data, quickLinks: newLinks });
                      }}
                      className="h-10 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {data.sectionTitles.contact}
              </CardTitle>
              <Button 
                onClick={() => setData({ ...data, contact: [...data.contact, { icon: "", text: "", url: "" }] })}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.contact.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label>Icon</Label>
                    <Input
                      value={item.icon}
                      onChange={(e) => {
                        const newContact = [...data.contact];
                        newContact[index] = { ...item, icon: e.target.value };
                        setData({ ...data, contact: newContact });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Text</Label>
                    <Input
                      value={item.text}
                      onChange={(e) => {
                        const newContact = [...data.contact];
                        newContact[index] = { ...item, text: e.target.value };
                        setData({ ...data, contact: newContact });
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>URL</Label>
                      <Input
                        value={item.url}
                        onChange={(e) => {
                          const newContact = [...data.contact];
                          newContact[index] = { ...item, url: e.target.value };
                          setData({ ...data, contact: newContact });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newContact = data.contact.filter((_, i) => i !== index);
                        setData({ ...data, contact: newContact });
                      }}
                      className="h-10 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{data.sectionTitles.socialLinks}</CardTitle>
              <Button 
                onClick={() => setData({ ...data, socialLinks: [...data.socialLinks, { name: "", url: "", icon: "" }] })}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Social
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.socialLinks.map((social, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label>Platform</Label>
                    <Input
                      value={social.name}
                      onChange={(e) => {
                        const newSocial = [...data.socialLinks];
                        newSocial[index] = { ...social, name: e.target.value };
                        setData({ ...data, socialLinks: newSocial });
                      }}
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={social.url}
                      onChange={(e) => {
                        const newSocial = [...data.socialLinks];
                        newSocial[index] = { ...social, url: e.target.value };
                        setData({ ...data, socialLinks: newSocial });
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Icon</Label>
                      <Input
                        value={social.icon}
                        onChange={(e) => {
                          const newSocial = [...data.socialLinks];
                          newSocial[index] = { ...social, icon: e.target.value };
                          setData({ ...data, socialLinks: newSocial });
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSocial = data.socialLinks.filter((_, i) => i !== index);
                        setData({ ...data, socialLinks: newSocial });
                      }}
                      className="h-10 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={data.seo.title}
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
                />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={data.seo.description}
                  onChange={(e) => setData({
                    ...data,
                    seo: { ...data.seo, description: e.target.value }
                  })}
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
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addKeyword}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {data.seo.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
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
                  value={data.seo.slug}
                  onChange={(e) => setData({
                    ...data,
                    seo: { ...data.seo, slug: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Footer Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg text-sm bg-gray-800 text-white">
                {data.logo && (
                  <img
                    src={getImageUrl(data.logo)}
                    alt="Logo"
                    className="h-8 w-auto mb-2"
                  />
                )}
                <p className="mb-3 text-xs opacity-90">{data.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-medium mb-1 text-xs">{data.sectionTitles.services}</h4>
                    {data.services.slice(0, 3).map((service, index) => (
                      <div key={index} className="text-xs opacity-75 mb-1">
                        {service.name}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-xs">{data.sectionTitles.quickLinks}</h4>
                    {data.quickLinks.slice(0, 3).map((link, index) => (
                      <div key={index} className="text-xs opacity-75 mb-1">
                        {link.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs opacity-75 border-t border-gray-600 pt-2">
                  {data.copyright}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}