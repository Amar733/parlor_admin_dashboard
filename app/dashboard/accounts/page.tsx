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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Edit, Trash2, PlusCircle, Loader2, Check, X, MoreVertical, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Account {
  _id: string;
  accountName: string;
  accountNumber: string;
  remarks: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [newAccount, setNewAccount] = useState({ accountName: '', accountNumber: '', remarks: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ accountName: '', accountNumber: '', remarks: '' });
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { authFetch, user, loading: authLoading } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authLoading) {
            if (!can('view', pathname)) {
                router.push('/dashboard');
            } else {
                fetchAccounts();
            }
        }
    }, [authLoading, can, pathname, router]);

    const fetchAccounts = async () => {
        try {
            const response = await authFetch('/api/finance/accounts');
            const data = await response.json();
            if (data.success) {
                setAccounts(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccount.accountName.trim() || !newAccount.accountNumber.trim()) return;

        setIsAdding(true);
        try {
            const response = await authFetch('/api/finance/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });
            const data = await response.json();
            if (data.success) {
                setAccounts([data.data, ...accounts]);
                setNewAccount({ accountName: '', accountNumber: '', remarks: '' });
                toast({
                    title: "Success",
                    description: "Account added successfully",
                });
            }
        } catch (error) {
            console.error('Failed to add account:', error);
            toast({
                title: "Error",
                description: "Failed to add account",
                variant: "destructive",
            });
        } finally {
            setIsAdding(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await authFetch(`/api/finance/accounts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: !currentStatus })
            });
            const data = await response.json();
            if (data.success) {
                setAccounts(accounts.map(acc => 
                    acc._id === id ? { ...acc, status: !currentStatus } : acc
                ));
                toast({
                    title: "Success",
                    description: `Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
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

    const startEdit = (account: Account) => {
        setEditingId(account._id);
        setEditData({ accountName: account.accountName, accountNumber: account.accountNumber, remarks: account.remarks });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({ accountName: '', accountNumber: '', remarks: '' });
    };

    const saveEdit = async (id: string) => {
        if (!editData.accountName.trim() || !editData.accountNumber.trim()) return;
        
        try {
            const response = await authFetch(`/api/finance/accounts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const data = await response.json();
            if (data.success) {
                setAccounts(accounts.map(acc => 
                    acc._id === id ? { ...acc, ...editData } : acc
                ));
                setEditingId(null);
                setEditData({ accountName: '', accountNumber: '', remarks: '' });
                toast({
                    title: "Success",
                    description: "Account updated successfully",
                });
            }
        } catch (error) {
            console.error('Failed to update account:', error);
            toast({
                title: "Error",
                description: "Failed to update account",
                variant: "destructive",
            });
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const response = await authFetch(`/api/finance/accounts/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setAccounts(accounts.filter(acc => acc._id !== id));
                toast({
                    title: "Success",
                    description: "Account deleted successfully",
                });
            }
        } catch (error) {
            console.error('Failed to delete account:', error);
            toast({
                title: "Error",
                description: "Failed to delete account",
                variant: "destructive",
            });
        }
    };

    const openAccountDetails = (account: Account) => {
        setSelectedAccount(account);
        setIsSheetOpen(true);
    };

    if (authLoading || !user || !can('view', pathname)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bank Accounts</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        Manage bank accounts and financial records.
                    </p>
                </div>
            </div>

            {can('edit', pathname) && (
                <Card className="w-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg md:text-xl">Add New Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddAccount} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="account-name" className="text-sm">Account Name</Label>
                                    <Input
                                        id="account-name"
                                        value={newAccount.accountName}
                                        onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                                        placeholder="SBI Main"
                                        required
                                        disabled={isAdding}
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-number" className="text-sm">Account Number</Label>
                                    <Input
                                        id="account-number"
                                        value={newAccount.accountNumber}
                                        onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                                        placeholder="123456789"
                                        required
                                        disabled={isAdding}
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remarks" className="text-sm">Remarks</Label>
                                    <Input
                                        id="remarks"
                                        value={newAccount.remarks}
                                        onChange={(e) => setNewAccount({...newAccount, remarks: e.target.value})}
                                        placeholder="Primary account"
                                        disabled={isAdding}
                                        className="h-10"
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isAdding} className="w-full md:w-auto">
                                {isAdding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Account
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Account List</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                        All available bank accounts ({accounts.length})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No accounts found. Add your first account above.
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <div className="min-w-full inline-block align-middle">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Account Name</TableHead>
                                                <TableHead>Account Number</TableHead>
                                                <TableHead>Remarks</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                {(can('edit', pathname) || can('delete', pathname)) && (
                                                    <TableHead className="text-right w-24">Actions</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {accounts.map((account, index) => (
                                                <TableRow key={account._id}>
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {editingId === account._id ? (
                                                            <Input
                                                                value={editData.accountName}
                                                                onChange={(e) => setEditData({...editData, accountName: e.target.value})}
                                                                className="h-8"
                                                            />
                                                        ) : (
                                                            account.accountName
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === account._id ? (
                                                            <Input
                                                                value={editData.accountNumber}
                                                                onChange={(e) => setEditData({...editData, accountNumber: e.target.value})}
                                                                className="h-8"
                                                            />
                                                        ) : (
                                                            account.accountNumber
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingId === account._id ? (
                                                            <Input
                                                                value={editData.remarks}
                                                                onChange={(e) => setEditData({...editData, remarks: e.target.value})}
                                                                className="h-8"
                                                            />
                                                        ) : (
                                                            account.remarks || '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {can('edit', pathname) ? (
                                                            <Switch 
                                                                checked={account.status}
                                                                onCheckedChange={() => toggleStatus(account._id, account.status)}
                                                            />
                                                        ) : (
                                                            <Badge variant={account.status ? "default" : "secondary"}>
                                                                {account.status ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(account.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {(can('edit', pathname) || can('delete', pathname)) && (
                                                            editingId === account._id ? (
                                                                <div className="flex justify-end gap-1">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8" 
                                                                        onClick={() => saveEdit(account._id)}
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8" 
                                                                        onClick={cancelEdit}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end gap-1">
                                                                    {can('edit', pathname) && (
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-8 w-8" 
                                                                            onClick={() => startEdit(account)}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                    {can('delete', pathname) && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon" 
                                                                                    className="h-8 w-8 text-destructive"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent className="max-w-[90vw] md:max-w-md">
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure you want to delete "{account.accountName}"? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction 
                                                                                        onClick={() => deleteAccount(account._id)}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
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

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {accounts.map((account, index) => (
                                    <Card key={account._id}>
                                        <CardContent className="pt-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-base">{account.accountName}</h3>
                                                            <Badge variant={account.status ? "default" : "secondary"} className="text-xs">
                                                                {account.status ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {account.accountNumber}
                                                        </p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => openAccountDetails(account)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {can('edit', pathname) && (
                                                                editingId === account._id ? (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => saveEdit(account._id)}>
                                                                            <Check className="mr-2 h-4 w-4" />
                                                                            Save Changes
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={cancelEdit}>
                                                                            <X className="mr-2 h-4 w-4" />
                                                                            Cancel Edit
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => startEdit(account)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit Account
                                                                    </DropdownMenuItem>
                                                                )
                                                            )}
                                                            {can('edit', pathname) && (
                                                                <DropdownMenuItem onClick={() => toggleStatus(account._id, account.status)}>
                                                                    {account.status ? 'Deactivate' : 'Activate'}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {can('delete', pathname) && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <DropdownMenuItem 
                                                                            className="text-destructive focus:text-destructive"
                                                                            onSelect={(e) => e.preventDefault()}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete Account
                                                                        </DropdownMenuItem>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="max-w-[90vw]">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to delete "{account.accountName}"? This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction 
                                                                                onClick={() => deleteAccount(account._id)}
                                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                            >
                                                                                Delete
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {editingId === account._id ? (
                                                    <div className="space-y-3 border-t pt-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Account Name</Label>
                                                            <Input
                                                                value={editData.accountName}
                                                                onChange={(e) => setEditData({...editData, accountName: e.target.value})}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Account Number</Label>
                                                            <Input
                                                                value={editData.accountNumber}
                                                                onChange={(e) => setEditData({...editData, accountNumber: e.target.value})}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Remarks</Label>
                                                            <Input
                                                                value={editData.remarks}
                                                                onChange={(e) => setEditData({...editData, remarks: e.target.value})}
                                                                className="h-9"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {account.remarks && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Remarks: </span>
                                                                {account.remarks}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                                                            <span>Created: {new Date(account.createdAt).toLocaleDateString()}</span>
                                                            <span>#{index + 1}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Account Details Sheet for Mobile */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                    {selectedAccount && (
                        <div className="space-y-6">
                            <SheetHeader>
                                <SheetTitle className="text-xl">{selectedAccount.accountName}</SheetTitle>
                                <SheetDescription>
                                    Account details and information
                                </SheetDescription>
                            </SheetHeader>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Account Number</Label>
                                    <div className="text-lg font-medium">{selectedAccount.accountNumber}</div>
                                </div>
                                
                                {selectedAccount.remarks && (
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Remarks</Label>
                                        <div className="text-base">{selectedAccount.remarks}</div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Status</Label>
                                        <Badge variant={selectedAccount.status ? "default" : "secondary"} className="w-fit">
                                            {selectedAccount.status ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-muted-foreground">Created</Label>
                                        <div className="text-base">
                                            {new Date(selectedAccount.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                                    <div className="text-base">
                                        {new Date(selectedAccount.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex gap-3 pt-4">
                                {can('edit', pathname) && (
                                    <Button 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => {
                                            startEdit(selectedAccount);
                                            setIsSheetOpen(false);
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                )}
                                {can('delete', pathname) && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="destructive" 
                                                className="flex-1"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="max-w-[90vw]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete "{selectedAccount.accountName}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => {
                                                        deleteAccount(selectedAccount._id);
                                                        setIsSheetOpen(false);
                                                    }}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}