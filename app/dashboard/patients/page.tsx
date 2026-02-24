
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Appointment,
  BloodReport,
  ManagedUser,
  Patient,
  Prescription,
  Service
} from '@/lib/data';
import { Search, PlusCircle, Loader2, Users2, UserPlus, Trash, Undo, Trash2, MoreHorizontal, Eye, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { usePermission } from '@/hooks/use-permission';
import { usePathname } from 'next/navigation';


export default function PatientsPage() {
  const { token, authFetch } = useAuth();
  const { toast } = useToast();
  const { can } = usePermission();
  const pathname = usePathname();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bloodReports, setBloodReports] = useState<BloodReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [ageRange, setAgeRange] = useState('all');

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalPatients, setTotalPatients] = useState(0);
  const itemsPerPage = 30;
  
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [isViewPatientDialogOpen, setIsViewPatientDialogOpen] = useState(false);
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment>>({});
  const [editingPatient, setEditingPatient] = useState<Partial<Patient>>({});
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsWithCapacity, setSlotsWithCapacity] = useState<any[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  const fetchPatients = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(genderFilter && genderFilter !== 'all' && { gender: genderFilter }),
        ...(ageMin && { ageMin }),
        ...(ageMax && { ageMax }),

        sortBy,
        sortOrder,
      });
      
      const patientsRes = await authFetch(`/api/patients?${params}`);
      if (!patientsRes.ok) throw new Error('Failed to fetch patients');
      
      const patientsData = await patientsRes.json();
      setPatients(patientsData.data || []);
      setTotalPatients(patientsData.pagination?.totalItems || 0);
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load patients.' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, authFetch, currentPage, searchTerm, genderFilter, ageMin, ageMax, sortBy, sortOrder]);

  const fetchDoctorsByService = useCallback(async (serviceId: string) => {
    if (!token || !serviceId) return;
    try {
      const response = await authFetch(`/api/services/${serviceId}/doctors`);
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const doctorsData = await response.json();
      setDoctors(doctorsData);
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load doctors for this service.' });
      }
    }
  }, [token, toast, authFetch]);

  const fetchAvailableSlots = useCallback(async (doctorId: string, date: string) => {
    if (!token || !doctorId || !date) return;
    try {
      const response = await authFetch(`/api/timeslots/availability/${doctorId}/${date}`);
      if (!response.ok) throw new Error('Failed to fetch available slots');
      const data = await response.json();
      if (data.success) {
        setTimeSlots(data.data.availableSlots || []);
        setSlotsWithCapacity(data.data.slotsWithCapacity || []);
      }
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load available time slots.' });
      }
    }
  }, [token, toast, authFetch]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [appsRes, servRes, bloodReportsRes, prescriptionsRes, slotsRes] = await Promise.all([
        authFetch('/api/appointments'),
        authFetch('/api/services'),
        authFetch('/api/blood-reports'),
        authFetch('/api/prescriptions'),
        authFetch('/api/timeslots?source=master')
      ]);
      if (!appsRes.ok || !servRes.ok || !bloodReportsRes.ok || !prescriptionsRes.ok || !slotsRes.ok) throw new Error('Failed to fetch data');
      
      const appsData = await appsRes.json();
      const servData = await servRes.json();
      let bloodReportsData = await bloodReportsRes.json();
      let prescriptionsData = await prescriptionsRes.json();
      // Defensive: ensure arrays
      if (!Array.isArray(bloodReportsData)) {
        bloodReportsData = bloodReportsData?.bloodReports || [];
      }
      if (!Array.isArray(prescriptionsData)) {
        prescriptionsData = prescriptionsData?.prescriptions || [];
      }
      const slotsData = await slotsRes.json();

      setAppointments(Array.isArray(appsData) ? appsData : appsData?.data || []);
      setServices(servData);
      setBloodReports(bloodReportsData);
      setPrescriptions(prescriptionsData);
      setTimeSlots(slotsData);

    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data.' });
       }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, authFetch]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token, fetchPatients]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, genderFilter, ageMin, ageMax, sortBy, sortOrder]);
  
  const totalPages = Math.ceil(totalPatients / itemsPerPage);

  const filteredPatients = useMemo(() => 
    patients
        .filter(p => {
            if(showDeleted ? !p.deletedAt : p.deletedAt) {
                return false;
            }
            return true;
        }),
    [patients, showDeleted]
  );
  
  useEffect(() => {
    if (selectedPatient) {
      const updatedPatient = patients.find(p => p._id === selectedPatient._id);
      if (updatedPatient && !updatedPatient.deletedAt) {
        setSelectedPatient(updatedPatient);
      } else {
        setSelectedPatient(null);
      }
    }
     if (showDeleted) {
        setSelectedPatient(null);
     }
  }, [patients, selectedPatient, showDeleted]);

  const handleOpenNewAppointmentDialog = () => {
    if (!selectedPatient) return;
    setEditingAppointment({
      patientId: selectedPatient._id,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAppointmentDialogOpen(true);
  }

  const handleOpenNewPatientDialog = () => {
    setEditingPatient({});
    setIsPatientDialogOpen(true);
  }

  const handleOpenViewPatientDialog = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewPatientDialogOpen(true);
  }

  const handleOpenEditPatientDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditPatientDialogOpen(true);
  }

  const handleSaveAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
        const response = await authFetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingAppointment),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save appointment.');
        }
        
        toast({ title: "Success", description: "Appointment created successfully." });
        setIsAppointmentDialogOpen(false);
        await fetchData();

    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       }
    } finally {
        setIsSaving(false);
    }
  };

  const handleSavePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const response = await authFetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPatient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create patient.');
      }
      
      toast({ title: "Success", description: "Patient created successfully." });
      setIsPatientDialogOpen(false);
      await fetchData();
      await fetchPatients();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !editingPatient._id) return;
    setIsSaving(true);
    try {
      const response = await authFetch(`/api/patients/${editingPatient._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPatient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update patient.');
      }
      
      toast({ title: "Success", description: "Patient updated successfully." });
      setIsEditPatientDialogOpen(false);
      await fetchData();
      await fetchPatients();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
      }
    } finally {
      setIsSaving(false);
    }
  };


  const formatTime12h = (time24: string | undefined) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };
  


  const { pastAppointments, upcomingAppointments } = useMemo(() => {
    if (!selectedPatient) return { pastAppointments: [], upcomingAppointments: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const patientAppointments = appointments.filter(a => a.patientId === selectedPatient._id && !a.deletedAt);

    const past: Appointment[] = [];
    const upcoming: Appointment[] = [];

    patientAppointments.forEach(app => {
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      const isPast = appDate < today;

      if(isPast){
         past.push(app);
      } else {
         upcoming.push(app);
      }
    });

    past.sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
    upcoming.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

    return { pastAppointments: past, upcomingAppointments: upcoming };
  }, [selectedPatient, appointments]);
  
  const handleAction = async (action: 'soft-delete' | 'restore' | 'permanent-delete', patientId: string) => {
    setProcessingId(patientId);
    let url = `/api/patients/${patientId}`;
    let method = 'POST';
    if(action === 'soft-delete') method = 'DELETE';
    if(action === 'restore') url += '/restore';
    if(action === 'permanent-delete') {
      url += '/permanent';
      method = 'DELETE';
    }

    try {
        const res = await authFetch(url, { method });
        if(!res.ok) throw new Error(`Failed to ${action.replace('-', ' ')} patient.`);
        toast({title: 'Success', description: 'Action completed successfully.'});
        await fetchData();
        await fetchPatients();
        setSelectedPatient(null);
    } catch(e) {
        toast({variant: 'destructive', title: 'Error', description: (e as Error).message});
    } finally {
        setProcessingId(null);
    }
  }


  return (
    <div className="space-y-8 animate-fade-in">
       <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-lg mx-auto p-0 sm:p-6 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
            <DialogTitle>New Appointment for {selectedPatient?.firstName} {selectedPatient?.lastName}</DialogTitle>
            <DialogDescription>
                Fill in the details to schedule a new appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-2 sm:px-4">
            <form id="new-appointment-form" onSubmit={handleSaveAppointment} className="px-2 sm:px-6 py-4 grid gap-4 sm:gap-6">
              <Input type="hidden" name="patientId" value={editingAppointment?.patientId ?? ''} />
              
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select name="serviceId" required value={editingAppointment.serviceId} onValueChange={(value) => {
                  setEditingAppointment(p => ({...p, serviceId: value, doctorId: '', time: ''}));
                  fetchDoctorsByService(value);
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                        {services.map(service => (
                            <SelectItem key={service._id} value={service._id}>{service.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <Label htmlFor="doctor">Doctor</Label>
                  <Select name="doctorId" required value={editingAppointment.doctorId} onValueChange={(value) => {
                    setEditingAppointment(p => ({...p, doctorId: value, time: ''}));
                    if (value && editingAppointment?.date) {
                      fetchAvailableSlots(value, editingAppointment.date);
                    }
                  }} disabled={!editingAppointment?.serviceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={editingAppointment?.serviceId ? "Select doctor" : "Select service first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => <SelectItem key={doctor._id} value={doctor._id}>{doctor.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required value={editingAppointment.date} onChange={(e) => {
                    setEditingAppointment(p => ({...p, date: e.target.value, time: ''}));
                    if (e.target.value && editingAppointment?.doctorId) {
                      fetchAvailableSlots(editingAppointment.doctorId, e.target.value);
                    }
                  }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                   <Select name="time" required value={editingAppointment.time} onValueChange={(value) => setEditingAppointment(p => ({...p, time: value}))} disabled={!editingAppointment.date || !editingAppointment.doctorId}>
                      <SelectTrigger>
                        <SelectValue placeholder={!editingAppointment.date || !editingAppointment.doctorId ? "Select doctor and date first" : "Select a time slot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => {
                          const slotInfo = slotsWithCapacity.find(s => s.time === slot);
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
               <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                  <Select name="status" value={editingAppointment.status} onValueChange={(value) => setEditingAppointment(p => ({...p, status: value as Appointment['status']}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Add any relevant notes..." value={editingAppointment.notes || ''} onChange={(e) => setEditingAppointment(p => ({...p, notes: e.target.value}))} />
              </div>
            </form>
          </div>
          <DialogFooter className="p-4 sm:p-6 pt-4 border-t flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="new-appointment-form" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                  Enter the details for the new patient profile.
              </DialogDescription>
            </DialogHeader>
            <form id="new-patient-form" onSubmit={handleSavePatient} className="grid gap-4 py-6 px-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required value={editingPatient.firstName || ''} onChange={(e) => setEditingPatient(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required value={editingPatient.lastName || ''} onChange={(e) => setEditingPatient(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-contact">Contact Number</Label>
                <Input id="patient-contact" required value={editingPatient.contact || ''} onChange={(e) => setEditingPatient(p => ({ ...p, contact: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-age">Age</Label>
                  <Input id="patient-age" type="number" value={editingPatient.age || ''} onChange={(e) => setEditingPatient(p => ({ ...p, age: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-gender">Gender</Label>
                  <Select value={editingPatient.gender || ''} onValueChange={(value) => setEditingPatient(p => ({ ...p, gender: value as Patient['gender'] }))}>
                      <SelectTrigger id="patient-gender">
                          <SelectValue placeholder="Select gender" />
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
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea id="address" value={editingPatient.address || ''} onChange={(e) => setEditingPatient(p => ({ ...p, address: e.target.value }))} />
              </div>
            </form>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="new-patient-form" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Patient
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={isViewPatientDialogOpen} onOpenChange={setIsViewPatientDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Patient Details</DialogTitle>
              <DialogDescription>
                  View complete patient information.
              </DialogDescription>
            </DialogHeader>
            {viewingPatient && (
              <div className="grid gap-4 py-6 px-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    <p className="text-sm">{viewingPatient.firstName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    <p className="text-sm">{viewingPatient.lastName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
                  <p className="text-sm">{viewingPatient.contact}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-sm">{viewingPatient.age || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-sm">{viewingPatient.gender || 'Not specified'}</p>
                  </div>
                </div>
                {viewingPatient.address && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-sm">{viewingPatient.address}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Created On</Label>
                  <p className="text-sm">{viewingPatient.createdAt ? new Date(viewingPatient.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditPatientDialogOpen} onOpenChange={setIsEditPatientDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
              <DialogDescription>
                  Update patient information.
              </DialogDescription>
            </DialogHeader>
            <form id="edit-patient-form" onSubmit={handleUpdatePatient} className="grid gap-4 py-6 px-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" required value={editingPatient.firstName || ''} onChange={(e) => setEditingPatient(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" required value={editingPatient.lastName || ''} onChange={(e) => setEditingPatient(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Number</Label>
                <Input id="edit-contact" required value={editingPatient.contact || ''} onChange={(e) => setEditingPatient(p => ({ ...p, contact: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age</Label>
                  <Input id="edit-age" type="number" value={editingPatient.age || ''} onChange={(e) => setEditingPatient(p => ({ ...p, age: e.target.value ? parseInt(e.target.value, 10) : undefined }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select value={editingPatient.gender || ''} onValueChange={(value) => setEditingPatient(p => ({ ...p, gender: value as Patient['gender'] }))}>
                      <SelectTrigger id="edit-gender">
                          <SelectValue placeholder="Select gender" />
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
                  <Label htmlFor="edit-address">Address (Optional)</Label>
                  <Textarea id="edit-address" value={editingPatient.address || ''} onChange={(e) => setEditingPatient(p => ({ ...p, address: e.target.value }))} />
              </div>
            </form>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="edit-patient-form" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Patient
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
              Patient Records
            </h1>
            <p className="text-slate-100 text-sm">
              Manage patient profiles and medical history
            </p>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6 items-start max-w-full">
        <Card className="xl:col-span-2 w-full max-w-full overflow-x-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                All Patients
              </CardTitle>
              {can('edit', pathname) && (
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleOpenNewPatientDialog}>
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Add New Patient</span>
                </Button>
              )}
            </div>
            <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search patients..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => {
                        setSearchTerm('');
                        setGenderFilter('all');
                        setAgeRange('all');
                        setAgeMin('');
                        setAgeMax('');

                        setSortBy('createdAt');
                        setSortOrder('desc');
                        setCurrentPage(1);
                    }}
                >
                    Reset
                </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gender</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ageRange} onValueChange={(value) => {
                setAgeRange(value);
                if (value === 'all') {
                  setAgeMin('');
                  setAgeMax('');
                } else if (value === '0-12') {
                  setAgeMin('0');
                  setAgeMax('12');
                } else if (value === '13-17') {
                  setAgeMin('13');
                  setAgeMax('17');
                } else if (value === '18-30') {
                  setAgeMin('18');
                  setAgeMax('30');
                } else if (value === '31-50') {
                  setAgeMin('31');
                  setAgeMax('50');
                } else if (value === '51-70') {
                  setAgeMin('51');
                  setAgeMax('70');
                } else if (value === '70+') {
                  setAgeMin('70');
                  setAgeMax('');
                } else if (value === 'custom') {
                  // Keep current values for custom range
                }
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Age Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="0-12">0-12 (Child)</SelectItem>
                  <SelectItem value="13-17">13-17 (Teen)</SelectItem>
                  <SelectItem value="18-30">18-30 (Young)</SelectItem>
                  <SelectItem value="31-50">31-50 (Adult)</SelectItem>
                  <SelectItem value="51-70">51-70 (Senior)</SelectItem>
                  <SelectItem value="70+">70+ (Elderly)</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {ageRange === 'custom' && (
                <>
                  <Input
                    type="number"
                    placeholder="Min Age"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Max Age"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="w-24"
                  />
                </>
              )}

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="firstName-asc">Name A-Z</SelectItem>
                  <SelectItem value="firstName-desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {can('delete', pathname) && (
              <div className="flex items-center space-x-2 pt-4">
                  <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                  <Label htmlFor="show-deleted">Show Bin</Label>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
             <ScrollArea className="h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                      {filteredPatients.map(patient => (
                          <div key={patient._id} className="flex items-center justify-between group">
                            <Button
                                variant="ghost"
                                className={cn(`w-full justify-start h-auto py-2 px-3 text-left`, 
                                    selectedPatient?._id === patient._id && !patient.deletedAt && 'bg-accent',
                                    patient.deletedAt && 'text-muted-foreground'
                                )}
                                onClick={() => !patient.deletedAt && setSelectedPatient(patient)}
                                disabled={!!patient.deletedAt}
                            >
                              <div>
                                    <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{patient.contact}</p>
                                    {patient.address && <p className="text-xs text-muted-foreground truncate">{patient.address}</p>}
                              </div>
                            </Button>
                            {can('delete', pathname) && (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={processingId === patient._id}>
                                          {processingId === patient._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      {patient.deletedAt ? (
                                          <>
                                              <DropdownMenuItem onClick={() => handleAction('restore', patient._id)}><Undo className="mr-2 h-4 w-4" />Restore</DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                               <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                                          <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                                                      </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the patient and all associated data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAction('permanent-delete', patient._id)} className={cn(buttonVariants({ variant: 'destructive' }))}>Yes, delete permanently</AlertDialogAction></AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </>
                                      ) : (
                                          <>
                                              <DropdownMenuItem onClick={() => handleOpenViewPatientDialog(patient)}>
                                                  <Eye className="mr-2 h-4 w-4" />View Details
                                              </DropdownMenuItem>
                                              {can('edit', pathname) && (
                                                  <DropdownMenuItem onClick={() => handleOpenEditPatientDialog(patient)}>
                                                      <Edit className="mr-2 h-4 w-4" />Edit Patient
                                                  </DropdownMenuItem>
                                              )}
                                              <DropdownMenuSeparator />
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                                          <Trash className="mr-2 h-4 w-4" /> Move to Bin
                                                      </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <AlertDialogHeader><AlertDialogTitle>Move to Bin?</AlertDialogTitle><AlertDialogDescription>This will move the patient to the bin. You can restore them later.</AlertDialogDescription></AlertDialogHeader>
                                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAction('soft-delete', patient._id)}>Move to Bin</AlertDialogAction></AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </>
                                      )}
                                  </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                      ))}
                  </div>
                )}
             </ScrollArea>
             <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPatients)} of {totalPatients} patients
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        <span className="text-sm">Page</span>
                        <Input 
                            type="text" 
                            value={pageInput}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                    setPageInput(value);
                                }
                            }}
                            onBlur={() => setPageInput(currentPage.toString())}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const page = parseInt(pageInput);
                                    if (page >= 1 && page <= totalPages) {
                                        setCurrentPage(page);
                                    } else {
                                        setPageInput(currentPage.toString());
                                    }
                                }
                            }}
                            className="w-16 h-8 text-center"
                        />
                        <span className="text-sm">of {totalPages}</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-3">
        {selectedPatient ? (
            <div className="space-y-6">
                <Card className="animate-slide-up">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                </CardTitle>
                                <CardDescription>Contact: {selectedPatient.contact} &bull; Age: {selectedPatient.age || 'N/A'} &bull; Gender: {selectedPatient.gender || 'N/A'}</CardDescription>
                            </div>
                            {can('edit', '/dashboard/appointments') && (
                                <Button onClick={handleOpenNewAppointmentDialog}>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Schedule Appointment
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                <Card className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                            Appointment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[45vh]">
                          <div className="space-y-4 p-1">
                            <div>
                                <h4 className="font-medium mb-2 text-primary">Upcoming Appointments</h4>
                                {upcomingAppointments.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingAppointments.map(app => (
                                             <div key={app._id} className="p-3 rounded-md border text-sm">
                                                <p className="font-semibold">{new Date(app.date).toLocaleDateString()} at {formatTime12h(app.time)}</p>
                                                <p className="text-muted-foreground">{app.service} with {app.doctor}</p>
                                                <p className="text-muted-foreground capitalize">Status: {app.status}</p>
                                                {app.notes && <p className="text-xs mt-2 p-2 bg-muted rounded">Notes: {app.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No upcoming appointments.</p>}
                            </div>
                            <Separator />
                             <div>
                                <h4 className="font-medium mb-2 text-primary">Past Appointments</h4>
                                {pastAppointments.length > 0 ? (
                                    <div className="space-y-3">
                                        {pastAppointments.map(app => (
                                            <div key={app._id} className="p-3 rounded-md border text-sm">
                                               <p className="font-semibold">{new Date(app.date).toLocaleDateString()} at {formatTime12h(app.time)}</p>
                                                <p className="text-muted-foreground">{app.service} with {app.doctor}</p>
                                                <p className="text-muted-foreground capitalize">Status: {app.status}</p>
                                                {app.notes && <p className="text-xs mt-2 p-2 bg-muted rounded">Notes: {app.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No past appointments.</p>}
                            </div>
                          </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                 <Card className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-red-400">
                            Blood Report History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bloodReports.filter(r => r.patientId === selectedPatient._id).length > 0 ? (
                             <div className="space-y-3">
                                {bloodReports.filter(r => r.patientId === selectedPatient._id && !r.deletedAt).map(report => (
                                    <div key={report._id} className="p-3 rounded-md border text-sm">
                                        <p className="font-semibold">
                                          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                            {report.fileName}
                                          </a>
                                        </p>
                                        <p className="text-muted-foreground">Uploaded on {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'} by {report.uploadedBy}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No blood reports found for this patient.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="animate-slide-up" style={{animationDelay: '0.3s'}}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400">
                            Prescription History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {prescriptions.filter(r => r.patientId === selectedPatient._id).length > 0 ? (
                             <div className="space-y-3">
                                {prescriptions.filter(r => r.patientId === selectedPatient._id && !r.deletedAt).map(record => (
                                    <div key={record._id} className="p-3 rounded-md border text-sm">
                                        <p className="font-semibold">
                                          <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                            {record.fileName}
                                          </a>
                                        </p>
                                        <p className="text-muted-foreground">Uploaded on {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'} by {record.uploadedBy}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No prescriptions found for this patient.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        ) : (
            <Card className="flex items-center justify-center h-[70vh] xl:col-span-3 animate-slide-up">
                <div className="text-center text-muted-foreground">
                    <Users2 className="h-12 w-12 mx-auto mb-4" />
                    <h2 className="text-xl font-medium">Select a patient</h2>
                    <p>Choose a patient from the list to view their complete medical record.</p>
                </div>
            </Card>
        )}
        </div>
      </div>
    </div>
  );
}
