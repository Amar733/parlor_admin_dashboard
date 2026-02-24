"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, Edit, Upload, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/asset-utils";
import { API_BASE_URL } from "@/config/api";
import { Switch } from "@/components/ui/switch";

interface Activity {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
}

interface HeaderData {
  title: string;
  subtitle: string;
}

export default function ActivitiesPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isEnable, setIsEnable] = useState(true);
  const [header, setHeader] = useState<HeaderData>({ title: "", subtitle: "" });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [uploadingActivity, setUploadingActivity] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingActivities, setSavingActivities] = useState(false);

  const emptyActivity: Activity = {
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [headerRes, activitiesRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/cms/home/activitiesHeader/`),
          authFetch(`${API_BASE_URL}/api/cms/home/activities/`),
        ]);

        if (headerRes && headerRes.ok) {
          const headerJson = await headerRes.json();
          setIsEnable(headerJson?.data?.isEnable ?? true);
          setHeader(headerJson?.data || { title: "", subtitle: "" });
        }

        if (activitiesRes && activitiesRes.ok) {
          const activitiesJson = await activitiesRes.json();
          const list = Array.isArray(activitiesJson?.data) ? activitiesJson.data : [];
          setActivities(list);
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
    
    const saveToggle = async () => {
      try {
        const payload = {
          page: "home",
          section: "activitiesHeader",
          data: { ...header, isEnable },
        };

        await authFetch(`${API_BASE_URL}/api/cms/home/activitiesHeader/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        toast({ title: "Section status updated" });
      } catch (err) {
        console.error(err);
      }
    };

    saveToggle();
  }, [isEnable]);

  const handleSaveHeader = async () => {
    setSavingHeader(true);
    try {
      const payload = {
        page: "home",
        section: "activitiesHeader",
        data: { ...header, isEnable },
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/activitiesHeader/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Header saved", description: "Activities header updated successfully." });
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

  const saveActivities = async (updatedActivities: Activity[]) => {
    setSavingActivities(true);
    try {
      const payload = {
        page: "home",
        section: "activities",
        data: updatedActivities,
      };

      const res = await authFetch(`${API_BASE_URL}/api/cms/home/activities/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActivities(updatedActivities);
        setShowModal(false);
        setEditingActivity(null);
        toast({ title: "Activities updated successfully" });
      } else {
        toast({ variant: "destructive", title: "Save failed", description: "Server error." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Save failed", description: "Please try again later." });
    } finally {
      setSavingActivities(false);
    }
  };

  const handleAdd = () => {
    setEditingActivity({ ...emptyActivity, id: Date.now().toString() });
    setShowModal(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity({ ...activity });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingActivity) return;

    const isNew = !activities.find((a) => a.id === editingActivity.id);
    let updatedActivities;

    if (isNew) {
      updatedActivities = [...activities, editingActivity];
    } else {
      updatedActivities = activities.map((a) =>
        a.id === editingActivity.id ? editingActivity : a
      );
    }

    saveActivities(updatedActivities);
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const updatedActivities = activities.filter((a) => a.id !== id);
    saveActivities(updatedActivities);
  };

  const handleActivityChange = (field: keyof Activity, value: string) => {
    if (!editingActivity) return;
    setEditingActivity({ ...editingActivity, [field]: value });
  };

  const handleImageUpload = async (file: File, field: "thumbnailUrl") => {
    if (!editingActivity) return;

    setUploadingActivity(editingActivity.id || "");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      handleActivityChange(field, url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingActivity(null);
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-red-700 to-pink-800 p-4 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Activities Management</h1>
              <p className="text-orange-100 text-sm">
                Manage activities header and video activities
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
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Activity
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
              placeholder="Clinic Activities"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <Input
              value={header.subtitle}
              onChange={(e) => setHeader({ ...header, subtitle: e.target.value })}
              placeholder="See What's Happening at SRM Arnik"
            />
          </div>
        </div>
        <Button onClick={handleSaveHeader} disabled={savingHeader} className="mt-4">
          {savingHeader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Header
        </Button>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No activities found.</p>
          <Button onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add First Activity
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-video relative bg-gray-100">
                {activity.thumbnailUrl ? (
                  <img
                    src={getAssetUrl(activity.thumbnailUrl)}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No Thumbnail</span>
                  </div>
                )}
                {activity.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2">{activity.title || "Untitled"}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                  {activity.description || "No description"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(activity)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
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
      {showModal && editingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {activities.find((a) => a.id === editingActivity.id)
                  ? "Edit Activity"
                  : "Add New Activity"}
              </h3>

              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={editingActivity.title}
                    onChange={(e) => handleActivityChange("title", e.target.value)}
                    placeholder="Activity Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={editingActivity.description}
                    onChange={(e) => handleActivityChange("description", e.target.value)}
                    placeholder="Activity description..."
                    rows={3}
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Video URL</label>
                  <Input
                    value={editingActivity.videoUrl}
                    onChange={(e) => handleActivityChange("videoUrl", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
                  <div className="flex gap-2">
                    <Input
                      value={editingActivity.thumbnailUrl}
                      onChange={(e) => handleActivityChange("thumbnailUrl", e.target.value)}
                      placeholder="Thumbnail URL"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, "thumbnailUrl");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingActivity === editingActivity.id}
                      />
                      <Button
                        variant="outline"
                        disabled={uploadingActivity === editingActivity.id}
                      >
                        {uploadingActivity === editingActivity.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {editingActivity.thumbnailUrl && (
                    <img
                      src={getAssetUrl(editingActivity.thumbnailUrl)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={savingActivities}>
                    {savingActivities && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Activity
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