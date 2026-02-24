"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useRouter, usePathname } from "next/navigation";
import { Supplier } from "@/lib/data";

// Extend Product type to include GST fields
type Product = {
  _id: string;
  productName: string;
  sellingPrice: number;
  mrp?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  type?: string;
  // Add other fields as needed
};
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Edit,
  Eye,
  Printer,
  Check,
  X,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  Filter,
  CalendarDays,
  Phone,
  User,
} from "lucide-react";
import { getAssetUrl } from "@/lib/asset-utils";
import { printSalesInvoice } from "./components/InvoicePrint";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

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

export default function SalesPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalSales, setTotalSales] = useState(0);
  const [grandTotalSum, setGrandTotalSum] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 10;
  const [viewingSale, setViewingSale] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentSale, setSelectedPaymentSale] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<"partial" | "full">("full");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [saleData, setSaleData] = useState({
    billNo: "",
    billDate: new Date().toISOString().split("T")[0],
    customer: "",
    doctorId: "",
    project: "",
    items: [] as Array<{
      product: string;
      productName: string;
      store: string;
      qty: number;
      rate: number;
      subtotal: number;
      cgstPercent: number;
      sgstPercent: number;
      igstPercent: number;
      is_igst: boolean;
      total: number;
    }>,
    subtotal: 0,
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    shippingCost: 0,
    grandTotal: 0,
    paymentMode: "",
    status: "due" as "due" | "paid" | "cancelled",
    tds: 0,
    remarks: "",
    terms: "",
    creditNoteAmount: 0,
    uploadedDocs: [] as string[],
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [productRate, setProductRate] = useState("");
  const [itemCgst, setItemCgst] = useState("");
  const [itemSgst, setItemSgst] = useState("");
  const [itemIgst, setItemIgst] = useState("");
  const [gstType, setGstType] = useState<"cgst_sgst" | "igst">("cgst_sgst");

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [storesWithStock, setStoresWithStock] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [blendPayments, setBlendPayments] = useState<{paymentMode: string; amount: string | number}[]>([{paymentMode: "", amount: ""}]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    age: "",
    gender: "",
    address: "",
  });

  // Fetch all data on component mount
  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchAllData();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  // Search functions for dropdowns
  const searchCustomers = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) return [];

      setCustomerLoading(true);
      try {
        const response = await authFetch(
          `/api/patients?search=${encodeURIComponent(searchTerm)}&limit=50`
        );
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((c: any) => ({
            _id: c._id,
            firstName: c.firstName,
            lastName: c.lastName,
            contact: c.contact,
            companyName: `${c.firstName} ${c.lastName}`,
            name: `${c.firstName} ${c.lastName}`,
          }));
        }
        return [];
      } catch (error) {
        return [];
      } finally {
        setCustomerLoading(false);
      }
    },
    [authFetch]
  );

  const searchProducts = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) return [];

      setProductLoading(true);
      try {
        const response = await authFetch(
          `/api/products?search=${encodeURIComponent(searchTerm)}&limit=50`
        );
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((p: any) => ({
            _id: p._id,
            productName: p.productName,
            sellingPrice: p.sellingPrice,
            companyName: p.productName,
            name: p.productName,
          }));
        }
        return [];
      } catch (error) {
        return [];
      } finally {
        setProductLoading(false);
      }
    },
    [authFetch]
  );

  const searchStores = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) return [];

      setStoreLoading(true);
      try {
        const response = await authFetch(
          `/api/inventory/locations?search=${encodeURIComponent(
            searchTerm
          )}&limit=50`
        );
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((s: any) => ({
            _id: s._id,
            storeName: s.storeName || s.name,
            companyName: s.storeName || s.name,
            name: s.storeName || s.name,
          }));
        }
        return [];
      } catch (error) {
        return [];
      } finally {
        setStoreLoading(false);
      }
    },
    [authFetch]
  );

  const fetchSales = React.useCallback(async () => {
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
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
        ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter }),
        ...(serviceTypeFilter && serviceTypeFilter !== 'all' && { serviceType: serviceTypeFilter }),
        sortBy,
        sortOrder,
      });
      
      const salesRes = await authFetch(`/api/sales/bills?${params}`);
      const salesData = await salesRes.json();
      
      if (salesData.success) {
        setSales(salesData.data);
        setTotalSales(salesData.pagination?.totalItems || 0);
        setGrandTotalSum(salesData.grandTotalSum || 0);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch sales",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, customerFilter, doctorFilter, statusFilter, paymentModeFilter, dateRange, minAmount, maxAmount, categoryFilter, serviceTypeFilter, sortBy, sortOrder, authFetch, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);



  const fetchInitialData = async () => {
    try {
      const [customersRes, productsRes, paymentModesRes, doctorsRes] = await Promise.all([
        authFetch("/api/patients?limit=50"),
        authFetch("/api/products?limit=50"),
        authFetch("/api/finance/paytypes"),
        authFetch("/api/users?role=doctor")
      ]);
      
      const [customersData, productsData, paymentModesData, doctorsData] = await Promise.all([
        customersRes.json(),
        productsRes.json(),
        paymentModesRes.json(),
        doctorsRes.json()
      ]);
      
      if (customersData.success) {
        setCustomers(customersData.data.filter((c: Customer) => !c.deletedAt));
      }
      
      if (productsData.success) {
        setProducts(productsData.data || []);
      }
      
      if (paymentModesData.success) {
        setPaymentModes(paymentModesData.data.filter((pm: PaymentMode) => pm.status));
      }
      
      if (doctorsData.success) {
        setDoctors(doctorsData.data || []);
      } else if (Array.isArray(doctorsData)) {
        setDoctors(doctorsData);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch initial data" });
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchInitialData(), fetchSales()]);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setIsLoading(false);
    }
  };

  const addProductToItems = () => {
    const product = products.find((p) => p._id === selectedProduct);
    const isService = (product?.type || "").toLowerCase() === "service";
    
    if (
      !selectedProduct ||
      productQty <= 0 ||
      (Number(productRate) || 0) <= 0 ||
      (!isService && !selectedStore)
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isService 
          ? "Please fill all product details"
          : "Please fill all product details and select a store",
      });
      return;
    }

    // Validate GST logic: Either CGST+SGST OR IGST, not both
    const hasCgstSgst = (Number(itemCgst) || 0) > 0 || (Number(itemSgst) || 0) > 0;
    const hasIgst = (Number(itemIgst) || 0) > 0;
    
    if (hasCgstSgst && hasIgst) {
      toast({
        variant: "destructive",
        title: "Invalid GST Configuration",
        description: "You cannot apply both CGST/SGST and IGST. Use CGST+SGST for intra-state or IGST for inter-state transactions.",
      });
      return;
    }

    // Check for duplicate product
    const existingItem = saleData.items.find(
      (item) => item.product === selectedProduct
    );
    if (existingItem) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Product already added. Use edit to modify quantity.",
      });
      return;
    }

    const rate = Number(productRate) || 0;
    const subtotal = productQty * rate;
    const cgstAmount = (subtotal * (Number(itemCgst) || 0)) / 100;
    const sgstAmount = (subtotal * (Number(itemSgst) || 0)) / 100;
    const igstAmount = (subtotal * (Number(itemIgst) || 0)) / 100;
    const total = subtotal + cgstAmount + sgstAmount + igstAmount;

    const newItem = {
      product: selectedProduct,
      productName: product?.productName || "",
      store: selectedStore || "",
      qty: productQty,
      rate: rate,
      subtotal: subtotal,
      cgstPercent: Number(itemCgst) || 0,
      sgstPercent: Number(itemSgst) || 0,
      igstPercent: Number(itemIgst) || 0,
      is_igst: false,
      total: total,
    };

    setSaleData((prev) => {
      const newItems = [...prev.items, newItem];
      const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const discountAmount =
        prev.discountType === "percentage"
          ? (newSubtotal * prev.discountValue) / 100
          : prev.discountValue;
      const newGrandTotal =
        newSubtotal -
        discountAmount +
        prev.shippingCost -
        prev.tds -
        prev.creditNoteAmount;

      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        grandTotal: smartRound(Math.max(0, newGrandTotal)),
      };
    });

    resetProductForm();
  };

  const removeProductFromItems = (index: number) => {
    setSaleData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
      const discountAmount =
        prev.discountType === "percentage"
          ? (newSubtotal * prev.discountValue) / 100
          : prev.discountValue;
      const newGrandTotal =
        newSubtotal -
        discountAmount +
        prev.shippingCost -
        prev.tds -
        prev.creditNoteAmount;

      return {
        ...prev,
        items: newItems,
        subtotal: newSubtotal,
        grandTotal: smartRound(Math.max(0, newGrandTotal)),
      };
    });
  };

  const calculateQuantityChanges = () => {
    if (!editingSale) return [];
    
    const originalItems = editingSale.items || [];
    const currentItems = saleData.items || [];
    const changes = [];
    
    // Track quantity changes for existing items
    for (const currentItem of currentItems) {
      const originalItem = originalItems.find(item => 
        (item.product?._id || item.product) === currentItem.product
      );
      
      if (originalItem) {
        const qtyDiff = currentItem.qty - originalItem.qty;
        if (qtyDiff !== 0) {
          changes.push({
            product: currentItem.product,
            store: currentItem.store,
            quantityChange: qtyDiff,
            type: qtyDiff > 0 ? 'increase' : 'decrease'
          });
        }
      } else {
        // New item added
        changes.push({
          product: currentItem.product,
          store: currentItem.store,
          quantityChange: currentItem.qty,
          type: 'increase'
        });
      }
    }
    
    // Track removed items
    for (const originalItem of originalItems) {
      const stillExists = currentItems.find(item => 
        item.product === (originalItem.product?._id || originalItem.product)
      );
      
      if (!stillExists) {
        changes.push({
          product: originalItem.product?._id || originalItem.product,
          store: originalItem.store?._id || originalItem.store,
          quantityChange: -originalItem.qty,
          type: 'decrease'
        });
      }
    }
    
    return changes;
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has permission to edit (covers both create and update)
    if (!can('edit', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to save sales",
      });
      return;
    }

    if (
      !saleData.customer ||
      !saleData.doctorId ||
      saleData.items.length === 0
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields and add at least one item",
      });
      return;
    }

    if (blendPayments.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one payment method",
      });
      return;
    }
    if (blendPayments.some(bp => !bp.paymentMode || (Number(bp.amount) || 0) <= 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select payment mode and enter valid amount for all payments",
      });
      return;
    }
    if (Math.abs(blendPaymentTotal - saleData.grandTotal) >= 0.01) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Total payment amount must equal grand total",
      });
      return;
    }

    const quantityChanges = calculateQuantityChanges();
    
    const finalSaleData = {
      ...saleData,
      paymentMode: blendPayments,
      items: saleData.items.map(item => ({
        ...item,
        is_igst: item.is_igst
      })),
      ...(editingSale && quantityChanges.length > 0 && { quantityChanges })
    };

    setIsSaving(true);
    try {
      const url = editingSale
        ? `/api/sales/bills/${editingSale._id}/stock-management`
        : "/api/sales/bills";
      const method = editingSale ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalSaleData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: editingSale
            ? "Sale updated successfully"
            : "Sale saved successfully",
        });
        setIsSaleDialogOpen(false);
        resetForm();
        fetchAllData();
      } else {
        throw new Error(result.message || "Failed to save sale");
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

  const resetForm = () => {
    setSaleData({
      billNo: "",
      billDate: new Date().toISOString().split("T")[0],
      customer: "",
      doctorId: "",
      project: "",
      items: [],
      subtotal: 0,
      discountType: "percentage",
      discountValue: 0,
      shippingCost: 0,
      grandTotal: 0,
      paymentMode: [{paymentMode: "", amount: ""}],
      status: "due",
      tds: 0,
      remarks: "",
      terms: "",
      creditNoteAmount: 0,
      uploadedDocs: [],
    });
    setEditingSale(null);
    setBlendPayments([{paymentMode: "", amount: ""}]);
    resetProductForm();
  };

  const resetProductForm = () => {
    setSelectedProduct("");
    setProductQty(1);
    setProductRate("");
    setItemCgst("");
    setItemSgst("");
    setItemIgst("");
    setGstType("cgst_sgst");
    setSelectedStore("");
    setEditingItemIndex(null);
  };

  // Handle GST type change
  const handleGstTypeChange = (type: "cgst_sgst" | "igst") => {
    setGstType(type);
    const product = products.find((p) => p._id === selectedProduct);
    
    if (type === "igst") {
      setItemCgst("");
      setItemSgst("");
      setItemIgst(product?.igst ? product.igst.toString() : "");
    } else {
      setItemIgst("");
      setItemCgst(product?.cgst ? product.cgst.toString() : "");
      setItemSgst(product?.sgst ? product.sgst.toString() : "");
    }
  };

  const handleEditSale = (sale: any) => {
    // Check if user has permission to edit
    if (!can('edit', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to edit sales",
      });
      return;
    }

    setEditingSale(sale);
    setSaleData({
      billNo: sale.billNo || "",
      billDate: sale.billDate
        ? new Date(sale.billDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      customer: sale.customer?._id || "",
      doctorId: sale.doctorId?._id || sale.doctorId || "",
      project: sale.project || "",
      items: sale.items?.map((item: any) => ({
        product: item.product?._id || item.product || "",
        productName: item.product?.productName || item.productName || "",
        store: item.store?._id || item.store || "",
        qty: item.qty || 0,
        rate: item.rate || 0,
        subtotal: item.subtotal || 0,
        cgstPercent: item.cgstPercent || 0,
        sgstPercent: item.sgstPercent || 0,
        igstPercent: item.igstPercent || 0,
        is_igst: item.is_igst || false,
        total: item.total || 0,
      })) || [],
      subtotal: sale.subtotal || 0,
      discountType: sale.discountType || "percentage",
      discountValue: sale.discountValue || 0,
      shippingCost: sale.shippingCost || 0,
      grandTotal: sale.grandTotal || 0,
      paymentMode: sale.paymentModes || sale.paymentMode || [],
      status: sale.status || "due",
      tds: sale.tds || 0,
      remarks: sale.remarks || "",
      terms: sale.terms || "",
      creditNoteAmount: sale.creditNoteAmount || 0,
      uploadedDocs: sale.uploadedDocs || [],
    });
    if (sale.paymentModes && Array.isArray(sale.paymentModes)) {
      setBlendPayments(sale.paymentModes.map((pm: any) => ({
        paymentMode: pm.paymentMode?._id || pm.paymentMode || "",
        amount: pm.amount || 0
      })));
    } else if (Array.isArray(sale.paymentMode)) {
      setBlendPayments(sale.paymentMode);
    } else {
      setBlendPayments([{paymentMode: sale.paymentMode?._id || "", amount: sale.grandTotal || 0}]);
    }
    setIsSaleDialogOpen(true);
  };

  const handleViewSale = (sale: any) => {
    setViewingSale(sale);
  };

  const handleDeleteSale = async (id: string) => {
    // Check if user has permission to delete
    if (!can('delete', pathname)) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to delete sales",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this sale?")) return;

    setDeletingId(id);
    try {
      const response = await authFetch(`/api/sales/bills/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Sale deleted successfully" });
        fetchAllData();
      } else {
        throw new Error(result.message || "Failed to delete sale");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setDeletingId(null);
    }
  };





  const handlePrintInvoice = async (
    saleId: string,
    printType: "a4" | "thermal" = "a4"
  ) => {
    setPrintingId(saleId);
    try {
      await printSalesInvoice(saleId, printType, authFetch);
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

  const handlePayment = async () => {
    if (!selectedPaymentSale) return;
    
    const amount = paymentType === "full" ? selectedPaymentSale.grandTotal : Number(paymentAmount);
    const status = paymentType === "full" ? "paid" : "partial";
    
    if (paymentType === "partial" && (!paymentAmount || amount <= 0)) {
      toast({ variant: "destructive", title: "Error", description: "Please enter valid amount" });
      return;
    }
    
    setUpdatingStatus(selectedPaymentSale._id);
    try {
      const response = await authFetch(`/api/sales/bills/${selectedPaymentSale._id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paidAmount: amount }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: `Payment of ₹${amount.toFixed(2)} recorded successfully` });
        fetchAllData();
        if (viewingSale?._id === selectedPaymentSale._id) {
          setViewingSale({ ...viewingSale, status, paidAmount: amount });
        }
        setShowPaymentDialog(false);
        setSelectedPaymentSale(null);
        setPaymentAmount("");
        setPaymentType("full");
      } else {
        throw new Error(result.message || "Failed to record payment");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openPaymentDialog = (sale: any) => {
    setSelectedPaymentSale(sale);
    setPaymentAmount(sale.grandTotal?.toString() || "");
    setShowPaymentDialog(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCustomer.firstName ||
      !newCustomer.lastName ||
      !newCustomer.contact
    ) {
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
      fetchInitialData();
      if (result.data?._id) {
        setSaleData((prev) => ({ ...prev, customer: result.data._id }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  const fetchProductStock = async (productId: string) => {
    if (!productId) return;

    try {
      const response = await authFetch(`/api/stock/product/${productId}`);
      const data = await response.json();
      if (data.success) {
        setStoresWithStock(data.data.stores || []);
      }
    } catch (error) {
      console.error("Failed to fetch stock:", error);
      setStoresWithStock([]);
    }
  };

  const getStoreOptions = () => {
    const product = products.find(p => p._id === selectedProduct);
    const isService = (product?.type || "").toLowerCase() === "service";
    
    return storesWithStock.map((store) => ({
      value: store.storeId,
      label: isService 
        ? store.storeName 
        : `${store.storeName} (Stock: ${store.stock})`,
      disabled: !isService && store.stock <= 0,
    }));
  };

  const getSelectedStoreStock = () => {
    const selectedStoreData = storesWithStock.find(store => store.storeId === selectedStore);
    return selectedStoreData ? selectedStoreData.stock : 0;
  };

  const smartRound = (amount: number) => {
    const decimal = amount - Math.floor(amount);
    return decimal <= 0.5 ? Math.floor(amount) : Math.ceil(amount);
  };

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

  // Helper function to check if a sale can be edited
  const canEditSale = (sale: any) => {
    return sale && can('edit', pathname);
  };

  // Helper function to check if a sale can be deleted
  const canDeleteSale = (sale: any) => {
    return sale && can('delete', pathname);
  };

  const formatPaymentModeDisplay = (paymentMode: any, paymentModes: PaymentMode[]) => {
    if (Array.isArray(paymentMode)) {
      return paymentMode.map(pm => {
        // Handle nested paymentMode structure
        const mode = pm.paymentMode?.payType ? pm.paymentMode : paymentModes.find(m => m._id === (pm.paymentMode?._id || pm.paymentMode));
        return `${mode?.payType || 'Unknown'}: ₹${Number(pm.amount).toFixed(0)}`;
      }).join(', ');
    } else if (paymentMode?.payType) {
      return paymentMode.payType;
    }
    return 'N/A';
  };

  // Auto-fill product rate and GST when product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchProductStock(selectedProduct);
      const product = products.find((p) => p._id === selectedProduct);
      if (product) {
        // Use sellingPrice for Inclusive, mrp for Exclusive
        const price = product.taxType === 'Inclusive' 
          ? (product.sellingPrice || 0)
          : (product.mrp || 0);
        
        if (price > 0)
          setProductRate(price.toFixed(2));
        
        // Reset to CGST+SGST and apply default values
        setGstType("cgst_sgst");
        const productCgst = Number(product.cgst) || 0;
        const productSgst = Number(product.sgst) || 0;
        
        setItemCgst(productCgst > 0 ? productCgst.toString() : "");
        setItemSgst(productSgst > 0 ? productSgst.toString() : "");
        setItemIgst("");
      }
      // Reset selected store when product changes
      setSelectedStore("");
    } else {
      // Clear all fields when no product is selected
      setProductRate("");
      setItemCgst("");
      setItemSgst("");
      setItemIgst("");
      setGstType("cgst_sgst");
      setSelectedStore("");
    }
  }, [selectedProduct, products]);

  // Calculate totals when relevant fields change
  useEffect(() => {
    const discountAmount =
      saleData.discountType === "percentage"
        ? (saleData.subtotal * saleData.discountValue) / 100
        : saleData.discountValue;
    
    const selectedPaymentMode = paymentModes.find(pm => pm._id === saleData.paymentMode);
    const deductionPercent = selectedPaymentMode?.deduction || 0;
    const paymentDeduction = (saleData.subtotal * deductionPercent) / 100;
    
    const grandTotal =
      saleData.subtotal -
      discountAmount +
      saleData.shippingCost -
      saleData.tds -
      saleData.creditNoteAmount -
      paymentDeduction;

    setSaleData((prev) => ({
      ...prev,
      grandTotal: smartRound(Math.max(0, grandTotal)),
    }));
  }, [
    saleData.subtotal,
    saleData.discountType,
    saleData.discountValue,
    saleData.shippingCost,
    saleData.tds,
    saleData.creditNoteAmount,
    saleData.paymentMode,
    paymentModes,
  ]);

  return (
    <>
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                required
                value={newCustomer.contact}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, contact: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newCustomer.age}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, age: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newCustomer.gender}
                  onValueChange={(value) =>
                    setNewCustomer((p) => ({ ...p, gender: value }))
                  }
                >
                  <SelectTrigger>
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
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveCustomer}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingSale ? "Edit Sale" : "Add Sale"}
            </DialogTitle>
            <DialogDescription>
              {editingSale
                ? "Update the sale details"
                : "Create a new sale with complete details"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form
              id="sale-form"
              onSubmit={handleSaveSale}
              className="space-y-4 py-3"
            >
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Bill No</Label>
                  <Input
                    value={saleData.billNo}
                    onChange={(e) =>
                      setSaleData((prev) => ({
                        ...prev,
                        billNo: e.target.value,
                      }))
                    }
                    placeholder="Bill No will be auto generated"
                    disabled
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Bill Date</Label>
                  <Input
                    type="date"
                    value={saleData.billDate}
                    onChange={(e) =>
                      setSaleData((prev) => ({
                        ...prev,
                        billDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Doctor *</Label>
                  <SearchableSelect
                    options={doctors.map((d) => ({
                      value: d._id,
                      label: d.name,
                    }))}
                    value={saleData.doctorId}
                    onValueChange={(val) =>
                      setSaleData((prev) => ({ ...prev, doctorId: val }))
                    }
                    placeholder="Select Doctor"
                    searchPlaceholder="Search doctors..."
                    emptyText="No doctors found."
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Customer *</Label>
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      options={
                        Array.isArray(customers)
                          ? customers.map((c) => ({
                              value: c._id,
                              label: `${c.firstName} ${c.lastName} - ${c.contact || ''}`,
                            }))
                          : []
                      }
                      value={saleData.customer}
                      onValueChange={(val) =>
                        setSaleData((prev) => ({ ...prev, customer: val }))
                      }
                      placeholder="Select Customer"
                      searchPlaceholder="Search customers..."
                      emptyText="No customers found."
                      onSearchChange={searchCustomers}
                      loading={customerLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => setIsCustomerDialogOpen(true)}
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Project</Label>
                  <Input
                    value={saleData.project}
                    onChange={(e) =>
                      setSaleData((prev) => ({
                        ...prev,
                        project: e.target.value,
                      }))
                    }
                    placeholder="Enter project"
                  />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Add Products/Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Product/Services</Label>
                        <SearchableSelect
                          options={
                            Array.isArray(products)
                              ? products.map((p) => ({
                                  value: p._id,
                                  label: `${p.productName}${(p.type || "").toLowerCase() === "service" ? " (Service)" : ""} - ₹${(p.taxType === 'Inclusive' ? (p.sellingPrice || 0) : (p.mrp || 0)).toFixed(2)}`,
                                }))
                              : []
                          }
                          value={selectedProduct}
                          onValueChange={setSelectedProduct}
                          placeholder="Select Product"
                          searchPlaceholder="Search products..."
                          emptyText="No products found."
                          onSearchChange={searchProducts}
                          loading={productLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Store</Label>
                        <SearchableSelect
                          options={getStoreOptions()}
                          value={selectedStore}
                          onValueChange={setSelectedStore}
                          disabled={!selectedProduct}
                          placeholder={
                            selectedProduct
                              ? "Select Store"
                              : "Select Product First"
                          }
                          searchPlaceholder="Search stores..."
                          emptyText="No stores found."
                          onSearchChange={searchStores}
                          loading={storeLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={productQty}
                          onChange={(e) =>
                            setProductQty(Number(e.target.value))
                          }
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="Qty"
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rate (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productRate}
                          onChange={(e) => setProductRate(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="Rate"
                          className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">GST Type</Label>
                        <Select
                          value={gstType}
                          onValueChange={handleGstTypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cgst_sgst">CGST+SGST</SelectItem>
                            <SelectItem value="igst">IGST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {gstType === "cgst_sgst" ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">CGST (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={itemCgst}
                              onChange={(e) => setItemCgst(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="%"
                              className="w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SGST (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={itemSgst}
                              onChange={(e) => setItemSgst(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="%"
                              className="w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">IGST (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={itemIgst}
                              onChange={(e) => setItemIgst(e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="%"
                              className="w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs"></Label>
                            <div></div>
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Total: ₹
                          {(() => {
                            const subtotal =
                              productQty * (Number(productRate) || 0);
                            const cgst =
                              (subtotal * (Number(itemCgst) || 0)) / 100;
                            const sgst =
                              (subtotal * (Number(itemSgst) || 0)) / 100;
                            const igst =
                              (subtotal * (Number(itemIgst) || 0)) / 100;
                            return (subtotal + cgst + sgst + igst).toFixed(2);
                          })()}
                        </Label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (editingItemIndex !== null) {
                            // Update existing item
                            const rate = Number(productRate) || 0;
                            const total = productQty * rate;
                            setSaleData((prev) => {
                              const newItems = [...prev.items];
                              newItems[editingItemIndex] = {
                                ...newItems[editingItemIndex],
                                qty: productQty,
                                rate: rate,
                                total: total,
                              };
                              const newSubtotal = newItems.reduce(
                                (sum, item) => sum + item.total,
                                0
                              );
                              const discountAmount =
                                prev.discountType === "percentage"
                                  ? (newSubtotal * prev.discountValue) / 100
                                  : prev.discountValue;
                              const newGrandTotal =
                                newSubtotal -
                                discountAmount +
                                prev.shippingCost -
                                prev.tds -
                                prev.creditNoteAmount;
                              return {
                                ...prev,
                                items: newItems,
                                subtotal: newSubtotal,
                                grandTotal: Math.max(0, newGrandTotal),
                              };
                            });
                            setEditingItemIndex(null);
                            resetProductForm();
                          } else {
                            addProductToItems();
                          }
                        }}
                        size="sm"
                        className="px-6"
                        disabled={(() => {
                          if (!selectedProduct || productQty <= 0 || (Number(productRate) || 0) <= 0) {
                            return true;
                          }
                          const product = products.find(p => p._id === selectedProduct);
                          const isService = (product?.type || "").toLowerCase() === "service";
                          if (isService) {
                            return false; // Services are always enabled if basic fields are filled
                          }
                          return !selectedStore || getSelectedStoreStock() <= 0;
                        })()}
                      >
                        {editingItemIndex !== null ? (
                          <>✓ Update</>
                        ) : (
                          <>
                            <PlusCircle className="mr-1 h-3 w-3" /> Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {saleData.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Items ({saleData.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {saleData.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded border"
                        >
                          {editingItemIndex === index ? (
                            <>
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-2">
                                  {item.productName}
                                </div>
                                <div className="flex gap-2 items-center">
                                  <span className="text-xs">Qty:</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={productQty}
                                    onChange={(e) =>
                                      setProductQty(Number(e.target.value))
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-20 h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    × ₹{item.rate} = ₹
                                    {(productQty * item.rate).toFixed(2)} |
                                    CGST: {item.cgstPercent || 0}% | SGST:{" "}
                                    {item.sgstPercent || 0}% | IGST:{" "}
                                    {item.igstPercent || 0}% | Total: ₹
                                    {(() => {
                                      const subtotal = productQty * item.rate;
                                      const cgst =
                                        (subtotal * (item.cgstPercent || 0)) /
                                        100;
                                      const sgst =
                                        (subtotal * (item.sgstPercent || 0)) /
                                        100;
                                      const igst =
                                        (subtotal * (item.igstPercent || 0)) /
                                        100;
                                      return (
                                        subtotal +
                                        cgst +
                                        sgst +
                                        igst
                                      ).toFixed(2);
                                    })()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const subtotal = productQty * item.rate;
                                    const cgstAmount =
                                      (subtotal * (item.cgstPercent || 0)) /
                                      100;
                                    const sgstAmount =
                                      (subtotal * (item.sgstPercent || 0)) /
                                      100;
                                    const igstAmount =
                                      (subtotal * (item.igstPercent || 0)) /
                                      100;
                                    const total =
                                      subtotal +
                                      cgstAmount +
                                      sgstAmount +
                                      igstAmount;
                                    setSaleData((prev) => {
                                      const newItems = [...prev.items];
                                      newItems[index] = {
                                        ...newItems[index],
                                        qty: productQty,
                                        subtotal: subtotal,
                                        total: total,
                                      };
                                      const newSubtotal = newItems.reduce(
                                        (sum, item) => sum + item.total,
                                        0
                                      );
                                      const discountAmount =
                                        prev.discountType === "percentage"
                                          ? (newSubtotal * prev.discountValue) /
                                            100
                                          : prev.discountValue;
                                      const newGrandTotal =
                                        newSubtotal -
                                        discountAmount +
                                        prev.shippingCost -
                                        prev.tds -
                                        prev.creditNoteAmount;
                                      return {
                                        ...prev,
                                        items: newItems,
                                        subtotal: newSubtotal,
                                        grandTotal: Math.max(0, newGrandTotal),
                                      };
                                    });
                                    setEditingItemIndex(null);
                                  }}
                                  className="h-8 w-8 p-0 text-green-600"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingItemIndex(null)}
                                  className="h-8 w-8 p-0 text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.qty} × ₹{item.rate} = ₹
                                  {item.subtotal?.toFixed(2)} | CGST:{" "}
                                  {item.cgstPercent || 0}% | SGST:{" "}
                                  {item.sgstPercent || 0}% | IGST:{" "}
                                  {item.igstPercent || 0}% | Total: ₹
                                  {item.total.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItemIndex(index);
                                    setProductQty(item.qty);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProductFromItems(index)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payment & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Payment Mode *</Label>
                      <div className="space-y-2">
                        {blendPayments.map((bp, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <Select
                              value={bp.paymentMode}
                              onValueChange={(value) => updateBlendPayment(index, 'paymentMode', value)}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
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
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 w-20 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                              placeholder="Amount"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeBlendPayment(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={addBlendPayment}
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Add Payment
                          </Button>
                          {blendPayments.length > 0 && (
                            <div className="text-xs">
                              <span className={blendPaymentTotal === saleData.grandTotal ? "text-green-600" : "text-red-600"}>
                                ₹{blendPaymentTotal.toFixed(2)} / ₹{saleData.grandTotal.toFixed(2)}
                              </span>
                              {blendPaymentTotal !== saleData.grandTotal && (
                                <div className={`text-xs font-medium mt-1 ${
                                  blendPaymentTotal > saleData.grandTotal ? "text-orange-600" : "text-blue-600"
                                }`}>
                                  {blendPaymentTotal > saleData.grandTotal 
                                    ? `Return: ₹${(blendPaymentTotal - saleData.grandTotal).toFixed(2)}`
                                    : `Collect: ₹${(saleData.grandTotal - blendPaymentTotal).toFixed(2)}`
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Remarks</Label>
                      <Textarea
                        value={saleData.remarks}
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                        placeholder="Enter remarks"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Terms & Conditions</Label>
                      <Textarea
                        value={saleData.terms}
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            terms: e.target.value,
                          }))
                        }
                        placeholder="Enter terms"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pricing Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">Discount</Label>
                      <Select
                        value={saleData.discountType}
                        onValueChange={(val: "percentage" | "fixed") =>
                          setSaleData((prev) => ({
                            ...prev,
                            discountType: val,
                          }))
                        }
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
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
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            discountValue: Number(e.target.value),
                          }))
                        }
                        className="h-8 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">Shipping</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={saleData.shippingCost}
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            shippingCost: Number(e.target.value),
                          }))
                        }
                        className="h-8 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">TDS</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={saleData.tds}
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            tds: Number(e.target.value),
                          }))
                        }
                        className="h-8 flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-20">Credit Note</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={saleData.creditNoteAmount}
                        onChange={(e) =>
                          setSaleData((prev) => ({
                            ...prev,
                            creditNoteAmount: Number(e.target.value),
                          }))
                        }
                        className="h-8 flex-1"
                      />
                    </div>
                    <div className="space-y-2 text-sm pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{saleData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>
                          ₹
                          {(saleData.discountType === "percentage"
                            ? (saleData.subtotal * saleData.discountValue) / 100
                            : saleData.discountValue
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₹{saleData.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDS:</span>
                        <span>₹{saleData.tds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Note:</span>
                        <span>₹{saleData.creditNoteAmount.toFixed(2)}</span>
                      </div>
                      {(() => {
                        const selectedPaymentMode = paymentModes.find(pm => pm._id === saleData.paymentMode);
                        const deductionPercent = selectedPaymentMode?.deduction || 0;
                        const paymentDeduction = (saleData.subtotal * deductionPercent) / 100;
                        return deductionPercent > 0 ? (
                          <div className="flex justify-between">
                            <span>Convenience charge ({deductionPercent}%):</span>
                            <span>₹{paymentDeduction.toFixed(2)}</span>
                          </div>
                        ) : null;
                      })()}
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
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="sale-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSale ? "Update Sale" : "Save Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingSale}
        onOpenChange={(open) => !open && setViewingSale(null)}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center justify-between">
              <span>Sale - {viewingSale?.billNo}</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  viewingSale?.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : viewingSale?.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {viewingSale?.status?.toUpperCase() || "PENDING"}
              </span>
            </DialogTitle>
            <DialogDescription>
              Complete sale information and payment details
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6 py-4">
              {viewingSale?.items && viewingSale.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Items ({viewingSale.items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-medium">Sr.</TableHead>
                            <TableHead className="text-xs font-medium">Description</TableHead>
                            <TableHead className="text-xs font-medium text-center">Qty</TableHead>
                            <TableHead className="text-xs font-medium text-right">Rate</TableHead>
                            <TableHead className="text-xs font-medium text-right">Amount</TableHead>
                            {viewingSale?.items?.some((item: any) => !item.is_igst) && (
                              <>
                                <TableHead className="text-xs font-medium text-right">CGST</TableHead>
                                <TableHead className="text-xs font-medium text-right">SGST</TableHead>
                              </>
                            )}
                            {viewingSale?.items?.some((item: any) => item.is_igst) && (
                              <TableHead className="text-xs font-medium text-right">IGST</TableHead>
                            )}
                            <TableHead className="text-xs font-medium text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingSale.items.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs text-center">{index + 1}</TableCell>
                              <TableCell className="text-xs font-medium">{item.product?.productName || item.productName || "-"}</TableCell>
                              <TableCell className="text-xs text-center">{item.qty}</TableCell>
                              <TableCell className="text-xs text-right">₹{item.rate?.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">₹{item.subtotal?.toFixed(2)}</TableCell>
                              {!item.is_igst && (
                                <>
                                  <TableCell className="text-xs text-right">
                                    {item.cgstPercent > 0 ? `₹${((item.subtotal * item.cgstPercent) / 100).toFixed(2)}(${item.cgstPercent}%)` : "₹0.00"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.sgstPercent > 0 ? `₹${((item.subtotal * item.sgstPercent) / 100).toFixed(2)}(${item.sgstPercent}%)` : "₹0.00"}
                                  </TableCell>
                                </>
                              )}
                              {item.is_igst && (
                                <TableCell className="text-xs text-right">
                                  {item.igstPercent > 0 ? `₹${((item.subtotal * item.igstPercent) / 100).toFixed(2)}(${item.igstPercent}%)` : "₹0.00"}
                                </TableCell>
                              )}
                              <TableCell className="text-xs text-right font-medium">₹{item.total?.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sale Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Bill No</Label>
                        <div className="font-medium">{viewingSale?.billNo || "-"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Bill Date</Label>
                        <div>{viewingSale?.billDate ? new Date(viewingSale.billDate).toLocaleDateString() : "-"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Customer</Label>
                        <div className="font-medium">{viewingSale?.customer?.firstName} {viewingSale?.customer?.lastName || "-"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Project</Label>
                        <div>{viewingSale?.project || "-"}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Items</Label>
                        <div className="font-medium">{viewingSale?.items?.length || 0}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                        <div>{formatPaymentModeDisplay(viewingSale?.paymentModes?.length > 0 ? viewingSale.paymentModes : viewingSale?.paymentMode, paymentModes)}</div>
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
                      <span className="text-sm">Total Amount:</span>
                      <span>₹{viewingSale?.totalProductAmount?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">CGST:</span>
                      <span>₹{viewingSale?.cgst?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">SGST:</span>
                      <span>₹{viewingSale?.sgst?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">IGST:</span>
                      <span>₹{viewingSale?.igst?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Shipping Cost:</span>
                      <span>₹{viewingSale?.shippingCost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Discount:</span>
                      <span>- ₹{(() => {
                        const discount = viewingSale?.discountType === 'fixed' ? (viewingSale?.discountValue || 0) : 
                        viewingSale?.discountType === 'percentage' ? (((viewingSale?.totalProductAmount || 0) + (viewingSale?.cgst || 0) + (viewingSale?.sgst || 0) + (viewingSale?.igst || 0)) * (viewingSale?.discountValue || 0) / 100) : 0;
                        return discount.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Convenience charge:</span>
                      <span>₹{(() => {
                        const discount = viewingSale?.discountType === 'fixed' ? (viewingSale?.discountValue || 0) : 
                        viewingSale?.discountType === 'percentage' ? (((viewingSale?.totalProductAmount || 0) + (viewingSale?.cgst || 0) + (viewingSale?.sgst || 0) + (viewingSale?.igst || 0)) * (viewingSale?.discountValue || 0) / 100) : 0;
                        const paymentCharge = (((viewingSale?.totalProductAmount || 0) + (viewingSale?.cgst || 0) + (viewingSale?.sgst || 0) + (viewingSale?.igst || 0) - discount) * (viewingSale?.paymentMode?.deduction || 0) / 100) || 0;
                        return paymentCharge.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Grand Total:</span>
                        <span>₹{viewingSale?.grandTotal?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>



              {(viewingSale?.remarks || viewingSale?.terms) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {viewingSale?.remarks && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Remarks</Label>
                        <div className="text-sm mt-1">{viewingSale.remarks}</div>
                      </div>
                    )}
                    {viewingSale?.terms && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Terms & Conditions</Label>
                        <div className="text-sm mt-1">{viewingSale.terms}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {canEditSale(viewingSale) && (
                  <Button variant="outline" onClick={() => handleEditSale(viewingSale)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {viewingSale?.status !== "paid" && (
                  <Button
                    onClick={() => openPaymentDialog(viewingSale)}
                    disabled={updatingStatus === viewingSale?._id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updatingStatus === viewingSale?._id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Record Payment
                  </Button>
                )}
                <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPrintId(viewingSale?._id || null);
                        setShowPrintDialog(true);
                      }}
                      disabled={printingId === viewingSale?._id}
                    >
                      {printingId === viewingSale?._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="mr-2 h-4 w-4" />
                      )}
                      Print Invoice
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Choose Print Format</AlertDialogTitle>
                      <AlertDialogDescription>Select the print format for your invoice.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowPrintDialog(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (selectedPrintId) handlePrintInvoice(selectedPrintId, "thermal");
                          setShowPrintDialog(false);
                        }}
                      >
                        Thermal (80mm)
                      </AlertDialogAction>
                      <AlertDialogAction
                        onClick={() => {
                          if (selectedPrintId) handlePrintInvoice(selectedPrintId, "a4");
                          setShowPrintDialog(false);
                        }}
                      >
                        A4 Size
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Button variant="secondary" onClick={() => setViewingSale(null)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sales</CardTitle>
              <div className="text-2xl font-bold text-green-600 mt-1">
                Total: ₹{grandTotalSum.toLocaleString()}
              </div>
            </div>
            {can('edit', pathname) && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsSaleDialogOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
              </Button>
            )}
          </div>
          <CardDescription>
            Manage sales transactions and invoices.
          </CardDescription>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by bill no, mobile, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                  setMinAmount('');
                  setMaxAmount('');
                  setCategoryFilter('all');
                  setServiceTypeFilter('all');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setCurrentPage(1);
                }}
                disabled={!searchTerm && customerFilter === 'all' && doctorFilter === 'all' && statusFilter === 'all' && paymentModeFilter === 'all' && !dateRange && !minAmount && !maxAmount && categoryFilter === 'all' && serviceTypeFilter === 'all'}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SearchableSelect
                options={
                  Array.isArray(customers)
                    ? [{ value: 'all', label: 'All Customers' }, ...customers.map((c) => ({
                        value: c._id,
                        label: `${c.firstName} ${c.lastName} - ${c.contact || ''}`,
                      }))]
                    : [{ value: 'all', label: 'All Customers' }]
                }
                value={customerFilter}
                onValueChange={setCustomerFilter}
                placeholder="All Customers"
                searchPlaceholder="Search customers..."
                emptyText="No customers found."
                onSearchChange={searchCustomers}
                loading={customerLoading}
                className="w-48"
              />
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Modes</SelectItem>
                  {paymentModes.map((pm) => (
                    <SelectItem key={pm._id} value={pm._id}>
                      {pm.payType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="number"
                placeholder="Min Amount"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-28"
              />
              <Input
                type="number"
                placeholder="Max Amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-28"
              />
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="grandTotal-desc">Amount: High to Low</SelectItem>
                  <SelectItem value="grandTotal-asc">Amount: Low to High</SelectItem>
                  <SelectItem value="billDate-desc">Bill Date: Latest</SelectItem>
                  <SelectItem value="billDate-asc">Bill Date: Earliest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto h-[60vh] border-t">
            <table className="w-full border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium border-b min-w-[120px]">
                    Bill No
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[100px]">
                    Bill Date
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[150px]">
                    Customer
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[100px]">
                    Items
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[120px]">
                    Grand Total
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[120px]">
                    Payment Mode
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[80px]">
                    Status
                  </th>
                  <th className="text-right p-3 font-medium border-b min-w-[120px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center h-24 p-3">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center h-24 p-3">
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="border-b hover:bg-muted/50">
                      <td
                        className="p-3 truncate max-w-[120px] font-medium"
                        title={sale.billNo}
                      >
                        {sale.billNo}
                      </td>
                      <td
                        className="p-3 truncate max-w-[100px]"
                        title={new Date(sale.billDate).toLocaleDateString()}
                      >
                        {new Date(sale.billDate).toLocaleDateString()}
                      </td>
                      <td
                        className="p-3 truncate max-w-[150px]"
                        title={
                          `${sale.customer?.firstName} ${sale.customer?.lastName}` ||
                          "N/A"
                        }
                      >
                        {`${sale.customer?.firstName} ${sale.customer?.lastName}` ||
                          "N/A"}
                      </td>
                      <td className="p-3 truncate max-w-[100px]">
                        {sale.items?.length || 0} items
                      </td>
                      <td className="p-3 truncate max-w-[120px] font-medium">
                        ₹{sale.grandTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3 truncate max-w-[120px]" title={formatPaymentModeDisplay(sale.paymentModes?.length > 0 ? sale.paymentModes : sale.paymentMode, paymentModes)}>
                        {formatPaymentModeDisplay(sale.paymentModes?.length > 0 ? sale.paymentModes : sale.paymentMode, paymentModes)}
                      </td>
                      <td className="p-3 truncate max-w-[80px]">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            sale.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : sale.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.status || "pending"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
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
                          onClick={() => handleEditSale(sale)}
                          title="Edit Sale"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={printingId === sale?._id}
                              title="Print Invoice"
                            >
                              {printingId === sale?._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Choose Print Format
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Select the print format for your invoice.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handlePrintInvoice(sale?._id, "thermal")
                                }
                              >
                                Thermal (80mm)
                              </AlertDialogAction>
                              <AlertDialogAction
                                onClick={() =>
                                  handlePrintInvoice(sale?._id, "a4")
                                }
                              >
                                A4 Size
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {sale.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => openPaymentDialog(sale)}
                            disabled={updatingStatus === sale._id}
                            title="Record Payment"
                          >
                            {updatingStatus === sale._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {canDeleteSale(sale) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteSale(sale._id)}
                            disabled={deletingId === sale._id}
                            title="Delete Sale"
                          >
                            {deletingId === sale._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {sales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
              to {Math.min(currentPage * itemsPerPage, totalSales)} of{" "}
              {totalSales} entries
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
                    const totalPages = Math.ceil(totalSales / itemsPerPage);
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
                      const totalPages = Math.ceil(totalSales / itemsPerPage);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      } else {
                        setPageInput(currentPage.toString());
                      }
                    }
                  }}
                  className="w-16 h-8 text-center text-sm"
                />
                <span className="text-sm">of {Math.ceil(totalSales / itemsPerPage)}</span>
              </div>
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

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for Bill No: {selectedPaymentSale?.billNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="full"
                    checked={paymentType === "full"}
                    onChange={(e) => {
                      setPaymentType(e.target.value as "full");
                      setPaymentAmount(selectedPaymentSale?.grandTotal?.toString() || "");
                    }}
                  />
                  <span>Full Payment</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="partial"
                    checked={paymentType === "partial"}
                    onChange={(e) => {
                      setPaymentType(e.target.value as "partial");
                      setPaymentAmount("");
                    }}
                  />
                  <span>Partial Payment</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                disabled={paymentType === "full"}
                placeholder="Enter amount"
              />
              {paymentType === "full" && (
                <p className="text-sm text-muted-foreground">
                  Full amount: ₹{selectedPaymentSale?.grandTotal?.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={updatingStatus === selectedPaymentSale?._id}>
              {updatingStatus === selectedPaymentSale?._id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
