
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, add } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import type { Appointment, Service, ManagedUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api-utils';
import { Calendar as CalendarIcon, Loader2, Stethoscope, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config/api';
import Link from 'next/link';

export default function BookAppointmentPage() {
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]); // All possible slots from master
  const [availableSlots, setAvailableSlots] = useState<{
    success: boolean;
    data: string[];
    meta?: {
      doctorId: string;
      date: string;
      totalSlots: number;
      bookedSlots: number;
      availableSlots: number;
    };
    slotsWithCapacity?: Array<{
      time: string;
      capacity: number;
      booked: number;
      available: number;
      isFull: boolean;
    }>;
  }>({ success: false, data: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [bookingDetails, setBookingDetails] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    address: '',
    age: '',
    gender: '',
    serviceId: '',
    doctorId: '',
    date: new Date(),
    time: '',
    notes: '', // Additional notes field
    type: 'offline' as 'online' | 'offline',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    setBookingDetails(prev => ({ ...prev, date: today }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [doctorsData, servicesData, masterSlotsData] = await Promise.all([
        apiGet<ManagedUser[]>('/api/public/doctors'),
        apiGet<Service[]>('/api/services'),
        apiGet<string[]>('/api/timeslots?source=master'), // Get master slots
      ]);

      setDoctors(doctorsData);
      setServices(servicesData);
      setAllTimeSlots(masterSlotsData.sort()); // Sort master slots

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load booking information. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchAvailableSlots = useCallback(async () => {
    if (!bookingDetails.doctorId || !selectedDate) {
      setAvailableSlots({ success: false, data: [] });
      return;
    }

    setIsLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Fetching slots for:', { doctorId: bookingDetails.doctorId, date: dateStr });

      // Use the availability endpoint with doctor ID and date in the URL
      const response = await apiGet<{
        success: boolean;
        data: {
          doctorId: string;
          doctorName: string;
          date: string;
          day: string;
          patientsPerSlot: number;
          totalSlots: number;
          availableSlots: string[];
          slotsWithCapacity: Array<{
            time: string;
            capacity: number;
            booked: number;
            available: number;
            isFull: boolean;
          }>;
          summary: {
            available: number;
            booked: number;
            total: number;
          };
        };
      }>(`/api/timeslots/availability/${bookingDetails.doctorId}/${dateStr}`);

      console.log('Availability response:', response);

      // Transform the response to match our expected format
      if (response.success && response.data) {
        setAvailableSlots({
          success: true,
          data: response.data.availableSlots,
          meta: {
            doctorId: response.data.doctorId,
            date: response.data.date,
            totalSlots: response.data.totalSlots,
            bookedSlots: response.data.summary.booked,
            availableSlots: response.data.summary.available
          },
          slotsWithCapacity: response.data.slotsWithCapacity
        });
      } else {
        setAvailableSlots({ success: false, data: [] });
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      setAvailableSlots({ success: false, data: [] });
    } finally {
      setIsLoadingSlots(false);
    }
  }, [bookingDetails.doctorId, selectedDate, toast]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof bookingDetails) => (value: string) => {
    const changes: Partial<typeof bookingDetails> = { [name]: value, time: '' };
    if (name === 'doctorId' || name === 'serviceId' || name === 'type') {
      setBookingDetails(prev => ({ ...prev, ...changes }));
    } else {
      setBookingDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setBookingDetails(prev => ({ ...prev, date, time: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileUploadResponse = null;

      // Upload file first if one is selected
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/api/upload/public`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        fileUploadResponse = await uploadResponse.json();
      }

      // Create appointment with file reference if uploaded
      const selectedService = services.find(s => s._id === bookingDetails.serviceId);
      const appointmentData = {
        // Patient information (for new patients)
        patientFirstName: bookingDetails.firstName,
        patientLastName: bookingDetails.lastName,
        patientContact: bookingDetails.contact,
        patientAge: parseInt(bookingDetails.age, 10) || undefined,
        patientGender: bookingDetails.gender,
        patientAddress: bookingDetails.address,

        // Appointment details
        doctorId: bookingDetails.doctorId,
        service: selectedService?.name || '',
        serviceId: bookingDetails.serviceId,
        date: format(bookingDetails.date, 'yyyy-MM-dd'),
        time: bookingDetails.time,
        notes: bookingDetails.notes,
        type: bookingDetails.type,
        fileUrl: fileUploadResponse?.url || '',
      };

      await apiPost('/api/appointment-booking/book', appointmentData);

      setBookingSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      toast({ variant: "destructive", title: "Booking Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Please select a file smaller than 10MB." });
        return;
      }

      // Check file type - match backend validation
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: "Please select an image (JPEG, PNG, GIF, WebP), PDF, or document file." });
        return;
      }

      setUploadedFile(file);
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

  const handleBookAnother = () => {
    setBookingSuccess(false);
    setBookingDetails({
      firstName: '',
      lastName: '',
      contact: '',
      address: '',
      age: '',
      gender: '',
      serviceId: '',
      doctorId: '',
      date: new Date(),
      time: '',
      notes: '',
      type: 'offline',
    });
    setSelectedDate(new Date());
    setUploadedFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="mx-auto max-w-lg w-full shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600 mb-2">Appointment Booked!</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Your appointment request has been sent successfully. You will receive a confirmation shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">Thank you for choosing SRM Arnik Skin & Healthcare Clinic.</p>
              <p className="text-green-700 text-sm mt-1">We look forward to serving you!</p>
            </div>
            <Button
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] px-8 py-3"
              onClick={handleBookAnother}
            >
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-8">
            <Link href="/login" className="absolute top-4 right-4 text-sm font-medium text-primary hover:underline transition-colors">
              Admin Login <ArrowRight className="inline h-4 w-4 ml-1" />
            </Link>
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Book an Appointment
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Schedule your visit with our expert healthcare professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    value={bookingDetails.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    value={bookingDetails.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contact" className="text-sm font-semibold text-gray-700">Contact Number</Label>
                  <Input
                    id="contact"
                    name="contact"
                    required
                    value={bookingDetails.contact}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={bookingDetails.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full address"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={bookingDetails.age}
                    onChange={handleInputChange}
                    placeholder="Your Age"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">Gender</Label>
                  <Select name="gender" value={bookingDetails.gender} onValueChange={handleSelectChange('gender')}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service" className="text-sm font-semibold text-gray-700">Service</Label>
                  <Select name="serviceId" required value={bookingDetails.serviceId} onValueChange={handleSelectChange('serviceId')}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors">
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
                  <Label htmlFor="doctor" className="text-sm font-semibold text-gray-700">Doctor</Label>
                  <Select name="doctorId" required value={bookingDetails.doctorId} onValueChange={handleSelectChange('doctorId')}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(doctor => <SelectItem key={doctor._id} value={doctor._id}>{doctor.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between h-5">
                    <Label htmlFor="date" className="text-sm font-semibold text-gray-700">Date</Label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal border-gray-200 hover:border-blue-500 transition-colors",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-lg">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between h-5">
                    <Label htmlFor="time" className="text-sm font-semibold text-gray-700">Available Time</Label>
                    {availableSlots.success && availableSlots.meta && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                        {availableSlots.meta.availableSlots} of {availableSlots.meta.totalSlots} slots
                      </span>
                    )}
                  </div>
                  <Select name="time" required value={bookingDetails.time} onValueChange={handleSelectChange('time')} disabled={!selectedDate || !bookingDetails.doctorId || isLoadingSlots}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors">
                      <SelectValue placeholder={isLoadingSlots ? "Loading..." : "Select a time slot"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : allTimeSlots.length > 0 && bookingDetails.doctorId ? (
                        allTimeSlots.map((slot: string) => {
                          const isAvailable = availableSlots.success && availableSlots.data.includes(slot);
                          const slotCapacity = availableSlots.slotsWithCapacity?.find(s => s.time === slot);
                          const availableCount = slotCapacity?.available ?? 0;
                          const isDisabled = !isAvailable || availableCount === 0;

                          return (
                            <SelectItem
                              key={slot}
                              value={slot}
                              disabled={isDisabled}
                              className={`${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'} py-3`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{formatTime12h(slot)}</span>
                                {slotCapacity ? (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-3 ${slotCapacity.available > 0
                                    ? 'text-green-700 bg-green-100'
                                    : 'text-red-700 bg-red-100'
                                    }`}>
                                    {slotCapacity.available} available
                                  </span>
                                ) : !isAvailable ? (
                                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full font-medium ml-3">
                                    0 available
                                  </span>
                                ) : null}
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">
                          {allTimeSlots.length === 0
                            ? "No time slots configured."
                            : "Select a doctor and date to see available slots."}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={bookingDetails.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information about your visit or symptoms..."
                  rows={4}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-semibold text-gray-700">Upload File (Optional)</Label>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="cursor-pointer border-0 p-0 h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload medical reports, prescriptions, or relevant documents (Max 10MB, Images/PDF/Word/Text files supported)
                    </p>
                  </div>
                  {uploadedFile && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">✓</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-green-800">File selected:</span>
                        <span className="text-sm text-green-700 ml-2">{uploadedFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isSubmitting ? 'Booking Appointment...' : 'Book Appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
