
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from '@/components/ui/switch';
import type { BloodReport, Patient } from '@/lib/data';
import { cn } from '@/lib/utils';
import { MoreHorizontal, PlusCircle, Trash, Undo, Trash2, FileDown, Beaker, Loader2, Stethoscope, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function BloodReportsPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [reports, setReports] = useState<BloodReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [reportsRes, patientsRes] = await Promise.all([
        authFetch('/api/blood-reports'),
        authFetch('/api/patients'),
      ]);
      if (!reportsRes.ok) throw new Error("Failed to fetch reports");
      if (!patientsRes.ok) throw new Error("Failed to fetch patients");
      const reportsData = await reportsRes.json();
      const patientsData = await patientsRes.json();
      setReports(reportsData);
      setPatients(patientsData);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, authFetch]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !can('view', pathname)) {
        router.push('/dashboard');
      } else if (token) {
        fetchReports();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchReports, can]);
  
  const handleUploadDialogChange = (open: boolean) => {
    setIsUploadDialogOpen(open);
    if (!open) {
      setSelectedPatientId('');
      setSelectedFile(null);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedFile || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a patient and a file.' });
      return;
    }
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patientId', selectedPatientId);
    
    try {
      const response = await authFetch('/api/blood-reports', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload report.');
      }
      
      toast({ title: "Success", description: "Report uploaded successfully." });
      handleUploadDialogChange(false);
      await fetchReports();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    } finally {
      setIsUploading(false);
    }
  }

  const handleSoftDelete = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await authFetch(`/api/blood-reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to move to bin');
      toast({ title: 'Success', description: 'Report moved to bin.' });
      fetchReports();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setProcessingId(null);
    }
  }
  
  const handleRestore = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await authFetch(`/api/blood-reports/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore report');
      toast({ title: 'Success', description: 'Report restored.' });
      fetchReports();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setProcessingId(null);
    }
  }
  
  const handlePermanentDelete = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await authFetch(`/api/blood-reports/${id}/permanent`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to permanently delete report');
      toast({ title: 'Success', description: 'Report permanently deleted.' });
      fetchReports();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setProcessingId(null);
    }
  }

  const sortedPatients = useMemo(() => 
    [...patients].sort((a, b) => a.firstName.localeCompare(b.firstName)), 
  [patients]);

  const filteredReports = useMemo(() =>
    reports
      .filter(report => {
        if (showDeleted ? !report.deletedAt : report.deletedAt) {
          return false;
        }
        return report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               report.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()),
  [reports, showDeleted, searchTerm]);


  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Blood Report</DialogTitle>
            <DialogDescription>
              Select a patient and the report file to upload.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId} required>
                    <SelectTrigger id="patient">
                        <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedPatients.map(p => (
                            <SelectItem key={p._id} value={p._id}>
                                {p.firstName} {p.lastName} ({p.contact})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-file">Report File</Label>
                <Input id="report-file" type="file" required onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Blood Reports</h1>
            <p className="text-muted-foreground">Manage and view all patient blood reports.</p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Upload Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Reports</CardTitle>
          <CardDescription>A list of all patient blood reports.</CardDescription>
          <div className="flex justify-between items-center pt-4">
            <Input 
              placeholder="Search by patient or filename..." 
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center space-x-2">
                <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                <Label htmlFor="show-deleted">Show Bin</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const isProcessing = processingId === report._id;
                  return (
                  <TableRow key={report._id} className={cn(report.deletedAt && "bg-muted/50 text-muted-foreground")}>
                    <TableCell className="font-medium">{report.patientName}</TableCell>
                    <TableCell>
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                        {report.fileName}
                      </a>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{report.uploadedBy}</TableCell>
                    <TableCell>{format(new Date(report.createdAt!), 'PP')}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <a href={report.fileUrl} download={report.fileName}><FileDown className="mr-2 h-4 w-4" />Download</a>
                                </DropdownMenuItem>
                                {report.deletedAt ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRestore(report._id)}>
                                      <Undo className="mr-2 h-4 w-4" />Restore
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                          <Trash2 className="mr-2 h-4 w-4" />Delete Permanently
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the report.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handlePermanentDelete(report._id)} className={cn(buttonVariants({ variant: "destructive" }))}>Yes, delete permanently</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                          <Trash className="mr-2 h-4 w-4" />Move to Bin
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Move to Bin?</AlertDialogTitle><AlertDialogDescription>This will move the report to the bin. You can restore it later.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleSoftDelete(report._id)}>Move to Bin</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Beaker className="mx-auto h-12 w-12 text-muted-foreground mb-4" /> No reports found.</>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
