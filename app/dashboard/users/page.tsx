"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { ManagedUser, allPermissions } from '@/lib/data';
import { useAuth, type User } from '@/hooks/use-auth';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Stethoscope, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { getAssetUrl } from '@/lib/asset-utils';

// Define Role type to match backend
// FIX: Use correct type for allpermissions
export type Role = {
  _id: string;
  role_name: string;
  allpermissions: { id: string; label: string; actions: string[] }[];
};

// Helper to convert role permissions to user permission strings
function rolePermissionsToUserPermissions(role: Role): string[] {
  return role.allpermissions.flatMap(perm =>
    perm.actions.map(action => `${perm.id}:${action}`)
  );
}

export default function UsersPage() {
  const { user, token, authFetch, loading: authLoading, updateUserContext } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('custom');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<ManagedUser>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await authFetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: "Could not load user data." });
       }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, authFetch]);

  const fetchRoles = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoadingRoles(true);
      const response = await authFetch('/api/role-matrix');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: "Could not load roles data." });
       }
    } finally {
      setIsLoadingRoles(false);
    }
  }, [token, toast, authFetch]);

  // Convert backend permission format to frontend format

  const convertBackendToFrontendPermissions = (backendPermissions: any[]): string[] => {
    return backendPermissions.flatMap(perm =>
      perm.actions.map((action: string) => `${perm.id}:${action}`)
    );
  };

  // Handle role selection change
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    if (roleId && roleId !== 'custom' && roleId !== 'loading') {
      const role = roles.find(r => r._id === roleId);
      if (role) {
        setUserPermissions(rolePermissionsToUserPermissions(role));
        setEditingUser(u => ({ ...u, role: role.role_name }));
      }
    } else {
      setUserPermissions([]);
      setEditingUser(u => ({ ...u, role: undefined }));
    }
  };

  // Handle individual permission toggle
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setUserPermissions(prev => {
      if (checked) {
        return [...prev, permissionId];
      } else {
        return prev.filter(p => p !== permissionId);
      }
    });
  };

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else if (token) {
        fetchUsers();
        fetchRoles();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchUsers, fetchRoles, can]);
  
  // Sync selectedRole with editingUser.role when dialog opens or editingUser changes
  useEffect(() => {
    if (isDialogOpen && editingUser.role) {
      // Find role template with matching name
      const matchedRole = roles.find(r => r.role_name === editingUser.role);
      if (matchedRole) {
        setSelectedRole(matchedRole._id);
        // Merge role template permissions with any extra user permissions
        const rolePerms = rolePermissionsToUserPermissions(matchedRole);
        const extraPerms = (editingUser.permissions || []).filter(p => !rolePerms.includes(p));
        setUserPermissions([...rolePerms, ...extraPerms]);
      } else {
        setSelectedRole('custom');
        setUserPermissions(editingUser.permissions || []);
      }
    }
  }, [isDialogOpen, editingUser.role, editingUser.permissions, roles]);

  const handleAddNewClick = () => {
    setSelectedUser(null);
    setEditingUser({
      role: undefined,
      permissions: []
    });
    setSelectedRole('custom');
    setUserPermissions([]);
    setAvatarPreview(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (userToEdit: ManagedUser) => {
    setSelectedUser(userToEdit);
    setEditingUser(userToEdit);
    setSelectedRole('custom');
    setUserPermissions(userToEdit.permissions || []);
    setAvatarPreview(getAssetUrl(userToEdit.avatarUrl));
    setIsDialogOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await authFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const { url } = await response.json();
        setAvatarPreview(url);
        setEditingUser(u => ({ ...u, avatarUrl: url }));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/users/${userId}`, { 
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      toast({ title: "Success", description: "User has been deleted." });
      await fetchUsers();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete user." });
      }
    }
  };
  
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Use userPermissions state instead of form data for permissions
    const permissions = userPermissions;

    const password = formData.get('password') as string;

    // Determine role to send in payload
    let roleToSend: string = editingUser.role || "staff"; // default to 'staff' if not set
    if (selectedRole && selectedRole !== 'custom' && selectedRole !== 'loading') {
      const selectedRoleObj = roles.find(r => r._id === selectedRole);
      if (selectedRoleObj) {
        roleToSend = selectedRoleObj.role_name;
      }
    }

    const userData: Partial<ManagedUser> = { ...editingUser };
    userData.name = formData.get('name') as string;
    userData.email = formData.get('email') as string;
    userData.phone = formData.get('phone') as string;
    userData.role = roleToSend;
    userData.specialization = formData.get('specialization') as string;
    userData.bio = formData.get('bio') as string;
    userData.permissions = permissions;

    if (password) {
      userData.password = password;
    } else {
      delete userData.password;
    }
    
    try {
      const url = selectedUser ? `/api/users/${selectedUser._id}` : '/api/users';
      const method = selectedUser ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user.');
      }
      
      const savedUser: ManagedUser = await response.json();
      
      toast({ title: "Success", description: `User ${selectedUser ? 'updated' : 'created'} successfully.` });
      
      if (user && user.email === savedUser.email) {
        const contextUser: User = {
          _id: savedUser._id,
          id: savedUser.id, // Ensure compatibility with existing code
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          avatarUrl: savedUser.avatarUrl,
          permissions: savedUser.permissions,
        };
        updateUserContext(contextUser);
      }

      handleDialogChange(false);
      await fetchUsers();
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
         toast({ variant: "destructive", title: "Error", description: (error as Error).message });
       }
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
      setEditingUser({});
      setSelectedRole('custom');
      setUserPermissions([]);
      setAvatarPreview(null);
      setShowPassword(false);
    }
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
       <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90vh]">
            <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedUser ? 'Update user details and permissions.' : 'Add a new user and assign a role.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <form id="user-form" onSubmit={handleSave} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                      <Input id="name" name="name" defaultValue={editingUser.name} required className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
                      <Input id="email" name="email" type="email" defaultValue={editingUser.email} required className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" defaultValue={editingUser.phone} placeholder="+1 (555) 123-4567" className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password {!selectedUser && '*'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required={!selectedUser}
                          placeholder={selectedUser ? "Leave blank to keep current" : "Enter secure password"}
                          className="h-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {avatarPreview ? (
                        <Image 
                          src={getAssetUrl(avatarPreview)} 
                          alt="Avatar preview" 
                          width={80} 
                          height={80} 
                          className="rounded-full border-2 border-gray-200 object-cover" 
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input 
                        id="avatar" 
                        type="file" 
                        onChange={handleAvatarChange} 
                        accept="image/*" 
                        disabled={isUploading}
                        className="h-10"
                      />
                      {isUploading && (
                        <div className="flex items-center mt-2 text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                          Uploading...
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Upload a profile picture (JPG, PNG, max 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Role & Permissions */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Permissions</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleMatrix" className="text-sm font-medium text-gray-700">Role Template</Label>
                      <Select value={selectedRole} onValueChange={handleRoleChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a role template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom permissions</SelectItem>
                          {isLoadingRoles ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading roles...
                            </SelectItem>
                          ) : (
                            roles.map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-2" />
                                  {role.role_name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Select a role template to auto-fill permissions, then customize as needed.
                      </p>
                    </div>

                    {selectedRole && selectedRole !== 'custom' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-blue-800 text-sm">
                              Applied: {roles.find(r => r._id === selectedRole)?.role_name}
                            </span>
                            <p className="text-blue-600 text-xs mt-1">
                              You can modify these permissions below.
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const roleObj = roles.find(r => r._id === selectedRole);
                              if (roleObj) {
                                setUserPermissions(rolePermissionsToUserPermissions(roleObj));
                              }
                            }}
                          >
                            Reset to template
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h4 className="font-medium text-gray-900 text-sm">Permissions</h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 p-3 bg-gray-50 border-b text-xs font-medium text-gray-600 sticky top-0">
                          <span>Module</span>
                          <span className="text-center">View</span>
                          <span className="text-center">Edit</span>
                          <span className="text-center">Delete</span>
                        </div>
                        <div className="divide-y">
                          {allPermissions.map(p => (
                            <div key={p._id} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center p-3 hover:bg-gray-50">
                              <span className="font-medium text-sm text-gray-900">{p.label}</span>
                              <div className="flex justify-center">
                                {p.actions.includes('view') ? (
                                  <Checkbox
                                    id={`perm-${p._id}:view`}
                                    checked={userPermissions.includes(`${p._id}:view`)}
                                    onCheckedChange={(checked) => handlePermissionToggle(`${p._id}:view`, checked as boolean)}
                                  />
                                ) : <span className='text-gray-300'>-</span>}
                              </div>
                              <div className="flex justify-center">
                                {p.actions.includes('edit') ? (
                                  <Checkbox
                                    id={`perm-${p._id}:edit`}
                                    checked={userPermissions.includes(`${p._id}:edit`)}
                                    onCheckedChange={(checked) => handlePermissionToggle(`${p._id}:edit`, checked as boolean)}
                                  />
                                ) : <span className='text-gray-300'>-</span>}
                              </div>
                              <div className="flex justify-center">
                                {p.actions.includes('delete') ? (
                                  <Checkbox
                                    id={`perm-${p._id}:delete`}
                                    checked={userPermissions.includes(`${p._id}:delete`)}
                                    onCheckedChange={(checked) => handlePermissionToggle(`${p._id}:delete`, checked as boolean)}
                                  />
                                ) : <span className='text-gray-300'>-</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor-specific fields */}
                {editingUser.role === 'doctor' && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                      Doctor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">Specialization</Label>
                        <Input id="specialization" name="specialization" defaultValue={editingUser.specialization} className="h-10" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                        <Textarea id="bio" name="bio" defaultValue={editingUser.bio} rows={3} className="resize-none" />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-gray-50">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="mr-2">Cancel</Button>
              </DialogClose>
              <Button type="submit" form="user-form" disabled={isUploading || isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : (selectedUser ? "Update User" : "Create User")}
              </Button>
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
                User Management
              </h1>
              <p className="text-slate-100 text-sm">
                Manage users and their permissions
              </p>
            </div>
            {can('edit', pathname) && (
              <Button onClick={handleAddNewClick} variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
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
            User List
          </CardTitle>
          <CardDescription>A list of all users with access to the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image src={getAssetUrl(u.avatarUrl)} alt={u.name} width={40} height={40} className="rounded-full" data-ai-hint="person portrait" />
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      { (can('edit', pathname) || can('delete', pathname)) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {can('edit', pathname) && (
                                  <DropdownMenuItem onClick={() => handleEditClick(u)}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can('delete', pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative disabled:opacity-50" disabled={user?.email === u.email}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user account for {u.name}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(u._id)} className={cn(buttonVariants({variant: "destructive"}))}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
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
