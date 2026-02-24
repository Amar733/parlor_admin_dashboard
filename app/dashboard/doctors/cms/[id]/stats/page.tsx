"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, X } from "lucide-react";
import { fetchSectionData, saveSectionData } from "@/lib/cms-utils";

export default function StatsPage() {
  const params = useParams();
  const doctorId = params.id as string;
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<any>({
    enabled: true,
    items: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const sectionData = await fetchSectionData(doctorId, "stats");
      if (sectionData) {
        setData(sectionData);
      }
      setIsLoading(false);
    };
    loadData();
  }, [doctorId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveSectionData(authFetch, doctorId, "stats", data);
      if (success) {
        toast({ title: "Success", description: "Statistics saved successfully" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save statistics" });
    } finally {
      setIsSaving(false);
    }
  };

  const addStat = () => {
    setData({
      ...data,
      items: [...data.items, {
        id: Date.now().toString(),
        number: "",
        suffix: "",
        title: "",
        description: ""
      }]
    });
  };

  const removeStat = (index: number) => {
    const newItems = data.items.filter((_: any, i: number) => i !== index);
    setData({ ...data, items: newItems });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, items: newItems });
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
        <h1 className="text-2xl font-bold">Statistics Section</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
            />
            <span className="text-sm font-medium">
              {data.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <Button onClick={addStat} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Statistic
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.items?.map((stat: any, index: number) => (
          <Card key={stat.id || index} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold">Statistic {index + 1}</h3>
              <Button variant="destructive" size="icon" onClick={() => removeStat(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Number</Label>
                  <Input
                    value={stat.number || ""}
                    onChange={(e) => updateStat(index, "number", e.target.value)}
                    placeholder="95"
                  />
                </div>
                <div>
                  <Label>Suffix</Label>
                  <Input
                    value={stat.suffix || ""}
                    onChange={(e) => updateStat(index, "suffix", e.target.value)}
                    placeholder="% or K or +"
                  />
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={stat.title || ""}
                  onChange={(e) => updateStat(index, "title", e.target.value)}
                  placeholder="positive reviews"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={stat.description || ""}
                  onChange={(e) => updateStat(index, "description", e.target.value)}
                  placeholder="from my satisfy client"
                />
              </div>
            </div>
          </Card>
        ))}

        {data.items?.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <p className="text-muted-foreground mb-4">No statistics added yet.</p>
            <Button onClick={addStat} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Statistic
            </Button>
          </Card>
        )}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Statistics
      </Button>
    </div>
  );
}