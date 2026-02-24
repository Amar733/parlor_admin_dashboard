"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Palette, Settings, GripVertical } from "lucide-react";
import { fetchSectionData, saveSectionData } from "@/lib/cms-utils";

export default function SettingsPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const defaultLayout = {
    enabled: true,
    version: "v1",
    colorPalette: "blue",
    layoutOrder: [
      "topbar",
      "navbar",
      "carousel",
      "stats",
      "homepage_about",
      "services",
      "before_after",
      "testimonials",
      "faq",
      "appointment",
      "blog",
      "footer",
    ],
    fixedSections: ["topbar", "navbar", "footer"],
    availablePalettes: [
      {
        name: "blue",
        label: "Medical Blue",
        colors: ["#0F4C75", "#3282B8", "#16A085"],
      },
      {
        name: "red",
        label: "Medical Red",
        colors: ["#991B1B", "#DC2626", "#EF4444"],
      },
      {
        name: "green",
        label: "Medical Green",
        colors: ["#065F46", "#059669", "#10B981"],
      },
      {
        name: "purple",
        label: "Medical Purple",
        colors: ["#581C87", "#7C3AED", "#8B5CF6"],
      },
      {
        name: "orange",
        label: "Medical Orange",
        colors: ["#9A3412", "#EA580C", "#F97316"],
      },
    ],
    availableVersions: [
      { name: "v1", label: "Classic Style" },
      { name: "v2", label: "Modern Style" },
      { name: "v3", label: "Minimal Style" },
    ],
  };

  const [data, setData] = useState<any>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await fetchSectionData(doctorId, "settings");
      if (sectionData) {
        // Merge existing layout order with default, ensuring all sections are present
        const existingOrder = sectionData.layoutOrder || [];
        const mergedOrder = [...defaultLayout.layoutOrder];
        
        // Add any existing sections not in default
        existingOrder.forEach((section: string) => {
          if (!mergedOrder.includes(section)) {
            mergedOrder.push(section);
          }
        });
        
        setData({ 
          ...defaultLayout, 
          ...sectionData, 
          layoutOrder: mergedOrder 
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, [doctorId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveSectionData(
        authFetch,
        doctorId,
        "settings",
        data
      );
      if (success) {
        toast({ title: "Success", description: "Settings saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
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
        <h1 className="text-2xl font-bold text-blue-600">Website Settings</h1>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Configuration</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Website</Label>
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) =>
                setData({ ...data, enabled: checked })
              }
            />
          </div>
          <div>
            <Label>Website Version</Label>
            <Select
              value={data.version}
              onValueChange={(value) => setData({ ...data, version: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.availableVersions?.map((version: any) => (
                  <SelectItem key={version.name} value={version.name}>
                    {version.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.layoutOrder?.map((section: string, index: number) => (
              <div
                key={section}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="font-medium capitalize">
                    {section.replace("_", " ")}
                  </span>
                  {data.fixedSections?.includes(section) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Fixed
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.availablePalettes?.map((palette: any) => (
              <div
                key={palette.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  data.colorPalette === palette.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setData({ ...data, colorPalette: palette.name })}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{palette.label}</span>
                  {data.colorPalette === palette.name && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex gap-1">
                  {palette.colors?.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
