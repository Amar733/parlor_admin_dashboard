"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";

// Types
interface PortfolioItem {
  id?: string;
  title: string;
  imageUrl: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
}

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export default function PortfolioPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [header, setHeader] = useState<HeaderData>({ title: "", subtitle: "" });
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newItem, setNewItem] = useState<PortfolioItem>({
    title: "",
    imageUrl: "",
  });

  // SEO (local)
  const [seo, setSeo] = useState<SEOData>({
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingSEO, setSavingSEO] = useState(false);

  // Load header + portfolio data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [headerRes, portfolioRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/cms/home/portfolioHeader/`),
          authFetch(`${API_BASE_URL}/api/cms/home/portfolio/`),
        ]);

        if (headerRes.ok) {
          const data = await headerRes.json();
          const h = data?.data || {};
          setHeader({
            title: h.title || "",
            subtitle: h.subtitle || "",
          });
        }

        if (portfolioRes.ok) {
          const data = await portfolioRes.json();
          const list = data?.data || [];
          setPortfolio(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Failed to load portfolio data from API.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authFetch, toast]);

  // Save Header
  const handleSaveHeader = async () => {
    setSavingHeader(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/cms/home/portfolioHeader/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "portfolioHeader",
            data: header,
          }),
        }
      );

      if (res.ok) {
        toast({
          title: "Header saved",
          description: "Portfolio header updated successfully.",
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
        description: "Please check your network connection.",
      });
    } finally {
      setSavingHeader(false);
    }
  };

  // Add new portfolio item
  const handleAddItem = async () => {
    if (!newItem.title || !newItem.imageUrl) {
      toast({
        variant: "destructive",
        title: "Missing info",
        description: "Please provide title and image URL.",
      });
      return;
    }

    setSavingItem(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/cms/home/portfolio/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: "home",
            section: "portfolio",
            data: newItem,
          }),
        }
      );

      if (res.ok) {
        toast({ title: "Item added", description: "Portfolio item added successfully!" });
        setNewItem({ title: "", imageUrl: "" });

        const refresh = await authFetch(`${API_BASE_URL}/api/cms/home/portfolio/`);
        const data = await refresh.json();
        setPortfolio(data?.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Add failed",
          description: "Server error while adding item.",
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

  // Delete portfolio (frontend only)
  const handleDeleteItem = (id?: string) => {
    if (!id) return;
    setPortfolio(portfolio.filter((p) => p.id !== id));
    toast({
      title: "Item removed locally",
      description: "Will be deleted on backend if supported.",
    });
  };

  // Save SEO (local only)
  const handleSaveSEO = async () => {
    setSavingSEO(true);
    setTimeout(() => {
      setSavingSEO(false);
      toast({
        title: "SEO Saved (Locally)",
        description: "SEO settings saved locally (not on backend).",
      });
    }, 1000);
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
        <h1 className="text-2xl font-bold">Portfolio - Header</h1>

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

        <Button onClick={handleSaveHeader} disabled={savingHeader} className="font-medium text-base">
          {savingHeader ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Header"
          )}
        </Button>
      </div>

      {/* PORTFOLIO ITEMS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Portfolio Items</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.length > 0 ? (
            portfolio.map((item) => (
              <div
                key={item.id || item.title}
                className="border rounded-xl p-4 shadow-sm bg-white space-y-2 relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                {item.imageUrl && (
                  <img
                    src={getAssetUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-md"
                  />
                )}
                <h3 className="text-lg font-semibold">{item.title}</h3>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No portfolio items available.</p>
          )}
        </div>

        {/* ADD NEW ITEM */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Add New Portfolio Item
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Item Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            />
            <Input
              placeholder="Image URL"
              value={newItem.imageUrl}
              onChange={(e) =>
                setNewItem({ ...newItem, imageUrl: e.target.value })
              }
            />
          </div>

          <Button onClick={handleAddItem} disabled={savingItem} className="mt-4 font-medium text-base">
            {savingItem ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              "Add Item"
            )}
          </Button>
        </div>
      </div>

      {/* SEO SECTION */}
      <div className="space-y-4 border-t pt-6 mt-6">
        <h2 className="text-xl font-semibold">SEO Settings</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Meta Title</label>
          <Input
            value={seo.metaTitle}
            onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
            placeholder="Enter meta title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Meta Description
          </label>
          <Textarea
            rows={3}
            value={seo.metaDescription}
            onChange={(e) =>
              setSeo({ ...seo, metaDescription: e.target.value })
            }
            placeholder="Enter meta description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Keywords (comma separated)
          </label>
          <Input
            value={seo.keywords}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            placeholder="e.g. portfolio, healthcare, SRM Arnik"
          />
        </div>

        <Button onClick={handleSaveSEO} disabled={savingSEO} className="font-medium text-base">
          {savingSEO ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save SEO"
          )}
        </Button>
      </div>
    </div>
  );
}
