"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Plus, X, Globe, ChevronDown, ChevronUp, Settings, BarChart3, Zap, Shield, Eye, Copy, Check, Sparkles, Link2, Activity } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

export default function DomainsPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [domainMappings, setDomainMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [copiedDomains, setCopiedDomains] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctorsRes, domainsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/users?role=doctor`),
          authFetch(`${API_BASE_URL}/api/cms/home/mapdomains`)
        ]);

        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          setDoctors(doctorsData || []);
        }

        if (domainsRes.ok) {
          const domainsData = await domainsRes.json();
          setDomainMappings(domainsData.data || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [authFetch]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mappingsData = domainMappings
        .filter((m: any) => m.domains?.length > 0)
        .map((m: any) => ({
          userId: m.userId,
          domains: m.domains.filter((d: string) => d.trim() !== ""),
          enabled: m.enabled ?? true,
          pixelId: m.pixelId || "",
          googleAnalyticsId: m.googleAnalyticsId || "",
          googleSiteVerification: (m.googleSiteVerification || []).filter((v: string) => v.trim() !== ""),
        }));

      if (!mappingsData.length) return;

      const allDomains: string[] = [];
      const duplicates: string[] = [];

      for (const mapping of mappingsData) {
        for (const domain of mapping.domains) {
          const lowerDomain = domain.toLowerCase();
          if (allDomains.includes(lowerDomain)) {
            duplicates.push(domain);
          } else {
            allDomains.push(lowerDomain);
          }
        }
      }

      if (duplicates.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Duplicate domains found: ${duplicates.join(", ")}`
        });
        return;
      }

      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/mapdomains`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: mappingsData }),
        }
      );

      if (response.ok) {
        toast({ title: "Success", description: "Domains mapped successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to map domains" });
    } finally {
      setIsSaving(false);
    }
  };

  const addDomain = (doctorId: string) => {
    const newMappings = [...domainMappings];
    const existingIndex = newMappings.findIndex((m) => m.userId === doctorId);
    if (existingIndex >= 0) {
      newMappings[existingIndex].domains.push("");
    } else {
      newMappings.push({
        userId: doctorId,
        domains: [""],
        enabled: true,
        pixelId: "",
        googleAnalyticsId: "",
        googleSiteVerification: [""],
      });
    }
    setDomainMappings(newMappings);
  };

  const removeDomain = (doctorId: string, domainIndex: number) => {
    const newMappings = [...domainMappings];
    const existingIndex = newMappings.findIndex((m) => m.userId === doctorId);
    if (existingIndex >= 0) {
      newMappings[existingIndex].domains.splice(domainIndex, 1);
      setDomainMappings(newMappings);
    }
  };

  const updateMapping = (doctorId: string, field: string, value: any, domainIndex?: number) => {
    const newMappings = [...domainMappings];
    const existingIndex = newMappings.findIndex((m) => m.userId === doctorId);
    
    if (existingIndex >= 0) {
      if (field === 'domain' && domainIndex !== undefined) {
        newMappings[existingIndex].domains[domainIndex] = value;
      } else {
        newMappings[existingIndex][field] = value;
      }
    } else {
      const newMapping: any = {
        userId: doctorId,
        domains: [""],
        enabled: true,
        pixelId: "",
        googleAnalyticsId: "",
        googleSiteVerification: [""],
      };
      if (field === 'domain' && domainIndex !== undefined) {
        newMapping.domains[domainIndex] = value;
      } else {
        newMapping[field] = value;
      }
      newMappings.push(newMapping);
    }
    setDomainMappings(newMappings);
  };

  const updateDomain = (doctorId: string, domainIndex: number, value: string) => {
    const isDuplicate = domainMappings.some(
      (mapping: any) =>
        mapping.userId !== doctorId &&
        mapping.domains.some(
          (d: string) => d.toLowerCase() === value.toLowerCase() && d !== ""
        )
    );

    if (isDuplicate && value !== "") {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Domain "${value}" is already assigned to another doctor`
      });
      return;
    }

    updateMapping(doctorId, 'domain', value, domainIndex);
  };

  const toggleCardExpansion = (doctorId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(doctorId)) {
      newExpanded.delete(doctorId);
    } else {
      newExpanded.add(doctorId);
    }
    setExpandedCards(newExpanded);
  };

  const copyDomain = async (domain: string) => {
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomains(prev => new Set([...prev, domain]));
      setTimeout(() => {
        setCopiedDomains(prev => {
          const newSet = new Set(prev);
          newSet.delete(domain);
          return newSet;
        });
      }, 2000);
      toast({ title: "Copied!", description: `Domain "${domain}" copied to clipboard` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy domain" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="text-center space-y-6">
          <Loading size="xl" />
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-900">Loading Domain Configurations</h3>
            <p className="text-slate-600">Fetching doctor profiles and domain mappings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Domain Mapping
              </h1>
              <p className="text-gray-100 text-sm">
                Configure custom domains and analytics for each doctor
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {doctors.length} Doctors
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                {domainMappings.reduce((acc, m) => acc + (m.domains?.length || 0), 0)} Domains
              </Badge>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gray-400/20 rounded-full blur-2xl"></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
          {doctors.map((doctor) => {
            const mapping = domainMappings.find((m) => m.userId === doctor._id) || {
              userId: doctor._id,
              domains: [""],
              enabled: true,
              pixelId: "",
              googleAnalyticsId: "",
              googleSiteVerification: [""],
            };
            const isExpanded = expandedCards.has(doctor._id);
            const hasActiveDomains = mapping.domains?.some((d: string) => d.trim() !== "");
            const isHovered = hoveredCard === doctor._id;

            return (
              <div
                key={doctor._id}
                className={cn(
                  "group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]",
                  isHovered && "shadow-2xl scale-[1.02]",
                  mapping.enabled ? "ring-2 ring-green-200/50" : "ring-2 ring-gray-200/50"
                )}
                onMouseEnter={() => setHoveredCard(doctor._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50"></div>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
                  mapping.enabled 
                    ? "from-green-50/30 via-blue-50/20 to-purple-50/30 opacity-100" 
                    : "from-gray-50/30 via-slate-50/20 to-gray-50/30 opacity-60"
                )}></div>
                
                {/* Status Indicator */}
                <div className={cn(
                  "absolute top-6 right-6 w-4 h-4 rounded-full transition-all duration-300 border-2 border-white",
                  mapping.enabled ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" : "bg-gray-400"
                )}></div>

                {/* Header Section */}
                <div className="relative p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm transition-all duration-300",
                          mapping.enabled 
                            ? "bg-gradient-to-br from-slate-600 to-slate-700" 
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                        )}>
                          {doctor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-slate-600 transition-colors">
                            {doctor.name}
                          </h3>
                          <p className="text-gray-600 text-sm">{doctor.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasActiveDomains && (
                          <Badge 
                            className={cn(
                              "text-xs font-medium px-2 py-1 rounded-full transition-all duration-300",
                              mapping.enabled 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full mr-1.5",
                              mapping.enabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
                            )}></div>
                            {mapping.enabled ? "Live" : "Inactive"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-white/70 border-gray-200 px-2 py-1">
                          ID: {doctor._id.slice(-8)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addDomain(doctor._id)}
                      className="bg-white/90 hover:bg-white border-gray-200 hover:border-slate-300 hover:text-slate-600 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="relative px-6 pb-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-600" />
                        Domains
                      </Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enabled-${doctor._id}`} className="text-xs font-medium">Active</Label>
                        <Switch
                          id={`enabled-${doctor._id}`}
                          checked={mapping.enabled}
                          onCheckedChange={(checked) => updateMapping(doctor._id, 'enabled', checked)}
                          className="data-[state=checked]:bg-slate-600"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {mapping.domains.map((domain: string, index: number) => (
                        <div key={index} className="group/domain flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:border-slate-300/50 transition-all duration-300">
                          <Input
                            placeholder="Enter domain (e.g., doctor.example.com)"
                            value={domain}
                            onChange={(e) => updateDomain(doctor._id, index, e.target.value)}
                            className="bg-white/80 border-0 focus:ring-2 focus:ring-slate-500/20 text-sm"
                          />
                          <div className="flex items-center gap-1">
                            {domain && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyDomain(domain)}
                                className="opacity-0 group-hover/domain:opacity-100 transition-opacity text-gray-500 hover:text-slate-600 h-8 w-8"
                              >
                                {copiedDomains.has(domain) ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            )}
                            {mapping.domains.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDomain(doctor._id, index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-200/50" />

                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      onClick={() => toggleCardExpansion(doctor._id)}
                      className="w-full justify-between p-3 h-auto bg-gray-50/50 hover:bg-gray-100/50 rounded-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-md">
                          <BarChart3 className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-sm">Analytics & Tracking</span>
                      </div>
                      <div className={cn(
                        "transition-transform duration-300",
                        isExpanded ? "rotate-180" : "rotate-0"
                      )}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>

                    {isExpanded && (
                      <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50/80 to-slate-50/30 rounded-lg border border-gray-200/50 backdrop-blur-sm">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                            Facebook Pixel ID
                          </Label>
                          <Input
                            placeholder="Enter Facebook Pixel ID"
                            value={mapping.pixelId || ""}
                            onChange={(e) => updateMapping(doctor._id, 'pixelId', e.target.value)}
                            className="bg-white/80 border-0 focus:ring-2 focus:ring-slate-500/20 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                            Google Analytics ID
                          </Label>
                          <Input
                            placeholder="Enter Google Analytics ID (e.g., GA-XXXXXXXXX-X)"
                            value={mapping.googleAnalyticsId || ""}
                            onChange={(e) => updateMapping(doctor._id, 'googleAnalyticsId', e.target.value)}
                            className="bg-white/80 border-0 focus:ring-2 focus:ring-slate-500/20 text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium flex items-center gap-2 text-gray-700">
                              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                              Google Site Verification
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newMappings = [...domainMappings];
                                const idx = newMappings.findIndex((m) => m.userId === doctor._id);
                                if (idx >= 0) {
                                  if (!newMappings[idx].googleSiteVerification) {
                                    newMappings[idx].googleSiteVerification = [""];
                                  }
                                  newMappings[idx].googleSiteVerification.push("");
                                  setDomainMappings(newMappings);
                                }
                              }}
                              className="h-6 text-xs px-2 text-slate-600 hover:text-slate-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(mapping.googleSiteVerification || [""]).map((verification: string, vIndex: number) => (
                              <div key={vIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder="Enter verification content (e.g., F6Z5g8QOSIDOQFgt0qZMojXp6N07Qwdx_tODQHsliwE)"
                                  value={verification}
                                  onChange={(e) => {
                                    const newMappings = [...domainMappings];
                                    const idx = newMappings.findIndex((m) => m.userId === doctor._id);
                                    if (idx >= 0) {
                                      if (!newMappings[idx].googleSiteVerification) {
                                        newMappings[idx].googleSiteVerification = [""];
                                      }
                                      newMappings[idx].googleSiteVerification[vIndex] = e.target.value;
                                      setDomainMappings(newMappings);
                                    }
                                  }}
                                  className="bg-white/80 border-0 focus:ring-2 focus:ring-slate-500/20 text-sm"
                                />
                                {(mapping.googleSiteVerification?.length || 1) > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newMappings = [...domainMappings];
                                      const idx = newMappings.findIndex((m) => m.userId === doctor._id);
                                      if (idx >= 0 && newMappings[idx].googleSiteVerification) {
                                        newMappings[idx].googleSiteVerification.splice(vIndex, 1);
                                        setDomainMappings(newMappings);
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t p-4 -mx-6">
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 text-base font-medium">
          {isSaving ? (
            <Loading variant="button" size="md" text="Saving Configuration..." />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {!isSaving && 'Save All Domain Mappings'}
        </Button>
      </div>
    </div>
  );
}