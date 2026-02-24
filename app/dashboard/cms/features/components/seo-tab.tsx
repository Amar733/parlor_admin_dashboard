"use client";

import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Tag, X, Loader2 } from "lucide-react";
import { useState } from "react";

const SchemaMarkupEditor = lazy(() => import("@/components/schema-markup-editor").then(m => ({ default: m.SchemaMarkupEditor })));

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  schemaMarkup?: string;
}

interface SEOTabProps {
  seo: SEOData;
  onChange: (seo: SEOData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function SEOTab({ seo, onChange, onValidationChange }: SEOTabProps) {
  const [keywordInput, setKeywordInput] = useState("");

  const addKeyword = () => {
    if (!keywordInput.trim() || seo.keywords.includes(keywordInput.trim())) return;
    onChange({ ...seo, keywords: [...seo.keywords, keywordInput.trim()] });
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    onChange({ ...seo, keywords: seo.keywords.filter((_, i) => i !== index) });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>SEO Title</Label>
            <Input
              value={seo.title}
              onChange={(e) => onChange({ ...seo, title: e.target.value })}
              placeholder="Features - Healthcare Services"
            />
          </div>
          <div>
            <Label>SEO Slug</Label>
            <Input
              value={seo.slug}
              onChange={(e) => onChange({ ...seo, slug: e.target.value })}
              placeholder="features"
            />
          </div>
        </div>

        <div>
          <Label>SEO Description</Label>
          <Textarea
            value={seo.description}
            onChange={(e) => onChange({ ...seo, description: e.target.value })}
            placeholder="Discover our specialized healthcare features"
            rows={3}
          />
        </div>

        <div>
          <Label>Keywords</Label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add keyword"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {seo.keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <Suspense fallback={<div className="h-32 flex items-center justify-center border rounded"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
          <SchemaMarkupEditor
            value={seo.schemaMarkup || ""}
            onChange={(value) => onChange({ ...seo, schemaMarkup: value })}
            onValidationChange={onValidationChange}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
