"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { SchemaMarkupEditor } from "@/components/schema-markup-editor";

// Interfaces
interface Testimonial {
  id?: string;
  name: string;
  title: string;
  quote: string;
  rating: number;
  avatarUrl: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
    schemaMarkup: string;
  };
}

export default function TestimonialsPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [header, setHeader] = useState<HeaderData>({
    title: "",
    subtitle: "",
    seo: {
      title: "",
      description: "",
      keywords: [],
      slug: "",
      schemaMarkup: ""
    }
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newItem, setNewItem] = useState<Testimonial>({
    name: "",
    title: "",
    quote: "",
    rating: 5,
    avatarUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSchemaValid, setIsSchemaValid] = useState(true);

  // Load header + testimonials
  useEffect(() => {
    const loadData = async () => {
      try {
        const [headerRes, testimonialsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/cms/home/testimonialsHeader/`),
          authFetch(`${API_BASE_URL}/api/cms/home/testimonials/`),
        ]);

        if (headerRes.ok) {
          const data = await headerRes.json();
          const h = data?.data || {};
          setHeader({
            title: h.title || "",
            subtitle: h.subtitle || "",
            seo: h.seo || {
              title: "",
              description: "",
              keywords: [],
              slug: "",
              schemaMarkup: ""
            }
          });
        }

        if (testimonialsRes.ok) {
          const data = await testimonialsRes.json();
          const list = data?.data || [];
          setTestimonials(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Please check the API or your internet connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authFetch, toast]);

  // Save Header
  const handleSaveHeader = async () => {
    if (!isSchemaValid) {
      toast({
        variant: "destructive",
        title: "Invalid Schema Markup",
        description: "Please fix the schema markup errors before saving.",
      });
      return;
    }
    setSavingHeader(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/cms/home/testimonialsHeader/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "testimonialsHeader",
            data: header,
          }),
        }
      );

      if (res.ok) {
        toast({
          title: "Header saved",
          description: "Testimonials header updated successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: "Server returned an error while saving header.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Please check your internet connection.",
      });
    } finally {
      setSavingHeader(false);
    }
  };

  // Add New Testimonial
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quote || !newItem.avatarUrl) {
      toast({
        variant: "destructive",
        title: "Missing info",
        description: "Please fill name, quote and avatar URL.",
      });
      return;
    }

    setSavingItem(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/cms/home/testimonials/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "testimonials",
            data: newItem,
          }),
        }
      );

      if (res.ok) {
        toast({
          title: "Testimonial added",
          description: "New testimonial added successfully.",
        });
        setNewItem({
          name: "",
          title: "",
          quote: "",
          rating: 5,
          avatarUrl: "",
        });

        const refresh = await authFetch(
          `${API_BASE_URL}/api/cms/home/testimonials/`
        );
        const data = await refresh.json();
        setTestimonials(data?.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Add failed",
          description: "Server error while adding testimonial.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Add failed",
        description: "Please try again later.",
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !header.seo.keywords.includes(keywordInput.trim())) {
      setHeader({
        ...header,
        seo: {
          ...header.seo,
          keywords: [...header.seo.keywords, keywordInput.trim()]
        }
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setHeader({
      ...header,
      seo: {
        ...header.seo,
        keywords: header.seo.keywords.filter(k => k !== keyword)
      }
    });
  };

  // Delete (frontend only)
  const handleDeleteItem = (id?: string) => {
    if (!id) return;
    setTestimonials(testimonials.filter((t) => t.id !== id));
    toast({
      title: "Removed locally",
      description: "Will be deleted on backend if supported.",
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      {/* HEADER SECTION */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Testimonials - Header</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={header.title}
            onChange={(e) => setHeader({ ...header, title: e.target.value })}
            placeholder="Enter header title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <Textarea
            rows={3}
            value={header.subtitle}
            onChange={(e) =>
              setHeader({ ...header, subtitle: e.target.value })
            }
            placeholder="Enter header subtitle"
          />
        </div>

        <Button
          onClick={handleSaveHeader}
          disabled={savingHeader}
          className="font-medium text-base"
        >
          {savingHeader ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Header"
          )}
        </Button>

        {/* SEO SECTION */}
        <div className="space-y-4 border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold">SEO Settings</h3>

          <div>
            <label className="block text-sm font-medium mb-1">SEO Title</label>
            <Input
              value={header.seo.title}
              onChange={(e) => setHeader({ ...header, seo: { ...header.seo, title: e.target.value } })}
              placeholder="Enter SEO title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SEO Description</label>
            <Textarea
              rows={3}
              value={header.seo.description}
              onChange={(e) => setHeader({ ...header, seo: { ...header.seo, description: e.target.value } })}
              placeholder="Enter SEO description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SEO Slug</label>
            <Input
              value={header.seo.slug}
              onChange={(e) => setHeader({ ...header, seo: { ...header.seo, slug: e.target.value } })}
              placeholder="testimonials"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Keywords</label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                placeholder="Add keyword and press Enter"
              />
              <Button type="button" onClick={handleAddKeyword} variant="outline">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            {header.seo.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {header.seo.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <SchemaMarkupEditor
            value={header.seo.schemaMarkup}
            onChange={(value) => setHeader({ ...header, seo: { ...header.seo, schemaMarkup: value } })}
            onValidationChange={setIsSchemaValid}
          />
        </div>
      </div>

      {/* TESTIMONIALS SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Testimonials</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.length > 0 ? (
            testimonials.map((item) => (
              <div
                key={item.id || item.name}
                className="border rounded-xl p-4 shadow-sm bg-white relative space-y-2"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                {item.avatarUrl && (
                  <img
                    src={getAssetUrl(item.avatarUrl)}
                    alt={item.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto"
                  />
                )}
                <h3 className="text-lg font-semibold text-center">{item.name}</h3>
                <p className="text-sm text-gray-500 text-center">{item.title}</p>
                <p className="text-sm text-gray-700 italic text-center">
                  “{item.quote}”
                </p>
                <p className="text-yellow-500 text-center">
                  {"★".repeat(item.rating)}{" "}
                  <span className="text-gray-400">
                    {"★".repeat(5 - item.rating)}
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No testimonials available.</p>
          )}
        </div>

        {/* ADD NEW TESTIMONIAL */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Add New Testimonial
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <Input
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            />
          </div>

          <div className="mt-4">
            <Textarea
              placeholder="Quote"
              rows={3}
              value={newItem.quote}
              onChange={(e) =>
                setNewItem({ ...newItem, quote: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Input
              type="number"
              min={1}
              max={5}
              placeholder="Rating (1-5)"
              value={newItem.rating}
              onChange={(e) =>
                setNewItem({ ...newItem, rating: Number(e.target.value) })
              }
            />
            <Input
              placeholder="Avatar Image URL"
              value={newItem.avatarUrl}
              onChange={(e) =>
                setNewItem({ ...newItem, avatarUrl: e.target.value })
              }
            />
          </div>

          <Button
            onClick={handleAddItem}
            disabled={savingItem}
            className="mt-4 font-medium text-base"
          >
            {savingItem ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              "Add Testimonial"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
