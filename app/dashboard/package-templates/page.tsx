"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RichTextEditor } from "@/components/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  Stethoscope,
  Loader2,
  Package,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";

interface PackageTemplate {
  _id: string;
  packageName: string;
  services: Array<{
    _id: string;
    productName: string;
    sellingPrice: number;
  }>;
  numberOfTimes: number;
  frequencyInDays: number;
  price: number;
  doctorIds: Array<{
    _id: string;
    name: string;
  }>;
  description: string;
  status: boolean;
  createdAt: string;
}

interface Service {
  _id: string;
  productName: string;
  sellingPrice: number;
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

export default function PackageTemplatesPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();
  
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageTemplate | null>(null);
  const [editingPackage, setEditingPackage] = useState<Partial<PackageTemplate>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchPackages = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await authFetch("/api/packages/templates");
      if (!response.ok) throw new Error("Failed to fetch package templates");
      const result = await response.json();
      setPackages(result.data || []);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, authFetch]);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/products?page=1&limit=5000&type=Service");
      if (!response.ok) throw new Error("Failed to fetch services");
      const result = await response.json();
      const data = result.success ? result.data : result;
      setServices(data || []);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        console.error("Error fetching services:", error);
      }
    }
  }, [token, authFetch]);

  const fetchDoctors = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/users?role=doctor");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      setDoctors(data || []);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        console.error("Error fetching doctors:", error);
      }
    }
  }, [token, authFetch]);

  useEffect(() => {
    if (!authLoading) {
      if (!can("view", pathname)) {
        router.push("/dashboard");
      } else if (token) {
        fetchPackages();
        fetchServices();
        fetchDoctors();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchPackages, fetchServices, fetchDoctors, can]);

  const handleAddNewClick = () => {
    setSelectedPackage(null);
    setEditingPackage({ 
      services: [], 
      doctorIds: [], 
      numberOfTimes: 1, 
      frequencyInDays: 7,
      status: true 
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (pkg: PackageTemplate) => {
    setSelectedPackage(pkg);
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/packages/templates/${packageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete package template");
      toast({ title: "Success", description: "Package template has been deleted." });
      await fetchPackages();
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not delete package template.",
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const payload = {
        packageName: editingPackage.packageName,
        services: (editingPackage.services || []).map(s => s._id),
        numberOfTimes: editingPackage.numberOfTimes,
        frequencyInDays: editingPackage.frequencyInDays,
        price: editingPackage.price,
        doctorIds: (editingPackage.doctorIds || []).map(d => d._id),
        description: editingPackage.description,
      };

      const url = selectedPackage
        ? `/api/packages/templates/${selectedPackage._id}`
        : "/api/packages/templates";
      const method = selectedPackage ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save package template.");
      }

      toast({
        title: "Success",
        description: `Package template ${
          selectedPackage ? "updated" : "created"
        } successfully.`,
      });
      setIsDialogOpen(false);
      await fetchPackages();
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

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedPackage(null);
      setEditingPackage({});
    }
  };

  if (authLoading || !user || !can("view", pathname)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {selectedPackage ? "Edit Package Template" : "Add New Package Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedPackage
                ? "Update the details for this package template."
                : "Create a new package template for your clinic."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form
              id="package-form"
              onSubmit={handleSave}
              className="grid gap-4 p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  value={editingPackage.packageName || ""}
                  onChange={(e) =>
                    setEditingPackage((p) => ({ ...p, packageName: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={editingPackage.description || ""}
                  onChange={(newValue) =>
                    setEditingPackage((p) => ({ ...p, description: newValue }))
                  }
                  placeholder="Enter package description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfTimes">Number of Times</Label>
                  <Input
                    id="numberOfTimes"
                    type="number"
                    min="1"
                    value={editingPackage.numberOfTimes || ""}
                    onChange={(e) =>
                      setEditingPackage((p) => ({
                        ...p,
                        numberOfTimes: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencyInDays">Frequency (Days)</Label>
                  <Input
                    id="frequencyInDays"
                    type="number"
                    min="1"
                    value={editingPackage.frequencyInDays || ""}
                    onChange={(e) =>
                      setEditingPackage((p) => ({
                        ...p,
                        frequencyInDays: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={editingPackage.price || ""}
                  onChange={(e) =>
                    setEditingPackage((p) => ({
                      ...p,
                      price: parseFloat(e.target.value),
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Select Services</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <div key={service._id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`service-${service._id}`}
                          checked={(editingPackage.services || []).some(s => s._id === service._id)}
                          onCheckedChange={(checked) => {
                            const currentServices = editingPackage.services || [];
                            if (checked) {
                              setEditingPackage(p => ({
                                ...p,
                                services: [...currentServices, service]
                              }));
                            } else {
                              setEditingPackage(p => ({
                                ...p,
                                services: currentServices.filter(s => s._id !== service._id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`service-${service._id}`} className="text-sm font-normal">
                          {service.productName} (₹{service.sellingPrice})
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services available</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Doctors</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <div key={doctor._id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`doctor-${doctor._id}`}
                          checked={(editingPackage.doctorIds || []).some(d => d._id === doctor._id)}
                          onCheckedChange={(checked) => {
                            const currentDoctors = editingPackage.doctorIds || [];
                            if (checked) {
                              setEditingPackage(p => ({
                                ...p,
                                doctorIds: [...currentDoctors, doctor]
                              }));
                            } else {
                              setEditingPackage(p => ({
                                ...p,
                                doctorIds: currentDoctors.filter(d => d._id !== doctor._id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`doctor-${doctor._id}`} className="text-sm font-normal">
                          {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No doctors available</p>
                  )}
                </div>
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="package-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Package Templates
              </h1>
              <p className="text-gray-100 text-sm">
                Manage package templates for your clinic services
              </p>
            </div>
            {can("edit", pathname) && (
              <Button 
                onClick={handleAddNewClick}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                variant="secondary"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Package
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gray-400/20 rounded-full blur-2xl"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package Templates</CardTitle>
          <CardDescription>
            A list of all package templates with their services and pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead className="hidden md:table-cell">Services</TableHead>
                <TableHead>Times/Frequency</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell">Doctors</TableHead>
                <TableHead className="hidden xl:table-cell">Status</TableHead>
                {(can("edit", pathname) || can("delete", pathname)) && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={(can("edit", pathname) || can("delete", pathname)) ? 7 : 6}
                    className="h-24 text-center"
                  >
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">
                      {pkg.packageName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {pkg.services?.slice(0, 2).map((service) => (
                          <span key={service._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {service.productName}
                          </span>
                        ))}
                        {pkg.services?.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{pkg.services.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.numberOfTimes}x / {pkg.frequencyInDays}d
                    </TableCell>
                    <TableCell>₹{pkg.price?.toFixed(2)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {pkg.doctorIds && pkg.doctorIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pkg.doctorIds.slice(0, 2).map((doctor) => (
                            <span key={doctor._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {doctor.name}
                            </span>
                          ))}
                          {pkg.doctorIds.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{pkg.doctorIds.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No doctors assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs",
                        pkg.status 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {pkg.status ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    {(can("edit", pathname) || can("delete", pathname)) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {can("edit", pathname) && (
                              <DropdownMenuItem
                                onClick={() => handleEditClick(pkg)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {can("edit", pathname) && can("delete", pathname) && (
                              <DropdownMenuSeparator />
                            )}
                            {can("delete", pathname) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the "{pkg.packageName}"
                                      package template.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(pkg._id)}
                                      className={cn(
                                        buttonVariants({ variant: "destructive" })
                                      )}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={(can("edit", pathname) || can("delete", pathname)) ? 7 : 6}
                    className="text-center"
                  >
                    No package templates found.
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