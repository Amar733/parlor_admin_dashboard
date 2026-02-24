# CMS UI Components Guide

This guide provides standardized UI patterns and components for creating new CMS pages.

## Required Imports

```tsx
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, RefreshCcw, Upload, Tag, X, Eye, EyeOff, Globe } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { getAssetUrl } from "@/lib/asset-utils";
```

## Page Structure

### 1. Header Section
```tsx
<div className="bg-gradient-to-r from-[color]-50 to-[color2]-50 dark:from-[color]-950/20 dark:to-[color2]-950/20 rounded-xl p-6 border">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[color]-100 dark:bg-[color]-900/30 rounded-lg">
          <IconComponent className="h-6 w-6 text-[color]-600 dark:text-[color]-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Page Title CMS</h1>
          <p className="text-gray-600 dark:text-gray-300">Description of the page</p>
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
```

### 2. Status Bar
```tsx
<div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
  <Badge variant="secondary" className="flex items-center gap-1">
    <Globe className="h-3 w-3" />
    {data.page}
  </Badge>
  <Badge variant="outline" className="flex items-center gap-1">
    <Tag className="h-3 w-3" />
    {data.section}
  </Badge>
  {data.updatedAt && (
    <div className="text-sm text-muted-foreground ml-auto">
      <strong>Last Updated:</strong> {new Date(data.updatedAt).toLocaleString()}
    </div>
  )}
</div>
```

## Form Components

### 1. Basic Input Field
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">Field Label</Label>
  <Input
    placeholder="Placeholder text"
    value={data.fieldName}
    onChange={(e) => handleDataChange("fieldName", e.target.value)}
    className="h-11"
  />
</div>
```

### 2. Textarea Field
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">Description</Label>
  <Textarea
    placeholder="Enter description..."
    value={data.description}
    onChange={(e) => handleDataChange("description", e.target.value)}
    className="min-h-[80px] resize-none"
  />
</div>
```

### 3. Toggle Switch
```tsx
<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
  <div className="space-y-1">
    <Label className="text-base font-medium">Section Status</Label>
    <p className="text-sm text-muted-foreground">Toggle section visibility</p>
  </div>
  <div className="flex items-center gap-2">
    {data.enabled ? (
      <Eye className="h-4 w-4 text-green-600" />
    ) : (
      <EyeOff className="h-4 w-4 text-gray-400" />
    )}
    <Switch
      checked={data.enabled}
      onCheckedChange={(checked) => handleDataChange("enabled", checked)}
    />
  </div>
</div>
```

## Image Upload Component

### Required State
```tsx
const [isUploading, setIsUploading] = useState(false);
```

### Upload Handler
```tsx
const handleImageUpload = async (file: File) => {
  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await authFetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");

    const { url } = await response.json();
    handleDataChange("image", url);
    toast({ title: "Image uploaded successfully" });
  } catch (error) {
    toast({ variant: "destructive", title: "Upload failed" });
  } finally {
    setIsUploading(false);
  }
};
```

### Upload UI
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">Image URL</Label>
  <p className="text-xs text-muted-foreground">Recommended size: 400x400 pixels</p>
  <div className="flex gap-2">
    <Input
      placeholder="/uploads/image.png"
      value={data.image}
      onChange={(e) => handleDataChange("image", e.target.value)}
      className="h-11 flex-1"
    />
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <Button variant="outline" className="h-11" disabled={isUploading}>
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
  {data.image && (
    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
      <Image 
        src={getAssetUrl(data.image)} 
        alt="Preview" 
        width={80}
        height={80}
        className="object-cover rounded"
      />
    </div>
  )}
</div>
```

## Keyword Tags Component

### Required State
```tsx
const [keywordInput, setKeywordInput] = useState("");
```

### Keyword Handlers
```tsx
const addKeyword = () => {
  if (!keywordInput.trim()) return;
  const currentKeywords = data.seo.keywords || [];
  if (!currentKeywords.includes(keywordInput.trim())) {
    handleSEOChange("keywords", [...currentKeywords, keywordInput.trim()]);
  }
  setKeywordInput("");
};

const removeKeyword = (index: number) => {
  const newKeywords = (data.seo.keywords || []).filter((_, i) => i !== index);
  handleSEOChange("keywords", newKeywords);
};
```

### Keywords UI
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">Keywords</Label>
  <div className="flex gap-2">
    <Input
      value={keywordInput}
      onChange={(e) => setKeywordInput(e.target.value)}
      placeholder="Add keyword"
      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
      className="h-11 flex-1"
    />
    <Button
      type="button"
      variant="outline"
      onClick={addKeyword}
      className="h-11"
    >
      <Tag className="h-4 w-4" />
    </Button>
  </div>
  <div className="flex flex-wrap gap-1 mt-2">
    {(data.seo.keywords || []).map((keyword, index) => (
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
  <p className="text-xs text-muted-foreground">
    Press Enter or click the tag icon to add keywords
  </p>
</div>
```

## SEO Section
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-green-600" />
      SEO Configuration
    </CardTitle>
    <p className="text-sm text-muted-foreground mt-1">
      Optimize your section for search engines
    </p>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">SEO Title</Label>
        <Input
          placeholder="SEO Title"
          value={data.seo.title}
          onChange={(e) => handleSEOChange("title", e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          {data.seo.title.length}/60 characters
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">SEO Slug</Label>
        <Input
          placeholder="url-slug"
          value={data.seo.slug}
          onChange={(e) => handleSEOChange("slug", e.target.value)}
          className="h-11"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label className="text-sm font-medium">Meta Description</Label>
      <Textarea
        placeholder="Meta description for search engines"
        value={data.seo.description}
        onChange={(e) => handleSEOChange("description", e.target.value)}
        className="min-h-[80px] resize-none"
      />
      <p className="text-xs text-muted-foreground">
        {data.seo.description.length}/160 characters
      </p>
    </div>
    {/* Keywords component goes here */}
  </CardContent>
</Card>
```

## Save Section (Sticky Footer)
```tsx
<div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t p-6 -mx-6 -mb-6">
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div className="text-sm text-muted-foreground">
      Ready to save section settings
    </div>
    <div className="flex gap-3">
      <Button variant="outline" onClick={loadData} disabled={isSaving}>
        <RefreshCcw className="h-4 w-4 mr-2" /> Reset
      </Button>
      <Button 
        onClick={handleSave} 
        disabled={isSaving} 
        className="min-w-[160px]"
        style={{backgroundColor: '#4f46e5', color: 'white'}}
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
```

## Modal Structure
```tsx
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {editingItem ? "Edit Item" : "Add New Item"}
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* Form content */}
      
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button onClick={handleSaveItem}>
          <Save className="mr-2 h-4 w-4" />
          Save Item
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Card Grid Layout
```tsx
<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
  {items.map((item, index) => (
    <Card key={item.id} className="overflow-hidden h-full flex flex-col">
      <div className="aspect-square relative">
        {/* Image content */}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {item.title || "Untitled"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {item.description || "No description"}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1">
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleRemove(item.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

## Color Themes by Section
- **Blue**: `from-blue-50 to-indigo-50`, `bg-blue-100`, `text-blue-600`
- **Green**: `from-green-50 to-emerald-50`, `bg-green-100`, `text-green-600`
- **Orange**: `from-orange-50 to-amber-50`, `bg-orange-100`, `text-orange-600`
- **Teal**: `from-teal-50 to-cyan-50`, `bg-teal-100`, `text-teal-600`
- **Purple**: `from-purple-50 to-violet-50`, `bg-purple-100`, `text-purple-600`

## Container Widths
- Standard: `max-w-6xl mx-auto`
- Wide: `max-w-7xl mx-auto`
- Full: `max-w-full`

## Common Spacing
- Page padding: `p-6`
- Section spacing: `space-y-8`
- Card content: `p-4` or `p-6`
- Form fields: `space-y-6` or `space-y-4`













