"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MagicTextarea } from "@/components/magic-textarea";
import type { Appointment, Service, Patient, ManagedUser } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Calendar as CalendarIcon,
  X,
  CalendarDays,
  PlusCircle,
  FileText,
  Edit,
  Loader2,
  ArrowUpDown,
  Trash,
  Undo,
  Trash2,
  UserPlus,
  Eye,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { usePathname } from "next/navigation";

type EditingAppointment = Partial<Appointment & Patient> & {
  firstName?: string;
  lastName?: string;
};

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contact: string;
  deletedAt?: string | null;
}

export default function VisitingPage() {
  const { user, token, authFetch } = useAuth();
  const { toast } = useToast();
  const { can } = usePermission();
  const pathname = usePathname();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPatientDetailsDialogOpen, setIsPatientDetailsDialogOpen] =
    useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedPatientForDetails, setSelectedPatientForDetails] =
    useState<any>(null);
  const [editingAppointment, setEditingAppointment] =
    useState<EditingAppointment>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsWithCapacity, setSlotsWithCapacity] = useState<any[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    age: "",
    gender: "",
    address: "",
  });

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/patient-visits");
      if (!response.ok) throw new Error("Failed to fetch visits");
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load visits.",
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchSupportingData = useCallback(async () => {
    if (!token) return;
    try {
      const [servicesRes, slotsRes] = await Promise.all([
        authFetch("/api/services"),
        authFetch("/api/timeslots?source=master"),
      ]);
      if (!servicesRes.ok) throw new Error("Failed to fetch services");
      if (!slotsRes.ok) throw new Error("Failed to fetch time slots");

      const servicesData = await servicesRes.json();
      const slotsData = await slotsRes.json();

      setServices(servicesData);
      setTimeSlots(slotsData);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load supporting data.",
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchDoctorsByService = useCallback(
    async (serviceId: string) => {
      if (!token || !serviceId) return;
      try {
        const response = await authFetch(`/api/services/${serviceId}/doctors`);
        if (!response.ok) throw new Error("Failed to fetch doctors");
        const doctorsData = await response.json();
        setDoctors(doctorsData);
      } catch (error) {
        if (!(error as Error).message.includes("Session expired")) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load doctors for this service.",
          });
        }
      }
    },
    [token, toast, authFetch]
  );

  const fetchAvailableSlots = useCallback(
    async (doctorId: string, date: string) => {
      if (!token || !doctorId || !date) return;
      try {
        const response = await authFetch(
          `/api/timeslots/availability/${doctorId}/${date}`
        );
        if (!response.ok) throw new Error("Failed to fetch available slots");
        const data = await response.json();
        if (data.success) {
          setTimeSlots(data.data.availableSlots || []);
          setSlotsWithCapacity(data.data.slotsWithCapacity || []);
        }
      } catch (error) {
        if (!(error as Error).message.includes("Session expired")) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load available time slots.",
          });
        }
      }
    },
    [token, toast, authFetch]
  );

  const fetchPatients = useCallback(
    async (search = "") => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "100",
          ...(search && { search }),
        });
        const response = await authFetch(`/api/patients?${params}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const activePatients = result.data.filter(
            (c: Customer) => c.deletedAt === null
          );
          if (search) {
            return activePatients;
          } else {
            setPatients(activePatients);
          }
        } else if (Array.isArray(result)) {
          const activePatients = result.filter(
            (c: Customer) => c.deletedAt === null
          );
          if (search) {
            return activePatients;
          } else {
            setPatients(activePatients);
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch patients",
        });
      }
      return [];
    },
    [authFetch, toast]
  );

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      Promise.all([
        fetchAppointments(),
        fetchSupportingData(),
        fetchPatients(),
      ]).finally(() => setIsLoading(false));
    }
  }, [token, fetchAppointments, fetchSupportingData, fetchPatients]);

  useEffect(() => {
    if (user && user.role === "doctor") {
      setDoctorFilter(user._id);
    }
  }, [user]);

  const uniqueDoctors = useMemo(() => {
    const doctorSet = new Set<string>();
    appointments.forEach((app) => {
      if (app.doctorId?.name) doctorSet.add(app.doctorId.name);
    });
    return Array.from(doctorSet);
  }, [appointments]);

  const uniqueServices = useMemo(() => {
    const serviceSet = new Set<string>();
    appointments.forEach((app) => {
      if (app.serviceId?.name) serviceSet.add(app.serviceId.name);
    });
    return Array.from(serviceSet);
  }, [appointments]);

  const uniqueDoctorIds = useMemo(() => {
    const doctorMap = new Map<string, string>();
    appointments.forEach((app) => {
      if (app.doctorId?._id && app.doctorId?.name) {
        doctorMap.set(app.doctorId._id, app.doctorId.name);
      }
    });
    return doctorMap;
  }, [appointments]);

  const uniqueServiceIds = useMemo(() => {
    const serviceMap = new Map<string, string>();
    appointments.forEach((app) => {
      if (app.serviceId?._id && app.serviceId?.name) {
        serviceMap.set(app.serviceId._id, app.serviceId.name);
      }
    });
    return serviceMap;
  }, [appointments]);

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditingAppointment({ ...appointment, ...appointment.patientId });
    if (appointment.serviceId?._id) {
      fetchDoctorsByService(appointment.serviceId._id);
    }
    if (appointment.doctorId?._id && appointment.date) {
      fetchAvailableSlots(appointment.doctorId._id, appointment.date);
    }
    setIsUpsertDialogOpen(true);
  };

  const handleViewClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handlePatientNameClick = (patient: any) => {
    setSelectedPatientForDetails(patient);
    setIsPatientDetailsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setSelectedAppointment(null);
    setEditingAppointment({
      status: "Confirmed",
      date: new Date().toISOString().split("T")[0],
    });
    setIsUpsertDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCustomer.firstName ||
      !newCustomer.lastName ||
      !newCustomer.contact
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill required fields",
      });
      return;
    }
    try {
      const customerData = {
        ...newCustomer,
        age: newCustomer.age ? parseInt(newCustomer.age) : undefined,
      };
      const response = await authFetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) throw new Error("Failed to create patient");
      const result = await response.json();
      toast({ title: "Success", description: "Patient created successfully" });
      setIsCustomerDialogOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        contact: "",
        age: "",
        gender: "",
        address: "",
      });
      fetchPatients();
      if (result.data?._id) {
        setEditingAppointment((prev) => ({
          ...prev,
          patientId: result.data._id,
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    status: Appointment["status"]
  ) => {
    if (!token) return;
    setUpdatingStatusId(appointmentId);
    try {
      const response = await authFetch(`/api/patient-visits/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");

      const updatedAppointment = await response.json();

      setAppointments((prevAppointments) =>
        prevAppointments.map((app) =>
          app._id === appointmentId ? updatedAppointment : app
        )
      );

      toast({ title: "Success", description: "Visit status updated." });
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update status.",
        });
      }
      fetchAppointments();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSoftDelete = async (appointmentId: string) => {
    if (!token) return;
    setProcessingId(appointmentId);
    try {
      const response = await authFetch(`/api/patient-visits/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to move to trash");
      await fetchAppointments();
      toast({ title: "Success", description: "Visit moved to trash." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (appointmentId: string) => {
    if (!token) return;
    setProcessingId(appointmentId);
    try {
      const response = await authFetch(
        `/api/patient-visits/${appointmentId}/restore`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to restore");
      await fetchAppointments();
      toast({ title: "Success", description: "Visit restored." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (appointmentId: string) => {
    if (!token) return;
    setProcessingId(appointmentId);
    try {
      const response = await authFetch(
        `/api/patient-visits/${appointmentId}/permanent`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to permanently delete");
      await fetchAppointments();
      toast({
        title: "Success",
        description: "Visit permanently deleted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const url = selectedAppointment
        ? `/api/patient-visits/${selectedAppointment._id}`
        : "/api/patient-visits";
      const method = selectedAppointment ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAppointment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save visit.");
      }

      toast({
        title: "Success",
        description: `Visit ${
          selectedAppointment ? "updated" : "created"
        } successfully.`,
      });
      setIsUpsertDialogOpen(false);
      await fetchAppointments();
      await fetchSupportingData();
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDoctorFilter(user?.role === "doctor" ? user._id : "all");
    setServiceFilter("all");
    setDateRange(undefined);
    setShowDeleted(false);
  };

  const handleTodaysAppointmentsClick = () => {
    const today = new Date();
    setDateRange({ from: today, to: today });
  };

  const formatTime12h = (time24: string | undefined) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${String(h).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        // Filter by deletion status
        if (showDeleted) {
          if (!appointment.deletedAt) return false;
        } else {
          if (appointment.deletedAt) return false;
        }

        const searchMatch =
          !searchTerm ||
          appointment.patientName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          appointment.patientPhone
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          appointment.doctor.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMatch =
          statusFilter === "all" || appointment.status === statusFilter;
        const doctorMatch =
          doctorFilter === "all" || appointment.doctorId._id === doctorFilter;
        const serviceMatch =
          serviceFilter === "all" ||
          appointment.serviceId._id === serviceFilter;

        let dateMatch = true;
        if (dateRange?.from) {
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);

          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);

          if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(0, 0, 0, 0);
            dateMatch =
              appointmentDate >= fromDate && appointmentDate <= toDate;
          } else {
            dateMatch = appointmentDate.getTime() === fromDate.getTime();
          }
        }

        return (
          searchMatch && statusMatch && doctorMatch && serviceMatch && dateMatch
        );
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return sortOrder === "asc"
          ? dateTimeA - dateTimeB
          : dateTimeB - dateTimeA;
      });
  }, [
    appointments,
    showDeleted,
    searchTerm,
    statusFilter,
    doctorFilter,
    serviceFilter,
    dateRange,
    sortOrder,
  ]);

  const getPatientForAppointment = (appointmentId: string) => {
    const appointment = appointments.find((a) => a._id === appointmentId);
    if (!appointment) return null;
    return appointment.patientId;
  };

  const getPatientHistory = (patientId: string | undefined) => {
    if (!patientId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patientAppointments = appointments
      .filter((app) => app.patientId?._id === patientId)
      .sort(
        (a, b) =>
          new Date(`${b.date}T${b.time}`).getTime() -
          new Date(`${a.date}T${a.time}`).getTime()
      );

    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    for (const app of patientAppointments) {
      if (app._id === selectedAppointment?._id) continue;
      const appDate = new Date(`${app.date}T00:00:00`);
      if (appDate >= today) {
        upcoming.push(app);
      } else {
        past.push(app);
      }
    }

    if (upcoming.length > 0 || past.length > 0) {
      return { upcoming, past };
    }
    return null;
  };

  const patientHistory = isViewDialogOpen
    ? getPatientHistory(selectedAppointment?.patientId?._id)
    : null;
  const currentPatient = selectedAppointment
    ? selectedAppointment.patientId
    : null;

  const bookedSlots = useMemo(() => {
    if (!editingAppointment?.date || !editingAppointment?.doctorId)
      return new Set<string>();

    return new Set(
      appointments
        .filter(
          (app) =>
            app.date === editingAppointment.date &&
            app.doctorId === editingAppointment.doctorId &&
            app._id !== editingAppointment._id
        )
        .map((app) => app.time)
    );
  }, [
    appointments,
    editingAppointment.date,
    editingAppointment.doctorId,
    editingAppointment._id,
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            {/* <div className="grid grid-cols-2 gap-4"> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                required
                value={newCustomer.contact}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, contact: e.target.value }))
                }
              />
            </div>
            {/* <div className="grid grid-cols-2 gap-4"> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newCustomer.age}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, age: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newCustomer.gender}
                  onValueChange={(value) =>
                    setNewCustomer((p) => ({ ...p, gender: value }))
                  }
                >
                  <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveCustomer}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUpsertDialogOpen}
        onOpenChange={(isOpen) => {
          setIsUpsertDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedAppointment(null);
            setEditingAppointment({});
          }
        }}
      >
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {selectedAppointment ? "Edit Visit" : "New Visit"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment
                ? `Update visit for ${editingAppointment.firstName} ${editingAppointment.lastName}.`
                : "Fill in patient and visit details."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form
              id="appointment-form"
              onSubmit={handleSaveAppointment}
              className="px-6 py-4 grid gap-6"
            >
              <h4 className="font-semibold text-base border-b pb-2">
                Patient Selection
              </h4>
              {!selectedAppointment && (
                <div className="flex items-center gap-2">
                  <SearchableSelect
                    options={[
                      ...patients.map((p) => ({
                        value: p._id,
                        label: `${p.firstName} ${p.lastName} (${p.contact})`,
                      })),
                    ]}
                    value={editingAppointment.patientId || ""}
                    onValueChange={(value) => {
                      setEditingAppointment((prev) => ({
                        ...prev,
                        patientId: value,
                      }));
                    }}
                    placeholder="Select Patient..."
                    searchPlaceholder="Search patients..."
                    emptyText="No patients found."
                    className="flex-1 text-xs"
                    onSearchChange={async (search) => {
                      try {
                        const params = new URLSearchParams({
                          page: "1",
                          limit: "100",
                          search,
                        });
                        const response = await authFetch(
                          `/api/patients?${params}`
                        );
                        const result = await response.json();
                        if (result.success && Array.isArray(result.data)) {
                          return result.data.filter(
                            (c: Customer) => !c.deletedAt
                          );
                        }
                        return [];
                      } catch (error) {
                        return [];
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <h4 className="font-semibold text-base border-b pb-2 pt-4">
                Visit Details
              </h4>

              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  name="serviceId"
                  required
                  value={editingAppointment?.serviceId}
                  onValueChange={(value) => {
                    setEditingAppointment((p) => ({
                      ...p,
                      serviceId: value,
                      doctorId: "",
                      time: "",
                    }));
                    fetchDoctorsByService(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service._id} value={service._id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  name="doctorId"
                  required
                  value={editingAppointment?.doctorId}
                  onValueChange={(value) => {
                    setEditingAppointment((p) => ({
                      ...p,
                      doctorId: value,
                      time: "",
                    }));
                    if (value && editingAppointment?.date) {
                      fetchAvailableSlots(value, editingAppointment.date);
                    }
                  }}
                  disabled={!editingAppointment?.serviceId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        editingAppointment?.serviceId
                          ? "Select doctor"
                          : "Select service first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="grid grid-cols-2 gap-4"> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={editingAppointment?.date ?? ""}
                    onChange={(e) => {
                      setEditingAppointment((p) => ({
                        ...p,
                        date: e.target.value,
                        time: "",
                      }));
                      if (e.target.value && editingAppointment?.doctorId) {
                        fetchAvailableSlots(
                          editingAppointment.doctorId,
                          e.target.value
                        );
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select
                    name="time"
                    required
                    value={editingAppointment?.time}
                    onValueChange={(value) =>
                      setEditingAppointment((p) => ({ ...p, time: value }))
                    }
                    disabled={
                      !editingAppointment.date ||
                      !editingAppointment.doctorId ||
                      (!selectedAppointment && !editingAppointment.patientId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !editingAppointment.date ||
                          !editingAppointment.doctorId
                            ? "Select doctor and date first"
                            : "Select a time slot"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => {
                        const slotInfo = slotsWithCapacity.find(
                          (s) => s.time === slot
                        );
                        const available = slotInfo?.available || 0;
                        return (
                          <SelectItem key={slot} value={slot}>
                            {formatTime12h(slot)} ({available} available)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedAppointment && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    value={editingAppointment?.status}
                    onValueChange={(value) =>
                      setEditingAppointment((p) => ({
                        ...p,
                        status: value as Appointment["status"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <MagicTextarea
                  id="notes"
                  name="notes"
                  value={editingAppointment?.notes || ""}
                  onValueChange={(newValue) =>
                    setEditingAppointment((p) => ({ ...p, notes: newValue }))
                  }
                  placeholder="Add any relevant notes..."
                  aiContext="notes for a medical appointment"
                />
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="appointment-form"
              disabled={
                isSaving ||
                (!selectedAppointment && !editingAppointment.patientId)
              }
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving
                ? "Saving..."
                : selectedAppointment
                ? "Save changes"
                : "Schedule Visit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog
        open={isPatientDetailsDialogOpen}
        onOpenChange={setIsPatientDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Complete patient information and details.
            </DialogDescription>
          </DialogHeader>
          {selectedPatientForDetails && (
            <div className="grid gap-4 py-6 px-6">
              {/* <div className="grid grid-cols-2 gap-4"> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </Label>
                  <p className="text-sm">
                    {selectedPatientForDetails.firstName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  <p className="text-sm">
                    {selectedPatientForDetails.lastName}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Contact Number
                </Label>
                <p className="text-sm">{selectedPatientForDetails.contact}</p>
              </div>
              {/* <div className="grid grid-cols-2 gap-4"> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Age
                  </Label>
                  <p className="text-sm">
                    {selectedPatientForDetails.age || "Not specified"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </Label>
                  <p className="text-sm">
                    {selectedPatientForDetails.gender || "Not specified"}
                  </p>
                </div>
              </div>
              {selectedPatientForDetails.address && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Address
                  </Label>
                  <p className="text-sm">{selectedPatientForDetails.address}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Visit Details</DialogTitle>
            <DialogDescription>
              Full details for the selected visit and patient history.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && currentPatient && (
            <ScrollArea className="max-h-[60vh] pr-6">
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">Patient:</p>
                  <p className="col-span-2">{`${currentPatient.firstName} ${currentPatient.lastName}`}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">Contact:</p>
                  <p className="col-span-2">{currentPatient.contact}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">Service:</p>
                  <p className="col-span-2">
                    {selectedAppointment.serviceId?.name || "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">Doctor:</p>
                  <p className="col-span-2">
                    {selectedAppointment.doctorId?.name || "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">
                    Date & Time:
                  </p>
                  <p className="col-span-2">{`${format(
                    new Date(selectedAppointment.date),
                    "PPP"
                  )} at ${formatTime12h(selectedAppointment.time)}`}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <p className="font-medium text-muted-foreground">Status:</p>
                  <p className="col-span-2">{selectedAppointment.status}</p>
                </div>
                {selectedAppointment.notes && (
                  <div className="grid grid-cols-3 items-start gap-4">
                    <p className="font-medium text-muted-foreground">Notes:</p>
                    <p className="col-span-2 whitespace-pre-wrap">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {patientHistory && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base mb-2">
                      Patient History
                    </h3>
                    {patientHistory.upcoming.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-muted-foreground">
                          Upcoming Visits
                        </h4>
                        <div className="space-y-2">
                          {patientHistory.upcoming.map((app) => (
                            <div
                              key={app._id}
                              className="text-xs p-2 rounded-md border bg-muted/50"
                            >
                              <p className="font-semibold">{`${format(
                                new Date(app.date),
                                "PPP"
                              )} at ${formatTime12h(app.time)}`}</p>
                              <p className="text-muted-foreground">
                                {app.serviceId?.name} with {app.doctorId?.name}
                              </p>
                              <p className="text-muted-foreground capitalize">
                                Status: {app.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {patientHistory.past.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 text-muted-foreground">
                          Past Visits
                        </h4>
                        <div className="space-y-2">
                          {patientHistory.past.map((app) => (
                            <div
                              key={app._id}
                              className="text-xs p-2 rounded-md border bg-muted/50"
                            >
                              <p className="font-semibold">{`${format(
                                new Date(app.date),
                                "PPP"
                              )} at ${formatTime12h(app.time)}`}</p>
                              <p className="text-muted-foreground">
                                {app.serviceId?.name} with {app.doctorId?.name}
                              </p>
                              <p className="text-muted-foreground capitalize">
                                Status: {app.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </ScrollArea>
          )}
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
                Patient Visits
              </h1>
              <p className="text-slate-100 text-sm">
                Manage and track patient visits
              </p>
            </div>
            {can("edit", pathname) && (
              <Button
                onClick={handleAddNewClick}
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Visit
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
      </div>
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Visit List
          </CardTitle>
          <CardDescription>
            A comprehensive list of all patient visits
          </CardDescription>
          <div className="pt-4 space-y-4">
            <Input
              placeholder="Search by patient name, contact, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex flex-wrap items-center gap-4 w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={doctorFilter}
                onValueChange={setDoctorFilter}
                disabled={user?.role === "doctor"}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by doctor" />
                </SelectTrigger>
                <SelectContent>
                  {user?.role !== "doctor" && (
                    <SelectItem value="all">All Doctors</SelectItem>
                  )}
                  {Array.from(uniqueDoctorIds.entries()).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {Array.from(uniqueServiceIds.entries()).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-deleted"
                  checked={showDeleted}
                  onCheckedChange={setShowDeleted}
                />
                <Label htmlFor="show-deleted">Show Deleted</Label>
              </div>
              <Button variant="outline" onClick={handleTodaysAppointmentsClick}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Today's
              </Button>
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-9 px-4"
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Booking Date
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                  >
                    Visit Date & Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const isOrphan = !appointment.patientId;
                  const isProcessing = processingId === appointment._id;
                  return (
                    <TableRow
                      key={appointment._id}
                      className={cn(
                        appointment.deletedAt &&
                          "bg-muted/50 text-muted-foreground",
                        isOrphan && "bg-destructive/10"
                      )}
                    >
                      <TableCell className="font-medium">
                        {appointment.patientId ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left justify-start hover:text-primary"
                            onClick={() =>
                              handlePatientNameClick(appointment.patientId)
                            }
                          >
                            <User className="mr-2 h-4 w-4" />
                            {appointment.patientName}
                          </Button>
                        ) : (
                          <span className="text-destructive font-semibold">
                            Orphaned Record
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {appointment.patientPhone || "N/A"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {appointment.createdAt
                          ? format(
                              new Date(appointment.createdAt),
                              "MMM dd, yyyy 'at' h:mm a"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {format(new Date(appointment.date), "MMM dd, yyyy")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime12h(appointment.time)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.serviceId?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {appointment.doctorId?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={appointment.status}
                          onValueChange={(value: Appointment["status"]) =>
                            handleStatusChange(appointment._id, value)
                          }
                          disabled={
                            isOrphan ||
                            updatingStatusId === appointment._id ||
                            !!appointment.deletedAt ||
                            !can("edit", pathname)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-[120px] capitalize",
                              !appointment.deletedAt &&
                                appointment.status === "Confirmed" &&
                                "text-green-600 border-green-200 focus:ring-green-500",
                              !appointment.deletedAt &&
                                appointment.status === "Pending" &&
                                "text-yellow-600 border-yellow-200 focus:ring-yellow-500",
                              !appointment.deletedAt &&
                                appointment.status === "Cancelled" &&
                                "text-red-600 border-red-200 focus:ring-red-500",
                              !appointment.deletedAt &&
                                appointment.status === "Completed" &&
                                "text-blue-600 border-blue-200 focus:ring-blue-500"
                            )}
                          >
                            {updatingStatusId === appointment._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {appointment.deletedAt ? (
                              <>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRestore(appointment._id)
                                    }
                                    disabled={isProcessing}
                                  >
                                    <Undo className="mr-2 h-4 w-4" /> Restore
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative"
                                          disabled={isProcessing}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete Permanently
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you absolutely sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This
                                            will permanently delete the
                                            visit.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handlePermanentDelete(
                                                appointment._id
                                              )
                                            }
                                            className={cn(
                                              buttonVariants({
                                                variant: "destructive",
                                              })
                                            )}
                                          >
                                            Yes, delete permanently
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </>
                            ) : isOrphan ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative"
                                    disabled={isProcessing}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    Permanently
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Orphaned Record?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This visit record is orphaned (the
                                      patient may have been deleted). This will
                                      permanently delete the visit. This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handlePermanentDelete(appointment._id)
                                      }
                                      className={cn(
                                        buttonVariants({
                                          variant: "destructive",
                                        })
                                      )}
                                    >
                                      Yes, delete permanently
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleViewClick(appointment)}
                                  disabled={isProcessing}
                                >
                                  <FileText className="mr-2 h-4 w-4" /> View
                                  Details
                                </DropdownMenuItem>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() => handleEditClick(appointment)}
                                    disabled={isProcessing}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative"
                                          disabled={isProcessing}
                                        >
                                          <Trash className="mr-2 h-4 w-4" />{" "}
                                          Move to Trash
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Move to Trash?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will move the visit to
                                            the trash. You can restore it later.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleSoftDelete(appointment._id)
                                            }
                                          >
                                            Move to Trash
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No visits found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
