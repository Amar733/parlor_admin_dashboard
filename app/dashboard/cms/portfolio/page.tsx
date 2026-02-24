"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, Edit, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
}

export default function PortfolioPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [header, setHeader] = useState<HeaderData>({ title: "", subtitle: "" });
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  const emptyItem: PortfolioItem = {
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    beforeImageUrl: "",
    afterImageUrl: "",
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [headerRes, portfolioRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/cms/home/portfolioHeader/`),
          authFetch(`${API_BASE_URL}/api/cms/home/portfolio/`),
        ]);

        if (headerRes && headerRes.ok) {
          const headerJson = await headerRes.json();
          setIsEnable(headerJson?.data?.isEnable ?? true);
          setHeader(headerJson?.data || { title: "", subtitle: "" });
        }

        if (portfolioRes && portfolioRes.ok) {
          const portfolioJson = await portfolioRes.json();
          const list = Array.isArray(portfolioJson?.data) ? portfolioJson.data : [];
          setPortfolio(list);
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

  useEffect(() => {
    if (loading) return;
    
    const autoSave = async () => {
      try {
        const payload = {
          page: "home",
          section: "portfolioHeader",
          data: { ...header, isEnable },
        };

        await authFetch(`${API_BASE_URL}/api/cms/home/portfolioHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(err);
      }
    };

    autoSave();
  }, [isEnable]);

  const handleSaveHeader = async () => {
    setSavingHeader(true);
    try {
      const payload = {
        page: "home",
        section: "portfolioHeader",
        data: { ...header, isEnable },
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/portfolioHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Header saved", description: "Portfolio header updated successfully." });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server returned an error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please check your internet connection." });
    } finally {
      setSavingHeader(false);
    }
  };

  const savePortfolio = async (updatedPortfolio: PortfolioItem[]) => {
    setSavingPortfolio(true);
    try {
      const payload = {
        page: "home",
        section: "portfolio",
        data: updatedPortfolio,
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/portfolio/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPortfolio(updatedPortfolio);
        setShowModal(false);
        setEditingItem(null);
        toast({ title: "Portfolio updated successfully" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleAdd = () => {
    setEditingItem({ ...emptyItem, id: Date.now().toString() });
    setShowModal(true);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    const isNew = !portfolio.find((p) => p.id === editingItem.id);
    let updatedPortfolio;

    if (isNew) {
      updatedPortfolio = [...portfolio, editingItem];
    } else {
      updatedPortfolio = portfolio.map((p) =>
        p.id === editingItem.id ? editingItem : p
      );
    }

    savePortfolio(updatedPortfolio);
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const updatedPortfolio = portfolio.filter((p) => p.id !== id);
    savePortfolio(updatedPortfolio);
  };

  const handleItemChange = (field: keyof PortfolioItem, value: string) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: value });
  };

  const handleImageUpload = async (file: File, field: keyof PortfolioItem) => {
    if (!editingItem) return;

    setUploadingItem(editingItem.id || "");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleItemChange(field, url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingItem(null);
    }
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4 text-gray-900 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Portfolio Management</h1>
              <p className="text-gray-700 text-sm">
                Manage portfolio header and gallery items
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEnable}
                  onCheckedChange={setIsEnable}
                />
                <span className="text-sm font-medium">Section Enabled</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleAdd}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-gray-900 hover:bg-white/30"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Section Header</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={header.title}
              onChange={(e) => setHeader({ ...header, title: e.target.value })}
              placeholder="Our Portfolio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <Input
              value={header.subtitle}
              onChange={(e) => setHeader({ ...header, subtitle: e.target.value })}
              placeholder="A Glimpse into Our Transformative Results"
            />
          </div>
        </div>
        <Button onClick={handleSaveHeader} disabled={savingHeader} className="mt-4">
          {savingHeader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Header
        </Button>
      </div>

      {/* Portfolio Grid */}
      {portfolio.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No portfolio items found.</p>
          <Button onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                {item.imageUrl ? (
                  <img
                    src={getAssetUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1">{item.title || "Untitled"}</h3>
                {item.category && (
                  <p className="text-xs text-blue-600 mb-1">{item.category}</p>
                )}
                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {portfolio.find((p) => p.id === editingItem.id)
                  ? "Edit Portfolio Item"
                  : "Add New Portfolio Item"}
              </h3>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={editingItem.title}
                    onChange={(e) => handleItemChange("title", e.target.value)}
                    placeholder="Portfolio Item Title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Input
                    value={editingItem.category}
                    onChange={(e) => handleItemChange("category", e.target.value)}
                    placeholder="Skin Treatment, Hair Care, etc."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editingItem.description}
                    onChange={(e) => handleItemChange("description", e.target.value)}
                    placeholder="Brief description of the portfolio item"
                  />
                </div>

                {/* Main Image */}
                <div>
                  <label className="block text-sm font-medium mb-1">Main Image</label>
                  <div className="flex gap-2">
                    <Input
                      value={editingItem.imageUrl}
                      onChange={(e) => handleItemChange("imageUrl", e.target.value)}
                      placeholder="Main image URL"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "imageUrl");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingItem === editingItem.id}
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingItem === editingItem.id}
                      >
                        {uploadingItem === editingItem.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {editingItem.imageUrl && (
                    <img
                      src={getAssetUrl(editingItem.imageUrl)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                </div>

                {/* Before/After Images */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Before Image</label>
                    <div className="flex gap-2">
                      <Input
                        value={editingItem.beforeImageUrl}
                        onChange={(e) => handleItemChange("beforeImageUrl", e.target.value)}
                        placeholder="Before treatment image URL"
                        className="flex-1"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "beforeImageUrl");
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingItem === editingItem.id}
                        />
                        <Button
                          variant="outline"
                          disabled={uploadingItem === editingItem.id}
                        >
                          {uploadingItem === editingItem.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {editingItem.beforeImageUrl && (
                      <img
                        src={getAssetUrl(editingItem.beforeImageUrl)}
                        alt="Before Preview"
                        className="w-full h-24 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">After Image</label>
                    <div className="flex gap-2">
                      <Input
                        value={editingItem.afterImageUrl}
                        onChange={(e) => handleItemChange("afterImageUrl", e.target.value)}
                        placeholder="After treatment image URL"
                        className="flex-1"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "afterImageUrl");
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingItem === editingItem.id}
                        />
                        <Button
                          variant="outline"
                          disabled={uploadingItem === editingItem.id}
                        >
                          {uploadingItem === editingItem.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {editingItem.afterImageUrl && (
                      <img
                        src={getAssetUrl(editingItem.afterImageUrl)}
                        alt="After Preview"
                        className="w-full h-24 object-cover rounded mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={savingPortfolio}>
                    {savingPortfolio && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}