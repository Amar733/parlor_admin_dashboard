"use client";

import { useState, useEffect } from 'react';
import { Supplier } from '@/lib/data';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Edit, Eye, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SuppliersTabProps {
    suppliers: Supplier[];
    onAdd: (data: Partial<Supplier>) => Promise<void>;
    onEdit: (id: string, data: Partial<Supplier>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    isLoading: boolean;
    authFetch: any;
    toast: any;
}

export default function SuppliersTab({ suppliers: initialSuppliers, onAdd, onEdit, onDelete, isLoading: parentLoading, authFetch, toast }: SuppliersTabProps) {
    const [newData, setNewData] = useState<Partial<Supplier>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
    
    // Local state for paginated suppliers
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageInput, setPageInput] = useState("1");
    const itemsPerPage = 10;

    // Fetch suppliers with pagination
    useEffect(() => {
        fetchSuppliers();
    }, [currentPage, searchTerm]);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...(searchTerm && { search: searchTerm })
            });
            
            const response = await authFetch(`/api/users/vendors?${params}`);
            const result = await response.json();
            if (result.success || Array.isArray(result.data)) {
                setSuppliers(result.data || []);
                setTotalPages(result.pagination?.totalPages || 1);
                setTotalItems(result.pagination?.totalItems || result.data?.length || 0);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch suppliers",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newData.name) {
            alert("Company name is required.");
            return;
        }
        setIsAdding(true);
        await onAdd(newData);
        setNewData({});
        setIsAdding(false);
        setIsAddDialogOpen(false);
        setCurrentPage(1);
        fetchSuppliers();
    };
    
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSupplier?._id) return;
        setIsAdding(true);
        await onEdit(editingSupplier._id, editingSupplier);
        setIsAdding(false);
        setIsEditDialogOpen(false);
        fetchSuppliers();
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await onDelete(id);
        setDeletingId(null);
        if (suppliers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            fetchSuppliers();
        }
    };
    
    const openEditDialog = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsEditDialogOpen(true);
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setPageInput(page.toString());
    };

    const handlePageInputChange = (value: string) => {
        setPageInput(value);
    };

    const handlePageInputSubmit = () => {
        const page = parseInt(pageInput);
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    const handlePageInputBlur = () => {
        const page = parseInt(pageInput);
        if (isNaN(page) || page < 1 || page > totalPages) {
            setPageInput(currentPage.toString());
        }
    };

    const handlePageInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    const fields = [
        { name: 'name', label: 'Company Name', required: true },
        { name: 'contactPerson', label: 'Contact Person Name' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Address' },
        { name: 'gstin', label: 'GST Number' },
        { name: 'pan', label: 'PAN' },
        { name: 'stateCode', label: 'State Code' },
        { name: 'creditDays', label: 'Credit Days', type: 'number', defaultValue: '' },
        { name: 'creditLimit', label: 'Credit Limit', type: 'number', defaultValue: '' },
        { name: 'openingBalance', label: 'Opening Balance', type: 'number', defaultValue: '' },
    ];

    return (
        <>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {fields.map(field => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>{field.label}</Label>
                                <Input
                                    id={field.name}
                                    placeholder={field.label}
                                    value={(newData[field.name as keyof Supplier] as string) || field.defaultValue || ''}
                                    onChange={(e) => setNewData(prev => ({ ...prev, [field.name]: field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value) || 0) : e.target.value }))}
                                    required={field.required}
                                    type={field.type || 'text'}
                                    step={field.type === 'number' ? '0.01' : undefined}
                                />
                            </div>
                        ))}
                        <DialogFooter className="md:col-span-2 pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isAdding}>
                                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Supplier
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Supplier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {fields.map(field => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={`edit-${field.name}`}>{field.label}</Label>
                                <Input
                                    id={`edit-${field.name}`}
                                    placeholder={field.label}
                                    value={(editingSupplier?.[field.name as keyof Supplier] as string) || field.defaultValue || ''}
                                    onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, [field.name]: field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value) || 0) : e.target.value }) : null)}
                                    required={field.required}
                                    type={field.type || 'text'}
                                    step={field.type === 'number' ? '0.01' : undefined}
                                />
                            </div>
                        ))}
                        <DialogFooter className="md:col-span-2 pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isAdding}>
                                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewingSupplier?.companyName || viewingSupplier?.name}</DialogTitle>
                        <DialogDescription>Full supplier details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Contact Person</span>
                            <span className="col-span-2">{viewingSupplier?.name || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Phone</span>
                            <span className="col-span-2">{viewingSupplier?.phone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Email</span>
                            <span className="col-span-2">{viewingSupplier?.email || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-start gap-4">
                            <span className="text-muted-foreground">Address</span>
                            <span className="col-span-2 whitespace-pre-wrap">{viewingSupplier?.address || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">GST Number</span>
                            <span className="col-span-2">{viewingSupplier?.gstNumber || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">PAN</span>
                            <span className="col-span-2">{viewingSupplier?.pan || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Credit Days</span>
                            <span className="col-span-2">{viewingSupplier?.creditDays || 0}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-muted-foreground">Credit Limit</span>
                            <span className="col-span-2">₹{(viewingSupplier?.creditLimit || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setViewingSupplier(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="w-full min-w-0">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Suppliers</CardTitle>
                            <CardDescription>Manage your product suppliers.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Supplier
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search suppliers..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" onClick={handleReset} disabled={!searchTerm}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-auto h-96 border-t">
                        <table className="w-full border-collapse">
                            <thead className="bg-muted sticky top-0 z-10">
                                <tr>
                                    <th className="text-left p-3 font-medium border-b min-w-[150px]">Company Name</th>
                                    <th className="text-left p-3 font-medium border-b min-w-[120px]">Contact Person</th>
                                    <th className="text-left p-3 font-medium border-b min-w-[100px]">Phone</th>
                                    <th className="text-left p-3 font-medium border-b min-w-[180px]">Email</th>
                                    <th className="text-right p-3 font-medium border-b min-w-[80px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={5} className="text-center h-24 p-3"><Loader2 className="animate-spin mx-auto" /></td></tr>
                                ) : Array.isArray(suppliers) ? suppliers.map((item) => (
                                    <tr key={item._id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 truncate max-w-[150px]" title={item.companyName || item.name}>{item.companyName || item.name}</td>
                                        <td className="p-3 truncate max-w-[120px]" title={item.name || '-'}>{item.name || '-'}</td>
                                        <td className="p-3 truncate max-w-[100px]" title={item.phone || '-'}>{item.phone || '-'}</td>
                                        <td className="p-3 truncate max-w-[180px]" title={item.email || '-'}>{item.email || '-'}</td>
                                        <td className="p-3 text-right space-x-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingSupplier(item)}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}>
                                                {deletingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center h-24 p-3">No suppliers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {suppliers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center space-x-1">
                                <span className="text-sm">Page</span>
                                <Input
                                    type="text"
                                    value={pageInput}
                                    onChange={(e) => handlePageInputChange(e.target.value)}
                                    onBlur={handlePageInputBlur}
                                    onFocus={handlePageInputFocus}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handlePageInputSubmit();
                                        }
                                    }}
                                    className="w-16 h-8 text-center text-sm"
                                />
                                <span className="text-sm">of {totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}