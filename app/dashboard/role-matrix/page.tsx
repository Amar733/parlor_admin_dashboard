"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit, PlusCircle, Check, X, Loader2, Stethoscope } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { allPermissions } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";

// Convert backend role format to frontend format
const convertBackendRole = (backendRole: any) => ({
  id: backendRole._id,
  name: backendRole.role_name,
  permissions: backendRole.allpermissions.flatMap((perm: any) =>
    perm.actions.map((action: string) => ({
      resource: perm.id,
      action: action,
    }))
  ),
});

// Convert frontend role format to backend format
const convertFrontendRole = (frontendRole: Role) => {
  // Group permissions by resource
  const permissionGroups: { [key: string]: string[] } = {};
  
  frontendRole.permissions.forEach((perm) => {
    if (!permissionGroups[perm.resource]) {
      permissionGroups[perm.resource] = [];
    }
    permissionGroups[perm.resource].push(perm.action);
  });

  // Convert to backend format
  const allpermissions = Object.entries(permissionGroups).map(([resource, actions]) => {
    const permission = allPermissions.find(p => p._id === resource);
    return {
      id: resource,
      label: permission?.label || resource,
      actions: actions,
    };
  });

  return {
    role_name: frontendRole.name,
    allpermissions: allpermissions,
  };
};

// Flatten allPermissions for checkbox display
const FLATTENED_PERMISSIONS = allPermissions.flatMap((perm) =>
  perm.actions.map((action) => ({
    resource: perm._id,
    label: perm.label,
    action,
    key: `${perm._id}:${action}`,
  }))
);

export type Role = {
  id?: string;
  name: string;
  permissions: { resource: string; action: string }[];
};

export default function RoleMatrixPage() {
  const { toast } = useToast();
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [rolePermissions, setRolePermissions] = useState<{
    resource: string;
    action: string;
  }[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch roles from API
  const fetchRoles = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await authFetch('/api/role-matrix');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      const backendRoles = data.data || [];
      const convertedRoles = backendRoles.map(convertBackendRole);
      setRoles(convertedRoles);
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error fetching roles:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch roles. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else if (token) {
        fetchRoles();
      }
    }
  }, [user, authLoading, token, router, pathname, can]);

  const openCreateDialog = () => {
    setEditingRole(null);
    setRoleName("");
    setRolePermissions([]);
    setShowDialog(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRolePermissions(role.permissions);
    setShowDialog(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast({ variant: "destructive", title: "Role name required" });
      return;
    }

    if (!token) return;

    try {
      setSaving(true);
      const roleData = convertFrontendRole({
        name: roleName.trim().toLowerCase(), // always lowercase for backend
        permissions: rolePermissions,
      });

      if (editingRole) {
        // Update existing role
        const response = await authFetch(`/api/role-matrix/${editingRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleData),
        });
        if (!response.ok) throw new Error('Failed to update role');
        toast({ title: "Role updated successfully" });
      } else {
        // Create new role
        const response = await authFetch('/api/role-matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleData),
        });
        if (!response.ok) throw new Error('Failed to create role');
        toast({ title: "Role created successfully" });
      }

      // Refresh roles list
      await fetchRoles();
      setShowDialog(false);
    } catch (error: any) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error saving role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save role. Please try again.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!role.id || !token) return;

    try {
      const response = await authFetch(`/api/role-matrix/${role.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete role');
      toast({ title: `Role '${role.name}' deleted successfully` });
      
      // Refresh roles list
      await fetchRoles();
    } catch (error: any) {
      if (!(error as Error).message.includes('Session expired')) {
        console.error('Error deleting role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete role. Please try again.",
        });
      }
    }
  };

  const handlePermissionToggle = (permissionString: string) => {
    const [resource, action] = permissionString.split(':');
    const perm = { resource, action };
    
    setRolePermissions((prev) => {
      const exists = prev.some(
        (p) => p.resource === perm.resource && p.action === perm.action
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.resource === perm.resource && p.action === perm.action)
        );
      } else {
        return [...prev, perm];
      }
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
                Role Matrix
              </h1>
              <p className="text-slate-100 text-sm">
                Manage roles and assign permissions for your team
              </p>
            </div>
            {can('edit', pathname) && (
              <Button variant="secondary" onClick={openCreateDialog} className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
                <PlusCircle className="h-4 w-4 mr-2" /> Create Role
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading roles...</span>
        </div>
      ) : (
        <>
          {/* Role Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.sort((a, b) => a.name.localeCompare(b.name)).map((role, index) => (
          <Card key={role.name} className="animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize text-lg">{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</CardTitle>
                {(can('edit', pathname) || can('delete', pathname)) && (
                  <div className="flex gap-2">
                    {can('edit', pathname) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {can('delete', pathname) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Permissions: {role.permissions.length}
                  </span>
                </div>
                
                <div>  
                  {/* Permission Headers */}
                  <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 mb-2 pb-2 border-b">
                    <span className="text-xs font-medium text-muted-foreground">Page</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">View</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">Edit</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">Delete</span>
                  </div>
                  
                  <div className="space-y-1">
                    {allPermissions.sort((a, b) => a.label.localeCompare(b.label)).map((page, pageIndex) => {
                      const hasView = role.permissions.some(p => p.resource === page._id && p.action === 'view');
                      const hasEdit = role.permissions.some(p => p.resource === page._id && p.action === 'edit');
                      const hasDelete = role.permissions.some(p => p.resource === page._id && p.action === 'delete');
                      return (
                        <React.Fragment key={`${role.id || role.name}-${page._id}-${pageIndex}`}>
                          <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center text-xs">
                            <span className="font-medium truncate">{page.label}</span>
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
                
                {role.permissions.length === 0 && (
                  <div className="text-center py-4">
                    <span className="text-sm text-muted-foreground">No permissions assigned</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* No Roles Message */}
      {roles.length === 0 && !loading && (
        <div className="text-center py-12">
          <span className="text-muted-foreground">No roles found. Create your first role to get started.</span>
        </div>
      )}
      </>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Assign Permissions</Label>
              <div className="mt-2 rounded-md border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-[1fr_70px_70px_70px] p-2 bg-muted sticky top-0">
                  <h4 className="font-semibold text-sm px-2">Page</h4>
                  <h4 className="font-semibold text-sm text-center">View</h4>
                  <h4 className="font-semibold text-sm text-center">Edit</h4>
                  <h4 className="font-semibold text-sm text-center">Delete</h4>
                </div>
                <div className="divide-y">
                  {allPermissions.sort((a, b) => a.label.localeCompare(b.label)).map(p => (
                    <div key={p._id} className="grid grid-cols-[1fr_70px_70px_70px] items-center p-2">
                      <span className="font-medium text-sm px-2">{p.label}</span>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('view') ? (
                          <Checkbox
                            id={`perm-${p._id}:view`}
                            checked={rolePermissions.some((perm) => perm.resource === p._id && perm.action === 'view')}
                            onCheckedChange={() => handlePermissionToggle(`${p._id}:view`)}
                          />
                        ) : <span className='text-muted-foreground'>-</span>}
                      </div>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('edit') ? (
                          <Checkbox
                            id={`perm-${p._id}:edit`}
                            checked={rolePermissions.some((perm) => perm.resource === p._id && perm.action === 'edit')}
                            onCheckedChange={() => handlePermissionToggle(`${p._id}:edit`)}
                          />
                        ) : <span className='text-muted-foreground'>-</span>}
                      </div>
                      
                      <div className="flex justify-center">
                        {p.actions.includes('delete') ? (
                          <Checkbox
                            id={`perm-${p._id}:delete`}
                            checked={rolePermissions.some((perm) => perm.resource === p._id && perm.action === 'delete')}
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
              onClick={handleSaveRole}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Save Changes" : "Create Role"}
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






