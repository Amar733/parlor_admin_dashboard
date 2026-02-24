"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  UserPlus,
  Package,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CalendarDays,
  Check,
  X,
  Printer,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { printPackageInvoice } from "./components/PackageInvoicePrint";

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
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  contact?: string;
  deletedAt?: string | null;
}

interface PaymentMode {
  _id: string;
  payType: string;
  deduction: number;
  status: boolean;
}

interface PackageSale {
  _id: string;
  billNo: string;
  billDate: string;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    contact: string;
  };
  packageTemplate: {
    _id: string;
    packageName: string;
    price: number;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  grandTotal: number;
  paymentMode: any;
  status: string;
  remarks?: string;
  createdAt: string;
}

export default function PackageSalesPage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();

  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [packageSales, setPackageSales] = useState<PackageSale[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSale, setEditingSale] = useState<PackageSale | null>(null);
  const [viewingSale, setViewingSale] = useState<PackageSale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ paymentMode: "", amount: 0 });

  // Form data
  const [saleData, setSaleData] = useState({
    billDate: new Date().toISOString().split("T")[0],
    customer: "",
    packageTemplate: "",
    doctorId: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    shippingCost: 0,
    grandTotal: 0,
    remarks: "",
    terms: "",
    paymentType: "full" as "full" | "installment",
  });

  const [blendPayments, setBlendPayments] = useState<{paymentMode: string; amount: string | number}[]>([{paymentMode: "", amount: ""}]);
  const [installments, setInstallments] = useState<{amount: number; dueDate: string; status: string; paidDate?: string; paymentMode: string | null}[]>([]);
  const [firstInstallment, setFirstInstallment] = useState<{amount: number; paymentMode: string}>({amount: 0, paymentMode: ""});
  const [paymentType, setPaymentType] = useState<"full" | "installment">("full");

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    age: "",
    gender: "",
    address: "",
  });

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const itemsPerPage = 10;

  // Fetch functions
  const fetchPackages = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/packages/templates?status=true");
      if (!response.ok) throw new Error("Failed to fetch packages");
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
    }
  }, [token, toast, authFetch]);

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/patients?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const result = await response.json();
      if (result.success && result.data) {
        setCustomers(result.data.filter((c: Customer) => !c.deletedAt));
      }
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        console.error("Error fetching customers:", error);
      }
    }
  }, [token, authFetch]);

  const fetchPaymentModes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/finance/paytypes");
      if (!response.ok) throw new Error("Failed to fetch payment modes");
      const result = await response.json();
      if (result.success) {
        setPaymentModes(result.data.filter((pm: PaymentMode) => pm.status));
      }
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        console.error("Error fetching payment modes:", error);
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

  const fetchPackageSales = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(customerFilter && customerFilter !== 'all' && { customer: customerFilter }),
        ...(doctorFilter && doctorFilter !== 'all' && { doctorId: doctorFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentModeFilter && paymentModeFilter !== 'all' && { paymentMode: paymentModeFilter }),
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
      });
      
      const response = await authFetch(`/api/packages/subscriptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch package subscriptions");
      const result = await response.json();
      
      if (result.success) {
        setPackageSales(result.data || []);
        setTotalSales(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch package sales",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, searchTerm, customerFilter, doctorFilter, statusFilter, paymentModeFilter, dateRange, authFetch, toast]);

  // Effects
  useEffect(() => {
    if (!authLoading) {
      if (!can("view", pathname)) {
        router.push("/dashboard");
      } else if (token) {
        fetchPackages();
        fetchCustomers();
        fetchPaymentModes();
        fetchDoctors();
        fetchPackageSales();
      }
    }
  }, [user, authLoading, token, router, pathname, can, fetchPackages, fetchCustomers, fetchPaymentModes, fetchDoctors, fetchPackageSales]);

  useEffect(() => {
    fetchPackageSales();
  }, [fetchPackageSales]);

  // Calculate totals when relevant fields change
  useEffect(() => {
    const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
    if (!selectedPackage) return;

    const packagePrice = selectedPackage.price || 0;
    const discountAmount = saleData.discountType === "percentage"
      ? (packagePrice * saleData.discountValue) / 100
      : saleData.discountValue;
    
    const grandTotal = packagePrice - discountAmount + saleData.shippingCost;
    
    setSaleData(prev => ({
      ...prev,
      grandTotal: Math.max(0, grandTotal),
    }));
  }, [saleData.packageTemplate, saleData.discountType, saleData.discountValue, saleData.shippingCost, packages]);

  // Handlers
  const handleAddNewClick = () => {
    setEditingSale(null);
    setSaleData({
      billDate: new Date().toISOString().split("T")[0],
      customer: "",
      packageTemplate: "",
      doctorId: "",
      discountType: "percentage",
      discountValue: 0,
      shippingCost: 0,
      grandTotal: 0,
      remarks: "",
      terms: "",
      paymentType: "full",
    });
    setBlendPayments([{paymentMode: "", amount: ""}]);
    setInstallments([]);
    setFirstInstallment({amount: 0, paymentMode: ""});
    setPaymentType("full");
    setIsSaleDialogOpen(true);
  };

  const handleEditSale = (sale: PackageSale) => {
    if (!can('edit', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to edit package sales",
      });
      return;
    }

    setEditingSale(sale);
    setSaleData({
      billDate: sale.billDate ? new Date(sale.billDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      customer: sale.customer?._id || "",
      packageTemplate: sale.packageTemplate?._id || "",
      doctorId: sale.doctorId?._id || "",
      discountType: "percentage",
      discountValue: 0,
      shippingCost: 0,
      grandTotal: sale.grandTotal || 0,
      remarks: sale.remarks || "",
      terms: "",
    });
    setBlendPayments(Array.isArray(sale.paymentMode) ? sale.paymentMode : [{paymentMode: sale.paymentMode?._id || "", amount: sale.grandTotal || 0}]);
    setIsSaleDialogOpen(true);
  };

  const handleViewSale = (sale: PackageSale) => {
    setViewingSale(sale);
  };

  const handleDeleteSale = async (id: string) => {
    if (!can('delete', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to delete package sales",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this package sale?")) return;

    setDeletingId(id);
    try {
      const response = await authFetch(`/api/packages/subscriptions/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Package sale deleted successfully" });
        fetchPackageSales();
      } else {
        throw new Error(result.message || "Failed to delete package sale");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setDeletingId("");
    }
  };



  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!can('edit', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to save package sales",
      });
      return;
    }

    if (!saleData.customer || !saleData.packageTemplate || !saleData.doctorId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields",
      });
      return;
    }

    if (paymentType === "full") {
      if (blendPayments.length === 0 || blendPayments.some(bp => !bp.paymentMode || (Number(bp.amount) || 0) <= 0)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add at least one valid payment method",
        });
        return;
      }

      const blendPaymentTotal = blendPayments.reduce((sum, bp) => sum + (Number(bp.amount) || 0), 0);
      if (Math.abs(blendPaymentTotal - saleData.grandTotal) >= 0.01) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Total payment amount must equal grand total",
        });
        return;
      }
    } else {
      if (!firstInstallment.paymentMode || firstInstallment.amount <= 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter first installment amount and payment mode",
        });
        return;
      }

      if (installments.length === 0 || installments.some(inst => inst.amount <= 0 || !inst.dueDate)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please add remaining installments",
        });
        return;
      }

      if (firstInstallment.amount > saleData.grandTotal) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "First installment cannot exceed grand total",
        });
        return;
      }
    }

    const payload = {
      ...saleData,
      paymentMode: paymentType === "full" ? blendPayments : [firstInstallment],
      installments: paymentType === "installment" ? installments : undefined,
      firstInstallment: paymentType === "installment" ? firstInstallment : undefined,
      paymentType,
    };

    setIsSaving(true);
    try {
      const url = editingSale
        ? `/api/packages/subscriptions/${editingSale._id}`
        : "/api/packages/subscriptions";
      const method = editingSale ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: editingSale
            ? "Package sale updated successfully"
            : "Package sale created successfully",
        });
        setIsSaleDialogOpen(false);
        fetchPackageSales();
      } else {
        throw new Error(result.message || "Failed to save package sale");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.contact) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill required fields",
      });
      return;
    }
    try {
      const customerData = {
        ...newCustomer,
        age: newCustomer.age ? parseInt(newCustomer.age) : undefined,
      };
      const response = await authFetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) throw new Error("Failed to create customer");
      const result = await response.json();
      toast({ title: "Success", description: "Customer created successfully" });
      setIsCustomerDialogOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        contact: "",
        age: "",
        gender: "",
        address: "",
      });
      fetchCustomers();
      if (result.data?._id) {
        setSaleData(prev => ({ ...prev, customer: result.data._id }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  // Blend payment handlers
  const addBlendPayment = () => {
    if (paymentModes.length > 0) {
      setBlendPayments([...blendPayments, {
        paymentMode: paymentModes[0]._id,
        amount: ""
      }]);
    }
  };

  const updateBlendPayment = (index: number, field: 'paymentMode' | 'amount', value: string | number) => {
    const updated = [...blendPayments];
    updated[index] = { ...updated[index], [field]: value };
    setBlendPayments(updated);
  };

  const removeBlendPayment = (index: number) => {
    setBlendPayments(blendPayments.filter((_, i) => i !== index));
  };

  const blendPaymentTotal = blendPayments.reduce((sum, bp) => sum + (Number(bp.amount) || 0), 0);

  // Installment handlers
  const addInstallment = () => {
    setInstallments([...installments, {
      amount: 0,
      dueDate: new Date().toISOString().split("T")[0],
      status: "pending",
      paymentMode: null
    }]);
  };

  const updateInstallment = (index: number, field: string, value: any) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  const removeInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const remainingAmount = saleData.grandTotal - firstInstallment.amount;
  const installmentTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);

  const handlePrintInvoice = async (saleId: string, printType: "a4" | "thermal" = "a4") => {
    setPrintingId(saleId);
    try {
      await printPackageInvoice(saleId, printType, authFetch);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setPrintingId(null);
    }
  };

  const handlePayInstallment = (saleId: string) => {
    const sale = packageSales.find(s => s._id === saleId);
    if (sale && (sale as any).installments) {
      const pendingInstallment = (sale as any).installments.find((inst: any) => inst.status === "pending");
      if (pendingInstallment) {
        setSelectedInstallment({ ...pendingInstallment, saleId });
        setPaymentData({ paymentMode: "", amount: pendingInstallment.amount });
        setShowPaymentDialog(true);
      }
    }
  };

  const handlePayInstallmentSubmit = async () => {
    if (!selectedInstallment || !paymentData.paymentMode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a payment mode",
      });
      return;
    }

    try {
      const response = await authFetch(`/api/packages/subscriptions/${selectedInstallment.saleId}/installments/${selectedInstallment._id}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMode: paymentData.paymentMode,
          amount: paymentData.amount,
          paidDate: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Installment payment recorded successfully" });
        setShowPaymentDialog(false);
        setSelectedInstallment(null);
        setPaymentData({ paymentMode: "", amount: 0 });
        await fetchPackageSales();
        if (viewingSale && viewingSale._id === selectedInstallment.saleId) {
          const updatedSale = packageSales.find(s => s._id === selectedInstallment.saleId);
          if (updatedSale) setViewingSale(updatedSale);
        }
      } else {
        throw new Error(result.message || "Failed to record payment");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  if (authLoading || !user || !can("view", pathname)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Package className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


//   return (
//     <div className="space-y-6 w-full max-w-full overflow-x-clip">
//       {/* Add Customer Dialog */}
//       <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Add New Customer</DialogTitle>
//           </DialogHeader>
//           <form onSubmit={handleSaveCustomer} className="space-y-4">
//             <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//               <div className="space-y-2">
//                 <Label htmlFor="firstName">First Name *</Label>
//                 <Input
//                   id="firstName"
//                   required
//                   value={newCustomer.firstName}
//                   onChange={(e) => setNewCustomer(p => ({ ...p, firstName: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="lastName">Last Name *</Label>
//                 <Input
//                   id="lastName"
//                   required
//                   value={newCustomer.lastName}
//                   onChange={(e) => setNewCustomer(p => ({ ...p, lastName: e.target.value }))}
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="contact">Contact *</Label>
//               <Input
//                 id="contact"
//                 required
//                 value={newCustomer.contact}
//                 onChange={(e) => setNewCustomer(p => ({ ...p, contact: e.target.value }))}
//               />
//             </div>
//             <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//               <div className="space-y-2">
//                 <Label htmlFor="age">Age</Label>
//                 <Input
//                   id="age"
//                   type="number"
//                   value={newCustomer.age}
//                   onChange={(e) => setNewCustomer(p => ({ ...p, age: e.target.value }))}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="gender">Gender</Label>
//                 <Select
//                   value={newCustomer.gender}
//                   onValueChange={(value) => setNewCustomer(p => ({ ...p, gender: value }))}
//                 >
//                   {/* <SelectTrigger> */}
//                   <SelectTrigger className="h-8 text-xs min-w-0">

//                     <SelectValue placeholder="Select" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Male">Male</SelectItem>
//                     <SelectItem value="Female">Female</SelectItem>
//                     <SelectItem value="Other">Other</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="address">Address</Label>
//               <Textarea
//                 id="address"
//                 value={newCustomer.address}
//                 onChange={(e) => setNewCustomer(p => ({ ...p, address: e.target.value }))}
//               />
//             </div>
//           </form>
//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setIsCustomerDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" onClick={handleSaveCustomer}>
//               Create
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Package Sale Dialog */}
//       <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
//         {/* <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"> */}
//           <DialogContent className="w-full max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[95vh] flex flex-col">

//           <DialogHeader className="pb-4 border-b">
//             <DialogTitle className="text-xl font-semibold">
//               {editingSale ? "Edit Package Sale" : "Add Package Sale"}
//             </DialogTitle>
//             <DialogDescription>
//               {editingSale
//                 ? "Update the package sale details"
//                 : "Create a new package sale"}
//             </DialogDescription>
//           </DialogHeader>
//           <div className="flex-1 overflow-y-auto px-1">
//             <form id="package-sale-form" onSubmit={handleSaveSale} className="space-y-4 py-3">
//               <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//                 <div className="space-y-2">
//                   <Label>Bill Date</Label>
//                   <Input
//                     type="date"
//                     value={saleData.billDate}
//                     onChange={(e) => setSaleData(prev => ({ ...prev, billDate: e.target.value }))}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Doctor *</Label>
//                   <SearchableSelect
//                     options={doctors.map(d => ({
//                       value: d._id,
//                       label: d.name,
//                     }))}
//                     value={saleData.doctorId}
//                     onValueChange={(val) => setSaleData(prev => ({ ...prev, doctorId: val }))}
//                     placeholder="Select Doctor"
//                     searchPlaceholder="Search doctors..."
//                     emptyText="No doctors found."
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Customer *</Label>
//                 <div className="flex items-center gap-1 flex-wrap">
//                   <SearchableSelect
//                     options={customers.map(c => ({
//                       value: c._id,
//                       label: `${c.firstName} ${c.lastName} - ${c.contact || ''}`,
//                     }))}
//                     value={saleData.customer}
//                     onValueChange={(val) => setSaleData(prev => ({ ...prev, customer: val }))}
//                     placeholder="Select Customer"
//                     searchPlaceholder="Search customers..."
//                     emptyText="No customers found."
//                     className="flex-1"
//                   />
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="icon"
//                     className="shrink-0"
//                     onClick={() => setIsCustomerDialogOpen(true)}
//                   >
//                     <UserPlus className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label>Package Template *</Label>
//                 <SearchableSelect
//                   options={packages.map(p => ({
//                     value: p._id,
//                     label: `${p.packageName} - ₹${p.price}`,
//                   }))}
//                   value={saleData.packageTemplate}
//                   onValueChange={(val) => setSaleData(prev => ({ ...prev, packageTemplate: val }))}
//                   placeholder="Select Package"
//                   searchPlaceholder="Search packages..."
//                   emptyText="No packages found."
//                 />
//               </div>

//               {saleData.packageTemplate && (
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base">Package Details</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     {(() => {
//                       const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
//                       if (!selectedPackage) return null;
//                       return (
//                         <div className="space-y-3">
//                           <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Package Name</Label>
//                               <div className="font-medium">{selectedPackage.packageName}</div>
//                             </div>
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Price</Label>
//                               <div className="font-medium">₹{selectedPackage.price}</div>
//                             </div>
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Number of Sessions</Label>
//                               <div className="font-medium">{selectedPackage.numberOfTimes}</div>
//                             </div>
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Frequency</Label>
//                               <div className="font-medium">Every {selectedPackage.frequencyInDays} days</div>
//                             </div>
//                           </div>
//                           {selectedPackage.services && selectedPackage.services.length > 0 && (
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Services Included</Label>
//                               <div className="mt-1 space-y-1">
//                                 {selectedPackage.services.map((service, index) => (
//                                   <div key={index} className="text-sm">
//                                     • {service.productName} - ₹{service.sellingPrice}
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           )}
//                           {selectedPackage.description && (
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Description</Label>
//                               <div className="text-sm mt-1">{selectedPackage.description}</div>
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })()}
//                   </CardContent>
//                 </Card>
//               )}

//               <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm">Payment Details</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div className="space-y-2">
//                       <Label className="text-xs">Payment Type *</Label>
//                       <Select
//                         value={paymentType}
//                         onValueChange={(value: "full" | "installment") => {
//                           setPaymentType(value);
//                           setSaleData(prev => ({ ...prev, paymentType: value }));
//                         }}
//                       >
//                         <SelectTrigger className="h-8 text-xs">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="full">Full Payment</SelectItem>
//                           <SelectItem value="installment">Installment Payment</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>


//                     {paymentType === "full" ? (
//                       <div className="space-y-2">
//                         <Label className="text-xs">Payment Mode *</Label>
//                         <div className="space-y-2">
//                           {blendPayments.map((bp, index) => (
//                             <div key={index} className="flex items-center gap-1 flex-wrap">
//                               <Select
//                                 value={bp.paymentMode}
//                                 onValueChange={(value) => updateBlendPayment(index, 'paymentMode', value)}
//                               >
//                                 <SelectTrigger className="h-8 text-xs flex-1">
//                                   <SelectValue placeholder="Select payment mode" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   {paymentModes.map((pm) => (
//                                     <SelectItem key={pm._id} value={pm._id}>
//                                       {pm.payType}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                               <Input
//                                 type="number"
//                                 step="0.01"
//                                 min="0"
//                                 value={bp.amount}
//                                 onChange={(e) => updateBlendPayment(index, 'amount', e.target.value)}
//                                 className="h-8 text-xs min-w-0"
//                                 placeholder="Amount"
//                               />
//                               <Button
//                                 type="button"
//                                 variant="ghost"
//                                 size="icon"
//                                 className="h-8 w-8"
//                                 onClick={() => removeBlendPayment(index)}
//                               >
//                                 <X className="h-3 w-3" />
//                               </Button>
//                             </div>
//                           ))}
//                           <div className="flex items-center justify-between">
//                             <Button
//                               type="button"
//                               variant="outline"
//                               size="sm"
//                               className="h-6 text-xs"
//                               onClick={addBlendPayment}
//                             >
//                               <PlusCircle className="h-3 w-3 mr-1" />
//                               Add Payment
//                             </Button>
//                             {blendPayments.length > 0 && (
//                               <div className="text-xs">
//                                 <span className={blendPaymentTotal === saleData.grandTotal ? "text-green-600" : "text-red-600"}>
//                                   ₹{blendPaymentTotal.toFixed(2)} / ₹{saleData.grandTotal.toFixed(2)}
//                                 </span>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-3">
//                         <div className="space-y-2">
//                           <Label className="text-xs">First Installment (Pay Now) *</Label>
//                           <div className="flex items-center gap-1 flex-wrap">
//                             <Input
//                               type="number"
//                               step="0.01"
//                               min="0"
//                               value={firstInstallment.amount}
//                               onChange={(e) => setFirstInstallment(prev => ({...prev, amount: Number(e.target.value)}))}
//                               className="h-8 text-xs min-w-0"
//                               placeholder="Amount"
//                             />
//                             <Select
//                               value={firstInstallment.paymentMode}
//                               onValueChange={(value) => setFirstInstallment(prev => ({...prev, paymentMode: value}))}
//                             >
//                               <SelectTrigger className="h-8 text-xs flex-1">
//                                 <SelectValue placeholder="Payment mode" />
//                               </SelectTrigger>
//                               <SelectContent>
//                                 {paymentModes.map((pm) => (
//                                   <SelectItem key={pm._id} value={pm._id}>
//                                     {pm.payType}
//                                   </SelectItem>
//                                 ))}
//                               </SelectContent>
//                             </Select>
//                           </div>
//                         </div>
                        
//                         <div className="space-y-2">
//                           <Label className="text-xs">Remaining Installments *</Label>
//                           <div className="space-y-2">
//                             {installments.map((inst, index) => (
//                               <div key={index} className="flex items-center gap-1 flex-wrap">
//                                 <Input
//                                   type="number"
//                                   step="0.01"
//                                   min="0"
//                                   value={inst.amount}
//                                   onChange={(e) => updateInstallment(index, 'amount', Number(e.target.value))}
//                                   className="h-8 text-xs min-w-0"
//                                   placeholder="Amount"
//                                 />
//                                 <Input
//                                   type="date"
//                                   value={inst.dueDate}
//                                   onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
//                                   className="h-8 text-xs min-w-0"
//                                 />
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="icon"
//                                   className="h-8 w-8"
//                                   onClick={() => removeInstallment(index)}
//                                 >
//                                   <X className="h-3 w-3" />
//                                 </Button>
//                               </div>
//                             ))}
//                             <div className="flex items-center justify-between">
//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 className="h-6 text-xs"
//                                 onClick={addInstallment}
//                               >
//                                 <PlusCircle className="h-3 w-3 mr-1" />
//                                 Add Installment
//                               </Button>
//                               <div className="text-xs">
//                                 <div>Remaining: ₹{remainingAmount.toFixed(2)}</div>
//                                 <div>Installments: ₹{installmentTotal.toFixed(2)}</div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     <div className="space-y-2">
//                       <Label className="text-xs">Remarks</Label>
//                       <Textarea
//                         value={saleData.remarks}
//                         onChange={(e) => setSaleData(prev => ({ ...prev, remarks: e.target.value }))}
//                         placeholder="Enter remarks"
//                         rows={2}
//                       />
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-2">
//                     <CardTitle className="text-sm">Pricing Details</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-2">
//                     <div className="flex items-center gap-1 flex-wrap">
//                       <Label className="text-xs w-20">Discount</Label>
//                       <Select
//                         value={saleData.discountType}
//                         onValueChange={(val: "percentage" | "fixed") =>
//                           setSaleData(prev => ({ ...prev, discountType: val }))
//                         }
//                       >
//                         <SelectTrigger className="w-24 h-8 text-xs">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="percentage">%</SelectItem>
//                           <SelectItem value="fixed">₹</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <Input
//                         type="number"
//                         step="0.01"
//                         value={saleData.discountValue}
//                         onChange={(e) => setSaleData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
//                         className="h-8 flex-1"
//                       />
//                     </div>
//                     <div className="flex items-center gap-1 flex-wrap">
//                       <Label className="text-xs w-20">Shipping</Label>
//                       <Input
//                         type="number"
//                         step="0.01"
//                         value={saleData.shippingCost}
//                         onChange={(e) => setSaleData(prev => ({ ...prev, shippingCost: Number(e.target.value) }))}
//                         className="h-8 flex-1"
//                       />
//                     </div>
//                     <div className="space-y-2 text-sm pt-2 border-t">
//                       <div className="flex justify-between">
//                         <span>Package Price:</span>
//                         <span>₹{(() => {
//                           const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
//                           return selectedPackage ? selectedPackage.price.toFixed(2) : "0.00";
//                         })()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Discount:</span>
//                         <span>₹{(() => {
//                           const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
//                           if (!selectedPackage) return "0.00";
//                           const packagePrice = selectedPackage.price;
//                           const discountAmount = saleData.discountType === "percentage"
//                             ? (packagePrice * saleData.discountValue) / 100
//                             : saleData.discountValue;
//                           return discountAmount.toFixed(2);
//                         })()}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Shipping:</span>
//                         <span>₹{saleData.shippingCost.toFixed(2)}</span>
//                       </div>
//                       <div className="flex justify-between border-t pt-2 font-medium">
//                         <span>Grand Total:</span>
//                         <span>₹{saleData.grandTotal.toFixed(2)}</span>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             </form>
//           </div>
//           <DialogFooter className="border-t pt-4">
//             <DialogClose asChild>
//               <Button type="button" variant="outline">
//                 Cancel
//               </Button>
//             </DialogClose>
//             <Button type="submit" form="package-sale-form" disabled={isSaving}>
//               {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               {editingSale ? "Update Sale" : "Save Sale"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* View Sale Dialog */}
//       <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
//         <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
//           <DialogHeader className="pb-4 border-b">
//             <DialogTitle className="text-xl font-semibold flex items-center justify-between">
//               <span>Package Sale - {viewingSale?.billNo}</span>
//               <span className={`px-3 py-1 rounded-full text-sm ${
//                 viewingSale?.status === "paid"
//                   ? "bg-green-100 text-green-800"
//                   : viewingSale?.status === "pending"
//                   ? "bg-yellow-100 text-yellow-800"
//                   : "bg-red-100 text-red-800"
//               }`}>
//                 {viewingSale?.status?.toUpperCase() || "PENDING"}
//               </span>
//             </DialogTitle>
//           </DialogHeader>
//           <div className="flex-1 overflow-y-auto px-1">
//             <div className="space-y-6 py-4">
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base">Sale Information</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="grid grid-cols-1 sm:grid-cols-2
// ">
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Bill No</Label>
//                         <div className="font-medium">{viewingSale?.billNo || "-"}</div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Bill Date</Label>
//                         <div>{viewingSale?.billDate ? new Date(viewingSale.billDate).toLocaleDateString() : "-"}</div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Customer</Label>
//                         <div className="font-medium">{viewingSale?.customer?.firstName} {viewingSale?.customer?.lastName || "-"}</div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Doctor</Label>
//                         <div>{viewingSale?.doctorId?.name || "-"}</div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Package</Label>
//                         <div className="font-medium">{viewingSale?.packageTemplate?.packageName || "-"}</div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Package Price</Label>
//                         <div className="font-medium">₹{viewingSale?.packageTemplate?.price?.toFixed(2) || "0.00"}</div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base">Financial Summary</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div className="flex justify-between">
//                       <span className="text-sm">Package Price:</span>
//                       <span>₹{viewingSale?.packageTemplate?.price?.toFixed(2) || "0.00"}</span>
//                     </div>
//                     <div className="border-t pt-3">
//                       <div className="flex justify-between font-semibold text-lg">
//                         <span>Bill Amount:</span>
//                         <span>₹{(viewingSale as any)?.paymentType === "installment" ? 
//                           (viewingSale?.paymentMode && viewingSale.paymentMode[0]?.amount?.toFixed(2)) || "0.00" : 
//                           viewingSale?.grandTotal?.toFixed(2) || "0.00"}</span>
//                       </div>
//                       {(viewingSale as any)?.paymentType === "installment" && (
//                         <div className="flex justify-between text-sm text-muted-foreground">
//                           <span>Total Package:</span>
//                           <span>₹{viewingSale?.grandTotal?.toFixed(2) || "0.00"}</span>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {((viewingSale as any)?.firstInstallment || (viewingSale as any)?.installments?.length > 0) && (
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base">Payment Details</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {(viewingSale as any)?.paymentType === "installment" && viewingSale?.paymentMode && viewingSale.paymentMode[0] && (
//                         <div>
//                           <Label className="text-xs text-muted-foreground">First Installment (Paid)</Label>
//                           <div className="flex justify-between items-center p-2 border rounded bg-green-50">
//                             <div className="flex items-center gap-4">
//                               <span className="text-sm font-medium">₹{viewingSale.paymentMode[0].amount?.toFixed(2)}</span>
//                               <span className="text-xs">{viewingSale.paymentMode[0].paymentMode?.payType || 'N/A'}</span>
//                             </div>
//                             <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
//                               Paid
//                             </span>
//                           </div>
//                         </div>
//                       )}
                      
//                       {(viewingSale as any)?.installments && (viewingSale as any).installments.length > 0 && (
//                         <div>
//                           <Label className="text-xs text-muted-foreground">Remaining Installments</Label>
//                           <div className="space-y-2">
//                             {(viewingSale as any).installments.map((inst: any, index: number) => (
//                               <div key={index} className="flex justify-between items-center p-2 border rounded">
//                                 <div className="flex items-center gap-4">
//                                   <span className="text-sm font-medium">₹{inst.amount?.toFixed(2)}</span>
//                                   <span className="text-xs text-muted-foreground">{new Date(inst.dueDate).toLocaleDateString()}</span>
//                                   {inst.paymentMode && (
//                                     <span className="text-xs">{inst.paymentMode.payType}</span>
//                                   )}
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                   <span className={`px-2 py-1 rounded-full text-xs ${
//                                     inst.status === "paid"
//                                       ? "bg-green-100 text-green-800"
//                                       : inst.status === "pending"
//                                       ? "bg-yellow-100 text-yellow-800"
//                                       : "bg-red-100 text-red-800"
//                                   }`}>
//                                     {inst.status || "pending"}
//                                   </span>
//                                   {inst.status === "pending" && (
//                                     <Button
//                                       size="sm"
//                                       className="h-6 px-2 text-xs"
//                                       onClick={() => {
//                                         setSelectedInstallment({ ...inst, saleId: viewingSale?._id });
//                                         setPaymentData({ paymentMode: "", amount: inst.amount });
//                                         setShowPaymentDialog(true);
//                                       }}
//                                     >
//                                       Pay
//                                     </Button>
//                                   )}
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {viewingSale?.remarks && (
//                 <Card>
//                   <CardHeader className="pb-3">
//                     <CardTitle className="text-base">Additional Information</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div>
//                       <Label className="text-xs text-muted-foreground">Remarks</Label>
//                       <div className="text-sm mt-1">{viewingSale.remarks}</div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </div>
//           <DialogFooter className="border-t pt-4">
//             <div className="flex justify-between w-full">
//               <div className="flex gap-2">
//                 {can('edit', pathname) && (
//                   <Button variant="outline" onClick={() => handleEditSale(viewingSale!)}>
//                     <Edit className="mr-2 h-4 w-4" /> Edit
//                   </Button>
//                 )}
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setSelectedPrintId(viewingSale?._id || null);
//                     setShowPrintDialog(true);
//                   }}
//                   disabled={printingId === viewingSale?._id}
//                 >
//                   {printingId === viewingSale?._id ? (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   ) : (
//                     <Printer className="mr-2 h-4 w-4" />
//                   )}
//                   Print Invoice
//                 </Button>
//               </div>
//               <Button variant="secondary" onClick={() => setViewingSale(null)}>Close</Button>
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Installment Payment Dialog */}
//       <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Pay Installment</DialogTitle>
//             <DialogDescription>
//               Record payment for installment amount of ₹{selectedInstallment?.amount || 0}
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Amount</Label>
//               <Input
//                 type="number"
//                 value={paymentData.amount}
//                 onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
//                 disabled
//               />
//             </div>
//             <div className="space-y-2">
//               <Label>Payment Mode *</Label>
//               <Select
//                 value={paymentData.paymentMode}
//                 onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMode: value }))}
//               >
//                 {/* <SelectTrigger> */}
//                 <SelectTrigger className="h-8 text-xs min-w-0">

//                   <SelectValue placeholder="Select payment mode" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {paymentModes.map((pm) => (
//                     <SelectItem key={pm._id} value={pm._id}>
//                       {pm.payType}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="text-sm text-muted-foreground">
//               Due Date: {selectedInstallment?.dueDate ? new Date(selectedInstallment.dueDate).toLocaleDateString() : "N/A"}
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handlePayInstallmentSubmit}>
//               Record Payment
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Main Content */}
//       <Card>
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <CardTitle>Package Sales</CardTitle>
//             {can('edit', pathname) && (
//               <Button onClick={handleAddNewClick}>
//                 <PlusCircle className="mr-2 h-4 w-4" /> Add Package Sale
//               </Button>
//             )}
//           </div>
//           <CardDescription>
//             Manage package sales and customer subscriptions.
//           </CardDescription>
          
//           {/* Filters */}
//           <div className="space-y-4 mt-4">
//             <div className="flex items-center gap-4">
//               <div className="relative flex-1 max-w-sm">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                 <Input
//                   placeholder="Search by bill no, customer name..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   setSearchTerm('');
//                   setCustomerFilter('all');
//                   setDoctorFilter('all');
//                   setStatusFilter('all');
//                   setPaymentModeFilter('all');
//                   setDateRange(undefined);
//                   setCurrentPage(1);
//                 }}
//                 disabled={!searchTerm && customerFilter === 'all' && doctorFilter === 'all' && statusFilter === 'all' && paymentModeFilter === 'all' && !dateRange}
//               >
//                 <RotateCcw className="mr-2 h-4 w-4" /> Reset
//               </Button>
//             </div>
            
//             <div className="flex items-center gap-2 flex-wrap">
//               <Filter className="h-4 w-4 text-muted-foreground" />
//               <Select value={customerFilter} onValueChange={setCustomerFilter}>
//                 <SelectTrigger className="w-48">
//                   <SelectValue placeholder="All Customers" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Customers</SelectItem>
//                   {customers.map((customer) => (
//                     <SelectItem key={customer._id} value={customer._id}>
//                       {customer.firstName} {customer.lastName}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
              
//               <Select value={doctorFilter} onValueChange={setDoctorFilter}>
//                 <SelectTrigger className="w-40">
//                   <SelectValue placeholder="All Doctors" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Doctors</SelectItem>
//                   {doctors.map((doctor) => (
//                     <SelectItem key={doctor._id} value={doctor._id}>
//                       {doctor.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
              
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue placeholder="All Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="due">Due</SelectItem>
//                   <SelectItem value="paid">Paid</SelectItem>
//                   <SelectItem value="partial">Partial</SelectItem>
//                   <SelectItem value="cancelled">Cancelled</SelectItem>
//                 </SelectContent>
//               </Select>
              
//               <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
//                 <SelectTrigger className="w-40">
//                   <SelectValue placeholder="Payment Type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Types</SelectItem>
//                   <SelectItem value="full">Full Payment</SelectItem>
//                   <SelectItem value="installment">Installment</SelectItem>
//                 </SelectContent>
//               </Select>
              
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button variant="outline" className="w-40">
//                     <CalendarDays className="mr-2 h-4 w-4" />
//                     {dateRange?.from ? (
//                       dateRange.to ? (
//                         <>
//                           {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
//                         </>
//                       ) : (
//                         format(dateRange.from, "MMM dd, yyyy")
//                       )
//                     ) : (
//                       "Date Range"
//                     )}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="end">
//                   <Calendar
//                     initialFocus
//                     mode="range"
//                     defaultMonth={dateRange?.from}
//                     selected={dateRange}
//                     onSelect={setDateRange}
//                     numberOfMonths={2}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>
//         </CardHeader>
        
//         <CardContent className="p-0">
//           <div className="overflow-auto h-[60vh] border-t">
//             <Table>
//               <TableHeader className="bg-muted sticky top-0 z-10">
//                 <TableRow>
//                   <TableHead className="min-w-[120px]">Bill No</TableHead>
//                   <TableHead className="min-w-[100px]">Bill Date</TableHead>
//                   <TableHead className="min-w-[150px]">Customer</TableHead>
//                   <TableHead className="min-w-[150px]">Package</TableHead>
//                   <TableHead className="min-w-[120px]">Grand Total</TableHead>
//                   <TableHead className="min-w-[100px]">Payment Type</TableHead>
//                   <TableHead className="min-w-[80px]">Status</TableHead>
//                   <TableHead className="min-w-[120px] text-right">Action</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {isLoading ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center h-24">
//                       <Loader2 className="animate-spin mx-auto" />
//                     </TableCell>
//                   </TableRow>
//                 ) : packageSales.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center h-24">
//                       No package sales found.
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   packageSales.map((sale) => (
//                     <TableRow key={sale._id} className="hover:bg-muted/50">
//                       <TableCell className="font-medium">{sale.billNo}</TableCell>
//                       <TableCell>{new Date(sale.billDate).toLocaleDateString()}</TableCell>
//                       <TableCell>{`${sale.customer?.firstName} ${sale.customer?.lastName}` || "N/A"}</TableCell>
//                       <TableCell>{sale.packageTemplate?.packageName || "N/A"}</TableCell>
//                       <TableCell className="font-medium">
//                         ₹{sale.grandTotal?.toFixed(2) || "0.00"}
//                       </TableCell>
//                       <TableCell>
//                         <span className={`px-2 py-1 rounded-full text-xs ${
//                           (sale as any).paymentType === "installment"
//                             ? "bg-blue-100 text-blue-800"
//                             : "bg-gray-100 text-gray-800"
//                         }`}>
//                           {(sale as any).paymentType === "installment" ? "Installment" : "Full"}
//                         </span>
//                       </TableCell>
//                       <TableCell>
//                         <span className={`px-2 py-1 rounded-full text-xs ${
//                           sale.status === "paid"
//                             ? "bg-green-100 text-green-800"
//                             : sale.status === "pending"
//                             ? "bg-yellow-100 text-yellow-800"
//                             : "bg-red-100 text-red-800"
//                         }`}>
//                           {sale.status || "pending"}
//                         </span>
//                       </TableCell>
//                       <TableCell className="text-right space-x-1">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-8 w-8"
//                           onClick={() => handleViewSale(sale)}
//                         >
//                           <Eye className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-8 w-8"
//                           disabled={printingId === sale._id}
//                           title="Print Invoice"
//                           onClick={() => {
//                             setSelectedPrintId(sale._id);
//                             setShowPrintDialog(true);
//                           }}
//                         >
//                           {printingId === sale._id ? (
//                             <Loader2 className="h-4 w-4 animate-spin" />
//                           ) : (
//                             <Printer className="h-4 w-4" />
//                           )}
//                         </Button>
//                         {(sale as any).paymentType === "installment" && (sale as any).installments?.some((inst: any) => inst.status === "pending") && (
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-8 px-2 text-xs"
//                             onClick={() => handlePayInstallment(sale._id)}
//                           >
//                             Pay
//                           </Button>
//                         )}
//                         {can('edit', pathname) && (
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8"
//                             onClick={() => handleEditSale(sale)}
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                         )}
//                         {can('delete', pathname) && (
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-8 w-8"
//                             onClick={() => handleDeleteSale(sale._id)}
//                             disabled={deletingId === sale._id}
//                           >
//                             {deletingId === sale._id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Trash2 className="h-4 w-4 text-destructive" />
//                             )}
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
          
//           {/* Pagination */}
//           <div className="flex items-center justify-between px-4 py-3 border-t">
//             <div className="text-sm text-muted-foreground">
//               Showing {packageSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
//               {Math.min(currentPage * itemsPerPage, totalSales)} of {totalSales} entries
//             </div>
//             <div className="flex items-center space-x-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(1)}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronsLeft className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
//               <span className="text-sm">
//                 Page {currentPage} of {Math.ceil(totalSales / itemsPerPage)}
//               </span>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(currentPage + 1)}
//                 disabled={currentPage === Math.ceil(totalSales / itemsPerPage)}
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage(Math.ceil(totalSales / itemsPerPage))}
//                 disabled={currentPage === Math.ceil(totalSales / itemsPerPage)}
//               >
//                 <ChevronsRight className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Print Dialog */}
//       <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
//         <AlertDialogContent className="sm:max-w-md">
//           <AlertDialogHeader>
//             <AlertDialogTitle>Choose Print Format</AlertDialogTitle>
//             <AlertDialogDescription>Select the print format for your invoice.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel onClick={() => setShowPrintDialog(false)}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => {
//                 if (selectedPrintId) handlePrintInvoice(selectedPrintId, "thermal");
//                 setShowPrintDialog(false);
//               }}
//             >
//               Thermal (80mm)
//             </AlertDialogAction>
//             <AlertDialogAction
//               onClick={() => {
//                 if (selectedPrintId) handlePrintInvoice(selectedPrintId, "a4");
//                 setShowPrintDialog(false);
//               }}
//             >
//               A4 Size
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }




return (
  <div className="space-y-6 w-full max-w-full overflow-x-hidden">
    {/* Add Customer Dialog */}
    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer(p => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer(p => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact *</Label>
            <Input
              id="contact"
              required
              value={newCustomer.contact}
              onChange={(e) => setNewCustomer(p => ({ ...p, contact: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={newCustomer.age}
                onChange={(e) => setNewCustomer(p => ({ ...p, age: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={newCustomer.gender}
                onValueChange={(value) => setNewCustomer(p => ({ ...p, gender: value }))}
              >
                <SelectTrigger className="h-10 min-w-0">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer(p => ({ ...p, address: e.target.value }))}
            />
          </div>
        </form>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCustomerDialogOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSaveCustomer} className="w-full sm:w-auto">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Package Sale Dialog */}
    <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
      <DialogContent className="w-[95vw] max-h-[95vh] flex flex-col sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {editingSale ? "Edit Package Sale" : "Add Package Sale"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {editingSale
              ? "Update the package sale details"
              : "Create a new package sale"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="package-sale-form" onSubmit={handleSaveSale} className="space-y-4 py-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bill Date</Label>
                <Input
                  type="date"
                  value={saleData.billDate}
                  onChange={(e) => setSaleData(prev => ({ ...prev, billDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <SearchableSelect
                  options={doctors.map(d => ({
                    value: d._id,
                    label: d.name,
                  }))}
                  value={saleData.doctorId}
                  onValueChange={(val) => setSaleData(prev => ({ ...prev, doctorId: val }))}
                  placeholder="Select Doctor"
                  searchPlaceholder="Search doctors..."
                  emptyText="No doctors found."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer *</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <SearchableSelect
                  options={customers.map(c => ({
                    value: c._id,
                    label: `${c.firstName} ${c.lastName} - ${c.contact || ''}`,
                  }))}
                  value={saleData.customer}
                  onValueChange={(val) => setSaleData(prev => ({ ...prev, customer: val }))}
                  placeholder="Select Customer"
                  searchPlaceholder="Search customers..."
                  emptyText="No customers found."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setIsCustomerDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Package Template *</Label>
              <SearchableSelect
                options={packages.map(p => ({
                  value: p._id,
                  label: `${p.packageName} - ₹${p.price}`,
                }))}
                value={saleData.packageTemplate}
                onValueChange={(val) => setSaleData(prev => ({ ...prev, packageTemplate: val }))}
                placeholder="Select Package"
                searchPlaceholder="Search packages..."
                emptyText="No packages found."
              />
            </div>

            {saleData.packageTemplate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
                    if (!selectedPackage) return null;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-sm text-muted-foreground">Package Name</Label>
                            <div className="font-medium">{selectedPackage.packageName}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Price</Label>
                            <div className="font-medium">₹{selectedPackage.price}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Number of Sessions</Label>
                            <div className="font-medium">{selectedPackage.numberOfTimes}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Frequency</Label>
                            <div className="font-medium">Every {selectedPackage.frequencyInDays} days</div>
                          </div>
                        </div>
                        {selectedPackage.services && selectedPackage.services.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Services Included</Label>
                            <div className="mt-1 space-y-1">
                              {selectedPackage.services.map((service, index) => (
                                <div key={index} className="text-sm">
                                  • {service.productName} - ₹{service.sellingPrice}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedPackage.description && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Description</Label>
                            <div className="text-sm mt-1">{selectedPackage.description}</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Type *</Label>
                    <Select
                      value={paymentType}
                      onValueChange={(value: "full" | "installment") => {
                        setPaymentType(value);
                        setSaleData(prev => ({ ...prev, paymentType: value }));
                      }}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Payment</SelectItem>
                        <SelectItem value="installment">Installment Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentType === "full" ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Payment Mode *</Label>
                      <div className="space-y-2">
                        {blendPayments.map((bp, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Select
                              value={bp.paymentMode}
                              onValueChange={(value) => updateBlendPayment(index, 'paymentMode', value)}
                            >
                              <SelectTrigger className="h-10 text-sm flex-1">
                                <SelectValue placeholder="Select payment mode" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentModes.map((pm) => (
                                  <SelectItem key={pm._id} value={pm._id}>
                                    {pm.payType}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={bp.amount}
                              onChange={(e) => updateBlendPayment(index, 'amount', e.target.value)}
                              className="h-10 text-sm"
                              placeholder="Amount"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => removeBlendPayment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs w-full sm:w-auto"
                            onClick={addBlendPayment}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add Payment
                          </Button>
                          {blendPayments.length > 0 && (
                            <div className="text-xs text-center sm:text-right">
                              <span className={blendPaymentTotal === saleData.grandTotal ? "text-green-600" : "text-red-600"}>
                                ₹{blendPaymentTotal.toFixed(2)} / ₹{saleData.grandTotal.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">First Installment (Pay Now) *</Label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={firstInstallment.amount}
                            onChange={(e) => setFirstInstallment(prev => ({...prev, amount: Number(e.target.value)}))}
                            className="h-10 text-sm"
                            placeholder="Amount"
                          />
                          <Select
                            value={firstInstallment.paymentMode}
                            onValueChange={(value) => setFirstInstallment(prev => ({...prev, paymentMode: value}))}
                          >
                            <SelectTrigger className="h-10 text-sm flex-1">
                              <SelectValue placeholder="Payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentModes.map((pm) => (
                                <SelectItem key={pm._id} value={pm._id}>
                                  {pm.payType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Remaining Installments *</Label>
                        <div className="space-y-2">
                          {installments.map((inst, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={inst.amount}
                                onChange={(e) => updateInstallment(index, 'amount', Number(e.target.value))}
                                className="h-10 text-sm"
                                placeholder="Amount"
                              />
                              <Input
                                type="date"
                                value={inst.dueDate}
                                onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                                className="h-10 text-sm flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => removeInstallment(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs w-full sm:w-auto"
                              onClick={addInstallment}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add Installment
                            </Button>
                            <div className="text-xs text-center sm:text-right">
                              <div>Remaining: ₹{remainingAmount.toFixed(2)}</div>
                              <div>Installments: ₹{installmentTotal.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Remarks</Label>
                    <Textarea
                      value={saleData.remarks}
                      onChange={(e) => setSaleData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Enter remarks"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pricing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Label className="text-xs sm:w-20">Discount</Label>
                    <div className="flex flex-1 gap-2">
                      <Select
                        value={saleData.discountType}
                        onValueChange={(val: "percentage" | "fixed") =>
                          setSaleData(prev => ({ ...prev, discountType: val }))
                        }
                      >
                        <SelectTrigger className="h-10 text-sm w-full sm:w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">₹</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={saleData.discountValue}
                        onChange={(e) => setSaleData(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                        className="h-10 flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Label className="text-xs sm:w-20">Shipping</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={saleData.shippingCost}
                      onChange={(e) => setSaleData(prev => ({ ...prev, shippingCost: Number(e.target.value) }))}
                      className="h-10 flex-1"
                    />
                  </div>
                  <div className="space-y-2 text-sm pt-3 border-t">
                    <div className="flex justify-between">
                      <span>Package Price:</span>
                      <span>₹{(() => {
                        const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
                        return selectedPackage ? selectedPackage.price.toFixed(2) : "0.00";
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>₹{(() => {
                        const selectedPackage = packages.find(p => p._id === saleData.packageTemplate);
                        if (!selectedPackage) return "0.00";
                        const packagePrice = selectedPackage.price;
                        const discountAmount = saleData.discountType === "percentage"
                          ? (packagePrice * saleData.discountValue) / 100
                          : saleData.discountValue;
                        return discountAmount.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>₹{saleData.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Grand Total:</span>
                      <span>₹{saleData.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
        <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="package-sale-form" disabled={isSaving} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingSale ? "Update Sale" : "Save Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* View Sale Dialog */}
    <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>Package Sale - {viewingSale?.billNo}</span>
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
              viewingSale?.status === "paid"
                ? "bg-green-100 text-green-800"
                : viewingSale?.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}>
              {viewingSale?.status?.toUpperCase() || "PENDING"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sale Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bill No</Label>
                      <div className="font-medium truncate">{viewingSale?.billNo || "-"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bill Date</Label>
                      <div>{viewingSale?.billDate ? new Date(viewingSale.billDate).toLocaleDateString() : "-"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer</Label>
                      <div className="font-medium truncate">{viewingSale?.customer?.firstName} {viewingSale?.customer?.lastName || "-"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Doctor</Label>
                      <div className="truncate">{viewingSale?.doctorId?.name || "-"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Package</Label>
                      <div className="font-medium truncate">{viewingSale?.packageTemplate?.packageName || "-"}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Package Price</Label>
                      <div className="font-medium">₹{viewingSale?.packageTemplate?.price?.toFixed(2) || "0.00"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Package Price:</span>
                    <span>₹{viewingSale?.packageTemplate?.price?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Bill Amount:</span>
                      <span>₹{(viewingSale as any)?.paymentType === "installment" ? 
                        (viewingSale?.paymentMode && viewingSale.paymentMode[0]?.amount?.toFixed(2)) || "0.00" : 
                        viewingSale?.grandTotal?.toFixed(2) || "0.00"}</span>
                    </div>
                    {(viewingSale as any)?.paymentType === "installment" && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total Package:</span>
                        <span>₹{viewingSale?.grandTotal?.toFixed(2) || "0.00"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {((viewingSale as any)?.firstInstallment || (viewingSale as any)?.installments?.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(viewingSale as any)?.paymentType === "installment" && viewingSale?.paymentMode && viewingSale.paymentMode[0] && (
                      <div>
                        <Label className="text-xs text-muted-foreground">First Installment (Paid)</Label>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 border rounded bg-green-50 gap-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <span className="text-sm font-medium">₹{viewingSale.paymentMode[0].amount?.toFixed(2)}</span>
                            <span className="text-xs">{viewingSale.paymentMode[0].paymentMode?.payType || 'N/A'}</span>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 self-start sm:self-auto">
                            Paid
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {(viewingSale as any)?.installments && (viewingSale as any).installments.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Remaining Installments</Label>
                        <div className="space-y-2">
                          {(viewingSale as any).installments.map((inst: any, index: number) => (
                            <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 border rounded gap-2">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                <span className="text-sm font-medium">₹{inst.amount?.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">{new Date(inst.dueDate).toLocaleDateString()}</span>
                                {inst.paymentMode && (
                                  <span className="text-xs">{inst.paymentMode.payType}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  inst.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : inst.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {inst.status || "pending"}
                                </span>
                                {inst.status === "pending" && (
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setSelectedInstallment({ ...inst, saleId: viewingSale?._id });
                                      setPaymentData({ paymentMode: "", amount: inst.amount });
                                      setShowPaymentDialog(true);
                                    }}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {viewingSale?.remarks && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-xs text-muted-foreground">Remarks</Label>
                    <div className="text-sm mt-1 break-words">{viewingSale.remarks}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {can('edit', pathname) && (
                <Button variant="outline" onClick={() => handleEditSale(viewingSale!)} className="w-full sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPrintId(viewingSale?._id || null);
                  setShowPrintDialog(true);
                }}
                disabled={printingId === viewingSale?._id}
                className="w-full sm:w-auto"
              >
                {printingId === viewingSale?._id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Print Invoice
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setViewingSale(null)} className="w-full sm:w-auto">Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Installment Payment Dialog */}
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Installment</DialogTitle>
          <DialogDescription className="text-sm">
            Record payment for installment amount of ₹{selectedInstallment?.amount || 0}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Mode *</Label>
            <Select
              value={paymentData.paymentMode}
              onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMode: value }))}
            >
              <SelectTrigger className="h-10 min-w-0">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((pm) => (
                  <SelectItem key={pm._id} value={pm._id}>
                    {pm.payType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Due Date: {selectedInstallment?.dueDate ? new Date(selectedInstallment.dueDate).toLocaleDateString() : "N/A"}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handlePayInstallmentSubmit} className="w-full sm:w-auto">
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Main Content */}
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-lg sm:text-xl">Package Sales</CardTitle>
          {can('edit', pathname) && (
            <Button onClick={handleAddNewClick} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Package Sale
            </Button>
          )}
        </div>
        <CardDescription className="text-sm">
          Manage package sales and customer subscriptions.
        </CardDescription>
        
        {/* Filters */}
        <div className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by bill no, customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setCustomerFilter('all');
                setDoctorFilter('all');
                setStatusFilter('all');
                setPaymentModeFilter('all');
                setDateRange(undefined);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto"
              disabled={!searchTerm && customerFilter === 'all' && doctorFilter === 'all' && statusFilter === 'all' && paymentModeFilter === 'all' && !dateRange}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Filters:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 w-full">
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor._id} value={doctor._id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="truncate">
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                        </span>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full border-t">
          <div className="min-w-[768px]">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Bill No</TableHead>
                  <TableHead className="whitespace-nowrap">Bill Date</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Package</TableHead>
                  <TableHead className="whitespace-nowrap">Grand Total</TableHead>
                  <TableHead className="whitespace-nowrap">Payment Type</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      <Loader2 className="animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : packageSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No package sales found.
                    </TableCell>
                  </TableRow>
                ) : (
                  packageSales.map((sale) => (
                    <TableRow key={sale._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{sale.billNo}</TableCell>
                      <TableCell>{new Date(sale.billDate).toLocaleDateString()}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{`${sale.customer?.firstName} ${sale.customer?.lastName}` || "N/A"}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{sale.packageTemplate?.packageName || "N/A"}</TableCell>
                      <TableCell className="font-medium">
                        ₹{sale.grandTotal?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (sale as any).paymentType === "installment"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {(sale as any).paymentType === "installment" ? "Installment" : "Full"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {sale.status || "pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewSale(sale)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={printingId === sale._id}
                            title="Print Invoice"
                            onClick={() => {
                              setSelectedPrintId(sale._id);
                              setShowPrintDialog(true);
                            }}
                          >
                            {printingId === sale._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                          {(sale as any).paymentType === "installment" && (sale as any).installments?.some((inst: any) => inst.status === "pending") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handlePayInstallment(sale._id)}
                            >
                              Pay
                            </Button>
                          )}
                          {can('edit', pathname) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditSale(sale)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {can('delete', pathname) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteSale(sale._id)}
                              disabled={deletingId === sale._id}
                            >
                              {deletingId === sale._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {packageSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalSales)} of {totalSales} entries
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
            <span className="text-sm">
              Page {currentPage} of {Math.ceil(totalSales / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalSales / itemsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.ceil(totalSales / itemsPerPage))}
              disabled={currentPage === Math.ceil(totalSales / itemsPerPage)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Print Dialog */}
    <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Choose Print Format</AlertDialogTitle>
          <AlertDialogDescription>Select the print format for your invoice.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setShowPrintDialog(false)} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </AlertDialogCancel>
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
            <AlertDialogAction
              onClick={() => {
                if (selectedPrintId) handlePrintInvoice(selectedPrintId, "thermal");
                setShowPrintDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              Thermal (80mm)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (selectedPrintId) handlePrintInvoice(selectedPrintId, "a4");
                setShowPrintDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              A4 Size
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}