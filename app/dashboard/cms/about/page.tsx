"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, RefreshCcw, Globe, Tag, Eye, EyeOff, Users, Target, Heart, Briefcase, Award } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

// Import all tab components
import { HeroTab } from "./components/hero-tab";
import { AboutTab } from "./components/about-tab";
import { WhatWeDoTab } from "./components/what-we-do-tab";
import { TeamsTab } from "./components/teams-tab";
import { MissionVisionTab } from "./components/mission-vision-tab";
import { CoreValuesTab } from "./components/core-values-tab";
import { CTATab } from "./components/cta-tab";
import { StatsTab } from "./components/stats-tab";
import { SeoTab } from "./components/seo-tab";

import type { NewAboutPageData } from "./types";

const defaultAboutData: NewAboutPageData = {
  page: "home",
  section: "newAbout",
  data: {
    isEnable: true,
    hero: {
      heading: { html: "" },
      subheading: { html: "" },
      cta: {
        primary: { enabled: true, text: "", showIcon: false },
        secondary: { enabled: true, text: "", showIcon: false },
        tertiary: { enabled: false, text: "", showIcon: false },
      },
    },
    about: {
      heading: { html: "" },
      description: { html: "" },
      image: "",
    },
    whatWeDo: {
      heading: { html: "" },
      subheading: { html: "" },
      services: [],
    },
    teams: {
      heading: { html: "" },
      list: [],
    },
    missionVision: {
      mission: { title: { html: "" }, description: { html: "" } },
      vision: { title: { html: "" }, description: { html: "" } },
    },
    coreValues: {
      heading: { html: "" },
      list: [],
    },
    cta: {
      heading: { html: "" },
      subheading: { html: "" },
      buttons: {
        primary: { enabled: true, text: "", showIcon: false },
        secondary: { enabled: true, text: "", showIcon: false },
        tertiary: { enabled: false, text: "", showIcon: false },
      },
    },
    stats: {
      clients: { html: "" },
      clientsText: { html: "" },
    },
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "about-us",
      schemaMarkup: "",
    },
  },
};

export default function AboutPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [aboutData, setAboutData] = useState<NewAboutPageData>(defaultAboutData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/newAbout/`);

      if (response.ok) {
        const res = await response.json();
        const loadedData = {
          page: res.page || "home",
          section: res.section || "newAbout",
          data: {
            ...defaultAboutData.data,
            ...res.data,
            isEnable: res.data?.isEnable ?? true,
          },
        };
        setAboutData(loadedData);
      } else {
        setAboutData(defaultAboutData);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch About Us data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleChange = async (checked: boolean) => {
    // payloadHere
    const updatedData = {
      ...aboutData,
      data: {
        ...aboutData.data,
        isEnable: checked,
      },
    };
    setAboutData(updatedData);

    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/newAbout/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        toast({ title: `About Us section ${checked ? 'enabled' : 'disabled'} successfully` });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/newAbout/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aboutData),
      });

      if (response.ok) {
        toast({ title: "About Us section saved successfully" });
        loadData();
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save About Us data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = <K extends keyof NewAboutPageData['data']>(
    section: K,
    value: NewAboutPageData['data'][K]
  ) => {
    setAboutData({
      ...aboutData,
      data: {
        ...aboutData.data,
        [section]: value,
      },
    });
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                About Us Management
              </h1>
              <p className="text-purple-100">
                Manage your About Us page content
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <Switch
                  checked={aboutData.data.isEnable}
                  onCheckedChange={handleToggleChange}
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
          About Us Page
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {aboutData.section}
        </Badge>
        <div className="text-sm text-muted-foreground ml-auto">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl">
          <TabsTrigger
            value="hero"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Hero</span>
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
          <TabsTrigger
            value="whatWeDo"
            className="flex-1 min-w-[120px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">What We Do</span>
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger
            value="missionVision"
            className="flex-1 min-w-[140px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Mission/Vision</span>
          </TabsTrigger>
          <TabsTrigger
            value="coreValues"
            className="flex-1 min-w-[120px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Core Values</span>
          </TabsTrigger>
          <TabsTrigger
            value="cta"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">CTA</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger
            value="seo"
            className="flex-1 min-w-[100px] h-9 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroTab
            hero={aboutData.data.hero}
            onChange={(hero) => updateSection('hero', hero)}
          />
        </TabsContent>

        <TabsContent value="about">
          <AboutTab
            about={aboutData.data.about}
            onChange={(about) => updateSection('about', about)}
          />
        </TabsContent>

        <TabsContent value="whatWeDo">
          <WhatWeDoTab
            whatWeDo={aboutData.data.whatWeDo}
            onChange={(whatWeDo) => updateSection('whatWeDo', whatWeDo)}
          />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab
            teams={aboutData.data.teams}
            onChange={(teams) => updateSection('teams', teams)}
          />
        </TabsContent>

        <TabsContent value="missionVision">
          <MissionVisionTab
            missionVision={aboutData.data.missionVision}
            onChange={(missionVision) => updateSection('missionVision', missionVision)}
          />
        </TabsContent>

        <TabsContent value="coreValues">
          <CoreValuesTab
            coreValues={aboutData.data.coreValues}
            onChange={(coreValues) => updateSection('coreValues', coreValues)}
          />
        </TabsContent>

        <TabsContent value="cta">
          <CTATab
            cta={aboutData.data.cta}
            onChange={(cta) => updateSection('cta', cta)}
          />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTab
            stats={aboutData.data.stats}
            onChange={(stats) => updateSection('stats', stats)}
          />
        </TabsContent>

        <TabsContent value="seo">
          <SeoTab
            seo={aboutData.data.seo}
            onChange={(seo) => updateSection('seo', seo)}
          />
        </TabsContent>
      </Tabs>

      {/* Save Section */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Ready to save About Us settings
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadData} disabled={isSaving}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button
                onClick={handleSave}
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
        </CardContent>
      </Card>
    </div>
  );
}