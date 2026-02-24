"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Trash2, PlusCircle, Stethoscope, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermission } from "@/hooks/use-permission";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimeSlotsPage() {
  const { user, loading: authLoading, authFetch, token } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Admin state
  const [masterSlots, setMasterSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [consultationType, setConsultationType] = useState<"inclinic" | "online">("inclinic");
  const [adminDoctorSlots, setAdminDoctorSlots] = useState<{
    inclinic: {
      monday: string[];
      tuesday: string[];
      wednesday: string[];
      thursday: string[];
      friday: string[];
      saturday: string[];
      sunday: string[];
    };
    online: {
      monday: string[];
      tuesday: string[];
      wednesday: string[];
      thursday: string[];
      friday: string[];
      saturday: string[];
      sunday: string[];
    };
  }>({
    inclinic: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    online: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  });
  const [adminPatientsPerSlot, setAdminPatientsPerSlot] = useState<{
    inclinic: string;
    online: string;
  }>({
    inclinic: "1",
    online: "1",
  });

  // Doctor state
  const [doctorAvailableSlots, setDoctorAvailableSlots] = useState<{
    inclinic: {
      monday: string[];
      tuesday: string[];
      wednesday: string[];
      thursday: string[];
      friday: string[];
      saturday: string[];
      sunday: string[];
    };
    online: {
      monday: string[];
      tuesday: string[];
      wednesday: string[];
      thursday: string[];
      friday: string[];
      saturday: string[];
      sunday: string[];
    };
  }>({
    inclinic: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    online: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  });
  const [doctorPatientsPerSlot, setDoctorPatientsPerSlot] = useState<{
    inclinic: string;
    online: string;
  }>({
    inclinic: "1",
    online: "1",
  });

  // Selected day for doctor view
  const [selectedDay, setSelectedDay] = useState<string>("monday");

  // General state
  const [isLoading, setIsLoading] = useState(true);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | boolean>(false); // string for delete, boolean for add/save

  const fetchMasterSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/timeslots?source=master");
      if (!response.ok) {
        throw new Error("Failed to load time slots.");
      }
      const data = await response.json();

      // Ensure data is an array before sorting
      if (Array.isArray(data)) {
        setMasterSlots(data.sort());
      } else {
        setMasterSlots([]); // Default to empty array if response is not an array
      }

      // If user is a doctor, fetch their weekly availability
      if (user?.role === "doctor") {
        await fetchDoctorWeeklyAvailability();
      }
      
      // If user is admin, fetch doctors list
      if (user?.role === "admin") {
        await fetchDoctors();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
      setMasterSlots([]); // Default to empty on error
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, user, toast]);

  const fetchDoctorWeeklyAvailability = useCallback(async () => {
    if (!user || user.role !== "doctor") return;

    try {
      console.log("Fetching doctor availability for user:", user._id);
      const response = await authFetch(`/api/timeslots/doctor/${user._id || user.id}`);
      if (!response.ok) {
        throw new Error("Failed to load doctor availability.");
      }
      const data = await response.json();

      console.log("Doctor availability response:", data);

      if (data.success && data.data.availableSlots) {
        const slots = data.data.availableSlots.slots || data.data.availableSlots;
        
        // Check if data has inclinic/online structure
        if (slots.inclinic || slots.online) {
          setDoctorAvailableSlots({
            inclinic: slots.inclinic || {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
            online: slots.online || {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
          });
        } else {
          // Legacy format - treat as inclinic
          setDoctorAvailableSlots({
            inclinic: slots,
            online: {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
          });
        }
        
        // Set patients per slot
        const patientsPerSlot = data.data.availableSlots.patientsPerSlot;
        if (patientsPerSlot) {
          if (typeof patientsPerSlot === 'object') {
            setDoctorPatientsPerSlot({
              inclinic: patientsPerSlot.inclinic?.toString() || "1",
              online: patientsPerSlot.online?.toString() || "1",
            });
          } else {
            setDoctorPatientsPerSlot({
              inclinic: patientsPerSlot.toString(),
              online: patientsPerSlot.toString(),
            });
          }
        }
      } else {
        // Initialize with empty arrays if no data
        setDoctorAvailableSlots({
          inclinic: {
            monday: [], tuesday: [], wednesday: [], thursday: [],
            friday: [], saturday: [], sunday: [],
          },
          online: {
            monday: [], tuesday: [], wednesday: [], thursday: [],
            friday: [], saturday: [], sunday: [],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching doctor availability:", error);
      // Initialize with empty arrays on error
      setDoctorAvailableSlots({
        inclinic: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
        online: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
      });
    }
  }, [authFetch, user]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await authFetch("/api/users?role=doctor");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      const doctorsList = Array.isArray(data) ? data : [];
      setDoctors(doctorsList);
      
      // Set first doctor as default if available
      if (doctorsList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorsList[0]._id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load doctors list",
      });
    }
  }, [authFetch, toast, selectedDoctorId]);

  const fetchDoctorSlotsForAdmin = useCallback(async (doctorId: string) => {
    if (!doctorId) return;
    setIsDoctorLoading(true);
    try {
      const response = await authFetch(`/api/timeslots/doctor/${doctorId}`);
      if (!response.ok) throw new Error("Failed to load doctor availability");
      const data = await response.json();
      
      if (data.success && data.data.availableSlots) {
        const slots = data.data.availableSlots.slots || data.data.availableSlots;
        
        // Check if data has inclinic/online structure
        if (slots.inclinic || slots.online) {
          setAdminDoctorSlots({
            inclinic: slots.inclinic || {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
            online: slots.online || {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
          });
        } else {
          // Legacy format - treat as inclinic
          setAdminDoctorSlots({
            inclinic: slots,
            online: {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
          });
        }
        
        // Set patients per slot
        const patientsPerSlot = data.data.availableSlots.patientsPerSlot;
        if (patientsPerSlot) {
          if (typeof patientsPerSlot === 'object') {
            setAdminPatientsPerSlot({
              inclinic: patientsPerSlot.inclinic?.toString() || "1",
              online: patientsPerSlot.online?.toString() || "1",
            });
          } else {
            setAdminPatientsPerSlot({
              inclinic: patientsPerSlot.toString(),
              online: patientsPerSlot.toString(),
            });
          }
        }
      } else {
        setAdminDoctorSlots({
          inclinic: {
            monday: [], tuesday: [], wednesday: [], thursday: [],
            friday: [], saturday: [], sunday: [],
          },
          online: {
            monday: [], tuesday: [], wednesday: [], thursday: [],
            friday: [], saturday: [], sunday: [],
          },
        });
      }
    } catch (error) {
      setAdminDoctorSlots({
        inclinic: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
        online: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
      });
    } finally {
      setIsDoctorLoading(false);
    }
  }, [authFetch]);

  // Effect to load first doctor's slots when selectedDoctorId changes
  useEffect(() => {
    if (selectedDoctorId && user?.role === "admin") {
      fetchDoctorSlotsForAdmin(selectedDoctorId);
    }
  }, [selectedDoctorId, fetchDoctorSlotsForAdmin, user?.role]);

  useEffect(() => {
    console.log("user:", user);
    console.log("authLoading:", authLoading);
    console.log("can view page:", can("view", pathname));
    if (!authLoading) {
      if (!user || !can("view", pathname)) {
        router.push("/dashboard");
      } else {
        fetchMasterSlots();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchMasterSlots]);

  const formatTime12h = (time24: string | undefined) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${String(h).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // --- Admin Functions ---
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot || !token) return;
    if (masterSlots.includes(newSlot)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This time slot already exists.",
      });
      return;
    }

    setIsSubmitting(true);
    const updatedSlots = [...masterSlots, newSlot].sort();

    try {
      const response = await authFetch("/api/timeslots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: updatedSlots }),
      });
      if (!response.ok) throw new Error("Failed to save master slot list");

      toast({ title: "Success", description: "Time slot added successfully." });
      setNewSlot("");
      await fetchMasterSlots();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotToDelete: string) => {
    if (!token) return;
    setIsSubmitting(slotToDelete);
    const updatedSlots = masterSlots.filter((slot) => slot !== slotToDelete);

    try {
      const response = await authFetch("/api/timeslots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: updatedSlots }),
      });
      if (!response.ok) throw new Error("Failed to save master slot list");

      toast({
        title: "Success",
        description: "Time slot removed successfully.",
      });
      await fetchMasterSlots();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Doctor Functions ---
  const handleDoctorSlotToggle = (
    slot: string,
    day: string,
    checked: boolean,
    type: "inclinic" | "online"
  ) => {
    setDoctorAvailableSlots((prev) => {
      const newAvailability = { ...prev };
      const dayKey = day.toLowerCase() as keyof typeof newAvailability.inclinic;

      if (checked) {
        if (!newAvailability[type][dayKey].includes(slot)) {
          newAvailability[type][dayKey] = [...newAvailability[type][dayKey], slot].sort();
        }
      } else {
        newAvailability[type][dayKey] = newAvailability[type][dayKey].filter(
          (s) => s !== slot
        );
      }

      return newAvailability;
    });
  };

  const isDoctorSlotAvailable = (slot: string, day: string, type: "inclinic" | "online"): boolean => {
    const dayKey = day.toLowerCase() as keyof typeof doctorAvailableSlots.inclinic;
    return doctorAvailableSlots[type][dayKey].includes(slot);
  };

  const handleSaveChangesForDoctor = async () => {
    if (!user || !token) return;
    setIsSubmitting(true);

    try {
      const payload = { 
        slots: doctorAvailableSlots, 
        patientsPerSlot: {
          inclinic: parseInt(doctorPatientsPerSlot.inclinic) || 1,
          online: parseInt(doctorPatientsPerSlot.online) || 1,
        }
      };
      console.log("Saving doctor availability:", payload);

      const response = await authFetch(`/api/timeslots/doctor/${user._id || user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save availability.");
      }

      const responseData = await response.json();
      console.log("Save response:", responseData);

      if (responseData.success) {
        toast({
          title: "Success",
          description: "Your weekly availability has been updated.",
        });
        await fetchDoctorWeeklyAvailability();
      } else {
        throw new Error(responseData.message || "Failed to save availability.");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Admin Doctor Slot Management Functions ---
  const handleAdminDoctorSlotToggle = (
    slot: string,
    day: string,
    checked: boolean,
    type: "inclinic" | "online"
  ) => {
    setAdminDoctorSlots((prev) => {
      const newAvailability = { ...prev };
      const dayKey = day.toLowerCase() as keyof typeof newAvailability.inclinic;

      if (checked) {
        if (!newAvailability[type][dayKey].includes(slot)) {
          newAvailability[type][dayKey] = [...newAvailability[type][dayKey], slot].sort();
        }
      } else {
        newAvailability[type][dayKey] = newAvailability[type][dayKey].filter(
          (s) => s !== slot
        );
      }

      return newAvailability;
    });
  };

  const isAdminDoctorSlotAvailable = (slot: string, day: string, type: "inclinic" | "online"): boolean => {
    const dayKey = day.toLowerCase() as keyof typeof adminDoctorSlots.inclinic;
    return adminDoctorSlots[type][dayKey].includes(slot);
  };

  const handleSaveDoctorSlots = async () => {
    if (!selectedDoctorId) return;
    setIsSubmitting(true);

    try {
      const payload = { 
        slots: adminDoctorSlots, 
        patientsPerSlot: {
          inclinic: parseInt(adminPatientsPerSlot.inclinic) || 1,
          online: parseInt(adminPatientsPerSlot.online) || 1,
        }
      };
      console.log("Saving admin doctor slots:", payload);
      
      const response = await authFetch(`/api/timeslots/doctor/${selectedDoctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save doctor availability");
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast({
          title: "Success",
          description: "Doctor availability updated successfully",
        });
      } else {
        throw new Error(responseData.message || "Failed to save doctor availability");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorSelection = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    if (doctorId) {
      fetchDoctorSlotsForAdmin(doctorId);
    } else {
      setAdminDoctorSlots({
        inclinic: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
        online: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: [],
        },
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const hasAdminPermission = user.role === "admin";

  const renderAdminView = () => (
    <Tabs defaultValue="master-slots" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="master-slots">Master Time Slots</TabsTrigger>
        <TabsTrigger value="doctor-slots">Doctor Availability</TabsTrigger>
      </TabsList>
      
      <TabsContent value="master-slots">
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Manage Master Time Slots</CardTitle>
            <CardDescription>
              Add or remove the time slots available for booking across the entire
              clinic.
            </CardDescription>
          </CardHeader>
      <CardContent>
        <form onSubmit={handleAddSlot} className="flex items-end gap-4 mb-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="new-slot">New Time Slot (24-hour format)</Label>
            <Input
              id="new-slot"
              type="time"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              required
              disabled={isSubmitting === true}
            />
          </div>
          <Button type="submit" disabled={isSubmitting === true}>
            {isSubmitting === true ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            {isSubmitting === true ? "Adding..." : "Add Slot"}
          </Button>
        </form>
        <ScrollArea className="h-[50vh]">
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">
              Current Master Slots
            </h4>
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : masterSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {masterSlots.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                  >
                    <span className="font-mono text-xs flex-1 text-center">
                      {formatTime12h(slot)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-destructive flex-shrink-0 ml-1"
                      onClick={() => handleDeleteSlot(slot)}
                      disabled={!!isSubmitting}
                    >
                      {isSubmitting === slot ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span className="sr-only">Delete {slot}</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                No master time slots configured.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
      </TabsContent>
      
      <TabsContent value="doctor-slots">
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Manage Doctor Availability</CardTitle>
            <CardDescription>
              Select a doctor and manage their weekly availability schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="doctor-select">Select Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={handleDoctorSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedDoctorId && (
                  <>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="consultation-type">Consultation Type</Label>
                      <Select value={consultationType} onValueChange={(value: "inclinic" | "online") => setConsultationType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inclinic">In-Clinic</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="patients-per-slot">Patients Per Slot ({consultationType === "inclinic" ? "In-Clinic" : "Online"})</Label>
                      <Input
                        id="patients-per-slot"
                        type="number"
                        min="1"
                        max="10"
                        value={adminPatientsPerSlot[consultationType]}
                        onChange={(e) => setAdminPatientsPerSlot(prev => ({ ...prev, [consultationType]: e.target.value }))}
                        disabled={!!isSubmitting}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {selectedDoctorId && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted rounded-lg">
                    {[
                      { key: "monday", label: "Monday", short: "Mon" },
                      { key: "tuesday", label: "Tuesday", short: "Tue" },
                      { key: "wednesday", label: "Wednesday", short: "Wed" },
                      { key: "thursday", label: "Thursday", short: "Thu" },
                      { key: "friday", label: "Friday", short: "Fri" },
                      { key: "saturday", label: "Saturday", short: "Sat" },
                      { key: "sunday", label: "Sunday", short: "Sun" },
                    ].map((day) => (
                      <Button
                        key={day.key}
                        variant={selectedDay === day.key ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 min-w-0 ${
                          selectedDay === day.key ? "shadow-sm" : ""
                        }`}
                        onClick={() => setSelectedDay(day.key)}
                        disabled={!!isSubmitting}
                      >
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.short}</span>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-primary">
                        {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} - {consultationType === "inclinic" ? "In-Clinic" : "Online"}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {
                          adminDoctorSlots[consultationType][
                            selectedDay as keyof typeof adminDoctorSlots.inclinic
                          ].length
                        }{" "}
                        slots selected
                      </div>
                    </div>
                    
                    <div className="max-h-[50vh] overflow-y-auto">
                      {isDoctorLoading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                          ))}
                        </div>
                      ) : masterSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                          {masterSlots.map((slot) => (
                            <div
                              key={`admin-${selectedDay}-${slot}`}
                              className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                id={`admin-slot-${selectedDay}-${slot}`}
                                checked={isAdminDoctorSlotAvailable(slot, selectedDay, consultationType)}
                                onCheckedChange={(checked) =>
                                  handleAdminDoctorSlotToggle(slot, selectedDay, !!checked, consultationType)
                                }
                                disabled={!!isSubmitting}
                                className="flex-shrink-0"
                              />
                              <Label
                                htmlFor={`admin-slot-${selectedDay}-${slot}`}
                                className="font-mono text-xs cursor-pointer flex-1 text-center"
                              >
                                {formatTime12h(slot)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No master time slots configured yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          {selectedDoctorId && (
            <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                In-Clinic: {Object.values(adminDoctorSlots.inclinic).flat().length} | 
                Online: {Object.values(adminDoctorSlots.online).flat().length}
              </div>
              <Button
                onClick={handleSaveDoctorSlots}
                disabled={!!isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Doctor Availability
              </Button>
            </CardFooter>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderDoctorView = () => {
    const daysOfWeek = [
      { key: "monday", label: "Monday", short: "Mon" },
      { key: "tuesday", label: "Tuesday", short: "Tue" },
      { key: "wednesday", label: "Wednesday", short: "Wed" },
      { key: "thursday", label: "Thursday", short: "Thu" },
      { key: "friday", label: "Friday", short: "Fri" },
      { key: "saturday", label: "Saturday", short: "Sat" },
      { key: "sunday", label: "Sunday", short: "Sun" },
    ];

    const selectedDayData = daysOfWeek.find((day) => day.key === selectedDay);

    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Set Your Weekly Availability</CardTitle>
          <CardDescription>
            Select the time slots you are available for appointments for each
            day of the week. Use the day tabs below to switch between days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Consultation Type Tabs */}
          <Tabs defaultValue="inclinic" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inclinic">In-Clinic</TabsTrigger>
              <TabsTrigger value="online">Online Consultancy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inclinic" className="space-y-6">
              {/* Patients Per Slot Setting */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="doctor-patients-per-slot-inclinic">Patients Per Slot (In-Clinic)</Label>
                <Input
                  id="doctor-patients-per-slot-inclinic"
                  type="number"
                  min="1"
                  max="10"
                  value={doctorPatientsPerSlot.inclinic}
                  onChange={(e) => setDoctorPatientsPerSlot(prev => ({ ...prev, inclinic: e.target.value }))}
                  disabled={!!isSubmitting}
                />
              </div>
              
              {/* Day Selection Header */}
              <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.key}
                    variant={selectedDay === day.key ? "default" : "ghost"}
                    size="sm"
                    className={`flex-1 min-w-0 ${
                      selectedDay === day.key ? "shadow-sm" : ""
                    }`}
                    onClick={() => setSelectedDay(day.key)}
                    disabled={!!isSubmitting}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </Button>
                ))}
              </div>

              {/* Current Day Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-primary">
                    {selectedDayData?.label} - In-Clinic
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {
                      doctorAvailableSlots.inclinic[
                        selectedDay as keyof typeof doctorAvailableSlots.inclinic
                      ].length
                    }{" "}
                    slots selected
                  </div>
                </div>

                <ScrollArea className="h-[50vh] -mr-6 pr-6">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : masterSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {masterSlots.map((slot) => (
                          <div
                            key={`inclinic-${selectedDay}-${slot}`}
                            className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`slot-inclinic-${selectedDay}-${slot}`}
                              checked={isDoctorSlotAvailable(slot, selectedDay, "inclinic")}
                              onCheckedChange={(checked) =>
                                handleDoctorSlotToggle(slot, selectedDay, !!checked, "inclinic")
                              }
                              disabled={!!isSubmitting}
                              className="flex-shrink-0"
                            />
                            <Label
                              htmlFor={`slot-inclinic-${selectedDay}-${slot}`}
                              className="font-mono text-xs cursor-pointer flex-1 text-center"
                            >
                              {formatTime12h(slot)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No master time slots have been configured by the admin yet.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="online" className="space-y-6">
              {/* Patients Per Slot Setting */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="doctor-patients-per-slot-online">Patients Per Slot (Online)</Label>
                <Input
                  id="doctor-patients-per-slot-online"
                  type="number"
                  min="1"
                  max="10"
                  value={doctorPatientsPerSlot.online}
                  onChange={(e) => setDoctorPatientsPerSlot(prev => ({ ...prev, online: e.target.value }))}
                  disabled={!!isSubmitting}
                />
              </div>
              
              {/* Day Selection Header */}
              <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.key}
                    variant={selectedDay === day.key ? "default" : "ghost"}
                    size="sm"
                    className={`flex-1 min-w-0 ${
                      selectedDay === day.key ? "shadow-sm" : ""
                    }`}
                    onClick={() => setSelectedDay(day.key)}
                    disabled={!!isSubmitting}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </Button>
                ))}
              </div>

              {/* Current Day Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-primary">
                    {selectedDayData?.label} - Online
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {
                      doctorAvailableSlots.online[
                        selectedDay as keyof typeof doctorAvailableSlots.online
                      ].length
                    }{" "}
                    slots selected
                  </div>
                </div>

                <ScrollArea className="h-[50vh] -mr-6 pr-6">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : masterSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {masterSlots.map((slot) => (
                          <div
                            key={`online-${selectedDay}-${slot}`}
                            className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`slot-online-${selectedDay}-${slot}`}
                              checked={isDoctorSlotAvailable(slot, selectedDay, "online")}
                              onCheckedChange={(checked) =>
                                handleDoctorSlotToggle(slot, selectedDay, !!checked, "online")
                              }
                              disabled={!!isSubmitting}
                              className="flex-shrink-0"
                            />
                            <Label
                              htmlFor={`slot-online-${selectedDay}-${slot}`}
                              className="font-mono text-xs cursor-pointer flex-1 text-center"
                            >
                              {formatTime12h(slot)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No master time slots have been configured by the admin yet.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            In-Clinic: {Object.values(doctorAvailableSlots.inclinic).flat().length} | 
            Online: {Object.values(doctorAvailableSlots.online).flat().length}
          </div>
          <Button
            onClick={handleSaveChangesForDoctor}
            disabled={!!isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save My Weekly Availability
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
              Time Slots Management
            </h1>
            <p className="text-slate-100 text-sm">
              {hasAdminPermission
                ? "Manage the clinic's master appointment time slots"
                : "Set your weekly availability schedule for appointments"}
            </p>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
      </div>
      {hasAdminPermission ? renderAdminView() : renderDoctorView()}
    </div>
  );
}
