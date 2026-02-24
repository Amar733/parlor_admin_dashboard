"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Tag, X, Info, Code2 } from "lucide-react";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";
import type { SEOData } from "../types";

interface SeoTabProps {
    seo: SEOData;
    onChange: (seo: SEOData) => void;
}

export function SeoTab({ seo, onChange }: SeoTabProps) {
    const [keywordInput, setKeywordInput] = useState("");
    const [isSchemaValid, setIsSchemaValid] = useState(true);

    const handleFieldChange = (field: keyof SEOData, value: string | string[]) => {
        onChange({
            ...seo,
            [field]: value
        });
    };

    const addKeyword = () => {
        const trimmed = keywordInput.trim();
        if (!trimmed) return;

        const currentKeywords = seo.keywords || [];
        if (!currentKeywords.includes(trimmed)) {
            handleFieldChange("keywords", [...currentKeywords, trimmed]);
        }
        setKeywordInput("");
    };

    const removeKeyword = (index: number) => {
        const newKeywords = (seo.keywords || []).filter((_, i) => i !== index);
        handleFieldChange("keywords", newKeywords);
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">SEO Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Optimize how this page appears in search engines and social media.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                SEO Title
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </Label>
                            <Input
                                placeholder="e.g., About Us - Expert Healthcare & Support"
                                value={seo.title}
                                onChange={(e) => handleFieldChange("title", e.target.value)}
                                className="h-11 border-2 focus:ring-purple-500 rounded-xl"
                            />
                            <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider">
                                <span className={seo.title.length > 60 ? "text-rose-500" : "text-muted-foreground"}>
                                    {seo.title.length}/60 characters
                                </span>
                                <span className="text-muted-foreground">Standard search engines</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                SEO Slug
                                <Info className="h-4 w-4 text-muted-foreground/50" />
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/50 text-sm">
                                    /
                                </div>
                                <Input
                                    placeholder="about-us"
                                    value={seo.slug}
                                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                                    className="h-11 border-2 focus:ring-purple-500 rounded-xl pl-6"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                URL of the page (e.g., yoursite.com/about-us)
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            Meta Description
                            <Info className="h-4 w-4 text-muted-foreground/50" />
                        </Label>
                        <Textarea
                            placeholder="Provide a concise summary of your About Us page for search results..."
                            value={seo.description}
                            onChange={(e) => handleFieldChange("description", e.target.value)}
                            className="min-h-[120px] resize-none border-2 focus:ring-purple-500 rounded-xl p-4 leading-relaxed"
                        />
                        <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider">
                            <span className={seo.description.length > 160 ? "text-rose-500" : "text-muted-foreground"}>
                                {seo.description.length}/160 characters
                            </span>
                            <span className="text-muted-foreground">Appears in Google search snippets</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-dashed">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            Keywords
                            <Tag className="h-4 w-4 text-muted-foreground/50" />
                        </Label>
                        <div className="flex gap-3">
                            <Input
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                placeholder="Press Enter to add keyword..."
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                                className="h-11 border-2 focus:ring-purple-500 rounded-xl"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addKeyword}
                                className="h-11 rounded-xl px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                            >
                                Add
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {seo.keywords.map((keyword, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="pl-3 pr-1 py-1.5 rounded-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 flex items-center gap-1 group hover:border-purple-200 transition-all shadow-sm"
                                >
                                    <span className="text-sm font-medium">{keyword}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeKeyword(index)}
                                        className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {seo.keywords.length === 0 && (
                                <p className="text-sm text-muted-foreground italic bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-lg border border-dashed">
                                    No keywords added yet. Add relevant tags for better discovery.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow overflow-hidden mt-8">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Schema Markup</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Structured data for better search engine understanding (JSON-LD).
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 text-black dark:text-white">
                    <SchemaMarkupEditor
                        value={seo.schemaMarkup}
                        onChange={(value) => handleFieldChange("schemaMarkup", value)}
                        onValidationChange={setIsSchemaValid}
                    />
                    {!isSchemaValid && (
                        <p className="text-xs text-rose-500 mt-2 font-medium">
                            Please fix the JSON errors above to ensure your schema is valid.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
