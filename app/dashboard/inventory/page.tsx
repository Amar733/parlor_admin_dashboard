

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, isBefore, addDays } from 'date-fns';
import {
    Product,
    ProductBrand,
    ProductCategory,
    ProductLocation,
    ProductUnit,
    StockAdjustment,
} from '@/lib/data';

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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Loader2, PlusCircle, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const ManageTaxonomy = ({
    title,
    items,
    onAdd,
    onDelete,
    onEdit,
    onToggleStatus,
    addFields,
    isLoading,
    showStatus = false,
}: {
    title: string;
    items: { id: string; [key: string]: any }[];
    onAdd: (data: { [key: string]: string | null }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onEdit?: (id: string, data: { [key: string]: string | null }) => Promise<void>;
    onToggleStatus?: (id: string) => Promise<void>;
    addFields: { name: string; label: string; required?: boolean, type?: string, options?: {value: string, label: string}[] }[];
    isLoading: boolean;
    showStatus?: boolean;
}) => {
    const [newData, setNewData] = useState<{ [key: string]: string | null }>({});
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ [key: string]: string | null }>({});

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        await onAdd(newData);
        setNewData({});
        setIsAdding(false);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await onDelete(id);
        setDeletingId(null);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !onEdit) return;
        setIsAdding(true);
        await onEdit(editingId, editData);
        setEditingId(null);
        setEditData({});
        setIsAdding(false);
    };

    const startEdit = (item: any) => {
        setEditingId(item.id || item._id);
        const data: { [key: string]: string | null } = {};
        addFields.forEach(field => {
            data[field.name] = item[field.name] || '';
        });
        setEditData(data);
    };

    const getFilteredOptions = (field: any) => {
        if (field.name === 'parentCategory' && editingId) {
            const getAllDescendants = (categoryId: string, allCategories: any[]): string[] => {
                const children = allCategories.filter(cat => cat.parentCategory === categoryId);
                let descendants = children.map(child => child._id);
                children.forEach(child => {
                    descendants = descendants.concat(getAllDescendants(child._id, allCategories));
                });
                return descendants;
            };
            
            const excludeIds = [editingId, ...getAllDescendants(editingId, items)];
            return field.options?.filter((opt: any) => !excludeIds.includes(opt.value)) || [];
        }
        return field.options || [];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Manage your product {title.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 mb-4 p-4 border rounded-lg">
                    {addFields.map(field => (
                        <div key={field.name} className="flex-1 min-w-[150px]">
                            <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
                            {field.type === 'select' ? (
                                <Select onValueChange={(value) => setNewData(prev => ({...prev, [field.name]: value === 'null' ? null : value}))} value={newData[field.name] || ''}>
                                    <SelectTrigger id={field.name}>
                                        <SelectValue placeholder={field.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>-- Select --</SelectLabel>
                                        <SelectItem value="null">None (Root Category)</SelectItem>
                                        {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                      </SelectGroup>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id={field.name}
                                    placeholder={field.label}
                                    value={(newData[field.name] as string) || ''}
                                    onChange={(e) => setNewData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                    required={field.required}
                                    type={field.type || 'text'}
                                />
                            )}
                        </div>
                    ))}
                     <Button type="submit" disabled={isAdding}>
                        {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add
                    </Button>
                </form>
                <div className="rounded-md border h-60 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {addFields.map(f => f.name !== 'parentId' && f.name !== 'parentCategory' && <TableHead key={f.name}>{f.label}</TableHead>)}
                                {addFields.some(f => f.name === 'parentId' || f.name === 'parentCategory') && <TableHead>Parent</TableHead>}
                                {showStatus && <TableHead>Status</TableHead>}
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={addFields.length} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                        ) : items.map((item) => (
                            <TableRow key={item.id || item._id}>
                                {addFields.map(f => f.name !== 'parentId' && f.name !== 'parentCategory' && <TableCell key={f.name}>{item[f.name]}</TableCell>)}
                                {addFields.some(f => f.name === 'parentId' || f.name === 'parentCategory') && <TableCell>{item.parent || '-'}</TableCell>}
                                {showStatus && (
                                    <TableCell>
                                        <Button 
                                            variant={item.status ? "default" : "secondary"} 
                                            size="sm" 
                                            onClick={() => onToggleStatus?.(item.id || item._id)}
                                        >
                                            {item.status ? 'Active' : 'Inactive'}
                                        </Button>
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <div className="flex gap-1 justify-end">
                                        {onEdit && (
                                            <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                                                Edit
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id || item._id)} disabled={deletingId === (item.id || item._id)}>
                                            {deletingId === (item.id || item._id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit {title.slice(0, -1)}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            {addFields.map(field => (
                                <div key={field.name} className="space-y-2">
                                    <Label htmlFor={`edit-${field.name}`}>{field.label}</Label>
                                    {field.type === 'select' ? (
                                        <Select onValueChange={(value) => setEditData(prev => ({ ...prev, [field.name]: value === 'null' ? null : value }))} value={editData[field.name] || ''}>
                                            <SelectTrigger id={`edit-${field.name}`}>
                                                <SelectValue placeholder={field.label} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectGroup>
                                                <SelectLabel>-- Select --</SelectLabel>
                                                <SelectItem value="null">None (Root Category)</SelectItem>
                                                {getFilteredOptions(field).map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                              </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id={`edit-${field.name}`}
                                            placeholder={field.label}
                                            value={(editData[field.name] as string) || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            required={field.required}
                                            type={field.type || 'text'}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isAdding}>
                                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};


export default function ProductsPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<ProductBrand[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [locations, setLocations] = useState<ProductLocation[]>([]);
    const [units, setUnits] = useState<ProductUnit[]>([]);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [totalProducts, setTotalProducts] = useState(0);
    const itemsPerPage = 10;
    
    const [adjustmentData, setAdjustmentData] = useState<{
        type: string,
        storeId: string,
        productId: string,
        quantityChange: number,
        reference: string,
        note: string
    }>({
        type: 'IN',
        storeId: '',
        productId: '',
        quantityChange: 0,
        reference: '',
        note: ''
    });

    const activeTab = searchParams.get('tab') || 'products';

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(typeFilter !== 'all' && { type: typeFilter })
            });
            
            const productsRes = await authFetch(`/api/products?${params}`);
            const productsData = await productsRes.json();
            setProducts(productsData.data || []);
            setTotalProducts(productsData.pagination?.totalItems || 0);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, toast, currentPage, searchTerm, typeFilter]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [brandsRes, categoriesRes, locationsRes, unitsRes, adjustmentsRes] = await Promise.all([
                authFetch('/api/brands'),
                authFetch('/api/categories'),
                authFetch('/api/stores'),
                authFetch('/api/units'),
                authFetch('/api/inventory/stock-adjustments'),
            ]);
            
            const brandsData = await brandsRes.json();
            setBrands(brandsData.data || []);
            const categoriesData = await categoriesRes.json();
            setCategories(categoriesData.data || []);
            const locationsData = await locationsRes.json();
            setLocations(locationsData.data || []);
            const unitsData = await unitsRes.json();
            setUnits(unitsData.data || []);
            setStockAdjustments(await adjustmentsRes.json());

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, toast]);

    useEffect(() => {
        if (!authLoading) {
            if (!can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchData();
                if (activeTab === 'products') {
                    fetchProducts();
                }
            }
        }
    }, [user, authLoading, can, router, pathname, fetchData, fetchProducts, activeTab]);

    const handleTaxonomyAction = async (
        type: 'brand' | 'category' | 'location' | 'unit',
        action: 'add' | 'delete',
        payload: { id?: string; name?: string, [key:string]: any }
    ) => {
        try {
            const baseUrl = (type === 'brand' || type === 'unit' || type === 'category' || type === 'location') ? `/api/${type === 'category' ? 'categories' : type === 'location' ? 'stores' : type + 's'}` : `/api/inventory/${type}s`;
            const url = action === 'delete' ? `${baseUrl}/${payload.id}` : baseUrl;
            const method = action === 'add' ? 'POST' : 'DELETE';
            const body = action === 'add' ? JSON.stringify(payload) : undefined;
            
            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                ...(body && { body }),
            });
            if (!response.ok) throw new Error(`Failed to ${action} ${type}`);
            const displayType = type === 'location' ? 'Store' : type.charAt(0).toUpperCase() + type.slice(1);
            toast({ title: 'Success', description: `${displayType} ${action === 'add' ? 'added' : 'deleted'}.` });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleBrandStatusToggle = async (id: string) => {
        try {
            const response = await authFetch(`/api/brands/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to toggle brand status');
            toast({ title: 'Success', description: 'Brand status updated.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleBrandEdit = async (id: string, data: { [key: string]: string | null }) => {
        try {
            const response = await authFetch(`/api/brands/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update brand');
            toast({ title: 'Success', description: 'Brand updated successfully.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleUnitStatusToggle = async (id: string) => {
        try {
            const response = await authFetch(`/api/units/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to toggle unit status');
            toast({ title: 'Success', description: 'Unit status updated.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleUnitEdit = async (id: string, data: { [key: string]: string | null }) => {
        try {
            const response = await authFetch(`/api/units/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update unit');
            toast({ title: 'Success', description: 'Unit updated successfully.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleCategoryStatusToggle = async (id: string) => {
        try {
            const response = await authFetch(`/api/categories/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to toggle category status');
            toast({ title: 'Success', description: 'Category status updated.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleCategoryEdit = async (id: string, data: { [key: string]: string | null }) => {
        try {
            const response = await authFetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update category');
            toast({ title: 'Success', description: 'Category updated successfully.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleStoreStatusToggle = async (id: string) => {
        try {
            const response = await authFetch(`/api/stores/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to toggle store status');
            toast({ title: 'Success', description: 'Store status updated.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleStoreEdit = async (id: string, data: { [key: string]: string | null }) => {
        try {
            const response = await authFetch(`/api/stores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update store');
            toast({ title: 'Success', description: 'Store updated successfully.' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleOpenProductDialog = (product: Product | null = null) => {
        if (product) {
            setEditingProduct({
                ...product,
                category: product.category?._id || product.category,
                brand: product.brand?._id || product.brand,
                unit: product.unit?._id || product.unit
            });
        } else {
            setEditingProduct({ 
                type: 'Product',
                productName: '',
                batchNo: '',
                sku: '',
                hsnSac: '',
                purchasePrice: '',
                sellingPrice: '',
                mrp: '',
                cgst: '',
                sgst: '',
                igst: '',
                taxType: 'Inclusive',
                category: '',
                brand: '',
                unit: '',
                minStockThreshold: '',
                description: '',
                barcode: '',
                isScheduledDrug: false,
                isShowcase: false
            });
        }
        setIsProductDialogOpen(true);
    };

    const handleProductSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        
        const action = editingProduct._id ? 'update' : 'create';
        if (!confirm(`Are you sure you want to ${action} this product?`)) {
            return;
        }
        
        setIsSaving(true);
        try {
            const url = editingProduct._id ? `/api/products/${editingProduct._id}` : '/api/products';
            const method = editingProduct._id ? 'PUT' : 'POST';
            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingProduct),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save product');
            }
            toast({ title: 'Success', description: `Product ${editingProduct._id ? 'updated' : 'created'}` });
            setIsProductDialogOpen(false);
            fetchData();
            if (activeTab === 'products') {
                fetchProducts();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleProductDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        try {
            const response = await authFetch(`/api/products/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete product');
            toast({ title: 'Success', description: 'Product deleted successfully.' });
            fetchProducts();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };
    
    const handleAdjustmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { productId, storeId, quantityChange, type, reference, note } = adjustmentData;
        if (!productId || !storeId || quantityChange === 0) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select a store, product and specify a quantity.'});
            return;
        }

        const product = Array.isArray(products) ? products.find(p => p.id === productId) : null;
        if (!product) return;

        const store = Array.isArray(locations) ? locations.find(l => l.id === storeId) : null;
        if(!store) return;

        const finalQuantityChange = type === 'OUT' ? -Math.abs(quantityChange) : Math.abs(quantityChange);

        const adjustmentPayload = {
            productId,
            productName: product.name,
            storeId,
            storeName: store.name,
            type: 'manual_adjustment',
            quantityChange: finalQuantityChange,
            reference,
            reason: note
        }

        setIsSaving(true);
        try {
            const response = await authFetch('/api/inventory/stock-adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(adjustmentPayload)
            });
            if (!response.ok) throw new Error('Failed to create stock adjustment');
            toast({ title: 'Success', description: 'Stock adjusted successfully.'});
            setAdjustmentData({type: 'IN', storeId: '', productId: '', quantityChange: 0, reference: '', note: ''});
            fetchData();
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }

    }
    
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        }
    }, [fetchProducts, activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'products') {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, activeTab]);

    // Sync pageInput with currentPage
    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    const expiryAlertDays = 30;
    const getExpiryBadge = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const alertDate = addDays(today, expiryAlertDays);
        if (isBefore(expiry, today)) {
            return <Badge variant="destructive">Expired</Badge>
        }
        if (isBefore(expiry, alertDate)) {
            return <Badge variant="destructive" className="bg-yellow-500 text-white hover:bg-yellow-600">Expires Soon</Badge>
        }
        return null;
    }

    const onTabChange = (value: string) => {
        router.push(`${pathname}?tab=${value}`);
    };
    
    const renderProductsTab = () => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Products & Services</CardTitle>
                        <CardDescription>Manage all items in your inventory.</CardDescription>
                    </div>
                     {can('edit', pathname) && (
                        <Button onClick={() => handleOpenProductDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    )}
                </div>
                <div className="flex gap-4 pt-4">
                    <Input 
                        placeholder="Search by name or batch..."
                        className="max-w-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Select value={typeFilter} onValueChange={(val) => {setTypeFilter(val); setCurrentPage(1);}}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Product">Product</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('all');
                            setCurrentPage(1);
                        }}
                    >
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Batch No</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>MRP</TableHead>
                                <TableHead>Selling Price</TableHead>
                                <TableHead>Tax Type</TableHead>
                                {can('edit', pathname) && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={9} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                        ) : products.length > 0 ? (
                            products.map(p => (
                                <TableRow key={p._id}>
                                    <TableCell>{p.productName}</TableCell>
                                    <TableCell>{p.batchNo}</TableCell>
                                    <TableCell>{p.category?.categoryName || '-'}</TableCell>
                                    <TableCell>{p.brand?.name || '-'}</TableCell>
                                    <TableCell>₹{(p.mrp || 0).toFixed(2)}</TableCell>
                                    <TableCell>₹{(p.sellingPrice || 0).toFixed(2)}</TableCell>
                                    <TableCell>{p.type === 'Product' ? (p.taxType || 'Exclusive') : '-'}</TableCell>
                                    {(can('edit', pathname) || can('delete', pathname)) && (
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {can('edit', pathname) && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenProductDialog(p)}><Edit className="h-4 w-4" /></Button>
                                            )}
                                            {can('delete', pathname) && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleProductDelete(p._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={9} className="text-center h-24">No products found.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center space-x-1">
                            <span className="text-sm">Page</span>
                            <Input
                                type="text"
                                value={pageInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setPageInput(value);
                                        if (value !== '' && parseInt(value) >= 1 && parseInt(value) <= totalPages) {
                                            setCurrentPage(parseInt(value));
                                        }
                                    }
                                }}
                                onBlur={() => setPageInput(currentPage.toString())}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const page = parseInt(pageInput);
                                        if (page >= 1 && page <= totalPages) {
                                            setCurrentPage(page);
                                        } else {
                                            setPageInput(currentPage.toString());
                                        }
                                    }
                                }}
                                className="w-16 h-8 text-center text-sm"
                            />
                            <span className="text-sm">of {totalPages}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderProductDialog = () => (
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingProduct?._id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSave}>
                    <div className="max-h-[70vh] overflow-y-auto p-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                           <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={editingProduct?.type || 'Product'} onValueChange={val => setEditingProduct(p => ({...p, type: val}))} required>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Product">Product</SelectItem>
                                        <SelectItem value="Service">Service</SelectItem>
                                    </SelectContent>
                                </Select>
                           </div>
                           <div className="space-y-2">
                                <Label>{editingProduct?.type === 'Service' ? 'Service Name' : 'Product Name'}</Label>
                                <Input value={editingProduct?.productName || ''} onChange={e => setEditingProduct(p => ({...p, productName: e.target.value}))} required />
                           </div>
                           {editingProduct?.type !== 'Service' && (
                           <div className="space-y-2">
                                <Label>Batch Number</Label>
                                <Input value={editingProduct?.batchNo || ''} onChange={e => setEditingProduct(p => ({...p, batchNo: e.target.value}))} required />
                           </div>
                           )}
                           {editingProduct?.type !== 'Service' && (
                           <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input value={editingProduct?.sku || ''} onChange={e => setEditingProduct(p => ({...p, sku: e.target.value}))} required />
                           </div>
                           )}
                           <div className="space-y-2">
                                <Label>HSN/SAC Code</Label>
                                <Input value={editingProduct?.hsnSac || ''} onChange={e => setEditingProduct(p => ({...p, hsnSac: e.target.value}))} />
                           </div>
                           <div className="space-y-2">
                                <Label>Purchase Price (₹)</Label>
                                <Input type="number" step="0.01" value={editingProduct?.purchasePrice || ''} onChange={e => setEditingProduct(p => ({...p, purchasePrice: e.target.value === '' ? '' : Number(e.target.value)}))} onWheel={e => e.currentTarget.blur()} required />
                           </div>
                            <div className="space-y-2">
                                <Label>MRP (₹)</Label>
                                <Input type="number" step="0.01" value={editingProduct?.mrp || ''} onChange={e => {
                                    const value = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditingProduct(p => ({...p, mrp: value}));
                                    const calculateSellingPrice = () => {
                                        if (value && editingProduct?.taxType) {
                                            const totalTax = (Number(editingProduct.cgst) || 0) + (Number(editingProduct.sgst) || 0) + (Number(editingProduct.igst) || 0);
                                            if (editingProduct.taxType === 'Inclusive') {
                                                const sellingPrice = Number((Number(value) / (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            } else {
                                                const sellingPrice = Number((Number(value) * (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            }
                                        }
                                    };
                                    setTimeout(calculateSellingPrice, 0);
                                }} onWheel={e => e.currentTarget.blur()} required />
                           </div>
                           {editingProduct?.type === 'Product' && (
                           <div className="space-y-2">
                                <Label>Tax Type</Label>
                                <Select value={editingProduct?.taxType || 'Inclusive'} onValueChange={val => {
                                    setEditingProduct(p => ({...p, taxType: val}));
                                    const calculateSellingPrice = () => {
                                        if (editingProduct?.mrp) {
                                            const totalTax = (Number(editingProduct.cgst) || 0) + (Number(editingProduct.sgst) || 0) + (Number(editingProduct.igst) || 0);
                                            if (val === 'Inclusive') {
                                                const sellingPrice = Number((Number(editingProduct.mrp) / (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            } else {
                                                const sellingPrice = Number((Number(editingProduct.mrp) * (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            }
                                        }
                                    };
                                    setTimeout(calculateSellingPrice, 0);
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select Tax Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inclusive">Inclusive</SelectItem>
                                        <SelectItem value="Exclusive">Exclusive</SelectItem>
                                    </SelectContent>
                                </Select>
                           </div>
                           )}
                           <div className="space-y-2">
                                <Label>CGST (%)</Label>
                                <Input type="number" step="0.01" value={editingProduct?.cgst || ''} onChange={e => {
                                    const value = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditingProduct(p => ({...p, cgst: value}));
                                    const calculateSellingPrice = () => {
                                        if (editingProduct?.mrp && editingProduct?.taxType) {
                                            const totalTax = (Number(value) || 0) + (Number(editingProduct.sgst) || 0) + (Number(editingProduct.igst) || 0);
                                            if (editingProduct.taxType === 'Inclusive') {
                                                const sellingPrice = parseFloat((Number(editingProduct.mrp) / (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            } else {
                                                const sellingPrice = parseFloat((Number(editingProduct.mrp) * (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            }
                                        }
                                    };
                                    setTimeout(calculateSellingPrice, 0);
                                }} onWheel={e => e.currentTarget.blur()} />
                           </div>
                           <div className="space-y-2">
                                <Label>SGST (%)</Label>
                                <Input type="number" step="0.01" value={editingProduct?.sgst || ''} onChange={e => {
                                    const value = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditingProduct(p => ({...p, sgst: value}));
                                    const calculateSellingPrice = () => {
                                        if (editingProduct?.mrp && editingProduct?.taxType) {
                                            const totalTax = (Number(editingProduct.cgst) || 0) + (Number(value) || 0) + (Number(editingProduct.igst) || 0);
                                            if (editingProduct.taxType === 'Inclusive') {
                                                const sellingPrice = Number((Number(editingProduct.mrp) / (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            } else {
                                                const sellingPrice = Number((Number(editingProduct.mrp) * (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            }
                                        }
                                    };
                                    setTimeout(calculateSellingPrice, 0);
                                }} onWheel={e => e.currentTarget.blur()} />
                           </div>
                           <div className="space-y-2">
                                <Label>IGST (%)</Label>
                                <Input type="number" step="0.01" value={editingProduct?.igst || ''} onChange={e => {
                                    const value = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditingProduct(p => ({...p, igst: value}));
                                    const calculateSellingPrice = () => {
                                        if (editingProduct?.mrp && editingProduct?.taxType) {
                                            const totalTax = (Number(editingProduct.cgst) || 0) + (Number(editingProduct.sgst) || 0) + (Number(value) || 0);
                                            if (editingProduct.taxType === 'Inclusive') {
                                                const sellingPrice = Number((Number(editingProduct.mrp) / (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            } else {
                                                const sellingPrice = Number((Number(editingProduct.mrp) * (1 + totalTax / 100)).toFixed(2));
                                                setEditingProduct(p => ({...p, sellingPrice}));
                                            }
                                        }
                                    };
                                    setTimeout(calculateSellingPrice, 0);
                                }} onWheel={e => e.currentTarget.blur()} />
                           </div>
                           <div className="space-y-2">
                                <Label>Selling Price (₹) - Auto Calculated</Label>
                                <Input type="number" step="0.01" value={editingProduct?.sellingPrice || ''} readOnly className="bg-gray-50" onWheel={e => e.currentTarget.blur()} />
                           </div>
                           <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={editingProduct?.category} onValueChange={val => setEditingProduct(p => ({...p, category: val}))} required>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>{Array.isArray(categories) ? categories.map(c => <SelectItem key={c._id} value={c._id}>{c.categoryPath}</SelectItem>) : null}</SelectContent>
                                </Select>
                           </div>
                           <div className="space-y-2">
                                <Label>Brand</Label>
                                <Select value={editingProduct?.brand} onValueChange={val => setEditingProduct(p => ({...p, brand: val}))} required>
                                    <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                                    <SelectContent>{Array.isArray(brands) ? brands.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>) : null}</SelectContent>
                                </Select>
                           </div>
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Select value={editingProduct?.unit} onValueChange={val => setEditingProduct(p => ({...p, unit: val}))} required>
                                    <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                                    <SelectContent>{Array.isArray(units) ? units.map(u => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>) : null}</SelectContent>
                                </Select>
                           </div>
                           {editingProduct?.type !== 'Service' && (
                           <div className="space-y-2">
                                <Label>Min Stock Threshold</Label>
                                <Input type="number" value={editingProduct?.minStockThreshold || ''} onChange={e => setEditingProduct(p => ({...p, minStockThreshold: e.target.value === '' ? '' : Number(e.target.value)}))} onWheel={e => e.currentTarget.blur()} required />
                           </div>
                           )}
                           <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={editingProduct?.description || ''} onChange={e => setEditingProduct(p => ({...p, description: e.target.value}))} />
                           </div>
                           {editingProduct?.type !== 'Service' && (
                           <div className="space-y-2">
                                <Label>Barcode/QR (Optional)</Label>
                                <Input value={editingProduct?.barcode || ''} onChange={e => setEditingProduct(p => ({...p, barcode: e.target.value}))} />
                           </div>
                           )}
                           {editingProduct?.type !== 'Service' && (
                           <div className="flex items-center space-x-2 pt-6">
                                <Checkbox id="scheduled-drug" checked={editingProduct?.isScheduledDrug} onCheckedChange={checked => setEditingProduct(p => ({...p, isScheduledDrug: !!checked}))}/>
                                <Label htmlFor="scheduled-drug">Is this a Schedule H/H1/X Drug?</Label>
                           </div>
                           )}
                           <div className="flex items-center space-x-2">
                                <Checkbox id="showcase" checked={editingProduct?.isShowcase} onCheckedChange={checked => setEditingProduct(p => ({...p, isShowcase: !!checked}))}/>
                                <Label htmlFor="showcase">Show in Showcase</Label>
                           </div>
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4 mt-4">
                        <DialogClose asChild><Button variant="secondary" type="button">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Product
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );

    if (authLoading || !user) {
        return <div className="flex items-center justify-center h-screen"><Stethoscope className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage products, stock levels, brands, and other properties.</p>
                </div>
            </div>

            {renderProductDialog()}

            <Tabs defaultValue={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="products">Products / Services</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="units">Units</TabsTrigger>
                    <TabsTrigger value="brands">Brands</TabsTrigger>
                    <TabsTrigger value="stores">Stores</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-4">
                    {renderProductsTab()}
                </TabsContent>
                <TabsContent value="categories" className="mt-4">
                    <ManageTaxonomy 
                        title="Categories" 
                        items={Array.isArray(categories) ? categories.map(c => ({...c, categoryName: c.categoryName, parent: categories.find(p=>p._id === c.parentCategory)?.categoryName || '-'})) : []} 
                        onAdd={(data) => handleTaxonomyAction('category', 'add', data)} 
                        onDelete={(id) => handleTaxonomyAction('category', 'delete', { id })}
                        onEdit={handleCategoryEdit}
                        onToggleStatus={handleCategoryStatusToggle}
                        isLoading={isLoading}
                        showStatus={true}
                        addFields={[
                            {name: 'categoryName', label: 'Category Name', required: true},
                            {name: 'parentCategory', label: 'Parent Category', type: 'select', options: Array.isArray(categories) ? categories.map(c => ({value: c._id, label: c.categoryName})) : [] }
                        ]}
                    />
                </TabsContent>
                <TabsContent value="units" className="mt-4">
                     <ManageTaxonomy 
                        title="Units" 
                        items={units} 
                        onAdd={(data) => handleTaxonomyAction('unit', 'add', data)} 
                        onDelete={(id) => handleTaxonomyAction('unit', 'delete', { id })}
                        onEdit={handleUnitEdit}
                        onToggleStatus={handleUnitStatusToggle}
                        isLoading={isLoading}
                        showStatus={true}
                        addFields={[
                            {name: 'name', label: 'Unit Name (e.g. Pieces)', required: true}
                        ]}
                    />
                </TabsContent>
                <TabsContent value="brands" className="mt-4">
                     <ManageTaxonomy 
                        title="Brands" 
                        items={brands} 
                        onAdd={(data) => handleTaxonomyAction('brand', 'add', data)} 
                        onDelete={(id) => handleTaxonomyAction('brand', 'delete', { id })}
                        onEdit={handleBrandEdit}
                        onToggleStatus={handleBrandStatusToggle}
                        isLoading={isLoading}
                        showStatus={true}
                        addFields={[{name: 'name', label: 'Brand Name', required: true}]}
                     />
                </TabsContent>
                <TabsContent value="stores" className="mt-4">
                    <ManageTaxonomy 
                        title="Stores / Locations" 
                        items={locations} 
                        onAdd={(data) => handleTaxonomyAction('location', 'add', data)} 
                        onDelete={(id) => handleTaxonomyAction('location', 'delete', { id })}
                        onEdit={handleStoreEdit}
                        onToggleStatus={handleStoreStatusToggle}
                        isLoading={isLoading}
                        showStatus={true}
                        addFields={[
                            {name: 'name', label: 'Store Name', required: true},
                            {name: 'contactPerson', label: 'Contact Person'},
                            {name: 'phone', label: 'Phone'},
                            {name: 'email', label: 'Email', type: 'email'},
                            {name: 'address', label: 'Address'},
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

