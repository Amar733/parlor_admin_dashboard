"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, RefreshCcw, Settings, Globe, Tag, Palette } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface SettingsData {
  page: string;
  section: string;
  data: {
    enabled: boolean;
    version: string;
    colorPalette: string;
    availableVersions: Array<{
      name: string;
      label: string;
    }>;
    availablePalettes: Array<{
      name: string;
      label: string;
      colors: string[];
    }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

const defaultSettingsData: SettingsData = {
  page: "home",
  section: "settings",
  data: {
    enabled: true,
    version: "v2",
    colorPalette: "rose",
    availableVersions: [
      { name: "v1", label: "Classic Style" },
      { name: "v2", label: "Modern Style" },
      { name: "v3", label: "Minimal Style" },
      { name: "v4", label: "Advanced Style" }
    ],
    availablePalettes: [
      { name: "default", label: "Default", colors: ["hsl(173 80% 25%)", "hsl(174 65% 85%)"] },
      { name: "green", label: "Green", colors: ["hsl(142 76% 36%)", "hsl(142 50% 90%)"] },
      { name: "blue", label: "Blue", colors: ["hsl(217 91% 60%)", "hsl(216 100% 97%)"] },
      { name: "rose", label: "Rose", colors: ["hsl(347 77% 58%)", "hsl(347 30% 92%)"] },
      { name: "indigo", label: "Indigo", colors: ["hsl(245 86% 59%)", "hsl(245 50% 93%)"] },
      { name: "orange", label: "Orange", colors: ["hsl(25 95% 53%)", "hsl(25 50% 94%)"] },
      { name: "slate", label: "Slate", colors: ["hsl(215 39% 51%)", "hsl(215 20% 92%)"] },
      { name: "stone", label: "Stone", colors: ["hsl(35 22% 50%)", "hsl(35 15% 91%)"] },
      { name: "violet", label: "Violet", colors: ["hsl(262 82% 62%)", "hsl(262 50% 93%)"] },
      { name: "teal", label: "Teal", colors: ["hsl(180 75% 40%)", "hsl(180 40% 90%)"] },
      { name: "red", label: "Red", colors: ["hsl(0 72% 51%)", "hsl(0 80% 96%)"] }
    ]
  },
};

export default function SettingsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [settingsData, setSettingsData] = useState<SettingsData>(defaultSettingsData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/settings/`);

      if (response.ok) {
        const res = await response.json();
        setSettingsData({
          page: res.page,
          section: res.section,
          data: res.data || defaultSettingsData.data,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch settings data.",
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
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        toast({ title: "Settings saved successfully" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVersionChange = (version: string) => {
    setSettingsData(prev => ({
      ...prev,
      data: { ...prev.data, version }
    }));
  };

  const handlePaletteChange = (palette: string) => {
    setSettingsData(prev => ({
      ...prev,
      data: { ...prev.data, colorPalette: palette }
    }));
  };

  const handleEnabledChange = async (enabled: boolean) => {
    const updatedData = {
      ...settingsData,
      data: { ...settingsData.data, enabled }
    };
    setSettingsData(updatedData);
    
    setIsSaving(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/cms/home/settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        toast({ title: "Settings saved automatically" });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings CMS</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage homepage settings and appearance
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
          {settingsData.page}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Settings Section
        </Badge>
        {settingsData.updatedAt && (
          <div className="text-sm text-muted-foreground ml-auto">
            <strong>Last Updated:</strong> {new Date(settingsData.updatedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* General Settings */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Homepage</Label>
              <p className="text-xs text-muted-foreground">
                Toggle to enable or disable the homepage
              </p>
            </div>
            <Switch
              checked={settingsData.data.enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Version Selection */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Style Version
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingsData.data.availableVersions.map((version) => (
              <div
                key={version.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  settingsData.data.version === version.name
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-900/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleVersionChange(version.name)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      settingsData.data.version === version.name
                        ? "border-slate-500 bg-slate-500"
                        : "border-gray-300"
                    }`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {version.label}
                    </h4>
                    <p className="text-sm text-gray-500">{version.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Selection */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-slate-600" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsData.data.availablePalettes.map((palette) => (
              <div
                key={palette.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  settingsData.data.colorPalette === palette.name
                    ? "border-slate-500 bg-slate-50 dark:bg-slate-900/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePaletteChange(palette.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {palette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {palette.label}
                    </h4>
                    <p className="text-sm text-gray-500">{palette.name}</p>
                  </div>
                  {settingsData.data.colorPalette === palette.name && (
                    <div className="w-4 h-4 rounded-full bg-slate-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to save settings
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