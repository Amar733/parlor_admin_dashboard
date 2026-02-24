"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product, Supplier, ProductPurchaseRate, ProductUnit } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope } from 'lucide-react';
import BillsTab from './components/BillsTab';
import SuppliersTab from './components/SuppliersTab';

export default function PurchasesPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const { can } = usePermission();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<ProductUnit[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [rates, setRates] = useState<ProductPurchaseRate[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const activeTab = searchParams.get('tab') || 'bills';
    const isFromExpense = searchParams.get('from') === 'expense';

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [productsRes, suppliersRes, ratesRes, unitsRes] = await Promise.all([
                authFetch('/api/products?limit=50'),
                authFetch('/api/users/vendors?limit=50'),
                authFetch('/api/inventory/rates'),
                authFetch('/api/inventory/units'),
            ]);

            const productsData = await productsRes.json();
            setProducts(productsData.data || productsData);
            const vendorsData = await suppliersRes.json();
            setSuppliers(vendorsData.data || vendorsData);
            setRates(await ratesRes.json());
            setUnits(await unitsRes.json());


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
            }
        }
    }, [user, authLoading, can, router, pathname, fetchData]);

    const handleSupplierAction = async (action: 'add' | 'edit' | 'delete', id?: string, data?: Partial<Supplier>) => {
        try {
            let url = '/api/users';
            let method = 'POST';
            let body = {};
            
            if (action === 'add') {
                body = {
                    name: data?.contactPerson || data?.name,
                    email: data?.email || `${data?.name?.toLowerCase().replace(/\s+/g, '')}@vendor.com`,
                    role: 'vendor',
                    avatarUrl: '',
                    permissions: [],
                    password: null,
                    specialization: '',
                    bio: '',
                    availableSlots: [],
                    companyName: data?.name,
                    phone: data?.phone || '',
                    gstNumber: data?.gstin || '',
                    pan: (data as any).pan || '',
                    stateCode: (data as any).stateCode || '',
                    creditDays: (data as any).creditDays || 0,
                    creditLimit: (data as any).creditLimit || 0,
                    openingBalance: (data as any).openingBalance || 0,
                    address: (data as any).address || ''
                };
            } else if (action === 'edit' && id) {
                url = `/api/users/${id}`;
                method = 'PUT';
                body = data || {};
            } else if (action === 'delete' && id) {
                url = `/api/users/${id}`;
                method = 'DELETE';
            }

            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) throw new Error(`Failed to ${action} supplier`);
            toast({ title: 'Success', description: `Supplier ${action === 'add' ? 'added' : action} successfully.` });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const onTabChange = (value: string) => {
        router.push(`${pathname}?tab=${value}`);
    };

    if (authLoading || !user) {
        return <div className="flex items-center justify-center h-screen"><Stethoscope className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isFromExpense ? "Manage Purchase Expense" : "Purchases"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isFromExpense ? "Create a new expense entry" : "Manage purchase bills, suppliers, and rates."}
                    </p>
                </div>
            </div>

            <div className="w-full max-w-full overflow-hidden">
                <Tabs defaultValue={activeTab} onValueChange={onTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="bills">Purchase Bills</TabsTrigger>
                        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bills" className="mt-4 w-full max-w-full overflow-hidden">
                        <BillsTab
                            products={products}
                            suppliers={suppliers}
                            authFetch={authFetch}
                            toast={toast}
                            isFromExpense={isFromExpense}
                        />
                    </TabsContent>
                    <TabsContent value="suppliers" className="mt-4 w-full max-w-full overflow-hidden">
                        <SuppliersTab
                            suppliers={suppliers}
                            onAdd={(data) => handleSupplierAction('add', undefined, data)}
                            onEdit={(id, data) => handleSupplierAction('edit', id, data)}
                            onDelete={(id) => handleSupplierAction('delete', id)}
                            isLoading={isLoading}
                            authFetch={authFetch}
                            toast={toast}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}