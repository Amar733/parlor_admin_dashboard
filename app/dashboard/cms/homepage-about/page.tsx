"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Tag, X, Plus, Trash2, Sparkles, Shield, Award, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor";

interface StoryItem {
  title: string;
  description: string;
  image: string;
}

interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

interface AboutData {
  isEnable?: boolean;
  story: StoryItem[];
  values: ValueItem[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

const iconOptions = [
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Award", label: "Award", icon: Award },
  { value: "Clock", label: "Clock", icon: Clock },
];

const defaultAbout: AboutData = {
  isEnable: true,
  story: [
    {
      title: "Our Beginning",
      description: "Founded in 2009 by Evelyn Reed, our salon started as a small, cozy studio with a passion for precision and a love for natural beauty. Evelyn's vision was to create a space where clients felt not only pampered but truly seen and heard.",
      image: "https://images.unsplash.com/photo-1600948836101-f9ff52f7c7ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "A Philosophy of Care",
      description: "We believe beauty is an expression of your inner self. Our approach combines technical mastery with a holistic touch, using premium, often organic, products to ensure your hair and skin radiate health. We listen, we advise, and we create looks that move with your life.",
      image: "https://images.unsplash.com/photo-1560066984-13812b0c9d18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
  ],
  values: [
    {
      icon: "Sparkles",
      title: "Artistry First",
      description: "Every cut, color, and style is executed with the precision of an artist, tailored to your unique features.",
    },
    {
      icon: "Shield",
      title: "Premium Integrity",
      description: "We use only the finest, ethically sourced products, prioritizing the long-term health of your hair and skin.",
    },
    {
      icon: "Award",
      title: "Excellence Always",
      description: "Our team undergoes continuous training to master the latest trends and timeless techniques.",
    },
    {
      icon: "Clock",
      title: "Timeless Experience",
      description: "From the moment you walk in, enjoy a serene, welcoming atmosphere designed for your relaxation.",
    },
  ],
  seo: {
    title: "",
    description: "",
    keywords: [],
    slug: "",
  },
};

export default function AboutCompanyStoryPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<AboutData>(defaultAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`);
        if (response.ok) {
          const result = await response.json();
          const loadedData = result.data || {};
          setData({
            ...defaultAbout,
            ...loadedData,
            seo: loadedData.seo || defaultAbout.seo,
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Could not fetch data from API.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authFetch, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        page: "about",
        section: "companyStory",
        data: data,
      };

      const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Company Story updated successfully" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = async (checked: boolean) => {
    const updatedData = { ...data, isEnable: checked };
    setData(updatedData);

    setSaving(true);
    try {
      const payload = {
        page: "about",
        section: "companyStory",
        data: updatedData,
      };

      const response = await authFetch(`${API_BASE_URL}/api/cms/home/homepage_about/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: "Changes saved automatically" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, storyIndex: number) => {
    setUploading(`story-${storyIndex}`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      
      const updatedStory = [...data.story];
      updatedStory[storyIndex] = { ...updatedStory[storyIndex], image: url };
      setData({ ...data, story: updatedStory });
      
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(null);
    }
  };

  // Story handlers
  const addStoryItem = () => {
    setData({
      ...data,
      story: [...data.story, { title: "", description: "", image: "" }]
    });
  };

  const removeStoryItem = (index: number) => {
    if (data.story.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one story item is required.",
      });
      return;
    }
    const updatedStory = data.story.filter((_, i) => i !== index);
    setData({ ...data, story: updatedStory });
  };

  const updateStoryItem = (index: number, field: keyof StoryItem, value: string) => {
    const updatedStory = [...data.story];
    updatedStory[index] = { ...updatedStory[index], [field]: value };
    setData({ ...data, story: updatedStory });
  };

  // Values handlers
  const addValueItem = () => {
    setData({
      ...data,
      values: [...data.values, { icon: "Sparkles", title: "", description: "" }]
    });
  };

  const removeValueItem = (index: number) => {
    if (data.values.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one value item is required.",
      });
      return;
    }
    const updatedValues = data.values.filter((_, i) => i !== index);
    setData({ ...data, values: updatedValues });
  };

  const updateValueItem = (index: number, field: keyof ValueItem, value: string) => {
    const updatedValues = [...data.values];
    updatedValues[index] = { ...updatedValues[index], [field]: value };
    setData({ ...data, values: updatedValues });
  };

  // SEO handlers
  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const currentKeywords = data.seo.keywords || [];
    if (!currentKeywords.includes(keywordInput.trim())) {
      setData({ ...data, seo: { ...data.seo, keywords: [...currentKeywords, keywordInput.trim()] } });
    }
    setKeywordInput("");
  };

  const removeKeyword = (index: number) => {
    const newKeywords = (data.seo.keywords || []).filter((_, i) => i !== index);
    setData({ ...data, seo: { ...data.seo, keywords: newKeywords } });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-4 text-gray-900 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">About Page - Company Story</h1>
              <p className="text-gray-700 text-sm">
                Manage company story and core values
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.isEnable ?? true}
                  onCheckedChange={handleToggleChange}
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-8">
        {/* Company Story Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Company Story</h2>
            <Button variant="outline" size="sm" onClick={addStoryItem}>
              <Plus className="h-4 w-4 mr-2" /> Add Story Item
            </Button>
          </div>
          
          {data.story.map((item, index) => (
            <Card key={index} className="relative">
              {data.story.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-destructive hover:text-destructive z-10"
                  onClick={() => removeStoryItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <CardContent className="pt-6 space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  Story Item {index + 1}
                </div>
                
                <div>
                  <Label>Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateStoryItem(index, "title", e.target.value)}
                    placeholder="e.g., Our Beginning"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <RichTextEditor
                    value={item.description}
                    onChange={(value) => updateStoryItem(index, "description", value)}
                    placeholder="Write the story description..."
                  />
                </div>
                
                <div>
                  <Label>Image</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={item.image}
                      onChange={(e) => updateStoryItem(index, "image", e.target.value)}
                      placeholder="Image URL"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, index);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading === `story-${index}`}
                      />
                      <Button variant="outline" disabled={uploading === `story-${index}`}>
                        {uploading === `story-${index}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {item.image && (
                    <img
                      src={getAssetUrl(item.image)}
                      alt={item.title || `Story image ${index + 1}`}
                      className="w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Core Values Section */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Core Values</h2>
            <Button variant="outline" size="sm" onClick={addValueItem}>
              <Plus className="h-4 w-4 mr-2" /> Add Value
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {data.values.map((item, index) => {
              const SelectedIcon = iconOptions.find(opt => opt.value === item.icon)?.icon || Sparkles;
              
              return (
                <Card key={index} className="relative">
                  {data.values.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive z-10"
                      onClick={() => removeValueItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <SelectedIcon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Value {index + 1}
                      </span>
                    </div>
                    
                    <div>
                      <Label>Icon</Label>
                      <Select
                        value={item.icon}
                        onValueChange={(value) => updateValueItem(index, "icon", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <option.icon className="w-4 h-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateValueItem(index, "title", e.target.value)}
                        placeholder="e.g., Artistry First"
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateValueItem(index, "description", e.target.value)}
                        placeholder="Describe this core value..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* SEO Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={data.seo.title}
                onChange={(e) => setData({ ...data, seo: { ...data.seo, title: e.target.value } })}
                placeholder="SEO meta title"
              />
            </div>
            <div>
              <Label>SEO Slug</Label>
              <Input
                value={data.seo.slug}
                onChange={(e) => setData({ ...data, seo: { ...data.seo, slug: e.target.value } })}
                placeholder="about-company-story"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label>SEO Description</Label>
            <Textarea
              value={data.seo.description}
              onChange={(e) => setData({ ...data, seo: { ...data.seo, description: e.target.value } })}
              placeholder="SEO meta description"
              rows={2}
            />
          </div>
          
          <div className="mt-4">
            <Label>Keywords</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}