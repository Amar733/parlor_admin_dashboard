"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit, PlusCircle, Check, X, Loader2, Stethoscope, UserPlus, Globe, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { allPermissions } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAssetUrl } from "@/lib/asset-utils";

interface Doctor {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  permissions: string[];
  specialization?: string;
  bio?: string;
  availableSlots?: string[];
}

export default function DoctorsPage() {
  const { toast } = useToast();
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [doctorBio, setDoctorBio] = useState("");
  const [doctorPermissions, setDoctorPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/users?role=doctor');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      setDoctors(data || []);
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error fetching doctors:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch doctors. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await authFetch('/api/role-matrix');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error fetching roles:', error);
      }
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else if (user) {
        fetchDoctors();
        fetchRoles();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  const openCreateDialog = () => {
    setEditingDoctor(null);
    setDoctorName("");
    setDoctorEmail("");
    setDoctorSpecialization("");
    setDoctorBio("");
    // Auto-assign doctor role permissions
    const doctorRole = roles.find(r => r.role_name === 'doctor');
    if (doctorRole) {
      const rolePermissions = doctorRole.allpermissions.flatMap((perm: any) =>
        perm.actions.map((action: string) => `${perm.id}:${action}`)
      );
      setDoctorPermissions(rolePermissions);
    } else {
      setDoctorPermissions([]);
    }
    setShowDialog(true);
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorName(doctor.name);
    setDoctorEmail(doctor.email);
    setDoctorSpecialization(doctor.specialization || "");
    setDoctorBio(doctor.bio || "");
    setDoctorPermissions(doctor.permissions);
    setShowDialog(true);
  };

  const handleSaveDoctor = async () => {
    if (!doctorName.trim() || !doctorEmail.trim()) {
      toast({ variant: "destructive", title: "Name and email are required" });
      return;
    }

    try {
      setSaving(true);
      const doctorData = {
        name: doctorName.trim(),
        email: doctorEmail.trim(),
        role: "doctor",
        specialization: doctorSpecialization.trim(),
        bio: doctorBio.trim(),
        permissions: doctorPermissions,
      };

      if (editingDoctor) {
        const response = await authFetch(`/api/users/${editingDoctor._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData),
        });
        if (!response.ok) throw new Error('Failed to update doctor');
        toast({ title: "Doctor updated successfully" });
      } else {
        const response = await authFetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData),
        });
        if (!response.ok) throw new Error('Failed to create doctor');
        toast({ title: "Doctor created successfully" });
      }

      await fetchDoctors();
      setShowDialog(false);
    } catch (error: any) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error saving doctor:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save doctor. Please try again.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    try {
      const response = await authFetch(`/api/users/${doctor._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete doctor');
      toast({ title: `Doctor '${doctor.name}' deleted successfully` });
      
      await fetchDoctors();
    } catch (error: any) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error deleting doctor:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete doctor. Please try again.",
        });
      }
    }
  };

  const handlePermissionToggle = (permissionString: string) => {
    setDoctorPermissions((prev) => {
      const exists = prev.includes(permissionString);
      if (exists) {
        return prev.filter(p => p !== permissionString);
      } else {
        return [...prev, permissionString];
      }
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const togglePermissions = (doctorId: string) => {
    setExpandedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(doctorId)) {
        newSet.delete(doctorId);
      } else {
        newSet.add(doctorId);
      }
      return newSet;
    });
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Doctors Management
              </h1>
              <p className="text-blue-100 text-sm">
                Manage doctors and assign permissions for your clinic
              </p>
            </div>
            {can('edit', pathname) && (
              <Button variant="secondary" onClick={openCreateDialog} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                <UserPlus className="h-4 w-4 mr-2" /> Add Doctor
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading doctors...</span>
        </div>
      ) : (
        <>
          {/* Doctor Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {doctors.sort((a, b) => a.name.localeCompare(b.name)).map((doctor, index) => (
              <Card key={doctor._id} className="animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getAssetUrl(doctor.avatarUrl)} alt={doctor.name} />
                      <AvatarFallback>{getInitials(doctor.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg whitespace-normal break-words">{doctor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground whitespace-normal break-words">{doctor.specialization}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/doctors/cms/${doctor._id}?name=${encodeURIComponent(doctor.name)}`)}>
                          <Globe className="mr-2 h-4 w-4" />
                          Dr CMS
                        </DropdownMenuItem>
                        {can('edit', pathname) && (
                          <DropdownMenuItem onClick={() => openEditDialog(doctor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {can('delete', pathname) && (
                          <DropdownMenuItem onClick={() => handleDeleteDoctor(doctor)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground whitespace-normal break-words">
                        Email: {doctor.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Permissions: {doctor.permissions.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePermissions(doctor._id)}
                        className="h-6 px-2"
                      >
                        {expandedPermissions.has(doctor._id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedPermissions.has(doctor._id) && (
                      <div>  
                        {/* Permission Headers */}
                        <div className="grid grid-cols-[1fr_repeat(3,minmax(40px,1fr))] gap-2 mb-2 pb-2 border-b">
                          <span className="text-xs font-medium text-muted-foreground">Page</span>
                          <span className="text-xs font-medium text-muted-foreground text-center">View</span>
                          <span className="text-xs font-medium text-muted-foreground text-center">Edit</span>
                          <span className="text-xs font-medium text-muted-foreground text-center">Delete</span>
                        </div>
                        
                        <div className="space-y-1">
                          {allPermissions.sort((a, b) => a.label.localeCompare(b.label)).map((page, pageIndex) => {
                            const hasView = doctor.permissions.includes(`${page._id}:view`);
                            const hasEdit = doctor.permissions.includes(`${page._id}:edit`);
                            const hasDelete = doctor.permissions.includes(`${page._id}:delete`);
                            return (
                              <React.Fragment key={`${doctor._id}-${page._id}-${pageIndex}`}>
                                <div className="grid grid-cols-[1fr_repeat(3,minmax(40px,1fr))] gap-2 items-center text-xs">
                                  <span className="font-medium truncate whitespace-normal break-words">{page.label}</span>
                                  {/* View Permission */}
                                  <div className="flex justify-center">
                                    {page.actions.includes('view') ? (
                                      hasView ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-500" />
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                  {/* Edit Permission */}
                                  <div className="flex justify-center">
                                    {page.actions.includes('edit') ? (
                                      hasEdit ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-500" />
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                  {/* Delete Permission */}
                                  <div className="flex justify-center">
                                    {page.actions.includes('delete') ? (
                                      hasDelete ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <X className="h-3 w-3 text-red-500" />
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                </div>
                                <div className="border-t"></div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {doctor.permissions.length === 0 && (
                      <div className="text-center py-4">
                        <span className="text-sm text-muted-foreground">No permissions assigned</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* No Doctors Message */}
          {doctors.length === 0 && !loading && (
            <div className="text-center py-12">
              <span className="text-muted-foreground">No doctors found. Add your first doctor to get started.</span>
            </div>
          )}
        </>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Edit Doctor" : "Add Doctor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Name</Label>
                <Input
                  id="doctorName"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Enter doctor name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="doctorEmail">Email</Label>
                <Input
                  id="doctorEmail"
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="Enter email"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="doctorSpecialization">Specialization</Label>
              <Input
                id="doctorSpecialization"
                value={doctorSpecialization}
                onChange={(e) => setDoctorSpecialization(e.target.value)}
                placeholder="Enter specialization"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="doctorBio">Bio</Label>
              <Textarea
                id="doctorBio"
                value={doctorBio}
                onChange={(e) => setDoctorBio(e.target.value)}
                placeholder="Enter bio"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Assign Permissions</Label>
              <div className="mt-2 rounded-md border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-[1fr_repeat(3,minmax(50px,1fr))] p-2 bg-muted sticky top-0">
                  <h4 className="font-semibold text-sm px-2">Page</h4>
                  <h4 className="font-semibold text-sm text-center">View</h4>
                  <h4 className="font-semibold text-sm text-center">Edit</h4>
                  <h4 className="font-semibold text-sm text-center">Delete</h4>
                </div>
                <div className="divide-y">
                  {allPermissions.sort((a, b) => a.label.localeCompare(b.label)).map(p => (
                    <div key={p._id} className="grid grid-cols-[1fr_repeat(3,minmax(50px,1fr))] items-center p-2">
                      <span className="font-medium text-sm px-2 whitespace-normal break-words">{p.label}</span>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('view') ? (
                          <Checkbox
                            id={`perm-${p._id}:view`}
                            checked={doctorPermissions.includes(`${p._id}:view`)}
                            onCheckedChange={() => handlePermissionToggle(`${p._id}:view`)}
                          />
                        ) : <span className='text-muted-foreground'>-</span>}
                      </div>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('edit') ? (
                          <Checkbox
                            id={`perm-${p._id}:edit`}
                            checked={doctorPermissions.includes(`${p._id}:edit`)}
                            onCheckedChange={() => handlePermissionToggle(`${p._id}:edit`)}
                          />
                        ) : <span className='text-muted-foreground'>-</span>}
                      </div>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('delete') ? (
                          <Checkbox
                            id={`perm-${p._id}:delete`}
                            checked={doctorPermissions.includes(`${p._id}:delete`)}
                            onCheckedChange={() => handlePermissionToggle(`${p._id}:delete`)}
                          />
                        ) : <span className='text-muted-foreground'>-</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button 
              variant="default" 
              onClick={handleSaveDoctor}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDoctor ? "Save Changes" : "Add Doctor"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}









