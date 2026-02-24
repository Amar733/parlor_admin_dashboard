"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Save, Loader2, Calendar, Coffee } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/config/api";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (UTC+5:30)" },
  { value: "America/New_York", label: "America/New_York (UTC-5:00)" },
  { value: "America/Chicago", label: "America/Chicago (UTC-6:00)" },
  { value: "America/Denver", label: "America/Denver (UTC-7:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8:00)" },
  { value: "Europe/London", label: "Europe/London (UTC+0:00)" },
  { value: "Europe/Paris", label: "Europe/Paris (UTC+1:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (UTC+11:00)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (UTC+13:00)" },
];

interface AccessTimeConfig {
  _id?: string;
  key: string;
  pageName: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  isEnabled: boolean;
  allowWeekends: boolean;
  daysOfWeek: number[];
  breakTimes: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
  holidays: Array<{
    date: string;
    reason: string;
  }>;
  gracePeriodMinutes: number;
  messages: {
    beforeOpen: string;
    afterClose: string;
    onBreak: string;
    onHoliday: string;
  };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAGE_CONFIGS = [
  { key: "pos_access_time", name: "Point of Sale" },
   { key: "appointments_access_time", name: "Appointments" },
  // { key: "inventory_access_time", name: "Inventory" },
  // { key: "reports_access_time", name: "Reports" },
];

export default function AccessTimeSettingsPage() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("pos_access_time");
  const [configs, setConfigs] = useState<Record<string, AccessTimeConfig>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const promises = PAGE_CONFIGS.map(async (page) => {
        const res = await authFetch(
          `${API_BASE_URL}/api/settings/access-time?key=${page.key}`
        );
        const data = await res.json();
        return { key: page.key, config: data.success ? data.data : getDefaultConfig(page.key, page.name) };
      });

      const results = await Promise.all(promises);
      const configMap: Record<string, AccessTimeConfig> = {};
      results.forEach(({ key, config }) => {
        configMap[key] = config;
      });
      setConfigs(configMap);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load configurations",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (key: string, pageName: string): AccessTimeConfig => ({
    key,
    pageName,
    openTime: "09:00",
    closeTime: "21:00",
    timezone: "Asia/Kolkata",
    isEnabled: false,
    allowWeekends: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    breakTimes: [],
    holidays: [],
    gracePeriodMinutes: 0,
    messages: {
      beforeOpen: `${pageName} will open at {openTime}. Please wait.`,
      afterClose: `${pageName} is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.`,
      onBreak: "System is on break until {endTime}.",
      onHoliday: "System is closed today for {reason}.",
    },
  });

  const updateConfig = (key: string, updates: Partial<AccessTimeConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const toggleDay = (key: string, day: number) => {
    const config = configs[key];
    const daysOfWeek = config.daysOfWeek.includes(day)
      ? config.daysOfWeek.filter((d) => d !== day)
      : [...config.daysOfWeek, day].sort();
    updateConfig(key, { daysOfWeek });
  };

  const addBreakTime = (key: string) => {
    const config = configs[key];
    updateConfig(key, {
      breakTimes: [...config.breakTimes, { startTime: "13:00", endTime: "14:00", reason: "Lunch Break" }],
    });
  };

  const removeBreakTime = (key: string, index: number) => {
    const config = configs[key];
    updateConfig(key, {
      breakTimes: config.breakTimes.filter((_, i) => i !== index),
    });
  };

  const updateBreakTime = (key: string, index: number, field: string, value: string) => {
    const config = configs[key];
    const breakTimes = [...config.breakTimes];
    breakTimes[index] = { ...breakTimes[index], [field]: value };
    updateConfig(key, { breakTimes });
  };

  const addHoliday = (key: string) => {
    const config = configs[key];
    const today = new Date().toISOString().split("T")[0];
    updateConfig(key, {
      holidays: [...config.holidays, { date: today, reason: "Holiday" }],
    });
  };

  const removeHoliday = (key: string, index: number) => {
    const config = configs[key];
    updateConfig(key, {
      holidays: config.holidays.filter((_, i) => i !== index),
    });
  };

  const updateHoliday = (key: string, index: number, field: string, value: string) => {
    const config = configs[key];
    const holidays = [...config.holidays];
    holidays[index] = { ...holidays[index], [field]: value };
    updateConfig(key, { holidays });
  };

  const saveConfig = async (key: string) => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/settings/access-time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configs[key]),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Access Time Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure time-based access restrictions for different pages
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          {PAGE_CONFIGS.map((page) => (
            <TabsTrigger key={page.key} value={page.key}>
              {page.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PAGE_CONFIGS.map((page) => {
          const config = configs[page.key];
          if (!config) return null;

          return (
            <TabsContent key={page.key} value={page.key} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Status</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.isEnabled}
                        onCheckedChange={(checked) => updateConfig(page.key, { isEnabled: checked })}
                      />
                      <Badge variant={config.isEnabled ? "default" : "secondary"}>
                        {config.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operating Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opening Time</Label>
                      <Input
                        type="time"
                        value={config.openTime}
                        onChange={(e) => updateConfig(page.key, { openTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Closing Time</Label>
                      <Input
                        type="time"
                        value={config.closeTime}
                        onChange={(e) => updateConfig(page.key, { closeTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Grace Period (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={config.gracePeriodMinutes}
                      onChange={(e) =>
                        updateConfig(page.key, { gracePeriodMinutes: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={config.timezone}
                      onValueChange={(value) => updateConfig(page.key, { timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {DAYS.map((day, index) => (
                      <Button
                        key={index}
                        variant={config.daysOfWeek.includes(index) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(page.key, index)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coffee className="h-5 w-5" />
                      Break Times
                    </CardTitle>
                    <Button size="sm" onClick={() => addBreakTime(page.key)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Break
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {config.breakTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No break times configured</p>
                  ) : (
                    config.breakTimes.map((breakTime, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="time"
                            value={breakTime.startTime}
                            onChange={(e) => updateBreakTime(page.key, index, "startTime", e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">End</Label>
                          <Input
                            type="time"
                            value={breakTime.endTime}
                            onChange={(e) => updateBreakTime(page.key, index, "endTime", e.target.value)}
                          />
                        </div>
                        <div className="flex-[2] space-y-2">
                          <Label className="text-xs">Reason</Label>
                          <Input
                            value={breakTime.reason}
                            onChange={(e) => updateBreakTime(page.key, index, "reason", e.target.value)}
                            placeholder="Lunch Break"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBreakTime(page.key, index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Holidays
                    </CardTitle>
                    <Button size="sm" onClick={() => addHoliday(page.key)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Holiday
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {config.holidays.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No holidays configured</p>
                  ) : (
                    config.holidays.map((holiday, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={holiday.date}
                            onChange={(e) => updateHoliday(page.key, index, "date", e.target.value)}
                          />
                        </div>
                        <div className="flex-[2] space-y-2">
                          <Label className="text-xs">Reason</Label>
                          <Input
                            value={holiday.reason}
                            onChange={(e) => updateHoliday(page.key, index, "reason", e.target.value)}
                            placeholder="Holiday Name"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeHoliday(page.key, index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Before Opening</Label>
                    <Textarea
                      value={config.messages.beforeOpen}
                      onChange={(e) =>
                        updateConfig(page.key, {
                          messages: { ...config.messages, beforeOpen: e.target.value },
                        })
                      }
                      placeholder="Use {openTime} as placeholder"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>After Closing</Label>
                    <Textarea
                      value={config.messages.afterClose}
                      onChange={(e) =>
                        updateConfig(page.key, {
                          messages: { ...config.messages, afterClose: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>On Break</Label>
                    <Textarea
                      value={config.messages.onBreak}
                      onChange={(e) =>
                        updateConfig(page.key, {
                          messages: { ...config.messages, onBreak: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Holiday</Label>
                    <Textarea
                      value={config.messages.onHoliday}
                      onChange={(e) =>
                        updateConfig(page.key, {
                          messages: { ...config.messages, onHoliday: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => saveConfig(page.key)} disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
