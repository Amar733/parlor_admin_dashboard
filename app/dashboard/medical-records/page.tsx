
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BloodReport, Prescription, Patient } from '@/lib/data';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/lib/asset-utils';
import { MoreHorizontal, PlusCircle, Trash, Undo, Trash2, FileDown, Loader2, Stethoscope, UploadCloud, FileText, Beaker, Check, ChevronsUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';
import { useRef } from 'react';

type RecordType = 'blood-report' | 'prescription';

export default function MedicalRecordsPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();

  const [bloodReports, setBloodReports] = useState<BloodReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadRecordType, setUploadRecordType] = useState<RecordType>('blood-report');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [reportsRes, prescriptionsRes, patientsRes] = await Promise.all([
        authFetch('/api/blood-reports'),
        authFetch('/api/prescriptions'),
        authFetch('/api/patients'),
      ]);
      if (!reportsRes.ok) throw new Error("Failed to fetch blood reports");
      if (!prescriptionsRes.ok) throw new Error("Failed to fetch prescriptions");
      if (!patientsRes.ok) throw new Error("Failed to fetch patients");
      
      const reportsData = await reportsRes.json();
      const prescriptionsData = await prescriptionsRes.json();
      const patientsData = await patientsRes.json();
      
      setBloodReports(Array.isArray(reportsData) ? reportsData : []);
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
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
        fetchData();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchData, can]);
  
  const handleOpenUploadDialog = (type: RecordType) => {
    setUploadRecordType(type);
    setIsUploadDialogOpen(true);
  }

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
    
    const endpoint = uploadRecordType === 'blood-report' ? '/api/blood-reports' : '/api/prescriptions';

    try {
      const response = await authFetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload ${uploadRecordType}.`);
      }
      
      toast({ title: "Success", description: `${uploadRecordType === 'blood-report' ? 'Report' : 'Prescription'} uploaded successfully.` });
      handleUploadDialogChange(false);
      await fetchData();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    } finally {
      setIsUploading(false);
    }
  }

  const handleAction = async (action: 'soft-delete' | 'restore' | 'permanent-delete', type: RecordType, id: string) => {
    setProcessingId(id);
    let url = '';
    let method = 'POST';
    if (action === 'soft-delete') {
      url = `/api/${type === 'blood-report' ? 'blood-reports' : 'prescriptions'}/${id}`;
      method = 'DELETE';
    } else if (action === 'restore') {
      url = `/api/${type === 'blood-report' ? 'blood-reports' : 'prescriptions'}/${id}/restore`;
    } else if (action === 'permanent-delete') {
      url = `/api/${type === 'blood-report' ? 'blood-reports' : 'prescriptions'}/${id}/permanent`;
      method = 'DELETE';
    }

    try {
      const res = await authFetch(url, { method });
      if(!res.ok) throw new Error(`Failed to ${action.replace('-', ' ')} record.`);
      toast({ title: 'Success', description: 'Action completed successfully.'});
      fetchData();
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
    } finally {
      setProcessingId(null);
    }
  }

  const sortedPatients = useMemo(() => 
    [...patients].filter(p => !p.deletedAt).sort((a, b) => a.firstName.localeCompare(b.firstName)), 
  [patients]);

  const filteredPatients = useMemo(() =>
    sortedPatients.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.contact}`.toLowerCase().includes(patientSearch.toLowerCase())
    ),
    [sortedPatients, patientSearch]
  );

  const selectedPatient = sortedPatients.find(p => p._id === selectedPatientId);

  const filterAndSortRecords = (records: (BloodReport | Prescription)[]) => {
    const activePatientIds = new Set(patients.filter(p => !p.deletedAt).map(p => p._id));
    return records
      .filter(record => {
        if (!showDeleted && !activePatientIds.has(record.patientId)) {
          return false;
        }

        if (showDeleted ? !record.deletedAt : record.deletedAt) {
          return false;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const patient = patients.find(p => p._id === record.patientId);
        const patientMatch = patient 
            ? patient.contact.toLowerCase().includes(lowerCaseSearchTerm) ||
              `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(lowerCaseSearchTerm)
            : false;
        return patientMatch || record.fileName.toLowerCase().includes(lowerCaseSearchTerm);
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  };

  const filteredBloodReports = useMemo(() => filterAndSortRecords(bloodReports), [bloodReports, patients, showDeleted, searchTerm]);
  const filteredPrescriptions = useMemo(() => filterAndSortRecords(prescriptions), [prescriptions, patients, showDeleted, searchTerm]);


  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderTable = (type: RecordType, data: (BloodReport | Prescription)[]) => (
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
        ) : data.length > 0 ? (
          data.map((record) => {
            const isProcessing = processingId === record._id;
            return (
            <TableRow key={record._id} className={cn(record.deletedAt && "bg-muted/50 text-muted-foreground")}>
              <TableCell className="font-medium">{record.patientName}</TableCell>
              <TableCell>
                <a href={getAssetUrl(record.fileUrl)} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                  {record.fileName}
                </a>
              </TableCell>
              <TableCell className="hidden md:table-cell">{record.uploadedBy}</TableCell>
              <TableCell>{format(new Date(record.createdAt!), 'PP')}</TableCell>
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
                            <a href={getAssetUrl(record.fileUrl)} download={record.fileName}><FileDown className="mr-2 h-4 w-4" />Download</a>
                          </DropdownMenuItem>
                          {record.deletedAt ? (
                            <>
                              {can('edit', pathname) && (
                                <DropdownMenuItem onClick={() => handleAction('restore', type, record._id)}>
                                  <Undo className="mr-2 h-4 w-4" />Restore
                                </DropdownMenuItem>
                              )}
                              {can('delete', pathname) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                        <Trash2 className="mr-2 h-4 w-4" />Delete Permanently
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the record.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAction('permanent-delete', type, record._id)} className={cn(buttonVariants({ variant: "destructive" }))}>Yes, delete permanently</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {can('delete', pathname) && (
                                <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                      <Trash className="mr-2 h-4 w-4" />Move to Bin
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Move to Bin?</AlertDialogTitle><AlertDialogDescription>This will move the record to the bin. You can restore it later.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleAction('soft-delete', type, record._id)}>Move to Bin</AlertDialogAction></AlertDialogFooter>
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
          )})
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <> No records found.</>}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
       <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload {uploadRecordType === 'blood-report' ? 'Blood Report' : 'Prescription'}</DialogTitle>
            <DialogDescription>
              Select a patient and the file to upload.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Search patient..."
                    value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.contact})` : patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      setSelectedPatientId("");
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    autoComplete="off"
                  />
                  {selectedPatient && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSelectedPatientId("");
                        setPatientSearch("");
                        setDropdownOpen(true);
                        inputRef.current?.focus();
                      }}
                      aria-label="Clear selection"
                    >
                      ×
                    </button>
                  )}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto border rounded-md bg-background shadow-sm"
                    >
                      {filteredPatients.length === 0 ? (
                        <div className="p-2 text-muted-foreground text-sm">No patient found.</div>
                      ) : (
                        filteredPatients.map((p, idx) => (
                          <div
                            key={p._id}
                            className={`px-3 py-2 cursor-pointer hover:bg-accent rounded-sm ${selectedPatientId === p._id ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => {
                              setSelectedPatientId(p._id);
                              setPatientSearch("");
                              setDropdownOpen(false);
                            }}
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedPatientId(p._id);
                                setPatientSearch("");
                                setDropdownOpen(false);
                              }
                              if (e.key === 'Escape') setDropdownOpen(false);
                            }}
                            role="option"
                            aria-selected={selectedPatientId === p._id}
                          >
                            {p.firstName} {p.lastName} ({p.contact})
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <input type="hidden" name="patient" value={selectedPatientId} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-file">{uploadRecordType === 'blood-report' ? 'Report' : 'Prescription'} File</Label>
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
            <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
            <p className="text-muted-foreground">Manage patient blood reports and prescriptions.</p>
        </div>
      </div>

      <Tabs defaultValue="blood-reports">
        <div className='flex justify-between items-end'>
            <TabsList>
                <TabsTrigger value="blood-reports">
                    <Beaker className="mr-2 h-4 w-4" /> Blood Reports
                </TabsTrigger>
                <TabsTrigger value="prescriptions">
                    <FileText className="mr-2 h-4 w-4" /> Prescriptions
                </TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Search by patient name, number, or filename..." 
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                    <Switch id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                    <Label htmlFor="show-deleted">Show Bin</Label>
                </div>
            </div>
        </div>
        <TabsContent value="blood-reports">
            <Card>
                <CardHeader>
                    <CardTitle>Blood Reports</CardTitle>
                    <CardDescription>A list of all patient blood reports.</CardDescription>
                    {can('edit', pathname) && (
                        <div className="flex justify-end">
                        <Button onClick={() => handleOpenUploadDialog('blood-report')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Upload Report
                        </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {renderTable('blood-report', filteredBloodReports)}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="prescriptions">
            <Card>
                <CardHeader>
                    <CardTitle>Prescriptions</CardTitle>
                    <CardDescription>A list of all patient prescriptions.</CardDescription>
                    {can('edit', pathname) && (
                        <div className="flex justify-end">
                        <Button onClick={() => handleOpenUploadDialog('prescription')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Upload Prescription
                        </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {renderTable('prescription', filteredPrescriptions)}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
