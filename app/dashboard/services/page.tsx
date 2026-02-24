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
import { MagicTextarea } from "@/components/magic-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Service } from "@/lib/data";
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  Stethoscope,
  Loader2,
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
export default function ServicesPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await authFetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data);
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
      console.log("User permissions:", user?.permissions);
      if (!can("view", pathname)) {
        router.push("/dashboard");
      } else if (token) {
        fetchServices();
        fetchDoctors();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchServices]);

  const handleAddNewClick = () => {
    setSelectedService(null);
    setEditingService({ doctor_ids: [] });
    setIsDialogOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete service");
      toast({ title: "Success", description: "Service has been deleted." });
      await fetchServices();
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not delete service.",
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      const url = selectedService
        ? `/api/services/${selectedService.id}`
        : "/api/services";
      const method = selectedService ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save service.");
      }

      toast({
        title: "Success",
        description: `Service ${
          selectedService ? "updated" : "created"
        } successfully.`,
      });
      setIsDialogOpen(false);
      await fetchServices();
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
      setSelectedService(null);
      setEditingService({});
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
        <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {selectedService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? "Update the details for this service."
                : "Add a new service offered by the clinic."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form
              id="service-form"
              onSubmit={handleSave}
              className="grid gap-4 p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editingService.name || ""}
                  onChange={(e) =>
                    setEditingService((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <MagicTextarea
                  id="description"
                  value={editingService.description || ""}
                  onValueChange={(newValue) =>
                    setEditingService((s) => ({ ...s, description: newValue }))
                  }
                  required
                  aiContext="a description for a medical or cosmetic service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={editingService.price || ""}
                  onChange={(e) =>
                    setEditingService((s) => ({
                      ...s,
                      price: parseFloat(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Doctors</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <div key={doctor._id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`doctor-${doctor._id}`}
                          checked={(editingService.doctor_ids || []).some(id => 
                            typeof id === 'string' ? id === doctor._id : id._id === doctor._id
                          )}
                          onCheckedChange={(checked) => {
                            const currentIds = editingService.doctor_ids || [];
                            if (checked) {
                              setEditingService(s => ({
                                ...s,
                                doctor_ids: [...currentIds, doctor._id]
                              }));
                            } else {
                              setEditingService(s => ({
                                ...s,
                                doctor_ids: currentIds.filter(id => 
                                  typeof id === 'string' ? id !== doctor._id : id._id !== doctor._id
                                )
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
            <Button type="submit" form="service-form" disabled={isSaving}>
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
                Services
              </h1>
              <p className="text-gray-100 text-sm">
                Manage the services offered by your clinic
              </p>
            </div>
            {can("edit", pathname) && (
              <Button 
                onClick={handleAddNewClick}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                variant="secondary"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gray-400/20 rounded-full blur-2xl"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service List</CardTitle>
          <CardDescription>
            A list of all services, their descriptions, and prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Assigned Doctors
                </TableHead>
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
                    colSpan={(can("edit", pathname) || can("delete", pathname)) ? 5 : 4}
                    className="h-24 text-center"
                  >
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-sm truncate">
                      {service.description}
                    </TableCell>
                    <TableCell>₹{service.price.toFixed(2)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {service.doctor_ids && service.doctor_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {service.doctor_ids.map((doctorItem, index) => {
                            const doctorName = typeof doctorItem === 'string' 
                              ? doctors.find(d => d._id === doctorItem)?.name 
                              : doctorItem.name;
                            const doctorId = typeof doctorItem === 'string' ? doctorItem : doctorItem._id;
                            return doctorName ? (
                              <span key={doctorId || index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {doctorName}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No doctors assigned</span>
                      )}
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
                                onClick={() => handleEditClick(service)}
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
                                      permanently delete the "{service.name}"
                                      service.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(service.id)}
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
                    colSpan={(can("edit", pathname) || can("delete", pathname)) ? 5 : 4}
                    className="text-center"
                  >
                    No services found.
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
