"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ClipboardList,
  Video,
  PlayCircle,
  Copy,
  Check,
  ExternalLink,
  Ban,
} from "lucide-react";
import { useMeeting } from "@/components/providers/MeetingProvider";
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
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { TimeLockLayout } from "@/components/TimeLockLayout";
import { API_BASE_URL } from "@/config/api";

type EditingAppointment = Partial<Appointment & Patient> & {
  firstName?: string;
  lastName?: string;
  type?: 'online' | 'offline';
};

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contact: string;
  deletedAt?: string | null;
}

export default function AppointmentsPage() {
  const { user, token, authFetch } = useAuth();
  const { joinMeeting, activeMeetingId } = useMeeting();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = (linkId: string) => {
    const url = `${window.location.origin}/meet/${linkId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast({
      title: "Link Copied",
      description: "Patient meeting link copied to clipboard",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };
  const { can } = usePermission();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Get pagination params from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [bookingSortOrder, setBookingSortOrder] = useState<"asc" | "desc">("desc");

  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPatientDetailsDialogOpen, setIsPatientDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<any>(null);
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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(doctorFilter !== "all" && { doctorId: doctorFilter }),
        ...(serviceFilter !== "all" && { serviceId: serviceFilter }),
        ...(dateRange?.from && { startDate: dateRange.from.toISOString().split('T')[0] }),
        ...(dateRange?.to && { endDate: dateRange.to.toISOString().split('T')[0] }),
        showDeleted: showDeleted.toString(),
        _t: Date.now().toString()
      });

      const response = await authFetch(`/api/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setAppointments(result.data);
        setTotalCount(result.totalCountByFilter?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else if (Array.isArray(result)) {
        setAppointments(result);
        setTotalCount(result.length);
      } else {
        setAppointments([]);
        setTotalCount(0);
      }
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load appointments.",
        });
      }
    }
  }, [token, toast, authFetch, searchTerm, statusFilter, doctorFilter, serviceFilter, dateRange, showDeleted, currentPage, limit]);

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

  const fetchDoctorsByService = useCallback(async (serviceId: string) => {
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
  }, [token, toast, authFetch]);

  const fetchAvailableSlots = useCallback(async (doctorId: string, date: string) => {
    if (!token || !doctorId || !date) return;
    try {
      const response = await authFetch(`/api/timeslots/availability/${doctorId}/${date}`);
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
  }, [token, toast, authFetch]);

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
      Promise.all([fetchAppointments(), fetchSupportingData(), fetchPatients()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [token, fetchAppointments, fetchSupportingData, fetchPatients]);

  // Auto-refresh when a meeting ends
  const prevMeetingIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevMeetingIdRef.current && !activeMeetingId) {
      fetchAppointments();
    }
    prevMeetingIdRef.current = activeMeetingId;
  }, [activeMeetingId, fetchAppointments]);

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [searchTerm, statusFilter, doctorFilter, serviceFilter, dateRange, showDeleted, currentPage, limit, fetchAppointments]);

  useEffect(() => {
    if (user && user.role === "doctor") {
      setDoctorFilter(user._id);
    }
  }, [user]);



  const uniqueDoctorIds = useMemo(() => {
    const doctorMap = new Map<string, string>();
    appointments.forEach(app => {
      if (typeof app.doctorId === 'object' && app.doctorId?._id && app.doctorId?.name) {
        doctorMap.set(app.doctorId._id, app.doctorId.name);
      }
    });
    return doctorMap;
  }, [appointments]);

  const uniqueServiceIds = useMemo(() => {
    const serviceMap = new Map<string, string>();
    appointments.forEach(app => {
      if (typeof app.serviceId === 'object' && app.serviceId?._id && app.serviceId?.name) {
        serviceMap.set(app.serviceId._id, app.serviceId.name);
      }
    });
    return serviceMap;
  }, [appointments]);

  const handleEditClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const patientData = appointment.patientId as any;

    // Normalize populated fields to IDs for editing
    const editingData: any = { ...appointment };
    if (typeof appointment.serviceId === 'object' && appointment.serviceId) {
      editingData.serviceId = appointment.serviceId._id;
    }
    if (typeof appointment.doctorId === 'object' && appointment.doctorId) {
      editingData.doctorId = appointment.doctorId._id;
    }
    if (typeof appointment.patientId === 'object' && appointment.patientId) {
      editingData.patientId = appointment.patientId._id;
    }

    setEditingAppointment({ ...editingData, ...(typeof patientData === 'object' ? patientData : {}) });

    const serviceId = typeof appointment.serviceId === 'object' ? appointment.serviceId?._id : appointment.serviceId;
    if (serviceId) {
      fetchDoctorsByService(serviceId);
    }

    const doctorId = typeof appointment.doctorId === 'object' ? appointment.doctorId?._id : appointment.doctorId;
    if (doctorId && appointment.date) {
      fetchAvailableSlots(doctorId, appointment.date);
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

  const handlePrescriptionClick = (appointment: Appointment) => {
    if (appointment._id) {
      router.push(`/dashboard/digitalPrescription?appointmentId=${appointment._id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Appointment information not available.",
      });
    }
  };

  const handleAddNewClick = () => {
    setSelectedAppointment(null);
    setEditingAppointment({
      status: "Confirmed",
      date: new Date().toISOString().split("T")[0],
      type: 'offline',
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
        setEditingAppointment(prev => ({ ...prev, patientId: result.data._id }));
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
      const response = await authFetch(`/api/appointments/${appointmentId}`, {
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

      toast({ title: "Success", description: "Appointment status updated." });
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
      const response = await authFetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to move to trash");
      toast({ title: "Success", description: "Appointment moved to trash." });
      await fetchAppointments();
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
        `/api/appointments/${appointmentId}/restore`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to restore");
      await fetchAppointments();
      toast({ title: "Success", description: "Appointment restored." });
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
        `/api/appointments/${appointmentId}/permanent`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to permanently delete");
      await fetchAppointments();
      toast({
        title: "Success",
        description: "Appointment permanently deleted.",
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
        ? `/api/appointments/${selectedAppointment._id}`
        : "/api/appointments";
      const method = selectedAppointment ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAppointment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save appointment.");
      }

      toast({
        title: "Success",
        description: `Appointment ${selectedAppointment ? "updated" : "created"
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
    return appointments.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      const bookingA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bookingB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      // Sort by booking date if different, otherwise by appointment date
      if (bookingA !== bookingB) {
        return bookingSortOrder === "asc" ? bookingA - bookingB : bookingB - bookingA;
      }
      return sortOrder === "asc" ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
    });
  }, [appointments, sortOrder, bookingSortOrder]);


  const getPatientHistory = (patientId: string | undefined) => {
    if (!patientId) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patientAppointments = appointments
      .filter((app) => {
        const pId = typeof app.patientId === 'object' ? app.patientId?._id : app.patientId;
        return pId === patientId;
      })
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
    ? getPatientHistory(
      typeof selectedAppointment?.patientId === 'object'
        ? selectedAppointment?.patientId?._id
        : selectedAppointment?.patientId
    )
    : null;
  const currentPatient = selectedAppointment && typeof selectedAppointment.patientId === 'object'
    ? selectedAppointment.patientId
    : null;




  return (
    <TimeLockLayout apiEndpoint={`${API_BASE_URL}/api/settings/access-time?key=appointments_access_time`}>
      <div className="space-y-4 sm:space-y-8 animate-fade-in w-full max-w-7xl mx-auto">
        {/* Customer Dialog - Made responsive */}
        <Dialog
          open={isCustomerDialogOpen}
          onOpenChange={setIsCustomerDialogOpen}
        >
          <DialogContent className="w-full max-w-[95vw] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" onClick={handleSaveCustomer} className="w-full sm:w-auto">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upsert Dialog - Made responsive */}
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
          <DialogContent className="w-full max-w-[95vw] sm:max-w-lg mx-auto p-0 sm:p-6 flex flex-col max-h-[90vh] sm:max-h-[90vh]">
            <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
              <DialogTitle className="text-lg sm:text-xl">
                {selectedAppointment ? "Edit Appointment" : "New Appointment"}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedAppointment
                  ? `Update appointment for ${editingAppointment.firstName} ${editingAppointment.lastName}.`
                  : "Create a new appointment."}
              </DialogDescription>
            </DialogHeader>
            <form
              id="appointment-form"
              onSubmit={(e) => handleSaveAppointment(e as any)}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid gap-4 py-4">
                  {/* Consultation Type Selector - Visible for both new and edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="appType">Consultation Type</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div
                          className={cn(
                            "flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all",
                            editingAppointment.type === 'online'
                              ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-1"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setEditingAppointment(prev => ({ ...prev, type: 'online' }))}
                        >
                          <span className="text-sm font-medium">Online Video Call</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all",
                            (!editingAppointment.type || editingAppointment.type === 'offline')
                              ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-1"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => setEditingAppointment(prev => ({ ...prev, type: 'offline' }))}
                        >
                          <span className="text-sm font-medium">In-Clinic Visit</span>
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Patient *</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchableSelect
                            value={(editingAppointment.patientId as string) || ""}
                            onValueChange={(value) =>
                              setEditingAppointment({
                                ...editingAppointment,
                                patientId: value,
                              })
                            }
                            options={patients.map((p) => ({
                              value: p._id,
                              label: `${p.firstName} ${p.lastName} (${p.contact})`,
                            }))}
                            placeholder="Select Patient"
                            onSearchChange={fetchPatients}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setIsCustomerDialogOpen(true)}
                          title="Add New Patient"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm sm:text-base border-b pb-2 pt-4">
                    Appointment Details
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-sm sm:text-base">Service</Label>
                    <Select
                      name="serviceId"
                      required
                      value={editingAppointment?.serviceId as string}
                      onValueChange={(value) => {
                        setEditingAppointment((p) => ({ ...p, serviceId: value, doctorId: "", time: "" }));
                        fetchDoctorsByService(value);
                      }}
                    >
                      <SelectTrigger className="text-sm sm:text-base">
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
                    <Label htmlFor="doctor" className="text-sm sm:text-base">Doctor</Label>
                    <Select
                      name="doctorId"
                      required
                      value={editingAppointment?.doctorId as string}
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
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder={editingAppointment?.serviceId ? "Select doctor" : "Select service first"} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm sm:text-base">Date</Label>
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
                            fetchAvailableSlots(editingAppointment.doctorId as string, e.target.value);
                          }
                        }}
                        required
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm sm:text-base">Time</Label>
                      <Select
                        name="time"
                        required
                        value={editingAppointment?.time}
                        onValueChange={(value) =>
                          setEditingAppointment((p) => ({ ...p, time: value }))
                        }
                        disabled={
                          !editingAppointment.date || !editingAppointment.doctorId || (!selectedAppointment && !editingAppointment.patientId)
                        }
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder={!editingAppointment.date || !editingAppointment.doctorId ? "Select doctor and date first" : "Select a time slot"} />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => {
                            const slotInfo = slotsWithCapacity.find(s => s.time === slot);
                            const available = slotInfo?.available || 0;
                            return (
                              <SelectItem
                                key={slot}
                                value={slot}
                              >
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
                      <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
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
                        <SelectTrigger className="text-sm sm:text-base">
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
                  {/* Removed redundant Appointment Type select */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm sm:text-base">Notes</Label>
                    <MagicTextarea
                      id="notes"
                      name="notes"
                      value={editingAppointment?.notes || ""}
                      onValueChange={(newValue) =>
                        setEditingAppointment((p) => ({ ...p, notes: newValue }))
                      }
                      placeholder="Add any relevant notes..."
                      aiContext="notes for a medical appointment"
                      className="min-h-[100px] text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </form>
            <DialogFooter className="p-4 sm:p-6 pt-4 border-t flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="appointment-form"
                disabled={isSaving || (!selectedAppointment && !editingAppointment.patientId)}
                className="w-full sm:w-auto"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving
                  ? "Saving..."
                  : selectedAppointment
                    ? "Save changes"
                    : "Schedule Appointment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Patient Details Dialog */}
        <Dialog open={isPatientDetailsDialogOpen} onOpenChange={setIsPatientDetailsDialogOpen}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Patient Details</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Complete patient information and details.
              </DialogDescription>
            </DialogHeader>
            {selectedPatientForDetails && (
              <div className="grid gap-3 sm:gap-4 py-4 sm:py-6 px-2 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    <p className="text-sm">{selectedPatientForDetails.firstName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    <p className="text-sm">{selectedPatientForDetails.lastName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
                  <p className="text-sm">{selectedPatientForDetails.contact}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-sm">{selectedPatientForDetails.age || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-sm">{selectedPatientForDetails.gender || 'Not specified'}</p>
                  </div>
                </div>
                {selectedPatientForDetails.address && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-sm">{selectedPatientForDetails.address}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-full sm:w-auto">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Appointment Details</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Full details for the selected appointment and patient history.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && currentPatient && (
              <ScrollArea className="max-h-[60vh] pr-2 sm:pr-6">
                <div className="grid gap-3 sm:gap-4 py-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">Patient:</p>
                    <p className="sm:col-span-2">{`${currentPatient.firstName} ${currentPatient.lastName}`}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">Contact:</p>
                    <p className="sm:col-span-2">{currentPatient.contact}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">Service:</p>
                    <p className="sm:col-span-2">
                      {typeof selectedAppointment.serviceId === 'object' ? selectedAppointment.serviceId?.name : "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">Doctor:</p>
                    <p className="sm:col-span-2">
                      {typeof selectedAppointment.doctorId === 'object' ? selectedAppointment.doctorId?.name : "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">
                      Date & Time:
                    </p>
                    <p className="sm:col-span-2">{`${format(
                      new Date(selectedAppointment.date),
                      "PPP"
                    )} at ${formatTime12h(selectedAppointment.time)}`}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                    <p className="font-medium text-muted-foreground">Status:</p>
                    <p className="sm:col-span-2">{selectedAppointment.status}</p>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 sm:gap-4">
                      <p className="font-medium text-muted-foreground">Notes:</p>
                      <p className="sm:col-span-2 whitespace-pre-wrap">
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
                            Upcoming Appointments
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
                                  {typeof app.serviceId === 'object' ? app.serviceId?.name : 'N/A'}{" "}
                                  with{" "}
                                  {typeof app.doctorId === 'object' ? app.doctorId?.name : 'N/A'}
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
                            Past Appointments
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
                                  {typeof app.serviceId === 'object' ? app.serviceId?.name : 'N/A'}{" "}
                                  with{" "}
                                  {typeof app.doctorId === 'object' ? app.doctorId?.name : 'N/A'}
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

                {selectedAppointment.type === 'online' && selectedAppointment.meeting?.linkId && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Patient Meeting Link</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1 truncate border">
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/meet/${selectedAppointment.meeting.linkId}`}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(selectedAppointment.status)}
                          onClick={() => handleCopyLink(selectedAppointment.meeting!.linkId!)}
                          title="Copy Link"
                          className={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(selectedAppointment.status) ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(selectedAppointment.status)}
                          onClick={() => joinMeeting(selectedAppointment.meeting!.linkId!)}
                          title={['Completed', 'completed'].includes(selectedAppointment.status) ? "Meeting Expired" : "Join Meeting"}
                          className={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(selectedAppointment.status) ? "opacity-50 cursor-not-allowed" : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share this link with the patient. They can join without logging in.
                      </p>
                    </div>
                  </>
                )}
              </ScrollArea>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" className="w-full sm:w-auto">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hero Section - Made responsive */}
        < div className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 sm:p-6 text-white shadow-lg sm:shadow-2xl" >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
                  Appointments
                </h1>
                <p className="text-slate-100 text-xs sm:text-sm">
                  Manage and schedule patient appointments
                </p>
              </div>
              {can("edit", pathname) && (
                <Button
                  onClick={handleAddNewClick}
                  variant="secondary"
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">Add Appointment</span>
                </Button>
              )}
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 sm:w-40 sm:h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
        </div >

        {/* Main Card with Table */}
        < Card className="animate-slide-up w-full overflow-hidden" >
          <CardHeader className="p-2 sm:p-4 md:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Appointment List ({totalCount} total)
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              A comprehensive list of all scheduled appointments
            </CardDescription>
            <div className="pt-4 space-y-3 sm:space-y-4">
              <Input
                placeholder="Search by patient name, contact, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-full text-sm sm:text-base"
              />
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-full sm:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[300px] justify-start text-left font-normal text-sm",
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
                          <span className="text-xs sm:text-sm">Pick a date range</span>
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
                        numberOfMonths={1}
                        className="scale-90 sm:scale-100"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-full sm:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm">
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
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    value={doctorFilter}
                    onValueChange={setDoctorFilter}
                    disabled={user?.role === "doctor"}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] text-sm">
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
                </div>
                <div className="w-full sm:w-auto">
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm">
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
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Switch
                    id="show-deleted"
                    checked={showDeleted}
                    onCheckedChange={setShowDeleted}
                  />
                  <Label htmlFor="show-deleted" className="text-sm">Show Deleted</Label>
                </div>
                <Button variant="outline" onClick={handleTodaysAppointmentsClick} className="w-full sm:w-auto text-sm">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Today's
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-9 px-4 w-full sm:w-auto text-sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Patient</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm hidden md:table-cell whitespace-nowrap">Contact</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setBookingSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                          }
                          className="p-0 h-auto text-xs sm:text-sm"
                        >
                          Booking Date
                          <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                          }
                          className="p-0 h-auto text-xs sm:text-sm whitespace-nowrap"
                        >
                          Appointment Date & Time
                          <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Duration</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Service</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Doctor</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm hidden xl:table-cell whitespace-nowrap">Referred By</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                      <TableHead className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
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
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              {appointment.patientId ? (
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium text-left justify-start hover:text-primary text-xs sm:text-sm"
                                  onClick={() => typeof appointment.patientId === 'object' && handlePatientNameClick(appointment.patientId)}
                                >
                                  <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                  {appointment.patientName}
                                </Button>
                              ) : (
                                <span className="text-destructive font-semibold text-xs sm:text-sm">
                                  Orphaned Record
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-2 hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                              {appointment.patientPhone || "N/A"}
                            </TableCell>
                            <TableCell className="px-3 py-2 hidden lg:table-cell text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              {appointment.createdAt ? format(new Date(appointment.createdAt), "MMM dd, yyyy 'at' h:mm a") : "N/A"}
                            </TableCell>
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs sm:text-sm">{format(new Date(appointment.date), "MMM dd, yyyy")}</span>
                                  {appointment.type === 'online' ? (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-100">
                                      Online
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-slate-500 border-slate-200">
                                      Offline
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{formatTime12h(appointment.time)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                              {appointment.type === 'online' && appointment.meeting?.duration
                                ? `${appointment.meeting.duration} mins`
                                : "-"}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{typeof appointment.serviceId === 'object' ? appointment.serviceId?.name : "N/A"}</TableCell>
                            <TableCell className="px-3 py-2 text-xs sm:text-sm whitespace-nowrap">{typeof appointment.doctorId === 'object' ? appointment.doctorId?.name : "N/A"}</TableCell>
                            <TableCell className="px-3 py-2 hidden xl:table-cell text-xs whitespace-nowrap">
                              {(typeof appointment.referedBy === 'object' && appointment.referedBy?.name) ? `${appointment.referedBy.name}` : "Clinic"}
                            </TableCell>
                            <TableCell className="px-3 py-2 whitespace-nowrap">
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
                                    "w-full min-w-[100px] sm:w-[120px] capitalize text-xs sm:text-sm",
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
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
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
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {appointment.type === 'online' && !appointment.deletedAt && !isOrphan && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-sm border-0 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    disabled={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(appointment.status)}
                                    onClick={() => {
                                      const linkId = typeof appointment.meeting === 'object' && appointment.meeting?.linkId ? appointment.meeting.linkId : appointment._id;
                                      joinMeeting(linkId);
                                    }}
                                  >
                                    <Video className="mr-1 h-3 w-3" />
                                    {['Completed', 'completed', 'Cancelled', 'cancelled'].includes(appointment.status) ? 'Expired' : 'Join'}
                                  </Button>
                                )}
                                {!appointment.deletedAt && !isOrphan && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePrescriptionClick(appointment)}
                                    disabled={isProcessing || !appointment.patientId || (typeof appointment.patientId === 'object' && !appointment.patientId._id)}
                                    className="h-8 text-xs"
                                  >
                                    <ClipboardList className="mr-1 h-3 w-3" />
                                    Prescription
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                      disabled={isProcessing}
                                      className="h-8 w-8 sm:h-10 sm:w-10"
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                      )}
                                      <span className="sr-only">Toggle menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs sm:text-sm">Actions</DropdownMenuLabel>
                                    {appointment.deletedAt ? (
                                      <>
                                        {can("edit", pathname) && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleRestore(appointment._id)
                                            }
                                            disabled={isProcessing}
                                            className="text-xs sm:text-sm"
                                          >
                                            <Undo className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Restore
                                          </DropdownMenuItem>
                                        )}
                                        {can("delete", pathname) && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-xs h-auto font-normal relative"
                                                  disabled={isProcessing}
                                                >
                                                  <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                                                  Delete Permanently
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle className="text-lg sm:text-xl">
                                                    Are you absolutely sure?
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription className="text-sm sm:text-base">
                                                    This action cannot be undone. This
                                                    will permanently delete the
                                                    appointment.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                  <AlertDialogCancel className="w-full sm:w-auto mt-0">
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
                                                      }),
                                                      "w-full sm:w-auto"
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
                                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-xs h-auto font-normal relative"
                                            disabled={isProcessing}
                                          >
                                            <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Delete
                                            Permanently
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="text-lg sm:text-xl">
                                              Delete Orphaned Record?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-sm sm:text-base">
                                              This appointment record is orphaned (the
                                              patient may have been deleted). This will
                                              permanently delete the appointment. This
                                              action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                            <AlertDialogCancel className="w-full sm:w-auto mt-0">
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handlePermanentDelete(appointment._id)
                                              }
                                              className={cn(
                                                buttonVariants({
                                                  variant: "destructive",
                                                }),
                                                "w-full sm:w-auto"
                                              )}
                                            >
                                              Yes, delete permanently
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    ) : (
                                      <>
                                        {can("edit", pathname) && appointment.type === 'online' && appointment.status !== 'Completed' && appointment.status !== 'Cancelled' && (
                                          <DropdownMenuItem
                                            onClick={() => handleStatusChange(appointment._id, 'Completed')}
                                            disabled={isProcessing}
                                            className="text-xs sm:text-sm text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                                          >
                                            <Ban className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Expire Link
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => handleViewClick(appointment)}
                                          disabled={isProcessing}
                                          className="text-xs sm:text-sm"
                                        >
                                          <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> View
                                          Details
                                        </DropdownMenuItem>
                                        {can("edit", pathname) && (
                                          <DropdownMenuItem
                                            onClick={() => handleEditClick(appointment)}
                                            disabled={isProcessing}
                                            className="text-xs sm:text-sm"
                                          >
                                            <Edit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Edit
                                          </DropdownMenuItem>
                                        )}
                                        {can("delete", pathname) && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-xs h-auto font-normal relative"
                                                  disabled={isProcessing}
                                                >
                                                  <Trash className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />{" "}
                                                  Move to Trash
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle className="text-lg sm:text-xl">
                                                    Move to Trash?
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription className="text-sm sm:text-base">
                                                    This will move the appointment to
                                                    the trash. You can restore it later.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                  <AlertDialogCancel className="w-full sm:w-auto mt-0">
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() =>
                                                      handleSoftDelete(appointment._id)
                                                    }
                                                    className="w-full sm:w-auto"
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
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-sm sm:text-base">
                          No appointments found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
          {
            totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t">
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  limit={limit}
                  totalItems={totalCount}
                />
              </div>
            )
          }
        </Card >
      </div >
    </TimeLockLayout >
  );
}




