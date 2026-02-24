
"use client";

import { useState, useEffect, useCallback } from 'react';
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
  DropdownMenuSeparator
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Coupon } from '@/lib/data';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Stethoscope, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';

export default function CouponsPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await authFetch('/api/coupons');
      if (!response.ok) throw new Error("Failed to fetch coupons");
      const data = await response.json();
      setCoupons(data);
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
      } else if(token) {
        fetchCoupons();
      }
    }
  }, [user, authLoading, token, router, pathname, fetchCoupons, can]);

  const handleAddNewClick = () => {
    setSelectedCoupon(null);
    setEditingCoupon({
      discountType: 'percentage',
      status: 'Active',
    });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!token) return;
    try {
      const response = await authFetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete coupon');
      toast({ title: "Success", description: "Coupon has been deleted." });
      await fetchCoupons();
    } catch (error) {
      if (!(error as Error).message.includes('Session expired')) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete coupon." });
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    
    try {
      const url = selectedCoupon ? `/api/coupons/${selectedCoupon._id}` : '/api/coupons';
      const method = selectedCoupon ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCoupon),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save coupon.');
      }
      
      toast({ title: "Success", description: `Coupon ${selectedCoupon ? 'updated' : 'created'} successfully.` });
      setIsDialogOpen(false);
      await fetchCoupons();
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
      setSelectedCoupon(null);
      setEditingCoupon({});
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
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{selectedCoupon ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
            <DialogDescription>
              {selectedCoupon ? 'Update the details for this coupon.' : 'Create a new discount coupon.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form id="coupon-form" onSubmit={handleSave} className="grid gap-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" value={editingCoupon.code || ''} onChange={(e) => setEditingCoupon(c => ({...c, code: e.target.value.toUpperCase()}))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Type</Label>
                <Select name="discountType" value={editingCoupon.discountType || 'percentage'} onValueChange={(value) => setEditingCoupon(c => ({...c, discountType: value as Coupon['discountType']}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Value</Label>
                <Input id="discount" name="discount" type="number" step="0.01" value={editingCoupon.discount || ''} onChange={(e) => setEditingCoupon(c => ({...c, discount: parseFloat(e.target.value)}))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" name="expiryDate" type="date" value={editingCoupon.expiryDate || ''} onChange={(e) => setEditingCoupon(c => ({...c, expiryDate: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={editingCoupon.status || 'Active'} onValueChange={(value) => setEditingCoupon(c => ({...c, status: value as Coupon['status']}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="coupon-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotions.</p>
        </div>
        {can('edit', pathname) && (
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Coupon
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon List</CardTitle>
          <CardDescription>A list of all active and expired coupons.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="hidden md:table-cell">Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                {(can('edit', pathname) || can('delete', pathname)) && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.status === 'Active' ? 'default' : 'outline'}>
                        {coupon.status}
                      </Badge>
                    </TableCell>
                    {(can('edit', pathname) || can('delete', pathname)) && (
                      <TableCell>
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
                              <DropdownMenuItem onClick={() => handleEditClick(coupon)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {can('delete', pathname) && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal relative">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the "{coupon.code}" coupon.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(coupon._id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No coupons found.
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
