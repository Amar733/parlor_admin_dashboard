"use client";

import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RichTextEditor = lazy(() => import("@/components/rich-text-editor").then(m => ({ default: m.RichTextEditor })));

interface HeroData {
  heading: { html: string };
  subheading: { html: string };
  cta: {
    primary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
    secondary: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
    tertiary?: { enabled: boolean; text: string; showIcon: boolean; chooseModuleToOpen: string; url?: string };
  };
}

interface HeroTabProps {
  hero: HeroData;
  onChange: (hero: HeroData) => void;
}

export function HeroTab({ hero, onChange }: HeroTabProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Hero Section
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="heroHeading">Heading</Label>
          <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <RichTextEditor
              value={hero.heading.html}
              onChange={(value) => onChange({ ...hero, heading: { html: value } })}
              placeholder="Enter heading"
            />
          </Suspense>
        </div>

        <div>
          <Label htmlFor="heroSubheading">Subheading</Label>
          <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <RichTextEditor
              value={hero.subheading.html}
              onChange={(value) => onChange({ ...hero, subheading: { html: value } })}
              placeholder="Enter subheading"
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary Button */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-medium mb-4">Primary CTA</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.primary.enabled}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { ...hero.cta, primary: { ...hero.cta.primary, enabled: checked } }
                  })}
                />
                <Label>Enabled</Label>
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={hero.cta.primary.text}
                  onChange={(e) => onChange({
                    ...hero,
                    cta: { ...hero.cta, primary: { ...hero.cta.primary, text: e.target.value } }
                  })}
                  placeholder="Schedule a Free Consultation"
                />
              </div>
              <div>
                <Label>Module to Open</Label>
                <Select
                  value={hero.cta.primary.chooseModuleToOpen}
                  onValueChange={(value) => onChange({
                    ...hero,
                    cta: { ...hero.cta, primary: { ...hero.cta.primary, chooseModuleToOpen: value } }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Book Appointment</SelectItem>
                    <SelectItem value="demo">Book Demo</SelectItem>
                    <SelectItem value="call">Call Us</SelectItem>
                    <SelectItem value="email">Email Us</SelectItem>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="services">Our Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hero.cta.primary.chooseModuleToOpen === "url" && (
                <div>
                  <Label>External URL</Label>
                  <Input
                    value={hero.cta.primary.url || ""}
                    onChange={(e) => onChange({
                      ...hero,
                      cta: { ...hero.cta, primary: { ...hero.cta.primary, url: e.target.value } }
                    })}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.primary.showIcon}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { ...hero.cta, primary: { ...hero.cta.primary, showIcon: checked } }
                  })}
                />
                <Label>Show Icon</Label>
              </div>
            </div>
          </Card>

          {/* Secondary Button */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-medium mb-4">Secondary CTA</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.secondary.enabled}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { ...hero.cta, secondary: { ...hero.cta.secondary, enabled: checked } }
                  })}
                />
                <Label>Enabled</Label>
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={hero.cta.secondary.text}
                  onChange={(e) => onChange({
                    ...hero,
                    cta: { ...hero.cta, secondary: { ...hero.cta.secondary, text: e.target.value } }
                  })}
                  placeholder="Watch Demo"
                />
              </div>
              <div>
                <Label>Module to Open</Label>
                <Select
                  value={hero.cta.secondary.chooseModuleToOpen}
                  onValueChange={(value) => onChange({
                    ...hero,
                    cta: { ...hero.cta, secondary: { ...hero.cta.secondary, chooseModuleToOpen: value } }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Book Appointment</SelectItem>
                    <SelectItem value="demo">Book Demo</SelectItem>
                    <SelectItem value="call">Call Us</SelectItem>
                    <SelectItem value="email">Email Us</SelectItem>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="services">Our Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hero.cta.secondary.chooseModuleToOpen === "url" && (
                <div>
                  <Label>External URL</Label>
                  <Input
                    value={hero.cta.secondary.url || ""}
                    onChange={(e) => onChange({
                      ...hero,
                      cta: { ...hero.cta, secondary: { ...hero.cta.secondary, url: e.target.value } }
                    })}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.secondary.showIcon}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { ...hero.cta, secondary: { ...hero.cta.secondary, showIcon: checked } }
                  })}
                />
                <Label>Show Icon</Label>
              </div>
            </div>
          </Card>

          {/* Tertiary Button */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-medium mb-4">Tertiary CTA</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.tertiary?.enabled ?? false}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { 
                      ...hero.cta, 
                      tertiary: { 
                        enabled: checked, 
                        text: hero.cta.tertiary?.text || "Contact Us", 
                        showIcon: hero.cta.tertiary?.showIcon ?? true,
                        chooseModuleToOpen: hero.cta.tertiary?.chooseModuleToOpen || "call"
                      } 
                    }
                  })}
                />
                <Label>Enabled</Label>
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={hero.cta.tertiary?.text || ""}
                  onChange={(e) => onChange({
                    ...hero,
                    cta: { 
                      ...hero.cta, 
                      tertiary: { 
                        ...hero.cta.tertiary!, 
                        text: e.target.value 
                      } 
                    }
                  })}
                  placeholder="Contact Us"
                />
              </div>
              <div>
                <Label>Module to Open</Label>
                <Select
                  value={hero.cta.tertiary?.chooseModuleToOpen || "call"}
                  onValueChange={(value) => onChange({
                    ...hero,
                    cta: { 
                      ...hero.cta, 
                      tertiary: { 
                        ...hero.cta.tertiary!, 
                        chooseModuleToOpen: value 
                      } 
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Book Appointment</SelectItem>
                    <SelectItem value="demo">Book Demo</SelectItem>
                    <SelectItem value="call">Call Us</SelectItem>
                    <SelectItem value="email">Email Us</SelectItem>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="services">Our Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hero.cta.tertiary?.chooseModuleToOpen === "url" && (
                <div>
                  <Label>External URL</Label>
                  <Input
                    value={hero.cta.tertiary?.url || ""}
                    onChange={(e) => onChange({
                      ...hero,
                      cta: { 
                        ...hero.cta, 
                        tertiary: { 
                          ...hero.cta.tertiary!, 
                          url: e.target.value 
                        } 
                      }
                    })}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={hero.cta.tertiary?.showIcon ?? true}
                  onCheckedChange={(checked) => onChange({
                    ...hero,
                    cta: { 
                      ...hero.cta, 
                      tertiary: { 
                        ...hero.cta.tertiary!, 
                        showIcon: checked 
                      } 
                    }
                  })}
                />
                <Label>Show Icon</Label>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
