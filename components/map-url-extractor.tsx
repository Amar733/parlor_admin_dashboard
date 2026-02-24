"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MapUrlExtractorProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export function MapUrlExtractor({ value, onChange, label = "Google Maps URL", placeholder = "Paste Google Maps URL or iframe embed code" }: MapUrlExtractorProps) {
  const extractMapUrl = (input: string): string => {
    if (!input.trim()) return "";
    
    // Decode HTML entities using DOM API
    const textarea = document.createElement("textarea");
    textarea.innerHTML = input;
    const decoded = textarea.value;
    
    // Extract URL from iframe src attribute
    const match = decoded.match(/src=["']([^"']+)["']/);
    return match ? match[1] : input;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const extracted = extractMapUrl(e.target.value);
    onChange(extracted);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={4}
        className="resize-none"
      />
    </div>
  );
}
