
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  CalendarCheck,
  Stethoscope,

  BookText,
  RefreshCw,
  Video
} from "lucide-react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Appointment, Patient, Service, Summary, ManagedUser } from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { format as formatDate } from 'date-fns';
import { cn } from "@/lib/utils"
import { Loading } from "@/components/ui/loading"
import { useMeeting } from "@/components/providers/MeetingProvider";


const chartConfig = {
  appointments: {
    label: "Appointments",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export default function DashboardPage() {
  const { user, token, authFetch } = useAuth();
  const { joinMeeting, activeMeetingId } = useMeeting();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<ManagedUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [todaysSummary, setTodaysSummary] = useState<Summary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [appsRes, patientsRes, usersRes, servRes, summariesRes] = await Promise.all([
        authFetch('/api/appointments'),
        authFetch('/api/patients'),
        authFetch('/api/users'),
        authFetch('/api/services'),
        authFetch('/api/summaries'),
      ]);

      if (!appsRes.ok || !patientsRes.ok || !usersRes.ok || !servRes.ok || !summariesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const appsData = await appsRes.json();
      const patientsData = await patientsRes.json();
      const usersData = await usersRes.json();
      const servData = await servRes.json();
      const summariesData = await summariesRes.json();

      // Handle appointments API response
      const appointmentsArray = appsData?.success ? appsData.data : Array.isArray(appsData) ? appsData : [];
      setAppointments(Array.isArray(appointmentsArray) ? appointmentsArray : []);

      // Handle patients API response  
      const patientsArray = patientsData?.success ? patientsData.data : Array.isArray(patientsData) ? patientsData : [];
      setPatients(Array.isArray(patientsArray) ? patientsArray : []);

      // Handle users API response
      const usersArray = usersData?.success ? usersData.data : Array.isArray(usersData) ? usersData : [];
      setDoctors(Array.isArray(usersArray) ? usersArray.filter((u: ManagedUser) => u?.role === 'doctor') : []);

      // Handle services API response
      const servicesArray = servData?.success ? servData.data : Array.isArray(servData) ? servData : [];
      setServices(Array.isArray(servicesArray) ? servicesArray : []);

      const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
      // Handle summaries API response
      const summariesArray = summariesData?.success ? summariesData.data : Array.isArray(summariesData) ? summariesData : [];
      const summaryForToday = Array.isArray(summariesArray) ? summariesArray.find((s: Summary) => s?.date === todayStr && s?.userId === user?._id) || null : null;
      setTodaysSummary(summaryForToday);

    } catch (error) {
      console.error(error);
      if (!(error as Error).message.includes('Session expired')) {
        toast({
          variant: 'destructive',
          title: 'Dashboard Error',
          description: (error as Error).message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, toast, user]);

  // Auto-refresh when a meeting ends
  const prevMeetingIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevMeetingIdRef.current && !activeMeetingId) {
      fetchData();
    }
    prevMeetingIdRef.current = activeMeetingId;
  }, [activeMeetingId, fetchData]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
      const response = await authFetch('/api/actions/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate summary');
      }
      await fetchData();
      toast({ title: "Success", description: "Today's summary has been regenerated." });
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-[50vh] bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <Loading size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  const visibleAppointments = appointments?.filter(app => {
    if (!app) return false;
    if (app.deletedAt !== null && app.deletedAt !== undefined) return false;
    return true;
  }) || [];
  console.log("Visible Appointments:", visibleAppointments);

  const totalAppointments = visibleAppointments?.length || 0;
  const pendingAppointments = visibleAppointments?.filter(a => a?.status === 'Pending')?.length || 0;
  const totalDoctors = doctors?.length || 0;
  const totalServices = services?.length || 0;

  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  // Debug logging
  console.log('Today\'s date:', todayStr);

  const todaysAppointments = visibleAppointments
    ?.filter(appointment => {
      if (!appointment || !appointment.date) return false;

      // Robust date comparison handling both YYYY-MM-DD and ISO strings
      const appDate = appointment.date.includes('T') ? appointment.date.split('T')[0] : appointment.date;

      if (appDate !== todayStr) return false;
      if (user?.role === 'doctor' && appointment.doctorId !== user?._id) return false;
      return true;
    })
    ?.sort((a, b) => (a?.time || '').localeCompare(b?.time || '')) || [];

  console.log('Today\'s appointments found:', todaysAppointments?.length);

  const displayTodaysAppointments = todaysAppointments || [];

  // Check if appointment time has passed
  const isAppointmentOverdue = (appointmentTime: string) => {
    const now = new Date();
    const [hours, minutes] = appointmentTime.split(':');
    const appointmentDateTime = new Date();
    appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return now > appointmentDateTime;
  };

  const futureAppointments = visibleAppointments
    ?.filter(appointment => {
      if (!appointment || !appointment.date) return false;
      if (new Date(appointment.date) <= new Date(todayStr)) return false;
      if (user?.role === 'doctor' && appointment.doctorId !== user?._id) return false;
      return true;
    })
    ?.sort((a, b) => {
      const dateA = new Date(`${a?.date}T${a?.time || '00:00'}`);
      const dateB = new Date(`${b?.date}T${b?.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    }) || [];

  const appointmentStatusData = [
    { status: "Confirmed", total: visibleAppointments?.filter(a => a?.status === 'Confirmed')?.length || 0 },
    { status: "Pending", total: visibleAppointments?.filter(a => a?.status === 'Pending')?.length || 0 },
    { status: "Cancelled", total: visibleAppointments?.filter(a => a?.status === 'Cancelled')?.length || 0 },
    { status: "Completed", total: visibleAppointments?.filter(a => a?.status === 'Completed')?.length || 0 },
  ]

  const formatTime12h = (time24: string | undefined) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getPatientName = (patientId: string | Patient | undefined) => {
    if (!patientId) return 'Unknown Patient';
    if (typeof patientId === 'object') {
      return `${patientId.firstName || ''} ${patientId.lastName || ''}`.trim() || 'Unknown Patient';
    }
    const patient = patients?.find(p => p?._id === patientId);
    return patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient' : 'Unknown Patient';
  }

  // return (
  //       <div className="space-y-8 animate-fade-in">
  //           <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20">
  //               <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
  //               <div className="relative">
  //                   <div className="flex items-center gap-2 mb-1">
  //                       <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
  //                       <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
  //                           Dashboard
  //                       </h1>
  //                   </div>
  //                   <p className="text-muted-foreground text-sm">
  //                       Real-time overview of your clinic's performance
  //                   </p>
  //               </div>
  //           </div>
  //            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  //               <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  //                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
  //                       <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
  //                           Total Appointments
  //                       </CardTitle>
  //                       <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
  //                           <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent className="relative">
  //                       <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{totalAppointments}</div>
  //                       <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
  //                           All scheduled appointments
  //                       </p>
  //                   </CardContent>
  //               </Card>
  //               <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  //                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
  //                       <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
  //                           Pending Appointments
  //                       </CardTitle>
  //                       <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors duration-300">
  //                           <CalendarCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent className="relative">
  //                       <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">+{pendingAppointments}</div>
  //                       <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
  //                           Awaiting confirmation
  //                       </p>
  //                   </CardContent>
  //               </Card>
  //               <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/20 hover:to-green-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  //                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
  //                       <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
  //                           Total Doctors
  //                       </CardTitle>
  //                       <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-300">
  //                           <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent className="relative">
  //                       <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">{totalDoctors}</div>
  //                       <p className="text-xs text-green-600/70 dark:text-green-400/70">
  //                           Available medical staff
  //                       </p>
  //                   </CardContent>
  //               </Card>
  //               <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  //                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
  //                       <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
  //                           Total Services
  //                       </CardTitle>
  //                       <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
  //                           <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent className="relative">
  //                       <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">{totalServices}</div>
  //                       <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
  //                           Medical services offered
  //                       </p>
  //                   </CardContent>
  //               </Card>
  //           </div>

  //           <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
  //               <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
  //                   <CardHeader className="relative">
  //                       <div className="flex justify-between items-start">
  //                           <div>
  //                               <div className="flex items-center gap-2 mb-2">
  //                                   <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
  //                                   <CardTitle className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Today's AI Summary</CardTitle>
  //                               </div>
  //                               <CardDescription>AI-powered insights from today's clinic activities.</CardDescription>
  //                           </div>
  //                           {todaysSummary && (
  //                               <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="border-primary/20 hover:bg-primary/10">
  //                                   {isGeneratingSummary ? (
  //                                       <Loading variant="button" size="sm" />
  //                                   ) : (
  //                                       <RefreshCw className="mr-2 h-4 w-4" />
  //                                   )}
  //                                   {!isGeneratingSummary && "Regenerate"}
  //                               </Button>
  //                           )}
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent className="relative">
  //                       {todaysSummary ? (
  //                           <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-6 border border-primary/20">
  //                               <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
  //                               <ReactMarkdown 
  //                                   remarkPlugins={[remarkGfm]}
  //                                   className="prose prose-sm dark:prose-invert max-w-none relative">
  //                               >
  //                                  {todaysSummary.content}
  //                               </ReactMarkdown>
  //                           </div>
  //                       ) : (
  //                           <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
  //                               <div className="p-4 rounded-full bg-primary/10 mb-4">
  //                                   <BookText className="h-8 w-8 text-primary" />
  //                               </div>
  //                               <p className="mb-6 text-muted-foreground">No AI summary generated for today yet.</p>
  //                               <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
  //                                   {isGeneratingSummary ? (
  //                                       <Loading variant="button" size="sm" text="Generate AI Summary" />
  //                                   ) : (
  //                                       "Generate AI Summary"
  //                                   )}
  //                               </Button>
  //                           </div>
  //                       )}
  //                   </CardContent>
  //               </Card>
  //                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-secondary/5 to-secondary/10 backdrop-blur-sm">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent"></div>
  //                   <CardHeader className="relative">
  //                       <div className="flex items-center gap-2 mb-2">
  //                           <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></div>
  //                           <CardTitle className="text-green-700 dark:text-green-300">Appointments by Status</CardTitle>
  //                       </div>
  //                       <CardDescription>
  //                           Real-time visual breakdown of appointment statuses.
  //                       </CardDescription>
  //                   </CardHeader>
  //                   <CardContent className="pb-4">
  //                       <div className="h-[250px]">
  //                           <ChartContainer config={chartConfig} className="w-full h-full">
  //                               <BarChart accessibilityLayer data={appointmentStatusData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
  //                               <CartesianGrid vertical={false} />
  //                               <XAxis
  //                                   dataKey="status"
  //                                   tickLine={false}
  //                                   axisLine={false}
  //                                   tickMargin={10}
  //                                   angle={-45}
  //                                   textAnchor="end"
  //                               />
  //                               <YAxis allowDecimals={false} />
  //                               <ChartTooltip
  //                                   cursor={false}
  //                                   content={<ChartTooltipContent indicator="dot" />}
  //                               />
  //                               <Bar dataKey="total" fill="hsl(var(--primary))" radius={8} className="drop-shadow-sm" />
  //                               </BarChart>
  //                           </ChartContainer>
  //                       </div>
  //                   </CardContent>
  //               </Card>
  //           </div>

  //           <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
  //               <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-accent/5 to-accent/10 backdrop-blur-sm">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
  //                   <CardHeader className="flex flex-row items-center relative">
  //                       <div className="grid gap-2">
  //                           <div className="flex items-center gap-2">
  //                               <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></div>
  //                               <CardTitle className="text-orange-700 dark:text-orange-300">
  //                                   Today's Appointments
  //                               </CardTitle>
  //                           </div>
  //                           <CardDescription>
  //                               Live schedule for today's patient appointments.
  //                           </CardDescription>
  //                       </div>
  //                       <Button asChild size="sm" className="ml-auto gap-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 border-0">
  //                           <Link href="/dashboard/appointments">
  //                               View All
  //                               <ArrowUpRight className="h-4 w-4" />
  //                           </Link>
  //                       </Button>
  //                   </CardHeader>
  //                   <CardContent>
  //                       <Table>
  //                           <TableHeader>
  //                               <TableRow>
  //                                   <TableHead>Patient</TableHead>
  //                                   {user.role === 'admin' && (
  //                                       <TableHead className="hidden sm:table-cell">Doctor</TableHead>
  //                                   )}
  //                                   <TableHead className="hidden sm:table-cell">Status</TableHead>
  //                                   <TableHead className="text-right">Time</TableHead>
  //                               </TableRow>
  //                           </TableHeader>
  //                           <TableBody>
  //                           {displayTodaysAppointments.length > 0 ? (
  //                               displayTodaysAppointments.map(appointment => (
  //                               <TableRow key={appointment._id}>
  //                                   <TableCell>
  //                                   <div className="font-medium">{getPatientName(appointment.patientId)}</div>
  //                                   <div className="hidden text-sm text-muted-foreground md:inline">
  //                                       {appointment.service}
  //                                   </div>
  //                                   </TableCell>
  //                                   {user.role === 'admin' && (
  //                                       <TableCell className="hidden sm:table-cell">{appointment.doctor}</TableCell>
  //                                   )}
  //                                   <TableCell className="hidden sm:table-cell">
  //                                     <Badge 
  //                                       className={cn("text-xs capitalize", 
  //                                           appointment.status === 'Completed' && 'bg-blue-100 text-blue-800 border-blue-200'
  //                                       )} 
  //                                       variant={
  //                                           appointment.status === 'Confirmed' ? 'default' 
  //                                           : appointment.status === 'Pending' ? 'secondary' 
  //                                           : appointment.status === 'Completed' ? 'outline'
  //                                           : 'destructive'
  //                                       }>
  //                                       {appointment.status.toLowerCase()}
  //                                     </Badge>
  //                                   </TableCell>
  //                                   <TableCell className="text-right">
  //                                       <div className="flex items-center justify-end gap-2">
  //                                           <span>{formatTime12h(appointment.time)}</span>
  //                                           {appointment.time && isAppointmentOverdue(appointment.time) && (
  //                                               <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
  //                                                   Overdue
  //                                               </Badge>
  //                                           )}
  //                                       </div>
  //                                   </TableCell>
  //                               </TableRow>
  //                           ))
  //                           ) : (
  //                               <TableRow>
  //                                   <TableCell colSpan={user.role === 'admin' ? 4 : 3} className="h-24 text-center">
  //                                       No appointments scheduled for today.
  //                                   </TableCell>
  //                               </TableRow>
  //                           )}
  //                           </TableBody>
  //                       </Table>
  //                   </CardContent>
  //               </Card>

  //               <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-info/5 to-info/10 backdrop-blur-sm">
  //                   <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent"></div>
  //                   <CardHeader className="flex flex-row items-center relative">
  //                       <div className="grid gap-2">
  //                           <div className="flex items-center gap-2">
  //                               <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
  //                               <CardTitle className="text-blue-700 dark:text-blue-300">Upcoming Appointments</CardTitle>
  //                           </div>
  //                           <CardDescription>
  //                               Future appointments scheduled beyond today.
  //                           </CardDescription>
  //                       </div>
  //                   </CardHeader>
  //                   <CardContent>
  //                       <Table>
  //                           <TableHeader>
  //                               <TableRow>
  //                                   <TableHead>Patient</TableHead>
  //                                   {user.role === 'admin' && (
  //                                       <TableHead className="hidden sm:table-cell">Doctor</TableHead>
  //                                   )}
  //                                   <TableHead className="hidden sm:table-cell">Date</TableHead>
  //                                   <TableHead className="text-right">Time</TableHead>
  //                               </TableRow>
  //                           </TableHeader>
  //                           <TableBody>
  //                           {futureAppointments.length > 0 ? (
  //                               futureAppointments.slice(0, 5).map(appointment => (
  //                               <TableRow key={appointment._id}>
  //                                   <TableCell>
  //                                   <div className="font-medium">{getPatientName(appointment.patientId)}</div>
  //                                   <div className="hidden text-sm text-muted-foreground md:inline">
  //                                       {appointment.service}
  //                                   </div>
  //                                   </TableCell>
  //                                   {user.role === 'admin' && (
  //                                       <TableCell className="hidden sm:table-cell">{appointment.doctor}</TableCell>
  //                                   )}
  //                                   <TableCell className="hidden sm:table-cell">{formatDate(new Date(appointment.date), 'PPP')}</TableCell>
  //                                   <TableCell className="text-right">{formatTime12h(appointment.time)}</TableCell>
  //                               </TableRow>
  //                           ))
  //                           ) : (
  //                               <TableRow>
  //                                   <TableCell colSpan={user.role === 'admin' ? 4 : 3} className="h-24 text-center">
  //                                       No upcoming appointments.
  //                                   </TableCell>
  //                               </TableRow>
  //                           )}
  //                           </TableBody>
  //                       </Table>
  //                   </CardContent>
  //               </Card>
  //           </div>
  //       </div>
  // )




  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      <div className="relative rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 md:p-6 border border-primary/20 w-full">
        <div className="relative w-full">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Real-time overview of your clinic's performance
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">

        <Card className="group relative border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-blue-500/25">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Appointments
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{totalAppointments}</div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              All scheduled appointments
            </p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 hover:from-cyan-500/20 hover:to-cyan-600/10 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-cyan-500/25">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-cyan-700 dark:text-cyan-300">
              Online Sessions
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors duration-300">
              <Video className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-cyan-900 dark:text-cyan-100 mb-1">
              {visibleAppointments?.filter(a => a?.type === 'online' && a?.date === todayStr).length || 0}
            </div>
            <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-orange-500/25">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
              Pending Appointments
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors duration-300">
              <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">+{pendingAppointments}</div>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/20 hover:to-green-600/10 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-green-500/25">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
              Total Doctors
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-300">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-1">{totalDoctors}</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              Available medical staff
            </p>
          </CardContent>
        </Card>

        <Card className="group relative border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-purple-500/25">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
              Total Services
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">{totalServices}</div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
              Medical services offered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Online Appointments Section */}
      <div className="w-full">
        <Card className="relative border-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="px-4 sm:px-6 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <Video className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg text-slate-800">
                  Today's Online Sessions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Join your scheduled virtual consultations directly.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            {displayTodaysAppointments.filter(app => app.type === 'online').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayTodaysAppointments
                  .filter(app => app.type === 'online')
                  .map((appointment) => (
                    <div key={appointment._id} className="flex flex-col gap-3 p-4 rounded-xl border border-cyan-100 bg-white/60 hover:bg-white/90 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {getPatientName(appointment.patientId).charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{getPatientName(appointment.patientId)}</p>
                            <p className="text-xs text-muted-foreground">{appointment.service}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px] px-2 py-0.5 h-6">
                          {formatTime12h(appointment.time)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-2">
                        <Button
                          size="sm"
                          className="h-8 bg-cyan-600 hover:bg-cyan-700 text-white border-0 shadow-sm disabled:bg-slate-300 disabled:text-slate-500"
                          disabled={['Completed', 'completed', 'Cancelled', 'cancelled'].includes(appointment.status)}
                          onClick={() => {
                            const linkId = typeof appointment.meeting === 'object' && appointment.meeting?.linkId ? appointment.meeting.linkId : appointment._id;
                            joinMeeting(linkId);
                          }}
                        >
                          <Video className="h-3 w-3 mr-1.5" />
                          {['Completed', 'completed', 'Cancelled', 'cancelled'].includes(appointment.status) ? 'Expired' : 'Join Meeting'}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-white/40 rounded-xl border border-dashed border-slate-200">
                <Video className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No online sessions scheduled for today</p>
                <p className="text-xs text-slate-400">Online appointments for {todayStr} will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">

        <Card className="relative border-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <CardHeader className="relative px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
                  <CardTitle className="text-sm sm:text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Today's AI Summary
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  AI-powered insights from today's clinic activities.
                </CardDescription>
              </div>
              {todaysSummary && (
                <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="border-primary/20 hover:bg-primary/10 w-full sm:w-auto">
                  {isGeneratingSummary ? (
                    <Loading variant="button" size="sm" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {!isGeneratingSummary && "Regenerate"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative px-4 sm:px-6">
            {todaysSummary ? (
              <div className="relative rounded-lg md:rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-6 border border-primary/20">
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm relative"
                >
                  {todaysSummary.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 sm:p-8 border-2 border-dashed border-primary/20 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                <div className="p-3 sm:p-4 rounded-full bg-primary/10 mb-4">
                  <BookText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <p className="mb-4 sm:mb-6 text-muted-foreground text-sm">No AI summary generated for today yet.</p>
                <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full sm:w-auto">
                  {isGeneratingSummary ? (
                    <Loading variant="button" size="sm" text="Generate AI Summary" />
                  ) : (
                    "Generate AI Summary"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


        <Card className="relative border-0 bg-gradient-to-br from-secondary/5 to-secondary/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent"></div>
          <CardHeader className="relative px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse flex-shrink-0"></div>
              <CardTitle className="text-sm sm:text-base text-green-700 dark:text-green-300">
                Appointments by Status
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Real-time visual breakdown of appointment statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 sm:px-6">
            <div className="h-[200px] sm:h-[250px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={appointmentStatusData} margin={{ top: 20, right: 10, bottom: 40, left: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    angle={-45}
                    textAnchor="end"
                    fontSize={12}
                  />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={8} className="drop-shadow-sm" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">
        <Card className="relative border-0 bg-gradient-to-br from-accent/5 to-accent/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center relative px-4 sm:px-6 gap-4">
            <div className="grid gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse flex-shrink-0"></div>
                <CardTitle className="text-sm sm:text-base text-orange-700 dark:text-orange-300">
                  Today's Appointments
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Live schedule for today's patient appointments.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 border-0 w-full sm:w-auto">
              <Link href="/dashboard/appointments">
                View All
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Patient</TableHead>
                      {user.role === 'admin' && (
                        <TableHead className="text-xs sm:text-sm">Doctor</TableHead>
                      )}
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTodaysAppointments.length > 0 ? (
                      displayTodaysAppointments.map(appointment => (
                        <TableRow key={appointment._id}>
                          <TableCell className="py-3">
                            <div className="font-medium text-sm">{getPatientName(appointment.patientId)}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {appointment.service}
                            </div>
                          </TableCell>
                          {user.role === 'admin' && (
                            <TableCell className="py-3 text-sm">
                              {appointment.doctor}
                            </TableCell>
                          )}
                          <TableCell className="py-3">
                            <Badge
                              className={cn("text-xs capitalize whitespace-nowrap",
                                appointment.status === 'Completed' && 'bg-blue-100 text-blue-800 border-blue-200'
                              )}
                              variant={
                                appointment.status === 'Confirmed' ? 'default'
                                  : appointment.status === 'Pending' ? 'secondary'
                                    : appointment.status === 'Completed' ? 'outline'
                                      : 'destructive'
                              }>
                              {appointment.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm whitespace-nowrap">{formatTime12h(appointment.time)}</span>
                              {appointment.time && isAppointmentOverdue(appointment.time) && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={user.role === 'admin' ? 4 : 3} className="h-24 text-center">
                          No appointments scheduled for today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-3">
                {displayTodaysAppointments.length > 0 ? (
                  displayTodaysAppointments.map(appointment => (
                    <div key={appointment._id} className="border rounded-lg p-3 bg-gradient-to-r from-accent/5 to-transparent">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{getPatientName(appointment.patientId)}</div>
                          <div className="text-xs text-muted-foreground">{appointment.service}</div>
                          {user.role === 'admin' && (
                            <div className="text-xs text-muted-foreground">Dr. {appointment.doctor}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatTime12h(appointment.time)}</div>
                          <Badge
                            className={cn("text-xs capitalize mt-1",
                              appointment.status === 'Completed' && 'bg-blue-100 text-blue-800 border-blue-200'
                            )}
                            variant={
                              appointment.status === 'Confirmed' ? 'default'
                                : appointment.status === 'Pending' ? 'secondary'
                                  : appointment.status === 'Completed' ? 'outline'
                                    : 'destructive'
                            }>
                            {appointment.status.toLowerCase()}
                          </Badge>
                          {appointment.time && isAppointmentOverdue(appointment.time) && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs mt-1">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                    No appointments scheduled for today.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative border-0 bg-gradient-to-br from-info/5 to-info/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent"></div>
          <CardHeader className="flex flex-row items-center relative px-4 sm:px-6">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></div>
                <CardTitle className="text-sm sm:text-base text-blue-700 dark:text-blue-300">
                  Upcoming Appointments
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Future appointments scheduled beyond today.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="hidden sm:block">
                {/* Desktop Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Patient</TableHead>
                      {user.role === 'admin' && (
                        <TableHead className="text-xs sm:text-sm">Doctor</TableHead>
                      )}
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {futureAppointments.length > 0 ? (
                      futureAppointments.map(appointment => (
                        <TableRow key={appointment._id}>
                          <TableCell className="py-3">
                            <div className="font-medium text-sm">{getPatientName(appointment.patientId)}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {appointment.service}
                            </div>
                          </TableCell>
                          {user.role === 'admin' && (
                            <TableCell className="py-3 text-sm">
                              {appointment.doctor}
                            </TableCell>
                          )}
                          <TableCell className="py-3 text-sm">
                            {formatDate(new Date(appointment.date), 'MMM d')}
                          </TableCell>
                          <TableCell className="text-right py-3 text-sm whitespace-nowrap">
                            {formatTime12h(appointment.time)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={user.role === 'admin' ? 4 : 3} className="h-24 text-center">
                          No upcoming appointments.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-3">
                {futureAppointments.length > 0 ? (
                  futureAppointments.map(appointment => (
                    <div key={appointment._id} className="border rounded-lg p-3 bg-gradient-to-r from-info/5 to-transparent">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{getPatientName(appointment.patientId)}</div>
                          <div className="text-xs text-muted-foreground">{appointment.service}</div>
                          {user.role === 'admin' && (
                            <div className="text-xs text-muted-foreground">Dr. {appointment.doctor}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatTime12h(appointment.time)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(new Date(appointment.date), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                    No upcoming appointments.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )







}




