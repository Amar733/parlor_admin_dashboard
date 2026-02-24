"use client";

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, PlusCircle, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';

interface PayMode {
  _id: string;
  payType: string;
  deduction: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PayModePage() {
    const [payModes, setPayModes] = useState<PayMode[]>([]);
    const [newPayMode, setNewPayMode] = useState({ payType: '', deduction: '0' });
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ payType: '', deduction: '0' });
    const { authFetch, user, loading: authLoading } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading) {
            if (!can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchPayModes();
            }
        }
    }, [authLoading, can, pathname, router]);

    const fetchPayModes = async () => {
        try {
            const response = await authFetch('/api/finance/paytypes');
            const data = await response.json();
            if (data.success) {
                setPayModes(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch pay modes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPayMode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPayMode.payType.trim()) return;

        setIsAdding(true);
        try {
            const response = await authFetch('/api/finance/paytypes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payType: newPayMode.payType,
                    deduction: parseFloat(newPayMode.deduction) || 0
                })
            });
            const data = await response.json();
            if (data.success) {
                setPayModes([data.data, ...payModes]);
                setNewPayMode({ payType: '', deduction: '0' });
                toast({
                    title: "Success",
                    description: "Pay type added successfully",
                });
            }
        } catch (error) {
            console.error('Failed to add pay mode:', error);
            toast({
                title: "Error",
                description: "Failed to add pay type",
                variant: "destructive",
            });
        } finally {
            setIsAdding(false);
        }
    };

    const startEdit = (payMode: PayMode) => {
        setEditingId(payMode._id);
        setEditData({ payType: payMode.payType, deduction: payMode.deduction.toString() });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({ payType: '', deduction: '0' });
    };

    const saveEdit = async (id: string) => {
        if (!editData.payType.trim()) return;
        
        try {
            const response = await authFetch(`/api/finance/paytypes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payType: editData.payType,
                    deduction: parseFloat(editData.deduction) || 0
                })
            });
            const data = await response.json();
            if (data.success) {
                setPayModes(payModes.map(mode => 
                    mode._id === id ? { ...mode, payType: editData.payType, deduction: parseFloat(editData.deduction) || 0 } : mode
                ));
                setEditingId(null);
                setEditData({ payType: '', deduction: '0' });
                toast({
                    title: "Success",
                    description: "Pay type updated successfully",
                });
            }
        } catch (error) {
            console.error('Failed to update pay mode:', error);
            toast({
                title: "Error",
                description: "Failed to update pay type",
                variant: "destructive",
            });
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await authFetch(`/api/finance/paytypes/${id}/toggle-status`, {
                method: 'PATCH'
            });
            const data = await response.json();
            if (data.success) {
                setPayModes(payModes.map(mode => 
                    mode._id === id ? { ...mode, status: !currentStatus } : mode
                ));
                toast({
                    title: "Success",
                    description: `Pay type ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
                });
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const deletePayMode = async (id: string) => {
        try {
            const response = await authFetch(`/api/finance/paytypes/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setPayModes(payModes.filter(mode => mode._id !== id));
                toast({
                    title: "Success",
                    description: "Pay type deleted successfully",
                });
            }
        } catch (error) {
            console.error('Failed to delete pay mode:', error);
            toast({
                title: "Error",
                description: "Failed to delete pay type",
                variant: "destructive",
            });
        }
    };
    
    if (authLoading || !user || !can('view', pathname)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="w-full">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payment Modes</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">Manage payment types and their deductions.</p>
                </div>
            </div>

            {can('edit', pathname) && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg sm:text-xl">Add New Pay Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddPayMode} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            <div className="grid w-full items-center gap-1.5 flex-1">
                                <Label htmlFor="pay-type-name">Pay Type Name</Label>
                                <Input
                                    id="pay-type-name"
                                    value={newPayMode.payType}
                                    onChange={(e) => setNewPayMode(p => ({...p, payType: e.target.value}))}
                                    placeholder="e.g., Wallet"
                                    required
                                    disabled={isAdding}
                                    className="w-full"
                                />
                            </div>
                            <div className="grid w-full sm:w-32 items-center gap-1.5">
                                <Label htmlFor="deduction">Deduction (%)</Label>
                                <Input
                                    id="deduction"
                                    type="number"
                                    step="0.01"
                                    value={newPayMode.deduction}
                                    onChange={(e) => setNewPayMode(p => ({...p, deduction: e.target.value}))}
                                    required
                                    disabled={isAdding}
                                    className="w-full"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full sm:w-32">
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                <span className="ml-2">Add</span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Pay Types List</CardTitle>
                    <CardDescription>All configured payment modes.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View - Cards */}
                            <div className="sm:hidden space-y-3 p-4">
                                {payModes.map((mode, index) => (
                                    <div key={mode._id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-base">
                                                    {editingId === mode._id ? (
                                                        <Input
                                                            value={editData.payType}
                                                            onChange={(e) => setEditData(prev => ({...prev, payType: e.target.value}))}
                                                            className="h-8 text-base"
                                                        />
                                                    ) : (
                                                        mode.payType
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Deduction: {editingId === mode._id ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={editData.deduction}
                                                            onChange={(e) => setEditData(prev => ({...prev, deduction: e.target.value}))}
                                                            className="h-8 w-20 inline-block ml-2"
                                                        />
                                                    ) : (
                                                        `${mode.deduction.toFixed(2)}%`
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {can('edit', pathname) ? (
                                                    <Switch 
                                                        checked={mode.status}
                                                        onCheckedChange={() => toggleStatus(mode._id, mode.status)}
                                                        className="scale-75"
                                                    />
                                                ) : (
                                                    <span className={`text-xs font-medium ${mode.status ? 'text-green-600' : 'text-red-600'}`}>
                                                        {mode.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm">
                                            Created: {new Date(mode.createdAt).toLocaleDateString()}
                                        </div>
                                        {(can('edit', pathname) || can('delete', pathname)) && (
                                            <div className="flex justify-end gap-2 pt-2 border-t">
                                                {editingId === mode._id ? (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="h-8" onClick={() => saveEdit(mode._id)}>
                                                            <Check className="h-4 w-4 mr-1" /> Save
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8" onClick={cancelEdit}>
                                                            <X className="h-4 w-4 mr-1" /> Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {can('edit', pathname) && (
                                                            <Button variant="ghost" size="sm" className="h-8" onClick={() => startEdit(mode)}>
                                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                                            </Button>
                                                        )}
                                                        {can('delete', pathname) && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 text-destructive">
                                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="max-w-[95vw]">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Pay Type</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete "{mode.payType}"? This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                                                        <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => deletePayMode(mode._id)} className="w-full">
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden sm:block w-full overflow-x-auto">
                                <div className="min-w-[600px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">SlNo.</TableHead>
                                                <TableHead>Pay Type</TableHead>
                                                <TableHead className="w-24">Deduction (%)</TableHead>
                                                <TableHead className="w-20">Status</TableHead>
                                                <TableHead className="w-32">Created At</TableHead>
                                                {(can('edit', pathname) || can('delete', pathname)) && (
                                                    <TableHead className="w-32 text-right">Actions</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payModes.map((mode, index) => (
                                                <TableRow key={mode._id}>
                                                    <TableCell className="w-12">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {editingId === mode._id ? (
                                                            <Input
                                                                value={editData.payType}
                                                                onChange={(e) => setEditData(prev => ({...prev, payType: e.target.value}))}
                                                                className="h-8 w-full"
                                                            />
                                                        ) : (
                                                            mode.payType
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-24">
                                                        {editingId === mode._id ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={editData.deduction}
                                                                onChange={(e) => setEditData(prev => ({...prev, deduction: e.target.value}))}
                                                                className="h-8 w-20"
                                                            />
                                                        ) : (
                                                            mode.deduction.toFixed(2)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-20">
                                                        {can('edit', pathname) ? (
                                                            <Switch 
                                                                checked={mode.status}
                                                                onCheckedChange={() => toggleStatus(mode._id, mode.status)}
                                                            />
                                                        ) : (
                                                            <span className={`text-xs font-medium ${mode.status ? 'text-green-600' : 'text-red-600'}`}>
                                                                {mode.status ? 'Active' : 'Inactive'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="w-32">
                                                        <span className="text-sm">
                                                            {new Date(mode.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="w-32">
                                                        {(can('edit', pathname) || can('delete', pathname)) && (
                                                            editingId === mode._id ? (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEdit(mode._id)}>
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end gap-1">
                                                                    {can('edit', pathname) && (
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(mode)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                    {can('delete', pathname) && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete Pay Type</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure you want to delete "{mode.payType}"? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                                                                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={() => deletePayMode(mode._id)} className="w-full sm:w-auto">
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}