"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Product, Supplier } from "@/lib/data";
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
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { printPurchaseInvoice } from "./InvoicePrint";
import { getAssetUrl } from "@/lib/asset-utils";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";

interface BillsTabProps {
  products: Product[];
  suppliers: Supplier[];
  authFetch: any;
  toast: any;
  isFromExpense?: boolean;
}

export default function BillsTab({
  products,
  suppliers,
  authFetch,
  toast,
  isFromExpense = false,
}: BillsTabProps) {
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageInput, setPageInput] = useState("1");
  const itemsPerPage = 10;
  const [billData, setBillData] = useState({
    billNo: "",
    billDate: new Date().toISOString().split("T")[0],
    vendorBillNo: "",
    vendorBillDate: new Date().toISOString().split("T")[0],
    vendor: "",
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
      total: number;
    }>,
    totalAmount: 0,

    shippingCost: "",
    grandTotal: 0,
    remarks: "",
    summary: "",
    debitNoteAmount: "",
    document: null as File | null,
    status: "due" as "due",
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [productRate, setProductRate] = useState("");
  const [itemCgst, setItemCgst] = useState("");
  const [itemSgst, setItemSgst] = useState("");
  const [itemIgst, setItemIgst] = useState("");
  const [storesWithStock, setStoresWithStock] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [vendorLoading, setVendorLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [initialVendors, setInitialVendors] = useState<any[]>([]);
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [isBulkPaying, setIsBulkPaying] = useState(false);
  const [showBulkExpenseDialog, setShowBulkExpenseDialog] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [paymentSources, setPaymentSources] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [bulkExpenseData, setBulkExpenseData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemType: '',
    paymentMode: '',
    paymentSource: '',
    referenceNo: '',
    tds: 0,
    remarks: '',
    document: null as string | null
  });

  // Fetch initial data for dropdowns
  const fetchInitialData = async () => {
    try {
      const [vendorsRes, productsRes, doctorsRes] = await Promise.all([
        authFetch("/api/users/vendors?limit=50"),
        authFetch("/api/products?limit=50"),
        authFetch("/api/users?role=doctor")
      ]);
      
      const [vendorsData, productsData, doctorsData] = await Promise.all([
        vendorsRes.json(),
        productsRes.json(),
        doctorsRes.json()
      ]);
      
      if (vendorsData.success) {
        setInitialVendors(vendorsData.data || []);
      }
      
      if (productsData.success) {
        setInitialProducts(productsData.data || []);
      }
      
      if (doctorsData.success) {
        setDoctors(doctorsData.data || []);
      } else if (Array.isArray(doctorsData)) {
        setDoctors(doctorsData);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  // Simple vendor search
  const searchVendors = React.useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) return [];

      setVendorLoading(true);
      try {
        const response = await authFetch(
          `/api/users/vendors?search=${encodeURIComponent(searchTerm)}&limit=50`
        );
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((v: any) => ({
            _id: v._id,
            companyName: v.companyName || v.name,
            name: v.name || v.companyName,
          }));
        }
        return [];
      } catch (error) {
        return [];
      } finally {
        setVendorLoading(false);
      }
    },
    [authFetch]
  );

  // Simple product search
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
            purchasePrice: p.purchasePrice,
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

  const fetchPurchases = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(vendorFilter && vendorFilter !== 'all' && { vendor: vendorFilter }),
        ...(doctorFilter && doctorFilter !== 'all' && { doctorId: doctorFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
        ...(minAmount && { minAmount }),
        ...(maxAmount && { maxAmount }),
        sortBy,
        sortOrder,
      });

      const response = await authFetch(`/api/purchase?${params}`);
      const result = await response.json();
      if (result.success) {
        setPurchases(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalItems(result.pagination?.totalItems || 0);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch purchases",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, vendorFilter, doctorFilter, statusFilter, dateRange, minAmount, maxAmount, sortBy, sortOrder, authFetch, toast]);

  // Fetch purchases when pagination/search changes
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Clear selected bills when purchases list changes or filters change
  useEffect(() => {
    setSelectedBills([]);
  }, [purchases, searchTerm, vendorFilter, doctorFilter, statusFilter, dateRange, minAmount, maxAmount]);

  // Fetch payment modes and sources
  const fetchPaymentOptions = async () => {
    try {
      const [modesRes, sourcesRes, itemsRes] = await Promise.all([
        authFetch('/api/finance/paytypes'),
        authFetch('/api/finance/accounts'),
        authFetch('/api/finance/expense-categories')
      ]);
      const modesData = await modesRes.json();
      const sourcesData = await sourcesRes.json();
      const itemsData = await itemsRes.json();
      
      if (modesData.success) setPaymentModes(modesData.data || []);
      if (sourcesData.success) setPaymentSources(sourcesData.data || []);
      if (itemsData.success) setExpenseItems(itemsData.data || []);
    } catch (error) {
      console.error('Failed to fetch payment options:', error);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchInitialData();
    fetchPurchases();
    fetchPaymentOptions();
  }, []);

  // Sync pageInput with currentPage
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

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

  useEffect(() => {
    if (selectedProduct) {
      fetchProductStock(selectedProduct);
      // Auto-fill rate with product's purchase price
      const product = initialProducts.find((p) => p._id === selectedProduct);
      if (product && product.purchasePrice) {
        setProductRate(product.purchasePrice.toString());
      }
    }
  }, [selectedProduct, initialProducts]);

  // Simple store search
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
        return result.success ? result.data || [] : [];
      } catch (error) {
        return [];
      } finally {
        setStoreLoading(false);
      }
    },
    [authFetch]
  );

  const getStoreOptions = () => {
    return storesWithStock.map((store) => ({
      value: store.storeId,
      label: `${store.storeName} (Stock: ${store.stock})`,
    }));
  };

  const addProductToItems = () => {
    if (
      !selectedProduct ||
      productQty <= 0 ||
      (Number(productRate) || 0) <= 0 ||
      !selectedStore
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all product details and select a store",
      });
      return;
    }

    const rate = Number(productRate) || 0;
    const subtotal = productQty * rate;
    const cgstAmount = (subtotal * (Number(itemCgst) || 0)) / 100;
    const sgstAmount = (subtotal * (Number(itemSgst) || 0)) / 100;
    const igstAmount = (subtotal * (Number(itemIgst) || 0)) / 100;
    const total = subtotal + cgstAmount + sgstAmount + igstAmount;

    const product = initialProducts.find((p) => p._id === selectedProduct);
    const newItem = {
      product: selectedProduct,
      productName: product?.productName || "",
      store: selectedStore,
      qty: productQty,
      rate: rate,
      subtotal: subtotal,
      cgstPercent: Number(itemCgst) || 0,
      sgstPercent: Number(itemSgst) || 0,
      igstPercent: Number(itemIgst) || 0,
      total: total,
    };

    setBillData((prev) => {
      const newItems = [...prev.items, newItem];
      const newTotalAmount = newItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalAmount: newTotalAmount,
        status: "due",
      };
    });

    setSelectedProduct("");
    setProductQty(1);
    setProductRate("");
    setItemCgst("");
    setItemSgst("");
    setItemIgst("");
    setSelectedStore("");
  };

  const removeProductFromItems = (index: number) => {
    setBillData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newTotalAmount = newItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalAmount: newTotalAmount,
        status: "due",
      };
    });
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !billData.vendorBillNo ||
      !billData.vendor ||
      billData.items.length === 0
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please fill all required fields and add at least one item",
      });
      return;
    }

    const grandTotal =
      billData.totalAmount + (Number(billData.shippingCost) || 0);

    const finalBillData = {
      billNo: billData.billNo,
      billDate: billData.billDate,
      vendorBillNo: billData.vendorBillNo,
      vendorBillDate: billData.vendorBillDate,
      vendor: billData.vendor,
      doctorId: billData.doctorId,
      project: billData.project,
      items: billData.items,
      totalAmount: billData.totalAmount,
      shippingCost: Number(billData.shippingCost) || 0,
      grandTotal: grandTotal,
      debitNoteAmount: Number(billData.debitNoteAmount) || 0,
      paid: 0,
      pending: grandTotal,
      tds: 0,
      remarks: billData.remarks,
      summaryTerms: billData.summary,
      uploadDocument: billData.document,
      status: billData.status,
    };

    setIsSaving(true);
    try {
      const url = editingPurchase
        ? `/api/purchase/${editingPurchase._id}`
        : "/api/purchase";
      const method = editingPurchase ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalBillData),
      });

      const result = await response.json();
      console.log("Purchase saved:", result);

      if (result.success) {
        toast({
          title: "Success",
          description: editingPurchase
            ? "Purchase updated successfully"
            : "Purchase saved successfully",
        });
        setIsBillDialogOpen(false);
        resetForm();
        setCurrentPage(1);
        fetchPurchases(); // Refresh the list
      } else {
        throw new Error(result.message || "Failed to save purchase");
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
    setBillData({
      billNo: "",
      billDate: new Date().toISOString().split("T")[0],
      vendorBillNo: "",
      vendorBillDate: new Date().toISOString().split("T")[0],
      vendor: "",
      doctorId: "",
      project: "",
      items: [],
      totalAmount: 0,
      shippingCost: "",
      grandTotal: 0,
      remarks: "",
      summary: "",
      debitNoteAmount: "",
      document: null,
      status: "due",
    });
    setEditingPurchase(null);
    setSelectedProduct("");
    setProductQty(1);
    setProductRate("");
    setItemCgst("");
    setItemSgst("");
    setItemIgst("");
    setSelectedStore("");
  };

  const handleEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);

    // Map items to match the expected structure
    const mappedItems =
      purchase.items?.map((item: any) => ({
        product: item.product?._id || item.product,
        productName: item.product?.productName || item.productName || "",
        store: item.store?._id || item.store,
        qty: item.qty || 0,
        rate: item.rate || 0,
        subtotal: item.subtotal || 0,
        cgstPercent: item.cgstPercent || 0,
        sgstPercent: item.sgstPercent || 0,
        igstPercent: item.igstPercent || 0,
        total: item.total || 0,
      })) || [];

    setBillData({
      billNo: purchase.billNo || "",
      billDate: purchase.billDate
        ? new Date(purchase.billDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      vendorBillNo: purchase.vendorBillNo || "",
      vendorBillDate: purchase.vendorBillDate
        ? new Date(purchase.vendorBillDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      vendor: purchase.vendor?._id || "",
      doctorId: purchase.doctorId || "",
      project: purchase.project || "",
      items: mappedItems,
      totalAmount: purchase.totalAmount || 0,
      shippingCost: purchase.shippingCost?.toString() || "",
      grandTotal: purchase.grandTotal || 0,
      remarks: purchase.remarks || "",
      summary: purchase.summaryTerms || "",
      debitNoteAmount: purchase.debitNoteAmount?.toString() || "",
      document: purchase.uploadDocument || null,
      status: purchase.status || "due",
    });
    setIsBillDialogOpen(true);
  };

  const handleViewPurchase = (purchase: any) => {
    setViewingPurchase(purchase);
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;

    setDeletingId(id);
    try {
      const response = await authFetch(`/api/purchase/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Purchase deleted successfully",
        });
        if (purchases.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchPurchases();
        }
      } else {
        throw new Error(result.message || "Failed to delete purchase");
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

  const handleBulkDelete = async () => {
    if (selectedBills.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedBills.length} purchase bills?`)) return;

    setIsBulkDeleting(true);
    try {
      const response = await authFetch('/api/purchase/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBills })
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: 'Success', description: `${selectedBills.length} purchase bills deleted successfully` });
        setSelectedBills([]);
        fetchPurchases();
      } else {
        throw new Error(result.message || 'Failed to delete purchase bills');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedBills(checked ? purchases.map(p => p._id) : []);
  };

  const handleSelectBill = (billId: string, checked: boolean) => {
    setSelectedBills(prev => 
      checked ? [...prev, billId] : prev.filter(id => id !== billId)
    );
  };

  const handleBulkPrint = async () => {
    if (selectedBills.length === 0) return;
    
    setIsBulkPrinting(true);
    try {
      const selectedPurchases = purchases.filter(p => selectedBills.includes(p._id));
      const billNumbers = selectedPurchases.map(p => p.billNo);
      
      const response = await authFetch('/api/purchase/bulk-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billNumbers })
      });
      
      const result = await response.json();
      if (result.success) {
        printBulkPurchaseReport(result.data);
        toast({ title: 'Success', description: `Bulk purchase report printed successfully` });
      } else {
        throw new Error(result.message || 'Failed to fetch bulk print details');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsBulkPrinting(false);
    }
  };

  const printBulkPurchaseReport = (data: any) => {
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).replace(/[/,:]/g, '-').replace(/ /g, '_');
    
    const { company } = data;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase_Report_${dateTime}</title>
    <style>
        @page {
            size: A4;
            margin: 8mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            width: 210mm;
            padding: 10px;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding: 5px 10px;
        }
        .company-logo {
            max-width: 100px;
            max-height: 60px;
            display: block;
            object-fit: contain;
            flex-shrink: 0;
        }
        .company-info {
            flex: 1;
            text-align: left;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .company-details {
            font-size: 10px;
            line-height: 1.2;
        }
        .invoice-title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            text-transform: uppercase;
        }
        .report-meta {
            text-align: center;
            font-size: 11px;
            margin-bottom: 15px;
            font-style: italic;
        }
        .vendor-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .vendor-header {
            background-color: #f0f0f0;
            font-weight: bold;
            padding: 8px 10px;
            border: 1px solid #333;
            font-size: 12px;
        }
        .vendor-stats {
            background-color: #f9f9f9;
            padding: 5px 10px;
            font-size: 10px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 6px 4px;
            text-align: left;
            font-size: 10px;
            word-wrap: break-word;
            word-break: break-word;
            vertical-align: top;
        }
        .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            margin-top: 25px;
            border-top: 2px solid #333;
            padding: 20px 15px;
            background-color: #f9f9f9;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        .grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
            padding-top: 8px;
            margin-top: 8px;
        }
        .footer {
            margin-top: 35px;
            text-align: center;
            font-size: 10px;
            padding: 15px;
            border-top: 1px solid #ddd;
        }
        .signature {
            margin-top: 40px;
            text-align: right;
        }
        .signature img {
            max-width: 100px;
            max-height: 50px;
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <div class="company-name">${company?.name || 'Company Name'}</div>
            <div class="company-details">
                ${company?.address || 'Company Address'}<br>
                Phone: ${company?.phone || 'Phone'} | Email: ${company?.email || 'Email'}<br>
                ${company?.gst ? `GST: ${company.gst}` : ''} ${company?.pan ? `| PAN: ${company.pan}` : ''}
            </div>
        </div>
        ${company?.logo ? `<img src="${getAssetUrl(company.logo)}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'">` : ''}
    </div>

    <div class="invoice-title">Purchase Report</div>
    
    <div class="report-meta">
        Generated on: ${now.toLocaleString('en-IN', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        })}
    </div>

    ${data.vendorWisePurchases.map((vendor: any) => {
      const vendorTotal = vendor.purchases.reduce((sum: number, p: any) => sum + p.purchaseValue + p.cgst + p.sgst + p.igst, 0);
      return `
      <div class="vendor-section">
          <div class="vendor-header">VENDOR: ${vendor.vendorName}</div>
          <div class="vendor-stats">
              Total Bills: ${vendor.purchases.length} | Total Amount: ₹${vendorTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <table class="items-table">
              <thead>
                  <tr>
                      <th>Sr.</th>
                      <th style="min-width: 80px;">Bill No</th>
                      <th>Vendor Invoice</th>
                      <th>Purchase Date</th>
                      <th>Purchase Value</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>IGST</th>
                      <th>Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${vendor.purchases.map((purchase: any, index: number) => `
                  <tr>
                      <td class="text-center">${index + 1}</td>
                      <td><strong>${purchase.billNo}</strong></td>
                      <td>${purchase.vendorInvoiceNumber}</td>
                      <td>${new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</td>
                      <td class="text-right">₹${purchase.purchaseValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.igst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right"><strong>₹${Math.round(purchase.grandTotal).toLocaleString('en-IN')}</strong></td>
                  </tr>
                  `).join('')}
              </tbody>
          </table>
      </div>
      `}).join('')}

    <div class="totals-section">
        <div class="total-row">
            <span>Total Bills:</span>
            <span><strong>${data.summary.totalBills}</strong></span>
        </div>
        <div class="total-row">
            <span>Total Vendors:</span>
            <span><strong>${data.summary.totalVendors}</strong></span>
        </div>
        <div class="total-row">
            <span>Total Purchase Amount:</span>
            <span>₹${data.summary.totalPurchaseAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div class="total-row">
            <span>Total CGST:</span>
            <span>₹${data.summary.gstDetails.totalCGST.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div class="total-row">
            <span>Total SGST:</span>
            <span>₹${data.summary.gstDetails.totalSGST.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div class="total-row">
            <span>Total IGST:</span>
            <span>₹${data.summary.gstDetails.totalIGST.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div class="total-row">
            <span>Total GST:</span>
            <span>₹${data.summary.gstDetails.totalGST.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        
        <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${Math.round(data.summary.totalPurchaseAmount + data.summary.gstDetails.totalGST).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
    </div>



    ${company?.signature ? `
    <div class="signature">
        <div>Authorized Signature</div>
        <img src="${getAssetUrl(company.signature)}" alt="Signature" onerror="this.style.display='none'">
    </div>` : ''}

</body>
</html>
    `;

    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (printError) {
            console.error('Print operation failed:', printError);
          }
        }
      }, 1000);
      
      // Cleanup iframe after print dialog closes
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (cleanupError) {
          console.error('Iframe cleanup failed:', cleanupError);
        }
      }, 10000);
    } else {
      // Cleanup failed iframe
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };

  const handleBulkPay = () => {
    if (selectedBills.length === 0) return;
    setShowBulkExpenseDialog(true);
  };

  const handleBulkExpenseSubmit = async () => {
    if (!bulkExpenseData.paymentMode || !bulkExpenseData.paymentSource) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select payment mode and payment source' });
      return;
    }

    setIsBulkPaying(true);
    try {
      const selectedPurchases = purchases.filter(p => selectedBills.includes(p._id));
      const billNumbers = selectedPurchases.map(p => p.billNo);
      
      const response = await authFetch('/api/purchase/bulk-payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billNumbers,
          status: 'paid',
          expenseType: 'official',
          itemType: bulkExpenseData.itemType,
          paymentMode: bulkExpenseData.paymentMode,
          remarks: bulkExpenseData.remarks,
          paymentSource: bulkExpenseData.paymentSource,
          file: bulkExpenseData.document
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Generate and download invoice
        if (result.data?.purchaseDetails) {
          generateBulkPaymentInvoice(result.data.purchaseDetails);
        }
        
        toast({ title: 'Success', description: `${selectedBills.length} bills marked as paid and expense entries created` });
        setSelectedBills([]);
        setShowBulkExpenseDialog(false);
        setBulkExpenseData({
          date: new Date().toISOString().split('T')[0],
          itemType: '',
          paymentMode: '',
          paymentSource: '',
          referenceNo: '',
          tds: 0,
          remarks: '',
          document: null
        });
        setIsUploadingFile(false);
        fetchPurchases();
      } else {
        throw new Error(result.message || 'Failed to process bulk payment');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsBulkPaying(false);
    }
  };

  const generateBulkPaymentInvoice = (data: any) => {
    const now = new Date();
    const dateTime = now.toLocaleString('en-US', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).replace(/[/,:]/g, '-').replace(/ /g, '_');
    
    const { company } = data;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment_Receipt_${dateTime}</title>
    <style>
        @page { size: A4; margin: 8mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; width: 210mm; padding: 10px; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 2px solid #333; padding: 5px 10px; }
        .company-logo { max-width: 100px; max-height: 60px; display: block; object-fit: contain; flex-shrink: 0; }
        .company-info { flex: 1; text-align: left; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .company-details { font-size: 10px; line-height: 1.2; }
        .invoice-title { font-size: 16px; font-weight: bold; text-align: center; margin: 10px 0; text-transform: uppercase; }
        .report-meta { text-align: center; font-size: 11px; margin-bottom: 15px; font-style: italic; }
        .vendor-section { margin-bottom: 25px; page-break-inside: avoid; }
        .vendor-header { background-color: #f0f0f0; font-weight: bold; padding: 8px 10px; border: 1px solid #333; font-size: 12px; }
        .vendor-stats { background-color: #f9f9f9; padding: 5px 10px; font-size: 10px; border: 1px solid #ddd; border-top: none; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .items-table th, .items-table td { border: 1px solid #333; padding: 6px 4px; text-align: left; font-size: 10px; word-wrap: break-word; word-break: break-word; vertical-align: top; }
        .items-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals-section { margin-top: 25px; border-top: 2px solid #333; padding: 20px 15px; background-color: #f9f9f9; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
        .signature { margin-top: 40px; text-align: right; }
        .signature img { max-width: 100px; max-height: 50px; }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <div class="company-name">${company?.name || 'Company Name'}</div>
            <div class="company-details">
                ${company?.address || 'Company Address'}<br>
                Phone: ${company?.phone || 'Phone'} | Email: ${company?.email || 'Email'}<br>
                ${company?.gst ? `GST: ${company.gst}` : ''} ${company?.pan ? `| PAN: ${company.pan}` : ''}
            </div>
        </div>
        ${company?.logo ? `<img src="${getAssetUrl(company.logo)}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'">` : ''}
    </div>
    <div class="invoice-title">Payment Receipt</div>
    <div class="report-meta">Payment processed on: ${now.toLocaleString('en-IN')}</div>
    ${data.vendorWisePurchases.map((vendor: any) => `
      <div class="vendor-section">
          <div class="vendor-header">VENDOR: ${vendor.vendorName}</div>
          <table class="items-table">
              <thead>
                  <tr><th>Sr.</th><th>Bill No</th><th>Vendor Invoice</th><th>Purchase Date</th><th>Purchase Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr>
              </thead>
              <tbody>
                  ${vendor.purchases.map((purchase: any, index: number) => `
                  <tr>
                      <td class="text-center">${index + 1}</td>
                      <td><strong>${purchase.billNo}</strong></td>
                      <td>${purchase.vendorInvoiceNumber}</td>
                      <td>${new Date(purchase.purchaseDate).toLocaleDateString('en-IN')}</td>
                      <td class="text-right">₹${purchase.purchaseValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right">₹${purchase.igst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td class="text-right"><strong>₹${Math.round(purchase.grandTotal).toLocaleString('en-IN')}</strong></td>
                  </tr>`).join('')}
              </tbody>
          </table>
      </div>`).join('')}
    <div class="totals-section">
        <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${Math.round(data.summary.totalPurchaseAmount + data.summary.gstDetails.totalGST).toFixed(2)}</span>
        </div>
    </div>
    ${company?.signature ? `<div class="signature"><div>Authorized Signature</div><img src="${getAssetUrl(company.signature)}" alt="Signature" onerror="this.style.display='none'"></div>` : ''}
</body>
</html>`;

    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (printError) {
            console.error('Print operation failed:', printError);
          }
        }
      }, 1000);
      
      // Cleanup iframe after print dialog closes
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (cleanupError) {
          console.error('Iframe cleanup failed:', cleanupError);
        }
      }, 10000);
    } else {
      // Cleanup failed iframe
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };

  const handlePrintInvoice = async (
    purchaseId: string,
    printType: "a4" | "thermal" = "a4"
  ) => {
    setPrintingId(purchaseId);
    try {
      await printPurchaseInvoice(
        purchaseId,
        authFetch,
        toast,
        printType,
        getAssetUrl
      );
    } catch (error) {
      // Error already handled in printPurchaseInvoice function
    } finally {
      setPrintingId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setVendorFilter("all");
    setDoctorFilter("all");
    setStatusFilter("all");
    setDateRange(undefined);
    setMinAmount("");
    setMaxAmount("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
    setSelectedBills([]);
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

  return (
    <>
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingPurchase
                ? "Edit Purchase Bill"
                : isFromExpense
                ? "Manage Purchase Expense"
                : "Add Purchase Bill"}
            </DialogTitle>
            <DialogDescription>
              {editingPurchase
                ? "Update the purchase bill details"
                : isFromExpense
                ? "Create a new expense entry"
                : "Create a new purchase bill with complete details"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form
              id="purchase-form"
              onSubmit={handleSavePurchase}
              className="space-y-4 py-3"
            >
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bill No</Label>
                  <Input
                    value={billData.billNo}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        billNo: e.target.value,
                      }))
                    }
                    placeholder="Bill No will be auto generated"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bill Date</Label>
                  <Input
                    type="date"
                    value={billData.billDate}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        billDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vendor Bill No *</Label>
                  <Input
                    value={billData.vendorBillNo}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        vendorBillNo: e.target.value,
                      }))
                    }
                    placeholder="Enter bill number"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vendor Bill Date</Label>
                  <Input
                    type="date"
                    value={billData.vendorBillDate}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        vendorBillDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vendor/Supplier *</Label>
                  <SearchableSelect
                    options={
                      Array.isArray(initialVendors)
                        ? initialVendors.map((s) => ({
                            value: s._id,
                            label: s.companyName || s.name,
                          }))
                        : []
                    }
                    value={billData.vendor}
                    onValueChange={(val) =>
                      setBillData((prev) => ({ ...prev, vendor: val }))
                    }
                    placeholder="Select Vendor"
                    searchPlaceholder="Search vendors..."
                    emptyText="No vendors found."
                    onSearchChange={searchVendors}
                    loading={vendorLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Doctor *</Label>
                  <SearchableSelect
                    options={
                      Array.isArray(doctors)
                        ? doctors.map((d) => ({
                            value: d._id,
                            label: d.name,
                          }))
                        : []
                    }
                    value={billData.doctorId}
                    onValueChange={(val) =>
                      setBillData((prev) => ({ ...prev, doctorId: val }))
                    }
                    placeholder="Select Doctor"
                    searchPlaceholder="Search doctors..."
                    emptyText="No doctors found."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Project</Label>
                  <Input
                    value={billData.project}
                    onChange={(e) =>
                      setBillData((prev) => ({
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
                            Array.isArray(initialProducts)
                              ? initialProducts.map((p) => ({
                                  value: p._id,
                                  label: `${p.productName} (₹${
                                    p.purchasePrice || 0
                                  })`,
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
                          placeholder="Qty"
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
                          placeholder="Rate"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">CGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemCgst}
                          onChange={(e) => setItemCgst(e.target.value)}
                          placeholder="%"
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
                          placeholder="%"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">IGST (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemIgst}
                          onChange={(e) => setItemIgst(e.target.value)}
                          placeholder="%"
                        />
                      </div>
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
                        <Button
                          type="button"
                          onClick={addProductToItems}
                          size="sm"
                          className="w-full h-8"
                          disabled={
                            !selectedProduct ||
                            !selectedStore ||
                            productQty <= 0 ||
                            (Number(productRate) || 0) <= 0
                          }
                        >
                          <PlusCircle className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {billData.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Items ({billData.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {billData.items.map((item, index) => {
                        const product = initialProducts.find(
                          (p) => p._id === item.product
                        );
                        const store = storesWithStock.find(
                          (s) => s.storeId === item.store
                        );
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded border"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {item.productName || product?.productName || "Unknown Product"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span>Store: {store?.storeName}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>Qty:</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => {
                                      const newQty = Number(e.target.value) || 1;
                                      const newSubtotal = newQty * item.rate;
                                      const cgstAmount = (newSubtotal * item.cgstPercent) / 100;
                                      const sgstAmount = (newSubtotal * item.sgstPercent) / 100;
                                      const igstAmount = (newSubtotal * item.igstPercent) / 100;
                                      const newTotal = newSubtotal + cgstAmount + sgstAmount + igstAmount;
                                      
                                      setBillData(prev => {
                                        const newItems = [...prev.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          qty: newQty,
                                          subtotal: newSubtotal,
                                          total: newTotal
                                        };
                                        const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                        return {
                                          ...prev,
                                          items: newItems,
                                          totalAmount: newTotalAmount
                                        };
                                      });
                                    }}
                                    className="w-16 h-6 text-xs"
                                  />
                                  <span>Rate:</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.rate.toFixed(2)}
                                    onChange={(e) => {
                                      const newRate = Number(e.target.value) || 0;
                                      const newSubtotal = item.qty * newRate;
                                      const cgstAmount = (newSubtotal * item.cgstPercent) / 100;
                                      const sgstAmount = (newSubtotal * item.sgstPercent) / 100;
                                      const igstAmount = (newSubtotal * item.igstPercent) / 100;
                                      const newTotal = newSubtotal + cgstAmount + sgstAmount + igstAmount;
                                      
                                      setBillData(prev => {
                                        const newItems = [...prev.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          rate: newRate,
                                          subtotal: newSubtotal,
                                          total: newTotal
                                        };
                                        const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                        return {
                                          ...prev,
                                          items: newItems,
                                          totalAmount: newTotalAmount
                                        };
                                      });
                                    }}
                                    className="w-24 h-6 text-xs"
                                  />
                                  <span>CGST:</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.cgstPercent}
                                    onChange={(e) => {
                                      const newCgst = Number(e.target.value) || 0;
                                      const newSubtotal = item.qty * item.rate;
                                      const cgstAmount = (newSubtotal * newCgst) / 100;
                                      const sgstAmount = (newSubtotal * item.sgstPercent) / 100;
                                      const igstAmount = (newSubtotal * item.igstPercent) / 100;
                                      const newTotal = newSubtotal + cgstAmount + sgstAmount + igstAmount;
                                      
                                      setBillData(prev => {
                                        const newItems = [...prev.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          cgstPercent: newCgst,
                                          total: newTotal
                                        };
                                        const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                        return {
                                          ...prev,
                                          items: newItems,
                                          totalAmount: newTotalAmount
                                        };
                                      });
                                    }}
                                    className="w-16 h-6 text-xs"
                                  />
                                  <span>SGST:</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.sgstPercent}
                                    onChange={(e) => {
                                      const newSgst = Number(e.target.value) || 0;
                                      const newSubtotal = item.qty * item.rate;
                                      const cgstAmount = (newSubtotal * item.cgstPercent) / 100;
                                      const sgstAmount = (newSubtotal * newSgst) / 100;
                                      const igstAmount = (newSubtotal * item.igstPercent) / 100;
                                      const newTotal = newSubtotal + cgstAmount + sgstAmount + igstAmount;
                                      
                                      setBillData(prev => {
                                        const newItems = [...prev.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          sgstPercent: newSgst,
                                          total: newTotal
                                        };
                                        const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                        return {
                                          ...prev,
                                          items: newItems,
                                          totalAmount: newTotalAmount
                                        };
                                      });
                                    }}
                                    className="w-16 h-6 text-xs"
                                  />
                                  <span>IGST:</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.igstPercent}
                                    onChange={(e) => {
                                      const newIgst = Number(e.target.value) || 0;
                                      const newSubtotal = item.qty * item.rate;
                                      const cgstAmount = (newSubtotal * item.cgstPercent) / 100;
                                      const sgstAmount = (newSubtotal * item.sgstPercent) / 100;
                                      const igstAmount = (newSubtotal * newIgst) / 100;
                                      const newTotal = newSubtotal + cgstAmount + sgstAmount + igstAmount;
                                      
                                      setBillData(prev => {
                                        const newItems = [...prev.items];
                                        newItems[index] = {
                                          ...newItems[index],
                                          igstPercent: newIgst,
                                          total: newTotal
                                        };
                                        const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                        return {
                                          ...prev,
                                          items: newItems,
                                          totalAmount: newTotalAmount
                                        };
                                      });
                                    }}
                                    className="w-16 h-6 text-xs"
                                  />
                                </div>
                                <div className="text-xs">
                                  Subtotal: ₹{item.subtotal?.toFixed(2)} | Total: ₹{item.total.toFixed(2)}
                                </div>
                              </div>
                            </div>
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
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Additional Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Remarks / Note</Label>
                      <Input
                        value={billData.remarks}
                        onChange={(e) =>
                          setBillData((prev) => ({
                            ...prev,
                            remarks: e.target.value,
                          }))
                        }
                        placeholder="Enter remarks"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Summary / Terms</Label>
                      <Input
                        value={billData.summary}
                        onChange={(e) =>
                          setBillData((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                        placeholder="Enter summary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Debit Note Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={billData.debitNoteAmount}
                        onChange={(e) =>
                          setBillData((prev) => ({
                            ...prev,
                            debitNoteAmount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Upload Document</Label>
                      <Input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const response = await authFetch("/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await response.json();
                              setBillData((prev) => ({
                                ...prev,
                                document: data.url || data.filePath,
                              }));
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to upload file",
                              });
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Additional Charges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Shipping Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={billData.shippingCost}
                        onChange={(e) =>
                          setBillData((prev) => ({
                            ...prev,
                            shippingCost: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span>₹{billData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>
                          ₹{(Number(billData.shippingCost) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Grand Total:</span>
                        <span>
                          ₹
                          {(
                            billData.totalAmount +
                            (Number(billData.shippingCost) || 0)
                          ).toFixed(2)}
                        </span>
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
            <Button type="submit" form="purchase-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPurchase ? "Update Purchase Bill" : "Save Purchase Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingPurchase}
        onOpenChange={(open) => !open && setViewingPurchase(null)}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center justify-between">
              <span>Purchase Bill - {viewingPurchase?.billNo}</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  viewingPurchase?.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : viewingPurchase?.status === "due"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {viewingPurchase?.status?.toUpperCase() || "DUE"}
              </span>
            </DialogTitle>
            <DialogDescription>
              Complete purchase bill information and payment details
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6 py-4">
              {/* Bill Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bill Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Bill No:
                        </span>
                        <span className="font-medium">
                          {viewingPurchase?.billNo || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Bill Date:
                        </span>
                        <span>
                          {viewingPurchase?.billDate
                            ? new Date(
                                viewingPurchase.billDate
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Vendor Bill No:
                        </span>
                        <span className="font-medium">
                          {viewingPurchase?.vendorBillNo || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Vendor Bill Date:
                        </span>
                        <span>
                          {viewingPurchase?.vendorBillDate
                            ? new Date(
                                viewingPurchase.vendorBillDate
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Vendor:
                        </span>
                        <span className="font-medium">
                          {viewingPurchase?.vendor?.name ||
                            viewingPurchase?.vendor?.companyName ||
                            "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Project:
                        </span>
                        <span>{viewingPurchase?.project || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Total Items:
                        </span>
                        <span className="font-medium">
                          {viewingPurchase?.items?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Created:
                        </span>
                        <span>
                          {viewingPurchase?.createdAt
                            ? new Date(
                                viewingPurchase.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Updated:
                        </span>
                        <span>
                          {viewingPurchase?.updatedAt
                            ? new Date(
                                viewingPurchase.updatedAt
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Details */}
              {viewingPurchase?.items && viewingPurchase.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Items Details ({viewingPurchase.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-medium">
                              Product
                            </TableHead>
                            <TableHead className="text-xs font-medium text-center">
                              Store
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              Qty
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              Rate
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              Subtotal
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              CGST
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              SGST
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              IGST
                            </TableHead>
                            <TableHead className="text-xs font-medium text-right">
                              Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingPurchase.items.map(
                            (item: any, index: number) => {
                              const cgstAmount =
                                (item.subtotal * (item.cgstPercent || 0)) / 100;
                              const sgstAmount =
                                (item.subtotal * (item.sgstPercent || 0)) / 100;
                              const igstAmount =
                                (item.subtotal * (item.igstPercent || 0)) / 100;
                              return (
                                <TableRow key={index}>
                                  <TableCell className="text-xs">
                                    <div className="font-medium">
                                      {item.productName ||
                                        item.product?.productName ||
                                        "-"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-center">
                                    {item.store?.name ||
                                      item.store?.storeName ||
                                      "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.qty}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    ₹{item.rate?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    ₹{item.subtotal?.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.cgstPercent
                                      ? `${
                                          item.cgstPercent
                                        }% (₹${cgstAmount.toFixed(2)})`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.sgstPercent
                                      ? `${
                                          item.sgstPercent
                                        }% (₹${sgstAmount.toFixed(2)})`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {item.igstPercent
                                      ? `${
                                          item.igstPercent
                                        }% (₹${igstAmount.toFixed(2)})`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-medium">
                                    ₹{item.total?.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tax Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const totalCGST =
                          viewingPurchase?.items?.reduce(
                            (sum: number, item: any) => {
                              return (
                                sum +
                                (item.subtotal * (item.cgstPercent || 0)) / 100
                              );
                            },
                            0
                          ) || 0;
                        const totalSGST =
                          viewingPurchase?.items?.reduce(
                            (sum: number, item: any) => {
                              return (
                                sum +
                                (item.subtotal * (item.sgstPercent || 0)) / 100
                              );
                            },
                            0
                          ) || 0;
                        const totalIGST =
                          viewingPurchase?.items?.reduce(
                            (sum: number, item: any) => {
                              return (
                                sum +
                                (item.subtotal * (item.igstPercent || 0)) / 100
                              );
                            },
                            0
                          ) || 0;
                        const subtotalAmount =
                          viewingPurchase?.items?.reduce(
                            (sum: number, item: any) =>
                              sum + (item.subtotal || 0),
                            0
                          ) || 0;

                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Subtotal (Before Tax):
                              </span>
                              <span className="font-medium">
                                ₹{subtotalAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Total CGST:
                              </span>
                              <span>₹{totalCGST.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Total SGST:
                              </span>
                              <span>₹{totalSGST.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Total IGST:
                              </span>
                              <span>₹{totalIGST.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-muted-foreground text-sm font-medium">
                                Total Tax:
                              </span>
                              <span className="font-medium">
                                ₹
                                {(totalCGST + totalSGST + totalIGST).toFixed(2)}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Total Amount:
                        </span>
                        <span className="font-medium">
                          ₹{viewingPurchase?.totalAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Shipping Cost:
                        </span>
                        <span>
                          ₹{viewingPurchase?.shippingCost?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Debit Note:
                        </span>
                        <span>
                          ₹
                          {viewingPurchase?.debitNoteAmount?.toFixed(2) ||
                            "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          TDS:
                        </span>
                        <span>
                          ₹{viewingPurchase?.tds?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="font-medium text-base">
                          Grand Total:
                        </span>
                        <span className="font-bold text-lg text-primary">
                          ₹{viewingPurchase?.grandTotal?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information */}
              {(viewingPurchase?.remarks || viewingPurchase?.summaryTerms) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {viewingPurchase?.remarks && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Remarks
                          </Label>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {viewingPurchase.remarks}
                          </p>
                        </div>
                      )}
                      {viewingPurchase?.summaryTerms && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Summary/Terms
                          </Label>
                          <p className="mt-1 text-sm whitespace-pre-wrap">
                            {viewingPurchase.summaryTerms}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {viewingPurchase?.status !== "paid" && (
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams({
                        purchasebill: viewingPurchase?.billNo || "",
                        amount: viewingPurchase?.grandTotal?.toString() || "0",
                        vendorid: viewingPurchase?.vendor?._id || "",
                        vendorname:
                          viewingPurchase?.vendor?.name ||
                          viewingPurchase?.vendor?.companyName ||
                          "",
                        purchaseId: viewingPurchase?._id || "",
                      });
                      window.location.href = `/dashboard/expense?${params.toString()}`;
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Pay
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleEditPurchase(viewingPurchase)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <AlertDialog
                  open={showPrintDialog}
                  onOpenChange={setShowPrintDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPrintId(viewingPurchase?._id || null);
                        setShowPrintDialog(true);
                      }}
                      disabled={printingId === viewingPurchase?._id}
                    >
                      {printingId === viewingPurchase?._id ? (
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
                      <AlertDialogDescription>
                        Select the print format for your invoice.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setShowPrintDialog(false)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (selectedPrintId)
                            handlePrintInvoice(selectedPrintId, "thermal");
                          setShowPrintDialog(false);
                        }}
                        className="bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
                      >
                        Thermal (80mm)
                      </AlertDialogAction>
                      <AlertDialogAction
                        onClick={() => {
                          if (selectedPrintId)
                            handlePrintInvoice(selectedPrintId, "a4");
                          setShowPrintDialog(false);
                        }}
                      >
                        A4 Size
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Button
                variant="secondary"
                onClick={() => setViewingPurchase(null)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkExpenseDialog} onOpenChange={setShowBulkExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Bulk Expense</DialogTitle>
            <DialogDescription>
              Create expense entries for {selectedBills.length} selected purchase bills
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={bulkExpenseData.date}
                  onChange={(e) => setBulkExpenseData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Expense Category</Label>
                <Select key={bulkExpenseData.itemType} value={bulkExpenseData.itemType} onValueChange={(value) => setBulkExpenseData(prev => ({ ...prev, itemType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Expense Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>TDS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bulkExpenseData.tds}
                  onChange={(e) => setBulkExpenseData(prev => ({ ...prev, tds: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={bulkExpenseData.paymentMode} onValueChange={(value) => setBulkExpenseData(prev => ({ ...prev, paymentMode: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Payment Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((mode) => (
                      <SelectItem key={mode._id} value={mode._id}>
                        {mode.payType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Source *</Label>
                <Select value={bulkExpenseData.paymentSource} onValueChange={(value) => setBulkExpenseData(prev => ({ ...prev, paymentSource: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Payment Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentSources.map((source) => (
                      <SelectItem key={source._id} value={source._id}>
                        {source.accountName} ({source.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input
                value={bulkExpenseData.referenceNo}
                onChange={(e) => setBulkExpenseData(prev => ({ ...prev, referenceNo: e.target.value }))}
                placeholder="Reference Number"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={bulkExpenseData.remarks}
                onChange={(e) => setBulkExpenseData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional remarks"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Upload Document {isUploadingFile && '(Uploading...)'}</Label>
              <Input
                type="file"
                disabled={isUploadingFile}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsUploadingFile(true);
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const response = await authFetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      });
                      const data = await response.json();
                      setBulkExpenseData(prev => ({ ...prev, document: data.url }));
                      toast({ title: 'Success', description: 'File uploaded successfully' });
                    } catch (error) {
                      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload file' });
                    } finally {
                      setIsUploadingFile(false);
                    }
                  }
                }}
              />
            </div>
            
            <div className="bg-muted p-4 rounded">
              <div className="text-sm font-medium mb-2">Summary:</div>
              <div className="text-sm space-y-1">
                <div>Selected Bills: {selectedBills.length}</div>
                <div>Total Amount: ₹{purchases.filter(p => selectedBills.includes(p._id)).reduce((sum, p) => sum + (p.grandTotal || 0), 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkExpenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkExpenseSubmit} disabled={isBulkPaying}>
              {isBulkPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Expense Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {isFromExpense ? "Manage Purchase Expense" : "Purchase Bills"}
              </CardTitle>
              <CardDescription>
                {isFromExpense
                  ? "Create a new expense entry"
                  : "Manage purchase bills and invoices."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedBills.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleBulkPrint}
                    disabled={isBulkPrinting}
                  >
                    {isBulkPrinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Printer className="mr-2 h-4 w-4" />
                    Print ({selectedBills.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBulkPay}
                    disabled={isBulkPaying}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    {isBulkPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ({selectedBills.length})
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  resetForm();
                  setIsBillDialogOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Bill
              </Button>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!searchTerm && vendorFilter === 'all' && doctorFilter === 'all' && statusFilter === 'all' && !dateRange && !minAmount && !maxAmount}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {initialVendors.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.companyName || vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48">
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
                className="w-32"
              />
              <Input
                type="number"
                placeholder="Max Amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-32"
              />
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-48">
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
                  <th className="text-left p-3 font-medium border-b w-12">
                    <Checkbox
                      checked={selectedBills.length === purchases.length && purchases.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[120px]">
                    Bill No
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[100px]">
                    Bill Date
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[150px]">
                    Vendor
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[100px]">
                    Items
                  </th>
                  <th className="text-left p-3 font-medium border-b min-w-[120px]">
                    Grand Total
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
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center h-24 p-3">
                      No bills found.
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedBills.includes(purchase._id)}
                          onCheckedChange={(checked) => handleSelectBill(purchase._id, checked as boolean)}
                        />
                      </td>
                      <td
                        className="p-3 truncate max-w-[120px] font-medium"
                        title={purchase.billNo}
                      >
                        {purchase.billNo}
                      </td>
                      <td
                        className="p-3 truncate max-w-[100px]"
                        title={new Date(purchase.billDate).toLocaleDateString()}
                      >
                        {new Date(purchase.billDate).toLocaleDateString()}
                      </td>
                      <td
                        className="p-3 truncate max-w-[150px]"
                        title={`${purchase.vendor?.companyName || 'N/A'} (${purchase.vendor?.name || 'N/A'})`}
                      >
                        <div>
                          <div className="font-medium">{purchase.vendor?.companyName || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">Contact Person: {purchase.vendor?.name || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-3 truncate max-w-[100px]">
                        {purchase.items?.length || 0} items
                      </td>
                      <td className="p-3 truncate max-w-[120px] font-medium">
                        ₹{purchase.grandTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3 truncate max-w-[80px]">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            purchase.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : purchase.status === "due"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {purchase.status || "due"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewPurchase(purchase)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditPurchase(purchase)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={printingId === purchase?._id}
                              title="Print Invoice"
                            >
                              {printingId === purchase?._id ? (
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
                                  handlePrintInvoice(purchase?._id, "thermal")
                                }
                                className="bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
                              >
                                Thermal (80mm)
                              </AlertDialogAction>
                              <AlertDialogAction
                                onClick={() =>
                                  handlePrintInvoice(purchase?._id, "a4")
                                }
                              >
                                A4 Size
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeletePurchase(purchase._id)}
                          disabled={deletingId === purchase._id}
                        >
                          {deletingId === purchase._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {purchases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
              to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems} entries
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
                    if (e.key === "Enter") {
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
