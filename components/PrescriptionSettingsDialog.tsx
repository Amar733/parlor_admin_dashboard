"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Palette } from "lucide-react";

interface PrescriptionSettings {
  headerColor: string;
  logoShape: "circle" | "square" | "none";
  fontStyle: string;
  fontSize: number;
  textColor: string;
}

interface PrescriptionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: PrescriptionSettings;
  onSave: (settings: PrescriptionSettings) => Promise<void>;
}

const HEADER_COLORS = [
  { name: "Teal", value: "#0d9488", type: "solid" },
  { name: "Blue", value: "#2563eb", type: "solid" },
  { name: "Green", value: "#16a34a", type: "solid" },
  { name: "Purple", value: "#9333ea", type: "solid" },
  { name: "Red", value: "#dc2626", type: "solid" },
  { name: "Orange", value: "#ea580c", type: "solid" },
  { name: "Pink", value: "#db2777", type: "solid" },
  { name: "Indigo", value: "#4f46e5", type: "solid" },
  { name: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", type: "gradient" },
  { name: "Ocean", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", type: "gradient" },
  { name: "Forest", value: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)", type: "gradient" },
  { name: "Fire", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", type: "gradient" },
  { name: "Sky", value: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", type: "gradient" },
  { name: "Royal Purple", value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", type: "gradient" },
];

const TEXT_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Dark Gray", value: "#374151" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Brown", value: "#78350f" },
  { name: "Dark Green", value: "#14532d" },
];

const FONT_STYLES = [
  { name: "Default Sans", value: "system-ui, -apple-system, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Garamond", value: "Garamond, serif" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
  { name: "Palatino", value: "'Palatino Linotype', serif" },
  { name: "Calibri", value: "Calibri, sans-serif" },
  { name: "Cambria", value: "Cambria, serif" },
  { name: "Consolas", value: "Consolas, monospace" },
  { name: "Tahoma", value: "Tahoma, sans-serif" },
  { name: "Lucida", value: "'Lucida Sans', sans-serif" },
];

export function PrescriptionSettingsDialog({
  open,
  onOpenChange,
  currentSettings,
  onSave,
}: PrescriptionSettingsDialogProps) {
  const [settings, setSettings] = useState<PrescriptionSettings>(currentSettings);
  const [saving, setSaving] = useState(false);
  const [customColor, setCustomColor] = useState("#0d9488");
  const [gradientColor1, setGradientColor1] = useState("#667eea");
  const [gradientColor2, setGradientColor2] = useState("#764ba2");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Prescription Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Header Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Header Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {HEADER_COLORS.map((color, index) => (
                <button
                  key={`${color.name}-${index}`}
                  onClick={() => setSettings({ ...settings, headerColor: color.value })}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                    settings.headerColor === color.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md" style={{ background: color.value }} />
                  <span className="text-xs font-medium">{color.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center pt-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettings({ ...settings, headerColor: customColor })}
                className="flex-1"
              >
                Use Custom Color
              </Button>
            </div>
            <div className="flex gap-2 items-center pt-2">
              <input
                type="color"
                value={gradientColor1}
                onChange={(e) => setGradientColor1(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
              />
              <input
                type="color"
                value={gradientColor2}
                onChange={(e) => setGradientColor2(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettings({ ...settings, headerColor: `linear-gradient(135deg, ${gradientColor1} 0%, ${gradientColor2} 100%)` })}
                className="flex-1"
              >
                Use Custom Gradient
              </Button>
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Text Color</Label>
            <div className="grid grid-cols-5 gap-3">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, textColor: color.value })}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                    settings.textColor === color.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md" style={{ backgroundColor: color.value }} />
                  <span className="text-xs font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Font Size</Label>
              <span className="text-sm font-bold text-gray-600">{settings.fontSize}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="120"
              step="5"
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>80%</span>
              <span>100%</span>
              <span>120%</span>
            </div>
          </div>

          {/* Logo Shape */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Logo Shape</Label>
            <RadioGroup
              value={settings.logoShape}
              onValueChange={(value) => setSettings({ ...settings, logoShape: value as "circle" | "square" | "none" })}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="circle" id="circle" />
                <Label htmlFor="circle" className="flex-1 cursor-pointer">
                  Circle
                </Label>
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="square" id="square" />
                <Label htmlFor="square" className="flex-1 cursor-pointer">
                  Square
                </Label>
                <div className="w-8 h-8 rounded-md bg-gray-200" />
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex-1 cursor-pointer">
                  Transparent (No Background)
                </Label>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded" />
              </div>
            </RadioGroup>
          </div>

          {/* Font Style */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Font Style</Label>
            <RadioGroup
              value={settings.fontStyle}
              onValueChange={(value) => setSettings({ ...settings, fontStyle: value })}
              className="max-h-64 overflow-y-auto"
            >
              {FONT_STYLES.map((font) => (
                <div key={font.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={font.value} id={font.value} />
                  <Label htmlFor={font.value} className="flex-1 cursor-pointer" style={{ fontFamily: font.value }}>
                    {font.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
