"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RefreshCcw } from "lucide-react";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";

interface AboutData {
  image1: string;
  image2: string;
  experience_years: string;
  subtitle: string;
  title: string;
  description: string;
  alt_text_image1: string;
  alt_text_image2: string;
}

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  slug: string;
}

const defaultAbout: AboutData = {
  image1: "",
  image2: "",
  experience_years: "",
  subtitle: "",
  title: "",
  description: "",
  alt_text_image1: "",
  alt_text_image2: "",
};

const defaultSEO: SEOData = {
  title: "",
  description: "",
  keywords: "",
  slug: "",
};

export default function HomepageAbout() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [about, setAbout] = useState<AboutData>(defaultAbout);
  const [seo, setSeo] = useState<SEOData>(defaultSEO);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // -------------------------------------------------------
  // Load data from API (only about data — SEO not prefilled)
  // -------------------------------------------------------
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/cms/home/homepage_about/`
      );
      if (response.ok) {
        const res = await response.json();
        const d = res?.data || {};

        // Set only about section data (SEO fields ignored)
        setAbout({
          image1: d.image1 || "",
          image2: d.image2 || "",
          experience_years: d.experience_years || "",
          subtitle: d.subtitle || "",
          title: d.title || "",
          description: d.description || "",
          alt_text_image1: d.alt_text_image1 || "",
          alt_text_image2: d.alt_text_image2 || "",
        });

        // Don’t prefill SEO
        setSeo(defaultSEO);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load About data.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not fetch data from server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------
  // Save About + SEO (user-entered SEO only)
  // -------------------------------------------------------
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        page: "home",
        section: "homepage_about",
        data: {
          ...about,
          meta_title: seo.title || "",
          meta_description: seo.description || "",
          keywords: seo.keywords ? seo.keywords.split(",").map(k => k.trim()) : [],
          slug: seo.slug || "",
        },
      };

      const res = await authFetch(
        `${API_BASE_URL}/api/cms/home/homepage_about/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        toast({
          title: "Saved successfully",
          description: "About & SEO data updated.",
        });
        loadData();
      } else {
        throw new Error("Save failed");
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Homepage About Section</h1>
          <p className="text-muted-foreground text-sm">
            Manage About SRM Arnik content and SEO (SEO fields are empty until you fill them).
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* About Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Title</Label>
            <Input
              value={about.title}
              onChange={(e) => setAbout({ ...about, title: e.target.value })}
              placeholder="Clinic Title"
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={about.subtitle}
              onChange={(e) => setAbout({ ...about, subtitle: e.target.value })}
              placeholder="About subtitle"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={about.description}
              onChange={(e) =>
                setAbout({ ...about, description: e.target.value })
              }
              placeholder="Write about SRM Arnik Skin & Healthcare Clinic"
            />
          </div>
          <div>
            <Label>Experience / Tagline</Label>
            <Input
              value={about.experience_years}
              onChange={(e) =>
                setAbout({ ...about, experience_years: e.target.value })
              }
              placeholder="Experienced Doctors"
            />
          </div>

          {/* Image 1 */}
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div>
              <Label>Image 1 URL</Label>
              <Input
                value={about.image1}
                onChange={(e) =>
                  setAbout({ ...about, image1: e.target.value })
                }
                placeholder="/uploads/..."
              />
              {about.image1 && (
                <img
                  src={getAssetUrl(about.image1)}
                  alt={about.alt_text_image1 || "Image 1 preview"}
                  className="mt-3 w-full h-48 object-cover rounded border border-border/40"
                />
              )}
            </div>
            <div>
              <Label>Alt Text (Image 1)</Label>
              <Input
                value={about.alt_text_image1}
                onChange={(e) =>
                  setAbout({ ...about, alt_text_image1: e.target.value })
                }
                placeholder="Describe Image 1"
              />
            </div>
          </div>

          {/* Image 2 */}
          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div>
              <Label>Image 2 URL</Label>
              <Input
                value={about.image2}
                onChange={(e) =>
                  setAbout({ ...about, image2: e.target.value })
                }
                placeholder="/uploads/..."
              />
              {about.image2 && (
                <img
                  src={getAssetUrl(about.image2)}
                  alt={about.alt_text_image2 || "Image 2 preview"}
                  className="mt-3 w-full h-48 object-cover rounded border border-border/40"
                />
              )}
            </div>
            <div>
              <Label>Alt Text (Image 2)</Label>
              <Input
                value={about.alt_text_image2}
                onChange={(e) =>
                  setAbout({ ...about, alt_text_image2: e.target.value })
                }
                placeholder="Describe Image 2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings (NOT auto-filled) */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>SEO Title</Label>
            <Input
              placeholder="Enter SEO title manually"
              value={seo.title}
              onChange={(e) => setSeo({ ...seo, title: e.target.value })}
            />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              placeholder="Enter SEO description manually"
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            />
          </div>
          <div>
            <Label>SEO Keywords (comma separated)</Label>
            <Input
              placeholder="clinic, dermatology, SRM Arnik"
              value={seo.keywords}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              placeholder="about-srm-arnik-skin-healthcare-clinic"
              value={seo.slug}
              onChange={(e) => setSeo({ ...seo, slug: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[200px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}




