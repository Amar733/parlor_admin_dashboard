"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Save, Loader2, Tag, MessageSquare, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/cms-utils";
import { API_BASE_URL } from "@/config/api";

interface CTASection {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  primaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url: string;
  };
  secondaryButton: {
    enabled: boolean;
    buttonText: string;
    chooseModuleToOpen: string;
    url: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

interface CTAData {
  home_cta: CTASection;
  appointment_cta: CTASection;
  contact_cta: CTASection;
  emergency_cta: CTASection;
}

export default function CTAPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params.id as string;
  const doctorName = searchParams.get('name') || '';
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<CTAData>({
    home_cta: {
      id: "cta1",
      enabled: true,
      title: "Book Your Appointment Today",
      subtitle: "Stay updated with our latest health tips and medical insights. Subscribe to our newsletter.",
      primaryButton: {
        enabled: true,
        buttonText: "Book Appointment",
        chooseModuleToOpen: "appointment",
        url: ""
      },
      secondaryButton: {
        enabled: true,
        buttonText: "Contact Now",
        chooseModuleToOpen: "newsletter",
        url: ""
      },
      seo: { title: "", description: "", keywords: [], slug: "" }
    },
    appointment_cta: {
      id: "cta2",
      enabled: true,
      title: "Schedule Your Visit",
      subtitle: "Easy Online Booking",
      primaryButton: {
        enabled: true,
        buttonText: "Schedule Now",
        chooseModuleToOpen: "",
        url: ""
      },
      secondaryButton: {
        enabled: false,
        buttonText: "",
        chooseModuleToOpen: "",
        url: ""
      },
      seo: { title: "", description: "", keywords: [], slug: "" }
    },
    contact_cta: {
      id: "cta3",
      enabled: true,
      title: "Have Questions?",
      subtitle: "Get in Touch",
      primaryButton: {
        enabled: true,
        buttonText: "Contact Us",
        chooseModuleToOpen: "",
        url: ""
      },
      secondaryButton: {
        enabled: false,
        buttonText: "",
        chooseModuleToOpen: "",
        url: ""
      },
      seo: { title: "", description: "", keywords: [], slug: "" }
    },
    emergency_cta: {
      id: "cta4",
      enabled: true,
      title: "Medical Emergency?",
      subtitle: "24/7 Emergency Care",
      primaryButton: {
        enabled: true,
        buttonText: "Emergency Contact",
        chooseModuleToOpen: "",
        url: ""
      },
      secondaryButton: {
        enabled: false,
        buttonText: "",
        chooseModuleToOpen: "",
        url: ""
      },
      seo: { title: "", description: "", keywords: [], slug: "" }
    }
  });

  const [modulesList, setModulesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInputs, setKeywordInputs] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState("home_cta");

  const ctaSections = [
    { key: 'home_cta', label: 'Home CTA', icon: Phone, description: 'Main call-to-action on homepage' },
    { key: 'appointment_cta', label: 'Appointment CTA', icon: Calendar, description: 'Appointment booking call-to-action' },
    { key: 'contact_cta', label: 'Contact CTA', icon: MessageSquare, description: 'Contact form call-to-action' },
    { key: 'emergency_cta', label: 'Emergency CTA', icon: MapPin, description: 'Emergency contact call-to-action' }
  ];

  useEffect(() => {
    fetchData();
    fetchModules();
    
    // Set active tab from URL hash on load
    const hash = window.location.hash.replace('#', '');
    if (hash && ctaSections.some(section => section.key === hash)) {
      setActiveTab(hash);
    }
  }, [doctorId]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  const fetchData = async () => {
    try {
      const promises = ctaSections.map(section => 
        authFetch(`${API_BASE_URL}/api/cms/home/${section.key}_${doctorId}`)
          .then(response => response.ok ? response.json() : null)
          .then(result => ({ key: section.key, data: result?.data }))
          .catch(() => ({ key: section.key, data: null }))
      );

      const results = await Promise.all(promises);
      
      const newData = { ...data };
      results.forEach(result => {
        if (result.data) {
          newData[result.key as keyof CTAData] = {
            ...newData[result.key as keyof CTAData],
            ...result.data,
            seo: result.data.seo || { title: "", description: "", keywords: [], slug: "" }
          };
        }
      });
      
      setData(newData);
    } catch (error) {
      console.error("Error fetching CTA data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/modules_list`);
      if (response.ok) {
        const result = await response.json();
        setModulesList(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const validateSection = (sectionData: CTASection) => {
    const errors: string[] = [];
    
    if (sectionData.primaryButton.enabled) {
      if (!sectionData.primaryButton.buttonText.trim()) {
        errors.push("Primary button text is required when enabled");
      }
      if (!sectionData.primaryButton.chooseModuleToOpen) {
        errors.push("Primary button module selection is required when enabled");
      }
    }
    
    if (sectionData.secondaryButton.enabled) {
      if (!sectionData.secondaryButton.buttonText.trim()) {
        errors.push("Secondary button text is required when enabled");
      }
      if (!sectionData.secondaryButton.chooseModuleToOpen) {
        errors.push("Secondary button module selection is required when enabled");
      }
    }
    
    return errors;
  };

  const handleSave = async (sectionKey: string) => {
    const errors = validateSection(data[sectionKey as keyof CTAData]);
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors.join(", "),
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/${sectionKey}_${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: data[sectionKey as keyof CTAData] }),
      });

      if (response.ok) {
        const sectionLabel = ctaSections.find(s => s.key === sectionKey)?.label || sectionKey;
        toast({
          title: "Success",
          description: `${sectionLabel} saved successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save changes",
        });
      }
    } catch (error) {
      console.error(`Error saving ${sectionKey}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = (sectionKey: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof CTAData],
        [field]: value
      }
    }));
  };

  const updateSEO = (sectionKey: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof CTAData],
        seo: {
          ...prev[sectionKey as keyof CTAData].seo,
          [field]: value
        }
      }
    }));
  };

  const addKeyword = (sectionKey: string) => {
    const keyword = keywordInputs[sectionKey]?.trim();
    if (keyword && !data[sectionKey as keyof CTAData].seo.keywords.includes(keyword)) {
      updateSEO(sectionKey, 'keywords', [...data[sectionKey as keyof CTAData].seo.keywords, keyword]);
      setKeywordInputs(prev => ({ ...prev, [sectionKey]: "" }));
    }
  };

  const removeKeyword = (sectionKey: string, index: number) => {
    const newKeywords = data[sectionKey as keyof CTAData].seo.keywords.filter((_, i) => i !== index);
    updateSEO(sectionKey, 'keywords', newKeywords);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] overflow-y-auto">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Call-to-Action Management</h1>
          <p className="text-gray-600">Manage all CTA sections for {doctorName}</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {ctaSections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.key} value={section.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {section.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ctaSections.map((section) => {
            const sectionData = data[section.key as keyof CTAData];
            return (
              <TabsContent key={section.key} value={section.key} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{section.label}</h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                  <Button onClick={() => handleSave(section.key)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save {section.label}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Enable Section</Label>
                        <Switch
                          checked={sectionData.enabled}
                          onCheckedChange={(checked) => updateSection(section.key, 'enabled', checked)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={sectionData.title}
                          onChange={(e) => updateSection(section.key, 'title', e.target.value)}
                          placeholder="Enter CTA title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={sectionData.subtitle}
                          onChange={(e) => updateSection(section.key, 'subtitle', e.target.value)}
                          placeholder="Enter CTA subtitle"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Button Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Button Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Button */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Primary Button</Label>
                          <Switch
                            checked={sectionData.primaryButton.enabled}
                            onCheckedChange={(checked) => 
                              updateSection(section.key, 'primaryButton', {
                                ...sectionData.primaryButton,
                                enabled: checked
                              })
                            }
                          />
                        </div>
                        
                        {sectionData.primaryButton.enabled && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Button Text *</Label>
                              <Input
                                value={sectionData.primaryButton.buttonText}
                                onChange={(e) => 
                                  updateSection(section.key, 'primaryButton', {
                                    ...sectionData.primaryButton,
                                    buttonText: e.target.value
                                  })
                                }
                                placeholder="Enter button text"
                                className={!sectionData.primaryButton.buttonText.trim() ? "border-red-500" : ""}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Module to Open *</Label>
                              <Select
                                value={sectionData.primaryButton.chooseModuleToOpen}
                                onValueChange={(value) => 
                                  updateSection(section.key, 'primaryButton', {
                                    ...sectionData.primaryButton,
                                    chooseModuleToOpen: value
                                  })
                                }
                              >
                                <SelectTrigger className={!sectionData.primaryButton.chooseModuleToOpen ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select module" />
                                </SelectTrigger>
                                <SelectContent>
                                  {modulesList.map((module: any, index: number) => (
                                    <SelectItem key={`primary-${section.key}-${index}`} value={module.key || module.value || String(module)}>
                                      {module.title || module.label || String(module)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {sectionData.primaryButton.chooseModuleToOpen === "external_url" && (
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={sectionData.primaryButton.url || ""}
                                  onChange={(e) => 
                                    updateSection(section.key, 'primaryButton', {
                                      ...sectionData.primaryButton,
                                      url: e.target.value
                                    })
                                  }
                                  placeholder="https://example.com"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Secondary Button */}
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Secondary Button</Label>
                          <Switch
                            checked={sectionData.secondaryButton.enabled}
                            onCheckedChange={(checked) => 
                              updateSection(section.key, 'secondaryButton', {
                                ...sectionData.secondaryButton,
                                enabled: checked
                              })
                            }
                          />
                        </div>
                        
                        {sectionData.secondaryButton.enabled && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Button Text *</Label>
                              <Input
                                value={sectionData.secondaryButton.buttonText}
                                onChange={(e) => 
                                  updateSection(section.key, 'secondaryButton', {
                                    ...sectionData.secondaryButton,
                                    buttonText: e.target.value
                                  })
                                }
                                placeholder="Enter button text"
                                className={!sectionData.secondaryButton.buttonText.trim() ? "border-red-500" : ""}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Module to Open *</Label>
                              <Select
                                value={sectionData.secondaryButton.chooseModuleToOpen}
                                onValueChange={(value) => 
                                  updateSection(section.key, 'secondaryButton', {
                                    ...sectionData.secondaryButton,
                                    chooseModuleToOpen: value
                                  })
                                }
                              >
                                <SelectTrigger className={!sectionData.secondaryButton.chooseModuleToOpen ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select module" />
                                </SelectTrigger>
                                <SelectContent>
                                  {modulesList.map((module: any, index: number) => (
                                    <SelectItem key={`secondary-${section.key}-${index}`} value={module.key || module.value || String(module)}>
                                      {module.title || module.label || String(module)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {sectionData.secondaryButton.chooseModuleToOpen === "external_url" && (
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={sectionData.secondaryButton.url || ""}
                                  onChange={(e) => 
                                    updateSection(section.key, 'secondaryButton', {
                                      ...sectionData.secondaryButton,
                                      url: e.target.value
                                    })
                                  }
                                  placeholder="https://example.com"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SEO Title</Label>
                        <Input
                          value={sectionData.seo.title}
                          onChange={(e) => {
                            updateSEO(section.key, 'title', e.target.value);
                            updateSEO(section.key, 'slug', generateSlug(e.target.value));
                          }}
                          placeholder="Enter SEO title"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>SEO Slug</Label>
                        <Input
                          value={sectionData.seo.slug}
                          onChange={(e) => updateSEO(section.key, 'slug', e.target.value)}
                          placeholder="auto-generated-slug"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>SEO Description</Label>
                      <Input
                        value={sectionData.seo.description}
                        onChange={(e) => updateSEO(section.key, 'description', e.target.value)}
                        placeholder="Enter SEO description"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>SEO Keywords</Label>
                      <div className="flex gap-2">
                        <Input
                          value={keywordInputs[section.key] || ""}
                          onChange={(e) => setKeywordInputs(prev => ({ ...prev, [section.key]: e.target.value }))}
                          placeholder="Enter keyword and press Add"
                          onKeyPress={(e) => e.key === 'Enter' && addKeyword(section.key)}
                        />
                        <Button type="button" onClick={() => addKeyword(section.key)} variant="outline">
                          <Tag className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      
                      {sectionData.seo.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sectionData.seo.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(section.key, index)}>
                              {keyword} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                {sectionData.enabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{sectionData.title}</h3>
                        <p className="text-gray-600 mb-6">{sectionData.subtitle}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          {sectionData.primaryButton.enabled && (
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              {sectionData.primaryButton.buttonText}
                            </Button>
                          )}
                          {sectionData.secondaryButton.enabled && (
                            <Button variant="outline">
                              {sectionData.secondaryButton.buttonText}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}