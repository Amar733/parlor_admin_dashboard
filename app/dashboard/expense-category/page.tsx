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
import { Edit, Trash2, PlusCircle, Loader2, Check, X, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';

interface ExpenseCategory {
  _id: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ExpenseCategoryPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const { authFetch, user, loading: authLoading } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading) {
            if (!can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchCategories();
            }
        }
    }, [authLoading, can, pathname, router]);

    const fetchCategories = async () => {
        try {
            const response = await authFetch('/api/finance/expense-categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsAdding(true);
        try {
            const response = await authFetch('/api/finance/expense-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName })
            });
            const data = await response.json();
            if (data.success) {
                setCategories([data.data, ...categories]);
                setNewCategoryName('');
                toast({
                    title: "Success",
                    description: "Category added successfully",
                });
            }
        } catch (error) {
            console.error('Failed to add category:', error);
            toast({
                title: "Error",
                description: "Failed to add category",
                variant: "destructive",
            });
        } finally {
            setIsAdding(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await authFetch(`/api/finance/expense-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: !currentStatus })
            });
            const data = await response.json();
            if (data.success) {
                setCategories(categories.map(cat => 
                    cat._id === id ? { ...cat, status: !currentStatus } : cat
                ));
                toast({
                    title: "Success",
                    description: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
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

    const startEdit = (category: ExpenseCategory) => {
        setEditingId(category._id);
        setEditName(category.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (id: string) => {
        if (!editName.trim()) return;
        
        try {
            const response = await authFetch(`/api/finance/expense-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });
            const data = await response.json();
            if (data.success) {
                setCategories(categories.map(cat => 
                    cat._id === id ? { ...cat, name: editName } : cat
                ));
                setEditingId(null);
                setEditName('');
                toast({
                    title: "Success",
                    description: "Category updated successfully",
                });
            }
        } catch (error) {
            console.error('Failed to update category:', error);
            toast({
                title: "Error",
                description: "Failed to update category",
                variant: "destructive",
            });
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const response = await authFetch(`/api/finance/expense-categories/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setCategories(categories.filter(cat => cat._id !== id));
                toast({
                    title: "Success",
                    description: "Category deleted successfully",
                });
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            toast({
                title: "Error",
                description: "Failed to delete category",
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

    const renderMobileView = () => (
        <div className="space-y-4">
            {categories.map((category, index) => (
                <Card key={category._id} className="w-full">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    #{index + 1}
                                </span>
                                <div className="flex-1">
                                    {editingId === category._id ? (
                                        <div className="space-y-2">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                            />
                                            <div className="flex space-x-2">
                                                <Button size="sm" onClick={() => saveEdit(category._id)}>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-3 w-3 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <h3 className="font-semibold text-base">{category.name}</h3>
                                    )}
                                </div>
                            </div>
                            <Badge className={category.status ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                                {category.status ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                            
                            {can('edit', pathname) && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs">Toggle Status:</span>
                                    <Switch 
                                        checked={category.status}
                                        onCheckedChange={() => toggleStatus(category._id, category.status)}
                                        size="sm"
                                    />
                                </div>
                            )}
                        </div>
                        
                        {(can('edit', pathname) || can('delete', pathname)) && editingId !== category._id && (
                            <>
                                <Separator className="my-3" />
                                <div className="flex justify-end space-x-2">
                                    {can('edit', pathname) && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => startEdit(category)}
                                            className="h-8 px-3"
                                        >
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                    {can('delete', pathname) && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm"
                                                    className="h-8 px-3"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="max-w-[95vw]">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                    <AlertDialogDescription className="break-words">
                                                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                                    <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => deleteCategory(category._id)}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderDesktopView = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>SlNo.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    {(can('edit', pathname) || can('delete', pathname)) && (
                        <TableHead className="text-right">Actions</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {categories.map((category, index) => (
                    <TableRow key={category._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                            {editingId === category._id ? (
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-8 w-48"
                                />
                            ) : (
                                category.name
                            )}
                        </TableCell>
                        <TableCell>
                            {can('edit', pathname) ? (
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        checked={category.status}
                                        onCheckedChange={() => toggleStatus(category._id, category.status)}
                                    />
                                    <span className={category.status ? 'text-green-600' : 'text-red-600'}>
                                        {category.status ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ) : (
                                <span className={category.status ? 'text-green-600' : 'text-red-600'}>
                                    {category.status ? 'Active' : 'Inactive'}
                                </span>
                            )}
                        </TableCell>
                        <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            {(can('edit', pathname) || can('delete', pathname)) && (
                                editingId === category._id ? (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEdit(category._id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {can('edit', pathname) && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(category)}>
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
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteCategory(category._id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </>
                                )
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expense Categories</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">Organize your clinic's spending into categories.</p>
                </div>
            </div>

            {can('edit', pathname) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Add New Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="category-name">Category Name</Label>
                                <Input
                                    id="category-name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g., Office Supplies"
                                    required
                                    disabled={isAdding}
                                    className="w-full"
                                />
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full sm:w-auto">
                                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Category List</CardTitle>
                    <CardDescription>All available expense categories.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No categories found. Add your first category above.
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="block sm:hidden">
                                {renderMobileView()}
                            </div>
                            
                            {/* Desktop View */}
                            <div className="hidden sm:block">
                                {renderDesktopView()}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}