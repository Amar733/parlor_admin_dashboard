"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Edit,
  Loader2,
  Stethoscope,
  Camera,
  Upload,
  X,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/lib/utils";
import { getAssetUrl } from "@/lib/asset-utils";

export default function ChamberDoctorVisitingPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [chambers, setChambers] = useState<any[]>([]);
  const [doctorVisiting, setDoctorVisiting] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChamberDialogOpen, setIsChamberDialogOpen] = useState(false);
  const [isDoctorVisitingDialogOpen, setIsDoctorVisitingDialogOpen] =
    useState(false);
  const [selectedChamber, setSelectedChamber] = useState<any | null>(null);
  const [editingChamber, setEditingChamber] = useState<any>({});

  const [selectDoctorVisiting, setSelectDoctorVisiting] = useState<any | null>(
    null
  );
  const [editingDoctorVisiting, setEditingDoctorVisiting] = useState<any>({});
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "chamber" | "doctorVisiting";
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<"user" | "environment">(
    "environment"
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] =
    useState<any>(null);
  const [chamberDetailsDialogOpen, setChamberDetailsDialogOpen] =
    useState(false);
  const [selectedChamberDetails, setSelectedChamberDetails] =
    useState<any>(null);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch?.("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response?.ok) throw new Error("Upload failed");

      const data = await response.json();
      const fileUrl = data.url;

      setEditingDoctorVisiting((prev: any) => ({
        ...prev,
        patientFile: Array.isArray(prev.patientFile)
          ? [...prev.patientFile, fileUrl]
          : [fileUrl],
      }));

      toast({ title: "File uploaded successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }

      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const constraints = {
        video: isMobile
          ? {
              facingMode: currentCamera,
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            }
          : {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      setIsCameraOpen(true);

      // Wait for dialog to render before accessing video element
      setTimeout(() => {
        const video = document.getElementById(
          "camera-video"
        ) as HTMLVideoElement;
        if (video) {
          video.srcObject = mediaStream;
          video.play().catch(console.error);
        }
      }, 100);
    } catch (error: any) {
      console.error("Camera error:", error);
      let errorMessage = "Camera access failed";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported.";
      }

      toast({
        variant: "destructive",
        title: "Camera Error",
        description: errorMessage,
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Switch camera
  const switchCamera = async () => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (!isMobile) {
      toast({ title: "Camera switch not available on desktop" });
      return;
    }
    stopCamera();
    setCurrentCamera((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(startCamera, 200);
  };

  // Capture photo
  const capturePhoto = async () => {
    const video = document.getElementById("camera-video") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (video && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], `camera-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            await handleFileUpload(file);
            stopCamera();
          }
        },
        "image/jpeg",
        0.8
      );
    }
  };

  // Remove uploaded file
  const removeFile = (fileUrl: string) => {
    setEditingDoctorVisiting((prev: any) => ({
      ...prev,
      patientFile: Array.isArray(prev.patientFile)
        ? prev.patientFile.filter((url: string) => url !== fileUrl)
        : [],
    }));
  };

  // Fetch chambers
  const fetchChambers = useCallback(async () => {
    if (!token) return;
    const doctorId = user?.role === "doctor" ? user._id : selectedDoctorId;
    if (!doctorId) return;

    setIsLoading(true);
    try {
      const endpoint = `/api/chambers/doctor/${doctorId}`;
      const response = await authFetch?.(endpoint);
      if (response && !response?.ok)
        throw new Error("Failed to fetch chambers");
      const data = await response.json();
      console.log("Chambers fetched:", data); // Debug log
      setChambers(data?.data ?? []);
    } catch (error: any) {
      console.error("Error fetching chambers:", error); // Debug log
      if (!error?.message?.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, toast, user, selectedDoctorId]);

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch?.("/api/users?role=doctor");
      if (response && !response?.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      console.log("Doctors fetched:", data); // Debug log
      setDoctors(data || []);
    } catch (error: any) {
      console.error("Error fetching doctors:", error); // Debug log
      if (!error?.message?.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message,
        });
      }
    }
  }, [token, authFetch, toast]);

  // Fetch doctor visiting
  const fetchDoctorVisiting = useCallback(async () => {
    if (!token) return;
    const doctorId = user?.role === "doctor" ? user._id : selectedDoctorId;
    if (!doctorId) return;

    setIsLoading(true);
    try {
      const endpoint = `/api/doctor-visiting/doctor/${doctorId}`;
      const response = await authFetch?.(endpoint);
      if (response && !response?.ok)
        throw new Error("Failed to fetch doctor visiting data");
      const data1 = await response.json();
      setDoctorVisiting(data1?.data ?? []);
    } catch (error: any) {
      if (!error?.message?.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, toast, user, selectedDoctorId]);

  // Set default doctor selection
  useEffect(() => {
    if (user?.role === "doctor") {
      setSelectedDoctorId(user._id);
    } else if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0]._id);
    }
  }, [user, doctors, selectedDoctorId]);

  useEffect(() => {
    if (!authLoading && user) {
      if (!can("view", pathname)) return router.push("/dashboard");
      if (token) {
        fetchDoctors();
      }
    }
  }, [token, authLoading, user, fetchDoctors, can, pathname, router]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchChambers();
      fetchDoctorVisiting();
    }
  }, [selectedDoctorId, fetchChambers, fetchDoctorVisiting]);

  // Add
  const handleAddNew = () => {
    setSelectedChamber(null);
    const initialData: any = {
      doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
    };

    setEditingChamber(initialData);
    setIsDialogOpen(true);
  };

  // Edit
  const handleEdit = (item: any) => {
    setSelectedChamber(item);
    setEditingChamber(item);
    setIsDialogOpen(true);
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      const response = await authFetch?.(`/api/chambers/${id}`, {
        method: "DELETE",
      });
      if (response && !response?.ok)
        throw new Error("Failed to delete chamber");

      toast({ title: "Chamber deleted" });
      fetchChambers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  // Save handler
  // const handleSave = async (e: any) => {
  //   e.preventDefault();
  //   if (!token) return;

  //   setIsSaving(true);

  //   try {
  //     const url = selectedChamber
  //       ? `/api/chambers/${selectedChamber._id}`
  //       : "/api/chambers";

  //     const method = selectedChamber ? "PUT" : "POST";

  //     const response = await authFetch?.(url, {
  //       method,
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(editingChamber),
  //     });

  //     if (!response.ok) throw new Error("Failed to save chamber");

  //     toast({
  //       title: "Success",
  //       description: `Chamber ${
  //         selectedChamber ? "updated" : "created"
  //       } successfully.`,
  //     });

  //     setIsDialogOpen(false);
  //     fetchChambers();
  //   } catch (err: any) {
  //     toast({ variant: "destructive", title: "Error", description: err.message });
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // CREATE Chamber
  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);

    try {
      const chamberData = {
        ...editingChamber,
        doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
      };

      const response = await authFetch?.("/api/chambers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chamberData),
      });

      if (response && !response?.ok)
        throw new Error("Failed to create chamber");

      toast({
        title: "Success",
        description: "Chamber created successfully.",
      });

      setIsDialogOpen(false);
      fetchChambers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to create chamber",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // UPDATE Chamber
  const handleUpdate = async (e: any, id: string) => {
    e.preventDefault();
    if (!token || !selectedChamber?._id) return;

    setIsSaving(true);

    try {
      const chamberData = {
        ...editingChamber,
        doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
      };

      const response = await authFetch?.(`/api/chambers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chamberData),
      });

      if (response && !response?.ok)
        throw new Error("Failed to update chamber");

      toast({
        title: "Success",
        description: "Chamber updated successfully.",
      });

      setIsDialogOpen(false);
      fetchChambers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to update chamber",
      });
    } finally {
      setIsSaving(false);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  // doctorVisiting

  //add new doctor visiting
  const addNewDoctorVisiting = () => {
    setSelectDoctorVisiting(null);
    const initialData: any = {
      doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
    };

    setEditingDoctorVisiting(initialData);
    setIsDoctorVisitingDialogOpen(true);
  };

  // edit doctor visiting
  const editDoctorVisiting = (item: any) => {
    setSelectDoctorVisiting(item);
    // Handle populated chamber object
    const editData = {
      ...item,
      chamber:
        typeof item.chamber === "object" && item.chamber !== null
          ? item.chamber._id
          : item.chamber,
      doctorId:
        typeof item.doctorId === "object" ? item.doctorId._id : item.doctorId,
    };
    setEditingDoctorVisiting(editData);
    setIsDoctorVisitingDialogOpen(true);
  };

  // delete doctor visiting
  const deleteDoctorVisiting = async (id: string) => {
    try {
      const response = await authFetch?.(`/api/doctor-visiting/${id}`, {
        method: "DELETE",
      });
      if (response && !response?.ok)
        throw new Error("Failed to delete visiting patient entry");
      toast({ title: "Visiting patient entry deleted" });
      fetchDoctorVisiting();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  // save and update doctor visiting handlers can be added here similarly

  // CREATE Doctor Visiting
  const handleCreateDoctorVisiting = async (e: any) => {
    e.preventDefault();
    if (!token) return;

    if (!editingDoctorVisiting.chamber) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a chamber before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const visitingData = {
        ...editingDoctorVisiting,
        doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
      };

      const response = await authFetch?.("/api/doctor-visiting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitingData),
      });

      if (response && !response?.ok)
        throw new Error("Failed to create visiting patient entry");

      toast({
        title: "Success",
        description: "Visiting patient entry created successfully.",
      });

      setIsDoctorVisitingDialogOpen(false);
      fetchDoctorVisiting();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create doctor visiting entry",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // UPDATE Doctor Visiting
  const handleUpdateDoctorVisiting = async (e: any, id: string) => {
    e.preventDefault();
    if (!token || !selectDoctorVisiting?._id) return;

    if (!editingDoctorVisiting.chamber) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a chamber before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const visitingData = {
        ...editingDoctorVisiting,
        doctorId: user?.role === "doctor" ? user._id : selectedDoctorId,
      };

      const response = await authFetch?.(`/api/doctor-visiting/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitingData),
      });

      if (response && !response?.ok)
        throw new Error("Failed to update visiting patient entry");

      toast({
        title: "Success",
        description: "Visiting patient entry updated successfully.",
      });

      setIsDoctorVisitingDialogOpen(false);
      fetchDoctorVisiting();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update doctor visiting entry",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Stethoscope className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Chamber Visiting Patient
            </h1>
            <p className="text-emerald-100 text-sm">
              Manage patient visits and chamber assignments
            </p>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl"></div>
      </div>

      <Tabs defaultValue="doctor-visiting" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="doctor-visiting"
            onClick={(e) => {
              e.stopPropagation();
              // Ensure no dialogs are open when switching tabs
              setIsDoctorVisitingDialogOpen(false);
              setIsDialogOpen(false);
              setDetailsDialogOpen(false);
              setChamberDetailsDialogOpen(false);
              setViewImageOpen(false);
              setIsCameraOpen(false);
            }}
          >
            Chamber Visiting Patient
          </TabsTrigger>
          <TabsTrigger
            value="chambers"
            onClick={(e) => {
              e.stopPropagation();
              // Ensure no dialogs are open when switching tabs
              setIsDoctorVisitingDialogOpen(false);
              setIsDialogOpen(false);
              setDetailsDialogOpen(false);
              setChamberDetailsDialogOpen(false);
              setViewImageOpen(false);
              setIsCameraOpen(false);
            }}
          >
            Chambers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctor-visiting" className="space-y-6">
          {/* ======= Add / Edit Dialog  doctor visiting ======= */}

          <Dialog
            open={isDoctorVisitingDialogOpen}
            onOpenChange={setIsDoctorVisitingDialogOpen}
          >
            <DialogContent className="w-[95vw] max-w-2xl h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg sm:text-xl">
                  {selectDoctorVisiting
                    ? "Edit Visiting Patient"
                    : "Add Visiting Patient"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Manage visiting patient details.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto overscroll-contain px-1">
                <form
                  onSubmit={(e) =>
                    selectDoctorVisiting
                      ? handleUpdateDoctorVisiting(e, selectDoctorVisiting._id)
                      : handleCreateDoctorVisiting(e)
                  }
                  id="doctor-visiting-form"
                  className="space-y-4 sm:space-y-6 pb-4 px-1"
                >
                  {/* Chamber Selection Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">
                      Chamber Selection
                    </h3>
                    <div>
                      <Label className="text-sm">Chamber</Label>
                      <Select
                        value={editingDoctorVisiting.chamber || ""}
                        onValueChange={(value) =>
                          setEditingDoctorVisiting((prev: any) => ({
                            ...prev,
                            chamber: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Chamber" />
                        </SelectTrigger>
                        <SelectContent>
                          {chambers.length > 0 ? (
                            chambers.map((chamber) => (
                              <SelectItem key={chamber._id} value={chamber._id}>
                                {chamber.chamberName} - {chamber.city}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No chambers available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Patient Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Name</Label>
                        <Input
                          className="h-10"
                          value={editingDoctorVisiting.patientName || ""}
                          onChange={(e) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Email</Label>
                        <Input
                          className="h-10"
                          type="email"
                          value={editingDoctorVisiting.patientEmail || ""}
                          onChange={(e) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientEmail: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Phone</Label>
                        <Input
                          className="h-10"
                          type="tel"
                          value={editingDoctorVisiting.patientPhone || ""}
                          onChange={(e) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientPhone: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm">City</Label>
                        <Input
                          className="h-10"
                          value={editingDoctorVisiting.patientCity || ""}
                          onChange={(e) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientCity: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Age</Label>
                        <Input
                          className="h-10"
                          type="number"
                          value={editingDoctorVisiting.patientAge || ""}
                          onChange={(e) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientAge: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Gender</Label>
                        <Select
                          value={editingDoctorVisiting.patientGender || ""}
                          onValueChange={(value) =>
                            setEditingDoctorVisiting((prev: any) => ({
                              ...prev,
                              patientGender: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Patient Files</Label>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 text-base"
                            onClick={startCamera}
                            disabled={isUploading}
                          >
                            <Camera className="w-5 h-5 mr-2" />
                            Take Photo
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 text-base"
                            onClick={() =>
                              document.getElementById("file-upload")?.click()
                            }
                            disabled={isUploading}
                          >
                            <Upload className="mr-2 h-5 w-5" />
                            Gallery
                          </Button>

                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*,video/*,.pdf,.doc,.docx"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              files.forEach(handleFileUpload);
                            }}
                          />
                        </div>

                        {isUploading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </div>
                        )}

                        {Array.isArray(editingDoctorVisiting.patientFile) &&
                          editingDoctorVisiting.patientFile.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {editingDoctorVisiting.patientFile.map(
                                (fileUrl: string, index: number) => {
                                  const isImage =
                                    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
                                  return (
                                    <div
                                      key={index}
                                      className="relative group border rounded-lg overflow-hidden"
                                    >
                                      {isImage ? (
                                        <img
                                          src={getAssetUrl(fileUrl)}
                                          alt={`Preview ${index + 1}`}
                                          className="w-full h-20 object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                                          <span className="text-xs text-gray-500 truncate px-2">
                                            {fileUrl.split("/").pop()}
                                          </span>
                                        </div>
                                      )}
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 w-6 p-0"
                                        onClick={() => removeFile(fileUrl)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Assignment Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">
                      Doctor Assignment
                    </h3>
                    <div>
                      <Label className="text-sm">Doctor</Label>
                      <Input
                        value={
                          user?.role === "doctor"
                            ? user.name || "Current Doctor"
                            : doctors.find((d) => d._id === selectedDoctorId)
                                ?.name || "Selected Doctor"
                        }
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  {/* Additional Notes Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold border-b pb-2">
                      Additional Notes
                    </h3>
                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Textarea
                        className="min-h-20"
                        placeholder="Enter any additional notes or observations..."
                        value={editingDoctorVisiting.notes || ""}
                        onChange={(e) =>
                          setEditingDoctorVisiting((prev: any) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </form>
              </div>

              <DialogFooter className="pt-4 border-t flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    className="h-12 text-base w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  type="submit"
                  form="doctor-visiting-form"
                  disabled={isSaving}
                  className="h-12 text-base w-full sm:w-auto"
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Camera Modal */}
          <Dialog open={isCameraOpen} onOpenChange={stopCamera}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Take Photo</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    id="camera-video"
                    className="w-full h-64 object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>

                <div className="flex justify-center gap-2">
                  {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={switchCamera}
                    >
                      Switch Camera
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    Capture
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={stopCamera}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Patient Details Dialog */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl h-[85vh] sm:max-h-[95vh] flex flex-col p-3 sm:p-6">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Patient Details
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Complete information about the patient
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                {selectedPatientDetails && (
                  <div className="space-y-4">
                    {/* Patient Information */}
                    <div
                      className="bg-blue-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Name:
                          </span>
                          <p className="font-semibold break-words">
                            {selectedPatientDetails.patientName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Email:
                          </span>
                          <p className="font-semibold break-all text-xs sm:text-sm">
                            {selectedPatientDetails.patientEmail}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Phone:
                          </span>
                          <p className="font-semibold">
                            {selectedPatientDetails.patientPhone}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            City:
                          </span>
                          <p className="font-semibold">
                            {selectedPatientDetails.patientCity}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Age:
                          </span>
                          <p className="font-semibold">
                            {selectedPatientDetails.patientAge} years
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Gender:
                          </span>
                          <p className="font-semibold">
                            {selectedPatientDetails.patientGender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Medical Assignment */}
                    <div
                      className="bg-green-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-green-800">
                        Medical Assignment
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Doctor:
                          </span>
                          <p className="font-semibold break-words">
                            {selectedPatientDetails.doctorId?.name ||
                              "Not Assigned"}
                          </p>
                          {selectedPatientDetails.doctorId?.specialization && (
                            <p className="text-xs text-gray-500">
                              {selectedPatientDetails.doctorId.specialization}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Chamber:
                          </span>
                          <p className="font-semibold break-words">
                            {selectedPatientDetails.chamber?.chamberName ||
                              "Not Assigned"}
                          </p>
                          {selectedPatientDetails.chamber?.city && (
                            <p className="text-xs text-gray-500">
                              {selectedPatientDetails.chamber.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visit Information */}
                    <div
                      className="bg-purple-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-purple-800">
                        Visit Information
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Created:
                          </span>
                          <p className="font-semibold text-xs sm:text-sm">
                            {selectedPatientDetails.createdAt
                              ? new Date(
                                  selectedPatientDetails.createdAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Last Updated:
                          </span>
                          <p className="font-semibold text-xs sm:text-sm">
                            {selectedPatientDetails.updatedAt
                              ? new Date(
                                  selectedPatientDetails.updatedAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        {selectedPatientDetails.notes && (
                          <div>
                            <span className="font-medium text-gray-600">
                              Additional Notes:
                            </span>
                            <p className="font-semibold text-xs sm:text-sm whitespace-pre-wrap">
                              {selectedPatientDetails.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient Files */}
                    {selectedPatientDetails.patientFile &&
                      selectedPatientDetails.patientFile.length > 0 && (
                        <div
                          className="bg-orange-50 p-3 sm:p-4"
                          style={{ borderRadius: "5px" }}
                        >
                          <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-orange-800">
                            Patient Files (
                            {selectedPatientDetails.patientFile.length})
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                            {selectedPatientDetails.patientFile.map(
                              (fileUrl: string, index: number) => {
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
                                return (
                                  <div key={index} className="relative group">
                                    {isImage ? (
                                      <div className="aspect-square">
                                        <img
                                          src={getAssetUrl(fileUrl)}
                                          alt={`File ${index + 1}`}
                                          className="w-full h-full object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            const imageFiles =
                                              selectedPatientDetails.patientFile.filter(
                                                (url: string) =>
                                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                    url
                                                  )
                                              );
                                            setSelectedImages(
                                              imageFiles.map((url: string) =>
                                                getAssetUrl(url)
                                              )
                                            );
                                            setCurrentImageIndex(
                                              imageFiles.findIndex(
                                                (url: string) => url === fileUrl
                                              )
                                            );
                                            setViewImageOpen(true);
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="text-lg sm:text-xl">
                                            📄
                                          </div>
                                          <div className="text-xs text-gray-600 font-medium">
                                            {fileUrl
                                              .split("/")
                                              .pop()
                                              ?.split(".")
                                              .pop()
                                              ?.toUpperCase()}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <div className="mt-3 flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => {
                                const imageFiles =
                                  selectedPatientDetails.patientFile.filter(
                                    (url: string) =>
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                                  );
                                if (imageFiles.length > 0) {
                                  setSelectedImages(
                                    imageFiles.map((url: string) =>
                                      getAssetUrl(url)
                                    )
                                  );
                                  setCurrentImageIndex(0);
                                  setViewImageOpen(true);
                                }
                              }}
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              View Images (
                              {
                                selectedPatientDetails.patientFile.filter(
                                  (url: string) =>
                                    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                                ).length
                              }
                              )
                            </Button>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t">
                <DialogClose asChild>
                  <Button variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Chamber Details Dialog */}
          <Dialog
            open={chamberDetailsDialogOpen}
            onOpenChange={setChamberDetailsDialogOpen}
          >
            <DialogContent className="w-[95vw] max-w-2xl h-[85vh] sm:max-h-[95vh] flex flex-col p-3 sm:p-6">
              <DialogHeader className="pb-3">
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Chamber Details
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Complete information about the chamber
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                {selectedChamberDetails && (
                  <div className="space-y-4">
                    {/* Chamber Information */}
                    <div
                      className="bg-green-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Name:
                          </span>
                          <p className="font-semibold break-words">
                            {selectedChamberDetails.chamberName}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            City:
                          </span>
                          <p className="font-semibold">
                            {selectedChamberDetails.city}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Contact Person:
                          </span>
                          <p className="font-semibold break-words">
                            {selectedChamberDetails.contactPerson}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Contact Number:
                          </span>
                          <p className="font-semibold">
                            {selectedChamberDetails.contactNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Assignment */}
                    <div
                      className="bg-blue-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-foreground">
                        Doctor Assignment
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Assigned Doctor:
                          </span>
                          <p className="font-semibold break-words">
                            {doctors.find(
                              (doc) =>
                                doc._id === selectedChamberDetails.doctorId
                            )?.name || "Not Assigned"}
                          </p>
                          {doctors.find(
                            (doc) => doc._id === selectedChamberDetails.doctorId
                          )?.specialization && (
                            <p className="text-xs text-gray-500">
                              {
                                doctors.find(
                                  (doc) =>
                                    doc._id === selectedChamberDetails.doctorId
                                )?.specialization
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chamber Information */}
                    <div
                      className="bg-purple-50 p-3 sm:p-4"
                      style={{ borderRadius: "5px" }}
                    >
                      <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-foreground">
                        Chamber Information
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">
                            Created:
                          </span>
                          <p className="font-semibold text-xs sm:text-sm">
                            {selectedChamberDetails.createdAt
                              ? new Date(
                                  selectedChamberDetails.createdAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">
                            Last Updated:
                          </span>
                          <p className="font-semibold text-xs sm:text-sm">
                            {selectedChamberDetails.updatedAt
                              ? new Date(
                                  selectedChamberDetails.updatedAt
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-3 border-t">
                <DialogClose asChild>
                  <Button variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Image View Dialog */}
          <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-2">
              <DialogHeader className="pb-2">
                <DialogTitle>
                  View Images ({currentImageIndex + 1} of{" "}
                  {selectedImages.length})
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full flex items-center justify-center">
                  {selectedImages.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 z-10"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev > 0 ? prev - 1 : selectedImages.length - 1
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <img
                    src={selectedImages[currentImageIndex]}
                    alt={`Patient file ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                  {selectedImages.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 z-10"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev < selectedImages.length - 1 ? prev + 1 : 0
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = selectedImages[currentImageIndex];
                      link.download = `patient-file-${Date.now()}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {selectedImages.length > 1 && (
                    <div className="flex gap-1">
                      {selectedImages.map((_, index) => (
                        <Button
                          key={index}
                          variant={
                            index === currentImageIndex ? "default" : "outline"
                          }
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Doctor Selection for Admin */}
          {user?.role !== "doctor" && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  Doctor Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Select Doctor:</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.name} - {doctor.specialization || "General"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ======= Header doctor visiting ======= */}
          <div className="flex justify-end items-center animate-slide-up">
            {can("edit", pathname) && (
              <Button onClick={addNewDoctorVisiting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Visiting Patient
              </Button>
            )}
          </div>

          {/* ======= Doctor Visiting Table ======= */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">
                Chamber Visiting Patient
              </CardTitle>
              <CardDescription>
                Manage all patients and their visits.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : doctorVisiting.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">
                  No patients found.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Files</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctorVisiting.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>{item.patientName}</TableCell>
                            <TableCell>
                              {item.doctorId?.name || "Not Assigned"}
                            </TableCell>
                            <TableCell>{item.patientEmail}</TableCell>
                            <TableCell>{item.patientPhone}</TableCell>
                            <TableCell>{item.patientCity}</TableCell>
                            <TableCell>{item.patientAge}</TableCell>
                            <TableCell>{item.patientGender}</TableCell>
                            <TableCell>
                              {item.patientFile &&
                              item.patientFile.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2">
                                    {item.patientFile
                                      .slice(0, 3)
                                      .map((fileUrl: string, index: number) => {
                                        const isImage =
                                          /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                            fileUrl
                                          );
                                        return isImage ? (
                                          <img
                                            key={index}
                                            src={getAssetUrl(fileUrl)}
                                            alt={`File ${index + 1}`}
                                            className="w-8 h-8 rounded-full border-2 border-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                            onClick={() => {
                                              const imageFiles =
                                                item.patientFile.filter(
                                                  (url: string) =>
                                                    /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                      url
                                                    )
                                                );
                                              setSelectedImages(
                                                imageFiles.map((url: string) =>
                                                  getAssetUrl(url)
                                                )
                                              );
                                              setCurrentImageIndex(
                                                imageFiles.findIndex(
                                                  (url: string) =>
                                                    url === fileUrl
                                                )
                                              );
                                              setViewImageOpen(true);
                                            }}
                                          />
                                        ) : (
                                          <div
                                            key={index}
                                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs"
                                          >
                                            📄
                                          </div>
                                        );
                                      })}
                                  </div>
                                  {item.patientFile.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{item.patientFile.length - 3}
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const imageFiles =
                                        item.patientFile.filter((url: string) =>
                                          /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                            url
                                          )
                                        );
                                      if (imageFiles.length > 0) {
                                        setSelectedImages(
                                          imageFiles.map((url: string) =>
                                            getAssetUrl(url)
                                          )
                                        );
                                        setCurrentImageIndex(0);
                                        setViewImageOpen(true);
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                "No files"
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPatientDetails(item);
                                      setDetailsDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                    Details
                                  </DropdownMenuItem>
                                  {can("edit", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() => editDoctorVisiting(item)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  {can("delete", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setItemToDelete({
                                          id: item._id,
                                          type: "doctorVisiting",
                                        });
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {doctorVisiting.map((item) => (
                      <Card
                        key={item._id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base">
                                {item.patientName}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {item.doctorId?.name || "Not Assigned"}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPatientDetails(item);
                                    setDetailsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() => editDoctorVisiting(item)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setItemToDelete({
                                        id: item._id,
                                        type: "doctorVisiting",
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-1 text-xs mb-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Email:
                              </span>
                              <span className="font-medium truncate ml-2">
                                {item.patientEmail}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Phone:
                              </span>
                              <span className="font-medium">
                                {item.patientPhone}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                City:
                              </span>
                              <span className="font-medium">
                                {item.patientCity}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Age/Gender:
                              </span>
                              <span className="font-medium">
                                {item.patientAge} / {item.patientGender}
                              </span>
                            </div>
                          </div>

                          {item.patientFile && item.patientFile.length > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">
                                  Files:
                                </span>
                                <div className="flex -space-x-1">
                                  {item.patientFile
                                    .slice(0, 3)
                                    .map((fileUrl: string, index: number) => {
                                      const isImage =
                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                          fileUrl
                                        );
                                      return isImage ? (
                                        <img
                                          key={index}
                                          src={getAssetUrl(fileUrl)}
                                          alt={`File ${index + 1}`}
                                          className="w-6 h-6 rounded-full border border-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                          onClick={() => {
                                            const imageFiles =
                                              item.patientFile.filter(
                                                (url: string) =>
                                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                    url
                                                  )
                                              );
                                            setSelectedImages(
                                              imageFiles.map((url: string) =>
                                                getAssetUrl(url)
                                              )
                                            );
                                            setCurrentImageIndex(
                                              imageFiles.findIndex(
                                                (url: string) => url === fileUrl
                                              )
                                            );
                                            setViewImageOpen(true);
                                          }}
                                        />
                                      ) : (
                                        <div
                                          key={index}
                                          className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center text-xs"
                                        >
                                          📄
                                        </div>
                                      );
                                    })}
                                </div>
                                {item.patientFile.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{item.patientFile.length - 3}
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const imageFiles = item.patientFile.filter(
                                    (url: string) =>
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                                  );
                                  if (imageFiles.length > 0) {
                                    setSelectedImages(
                                      imageFiles.map((url: string) =>
                                        getAssetUrl(url)
                                      )
                                    );
                                    setCurrentImageIndex(0);
                                    setViewImageOpen(true);
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chambers" className="space-y-6">
          {/* Doctor Selection for Admin - Chambers Tab */}
          {user?.role !== "doctor" && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  Doctor Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Select Doctor:</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          {doctor.name} - {doctor.specialization || "General"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ======= Add / Edit Dialog  chamber ======= */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-xl h-[85vh] sm:max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {selectedChamber ? "Edit Chamber" : "Add Chamber"}
                </DialogTitle>
                <DialogDescription>Manage chamber details.</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto overscroll-contain px-1">
                <form
                  onSubmit={(e) =>
                    selectedChamber
                      ? handleUpdate(e, selectedChamber._id)
                      : handleCreate(e)
                  }
                  id="chamber-form"
                  className="space-y-6 pb-4 px-1"
                >
                  {/* Chamber Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Chamber Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Chamber Name</Label>
                        <Input
                          value={editingChamber.chamberName || ""}
                          onChange={(e) =>
                            setEditingChamber((prev: any) => ({
                              ...prev,
                              chamberName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label>City</Label>
                        <Input
                          value={editingChamber.city || ""}
                          onChange={(e) =>
                            setEditingChamber((prev: any) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Person</Label>
                        <Input
                          value={editingChamber.contactPerson || ""}
                          onChange={(e) =>
                            setEditingChamber((prev: any) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label>Contact Number</Label>
                        <Input
                          type="tel"
                          value={editingChamber.contactNumber || ""}
                          onChange={(e) =>
                            setEditingChamber((prev: any) => ({
                              ...prev,
                              contactNumber: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Assignment Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Doctor Assignment
                    </h3>

                    <div>
                      <Label>Assigned Doctor</Label>
                      <Input
                        value={
                          user?.role === "doctor"
                            ? user.name || "Current Doctor"
                            : doctors.find((d) => d._id === selectedDoctorId)
                                ?.name || "Selected Doctor"
                        }
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <DialogFooter className="pt-4 border-t flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  type="submit"
                  form="chamber-form"
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ======= Header chamber ======= */}
          <div className="flex justify-end items-center animate-slide-up">
            {can("edit", pathname) && (
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New
              </Button>
            )}
          </div>

          {/* ======= Chamber Table ======= */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">
                Chamber List
              </CardTitle>
              <CardDescription>
                Manage all chambers and their details.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : chambers.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">
                  No chambers found.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Contact Number</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chambers.map((item) => {
                          const assignedDoctor = doctors.find(
                            (doc) => doc._id === item.doctorId
                          );
                          return (
                            <TableRow key={item._id}>
                              <TableCell>{item.chamberName}</TableCell>
                              <TableCell>{item.city}</TableCell>
                              <TableCell>{item.contactPerson}</TableCell>
                              <TableCell>{item.contactNumber}</TableCell>
                              <TableCell>
                                {assignedDoctor?.name || "Not Assigned"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedChamberDetails(item);
                                        setChamberDetailsDialogOpen(true);
                                      }}
                                    >
                                      <Eye className="mr-2 h-4 w-4" /> View
                                      Details
                                    </DropdownMenuItem>
                                    {can("edit", pathname) && (
                                      <DropdownMenuItem
                                        onClick={() => handleEdit(item)}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {can("delete", pathname) && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setItemToDelete({
                                            id: item._id,
                                            type: "chamber",
                                          });
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {chambers.map((item) => {
                      const assignedDoctor = doctors.find(
                        (doc) => doc._id === item.doctorId
                      );
                      return (
                        <Card key={item._id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold">
                                  {item.chamberName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.city}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedChamberDetails(item);
                                      setChamberDetailsDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View
                                    Details
                                  </DropdownMenuItem>
                                  {can("edit", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() => handleEdit(item)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {can("delete", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setItemToDelete({
                                          id: item._id,
                                          type: "chamber",
                                        });
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Contact:</span>{" "}
                                {item.contactPerson}
                              </div>
                              <div>
                                <span className="font-medium">Phone:</span>{" "}
                                {item.contactNumber}
                              </div>
                              <div>
                                <span className="font-medium">Doctor:</span>{" "}
                                {assignedDoctor?.name || "Not Assigned"}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the{" "}
                  {itemToDelete?.type === "chamber"
                    ? "chamber"
                    : "visiting patient entry"}
                  .
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (itemToDelete) {
                      if (itemToDelete.type === "chamber") {
                        handleDelete(itemToDelete.id);
                      } else {
                        deleteDoctorVisiting(itemToDelete.id);
                      }
                      setDeleteDialogOpen(false);
                      setItemToDelete(null);
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
