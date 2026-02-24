"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RefreshCcw, Layers, Globe, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config/api";
import { HeroTab } from "./components/hero-tab";
import { SEOTab } from "./components/seo-tab";
import { ChallengesTab } from "./components/challenges-tab";
import { FrameworkTab } from "./components/framework-tab";
import type { FeaturesData } from "./types";

const defaultFeaturesData: FeaturesData = {
  hero: {
    heading: {
      html: 'Everything Your Clinic Needs for <span style="color: hsl(var(--accent)); position: relative; display: inline-block;">Strong Organic Growth<span style="position: absolute; bottom: -0.5rem; left: 0; right: 0; height: 0.25rem; background: hsl(var(--accent) / 0.5); border-radius: 9999px;"></span></span> In One System'
    },
    subheading: {
      html: 'Doctors don\'t fail online because they are bad doctors. They fail because <span style="font-weight: 700; color: white; border-bottom: 2px solid hsl(var(--accent) / 0.5);">digital growth</span> requires consistency, systems, and time — things doctors don\'t have.'
    },
    cta: {
      primary: { enabled: true, text: 'Schedule a Free Consultation', showIcon: true, chooseModuleToOpen: 'appointment' },
      secondary: { enabled: true, text: 'Watch Demo', showIcon: true, chooseModuleToOpen: 'demo' },
      tertiary: { enabled: false, text: 'Contact Us', showIcon: true, chooseModuleToOpen: 'call' }
    }
  },
  challenges: [],
  framework: [],
  seo: {
    title: 'Features - Healthcare Digital Growth System',
    description: 'Everything your clinic needs for strong organic growth in one system. Digital presence, optimization, and conversion.',
    keywords: ['healthcare marketing', 'clinic growth', 'digital presence', 'patient acquisition'],
    slug: 'features',
    schemaMarkup: ''
  },
  challengesSection: {
    heading: { html: 'Doctors are Facing These <span style="color: #3b82f6">Challenges</span>' },
    subheading: { html: 'We understand the unique struggles healthcare professionals face in the digital landscape' }
  },
  frameworkSection: {
    heading: { html: 'Our <span style="color: #3b82f6">3-Phase Growth</span> Framework' },
    subheading: { html: 'A systematic approach to building your digital presence and attracting more patients' }
  },
  isEnable: true,
};

export default function FeaturesPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [featuresData, setFeaturesData] = useState<FeaturesData>(defaultFeaturesData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [isSchemaValid, setIsSchemaValid] = useState(true);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/featuresPage`);

      if (response.ok) {
        const res = await response.json();
        const hasData = res.data && (res.data.hero || res.data.challenges?.length || res.data.framework?.length);

        setFeaturesData(hasData ? {
          hero: res.data?.hero || defaultFeaturesData.hero,
          challenges: res.data?.challenges || [],
          framework: res.data?.framework || [],
          challengesSection: res.data?.challengesSection || defaultFeaturesData.challengesSection,
          frameworkSection: res.data?.frameworkSection || defaultFeaturesData.frameworkSection,
          seo: res.data?.seo || defaultFeaturesData.seo,
          isEnable: res.data?.isEnable ?? true,
          updatedAt: res.updatedAt,
          createdAt: res.createdAt,
        } : defaultFeaturesData);
      } else {
        setFeaturesData(defaultFeaturesData);
      }
    } catch (error) {
      setFeaturesData(defaultFeaturesData);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch features data. Loaded default data.",
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
      const payload = {
        page: "home",
        section: "featuresPage",
        data: {
          isEnable: featuresData.isEnable,
          hero: featuresData.hero,
          challenges: featuresData.challenges.map((c) => ({
            id: c.id,
            enabled: c.enabled ?? true,
            title: c.title,
            description: c.description,
            image: c.image
          })),
          framework: featuresData.framework.map((f) => ({
            id: f.id,
            enabled: f.enabled ?? true,
            phase: f.phase,
            tagline: f.tagline,
            youtubeUrl: f.youtubeUrl,
            features: f.features,
            result: f.result
          })),
          challengesSection: featuresData.challengesSection,
          frameworkSection: featuresData.frameworkSection,
          seo: featuresData.seo
        }
      };

      const response = await authFetch(`${API_BASE_URL}/api/cms/home/featuresPage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Features saved successfully" });
        loadData();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save features data.",
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Layers className="h-6 w-6" />
                Features Management
              </h1>
              <p className="text-blue-100">
                Manage hero, challenges, framework, and SEO
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <Switch
                  checked={featuresData.isEnable}
                  onCheckedChange={(checked) =>
                    setFeaturesData({ ...featuresData, isEnable: checked })
                  }
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
          Features Page
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {featuresData.challenges.length} Challenges • {featuresData.framework.length} Framework Steps
        </Badge>
        {featuresData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong>{" "}
            {new Date(featuresData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroTab
            hero={featuresData.hero}
            onChange={(hero) => setFeaturesData({ ...featuresData, hero })}
          />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesTab
            challenges={featuresData.challenges}
            sectionHeader={featuresData.challengesSection}
            onChange={(challenges) => setFeaturesData({ ...featuresData, challenges })}
            onHeaderChange={(header) => setFeaturesData({ ...featuresData, challengesSection: header })}
          />
        </TabsContent>

        <TabsContent value="framework">
          <FrameworkTab
            framework={featuresData.framework}
            sectionHeader={featuresData.frameworkSection}
            onChange={(framework) => setFeaturesData({ ...featuresData, framework })}
            onHeaderChange={(header) => setFeaturesData({ ...featuresData, frameworkSection: header })}
          />
        </TabsContent>

        <TabsContent value="seo">
          <SEOTab
            seo={featuresData.seo}
            onChange={(seo) => setFeaturesData({ ...featuresData, seo })}
            onValidationChange={setIsSchemaValid}
          />
        </TabsContent>
      </Tabs>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save features settings
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={isSaving}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[160px] bg-blue-600 hover:bg-blue-700"
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
